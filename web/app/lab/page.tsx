import Link from "next/link";
import { LAB_TEMPLATES } from "@/lib/lab-templates";
import { CharacterMarker } from "@/components/character-marker";
import { CHARACTERS } from "@/lib/characters";

export const metadata = {
  title: "The Lab — The One With the AI",
  description: "Paste anything from your life. Get an in-character take.",
};

export default function LabPage() {
  return (
    <main className="min-h-[100dvh] px-5 sm:px-10 lg:px-14 py-12 sm:py-16 bg-[color:var(--bg)]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] hover:text-[color:var(--accent)]"
          >
            ← Back to the couch
          </Link>
        </div>

        <div className="text-center mb-12">
          <p className="friends-line text-[12px] tracking-[0.18em] text-[color:var(--muted)] uppercase mb-3">
            F<span className="d">·</span>R<span className="d">·</span>I
            <span className="d">·</span>E<span className="d">·</span>N
            <span className="d">·</span>D<span className="d">·</span>S
          </p>
          <h1 className="font-[family-name:var(--font-marker)] text-5xl sm:text-6xl text-[color:var(--fg)]">
            The Lab
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-[color:var(--muted)] max-w-md mx-auto leading-relaxed">
            Hand them something from your life — a text, an outfit, a situation — get their take.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LAB_TEMPLATES.map((t) => {
            const char = CHARACTERS.find((c) => c.name === t.character)!;
            return (
              <Link
                key={t.id}
                href={`/lab/${t.id}`}
                className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5 hover:border-[color:var(--accent)] transition-colors flex flex-col gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <CharacterMarker character={char} size={44} />
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)]">
                      {t.character}
                    </p>
                    <p className="font-[family-name:var(--font-marker)] text-[18px] text-[color:var(--fg)] leading-tight">
                      {t.title}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] text-[color:var(--muted)] leading-snug flex-1">
                  {t.blurb}
                </p>
                <span className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--accent)] mt-auto">
                  Try it →
                </span>
              </Link>
            );
          })}
        </div>

        <p className="text-center mt-12 text-[12px] text-[color:var(--muted)]">
          Anything you paste stays on your device. Nothing is shared until you choose to.
        </p>
      </div>
    </main>
  );
}
