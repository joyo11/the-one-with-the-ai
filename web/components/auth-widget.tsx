import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { AuthWidgetClient } from "./auth-widget-client";

/** Top-right corner widget. Server component reads session, hands off to a
 *  small client component for the sign-out action. */
export async function AuthWidget() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="fixed top-4 sm:top-5 right-5 sm:right-10 lg:right-14 z-50">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-[13px] text-white hover:bg-white/20 hover:border-white/40 transition-colors shadow-sm"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.display_name?.trim() || user.email?.split("@")[0] || "you";
  return <AuthWidgetClient name={name} />;
}
