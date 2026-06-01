"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHARACTERS, BY_SLUG, type Character } from "@/lib/characters";
import {
  streamChat,
  fetchWatch,
  type ChatMessage,
  type WatchOption,
} from "@/lib/api";
import { CharacterMarker } from "@/components/character-marker";
import { CouchIcon } from "@/components/svgs";

interface Props {
  character: Character;
}

function CharacterRail({ current }: { current: Character }) {
  return (
    <aside
      className="w-[280px] shrink-0 h-full bg-surface flex flex-col"
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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Lazy-load options the first time the dropdown opens
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
        className={`font-sans font-semibold text-[13px] rounded-full px-4 py-2 transition-colors ${
          open
            ? "text-white bg-accent border border-accent"
            : "text-fg border border-border hover:bg-accent hover:text-white hover:border-accent"
        }`}
      >
        Where to watch ▾
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
}: {
  m: ChatMessage & { failed?: boolean };
  character: Character;
  index: number;
}) {
  const delay = `${index * 0.08}s`;
  if (m.role === "assistant") {
    return (
      <div
        className="flex gap-3 items-end animate-msg-in"
        style={{ animationDelay: delay }}
      >
        <CharacterMarker character={character} size={40} />
        <div className="max-w-[460px]">
          <div
            className="rounded-2xl rounded-bl-md px-4 py-3 bg-surface text-fg font-sans text-[15px] leading-[1.6]"
            style={{
              borderLeft: `3px solid ${character.stroke}`,
              borderTop: "1px solid var(--border)",
              borderRight: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            {m.content || "…"}
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
      <div className="max-w-[460px]">
        <div
          className="rounded-2xl rounded-br-md px-4 py-3 bg-surface text-fg font-sans text-[15px] leading-[1.6]"
          style={{
            border: `1px solid ${m.failed ? "var(--error)" : "var(--border)"}`,
          }}
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
    <div className="flex gap-3 items-end">
      <CharacterMarker character={character} size={40} />
      <div
        className="rounded-2xl rounded-bl-md px-5 py-4 bg-surface inline-flex items-center gap-1.5"
        style={{ border: "1px solid var(--border)" }}
      >
        <span
          className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent"
          style={{ animationDelay: "0.2s" }}
        />
        <span
          className="animate-type-dot inline-block w-2 h-2 rounded-full bg-accent"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    </div>
  );
}

function EmptyState({ character }: { character: Character }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <CouchIcon style={{ width: 54, color: "var(--accent)" }} />
      <p className="font-marker text-fg text-[30px] mt-5 leading-tight">
        the couch is empty —<br />
        sit down.
      </p>
      <div className="mt-8 flex gap-3 items-end max-w-[480px]">
        <CharacterMarker character={character} size={40} />
        <div
          className="rounded-2xl rounded-bl-md px-4 py-3 bg-surface text-fg font-sans text-[15px] leading-[1.6] text-left"
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
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newUser: ChatMessage = { role: "user", content: text };
    const next = [...history, newUser];
    setHistory(next);
    setStreaming(true);

    // Add a placeholder assistant message we mutate as deltas arrive
    setHistory((h) => [...h, { role: "assistant", content: "" }]);
    let buf = "";
    try {
      for await (const chunk of streamChat(character.name, next)) {
        if (chunk.error) {
          setToast(chunk.error);
          // Mark the last user message as failed
          setHistory((h) => {
            const copy = h.slice();
            // remove the empty assistant placeholder
            if (
              copy.length &&
              copy[copy.length - 1].role === "assistant" &&
              !copy[copy.length - 1].content
            ) {
              copy.pop();
            }
            // mark the prior user message as failed
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
          buf += chunk.delta;
          setHistory((h) => {
            const copy = h.slice();
            const last = copy[copy.length - 1];
            if (last && last.role === "assistant") {
              copy[copy.length - 1] = { ...last, content: buf };
            }
            return copy;
          });
        }
        if (chunk.done) break;
      }
    } catch (e) {
      setToast(
        `Can't reach the chat server. Make sure it's running on port 8000.`,
      );
    } finally {
      setStreaming(false);
    }
  }, [input, history, streaming, character.name]);

  return (
    <div className="h-screen flex bg-bg" style={{ overflow: "hidden" }}>
      <CharacterRail current={character} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="shrink-0 flex items-center gap-3 px-7 py-4 bg-surface relative"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <Link
            href="/"
            className="text-muted text-[20px] leading-none px-1"
            aria-label="Back"
          >
            ‹
          </Link>
          <CharacterMarker character={character} size={44} />
          <div className="flex-1">
            <p className="font-sans font-bold text-[16px] text-fg leading-tight">
              {character.name}
            </p>
            <p className="font-sans text-[12px] text-muted flex items-center gap-1.5">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--success)" }}
              />
              grounded · in character
            </p>
          </div>
          <WhereToWatch character={character} />
        </header>

        {/* Toast */}
        {toast && (
          <div className="px-7 pt-3">
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
                  Whoa, slow down there, Joey.
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

        {/* Thread */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto grain relative bg-bg"
        >
          <div className="h-full px-8 py-7 space-y-5">
            {history.length === 0 ? (
              <EmptyState character={character} />
            ) : (
              history.map((m, i) => (
                <Bubble key={i} m={m} character={character} index={i} />
              ))
            )}
            {streaming &&
              history[history.length - 1]?.role === "assistant" &&
              !history[history.length - 1]?.content && (
                <TypingBubble character={character} />
              )}
          </div>
        </div>

        {/* Composer */}
        <div
          className="shrink-0 p-4 bg-surface"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2 rounded-full bg-bg px-2 py-2"
            style={{ border: "1px solid var(--border)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Say something to ${character.name}…`}
              className="flex-1 bg-transparent outline-none px-3 font-sans text-[15px] text-fg placeholder:text-muted"
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
