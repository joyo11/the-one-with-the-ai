/* The One With the AI — service worker.
 * Receives push notifications and routes taps to the chat with the sending
 * character. Kept intentionally minimal — no offline caching for now. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: "The One With the AI", body: event.data && event.data.text() };
  }

  const title = payload.title || "Someone's texting you";
  const body = payload.body || "Open the app to see who.";
  const url = payload.url || "/";
  const character = payload.character || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: character ? `char-${character}` : "general",
      renotify: true,
      data: { url, character },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.url || "/";

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        // Already-open window? Focus and navigate it.
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target).catch(() => {});
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});
