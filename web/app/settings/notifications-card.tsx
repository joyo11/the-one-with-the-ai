"use client";

import { useEffect, useState } from "react";

type Status = "loading" | "off" | "on" | "denied" | "unsupported";

function urlBase64ToBytes(b64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buf = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

export function NotificationsCard({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub && initiallyEnabled) setStatus("on");
        else if (initiallyEnabled) setStatus("on"); // server says on; SW might be re-registering
        else setStatus("off");
      } catch {
        setStatus("off");
      }
    })();
  }, [initiallyEnabled]);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBytes(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        }));
      const json = sub.toJSON();
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${r.status}`);
      }
      setStatus("on");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[color:var(--surface)] border border-[color:var(--border)] rounded-md p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="font-[family-name:var(--font-marker)] text-xl text-[color:var(--fg)] mb-1">
            Texts from the gang
          </h2>
          <p className="text-[13px] text-[color:var(--muted)]">
            Let them text you first when they think of you — Phoebe at 11pm,
            Monica at 9am, etc. Tap a notification to reply.
          </p>
        </div>
        <Toggle status={status} busy={busy} onEnable={enable} onDisable={disable} />
      </div>
      {status === "on" && <TestButton />}
      {status === "denied" && (
        <p className="mt-3 text-[12px] text-[color:var(--error)]">
          You blocked notifications in this browser. Re-enable them in your
          browser site settings, then come back.
        </p>
      )}
      {status === "unsupported" && (
        <p className="mt-3 text-[12px] text-[color:var(--muted)]">
          This browser doesn't support web push. Try Chrome, Safari (iOS 16.4+),
          or Firefox.
        </p>
      )}
      {error && <p className="mt-3 text-[12px] text-[color:var(--error)]">{error}</p>}
    </div>
  );
}

function TestButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="mt-4">
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setResult(null);
          try {
            const r = await fetch("/api/push/test", { method: "POST" });
            const j = await r.json();
            if (!r.ok) setResult(`✗ ${j.error || `HTTP ${r.status}`}`);
            else
              setResult(
                `✓ ${j.character} just texted you — open their chat to see it. (Also pushed to your device.)`,
              );
          } catch (e) {
            setResult(`✗ ${e instanceof Error ? e.message : "failed"}`);
          } finally {
            setBusy(false);
          }
        }}
        className="text-[13px] px-3 py-1.5 rounded-md bg-[color:var(--bg)] border border-[color:var(--border)] hover:border-[color:var(--accent)] text-[color:var(--fg)] transition-colors disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send me a test text"}
      </button>
      {result && (
        <p className="mt-2 text-[12px] text-[color:var(--muted)]">{result}</p>
      )}
    </div>
  );
}

function Toggle({
  status,
  busy,
  onEnable,
  onDisable,
}: {
  status: Status;
  busy: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const enabled = status === "on";
  const disabled = busy || status === "loading" || status === "denied" || status === "unsupported";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={enabled ? onDisable : onEnable}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
        enabled ? "bg-[color:var(--accent)]" : "bg-[color:var(--border)]",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition",
          enabled ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
