"use client";

import Link from "next/link";
import { CouchIcon, CouchLux, Bean } from "@/components/svgs";

const DOT_HUES = ["#F87171", "#60A5FA", "#FBBF24"];

function FriendsLine({ className }: { className?: string }) {
  const L = "FRIENDS".split("");
  let di = 0;
  return (
    <span className={`friends-line ${className ?? ""}`}>
      {L.map((c, i) => (
        <span key={i} className="contents">
          <span>{c}</span>
          {i < L.length - 1 ? (
            <span className="d" style={{ color: DOT_HUES[di++ % 3] }}>
              •
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/**
 * Section 01 — Cinematic Central Perk landing hero.
 * Responsive: stacked + shrunk on mobile, side-by-side on desktop.
 */
export function LandingHero() {
  return (
    <section className="hero-cp w-full">
      <div className="relative mx-auto min-h-[560px] md:min-h-[720px] lg:min-h-[880px] max-w-[1440px]">
        <div className="hero-glow" />
        <div className="bokeh hidden md:block" style={{ width: 160, height: 160, left: "62%", top: "8%", background: "#fb923c", opacity: 0.5 }} />
        <div className="bokeh hidden md:block" style={{ width: 90, height: 90, left: "80%", top: "22%", background: "#fdba74", opacity: 0.45 }} />
        <div className="bokeh" style={{ width: 120, height: 120, left: "18%", top: "6%", background: "#ea580c", opacity: 0.35 }} />
        <div className="hero-grain" />

        {/* slim site nav */}
        <div className="absolute top-0 inset-x-0 flex items-center gap-4 sm:gap-8 px-5 sm:px-10 lg:px-14 py-4 sm:py-6 z-20">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
            <CouchIcon className="w-8 sm:w-10 lg:w-[42px]" style={{ color: "#EA580C" }} />
            <span className="font-marker text-[14px] sm:text-[16px] lg:text-[18px] text-white leading-none">
              the one with the AI
            </span>
          </Link>
          <nav className="ml-auto hidden md:flex items-center gap-5 lg:gap-7 font-sans font-semibold text-[13px] lg:text-[14px] text-white/85 mr-[170px] lg:mr-[180px]">
            <a href="#picker" className="hover:text-white transition-colors">Chat</a>
            <Link href="/watch" className="hover:text-white transition-colors">Watch</Link>
            <Link href="/lab" className="hover:text-white transition-colors">The Lab</Link>
            <Link href="/game" className="hover:text-white transition-colors">Guess Who</Link>
          </nav>
          <Link
            href="/game"
            className="md:hidden ml-auto font-marker text-white bg-accent rounded-full px-3.5 py-1.5 text-[12px] mr-[52px]"
          >
            Play
          </Link>
        </div>

        {/* couch centerpiece — pinned to the visual bottom edge of the hero */}
        <CouchLux
          className="hidden md:block absolute bottom-[-26px] left-1/2 z-[5] w-[520px] lg:w-[700px]"
          style={{ transform: "translateX(-50%)", filter: "drop-shadow(0 30px 40px rgba(0,0,0,.5))" }}
        />
        <CouchLux
          className="md:hidden absolute bottom-[-14px] left-1/2 z-[5] w-[360px]"
          style={{ transform: "translateX(-50%)", filter: "drop-shadow(0 18px 22px rgba(0,0,0,.5))" }}
        />

        {/* steam — desktop only */}
        <svg
          className="steam hidden md:block absolute z-[6]"
          style={{ bottom: 150, left: "46%", width: 120, height: 150 }}
          viewBox="0 0 120 150"
          strokeWidth={5}
        >
          <path d="M40 150 C20 120 60 110 40 80 C24 56 56 44 42 14" />
          <path d="M82 150 C62 122 98 112 80 84 C64 60 96 50 82 22" />
        </svg>

        {/* bean doodles — desktop only */}
        <Bean className="doodle hidden md:block absolute z-[6]" style={{ bottom: 40, left: 48, width: 46, transform: "rotate(-18deg)" }} />
        <Bean className="doodle hidden md:block absolute z-[6]" style={{ bottom: 78, left: 104, width: 38, transform: "rotate(24deg)" }} />

        {/* copy block */}
        <div className="relative z-20 pt-24 sm:pt-28 lg:absolute lg:pt-0 lg:left-[96px] lg:top-[170px] px-5 sm:px-10 lg:px-0 max-w-full lg:max-w-[680px] pb-[280px] md:pb-[320px] lg:pb-0">
          <p className="font-sans font-bold tracking-[0.16em] sm:tracking-[0.18em] text-[11px] sm:text-[12px] lg:text-[13px] text-white/70 mb-2 sm:mb-3">
            ENJOYED BEST WITH
          </p>
          <div className="mb-5 sm:mb-7">
            <FriendsLine className="text-[22px] sm:text-[28px] lg:text-[34px]" />
          </div>
          <h1
            className="font-marker text-white leading-[0.92] text-[44px] sm:text-[64px] lg:text-[88px]"
            style={{ textShadow: "3px 4px 0 rgba(0,0,0,.35)" }}
          >
            The one with<br />the <span style={{ color: "var(--accent)" }}>AI</span>
          </h1>
          <p className="font-sans text-[14px] sm:text-[17px] lg:text-[20px] text-white/85 leading-relaxed mt-4 sm:mt-6 max-w-[520px]">
            Pull up a chair on the orange couch. Pick a friend and they&apos;ll
            talk right back — grounded in every line they ever said.
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-6 sm:mt-9">
            <a
              href="#picker"
              className="font-marker tracking-wide text-white bg-accent rounded-[6px] px-6 sm:px-9 py-3 sm:py-4 text-[15px] sm:text-[17px] lg:text-[19px] shadow-[0_10px_28px_-8px_rgba(234,88,12,0.8)] active:scale-[0.97] transition-transform"
            >
              Pick a friend →
            </a>
            <Link
              href="/game"
              className="font-marker tracking-wide text-white border-2 border-white/70 rounded-[6px] px-5 sm:px-8 py-3 sm:py-4 text-[15px] sm:text-[17px] lg:text-[19px] hover:bg-white hover:text-[#2C1F14] transition-colors"
            >
              Play Guess Who
            </Link>
          </div>
        </div>

        <div className="hero-vig" />
      </div>
    </section>
  );
}
