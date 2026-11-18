const CACHE = "dinely-pwa-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css?v=15",
  "./script.js?v=15",
  "./meal-banner.js?v=15",
  "./menu-data.js?v=8",
  "./manifest.json",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/icon-maskable-192.png",
  "./icons/icon-maskable-512.png"
];

// Install: Cache critical core shell assets and skip waiting safely
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => {
        console.warn("[SW] Cache addAll warning:", err);
        return self.skipWaiting();
      })
  );
});

// Activate: Clean up only obsolete caches, claim clients immediately
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if ((k.startsWith("havfood-") || k.startsWith("dinely-")) && k !== CACHE) {
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Message listener for skipWaiting trigger from update banner
self.addEventListener("message", e => {
  if (e.data === "skipWaiting") {
    self.skipWaiting();
  }
});

// Fetch event handler
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // 1. API calls: Network-First with Cache Fallback
  if (url.pathname.includes("/api/")) {
    e.respondWith(
      fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // 2. Navigation / HTML Document requests: Network-First with Cache Fallback
  const isNavigation = e.request.mode === "navigate" ||
                       (e.request.headers.get("accept") && e.request.headers.get("accept").includes("text/html"));

  if (isNavigation) {
    e.respondWith(
      fetch(e.request).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const copy = networkRes.clone();
          caches.open(CACHE).then(c => {
            c.put(e.request, copy);
            c.put("./index.html", copy.clone());
            c.put("./", copy.clone());
          });
        }
        return networkRes;
      }).catch(async () => {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        const indexCached = await caches.match("./index.html");
        if (indexCached) return indexCached;
        return caches.match("./");
      })
    );
    return;
  }

  // 3. Versioned Static Assets: Cache-First with Network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && (e.request.url.startsWith("http://") || e.request.url.startsWith("https://"))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => {
        if (e.request.destination === "image") {
          return caches.match("./icons/icon-192.png");
        }
      });
    })
  );
});

// Web Push event handler
self.addEventListener("push", e => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    data = { body: e.data ? e.data.text() : "DINELY meal reminder" };
  }

  const title = data.title || "DINELY Reminder";
  const options = {
    body: data.body || "It's time for your campus dining meal!",
    icon: data.icon || "icons/icon-192.png",
    badge: data.badge || "icons/icon.svg",
    tag: data.tag || "dinely-alert",
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
