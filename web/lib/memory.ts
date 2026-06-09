import { supabaseAdmin } from "@/lib/supabase/server";

export type Character =
  | "Monica"
  | "Joey"
  | "Ross"
  | "Chandler"
  | "Rachel"
  | "Phoebe";

export interface Memory {
  id: number;
  fact: string;
  character: Character | "*";
  confidence: number;
  created_at: string;
}

/**
 * Memories a given character can see about a user: their own notes + any
 * shared (character = '*') notes. Most-recent first, capped.
 */
export async function loadMemoriesFor(
  userId: string,
  character: Character,
  limit = 20,
): Promise<Memory[]> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("memories")
    .select("id, fact, character, confidence, created_at")
    .eq("user_id", userId)
    .in("character", [character, "*"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Memory[];
}

export interface ProfileLite {
  display_name: string | null;
  favorite_character: Character | null;
  about: string | null;
}

export async function loadProfile(userId: string): Promise<ProfileLite | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("profiles")
    .select("display_name, favorite_character, about")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileLite) ?? null;
}

/**
 * Render the user-context block injected into a character's system prompt.
 * Kept terse on purpose — long context blocks cause the model to fixate.
 */
export function renderUserContext(
  profile: ProfileLite | null,
  memories: Memory[],
): string {
  if (!profile && memories.length === 0) return "";

  const lines: string[] = ["## What you remember about the person you're talking to"];

  if (profile?.display_name) lines.push(`- Their name is ${profile.display_name}.`);
  if (profile?.about) lines.push(`- About them: ${profile.about}`);
  if (profile?.favorite_character) {
    lines.push(
      `- They told us their favorite of the gang is ${profile.favorite_character}.`,
    );
  }

  for (const m of memories) lines.push(`- ${m.fact}`);

  lines.push(
    "",
    "Reference these naturally when relevant. Do not list them back. Do not invent facts you do not see here.",
  );
  return lines.join("\n");
}

interface ExtractedFact {
  character: Character | "*";
  fact: string;
  confidence: number;
}

/**
 * Side-channel Claude call that extracts durable facts about the user from
 * the most recent exchange. Runs after the streaming chat completes; failures
 * are swallowed (memory is best-effort, never block the user-facing reply).
 */
export async function extractAndStoreMemories(args: {
  userId: string;
  character: Character;
  userMessage: string;
  assistantMessage: string;
}): Promise<number> {
  const { userId, character, userMessage } = args;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 0;

  const systemPrompt = `You extract durable facts a friend would remember about someone from a single message they sent.

Return JSON: {"facts": [{"character": "Joey"|"Monica"|"Ross"|"Chandler"|"Rachel"|"Phoebe"|"*", "fact": "<one short sentence>", "confidence": 0.0-1.0}]}

Rules:
- Only extract things that are clearly true and would still be true next week (name, job, hobby, where they live, what they like/dislike, what's going on in their life).
- Skip pleasantries, opinions about the show, transient mood, anything speculative.
- "*" means every character should know it. Use a specific character only if the fact only matters to that character (e.g. "is also a fan of pizza" → Joey).
- Most messages contain zero durable facts. Return {"facts": []} when in doubt.
- Maximum 3 facts per call.`;

  const userPrompt = `Character being chatted with: ${character}
User's message: ${userMessage}`;

  let extracted: ExtractedFact[] = [];
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!resp.ok) return 0;
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return 0;
    const parsed = JSON.parse(match[0]);
    extracted = Array.isArray(parsed?.facts) ? parsed.facts : [];
  } catch {
    return 0;
  }

  const valid = extracted.filter(
    (f) =>
      typeof f?.fact === "string" &&
      f.fact.length > 0 &&
      f.fact.length < 240 &&
      typeof f?.confidence === "number" &&
      f.confidence >= 0.5,
  );
  if (valid.length === 0) return 0;

  const db = supabaseAdmin();
  const rows = valid.map((f) => ({
    user_id: userId,
    character: f.character ?? "*",
    fact: f.fact,
    confidence: Math.min(1, Math.max(0, f.confidence)),
  }));
  const { error } = await db.from("memories").insert(rows);
  if (error) return 0;
  return rows.length;
}
