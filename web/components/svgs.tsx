/**
 * Shared SVG assets — the couch motif, the bean doodle, the rough filter
 * used by hand-drawn sketch frames around picker cards.
 *
 * <SvgDefs/> renders once near the root of the layout so symbols + filters
 * are available via <use href="#..."/> anywhere in the tree.
 */

export function SvgDefs() {
  return (
    <>
      {/* simple couch — used at small sizes (icons, watermarks) */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <symbol id="couch" viewBox="0 0 128 72">
          <path
            d="M14 40 C14 21 22 16 34 16 L94 16 C106 16 114 21 114 40 L114 44 C107 44 102 49 102 56 L26 56 C26 49 21 44 14 44 Z"
            fill="currentColor"
          />
          <rect x="8" y="40" width="18" height="24" rx="8" fill="currentColor" />
          <rect x="102" y="40" width="18" height="24" rx="8" fill="currentColor" />
          <rect x="26" y="46" width="76" height="14" rx="6" fill="currentColor" />
          <rect x="20" y="62" width="7" height="8" rx="2" fill="currentColor" />
          <rect x="101" y="62" width="7" height="8" rx="2" fill="currentColor" />
        </symbol>
      </svg>

      {/* cinematic couch + bean + rough filter */}
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cpCushG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fb923c" />
            <stop offset="0.5" stopColor="#ea580c" />
            <stop offset="1" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id="cpSeatG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdba74" />
            <stop offset="1" stopColor="#ea580c" />
          </linearGradient>
          <filter id="rough">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014"
              numOctaves={2}
              seed={6}
              result="n"
            />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
          </filter>
        </defs>

        <symbol id="couch-lux" viewBox="0 0 680 320">
          <ellipse cx="340" cy="296" rx="296" ry="17" fill="#000" opacity="0.28" />
          <rect x="92" y="26" width="496" height="150" rx="48" fill="url(#cpCushG)" />
          <rect x="108" y="40" width="464" height="40" rx="20" fill="#fff" opacity="0.12" />
          <g stroke="#b1430b" strokeWidth="3" opacity="0.85">
            <line x1="168" y1="48" x2="168" y2="150" />
            <line x1="256" y1="48" x2="256" y2="150" />
            <line x1="344" y1="48" x2="344" y2="150" />
            <line x1="432" y1="48" x2="432" y2="150" />
            <line x1="512" y1="48" x2="512" y2="150" />
          </g>
          <g fill="#9a3608">
            <circle cx="168" cy="96" r="5" />
            <circle cx="256" cy="96" r="5" />
            <circle cx="344" cy="96" r="5" />
            <circle cx="432" cy="96" r="5" />
            <circle cx="512" cy="96" r="5" />
          </g>
          <rect x="50" y="92" width="78" height="168" rx="38" fill="url(#cpCushG)" />
          <rect x="64" y="104" width="50" height="46" rx="22" fill="#fff" opacity="0.14" />
          <rect x="552" y="92" width="78" height="168" rx="38" fill="url(#cpCushG)" />
          <rect x="566" y="104" width="50" height="46" rx="22" fill="#fff" opacity="0.14" />
          <rect x="112" y="158" width="456" height="104" rx="22" fill="#c2410c" />
          <rect x="120" y="150" width="150" height="60" rx="20" fill="url(#cpSeatG)" />
          <rect x="266" y="150" width="150" height="60" rx="20" fill="url(#cpSeatG)" />
          <rect x="412" y="150" width="150" height="60" rx="20" fill="url(#cpSeatG)" />
          <g fill="#3a2415">
            <rect x="120" y="258" width="17" height="34" rx="5" />
            <rect x="250" y="258" width="17" height="34" rx="5" />
            <rect x="416" y="258" width="17" height="34" rx="5" />
            <rect x="546" y="258" width="17" height="34" rx="5" />
          </g>
        </symbol>

        <symbol id="bean" viewBox="0 0 44 30">
          <ellipse
            cx="22"
            cy="15"
            rx="18"
            ry="11.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M10 8 C17 13 27 17 34 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </symbol>
      </svg>
    </>
  );
}

export function CouchIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} viewBox="0 0 128 72">
      <use href="#couch" />
    </svg>
  );
}

export function CouchLux({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} viewBox="0 0 680 320">
      <use href="#couch-lux" />
    </svg>
  );
}

export function Bean({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg className={className} style={style} viewBox="0 0 44 30">
      <use href="#bean" />
    </svg>
  );
}
