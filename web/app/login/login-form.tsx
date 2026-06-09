"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Stage =
  | { kind: "enterEmail" }
  | { kind: "enterCode"; email: string }
  | { kind: "error"; message: string };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "enterEmail" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();
  const codeRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus the code input when the user moves to enterCode stage.
  useEffect(() => {
    if (stage.kind === "enterCode") {
      const t = setTimeout(() => codeRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [stage.kind]);

  function continueWithGoogle() {
    setError(null);
    setBusy(true);
    startTransition(async () => {
      try {
        const supabase = supabaseBrowser();
        const { error: e2 } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (e2) {
          setError(prettyAuthError(e2.message));
          setBusy(false);
        }
        // On success, supabase-js redirects the browser to Google. No return path here.
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
        setBusy(false);
      }
    });
  }

  function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setError(null);
    setBusy(true);
    startTransition(async () => {
      try {
        const supabase = supabaseBrowser();
        const { error: e2 } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: {
            // The email Supabase sends includes BOTH a 6-digit code AND a
            // tap-to-confirm link. The code is what the form below uses.
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (e2) {
          setError(prettyAuthError(e2.message));
          return;
        }
        setCode("");
        setStage({ kind: "enterCode", email: trimmed });
      } finally {
        setBusy(false);
      }
    });
  }

  function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (stage.kind !== "enterCode") return;
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setBusy(true);
    startTransition(async () => {
      try {
        const supabase = supabaseBrowser();
        const { error: e2 } = await supabase.auth.verifyOtp({
          email: stage.email,
          token: digits,
          type: "email",
        });
        if (e2) {
          setError(prettyAuthError(e2.message));
          return;
        }
        router.replace("/");
        router.refresh();
      } finally {
        setBusy(false);
      }
    });
  }

  if (stage.kind === "enterCode") {
    return (
      <div className="space-y-4">
        <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5">
          <p className="font-[family-name:var(--font-marker)] text-xl mb-1 text-[color:var(--fg)]">
            Check your inbox
          </p>
          <p className="text-[13px] text-[color:var(--muted)] leading-snug">
            We sent a 6-digit code to{" "}
            <span className="text-[color:var(--fg)] font-medium">{stage.email}</span>. Type it
            in here. (The email also has a tap-to-sign-in link if you'd rather use that.)
          </p>
        </div>

        <form onSubmit={verifyCode} className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
              6-digit code
            </span>
            <input
              ref={codeRef}
              type="text"
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md px-4 py-3 text-[24px] tracking-[0.4em] text-center font-mono text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)] transition-colors"
            />
          </label>
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-md transition-colors text-[15px]"
          >
            {busy ? "Signing you in…" : "Sign in"}
          </button>
          {error && (
            <p className="text-[13px] text-[color:var(--error)]">{error}</p>
          )}
        </form>

        <div className="flex items-center justify-between text-[12px]">
          <button
            type="button"
            onClick={() => {
              setStage({ kind: "enterEmail" });
              setCode("");
              setError(null);
            }}
            className="text-[color:var(--muted)] hover:text-[color:var(--accent)] underline"
          >
            Use a different email
          </button>
          <button
            type="button"
            onClick={() => sendCode()}
            disabled={busy}
            className="text-[color:var(--muted)] hover:text-[color:var(--accent)] underline disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={busy}
        className="w-full bg-white hover:bg-white/95 text-[#1F1F1F] font-medium py-3 rounded-md transition-colors text-[15px] flex items-center justify-center gap-3 disabled:opacity-60 border border-[color:var(--border)]"
      >
        <GoogleG />
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-[color:var(--border)]" />
        <span className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--muted)]">
          or
        </span>
        <div className="flex-1 h-px bg-[color:var(--border)]" />
      </div>

      <form onSubmit={sendCode} className="space-y-3">
        <label className="block">
          <span className="block text-[12px] font-mono uppercase tracking-wider text-[color:var(--muted)] mb-1.5">
            Your email
          </span>
          <input
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="rachel@central-perk.com"
            className="w-full bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md px-4 py-3 text-[15px] text-[color:var(--fg)] placeholder:text-[color:var(--muted)] focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)] transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="w-full bg-[color:var(--accent)] hover:bg-[color:var(--accent)]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-md transition-colors text-[15px]"
        >
          {busy ? "Sending…" : "Send me a 6-digit code"}
        </button>
        {error && (
          <p className="text-[13px] text-[color:var(--error)]">{error}</p>
        )}
      </form>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function prettyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("token has expired") || m.includes("expired")) {
    return "That code expired. Tap 'Resend code' to get a new one.";
  }
  if (m.includes("invalid") && (m.includes("token") || m.includes("otp"))) {
    return "That code didn't match. Check the latest email and try again.";
  }
  if (m.includes("rate limit") || m.includes("too many") || m.includes("over the limit")) {
    return "Too many tries in a short window. Wait a minute and try again.";
  }
  return msg;
}
