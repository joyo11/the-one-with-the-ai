import type { CharacterName } from "./characters";

// /chat now goes through our Next.js proxy (which injects user memory and
// then forwards to the HF backend). /watch and /game/round are still public
// and called directly against HF.
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";
const CHAT_URL = "/api/chat";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WatchOption {
  service: string;
  url: string;
  type: "stream" | "rent" | "buy" | string;
}

export interface GameRound {
  line: string;
  answer: CharacterName;
  classifier_pred: CharacterName;
  classifier_confidence: number;
  options: CharacterName[];
}

/**
 * Stream a chat reply. Yields each text delta as it arrives.
 * Caller is responsible for accumulating + handling completion / errors.
 *
 * `sceneContext` lets the caller anchor the chat in a specific episode scene
 * (see Pillar 5 / watch flow). It's appended to the character's system prompt
 * server-side, so the model knows where in the show they are.
 */
export async function* streamChat(
  character: CharacterName,
  messages: ChatMessage[],
  options?: { signal?: AbortSignal; sceneContext?: string },
): AsyncGenerator<{ delta?: string; error?: string; done?: boolean }> {
  // Client-side safety net: if the proxy doesn't even send response headers
  // within 50s, abort so the caller's catch fires instead of spinning forever.
  // Caller's own signal (if any) is composed in. The timer is cleared the moment
  // headers arrive, so a normally-streaming reply is never cut short.
  const ctrl = new AbortController();
  const headerTimer = setTimeout(() => ctrl.abort(), 50000);
  options?.signal?.addEventListener("abort", () => ctrl.abort(), { once: true });

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        character,
        messages,
        scene_context: options?.sceneContext || null,
      }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(headerTimer);
  }

  if (!resp.ok || !resp.body) {
    // Try to read a friendly error message from the proxy body before
    // falling back to a raw HTTP code.
    let msg = `HTTP ${resp.status}`;
    try {
      const text = await resp.text();
      const parsed = text ? (JSON.parse(text) as { error?: string }) : null;
      if (parsed?.error) msg = parsed.error;
    } catch {
      /* keep msg as the HTTP code */
    }
    yield { error: msg };
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) return;
    buf += decoder.decode(value, { stream: true });

    // SSE: events separated by blank lines; each "data: <json>"
    const lines = buf.split("\n");
    buf = lines.pop() ?? ""; // keep partial last line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const json = trimmed.slice(5).trim();
      if (!json) continue;
      try {
        const obj = JSON.parse(json);
        yield obj;
        if (obj.done) return;
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

export async function fetchWatch(
  character: CharacterName,
): Promise<{ show: string; options: WatchOption[] }> {
  const resp = await fetch(
    `${API_URL}/watch?character=${encodeURIComponent(character)}`,
  );
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export async function fetchGameRound(): Promise<GameRound> {
  const resp = await fetch(`${API_URL}/game/round`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}
