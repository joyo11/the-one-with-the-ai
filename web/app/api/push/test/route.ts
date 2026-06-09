/** /api/push/test — fires one proactive push to the signed-in user, right
 *  now. Useful for development + the "send me a test text" button in
 *  settings. Picks a random unmuted character. Anchors to the user's
 *  memory pipeline so it feels real, not a stub. */

import { type NextRequest } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
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

const ALL_CHARS: Character[] = ["Monica", "Joey", "Ross", "Chandler", "Rachel", "Phoebe"];

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { character?: Character };
  const db = supabaseAdmin();

  const { data: profileRaw } = await db
    .from("profiles")
    .select("muted_characters, push_enabled")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRaw as
    | { muted_characters: string[]; push_enabled: boolean }
    | null;
  if (!profile?.push_enabled) {
    return Response.json({ error: "push not enabled — toggle it on first" }, { status: 400 });
  }
  const muted = new Set(profile?.muted_characters ?? []);
  const candidates = ALL_CHARS.filter((c) => !muted.has(c));
  if (candidates.length === 0) {
    return Response.json({ error: "everyone is muted" }, { status: 400 });
  }
  const character: Character =
    body.character && candidates.includes(body.character)
      ? body.character
      : candidates[Math.floor(Math.random() * candidates.length)];

  const [userProfile, memories, event] = await Promise.all([
    loadProfile(user.id),
    loadMemoriesFor(user.id, character),
    pickTouchEvent(character),
  ]);
  const userContext = renderUserContext(userProfile, memories);
  const worldFraming = event ? renderTouchFraming(event) : "";
  const message = await generateTouchMessage({ character, userContext, worldFraming });
  if (!message) {
    return Response.json({ error: "message generation failed" }, { status: 500 });
  }

  interface SubRow { endpoint: string; p256dh_key: string; auth_key: string }
  const { data: subsRaw } = await db
    .from("push_subscriptions")
    .select("endpoint, p256dh_key, auth_key")
    .eq("user_id", user.id);
  const subs = (subsRaw ?? []) as SubRow[];
  if (subs.length === 0) {
    return Response.json(
      { error: "no push subscriptions — re-enable notifications" },
      { status: 400 },
    );
  }

  // Record the touch
  const { data: touch } = await db
    .from("scheduled_touches")
    .insert({
      user_id: user.id,
      character,
      scheduled_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      message,
    })
    .select("id")
    .single();

  const url = `/chat/${character}?from=push&touch=${touch?.id ?? ""}`;
  const results = await Promise.all(
    subs.map((s) =>
      sendPush(
        s.endpoint,
        { p256dh: s.p256dh_key, auth: s.auth_key },
        { title: character, body: message, url, character },
      ),
    ),
  );
  const delivered = results.filter(Boolean).length;

  return Response.json({
    ok: true,
    character,
    message,
    delivered,
    total_subs: subs.length,
  });
}
