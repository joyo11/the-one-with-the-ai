"use client";

import { useState, useTransition, useRef } from "react";
import { CharacterMarker } from "@/components/character-marker";
import { type Character } from "@/lib/characters";

interface Props {
  templateId: string;
  character: Character;
  inputLabel: string;
  inputHint?: string;
}

export function LabForm({ templateId, character, inputLabel, inputHint }: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    setOutput(null);
    setErr(null);
    startTransition(async () => {
      try {
        const r = await fetch("/api/lab/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId, input: input.trim() }),
        });
        const j = await r.json();
        if (!r.ok) {
          setErr(j.error || `HTTP ${r.status}`);
          return;
        }
        setOutput(j.output as string);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "request failed");
      }
    });
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(`${character.name}: ${output}`);
    } catch {
      /* fail silently — older browsers */
    }
  }

  async function share() {
    if (!output) return;
    const text = `${character.name} said:\n\n${output}\n\n— howudoinai.vercel.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${character.name} via The Lab`, text });
      } catch {
        /* user cancelled */
      }
    } else {
      copy();
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
            {inputLabel}
          </span>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder={inputLabel}
            className="w-full bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md px-4 py-3 text-[15px] text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)] resize-none"
          />
          <div className="flex justify-between mt-1">
            {inputHint ? (
              <span className="text-[12px] text-[color:var(--muted)]">{inputHint}</span>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-[color:var(--muted)] font-mono">
              {input.length}/4000
            </span>
          </div>
        </label>
        <button
          type="submit"
          disabled={!input.trim() || isPending}
          className="w-full bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-md transition-colors text-[15px]"
        >
          {isPending ? `${character.name} is thinking…` : `Hand it to ${character.name}`}
        </button>
        {err && <p className="text-[13px] text-[color:var(--error)]">{err}</p>}
      </form>

      {output && (
        <div ref={resultRef} className="space-y-3 animate-msg-in">
          <ResultCard character={character} text={output} />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="text-[13px] px-3 py-1.5 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] hover:border-[color:var(--accent)] text-[color:var(--fg)] transition-colors"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={share}
              className="text-[13px] px-3 py-1.5 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] hover:border-[color:var(--accent)] text-[color:var(--fg)] transition-colors"
            >
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                setOutput(null);
                setInput("");
              }}
              className="text-[13px] px-3 py-1.5 rounded-md text-[color:var(--muted)] hover:text-[color:var(--fg)] ml-auto"
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ character, text }: { character: Character; text: string }) {
  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5 sm:p-6 grain relative">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[color:var(--border)]">
        <CharacterMarker character={character} size={40} />
        <div>
          <p className="font-[family-name:var(--font-marker)] text-[18px] text-[color:var(--fg)] leading-none">
            {character.name}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)] mt-1">
            via The Lab · howudoinai
          </p>
        </div>
      </div>
      <div className="prose-friends text-[15px] text-[color:var(--fg)] leading-relaxed whitespace-pre-wrap">
        {renderMarkdownish(text)}
      </div>
    </div>
  );
}

/** Tiny markdown-ish renderer for the common cases the templates emit
 *  (## headers, **bold**, *italics*, bullet lists). Avoids pulling in a
 *  full markdown lib for ~6 templates. */
function renderMarkdownish(raw: string): React.ReactNode {
  const lines = raw.split("\n");
  const out: React.ReactNode[] = [];
  let listBuffer: string[] = [];
  function flushList() {
    if (listBuffer.length === 0) return;
    out.push(
      <ul key={`l${out.length}`} className="list-disc pl-5 my-2 space-y-1">
        {listBuffer.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listBuffer = [];
  }
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("## ")) {
      flushList();
      out.push(
        <h3
          key={`h${i}`}
          className="font-[family-name:var(--font-marker)] text-[16px] text-[color:var(--fg)] mt-4 mb-1 first:mt-0"
        >
          {t.slice(3)}
        </h3>,
      );
    } else if (t.startsWith("- ") || t.startsWith("* ")) {
      listBuffer.push(t.slice(2));
    } else if (t === "") {
      flushList();
      out.push(<div key={`b${i}`} className="h-2" />);
    } else {
      flushList();
      out.push(
        <p key={`p${i}`} className="my-1">
          {renderInline(t)}
        </p>,
      );
    }
  });
  flushList();
  return out;
}

function renderInline(s: string): React.ReactNode {
  // Bold then italics. Quick split-pass, good enough for our templates.
  const parts: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(<strong key={`b${i++}`}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={`i${i++}`}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}
