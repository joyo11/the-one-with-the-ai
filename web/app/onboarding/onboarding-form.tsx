"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Props {
  initial: {
    display_name: string;
    favorite_character: string | null;
    about: string;
  };
  characters: string[];
  alreadyOnboarded: boolean;
}

export function OnboardingForm({ initial, characters, alreadyOnboarded }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initial.display_name);
  const [fav, setFav] = useState<string | null>(initial.favorite_character);
  const [about, setAbout] = useState(initial.about);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(opts: { skip?: boolean } = {}) {
    setError(null);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const payload: Record<string, unknown> = {
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (!opts.skip) {
        payload.display_name = name.trim() || null;
        payload.favorite_character = fav;
        payload.about = about.trim() || null;
      }
      const { error: upErr } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);
      if (upErr) {
        setError(upErr.message);
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-6">
      <label className="block">
        <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
          What should they call you?
        </span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Rachel"
          maxLength={40}
          className="w-full bg-[color:var(--bg)] border border-[color:var(--border)] rounded-md px-4 py-3 text-[15px] text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]"
        />
      </label>

      <div>
        <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-2">
          Favorite character (optional)
        </span>
        <div className="flex flex-wrap gap-2">
          {characters.map((c) => {
            const active = fav === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFav(active ? null : c)}
                className={[
                  "px-3 py-1.5 rounded-full text-[13px] border transition-colors",
                  active
                    ? "bg-[color:var(--accent)] text-white border-[color:var(--accent)]"
                    : "bg-[color:var(--bg)] text-[color:var(--fg)] border-[color:var(--border)] hover:border-[color:var(--accent)]",
                ].join(" ")}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
          Anything they should know about you?
        </span>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="I'm a paleontologist learning Spanish. I have a duck."
          maxLength={400}
          rows={3}
          className="w-full bg-[color:var(--bg)] border border-[color:var(--border)] rounded-md px-4 py-3 text-[15px] text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)] resize-none"
        />
        <span className="block mt-1 text-[11px] text-[color:var(--muted)]">
          {about.length}/400
        </span>
      </label>

      {error && <p className="text-[13px] text-[color:var(--error)]">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => save({ skip: true })}
          disabled={isPending}
          className="flex-1 border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--fg)] hover:border-[color:var(--muted)] py-3 rounded-md text-[14px] transition-colors disabled:opacity-60"
        >
          {alreadyOnboarded ? "Cancel" : "Skip for now"}
        </button>
        <button
          type="button"
          onClick={() => save()}
          disabled={isPending}
          className="flex-1 bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 text-white font-medium py-3 rounded-md text-[15px] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Saving…" : "Pull up a chair"}
        </button>
      </div>
    </div>
  );
}
