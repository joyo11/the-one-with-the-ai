import type { Character } from "@/lib/characters";

interface Props {
  character: Character;
  size?: number;
  className?: string;
  /** Show a 2px ring in the character's accent color */
  ring?: boolean;
}

/**
 * Round avatar (configurable size). Renders the character's portrait if one
 * is set, otherwise falls back to the initial in Permanent Marker.
 *
 * Background tint is always there — it shows around any image transparency
 * and provides a colored fallback if the portrait fails to load.
 */
export function CharacterMarker({
  character,
  size = 80,
  className,
  ring,
}: Props) {
  const fontSize = Math.round(size * 0.46);
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full shrink-0 overflow-hidden relative ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: character.tint,
        boxShadow: ring
          ? `0 0 0 2px ${character.stroke}, inset 0 0 0 1px rgba(0,0,0,0.04)`
          : "inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
      aria-label={character.name}
    >
      {character.image ? (
        // Plain <img> instead of next/image — we want zero-config behavior on
        // any host (including static export) and the file is already 400px.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={character.image}
          alt={character.name}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : (
        <span
          className="font-marker leading-none"
          style={{ color: character.stroke, fontSize }}
        >
          {character.initial}
        </span>
      )}
    </div>
  );
}
