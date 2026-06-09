"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHARACTERS, type Character } from "@/lib/characters";
import { CharacterMarker } from "@/components/character-marker";
import { Bean, CouchIcon } from "@/components/svgs";

function PickerCard({ c, unread }: { c: Character; unread: number }) {
  return (
    <Link
      href={`/chat/${c.name.toLowerCase()}`}
      className="ccard sketch-frame relative"
      style={{ width: 280, height: 300 }}
      aria-label={`Chat with ${c.name}${unread ? ` (${unread} new)` : ""}`}
    >
      <svg className="sketch" viewBox="0 0 292 312" preserveAspectRatio="none">
        <rect x="6" y="6" width="280" height="300" rx="10" />
      </svg>
      {unread > 0 && (
        <span
          className="absolute top-3 right-3 inline-flex items-center justify-center bg-[color:var(--accent)] text-white font-sans font-bold rounded-full"
          style={{ minWidth: 24, height: 24, padding: "0 8px", fontSize: 12 }}
          aria-hidden
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
      <CharacterMarker character={c} size={86} />
      <p
        className="font-sans font-bold text-fg"
        style={{ fontSize: 22, marginTop: 16 }}
      >
        {c.name}
      </p>
      <p
        className="font-sans text-muted"
        style={{ fontSize: 14, marginTop: 4 }}
      >
        {c.tag}
      </p>
      <span
        className="font-sans font-bold text-accent mt-auto"
        style={{ fontSize: 15, paddingTop: 14 }}
      >
        {unread > 0 ? "You have a text →" : "Chat →"}
      </span>
    </Link>
  );
}

function useUnreadCounts(): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      try {
        const { supabaseBrowser } = await import("@/lib/supabase/client");
        const supabase = supabaseBrowser();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("scheduled_touches")
          .select("character")
          .eq("user_id", user.id)
          .is("read_at", null)
          .not("sent_at", "is", null)
          .not("message", "is", null);
        if (!data) return;
        const next: Record<string, number> = {};
        for (const row of data as Array<{ character: string }>) {
          next[row.character] = (next[row.character] ?? 0) + 1;
        }
        setCounts(next);
      } catch {
        /* anonymous users (no session) — leave counts empty */
      }
    })();
  }, []);
  return counts;
}

/**
 * "Pull up a chair — who do you want to talk to?"
 * 6 hand-sketched character cards in 3 columns. Scattered bean
 * doodles + small couch icons in the corners.
 */
export function LandingPicker() {
  const unread = useUnreadCounts();
  return (
    <section
      id="picker"
      className="grain relative bg-bg"
      style={{ overflow: "hidden" }}
    >
      <Bean
        className="doodle"
        style={{
          position: "absolute",
          top: 46,
          left: 60,
          width: 54,
          transform: "rotate(-12deg)",
        }}
      />
      <Bean
        className="doodle"
        style={{
          position: "absolute",
          top: 90,
          left: 128,
          width: 40,
          transform: "rotate(20deg)",
        }}
      />
      <CouchIcon
        className="doodle"
        style={{
          position: "absolute",
          top: 60,
          right: 74,
          width: 58,
          color: "var(--accent)",
          opacity: 0.4,
        }}
      />
      <div
        className="relative flex flex-col items-center pt-16 pb-14 px-12 mx-auto"
        style={{ maxWidth: 1440 }}
      >
        <p className="font-marker text-accent text-[24px]">pull up a chair</p>
        <h2 className="font-marker text-fg text-[52px] leading-none mt-1 text-center">
          Who do you want to talk to?
        </h2>
        <p className="font-sans text-[17px] text-muted mt-4 max-w-[560px] text-center leading-relaxed">
          Six friends, waiting on the couch. Each one sounds just like the show
          — sarcastic, dramatic, smelly-cat-singing and all.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {CHARACTERS.map((c) => (
            <PickerCard key={c.name} c={c} unread={unread[c.name] ?? 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
