import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { OnboardingForm } from "./onboarding-form";
import { CHARACTERS } from "@/lib/characters";

export const metadata = { title: "Meet the gang — The One With the AI" };

export default async function OnboardingPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, favorite_character, about, onboarded_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-6 py-12 bg-[color:var(--bg)]">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="friends-line text-[12px] tracking-[0.18em] text-[color:var(--muted)] uppercase mb-3">
            F<span className="d">·</span>R<span className="d">·</span>I
            <span className="d">·</span>E<span className="d">·</span>N
            <span className="d">·</span>D<span className="d">·</span>S
          </p>
          <h1 className="font-[family-name:var(--font-marker)] text-4xl text-[color:var(--fg)]">
            Tell the gang about you
          </h1>
          <p className="mt-3 text-[14px] text-[color:var(--muted)] max-w-sm mx-auto">
            Three quick things so they remember you. None of this is required —
            skip what you want.
          </p>
        </div>
        <OnboardingForm
          initial={{
            display_name: profile?.display_name ?? "",
            favorite_character: profile?.favorite_character ?? null,
            about: profile?.about ?? "",
          }}
          characters={CHARACTERS.map((c) => c.name)}
          alreadyOnboarded={Boolean(profile?.onboarded_at)}
        />
      </div>
    </main>
  );
}
