/** /api/cron/dispatch — hourly cron entrypoint.
 *
 *  Walks all push-enabled users, decides who's due for a touch, picks a
 *  character, generates a message via Claude with the user's memories,
 *  pushes it. Idempotent-ish: respects quiet hours + per-day throttle.
 *
 *  Guarded by CRON_SECRET. Schedule from Supabase pg_cron:
 *    select cron.schedule('touch-dispatch', '17 * * * *',
 *      $$ select net.http_post(
 *           url := 'https://howudoinai.vercel.app/api/cron/dispatch',
 *           headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
 *         ); $$);
 */

import { type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  loadProfile,
  loadMemoriesFor,
  renderUserContext,
  type Character,
} from "@/lib/memory";
import { generateTouchMessage } from "@/lib/touch";
import { pickTouchEvent, renderTouchFraming } from "@/lib/world";
import { sendPush } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const ALL_CHARS: Character[] = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"];

interface ProfileRow {
  id: string;
  muted_characters: string[];
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string | null;
}

interface SubRow {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

/** Joey's nocturnal — he ignores quiet hours by design. */
function isQuietNow(start: number, end: number, character: Character, tz: string): boolean {
  if (character === "Joey") return false;
  try {
    const now = new Date();
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hour12: false,
        timeZone: tz || "UTC",
      }).format(now),
      10,
    );
    if (start === end) return false;
    if (start < end) return hour >= start && hour < end;
    return hour >= start || hour < end; // wraps midnight
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  return handler(req);
}
export async function GET(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const db = supabaseAdmin();

  // All users who have push enabled AND at least one live subscription.
  const { data: profiles } = await db
    .from("profiles")
    .select("id, muted_characters, quiet_hours_start, quiet_hours_end, timezone")
    .eq("push_enabled", true);

  const results: Array<{ user_id: string; status: string; character?: string }> = [];

  for (const p of (profiles ?? []) as ProfileRow[]) {
    // Already touched in the last 22 hours? Skip (≤ 1/day per user).
    const dayAgo = new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString();
    const { data: recentRaw } = await db
      .from("scheduled_touches")
      .select("id, character")
      .eq("user_id", p.id)
      .gte("sent_at", dayAgo)
      .limit(5);
    const recent = (recentRaw ?? []) as Array<{ id: number; character: string }>;

    if (recent.length > 0) {
      results.push({ user_id: p.id, status: "throttled" });
      continue;
    }

    const muted = new Set(p.muted_characters ?? []);
    const recentChars = new Set(recent.map((r) => r.character));
    const candidates = ALL_CHARS.filter(
      (c) => !muted.has(c) && !recentChars.has(c),
    );
    if (candidates.length === 0) {
      results.push({ user_id: p.id, status: "all-muted" });
      continue;
    }

    const character: Character = candidates[Math.floor(Math.random() * candidates.length)];

    if (isQuietNow(p.quiet_hours_start, p.quiet_hours_end, character, p.timezone ?? "UTC")) {
      results.push({ user_id: p.id, status: "quiet-hours", character });
      continue;
    }

    const { data: subs } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh_key, auth_key")
      .eq("user_id", p.id);

    if (!subs || subs.length === 0) {
      results.push({ user_id: p.id, status: "no-subs" });
      continue;
    }

    const [userProfile, memories, event] = await Promise.all([
      loadProfile(p.id),
      loadMemoriesFor(p.id, character),
      pickTouchEvent(character),
    ]);
    const userContext = renderUserContext(userProfile, memories);
    const worldFraming = event ? renderTouchFraming(event) : "";
    const message = await generateTouchMessage({ character, userContext, worldFraming });
    if (!message) {
      results.push({ user_id: p.id, status: "gen-failed", character });
      continue;
    }

    const { data: touch } = await db
      .from("scheduled_touches")
      .insert({
        user_id: p.id,
        character,
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        message,
      })
      .select("id")
      .single();

    const url = `/chat/${character}?from=push&touch=${touch?.id ?? ""}`;
    const delivered = await Promise.all(
      (subs as SubRow[]).map((s) =>
        sendPush(
          s.endpoint,
          { p256dh: s.p256dh_key, auth: s.auth_key },
          { title: character, body: message, url, character },
        ),
      ),
    );
    const ok = delivered.filter(Boolean).length;

    results.push({
      user_id: p.id,
      status: ok > 0 ? "sent" : "push-failed",
      character,
    });
  }

  return Response.json({
    ran_at: new Date().toISOString(),
    handled: results.length,
    results,
  });
}
