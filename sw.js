const CACHE="havfood-pro-v5";
const ASSETS=["./","./index.html","./style.css?v=5","./script.js?v=5","./menu-data.js?v=5","./manifest.json","./icons/icon.svg","./icons/icon-192.png","./icons/icon-512.png","./icons/havfood-logo.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res}).catch(()=>caches.match("./index.html")))));
