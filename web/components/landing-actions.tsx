import Link from "next/link";
import { CHARACTERS } from "@/lib/characters";
import { CharacterMarker } from "@/components/character-marker";

/** "What you can do here" — three featured surfaces below the picker. */
export function LandingActions() {
  return (
    <section className="bg-bg px-5 sm:px-10 lg:px-14 pb-16 pt-4 sm:pt-8">
      <div className="max-w-[1280px] mx-auto">
        <p className="font-marker text-accent text-[20px] sm:text-[24px] text-center mb-1">
          three more rooms in the apartment
        </p>
        <h2 className="font-marker text-fg text-[34px] sm:text-[44px] text-center leading-tight mb-10">
          What else you can do
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Watch */}
          <Link
            href="/watch"
            className="group bg-surface border border-border rounded-md overflow-hidden hover:border-accent transition-colors flex flex-col"
          >
            <div
              className="aspect-[16/9] relative"
              style={{
                backgroundImage: "url(/sets/perk.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(58,29,12,0.35) 0%, rgba(58,29,12,0.85) 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-end p-5">
                <p className="friends-line text-[11px] tracking-[0.18em] text-white/85 uppercase">
                  WATCH
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="font-marker text-fg text-[22px] leading-tight">
                Watch with the cast
              </p>
              <p className="text-[14px] text-muted mt-2 leading-snug">
                Pick an iconic episode. Tap a scene. Ask whoever's in it about
                what's happening — and they'll know exactly where they are.
              </p>
              <span className="inline-block mt-4 text-[12px] font-mono uppercase tracking-wider text-accent">
                Open the scenes →
              </span>
            </div>
          </Link>

          {/* The Lab */}
          <Link
            href="/lab"
            className="group bg-surface border border-border rounded-md overflow-hidden hover:border-accent transition-colors flex flex-col"
          >
            <div
              className="aspect-[16/9] relative grain"
              style={{
                background:
                  "linear-gradient(135deg, #2D1B3F 0%, #3A1D0C 100%)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                {CHARACTERS.slice(0, 6).map((c) => (
                  <CharacterMarker key={c.name} character={c} size={44} />
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="friends-line text-[11px] tracking-[0.18em] text-white/85 uppercase">
                  THE LAB
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="font-marker text-fg text-[22px] leading-tight">
                The Lab
              </p>
              <p className="text-[14px] text-muted mt-2 leading-snug">
                Hand them something from your life — a text, an outfit, a
                situation. Get a take you can screenshot.
              </p>
              <span className="inline-block mt-4 text-[12px] font-mono uppercase tracking-wider text-accent">
                Try a tool →
              </span>
            </div>
          </Link>

          {/* Guess Who */}
          <Link
            href="/game"
            className="group bg-surface border border-border rounded-md overflow-hidden hover:border-accent transition-colors flex flex-col"
          >
            <div
              className="aspect-[16/9] relative flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #1F2418 0%, #2A1A0F 100%)",
              }}
            >
              <p
                className="font-marker text-white/90 text-[80px] leading-none"
                style={{ textShadow: "3px 4px 0 rgba(0,0,0,.35)" }}
              >
                ?
              </p>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className="friends-line text-[11px] tracking-[0.18em] text-white/85 uppercase">
                  GUESS WHO
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="font-marker text-fg text-[22px] leading-tight">
                Guess Who Said It
              </p>
              <p className="text-[14px] text-muted mt-2 leading-snug">
                Read a real line from the show. Pick who said it. See if our
                fine-tuned classifier guessed the same.
              </p>
              <span className="inline-block mt-4 text-[12px] font-mono uppercase tracking-wider text-accent">
                Play 10 rounds →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
