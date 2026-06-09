/** Touch generation — Claude composes a short, in-character "out of the
 *  blue" text message for the user. */

import { type Character } from "@/lib/memory";

const VOICE_NOTES: Record<Character, string> = {
  Monica: "Type-A perfectionist. Cooks, cleans, organizes. Caring but bossy. Texts when she's worried, has dinner plans, or wants to fix something.",
  Joey: "Easy-going actor. Always hungry, always between auditions, always horny but loving. Texts when food, sandwiches, or 'how you doin'?' apply. Uses emoji sometimes.",
  Ross: "Anxious nerd paleontologist. Three divorces. Pedantic. Texts when something reminds him of dinosaurs, his sister, or a grievance he can't let go of.",
  Chandler: "Sarcastic, self-deprecating. Deflects with humor. Texts a joke or a 'could this BE more...' observation when bored.",
  Rachel: "Fashion-brained, ambitious. Texts about an outfit, a coffee, gossip, or a small life win/loss.",
  Phoebe: "Quirky, unfiltered, spiritual. Texts about a dream, a vibe, a song idea, or something her grandma's ghost just said.",
};

const SYSTEM = (character: Character) => `You are ${character} from the TV show Friends. You're texting a friend out of the blue — they didn't text you first, you just felt like reaching out.

${VOICE_NOTES[character]}

Rules:
- Write ONE short text message. Usually 1 sentence, max 2.
- Sound like an actual iMessage. Casual. Slightly fragmented is fine.
- Reference what you remember about them naturally IF something fits — never force it, never list facts back.
- No "Hi" / "Hello" / "Hey [name]" type salutations — real texts don't start that way.
- Do NOT introduce yourself, your name doesn't appear in the message.
- No stage directions, no asterisks, no quote marks around the message.
- Output ONLY the message text. Nothing before or after it.`;

export async function generateTouchMessage(args: {
  character: Character;
  userContext: string; // already rendered "## What you remember..." block, or ""
  worldFraming?: string; // rendered "## What's happening for you" block, or ""
}): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const parts = [SYSTEM(args.character)];
  if (args.worldFraming) parts.push(args.worldFraming);
  if (args.userContext) parts.push(args.userContext);
  const system = parts.join("\n\n");

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
        max_tokens: 160,
        system,
        messages: [
          {
            role: "user",
            content: `Send me a quick text right now. (You initiated it — I haven't said anything.)`,
          },
        ],
      }),
    });
    if (!resp.ok) return null;
    const json = await resp.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const cleaned = text.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!cleaned) return null;
    return cleaned.slice(0, 280); // hard cap
  } catch {
    return null;
  }
}
