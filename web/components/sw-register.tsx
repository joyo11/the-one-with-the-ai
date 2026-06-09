"use client";

import { useEffect } from "react";

/** Registers the service worker once on app load. Quiet on every error —
 *  the SW is only required for push; everything else works without it. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    const ctrl = new AbortController();
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        /* swallow — SW failures shouldn't break the app */
      });
    return () => ctrl.abort();
  }, []);
  return null;
}
