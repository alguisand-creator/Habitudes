// Élan – service worker (hors-ligne), portée : tout le dossier de l'appli.
// « Réseau d'abord » : avec du réseau on sert la dernière version, sans réseau la copie en cache.

const VERSION = "habitudes-v1";   // à changer pour forcer le vidage de l'ancien cache
const TIMEOUT = 4000;
const FILES = ["./", "index.html", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];

const clean = r => new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
const norm = url => { const u = new URL(url, self.location.href); return u.origin + u.pathname.replace(/index\.html$/, ""); };
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);

self.addEventListener("install", e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await Promise.all(FILES.map(async f => {
      try { const r = await fetch(f, { cache: "reload" }); if (r.ok) await cache.put(norm(f), clean(r)); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const n of await caches.keys()) if (n !== VERSION && n.startsWith("habitudes-")) await caches.delete(n);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const res = await withTimeout(fetch(req), TIMEOUT);
      if (res.ok) cache.put(norm(req.url), clean(res.clone()));
      return res;
    } catch (_) {
      const hit = await cache.match(norm(req.url));
      if (hit) return hit;
      if (req.mode === "navigate") { const home = await cache.match(norm("./")); if (home) return home; }
      return Response.error();
    }
  })());
});
