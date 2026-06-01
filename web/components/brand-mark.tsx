"use client";

import { useEffect, useState } from "react";

const LETTERS = "FRIENDS".split("");
const DOT_HUES = ["#F87171", "#60A5FA", "#FBBF24"]; // red, blue, yellow

interface Props {
  /** "static" = no animation, dots already in final colors. "typewriter" = animate on mount. */
  variant?: "static" | "typewriter";
  /** font-size in px */
  size?: number;
  className?: string;
}

/**
 * F·R·I·E·N·D·S wordmark in Permanent Marker.
 * In typewriter variant, letters arrive left→right (80ms each, 60ms stagger);
 * dots start orange, then crossfade to red/blue/yellow at 820ms.
 *
 * Framer Motion equivalent:
 *   letter: initial={opacity:0} animate={opacity:1}
 *           transition={duration:0.08, delay:i*0.06, ease:"easeOut"}
 *   dots:   color #EA580C → final hue, 0.4s linear
 */
export function BrandMark({
  variant = "static",
  size = 40,
  className,
}: Props) {
  const [revealed, setRevealed] = useState(variant === "static");
  const [dotsColored, setDotsColored] = useState(variant === "static");

  useEffect(() => {
    if (variant !== "typewriter") return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setRevealed(true);
      setDotsColored(true);
      return;
    }
    // letters: small delay before triggering animation class
    requestAnimationFrame(() => setRevealed(true));
    const t = window.setTimeout(() => setDotsColored(true), 820);
    return () => window.clearTimeout(t);
  }, [variant]);

  let dotIdx = 0;
  return (
    <span
      className={`font-marker leading-none inline-flex items-center ${className ?? ""}`}
      style={{ fontSize: size }}
    >
      {LETTERS.map((letter, i) => {
        const dotEl =
          i < LETTERS.length - 1 ? (
            <span
              key={`d-${i}`}
              style={{
                color: dotsColored ? DOT_HUES[dotIdx % 3] : "#EA580C",
                margin: "0 2px",
                transition: "color 0.4s ease",
              }}
            >
              •
            </span>
          ) : null;
        if (i < LETTERS.length - 1) dotIdx++;
        return (
          <span key={`l-${i}`} className="contents">
            <span
              style={{
                opacity: revealed ? 1 : 0,
                animation:
                  variant === "typewriter" && revealed
                    ? `bmIn 0.08s ease-out ${(i * 0.06).toFixed(2)}s forwards`
                    : undefined,
              }}
            >
              {letter}
            </span>
            {dotEl}
          </span>
        );
      })}
    </span>
  );
}
