"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, type Character } from "@/lib/characters";
import {
  streamChat,
  fetchWatch,
  type ChatMessage,
  type WatchOption,
} from "@/lib/api";
import { CharacterMarker } from "@/components/character-marker";
import { CouchIcon } from "@/components/svgs";
import { getScene } from "@/lib/episodes";
import { ChatBackground } from "@/components/chat-background";
import { CHARACTER_LOCATION, LOCATIONS } from "@/lib/locations";
import { SceneHero } from "@/components/scene-hero";

interface Props {
  character: Character;
}

interface RailProps {
  current: Character;
  onPick?: () => void;
}

function CharacterRail({ current, onPick }: RailProps) {
  return (
    <aside
      className="w-[260px] sm:w-[280px] shrink-0 h-full bg-surface flex flex-col"
      style={{ borderRight: "1px solid var(--border)" }}
    >
      <div
        className="px-5 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link
          href="/"
          className="font-marker text-fg text-[22px] flex items-center"
        >
          F<span style={{ color: "#F87171" }}>•</span>R
          <span style={{ color: "#60A5FA" }}>•</span>I
          <span style={{ color: "#FBBF24" }}>•</span>E
          <span style={{ color: "#F87171" }}>•</span>N
          <span style={{ color: "#60A5FA" }}>•</span>D
          <span style={{ color: "#FBBF24" }}>•</span>S
        </Link>
        <p className="font-sans text-[11px] text-muted">the one with the AI</p>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {CHARACTERS.map((c) => {
          const on = c.name === current.name;
          return (
            <Link
              key={c.name}
              href={`/chat/${c.name.toLowerCase()}`}
              onClick={onPick}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                on ? "bg-bg" : "hover:bg-black/5"
              }`}
              style={
                on ? { boxShadow: "inset 0 0 0 1px var(--border)" } : undefined
              }
            >
              <CharacterMarker character={c} size={40} />
              <div className="min-w-0">
                <p className="font-sans font-semibold text-[14px] text-fg leading-tight">
                  {c.name}
                </p>
                <p className="font-sans text-[12px] text-muted truncate">
                  {c.tag}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
        <Link
          href="/game"
          className="block w-full font-sans font-semibold text-fg border border-border rounded-full py-2.5 text-[13px] text-center hover:bg-accent hover:text-white hover:border-accent transition-colors"
        >
          Play Guess Who
        </Link>
      </div>
    </aside>
  );
}

function WhereToWatch({ character }: { character: Character }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<WatchOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (!open || options || loading) return;
    setLoading(true);
    fetchWatch(character.name)
      .then((d) => setOptions(d.options))
      .catch(() => setOptions([]))
      .finally(() => setLoading(false));
  }, [open, options, loading, character.name]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`font-sans font-semibold text-[12px] sm:text-[13px] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors ${
          open
            ? "text-white bg-accent border border-accent"
            : "text-fg border border-border hover:bg-accent hover:text-white hover:border-accent"
        }`}
      >
        <span className="hidden sm:inline">Where to watch ▾</span>
        <span className="sm:hidden">Watch ▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-20 w-[240px] rounded-xl bg-surface shadow-xl overflow-hidden animate-toast-in"
          style={{ border: "1px solid var(--border)" }}
        >
          <p className="px-4 pt-3 pb-2 font-mono text-[11px] text-muted">
            Friends · where to watch
          </p>
          {loading && (
            <p className="px-4 py-3 font-sans text-[13px] text-muted">
              Loading…
            </p>
          )}
          {!loading && options?.length === 0 && (
            <a
              href="https://www.justwatch.com/us/tv-show/friends"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2.5 font-sans text-[14px] text-fg hover:bg-bg"
            >
              Find on JustWatch ↗
            </a>
          )}
          {options?.map((o) => (
            <a
              key={o.service}
              href={o.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2.5 hover:bg-bg transition-colors"
            >
              <span className="font-sans text-[14px] text-fg font-medium">
                {o.service}
              </span>
              <span
                className={`font-mono text-[11px] ${
                  o.type === "stream" ? "text-accent" : "text-muted"
                }`}
              >
                {o.type}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Bubble({
  m,
  character,
  index,
  isLastAssistant,
  streaming,
  userBubbleStyle,
}: {
  m: ChatMessage & { failed?: boolean };
  character: Character;
  index: number;
  isLastAssistant?: boolean;
  streaming?: boolean;
  userBubbleStyle?: { background: string; border: string; text: string };
}) {
  // Animate in only on first mount of new bubbles — once committed don't
  // re-animate on every content update.
  const animate = index >= 0;
  const delay = `${Math.min(index, 6) * 0.06}s`;
  if (m.role === "assistant") {
    const empty = !m.content;
    return (
      <div
        className={animate ? "flex gap-2 sm:gap-3 items-end animate-msg-in" : "flex gap-2 sm:gap-3 items-end"}
        style={{ animationDelay: delay }}
      >
        <CharacterMarker character={character} size={36} className="sm:!w-10 sm:!h-10" />
        <div className="max-w-[78%] sm:max-w-[460px]">
          <div
            className="rounded-2xl rounded-bl-md px-4 py-3 bg-surface text-fg font-sans text-[15px] leading-[1.6] min-h-[44px] flex items-center"
            style={{
              borderLeft: `3px solid ${character.stroke}`,
              borderTop: "1px solid var(--border)",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {empty && isLastAssistant && streaming ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0s" }} />
                <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0.2s" }} />
                <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0.4s" }} />
              </span>
            ) : (
              <span className="whitespace-pre-wrap">{m.content}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="flex gap-3 items-end justify-end animate-msg-in"
      style={{ animationDelay: delay }}
    >
      <div className="max-w-[78%] sm:max-w-[460px]">
        <div
          className="rounded-2xl rounded-br-md px-4 py-3 font-sans text-[15px] leading-[1.6] backdrop-blur-sm"
          style={
            userBubbleStyle
              ? {
                  background: m.failed
                    ? "rgba(220, 38, 38, 0.18)"
                    : userBubbleStyle.background,
                  border: `1px solid ${m.failed ? "var(--error)" : userBubbleStyle.border}`,
                  color: userBubbleStyle.text,
                }
              : {
                  background: "var(--surface)",
                  border: `1px solid ${m.failed ? "var(--error)" : "var(--border)"}`,
                  color: "var(--fg)",
                }
          }
        >
          {m.content}
        </div>
        {m.failed && (
          <div className="flex items-center justify-end gap-2 mt-1.5">
            <span className="font-mono text-[11px] text-error">
              Couldn&apos;t send
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingBubble({ character }: { character: Character }) {
  return (
    <div className="flex gap-2 sm:gap-3 items-end">
      <CharacterMarker character={character} size={36} className="sm:!w-10 sm:!h-10" />
      <div
        className="rounded-2xl rounded-bl-md px-5 py-4 bg-surface inline-flex items-center gap-1.5"
        style={{ border: "1px solid var(--border)" }}
      >
        <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0s" }} />
        <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0.2s" }} />
        <span className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent" style={{ animationDelay: "0.4s" }} />
      </div>
    </div>
  );
}

function EmptyState({ character }: { character: Character }) {
  return (
    <div className="min-h-[60vh] flex-1 flex flex-col items-center justify-center text-center px-4 py-6 gap-6">
      <p
        className="font-[family-name:var(--font-marker)] text-white text-[28px] sm:text-[36px] leading-tight max-w-md"
        style={{ textShadow: "2px 2px 0 rgba(0,0,0,.45)" }}
      >
        {character.entry}
      </p>
      <div className="flex gap-3 items-end max-w-[460px]">
        <CharacterMarker character={character} size={40} />
        <div
          className="rounded-2xl rounded-bl-md px-4 py-3 bg-surface text-fg font-sans text-[14px] sm:text-[15px] leading-[1.6] text-left"
          style={{
            borderLeft: `3px solid ${character.stroke}`,
            borderTop: "1px solid var(--border)",
            borderRight: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {character.welcome}
        </div>
      </div>
    </div>
  );
}

export function ChatShell({ character }: Props) {
  const [history, setHistory] = useState<
    Array<ChatMessage & { failed?: boolean }>
  >([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Typewriter buffer — full incoming text accumulates here; streamingText
  // catches up frame-by-frame so the reveal feels paced even when SSE deltas
  // arrive in bursts. displayedRef mirrors streamingText for outside-React
  // reads (used by the drain loop after the stream ends).
  const bufferRef = useRef<string>("");
  const displayedRef = useRef<string>("");
  const rafRef = useRef<number | null>(null);

  // If we came from /watch/<ep>/<scene>, ground the chat in that moment.
  const search = useSearchParams();
  const sceneRef = useMemo(() => {
    const ep = search?.get("ep");
    const sc = search?.get("scene");
    if (!ep || !sc) return null;
    return getScene(ep, sc);
  }, [search]);
  const sceneContext = sceneRef?.scene.detail ?? "";

  // Each character lives somewhere — apt 20, apt 19, ross's, central perk.
  const locationId = CHARACTER_LOCATION[character.name] ?? "monicas";
  const location = LOCATIONS[locationId];

  // Reveal characters at ~80 chars/sec — fast enough to never feel sluggish,
  // slow enough to read along. Writes directly into the last assistant bubble
  // in history so the same DOM node updates throughout (no unmount = no flicker).
  const startTypewriter = useCallback(() => {
    if (rafRef.current !== null) return;
    let lastTime = performance.now();
    const tick = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      const target = bufferRef.current;
      const cur = displayedRef.current;
      if (cur !== target) {
        const lag = target.length - cur.length;
        const baseCps = 80;
        const cps = lag > 80 ? Math.min(400, baseCps + lag * 2) : baseCps;
        const step = Math.max(1, Math.round((cps * dt) / 1000));
        const next = target.slice(0, cur.length + step);
        displayedRef.current = next;
        setHistory((h) => {
          if (h.length === 0) return h;
          const last = h[h.length - 1];
          if (last.role !== "assistant") return h;
          if (last.content === next) return h;
          const copy = h.slice();
          copy[copy.length - 1] = { ...last, content: next };
          return copy;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTypewriter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => stopTypewriter, [stopTypewriter]);

  // Load any unread proactive messages from this character and surface them
  // at the top of the thread — the in-app "inbox" for texts the gang sent
  // while the user was away. Marks them read on display.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { supabaseBrowser } = await import("@/lib/supabase/client");
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data: pending } = await supabase
          .from("scheduled_touches")
          .select("id, message, sent_at")
          .eq("user_id", user.id)
          .eq("character", character.name)
          .is("read_at", null)
          .not("sent_at", "is", null)
          .not("message", "is", null)
          .order("sent_at", { ascending: true })
          .limit(5);
        if (!pending || pending.length === 0 || cancelled) return;
        setHistory((h) => [
          ...pending.map((p) => ({
            role: "assistant" as const,
            content: p.message as string,
          })),
          ...h,
        ]);
        await supabase
          .from("scheduled_touches")
          .update({ read_at: new Date().toISOString() })
          .in("id", pending.map((p) => p.id));
      } catch {
        /* swallow — inbox load failures shouldn't block normal chat */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [character.name]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, streaming, streamingText]);

  // Auto-grow the textarea up to a max of ~6 lines, then scroll inside.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drawerOpen]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newUser: ChatMessage = { role: "user", content: text };
    const next = [...history, newUser];
    // Append the user message AND an empty assistant placeholder up front.
    // The typewriter writes into the placeholder as deltas arrive; while the
    // placeholder's content is empty, the Bubble renders three typing dots
    // inside it. The bubble never unmounts → no flicker, dots always visible
    // during the waiting moment.
    setHistory([...next, { role: "assistant", content: "" }]);
    setStreaming(true);
    bufferRef.current = "";
    displayedRef.current = "";
    startTypewriter();
    try {
      for await (const chunk of streamChat(character.name, next, {
        sceneContext: sceneContext || undefined,
      })) {
        if (chunk.error) {
          setToast(chunk.error);
          stopTypewriter();
          bufferRef.current = "";
          displayedRef.current = "";
          setHistory((h) => {
            const copy = h.slice();
            // Drop the empty assistant placeholder.
            if (copy.length && copy[copy.length - 1].role === "assistant" && !copy[copy.length - 1].content) {
              copy.pop();
            }
            // Mark the user message as failed.
            for (let i = copy.length - 1; i >= 0; i--) {
              if (copy[i].role === "user") {
                copy[i] = { ...copy[i], failed: true };
                break;
              }
            }
            return copy;
          });
          setStreaming(false);
          return;
        }
        if (chunk.delta) {
          bufferRef.current += chunk.delta;
        }
        if (chunk.done) break;
      }
      // Drain — wait for the typewriter to reveal everything.
      const final = bufferRef.current;
      while (final !== "" && displayedRef.current !== final) {
        await new Promise((r) => requestAnimationFrame(() => r(undefined)));
      }
      // Final flush — make sure the bubble has the exact final text.
      setHistory((h) => {
        if (h.length === 0) return h;
        const last = h[h.length - 1];
        if (last.role !== "assistant") return h;
        if (last.content === final) return h;
        const copy = h.slice();
        copy[copy.length - 1] = { ...last, content: final };
        return copy;
      });
      stopTypewriter();
      displayedRef.current = "";
      bufferRef.current = "";
    } catch {
      setToast("The gang is napping for a sec — try again in a moment.");
      stopTypewriter();
      bufferRef.current = "";
      displayedRef.current = "";
      // Drop the empty placeholder if the stream never reached us.
      setHistory((h) => {
        if (h.length && h[h.length - 1].role === "assistant" && !h[h.length - 1].content) {
          return h.slice(0, -1);
        }
        return h;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, history, streaming, character.name, sceneContext, startTypewriter, stopTypewriter]);

  return (
    <div className="h-[100dvh] flex bg-bg" style={{ overflow: "hidden" }}>
      {/* Desktop rail */}
      <div className="hidden md:flex h-full">
        <CharacterRail current={character} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <button
            className="md:hidden fixed inset-0 z-30 bg-black/50"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="md:hidden fixed left-0 top-0 bottom-0 z-40 animate-msg-in">
            <CharacterRail current={character} onPick={() => setDrawerOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — right padding leaves room for the fixed AuthWidget
            (small avatar on mobile, full pill on desktop) */}
        <header
          className="shrink-0 flex items-center gap-2 sm:gap-3 px-4 sm:px-7 py-3 sm:py-4 bg-surface relative pr-[64px] sm:pr-[180px] lg:pr-[200px]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <button
            className="md:hidden text-fg text-[22px] leading-none w-9 h-9 flex items-center justify-center rounded-md hover:bg-black/5"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link
            href="/"
            className="hidden md:flex text-muted text-[20px] leading-none px-1"
            aria-label="Back"
          >
            ‹
          </Link>
          <CharacterMarker character={character} size={40} className="sm:!w-11 sm:!h-11" />
          <div className="flex-1 min-w-0">
            <p className="font-sans font-bold text-[15px] sm:text-[16px] text-fg leading-tight truncate">
              {character.name}
            </p>
            <p className="font-sans text-[11px] sm:text-[12px] text-muted flex items-center gap-1.5 truncate">
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: location.accent }} />
              <span className="hidden sm:inline whitespace-nowrap">at {location.name} · {location.subtitle}</span>
              <span className="sm:hidden whitespace-nowrap">{location.name}</span>
            </p>
          </div>
          <WhereToWatch character={character} />
        </header>

        {/* The slim banner used to live here; when arriving from /watch we
            now render a full cinematic hero at the top of the scroll area
            (see below) instead, so the visit feels different from a regular
            chat opening. */}
        {toast && (
          <div className="px-4 sm:px-7 pt-3">
            <div
              className="animate-toast-in flex items-start gap-3 rounded-xl bg-surface px-4 py-3"
              style={{
                border: "1px solid var(--border)",
                borderLeft: "4px solid var(--error)",
              }}
            >
              <span className="text-error mt-0.5">✕</span>
              <div className="flex-1">
                <p className="font-sans font-semibold text-[14px] text-fg">
                  {toast?.toLowerCase().includes("overloaded") || toast?.toLowerCase().includes("backend")
                    ? "The gang is napping for a sec"
                    : "Whoa, slow down there, Joey."}
                </p>
                <p className="font-sans text-[13px] text-muted leading-snug mt-0.5">
                  {toast}
                </p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-muted hover:text-fg text-[16px] leading-none"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Backdrop lives OUTSIDE the scroll container so it stays put as
            the conversation grows. The scroll container is transparent on
            top of it. */}
        <div className="flex-1 relative overflow-hidden">
          <ChatBackground
            locationId={locationId}
            overrideImage={character.portrait}
            overrideImagePosition={character.portraitPosition}
            overrideImageSize={character.portraitSize}
          />
          <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
            {sceneRef && (
              <div className="relative z-10">
                <SceneHero
                  episode={sceneRef.episode}
                  scene={sceneRef.scene}
                  locationId={locationId}
                />
              </div>
            )}
            <div className={`relative z-10 min-h-full flex flex-col px-4 sm:px-8 ${sceneRef ? "pt-5" : "pt-5 sm:pt-7"} pb-8 sm:pb-12 ${history.length === 0 ? "" : "space-y-4 sm:space-y-5"}`}>
              {history.length === 0 && !sceneRef ? (
                <EmptyState character={character} />
              ) : history.length === 0 && sceneRef ? null : (
                history.map((m, i) => {
                  const isLastAssistant =
                    m.role === "assistant" && i === history.length - 1;
                  return (
                    <Bubble
                      key={i}
                      m={m}
                      character={character}
                      index={i}
                      isLastAssistant={isLastAssistant}
                      streaming={streaming}
                      userBubbleStyle={location.userBubble}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Composer with iOS safe-area padding */}
        <div
          className="shrink-0 p-3 sm:p-4 bg-surface"
          style={{
            borderTop: "1px solid var(--border)",
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 rounded-3xl bg-bg px-2 py-2"
            style={{ border: "1px solid var(--border)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                // Enter = send. Shift+Enter (or ⌘/Ctrl+Enter) inserts a newline.
                if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Say something to ${character.name}…`}
              rows={1}
              className="flex-1 bg-transparent outline-none px-3 py-2 font-sans text-[15px] text-fg placeholder:text-muted resize-none overflow-y-auto leading-[1.4] max-h-[160px]"
              disabled={streaming}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center active:scale-[0.96] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontSize: 18 }}
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
