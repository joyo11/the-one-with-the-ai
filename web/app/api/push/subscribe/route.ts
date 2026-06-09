import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { saveSubscription, removeSubscription } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string }; userAgent?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return Response.json({ error: "missing subscription fields" }, { status: 400 });
  }

  try {
    await saveSubscription(user.id, {
      endpoint: body.endpoint,
      keys: { p256dh: body.keys.p256dh, auth: body.keys.auth },
      userAgent: body.userAgent,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "save failed" },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "not signed in" }, { status: 401 });

  const { endpoint } = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (!endpoint) return Response.json({ error: "endpoint required" }, { status: 400 });

  try {
    await removeSubscription(endpoint);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "delete failed" },
      { status: 500 },
    );
  }
  return Response.json({ ok: true });
}
