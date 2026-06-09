"use client";

import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Props {
  initialStart: number;
  initialEnd: number;
}

function fmt(h: number): string {
  if (h === 0) return "12am";
  if (h < 12) return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

export function QuietHours({ initialStart, initialEnd }: Props) {
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function save(s: number, e: number) {
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }
      const { error: err } = await supabase
        .from("profiles")
        .update({
          quiet_hours_start: s,
          quiet_hours_end: e,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      if (err) setError(err.message);
      setSaving(false);
    });
  }

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5">
      <h2 className="font-[family-name:var(--font-marker)] text-xl text-[color:var(--fg)] mb-1">
        Quiet hours
      </h2>
      <p className="text-[13px] text-[color:var(--muted)] mb-4">
        No texts during this window. (Joey ignores this — he's nocturnal.)
      </p>

      <div className="flex items-center gap-3 text-[14px]">
        <label className="flex items-center gap-2">
          <span className="text-[color:var(--muted)] text-[12px] uppercase tracking-wider font-mono">From</span>
          <select
            value={start}
            onChange={(e) => { const v = Number(e.target.value); setStart(v); save(v, end); }}
            className="bg-[color:var(--bg)] border border-[color:var(--border)] rounded-md px-3 py-1.5 text-[color:var(--fg)] focus:outline-none focus:border-[color:var(--accent)]"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{fmt(h)}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[color:var(--muted)] text-[12px] uppercase tracking-wider font-mono">To</span>
          <select
            value={end}
            onChange={(e) => { const v = Number(e.target.value); setEnd(v); save(start, v); }}
            className="bg-[color:var(--bg)] border border-[color:var(--border)] rounded-md px-3 py-1.5 text-[color:var(--fg)] focus:outline-none focus:border-[color:var(--accent)]"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{fmt(h)}</option>
            ))}
          </select>
        </label>
      </div>
      {saving && <p className="mt-2 text-[11px] text-[color:var(--muted)]">saving…</p>}
      {error && <p className="mt-2 text-[12px] text-[color:var(--error)]">{error}</p>}
    </div>
  );
}
