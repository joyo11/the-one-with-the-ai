"use client";

import { useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

interface Row {
  id: number;
  fact: string;
  character: string;
  confidence: number;
  created_at: string;
}

interface Props {
  shared: Row[];
  byCharacter: Record<string, Row[]>;
  characterOrder: string[];
}

export function MemoryList({ shared, byCharacter, characterOrder }: Props) {
  const [sharedRows, setSharedRows] = useState(shared);
  const [charRows, setCharRows] = useState(byCharacter);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function remove(id: number, location: "shared" | string) {
    setPendingId(id);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      const { error } = await supabase.from("memories").delete().eq("id", id);
      if (error) {
        setPendingId(null);
        alert(`Couldn't delete: ${error.message}`);
        return;
      }
      if (location === "shared") {
        setSharedRows((rs) => rs.filter((r) => r.id !== id));
      } else {
        setCharRows((m) => ({
          ...m,
          [location]: m[location].filter((r) => r.id !== id),
        }));
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-8">
      <Section title="Everyone knows">
        {sharedRows.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {sharedRows.map((r) => (
              <FactRow key={r.id} row={r} onDelete={() => remove(r.id, "shared")} pending={pendingId === r.id} />
            ))}
          </ul>
        )}
      </Section>

      {characterOrder.map((c) => (
        <Section key={c} title={`Just ${c}`}>
          {charRows[c].length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-2">
              {charRows[c].map((r) => (
                <FactRow key={r.id} row={r} onDelete={() => remove(r.id, c)} pending={pendingId === r.id} />
              ))}
            </ul>
          )}
        </Section>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-[family-name:var(--font-marker)] text-[20px] text-[color:var(--fg)] mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-[13px] text-[color:var(--muted)] italic pl-1">
      nothing yet
    </p>
  );
}

function FactRow({
  row,
  onDelete,
  pending,
}: {
  row: Row;
  onDelete: () => void;
  pending: boolean;
}) {
  return (
    <li className="flex items-start gap-3 bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md px-4 py-3 group">
      <span className="text-[color:var(--accent)] mt-1 text-[10px]">●</span>
      <span className="flex-1 text-[14px] text-[color:var(--fg)] leading-snug">
        {row.fact}
      </span>
      <button
        type="button"
        onClick={onDelete}
        disabled={pending}
        aria-label={`Forget: ${row.fact}`}
        className="text-[color:var(--muted)] hover:text-[color:var(--error)] disabled:opacity-40 transition-colors text-lg leading-none w-6 h-6 flex items-center justify-center"
      >
        ×
      </button>
    </li>
  );
}
