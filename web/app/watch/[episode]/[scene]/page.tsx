import { notFound } from "next/navigation";
import { getScene } from "@/lib/episodes";
import { CHARACTER_LOCATION } from "@/lib/locations";
import { ScenePlayer } from "@/components/scene-player";

interface PageProps {
  params: { episode: string; scene: string };
}

export function generateMetadata({ params }: PageProps) {
  const found = getScene(params.episode, params.scene);
  if (!found) return { title: "Scene not found" };
  return { title: `${found.scene.title} — ${found.episode.title}` };
}

export default function ScenePlayerPage({ params }: PageProps) {
  const found = getScene(params.episode, params.scene);
  if (!found) notFound();
  if (!found.scene.dialogue || found.scene.dialogue.length === 0) {
    // No dialogue authored yet → bounce to scene list. (Eventually each
    // scene will have dialogue and this branch goes away.)
    notFound();
  }

  // Anchor location to the first character in the scene's "home" location.
  // Picks the most thematic backdrop for the moment.
  const firstChar = found.scene.characters[0];
  const locationId = CHARACTER_LOCATION[firstChar] ?? "monicas";

  return (
    <ScenePlayer
      episode={found.episode}
      scene={found.scene}
      locationId={locationId}
    />
  );
}
