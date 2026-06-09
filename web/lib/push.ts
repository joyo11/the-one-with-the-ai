/** Shared helpers around Web Push: VAPID setup + subscription save / wipe.
 *  Server-side only. */

import { supabaseAdmin } from "@/lib/supabase/server";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:noreply@howudoinai.vercel.app";

let _webpush: typeof import("web-push") | null = null;
function getWebPush() {
  if (_webpush) return _webpush;
  // Lazy-require so the route bundle doesn't pull in web-push when not needed.
  _webpush = require("web-push") as typeof import("web-push");
  if (VAPID_PUBLIC && VAPID_PRIVATE) {
    _webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  }
  return _webpush;
}

export interface SubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export async function saveSubscription(userId: string, sub: SubscriptionInput) {
  const db = supabaseAdmin();
  await db
    .from("push_subscriptions")
    .upsert(
      {
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh_key: sub.keys.p256dh,
        auth_key: sub.keys.auth,
        user_agent: sub.userAgent ?? null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );
  await db
    .from("profiles")
    .update({ push_enabled: true, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function removeSubscription(endpoint: string) {
  const db = supabaseAdmin();
  await db.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  character?: string;
}

/** Send a push notification. Returns true on 2xx, false on any failure.
 *  Cleans up subscriptions the push service has invalidated (404/410). */
export async function sendPush(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  payload: PushPayload,
): Promise<boolean> {
  const wp = getWebPush();
  try {
    await wp.sendNotification(
      { endpoint, keys },
      JSON.stringify(payload),
      { TTL: 24 * 60 * 60 },
    );
    return true;
  } catch (err: unknown) {
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (statusCode === 404 || statusCode === 410) {
      // Subscription is dead — wipe it so the dispatcher doesn't retry.
      await removeSubscription(endpoint).catch(() => {});
    }
    return false;
  }
}
