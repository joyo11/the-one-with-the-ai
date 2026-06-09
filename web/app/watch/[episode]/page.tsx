import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterMarker } from "@/components/character-marker";
import { CHARACTERS } from "@/lib/characters";
import { getEpisode } from "@/lib/episodes";

interface PageProps {
  params: { episode: string };
}

export function generateMetadata({ params }: PageProps) {
  const ep = getEpisode(params.episode);
  if (!ep) return { title: "Episode not found" };
  return { title: `${ep.title} — Watch with the cast` };
}

export default function EpisodePage({ params }: PageProps) {
  const ep = getEpisode(params.episode);
  if (!ep) notFound();

  return (
    <main className="min-h-[100dvh] px-5 sm:px-10 lg:px-14 py-12 sm:py-16 bg-[color:var(--bg)]">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/watch"
            className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] hover:text-[color:var(--accent)]"
          >
            ← All episodes
          </Link>
        </div>

        <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-2">
          Season {ep.season} · Episode {ep.number}
        </p>
        <h1 className="font-[family-name:var(--font-marker)] text-4xl sm:text-5xl text-[color:var(--fg)] leading-tight">
          {ep.title}
        </h1>
        <p className="mt-4 text-[15px] text-[color:var(--muted)] max-w-2xl leading-relaxed mb-10">
          {ep.blurb}
        </p>

        <div className="space-y-4">
          {ep.scenes.map((scene, i) => {
            const playable = Boolean(scene.dialogue && scene.dialogue.length > 0);
            const inner = (
              <div className="flex items-start gap-4">
                <span className="font-[family-name:var(--font-marker)] text-[28px] text-[color:var(--accent)] leading-none mt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-[family-name:var(--font-marker)] text-[20px] text-[color:var(--fg)] leading-tight">
                    {scene.title}
                  </h3>
                  {scene.iconic_line && (
                    <p className="mt-1 text-[14px] italic text-[color:var(--muted)]">
                      &ldquo;{scene.iconic_line}&rdquo;
                    </p>
                  )}
                  {playable && (
                    <p className="mt-3 inline-flex items-center gap-2 text-[12px] font-mono uppercase tracking-wider text-[color:var(--accent)]">
                      ▶ play the scene →
                    </p>
                  )}
                </div>
              </div>
            );
            return playable ? (
              <Link
                key={scene.id}
                href={`/watch/${ep.id}/${scene.id}`}
                className="block bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5 hover:border-[color:var(--accent)] transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={scene.id}
                className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
