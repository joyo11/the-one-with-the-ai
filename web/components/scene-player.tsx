"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CharacterMarker } from "@/components/character-marker";
import { CHARACTERS, type Character, type CharacterName } from "@/lib/characters";
import { LOCATIONS, type LocationId } from "@/lib/locations";
import type { Episode, Scene } from "@/lib/episodes";
import { streamChat } from "@/lib/api";

interface Props {
  episode: Episode;
  scene: Scene;
  locationId: LocationId;
}

/** New cinematic surface for /watch/<ep>/<scene>. NOT a chat thread.
 *  - Full-screen scene photo
 *  - Auto-advancing canonical dialogue (typewriter-paced)
 *  - Pause/play
 *  - Tap a character chip → pause + focused single-exchange Q&A overlay
 *  - Resume continues the scene
 */
export function ScenePlayer({ episode, scene, locationId }: Props) {
  const loc = LOCATIONS[locationId];
  const dialogue = scene.dialogue ?? [];

  const characters = useMemo<Character[]>(
    () =>
      scene.characters
        .map((n) => CHARACTERS.find((c) => c.name === n))
        .filter(Boolean) as Character[],
    [scene.characters],
  );

  const [lineIdx, setLineIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState<CharacterName | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  // Things the user said to each character during pause. When the scene
  // reaches that character's NEXT canonical line, we rewrite it to weave
  // in the intervention — option C from the design conversation.
  const [interventions, setInterventions] = useState<Record<string, string>>({});
  // Per-index rewritten lines (sparse). When present, the transcript shows
  // these instead of the canonical scene.dialogue[i].text.
  const [rewrittenLines, setRewrittenLines] = useState<Record<number, string>>({});
  const [rewriting, setRewriting] = useState(false);

  // Auto-advance to next line after duration. If the next line is one whose
  // speaker has a pending intervention, pause the advance and call the
  // rewrite endpoint first.
  useEffect(() => {
    if (paused) return;
    if (lineIdx >= dialogue.length - 1) return;
    if (rewriting) return;

    const nextIdx = lineIdx + 1;
    const nextLine = dialogue[nextIdx];
    const interventionFor = nextLine && typeof nextLine.speaker === "string"
      ? interventions[nextLine.speaker]
      : undefined;

    if (interventionFor && !rewrittenLines[nextIdx]) {
      // We need to rewrite this line before showing it. Trigger the rewrite,
      // hold the advance, then resume.
      setRewriting(true);
      const speaker = nextLine.speaker;
      fetch("/api/lab/rewrite-line", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: speaker,
          originalLine: nextLine.text,
          userMessage: interventionFor,
          sceneDetail: scene.detail,
        }),
      })
        .then((r) => r.json())
        .then((j: { line?: string; error?: string }) => {
          if (j.line) {
            setRewrittenLines((prev) => ({ ...prev, [nextIdx]: j.line! }));
          }
          // Clear the intervention either way — we tried.
          setInterventions((prev) => {
            const copy = { ...prev };
            delete copy[String(speaker)];
            return copy;
          });
        })
        .catch(() => {
          // swallow — original line still plays
          setInterventions((prev) => {
            const copy = { ...prev };
            delete copy[String(speaker)];
            return copy;
          });
        })
        .finally(() => {
          setRewriting(false);
        });
      return;
    }

    const cur = dialogue[lineIdx];
    const ms = cur.duration_ms ?? 3500;
    const t = setTimeout(() => setLineIdx((i) => i + 1), ms);
    return () => clearTimeout(t);
  }, [lineIdx, paused, dialogue, interventions, rewrittenLines, rewriting, scene.detail]);

  // Keep the latest line visible
  useEffect(() => {
    if (!transcriptRef.current) return;
    transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [lineIdx]);

  const ended = lineIdx >= dialogue.length - 1 && !paused;
  const focusedChar =
    focused ? CHARACTERS.find((c) => c.name === focused) : null;

  function openAsk(name: CharacterName) {
    setPaused(true);
    setFocused(name);
  }

  function resume() {
    setFocused(null);
    setPaused(false);
  }

  /** Called from the FocusedAsk when the user sends a message during pause.
   *  We remember what they said — the next time this character speaks in
   *  the scene, the line gets rewritten to acknowledge it. */
  function recordIntervention(charName: CharacterName, userMessage: string) {
    setInterventions((prev) => ({ ...prev, [charName]: userMessage }));
  }

  function replay() {
    setLineIdx(0);
    setPaused(false);
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: loc.gradient.to }}
    >
      {/* hero photo */}
      {loc.image && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${loc.image})` }}
          aria-hidden
        />
      )}
      {/* tinted darkening */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${loc.gradient.from}b0 0%, ${
            loc.gradient.via ?? loc.gradient.from
          }cc 60%, ${loc.gradient.to}f4 100%)`,
        }}
      />
      {/* paper grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      {/* accent pendant */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "15%",
          top: "-100px",
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${loc.accent}40 0%, transparent 65%)`,
          filter: "blur(28px)",
        }}
      />

      {/* top bar — right padding clears the fixed AuthWidget */}
      <header className="relative z-10 px-5 sm:px-8 py-5 flex items-center justify-between pr-[64px] sm:pr-[180px] lg:pr-[200px]">
        <Link
          href={`/watch/${episode.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.18em] text-white/70 hover:text-white transition-colors"
        >
          ← back to scenes
        </Link>
        <p className="friends-line text-[11px] tracking-[0.22em] text-white/55 uppercase">
          S{episode.season}<span className="d">·</span>E{episode.number}
        </p>
      </header>

      {/* center stage — scene title + transcript */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-5 sm:px-10 pb-32 sm:pb-40">
        <p className="friends-line text-[11px] tracking-[0.2em] text-white/55 uppercase mb-2">
          {episode.title}
        </p>
        <h1
          className="font-[family-name:var(--font-marker)] text-white text-[22px] sm:text-[36px] lg:text-[44px] leading-tight text-center max-w-3xl mb-5 sm:mb-6"
          style={{ textShadow: "2px 3px 0 rgba(0,0,0,.4)" }}
        >
          {scene.title}
        </h1>

        {/* transcript — only the most recent ~4 lines are shown */}
        <div
          ref={transcriptRef}
          className="w-full max-w-2xl space-y-2 overflow-hidden mb-6"
          style={{ maxHeight: 240 }}
        >
          {dialogue.slice(0, lineIdx + 1).map((line, i) => {
            const isLatest = i === lineIdx;
            const speaker = CHARACTERS.find((c) => c.name === line.speaker);
            const rewritten = rewrittenLines[i];
            const text = rewritten ?? line.text;
            return (
              <div
                key={i}
                className="flex items-start gap-3 transition-opacity"
                style={{ opacity: isLatest ? 1 : 0.35 }}
              >
                <span
                  className="font-[family-name:var(--font-marker)] text-[16px] sm:text-[17px] shrink-0 w-[90px] sm:w-[110px] text-right pt-0.5"
                  style={{ color: speaker?.stroke ?? "#FFFFFF" }}
                >
                  {line.speaker === "off" ? "(off)" : line.speaker}
                </span>
                <span
                  className="text-white text-[15px] sm:text-[17px] leading-[1.4] flex-1"
                  style={{ textShadow: isLatest ? "1px 1px 0 rgba(0,0,0,.5)" : "none" }}
                >
                  {text}
                  {rewritten && (
                    <span
                      className="ml-2 inline-block align-middle text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                      style={{ background: `${loc.accent}33`, color: loc.accent }}
                    >
                      ↺ you nudged this
                    </span>
                  )}
                </span>
              </div>
            );
          })}
          {rewriting && (
            <div className="flex items-center gap-2 mt-2 text-[12px] text-white/60 font-mono uppercase tracking-wider">
              <span className="animate-type-dot inline-block w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="animate-type-dot inline-block w-1.5 h-1.5 rounded-full bg-white/60" style={{ animationDelay: "0.2s" }} />
              <span className="animate-type-dot inline-block w-1.5 h-1.5 rounded-full bg-white/60" style={{ animationDelay: "0.4s" }} />
              <span className="ml-1">they heard you…</span>
            </div>
          )}
        </div>

        {/* controls */}
        <div className="flex items-center gap-3">
          {ended ? (
            <button
              onClick={replay}
              type="button"
              className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-[13px] backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              ↻ replay scene
            </button>
          ) : (
            <button
              onClick={() => setPaused((p) => !p)}
              type="button"
              className="px-5 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-[13px] backdrop-blur-md hover:bg-white/20 transition-colors"
            >
              {paused ? "▶ play" : "⏸ pause"}
            </button>
          )}
        </div>

        {/* canon disclaimer */}
        <p className="mt-4 text-center text-[11px] italic text-white/45 max-w-md">
          Dialogue is canonical-style, adapted from the actual scene. Where a line is verbatim from the show, you can tell.
        </p>
      </div>

      {/* character chips — bottom dock */}
      <div className="relative z-10 pb-7 sm:pb-9 px-5">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-white/55 mb-3">
          pause + ask anyone in this scene
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap max-w-2xl mx-auto">
          {characters.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => openAsk(c.name)}
              className="flex items-center gap-2 px-2 pr-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-[13px] hover:bg-white/20 hover:border-white/40 transition-colors"
            >
              <CharacterMarker character={c} size={26} />
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* focused Q&A overlay */}
      {focusedChar && (
        <FocusedAsk
          character={focusedChar}
          scene={scene}
          locationId={locationId}
          recentLine={dialogue[lineIdx]}
          onSent={(msg) => recordIntervention(focusedChar.name, msg)}
          onClose={resume}
        />
      )}
    </div>
  );
}

/* ─── focused single-exchange Q&A overlay ─────────────────────────── */
function FocusedAsk({
  character,
  scene,
  locationId,
  recentLine,
  onSent,
  onClose,
}: {
  character: Character;
  scene: Scene;
  locationId: LocationId;
  recentLine?: { speaker: string; text: string };
  onSent?: (userMessage: string) => void;
  onClose: () => void;
}) {
  const loc = LOCATIONS[locationId];
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setReply("");
    setError(null);
    setStreaming(true);
    // Remember what the user said — the parent scene player will use this
    // to rewrite this character's next canonical line.
    onSent?.(text);
    let buf = "";
    try {
      for await (const chunk of streamChat(
        character.name,
        [{ role: "user", content: text }],
        { sceneContext: scene.detail },
      )) {
        if (chunk.error) {
          setError(chunk.error);
          break;
        }
        if (chunk.delta) {
          buf += chunk.delta;
          setReply(buf);
        }
        if (chunk.done) break;
      }
    } catch {
      setError("The gang is napping — try again in a moment.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-msg-in">
      {/* dim backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      <div
        className="relative w-full max-w-xl rounded-xl overflow-hidden border"
        style={{
          background: `linear-gradient(180deg, ${loc.gradient.from} 0%, ${loc.gradient.to} 100%)`,
          borderColor: `${loc.accent}55`,
        }}
      >
        <div className="px-5 sm:px-7 py-5 sm:py-6">
          <div className="flex items-start gap-3 mb-4">
            <CharacterMarker character={character} size={48} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-[16px] leading-tight">
                {character.name}
              </p>
              <p className="text-white/60 text-[12px] font-mono uppercase tracking-wider mt-0.5">
                paused mid-scene
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white text-[20px] leading-none px-2"
              aria-label="Resume scene"
              type="button"
            >
              ✕
            </button>
          </div>

          {recentLine && recentLine.speaker !== "off" && (
            <p
              className="text-white/80 italic text-[14px] leading-snug border-l-2 pl-3 mb-5"
              style={{ borderColor: loc.accent }}
            >
              &ldquo;{recentLine.text}&rdquo;
              <span className="block text-[11px] font-mono uppercase tracking-wider not-italic text-white/45 mt-1">
                — {recentLine.speaker} just said
              </span>
            </p>
          )}

          {reply && (
            <div
              className="mb-5 rounded-md px-4 py-3 text-white text-[15px] leading-relaxed"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: `1px solid ${loc.accent}33`,
              }}
            >
              {reply}
            </div>
          )}
          {error && (
            <p className="text-[13px] text-red-300 mb-4">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
            className="flex items-end gap-2 rounded-3xl bg-white/8 border border-white/15 px-2 py-1.5"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
              placeholder={`Ask ${character.name} something…`}
              rows={1}
              disabled={streaming}
              className="flex-1 bg-transparent outline-none px-3 py-2 text-white text-[15px] placeholder:text-white/40 resize-none max-h-[120px]"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50"
              style={{ background: loc.accent }}
              aria-label="Send"
            >
              <span className="text-white text-lg leading-none">↑</span>
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-white/45 max-w-[60%]">
              {reply
                ? `${character.name} will fold this into their next scene line.`
                : "what you say now will land in the scene when it resumes."}
            </p>
            <button
              onClick={onClose}
              type="button"
              className="text-[12px] font-mono uppercase tracking-wider text-white/70 hover:text-white transition-colors"
            >
              ▶ resume scene
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
