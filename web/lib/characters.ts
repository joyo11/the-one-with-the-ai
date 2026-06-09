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
  welcome: string; // first-message welcome bubble in their voice
  /** Empty-state "headline" that replaces the generic "the couch is empty"
   *  when this character's chat opens fresh. */
  entry: string;
  image: string; // small avatar / face crop, e.g. "/characters/joey.png"
  imagePosition?: string; // CSS object-position for the avatar crop
  /** Larger room-aware portrait used as the hero on the empty chat state.
   *  These are full-body / chest-up shots with the set in the background. */
  portrait: string;
  /** Optional CSS object-position for the portrait when displayed in a
   *  bounded box. Defaults to "center top". */
  portraitPosition?: string;
  /** Optional background-size when the portrait is used as the chat
   *  backdrop. Defaults to "cover". Use a value like "auto 75%" to zoom
   *  out a too-tight close-up. */
  portraitSize?: string;
}

export const CHARACTERS: Character[] = [
  {
    name: "Monica",
    initial: "M",
    tint: "#FFE4E6",
    stroke: "#F43F5E",
    tag: "competitive & clean",
    welcome: "Hi! Come in, come in. Don't touch anything. What do you need?",
    entry: "the kitchen's spotless. sit down.",
    image: "/characters/mon.png",
    imagePosition: "center 18%",
    portrait: "/characters/portraits/mon.jpg",
    portraitPosition: "center top",
  },
  {
    name: "Joey",
    initial: "J",
    tint: "#FEF3C7",
    stroke: "#F59E0B",
    tag: "how you doin'?",
    welcome: "How you doin'? What's on your mind?",
    entry: "pizza's on the way. sit down.",
    image: "/characters/joey.png",
    imagePosition: "center 8%",
    portrait: "/characters/portraits/joey.jpg",
    portraitPosition: "center 15%",
  },
  {
    name: "Ross",
    initial: "R",
    tint: "#D1FAE5",
    stroke: "#059669",
    tag: "we were on a break",
    welcome: "Oh, hi! Did you know dinosaurs are technically still around? Anyway — what's up?",
    entry: "you're early. or — am i late? sit down.",
    image: "/characters/ross.png",
    imagePosition: "center 15%",
    portrait: "/characters/portraits/ross.jpg",
    portraitPosition: "center top",
  },
  {
    name: "Chandler",
    initial: "C",
    tint: "#E0F2FE",
    stroke: "#0EA5E9",
    tag: "could I BE more…",
    welcome:
      "Oh good, a guest. Could I BE any more excited? What do you want to talk about?",
    entry: "could the couch BE more empty? sit down.",
    image: "/characters/chandler.png",
    imagePosition: "center 12%",
    portrait: "/characters/portraits/chandler.jpg",
    portraitPosition: "center 15%",
  },
  {
    name: "Rachel",
    initial: "R",
    tint: "#FCE7F3",
    stroke: "#EC4899",
    tag: "it's a metaphor",
    welcome: "Oh my god, hi! Come in, sit. Tell me everything.",
    entry: "oh my GOD, hi. sit down.",
    image: "/characters/rachel.png",
    imagePosition: "center 25%",
    portrait: "/characters/portraits/rachel.jpg",
    portraitPosition: "center 30%",
  },
  {
    name: "Phoebe",
    initial: "P",
    tint: "#EDE9FE",
    stroke: "#8B5CF6",
    tag: "smelly cat fan",
    welcome:
      "Oh hi! Good energy or chaotic energy? Either's great. What's going on?",
    entry: "your aura is good today. sit down.",
    image: "/characters/pheebs.png",
    imagePosition: "center 20%",
    portrait: "/characters/portraits/pheebs.jpg",
    portraitPosition: "center top",
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
