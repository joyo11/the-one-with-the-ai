"use client";

import Link from "next/link";
import { CouchIcon, CouchLux, Bean } from "@/components/svgs";

const DOT_HUES = ["#F87171", "#60A5FA", "#FBBF24"];

function FriendsLine({ size = 34 }: { size?: number }) {
  const L = "FRIENDS".split("");
  let di = 0;
  return (
    <span className="friends-line" style={{ fontSize: size }}>
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
 * Dark espresso→orange radial, bokeh lights, paper grain,
 * the iconic couch as centerpiece with steam rising,
 * scattered bean doodles, F·R·I·E·N·D·S eyebrow, big marker headline.
 */
export function LandingHero() {
  return (
    <section className="hero-cp w-full">
      <div className="relative mx-auto" style={{ maxWidth: 1440, height: 880 }}>
        <div className="hero-glow" />
        <div
          className="bokeh"
          style={{
            width: 160,
            height: 160,
            left: "62%",
            top: "8%",
            background: "#fb923c",
            opacity: 0.5,
          }}
        />
        <div
          className="bokeh"
          style={{
            width: 90,
            height: 90,
            left: "80%",
            top: "22%",
            background: "#fdba74",
            opacity: 0.45,
          }}
        />
        <div
          className="bokeh"
          style={{
            width: 120,
            height: 120,
            left: "18%",
            top: "6%",
            background: "#ea580c",
            opacity: 0.35,
          }}
        />
        <div className="hero-grain" />

        {/* slim site nav */}
        <div className="absolute top-0 inset-x-0 flex items-center gap-8 px-14 py-6 z-20">
          <Link href="/" className="flex items-center gap-2.5">
            <CouchIcon style={{ width: 42, color: "#EA580C" }} />
            <span className="font-marker text-[18px] text-white leading-none">
              the one with the AI
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-7 font-sans font-semibold text-[14px] text-white/85">
            <a href="#picker" className="hover:text-white transition-colors">
              Chat
            </a>
            <Link href="/game" className="hover:text-white transition-colors">
              Guess Who
            </Link>
            <a href="#picker" className="hover:text-white transition-colors">
              The Friends
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </nav>
        </div>

        {/* couch centerpiece */}
        <CouchLux
          style={{
            position: "absolute",
            bottom: -26,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            zIndex: 5,
            filter: "drop-shadow(0 30px 40px rgba(0,0,0,.5))",
          }}
        />

        {/* steam */}
        <svg
          className="steam"
          style={{
            position: "absolute",
            bottom: 150,
            left: "46%",
            width: 120,
            height: 150,
            zIndex: 6,
          }}
          viewBox="0 0 120 150"
          strokeWidth={5}
        >
          <path d="M40 150 C20 120 60 110 40 80 C24 56 56 44 42 14" />
          <path d="M82 150 C62 122 98 112 80 84 C64 60 96 50 82 22" />
        </svg>

        {/* bean doodles */}
        <Bean
          className="doodle"
          style={{
            position: "absolute",
            bottom: 40,
            left: 48,
            width: 46,
            transform: "rotate(-18deg)",
            zIndex: 6,
          }}
        />
        <Bean
          className="doodle"
          style={{
            position: "absolute",
            bottom: 78,
            left: 104,
            width: 38,
            transform: "rotate(24deg)",
            zIndex: 6,
          }}
        />

        {/* copy block */}
        <div
          className="absolute z-20"
          style={{ left: 96, top: 170, maxWidth: 680 }}
        >
          <p className="font-sans font-bold tracking-[0.18em] text-[13px] text-white/70 mb-3">
            ENJOYED BEST WITH
          </p>
          <div className="mb-7">
            <FriendsLine size={34} />
          </div>
          <h1
            className="font-marker text-white leading-[0.92] text-[88px]"
            style={{ textShadow: "3px 4px 0 rgba(0,0,0,.35)" }}
          >
            The one with
            <br />
            the <span style={{ color: "var(--accent)" }}>AI</span>
          </h1>
          <p className="font-sans text-[20px] text-white/85 leading-relaxed mt-6 max-w-[520px]">
            Pull up a chair on the orange couch. Pick a friend and they&apos;ll
            talk right back — grounded in every line they ever said.
          </p>
          <div className="flex items-center gap-4 mt-9">
            <a
              href="#picker"
              className="font-marker tracking-wide text-white bg-accent rounded-[6px] px-9 py-4 text-[19px] shadow-[0_10px_28px_-8px_rgba(234,88,12,0.8)] active:scale-[0.97] transition-transform"
            >
              Pick a friend →
            </a>
            <Link
              href="/game"
              className="font-marker tracking-wide text-white border-2 border-white/70 rounded-[6px] px-8 py-4 text-[19px] hover:bg-white hover:text-[#2C1F14] transition-colors"
            >
              Play Guess Who
            </Link>
          </div>
          <div className="flex items-center gap-2.5 mt-9">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/35" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/35" />
          </div>
        </div>

        <div className="hero-vig" />
      </div>
    </section>
  );
}
