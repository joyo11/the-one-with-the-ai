export type CharacterName =
  | "Monica"
  | "Joey"
  | "Ross"
  | "Chandler"
  | "Rachel"
  | "Phoebe";

export interface Character {
  name: CharacterName;
  initial: string;
  tint: string; // pastel background of the avatar circle (shown behind image if it loads, also acts as the fallback when image is missing)
  stroke: string; // strong accent color for marker stroke + border
  tag: string; // role tagline
  welcome: string; // welcome message in their voice
  image: string; // public-path portrait, e.g. "/characters/joey.png"
}

export const CHARACTERS: Character[] = [
  {
    name: "Monica",
    initial: "M",
    tint: "#FFE4E6",
    stroke: "#F43F5E",
    tag: "competitive & clean",
    welcome: "Hi! Come in, come in. Don't touch anything. What do you need?",
    image: "/characters/mon.png",
  },
  {
    name: "Joey",
    initial: "J",
    tint: "#FEF3C7",
    stroke: "#F59E0B",
    tag: "how you doin'?",
    welcome: "How you doin'? What's on your mind?",
    image: "/characters/joey.png",
  },
  {
    name: "Ross",
    initial: "R",
    tint: "#D1FAE5",
    stroke: "#059669",
    tag: "we were on a break",
    welcome: "Oh, hi! Did you know dinosaurs are technically still around? Anyway — what's up?",
    image: "/characters/ross.png",
  },
  {
    name: "Chandler",
    initial: "C",
    tint: "#E0F2FE",
    stroke: "#0EA5E9",
    tag: "could I BE more…",
    welcome:
      "Oh good, a guest. Could I BE any more excited? What do you want to talk about?",
    image: "/characters/chandler.png",
  },
  {
    name: "Rachel",
    initial: "R",
    tint: "#FCE7F3",
    stroke: "#EC4899",
    tag: "it's a metaphor",
    welcome: "Oh my god, hi! Come in, sit. Tell me everything.",
    image: "/characters/rachel.png",
  },
  {
    name: "Phoebe",
    initial: "P",
    tint: "#EDE9FE",
    stroke: "#8B5CF6",
    tag: "smelly cat fan",
    welcome:
      "Oh hi! Good energy or chaotic energy? Either's great. What's going on?",
    image: "/characters/pheebs.png",
  },
];

export const BY_NAME: Record<CharacterName, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.name, c]),
) as Record<CharacterName, Character>;

export const BY_SLUG: Record<string, Character> = Object.fromEntries(
  CHARACTERS.map((c) => [c.name.toLowerCase(), c]),
);

export const SLUGS = CHARACTERS.map((c) => c.name.toLowerCase());

export function isCharacterSlug(slug: string): slug is string {
  return slug in BY_SLUG;
}
