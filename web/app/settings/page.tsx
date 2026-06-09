import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CHARACTERS } from "@/lib/characters";
import { NotificationsCard } from "./notifications-card";
import { CharacterMutes } from "./character-mutes";
import { QuietHours } from "./quiet-hours";

export const metadata = { title: "Settings" };

interface Profile {
  push_enabled: boolean;
  muted_characters: string[];
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
}

export default async function SettingsPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("push_enabled, muted_characters, quiet_hours_start, quiet_hours_end, timezone")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return (
    <main className="min-h-[100dvh] px-5 sm:px-10 lg:px-14 py-12 sm:py-16 bg-[color:var(--bg)]">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] hover:text-[color:var(--accent)]"
          >
            ← Back to the couch
          </Link>
        </div>

        <h1 className="font-[family-name:var(--font-marker)] text-4xl sm:text-5xl text-[color:var(--fg)] mb-2">
          Settings
        </h1>
        <p className="text-[14px] text-[color:var(--muted)] mb-10">
          Control how the gang reaches you.
        </p>

        <div className="space-y-6">
          <NotificationsCard initiallyEnabled={Boolean(profile?.push_enabled)} />

          <CharacterMutes
            initialMuted={profile?.muted_characters ?? []}
            characters={CHARACTERS.map((c) => c.name)}
          />

          <QuietHours
            initialStart={profile?.quiet_hours_start ?? 23}
            initialEnd={profile?.quiet_hours_end ?? 7}
          />

          <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5">
            <h2 className="font-[family-name:var(--font-marker)] text-xl text-[color:var(--fg)] mb-1">
              Your profile + memories
            </h2>
            <p className="text-[13px] text-[color:var(--muted)] mb-3">
              Tell the gang about yourself, or review/edit what they remember.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/onboarding"
                className="text-[13px] px-3 py-1.5 rounded-md bg-[color:var(--bg)] border border-[color:var(--border)] hover:border-[color:var(--accent)] text-[color:var(--fg)] transition-colors"
              >
                Edit profile
              </Link>
              <Link
                href="/memories"
                className="text-[13px] px-3 py-1.5 rounded-md bg-[color:var(--bg)] border border-[color:var(--border)] hover:border-[color:var(--accent)] text-[color:var(--fg)] transition-colors"
              >
                What they remember
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
