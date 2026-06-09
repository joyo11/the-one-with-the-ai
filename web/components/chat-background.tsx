/** Themed background for each chat surface.
 *  Renders behind the message list — gradient + a couple of stylized SVG
 *  props that hint at the location without overwhelming the conversation. */

import { LOCATIONS, type LocationId } from "@/lib/locations";

interface Props {
  locationId: LocationId;
  /** Per-character override — when set, this image (typically the
   *  character's portrait) is used instead of the location's set photo.
   *  The location still drives the tint/accent so the room "feels" still
   *  there in the gradient. */
  overrideImage?: string;
  overrideImagePosition?: string;
  /** Optional background-size for the override; defaults to "cover".
   *  Use a value like "auto 80%" to zoom out a too-tight close-up. */
  overrideImageSize?: string;
}

export function ChatBackground({
  locationId,
  overrideImage,
  overrideImagePosition,
  overrideImageSize,
}: Props) {
  const loc = LOCATIONS[locationId];

  const gradient = `linear-gradient(180deg, ${loc.gradient.from} 0%, ${
    loc.gradient.via ?? loc.gradient.from
  } 45%, ${loc.gradient.to} 100%)`;

  // Resolve which background photo to use. Per-character portrait wins;
  // location's set photo is the fallback.
  const bgImage = overrideImage ?? loc.image;
  const bgPosition = overrideImage ? (overrideImagePosition ?? "center top") : "center";
  const useImage = Boolean(bgImage);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ background: gradient }}
      aria-hidden
    >
      {useImage && (
        <>
          {/* hero photo (character portrait if provided, else set photo) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${bgImage})`,
              backgroundPosition: bgPosition,
              backgroundSize: overrideImage ? (overrideImageSize ?? "cover") : "cover",
              backgroundRepeat: "no-repeat",
            }}
          />
          {/* darken so cream bubbles still pop */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${loc.gradient.from}cc 0%, ${
                loc.gradient.via ?? loc.gradient.from
              }cc 50%, ${loc.gradient.to}e8 100%)`,
            }}
          />
        </>
      )}

      {/* paper grain wash */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* signature pendant glow at top */}
      <div
        className="absolute"
        style={{
          left: "18%",
          top: "-80px",
          width: 360,
          height: 360,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${loc.accent}38 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />
      <div
        className="absolute"
        style={{
          right: "8%",
          top: "12%",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${loc.accent}28 0%, transparent 60%)`,
          filter: "blur(28px)",
        }}
      />

      {/* per-location SVG props — only when there's no hero photo to back them */}
      {!useImage && locationId === "monicas" && <MonicasProps accent={loc.accent} />}
      {!useImage && locationId === "joeys" && <JoeysProps accent={loc.accent} />}
      {!useImage && locationId === "ross" && <RossProps accent={loc.accent} />}
      {!useImage && locationId === "perk" && <PerkProps accent={loc.accent} />}

      {/* bottom vignette for message readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)",
        }}
      />
    </div>
  );
}

/* ─── Monica's apartment ───────────────────────────────────────────── */
function MonicasProps({ accent }: { accent: string }) {
  return (
    <>
      {/* purple door, top-right corner */}
      <svg
        className="absolute"
        style={{ right: -10, top: 30, width: 180, opacity: 0.4 }}
        viewBox="0 0 100 220"
      >
        <rect x="8" y="6" width="84" height="200" rx="6" fill="#5B2E83" />
        <rect x="14" y="14" width="34" height="80" rx="2" fill="#3D1E5C" opacity="0.5" />
        <rect x="52" y="14" width="34" height="80" rx="2" fill="#3D1E5C" opacity="0.5" />
        <rect x="14" y="106" width="34" height="80" rx="2" fill="#3D1E5C" opacity="0.5" />
        <rect x="52" y="106" width="34" height="80" rx="2" fill="#3D1E5C" opacity="0.5" />
        <circle cx="78" cy="110" r="3.5" fill="#E8C547" />
      </svg>

      {/* kitchen island silhouette across the bottom */}
      <svg
        className="absolute inset-x-0 bottom-0"
        style={{ width: "100%", height: 180, opacity: 0.5 }}
        viewBox="0 0 800 180"
        preserveAspectRatio="xMidYMax slice"
      >
        <rect x="0" y="110" width="800" height="70" fill="#1E1230" />
        <rect x="120" y="80" width="560" height="40" rx="6" fill="#2D1B3F" />
        <rect x="135" y="78" width="530" height="6" rx="3" fill={accent} opacity="0.4" />
        <circle cx="200" cy="60" r="14" fill="#3E2A52" />
        <circle cx="600" cy="60" r="10" fill="#3E2A52" />
      </svg>

      {/* magic 8 ball on the counter */}
      <svg
        className="absolute"
        style={{ left: "22%", bottom: 80, width: 30, opacity: 0.6 }}
        viewBox="0 0 40 40"
      >
        <circle cx="20" cy="20" r="18" fill="#0A0A0A" />
        <circle cx="20" cy="20" r="6" fill="#E8C547" opacity="0.85" />
        <text x="20" y="24" fill="#0A0A0A" fontSize="8" textAnchor="middle" fontWeight="bold">8</text>
      </svg>
    </>
  );
}

/* ─── Joey & Chandler's apartment ──────────────────────────────────── */
function JoeysProps({ accent }: { accent: string }) {
  return (
    <>
      {/* two barcaloungers, bottom-center */}
      <svg
        className="absolute"
        style={{ left: "50%", transform: "translateX(-50%)", bottom: 0, width: 520, opacity: 0.45 }}
        viewBox="0 0 520 180"
      >
        {/* left chair */}
        <rect x="20" y="60" width="200" height="100" rx="14" fill="#5C3920" />
        <rect x="20" y="50" width="200" height="35" rx="10" fill="#6B4326" />
        <rect x="6" y="80" width="22" height="70" rx="6" fill="#4A2D19" />
        <rect x="210" y="80" width="22" height="70" rx="6" fill="#4A2D19" />
        {/* right chair */}
        <rect x="300" y="60" width="200" height="100" rx="14" fill="#5C3920" />
        <rect x="300" y="50" width="200" height="35" rx="10" fill="#6B4326" />
        <rect x="286" y="80" width="22" height="70" rx="6" fill="#4A2D19" />
        <rect x="490" y="80" width="22" height="70" rx="6" fill="#4A2D19" />
      </svg>

      {/* foosball table strip, bottom edge */}
      <svg
        className="absolute inset-x-0 bottom-0"
        style={{ width: "100%", height: 50, opacity: 0.3 }}
        viewBox="0 0 800 50"
        preserveAspectRatio="xMidYMax slice"
      >
        <rect x="0" y="20" width="800" height="30" fill="#2A1A0F" />
        {[100, 230, 360, 490, 620].map((x) => (
          <rect key={x} x={x} y={26} width={4} height={20} fill={accent} opacity="0.45" />
        ))}
      </svg>

      {/* the little chick + duck silhouettes, side */}
      <svg
        className="absolute"
        style={{ left: 40, bottom: 35, width: 38, opacity: 0.55 }}
        viewBox="0 0 60 30"
      >
        {/* chick */}
        <ellipse cx="12" cy="20" rx="9" ry="7" fill="#F0D360" />
        <circle cx="12" cy="10" r="5" fill="#F0D360" />
        {/* duck */}
        <ellipse cx="40" cy="20" rx="11" ry="8" fill="#F5F5F0" />
        <circle cx="48" cy="12" r="5" fill="#F5F5F0" />
        <path d="M 51 12 L 56 14 L 51 16 Z" fill="#E8A53D" />
      </svg>
    </>
  );
}

/* ─── Ross's apartment ─────────────────────────────────────────────── */
function RossProps({ accent }: { accent: string }) {
  return (
    <>
      {/* T-rex silhouette ghosted on the back wall */}
      <svg
        className="absolute"
        style={{ right: "10%", top: "20%", width: 260, opacity: 0.18 }}
        viewBox="0 0 260 200"
      >
        <path
          d="M 30 130 Q 30 90 70 80 Q 80 30 130 30 Q 180 30 210 50 Q 220 70 215 100 L 230 105 L 220 115 L 210 110 Q 195 130 175 130 L 165 165 L 155 165 L 160 130 L 110 130 L 100 175 L 88 175 L 95 130 L 80 130 L 50 175 L 38 175 L 60 130 Q 30 130 30 130 Z"
          fill={accent}
        />
        <circle cx="195" cy="58" r="3" fill="#1F2418" />
      </svg>

      {/* bookshelf row across bottom */}
      <svg
        className="absolute inset-x-0 bottom-0"
        style={{ width: "100%", height: 120, opacity: 0.4 }}
        viewBox="0 0 800 120"
        preserveAspectRatio="xMidYMax slice"
      >
        <rect x="0" y="100" width="800" height="20" fill="#241A14" />
        <rect x="0" y="0" width="800" height="100" fill="#2A2018" />
        {/* book spines */}
        {Array.from({ length: 32 }, (_, i) => i).map((i) => {
          const x = i * 25;
          const h = 70 + (i % 5) * 6;
          const colors = ["#5B3B26", "#6E4A2F", "#3D6E4A", "#5B3B26", "#2F4F6E", "#6E4A2F"];
          return (
            <rect
              key={i}
              x={x + 3}
              y={100 - h}
              width={18}
              height={h}
              rx={1}
              fill={colors[i % colors.length]}
            />
          );
        })}
      </svg>

      {/* one framed photo, top-left */}
      <svg
        className="absolute"
        style={{ left: 60, top: 50, width: 80, opacity: 0.5 }}
        viewBox="0 0 80 100"
      >
        <rect x="4" y="4" width="72" height="92" rx="3" fill="#4A3B2A" />
        <rect x="10" y="10" width="60" height="80" fill="#7A6B4A" />
        <circle cx="40" cy="40" r="14" fill="#3A2A18" opacity="0.7" />
        <rect x="22" y="55" width="36" height="20" rx="4" fill="#3A2A18" opacity="0.7" />
      </svg>
    </>
  );
}

/* ─── Central Perk ─────────────────────────────────────────────────── */
function PerkProps({ accent }: { accent: string }) {
  return (
    <>
      {/* chalkboard menu top-left */}
      <svg
        className="absolute"
        style={{ left: 50, top: 50, width: 160, opacity: 0.45 }}
        viewBox="0 0 160 120"
      >
        <rect x="6" y="6" width="148" height="108" rx="4" fill="#3D2818" />
        <rect x="12" y="12" width="136" height="96" rx="2" fill="#1A1108" />
        <line x1="22" y1="28" x2="120" y2="28" stroke="#F5F0E8" strokeWidth="2" opacity="0.5" />
        <line x1="22" y1="42" x2="100" y2="42" stroke="#F5F0E8" strokeWidth="1.5" opacity="0.4" />
        <line x1="22" y1="56" x2="110" y2="56" stroke="#F5F0E8" strokeWidth="1.5" opacity="0.4" />
        <line x1="22" y1="70" x2="90" y2="70" stroke="#F5F0E8" strokeWidth="1.5" opacity="0.4" />
        <line x1="22" y1="84" x2="115" y2="84" stroke="#F5F0E8" strokeWidth="1.5" opacity="0.4" />
      </svg>

      {/* the orange couch, bottom-center */}
      <svg
        className="absolute inset-x-0 bottom-0"
        style={{ width: "100%", height: 220, opacity: 0.55 }}
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="couchOrange" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FB923C" />
            <stop offset="1" stopColor="#C2410C" />
          </linearGradient>
        </defs>
        {/* couch body */}
        <path
          d="M 80 120 C 80 80 110 70 160 70 L 640 70 C 690 70 720 80 720 120 L 720 150 C 690 150 670 170 670 195 L 130 195 C 130 170 110 150 80 150 Z"
          fill="url(#couchOrange)"
        />
        {/* armrests */}
        <rect x="40" y="120" width="60" height="80" rx="20" fill="url(#couchOrange)" />
        <rect x="700" y="120" width="60" height="80" rx="20" fill="url(#couchOrange)" />
        {/* cushion seam */}
        <rect x="130" y="150" width="540" height="30" rx="12" fill="#EA580C" opacity="0.6" />
        {/* legs */}
        <rect x="100" y="200" width="14" height="16" rx="2" fill="#7A2E08" />
        <rect x="686" y="200" width="14" height="16" rx="2" fill="#7A2E08" />
      </svg>

      {/* steam rising from a coffee cup (subtle) */}
      <svg
        className="absolute"
        style={{ left: "44%", bottom: 110, width: 50, opacity: 0.25 }}
        viewBox="0 0 50 80"
      >
        <path d="M 14 70 C 6 50 24 40 14 24 C 8 12 22 6 16 0" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 32 70 C 24 50 42 40 32 24" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    </>
  );
}
