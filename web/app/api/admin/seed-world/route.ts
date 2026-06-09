/** /api/admin/seed-world — seed the events table with ~4 weeks of upcoming
 *  events. Idempotent. Guarded by CRON_SECRET. */

import { type NextRequest } from "next/server";
import { seedWorld } from "@/lib/world-seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }
  const url = new URL(req.url);
  const days = Math.min(60, Math.max(1, Number(url.searchParams.get("days") ?? 28)));
  const result = await seedWorld(days);
  return Response.json({ ok: true, days, ...result });
}
