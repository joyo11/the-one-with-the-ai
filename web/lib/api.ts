import type { CharacterName } from "./characters";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

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
 */
export async function* streamChat(
  character: CharacterName,
  messages: ChatMessage[],
  signal?: AbortSignal,
): AsyncGenerator<{ delta?: string; error?: string; done?: boolean }> {
  const resp = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ character, messages }),
    signal,
  });

  if (!resp.ok || !resp.body) {
    yield { error: `HTTP ${resp.status}` };
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
