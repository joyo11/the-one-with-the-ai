import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  loadProfile,
  loadMemoriesFor,
  renderUserContext,
  extractAndStoreMemories,
  type Character,
} from "@/lib/memory";
import { renderWeekContext } from "@/lib/world";

export const dynamic = "force-dynamic";
// Node runtime — we use the Anthropic API for memory extraction via fetch,
// and the supabase service-role client requires Node libraries.
export const runtime = "nodejs";

const VALID_CHARACTERS: Character[] = [
  "Monica",
  "Joey",
  "Ross",
  "Chandler",
  "Rachel",
  "Phoebe",
];

const HF_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// Timeouts so a slow/hung dependency can never produce an infinite spinner.
const AUTH_TIMEOUT_MS = 4000; // Supabase auth
const CONTEXT_TIMEOUT_MS = 4000; // world + memory loads (best-effort)
const HF_HEADERS_TIMEOUT_MS = 45000; // time for HF to send response headers (covers a cold start)
const HF_STALL_TIMEOUT_MS = 30000; // max gap between streamed chunks

/** Resolve `p`, but if it takes longer than `ms`, resolve `fallback` instead. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

interface IncomingBody {
  character: Character;
  messages: { role: "user" | "assistant"; content: string }[];
  scene_context?: string | null;
}

export async function POST(req: NextRequest) {
  let body: IncomingBody;
  try {
    body = (await req.json()) as IncomingBody;
  } catch {
    return Response.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (!body?.character || !VALID_CHARACTERS.includes(body.character)) {
    return Response.json({ error: "invalid character" }, { status: 400 });
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }
  if (!HF_URL) {
    return Response.json({ error: "backend not configured" }, { status: 500 });
  }

  // Who's chatting? Anonymous is allowed. A slow auth call must never block
  // chat, so cap it and fall back to anonymous on timeout.
  const supabase = supabaseServer();
  const authRes = await withTimeout(
    supabase.auth.getUser(),
    AUTH_TIMEOUT_MS,
    { data: { user: null } } as Awaited<ReturnType<typeof supabase.auth.getUser>>,
  );
  const user = authRes.data.user;

  let userContext = "";
  // World context is global, not user-scoped — load it for everyone.
  // Best-effort: a hang or error here yields empty context, never a stuck chat.
  const weekContext = await withTimeout(
    renderWeekContext(body.character),
    CONTEXT_TIMEOUT_MS,
    "",
  );

  if (user) {
    // Best-effort + time-bounded; memory failures must never block chat.
    const ctx = await withTimeout(
      Promise.all([
        loadProfile(user.id),
        loadMemoriesFor(user.id, body.character),
      ]).then(([profile, memories]) => renderUserContext(profile, memories)),
      CONTEXT_TIMEOUT_MS,
      "",
    );
    userContext = ctx;
  }

  // Scene context (Pillar 5) — when the user came from a /watch scene, we
  // anchor the model in that moment.
  const sceneContext = body.scene_context?.trim() ?? "";
  const sceneBlock = sceneContext
    ? `## You are right now in this scene\n${sceneContext}\n\nStay grounded in this exact moment. If the user asks about it, you are in it RIGHT NOW.`
    : "";

  // Compose the final block sent as user_context — chat backend just appends
  // it; we combine our three layers (scene > world > user) here.
  const combinedContext = [sceneBlock, weekContext, userContext]
    .filter(Boolean)
    .join("\n\n");

  // Proxy to HF /chat with the same shape + user_context.
  // The free-tier Space occasionally returns 5xx when Anthropic hiccups —
  // retry once with a short backoff before giving up.
  const upstreamBody = JSON.stringify({
    character: body.character,
    messages: body.messages,
    user_context: combinedContext || null,
  });

  let upstream: Response | null = null;
  const backoffMs = [350, 900, 1800];
  for (let attempt = 0; attempt < 3; attempt++) {
    // Bound the wait for response headers (covers an HF cold start). Once
    // headers arrive we clear the timer so streaming a long reply is never cut.
    const ctrl = new AbortController();
    const headersTimer = setTimeout(() => ctrl.abort(), HF_HEADERS_TIMEOUT_MS);
    try {
      upstream = await fetch(`${HF_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: upstreamBody,
        signal: ctrl.signal,
      });
    } catch {
      upstream = null; // aborted (timeout) or network error — treat as retryable
    } finally {
      clearTimeout(headersTimer);
    }
    if (upstream && upstream.ok && upstream.body) break;
    if (upstream && upstream.status < 500) break; // 4xx — our bug, not transient
    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, backoffMs[attempt]));
    }
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    return Response.json(
      { error: `Anthropic or backend is overloaded. Try again in a moment.` },
      { status: 502 },
    );
  }

  // The last user message is what we'll mine for new memories.
  const lastUser = [...body.messages]
    .reverse()
    .find((m) => m.role === "user")?.content;

  // Pass through the upstream SSE stream verbatim, accumulating assistant text
  // so we can fire the memory-extraction side channel after the stream ends.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      let buf = "";
      try {
        while (true) {
          // If the upstream stalls mid-stream, don't hang the client forever.
          const { value, done } = await Promise.race([
            reader.read(),
            new Promise<ReadableStreamReadResult<Uint8Array>>((_, reject) =>
              setTimeout(
                () => reject(new Error("upstream stalled")),
                HF_STALL_TIMEOUT_MS,
              ),
            ),
          ]);
          if (done) break;
          controller.enqueue(value);
          buf += decoder.decode(value, { stream: true });
          const events = buf.split("\n\n");
          buf = events.pop() ?? "";
          for (const evt of events) {
            const line = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            try {
              const obj = JSON.parse(line.slice(5).trim());
              if (typeof obj?.delta === "string") assistant += obj.delta;
            } catch {
              // ignore malformed event
            }
          }
        }
      } catch {
        // Surface a clean error event (same shape the backend emits) so the UI
        // shows it and stops the spinner, instead of a hard stream abort.
        try {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: "The chat stalled. Please try again." })}\n\n`,
            ),
          );
        } catch {
          /* controller may already be closed */
        }
        controller.close();
        return;
      }
      controller.close();

      // After streaming completes, mine memory off the user message.
      // Best-effort, never blocks. Only when signed in + we have content.
      if (user && lastUser && assistant) {
        extractAndStoreMemories({
          userId: user.id,
          character: body.character,
          userMessage: lastUser,
          assistantMessage: assistant,
        }).catch(() => {
          /* swallow — memory is best-effort */
        });
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
