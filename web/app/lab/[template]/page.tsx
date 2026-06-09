import Link from "next/link";
import { notFound } from "next/navigation";
import { CharacterMarker } from "@/components/character-marker";
import { CHARACTERS } from "@/lib/characters";
import { getTemplate } from "@/lib/lab-templates";
import { LabForm } from "./lab-form";

interface PageProps {
  params: { template: string };
}

export function generateMetadata({ params }: PageProps) {
  const t = getTemplate(params.template);
  if (!t) return { title: "The Lab" };
  return { title: `${t.title} — The Lab` };
}

export default function LabTemplatePage({ params }: PageProps) {
  const template = getTemplate(params.template);
  if (!template) notFound();
  const character = CHARACTERS.find((c) => c.name === template.character)!;

  return (
    <main className="min-h-[100dvh] px-5 sm:px-10 lg:px-14 py-12 sm:py-16 bg-[color:var(--bg)]">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/lab"
            className="text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] hover:text-[color:var(--accent)]"
          >
            ← All Lab tools
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <CharacterMarker character={character} size={56} />
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)]">
              {template.character}
            </p>
            <h1 className="font-[family-name:var(--font-marker)] text-3xl sm:text-4xl text-[color:var(--fg)] leading-tight">
              {template.title}
            </h1>
          </div>
        </div>
        <p className="text-[14px] text-[color:var(--muted)] mb-8 max-w-md">
          {template.blurb}
        </p>

        <LabForm
          templateId={template.id}
          character={character}
          inputLabel={template.inputLabel}
          inputHint={template.inputHint}
        />
      </div>
    </main>
  );
}
