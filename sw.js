const CACHE = "havfood-pro-v11";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=11",
  "./script.js?v=11",
  "./actor.js?v=11",
  "./menu-data.js?v=8",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/havfood-logo.png",
  "./assets/actors/shah_rukh_khan.png",
  "./assets/actors/allu_arjun.png",
  "./assets/actors/mammootty.png",
  "./assets/actors/brahmanandam.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", e => {
  if (e.data === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", e => {
  // Only process GET requests; POST/PUT/DELETE bypass cache
  if (e.request.method !== "GET") return;

  // API calls are Network-First to guarantee latest shared database menus
  if (e.request.url.includes("/api/")) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets: Cache-First with fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && (e.request.url.startsWith("http://") || e.request.url.startsWith("https://"))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});

// Web Push event handler: receives notifications while app/browser is closed
self.addEventListener("push", e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    data = { body: e.data ? e.data.text() : "HAVFOOD meal reminder" };
  }

  const title = data.title || "HAVFOOD Reminder";
  const options = {
    body: data.body || "It's time for your campus dining meal!",
    icon: data.icon || "icons/icon-192.png",
    badge: data.badge || "icons/icon.svg",
    tag: data.tag || "havfood-alert",
    renotify: Boolean(data.renotify),
    data: data.data || { url: "./" }
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
