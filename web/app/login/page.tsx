import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — The One With the AI" };

export default async function LoginPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 py-12 bg-[color:var(--bg)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="friends-line text-[12px] tracking-[0.18em] text-[color:var(--muted)] uppercase mb-3">
            F<span className="d">·</span>R<span className="d">·</span>I
            <span className="d">·</span>E<span className="d">·</span>N
            <span className="d">·</span>D<span className="d">·</span>S
          </p>
          <h1 className="font-[family-name:var(--font-marker)] text-4xl text-[color:var(--fg)]">
            Pull up a chair
          </h1>
          <p className="mt-3 text-[14px] text-[color:var(--muted)]">
            Sign in and the gang will start to remember you.
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-[12px] text-[color:var(--muted)]">
          One-tap with Google. Or use your email — we send a 6-digit code that works in any browser, any device.
        </p>
      </div>
    </main>
  );
}
