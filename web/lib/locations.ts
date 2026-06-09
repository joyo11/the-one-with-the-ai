/** Per-character chat locations.
 *  Each character lives somewhere in the Friends universe; the chat
 *  background is themed to that place. */

export type LocationId = "monicas" | "joeys" | "ross" | "perk";

export interface Location {
  id: LocationId;
  name: string;           // "Apt 20" / "Apt 19" / "Ross's" / "Central Perk"
  subtitle: string;       // tiny tagline shown in chat header
  gradient: {
    from: string;         // top
    via?: string;         // optional middle stop
    to: string;           // bottom
  };
  accent: string;         // signature glow used for pendant / vignette
  /** Optional real-photo background. Drop a JPG at the matching path under
   *  /public/sets/ and set this; it'll be used INSTEAD of the SVG props
   *  with a dark overlay for legibility. Leave undefined → SVG props. */
  image?: string;
  /** Bubble background hint — the assistant bubble keeps its cream surface
   *  for legibility, but the user-side bubble adopts this dark-translucent
   *  feel so YOU look like you're in the room with them. */
  userBubble: {
    background: string;
    border: string;
    text: string;
  };
}

export const LOCATIONS: Record<LocationId, Location> = {
  monicas: {
    id: "monicas",
    name: "Apt 20",
    subtitle: "the purple door",
    gradient: { from: "#2D1B3F", via: "#3A2453", to: "#3E2A52" },
    accent: "#B084CC",
    image: "/sets/monicas.jpg",
    userBubble: {
      background: "rgba(176, 132, 204, 0.16)",
      border: "rgba(176, 132, 204, 0.36)",
      text: "#F4ECFF",
    },
  },
  joeys: {
    id: "joeys",
    name: "Apt 19",
    subtitle: "the chair, the foosball, the duck",
    gradient: { from: "#2A1A0F", via: "#3A2818", to: "#4A3322" },
    accent: "#E8B568",
    image: "/sets/joeys.jpg",
    userBubble: {
      background: "rgba(232, 181, 104, 0.15)",
      border: "rgba(232, 181, 104, 0.35)",
      text: "#FFF3DB",
    },
  },
  ross: {
    id: "ross",
    name: "Ross's",
    subtitle: "the dinosaur dad",
    gradient: { from: "#1F2418", via: "#2A2C20", to: "#3A332A" },
    accent: "#9DBE74",
    image: "/sets/ross.jpg",
    userBubble: {
      background: "rgba(157, 190, 116, 0.14)",
      border: "rgba(157, 190, 116, 0.32)",
      text: "#EFF3E5",
    },
  },
  perk: {
    id: "perk",
    name: "Central Perk",
    subtitle: "open-mic night",
    gradient: { from: "#3A1D0C", via: "#5A2A14", to: "#6B3415" },
    accent: "#FB923C",
    image: "/sets/perk.jpg",
    userBubble: {
      background: "rgba(251, 146, 60, 0.18)",
      border: "rgba(251, 146, 60, 0.4)",
      text: "#FFE9D3",
    },
  },
};

/** Which character lives where for chat purposes. */
export const CHARACTER_LOCATION: Record<string, LocationId> = {
  Monica: "monicas",
  Rachel: "monicas",
  Ross: "ross",
  Joey: "joeys",
  Chandler: "joeys",
  Phoebe: "perk",
};
