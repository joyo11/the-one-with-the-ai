import Link from "next/link";
import { EPISODES } from "@/lib/episodes";

export const metadata = {
  title: "Watch with the cast — The One With the AI",
  description: "Pick an iconic episode. Ask the cast about any scene as you go.",
};

export default function WatchPage() {
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
            Watch with the cast
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-[color:var(--muted)] max-w-xl mx-auto leading-relaxed">
            Pick a famous episode. Tap a scene. Chat with whoever's in it about
            what's happening — and they'll know exactly where they are.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EPISODES.map((ep) => (
            <Link
              key={ep.id}
              href={`/watch/${ep.id}`}
              className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5 hover:border-[color:var(--accent)] transition-colors flex flex-col gap-3 group"
            >
              <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)]">
                S{ep.season} · E{ep.number}
              </p>
              <p className="font-[family-name:var(--font-marker)] text-[20px] text-[color:var(--fg)] leading-tight">
                {ep.title}
              </p>
              <p className="text-[13px] text-[color:var(--muted)] leading-snug flex-1">
                {ep.blurb}
              </p>
              <span className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--accent)] mt-auto">
                {ep.scenes.length} scenes →
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center mt-12 text-[12px] text-[color:var(--muted)]">
          More episodes coming. These are the ones we curated with the most quotable scenes.
        </p>
      </div>
    </main>
  );
}
