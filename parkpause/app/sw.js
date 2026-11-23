// ParkPause Service Worker: nur Push-Nachrichten. Kein Zwischenspeicher, damit nie alte und neue Version gemischt laufen.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "ParkPause", {
    body: d.body || "", icon: "../icon-192.png", badge: "../icon-192.png", data: { url: "./#inbox" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { c.navigate(e.notification.data.url).catch(() => {}); return c.focus(); } }
    return self.clients.openWindow(e.notification.data.url);
  })());
});
