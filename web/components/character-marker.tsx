import type { Character } from "@/lib/characters";

interface Props {
  character: Character;
  size?: number;
  className?: string;
}

/**
 * 80px round avatar (configurable). Initial in Permanent Marker, stroke
 * colored in the character's strong accent. Background is their pastel tint.
 * Never uses emoji — that's the whole point.
 */
export function CharacterMarker({ character, size = 80, className }: Props) {
  const fontSize = Math.round(size * 0.46);
  return (
    <div
      className={`marker inline-flex items-center justify-center rounded-full shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        background: character.tint,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      <span
        className="font-marker leading-none"
        style={{ color: character.stroke, fontSize }}
      >
        {character.initial}
      </span>
    </div>
  );
}
