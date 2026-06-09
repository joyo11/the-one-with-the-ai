import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tokenType = url.searchParams.get("type"); // "magiclink" | "email" | "recovery" ...
  const next = url.searchParams.get("next") ?? "/";

  if (!code && !tokenHash) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = supabaseServer();
  let error;
  if (code) {
    // PKCE flow — normal magic link from the login form.
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash) {
    // Admin-generated link (or email confirmation). Type is required.
    ({ error } = await supabase.auth.verifyOtp({
      type: (tokenType ?? "magiclink") as "magiclink" | "email" | "recovery" | "signup",
      token_hash: tokenHash,
    }));
  }
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  // First-time sign-in? Send to onboarding. Otherwise honor `next` or go home.
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.onboarded_at) {
      return NextResponse.redirect(new URL("/onboarding", url.origin));
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
