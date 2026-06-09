"use client";

import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Props {
  initialMuted: string[];
  characters: string[];
}

export function CharacterMutes({ initialMuted, characters }: Props) {
  const [muted, setMuted] = useState<Set<string>>(new Set(initialMuted));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(c: string) {
    const next = new Set(muted);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setMuted(next);
    save(next);
  }

  function save(next: Set<string>) {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("not signed in");
        setSaving(false);
        return;
      }
      const { error: e } = await supabase
        .from("profiles")
        .update({ muted_characters: Array.from(next), updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (e) setError(e.message);
      setSaving(false);
    });
  }

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5">
      <h2 className="font-[family-name:var(--font-marker)] text-xl text-[color:var(--fg)] mb-1">
        Mute someone
      </h2>
      <p className="text-[13px] text-[color:var(--muted)] mb-3">
        Tap to mute. Muted characters won't text you (but you can still chat
        with them from the picker).
      </p>
      <div className="flex flex-wrap gap-2">
        {characters.map((c) => {
          const isMuted = muted.has(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              className={[
                "px-3 py-1.5 rounded-full text-[13px] border transition-colors",
                isMuted
                  ? "bg-[color:var(--bg)] text-[color:var(--muted)] border-[color:var(--border)] line-through"
                  : "bg-[color:var(--accent)] text-white border-[color:var(--accent)]",
              ].join(" ")}
            >
              {c}
            </button>
          );
        })}
      </div>
      {saving && <p className="mt-2 text-[11px] text-[color:var(--muted)]">saving…</p>}
      {error && <p className="mt-2 text-[12px] text-[color:var(--error)]">{error}</p>}
    </div>
  );
}
