import { notFound } from "next/navigation";
import { BY_SLUG, SLUGS } from "@/lib/characters";
import { ChatShell } from "@/components/chat-shell";

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ character: slug }));
}

export default function ChatPage({
  params,
}: {
  params: { character: string };
}) {
  const c = BY_SLUG[params.character];
  if (!c) notFound();
  return <ChatShell character={c} />;
}
