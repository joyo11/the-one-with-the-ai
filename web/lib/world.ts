/** Living World — query upcoming/recent events to ground touches and chat. */

import { supabaseAdmin } from "@/lib/supabase/server";
import { type Character } from "@/lib/memory";

export interface WorldEvent {
  id: number;
  characters: string[];
  kind: string;
  title: string;
  detail: string | null;
  start_at: string;
  duration_minutes: number;
  status: "upcoming" | "happening" | "done" | "cancelled";
}

/** Events involving the given character within a window around now.
 *  Default window: 36h back → 36h forward. Used by both touch generation
 *  (pick what to text about) and chat grounding (what's on their mind). */
export async function eventsForCharacter(
  character: Character,
  windowHours = 36,
): Promise<WorldEvent[]> {
  const db = supabaseAdmin();
  const now = new Date();
  const back = new Date(now.getTime() - windowHours * 3600_000).toISOString();
  const fwd = new Date(now.getTime() + windowHours * 3600_000).toISOString();

  const { data, error } = await db
    .from("events")
    .select("*")
    .contains("characters", [character])
    .gte("start_at", back)
    .lte("start_at", fwd)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true });

  if (error) return [];
  return (data ?? []) as WorldEvent[];
}

/** All events involving the character in the next 7 days, for the chat
 *  system prompt's "This week in the apartment" block. */
export async function upcomingWeekFor(character: Character): Promise<WorldEvent[]> {
  const db = supabaseAdmin();
  const now = new Date().toISOString();
  const weekOut = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();

  const { data } = await db
    .from("events")
    .select("*")
    .contains("characters", [character])
    .gte("start_at", now)
    .lte("start_at", weekOut)
    .neq("status", "cancelled")
    .order("start_at", { ascending: true })
    .limit(8);

  return ((data ?? []) as WorldEvent[]);
}

/** Pick the most "touch-worthy" event for the character right now, if any.
 *  Priority: happening-right-now > soon-upcoming > just-finished.
 *  Returns null if nothing in the window — caller falls back to vibes mode. */
export async function pickTouchEvent(character: Character): Promise<WorldEvent | null> {
  const events = await eventsForCharacter(character, 24);
  if (events.length === 0) return null;

  const now = Date.now();
  let best: { event: WorldEvent; score: number } | null = null;
  for (const ev of events) {
    const t = new Date(ev.start_at).getTime();
    const minsFromNow = (t - now) / 60_000;
    const minsAfterEnd = -(minsFromNow + ev.duration_minutes);

    let score = 0;
    if (minsFromNow >= -ev.duration_minutes && minsFromNow <= 0) {
      // Happening right now — highest signal.
      score = 100;
    } else if (minsFromNow > 0 && minsFromNow < 12 * 60) {
      // Upcoming within 12h — nerves, anticipation.
      score = 80 - minsFromNow / 60;
    } else if (minsAfterEnd >= 0 && minsAfterEnd < 6 * 60) {
      // Recently finished — debrief.
      score = 60 - minsAfterEnd / 60;
    } else {
      continue;
    }
    if (!best || score > best.score) best = { event: ev, score };
  }
  return best?.event ?? null;
}

/** Render an event into a short line for the chat's "this week" context. */
export function renderEventLine(ev: WorldEvent): string {
  const when = new Date(ev.start_at);
  const dayName = when.toLocaleDateString("en-US", { weekday: "short" });
  const time = when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `- ${dayName} ${time}: ${ev.title}${ev.detail ? ` (${ev.detail})` : ""}`;
}

/** Build the "## This week in the apartment" block injected into the chat
 *  system prompt. Empty string if there's nothing on the calendar. */
export async function renderWeekContext(character: Character): Promise<string> {
  const upcoming = await upcomingWeekFor(character);
  if (upcoming.length === 0) return "";
  const lines = upcoming.map(renderEventLine).join("\n");
  return `## This week in the apartment\n${lines}\n\nReference these naturally if relevant. Do not list them back. The user does not see this list.`;
}

/** For a touch-worthy event: build the framing block the touch generator
 *  injects so Claude knows what to text about. */
export function renderTouchFraming(ev: WorldEvent): string {
  const now = Date.now();
  const t = new Date(ev.start_at).getTime();
  const minsFromNow = (t - now) / 60_000;

  let when: string;
  if (minsFromNow >= -ev.duration_minutes && minsFromNow <= 0) {
    when = `RIGHT NOW (started ${Math.round(-minsFromNow)} minutes ago)`;
  } else if (minsFromNow > 0) {
    const hrs = Math.round(minsFromNow / 60);
    when = hrs <= 1 ? "in less than an hour" : `in about ${hrs} hours`;
  } else {
    const hrs = Math.round((-minsFromNow - ev.duration_minutes) / 60);
    when = hrs <= 1 ? "less than an hour ago" : `about ${hrs} hours ago`;
  }

  return `## What's happening for you right now
You are texting the user about THIS event from your life:
- Title: ${ev.title}
- Type: ${ev.kind}
- When: ${when}
${ev.detail ? `- Detail: ${ev.detail}\n` : ""}
Frame your text around this event — nervous before, in the middle of it, debrief after, asking advice, sharing what just happened. Stay grounded in this specific situation, in character.`;
}
