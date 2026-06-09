"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";

export function AuthWidgetClient({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    router.replace("/");
    router.refresh();
  }

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="fixed top-4 sm:top-5 right-5 sm:right-10 lg:right-14 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-1 sm:pl-1.5 sm:pr-3 sm:py-1.5 text-[13px] text-white hover:bg-white/20 hover:border-white/40 transition-colors shadow-sm"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Open menu for ${name}`}
      >
        <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-full bg-[color:var(--accent)] text-white flex items-center justify-center text-[12px] sm:text-[11px] font-medium">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[8rem] truncate">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-md bg-[color:var(--surface)] border border-[color:var(--border)] shadow-lg overflow-hidden text-[14px]"
        >
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[color:var(--fg)] hover:bg-[color:var(--bg)]"
          >
            Settings
          </Link>
          <Link
            href="/memories"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-[color:var(--fg)] hover:bg-[color:var(--bg)] border-t border-[color:var(--border)]"
          >
            What they remember
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="block w-full text-left px-3 py-2 text-[color:var(--fg)] hover:bg-[color:var(--bg)] border-t border-[color:var(--border)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
