/** /api/lab/rewrite-line — used by the scene player to weave the user's
 *  pause-time intervention into the character's NEXT canonical line.
 *
 *  Input: { character, originalLine, userMessage, sceneDetail }
 *  Output: { line: "<rewritten line>" }
 *
 *  Same character, same intent, but lightly adjusted so the user's
 *  intervention is acknowledged before the canonical substance lands.
 */

import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  character: string;
  originalLine: string;
  userMessage: string;
  sceneDetail?: string;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { character, originalLine, userMessage, sceneDetail } = body;
  if (!character || !originalLine || !userMessage) {
    return Response.json({ error: "missing fields" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "server misconfigured" }, { status: 500 });
  }

  const system = `You are ${character} in a Friends scene. A "7th friend" (the user) just spoke up — they said something to you, and your next scripted line needs to briefly acknowledge what they said before delivering its original substance.

${sceneDetail ? `Scene context: ${sceneDetail}\n` : ""}
RULES:
- Output ONE line, the rewritten version. No quotes around it, no preamble.
- Keep the same rough length and rhythm as the original.
- Stay completely in ${character}'s voice — match the show's tone.
- The user's intervention must be acknowledged ("yeah okay" / "fine, fine" / "Joey, stop—" / "you're right" etc) — briefly — then your original substance follows.
- Do NOT rewrite the scene wholesale or drop the substance of the scripted line. The story must continue.
- If the user said something completely irrelevant to the scene, deflect with a one-word acknowledgment and deliver the original line essentially unchanged.`;

  const userPrompt = `Original scripted line you were about to say:
"${originalLine}"

What the 7th friend just said to you:
"${userMessage}"

Rewrite your line.`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 180,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!resp.ok) {
      return Response.json({ error: `upstream HTTP ${resp.status}` }, { status: 502 });
    }
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const cleaned = text.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!cleaned) {
      return Response.json({ error: "empty response" }, { status: 502 });
    }
    return Response.json({ line: cleaned });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "request failed" },
      { status: 502 },
    );
  }
}
