"use client";

import Link from "next/link";
import { LOCATIONS, type LocationId } from "@/lib/locations";
import type { Episode, Scene } from "@/lib/episodes";

interface Props {
  episode: Episode;
  scene: Scene;
  locationId: LocationId;
}

/** Cinematic header for chats arrived-at from a /watch scene. Sets the
 *  visual stage so the user feels they've stepped INTO the moment, not
 *  just opened a regular chat with a small banner on top. */
export function SceneHero({ episode, scene, locationId }: Props) {
  const loc = LOCATIONS[locationId];

  return (
    <div className="relative w-full overflow-hidden animate-msg-in"
      style={{ minHeight: 240 }}
    >
      {/* hero photo */}
      {loc.image && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${loc.image})` }}
          aria-hidden
        />
      )}
      {/* darkening + tinted overlay */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background: `linear-gradient(180deg, ${loc.gradient.from}cc 0%, ${
            loc.gradient.via ?? loc.gradient.from
          }d0 55%, ${loc.gradient.to}f0 100%)`,
        }}
      />
      {/* signature pendant glow */}
      <div
        aria-hidden
        className="absolute"
        style={{
          right: "10%",
          top: "-60px",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${loc.accent}30 0%, transparent 70%)`,
          filter: "blur(28px)",
        }}
      />
      {/* paper grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 px-5 sm:px-8 lg:px-10 py-7 sm:py-9">
        <Link
          href={`/watch/${episode.id}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-white/70 hover:text-white transition-colors"
        >
          ← back to scenes
        </Link>

        <p className="friends-line text-[11px] sm:text-[12px] tracking-[0.22em] text-white/65 uppercase mt-5">
          S{episode.season}<span className="d">·</span>E{episode.number}
          <span className="ml-3 text-white/45">{episode.title}</span>
        </p>

        <h2 className="font-[family-name:var(--font-marker)] text-white text-[26px] sm:text-[32px] lg:text-[38px] leading-tight mt-2 max-w-3xl"
          style={{ textShadow: "2px 3px 0 rgba(0,0,0,.35)" }}
        >
          {scene.title}
        </h2>

        {scene.iconic_line && (
          <p className="mt-4 text-white/85 text-[15px] sm:text-[16px] italic max-w-2xl border-l-2 pl-3"
            style={{ borderColor: loc.accent }}
          >
            &ldquo;{scene.iconic_line}&rdquo;
          </p>
        )}

        <p className="mt-5 text-[12px] text-white/60 font-mono uppercase tracking-wider">
          you just stepped in. ask away.
        </p>
      </div>
    </div>
  );
}
