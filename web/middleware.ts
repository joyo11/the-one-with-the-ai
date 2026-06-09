import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next internals, static files, images, favicon, manifest.
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)",
  ],
};
