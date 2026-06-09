import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { CHARACTERS } from "@/lib/characters";
import { MemoryList } from "./memory-list";

export const metadata = { title: "What the gang remembers" };

interface Row {
  id: number;
  fact: string;
  character: string;
  confidence: number;
  created_at: string;
}

export default async function MemoriesPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes this to the current user automatically.
  const { data: rows } = await supabase
    .from("memories")
    .select("id, fact, character, confidence, created_at")
    .order("created_at", { ascending: false });

  const all: Row[] = (rows ?? []) as Row[];
  const shared = all.filter((r) => r.character === "*");
  const byChar: Record<string, Row[]> = {};
  for (const c of CHARACTERS) byChar[c.name] = [];
  for (const r of all) {
    if (r.character !== "*" && byChar[r.character]) byChar[r.character].push(r);
  }

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

        <h1 className="font-[family-name:var(--font-marker)] text-4xl sm:text-5xl text-[color:var(--fg)] mb-3">
          What the gang remembers
        </h1>
        <p className="text-[14px] text-[color:var(--muted)] max-w-md mb-10">
          Anything wrong? Tap the × to make them forget. They'll learn new
          things as you talk — this is just what they have so far.
        </p>

        <MemoryList
          shared={shared}
          byCharacter={byChar}
          characterOrder={CHARACTERS.map((c) => c.name)}
        />
      </div>
    </main>
  );
}
