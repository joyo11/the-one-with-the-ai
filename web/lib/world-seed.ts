/** Seeder — populates events for the next N days with a believable
 *  schedule per character. Used by /api/admin/seed-world. Idempotent: skips
 *  days that already have events for a given character.
 *
 *  All times are interpreted in UTC for now (the seeder is timezone-naive
 *  by design — the gang's "calendar" is global; per-user timezone shifts
 *  happen at display time). */

import { supabaseAdmin } from "@/lib/supabase/server";

type Character = "Monica" | "Joey" | "Ross" | "Chandler" | "Rachel" | "Phoebe";
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

interface Slot {
  kind: string;
  title: string;
  detail?: string;
  characters?: Character[];   // defaults to the owning character
  hour: number;               // 24h
  duration_minutes?: number;
  days?: Weekday[];           // which weekdays this slot can land on
  weight?: number;            // higher = more likely; default 1
}

/** Per-character templates. The seeder picks 1 slot per qualifying day.
 *  Tuned so each character gets ~3-5 events per week. */
const TEMPLATES: Record<Character, Slot[]> = {
  Joey: [
    { kind: "audition", title: "Joey auditions for a soap opera", detail: "they keep killing him off", hour: 14, days: [1, 3, 5], weight: 3 },
    { kind: "audition", title: "Joey auditions for a sci-fi movie", detail: "playing 'Spaceman #2'", hour: 11, days: [2, 4], weight: 2 },
    { kind: "food", title: "Joey's pizza emergency", detail: "they put pineapple on it again", hour: 20, days: [0, 6], weight: 1 },
    { kind: "date", title: "Joey on a date", detail: "an aspiring actress named Tiffany", hour: 19, days: [5, 6], weight: 2 },
    { kind: "errand", title: "Joey loses Hugsy at the laundromat", hour: 16, days: [3], weight: 1 },
  ],
  Monica: [
    { kind: "dinner", title: "Dinner party at Monica's", detail: "place settings have been alphabetized", hour: 19, days: [4, 6], weight: 3, characters: ["Monica", "Ross"] },
    { kind: "cooking", title: "Monica caters a wedding", detail: "the bride keeps changing the menu", hour: 12, days: [6], weight: 2 },
    { kind: "cleaning", title: "Monica reorganizes the linen closet", detail: "again", hour: 10, days: [0, 2], weight: 2 },
    { kind: "work", title: "Monica's restaurant has a food critic in", hour: 21, days: [3], weight: 1 },
    { kind: "crisis", title: "Monica panics about a hair on a plate", hour: 18, days: [1, 5], weight: 1 },
  ],
  Ross: [
    { kind: "work", title: "Ross gives a museum lecture", detail: "on the Mesozoic era", hour: 13, days: [1, 4], weight: 3 },
    { kind: "work", title: "Ross argues with a colleague about dinosaur naming", hour: 15, days: [2, 5], weight: 2 },
    { kind: "personal", title: "Ross has therapy", detail: "still about the divorce", hour: 17, days: [3], weight: 2 },
    { kind: "kid", title: "Ross has Ben for the weekend", hour: 10, days: [6, 0], weight: 2 },
    { kind: "drama", title: "Ross runs into Carol and Susan", hour: 12, days: [4], weight: 1 },
  ],
  Chandler: [
    { kind: "work", title: "Chandler in another meeting about TPS reports", detail: "Statistical Analysis and Data Reconfiguration", hour: 10, days: [1, 2, 3, 4], weight: 3 },
    { kind: "personal", title: "Chandler hides from Janice at the coffee shop", hour: 16, days: [2, 5], weight: 1 },
    { kind: "social", title: "Chandler reluctantly goes to a karaoke night", hour: 21, days: [5], weight: 1 },
    { kind: "errand", title: "Chandler returns the wrong-size socks", hour: 17, days: [6], weight: 1 },
  ],
  Rachel: [
    { kind: "work", title: "Rachel preps for a Ralph Lauren meeting", detail: "the buyer is impossible", hour: 11, days: [1, 3], weight: 3 },
    { kind: "shopping", title: "Rachel hits the sample sale", hour: 18, days: [4, 6], weight: 2 },
    { kind: "social", title: "Rachel has brunch with Phoebe", hour: 11, days: [0], weight: 2, characters: ["Rachel", "Phoebe"] },
    { kind: "drama", title: "Rachel runs into her sister at Barneys", hour: 15, days: [5], weight: 1 },
    { kind: "personal", title: "Rachel re-does her vision board", hour: 21, days: [2], weight: 1 },
  ],
  Phoebe: [
    { kind: "gig", title: "Phoebe's open mic at Central Perk", detail: "premiering a song about her grandma's cat", hour: 19, days: [5], weight: 3 },
    { kind: "gig", title: "Phoebe busks in Washington Square", hour: 14, days: [6, 0], weight: 2 },
    { kind: "spiritual", title: "Phoebe gets a reading from a new psychic", hour: 16, days: [2], weight: 2 },
    { kind: "personal", title: "Phoebe's grandma's ghost has notes", hour: 22, days: [3], weight: 2 },
    { kind: "errand", title: "Phoebe massages a difficult client", hour: 13, days: [1, 4], weight: 2 },
  ],
};

const ALL_CHARS: Character[] = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"];

/** Seed the next `days` days of events. Idempotent — only fills days that
 *  don't already have an event for a given character. Returns count inserted. */
export async function seedWorld(days = 28): Promise<{ inserted: number; skipped: number }> {
  const db = supabaseAdmin();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let inserted = 0;
  let skipped = 0;

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(today.getTime() + offset * 24 * 3600_000);
    const weekday = day.getUTCDay() as Weekday;

    for (const character of ALL_CHARS) {
      // Already have an event for this character on this day? Skip.
      const startOfDay = new Date(day);
      const endOfDay = new Date(day.getTime() + 24 * 3600_000);
      const { data: existing } = await db
        .from("events")
        .select("id")
        .contains("characters", [character])
        .gte("start_at", startOfDay.toISOString())
        .lt("start_at", endOfDay.toISOString())
        .limit(1);
      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }

      const candidates = TEMPLATES[character].filter(
        (s) => !s.days || s.days.includes(weekday),
      );
      if (candidates.length === 0) continue;

      // Weighted pick
      const totalWeight = candidates.reduce((s, c) => s + (c.weight ?? 1), 0);
      let r = Math.random() * totalWeight;
      let chosen = candidates[0];
      for (const c of candidates) {
        r -= c.weight ?? 1;
        if (r <= 0) { chosen = c; break; }
      }

      // 40% chance to actually fire a slot on a given day (sparser feels more real)
      if (Math.random() > 0.5) {
        skipped++;
        continue;
      }

      const startAt = new Date(day);
      startAt.setUTCHours(chosen.hour, Math.floor(Math.random() * 60), 0, 0);

      const characters = chosen.characters ?? [character];
      await db.from("events").insert({
        characters,
        kind: chosen.kind,
        title: chosen.title,
        detail: chosen.detail ?? null,
        start_at: startAt.toISOString(),
        duration_minutes: chosen.duration_minutes ?? 60,
        status: "upcoming",
      });
      inserted++;
    }
  }

  return { inserted, skipped };
}
