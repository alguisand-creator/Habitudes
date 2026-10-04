// Élan – service worker (hors-ligne), portée : tout le dossier de l'appli.
// « Réseau d'abord » : avec du réseau on sert la dernière version, sans réseau la copie en cache.

const VERSION = "habitudes-v4";   // à changer pour forcer le vidage de l'ancien cache
const TIMEOUT = 4000;
const FILES = ["./", "index.html", "style.css", "app.js", "manifest.json", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/blank-96.png", "icons/badge-96.png"];

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

/* ---------- rappels (notifications) ---------- */
// Les rappels sont copiés par l'appli dans IndexedDB ("state") : le service worker n'a pas accès à localStorage.
const idb = (mode, fn) => new Promise((res, rej) => {
  const q = indexedDB.open("elan", 1);
  q.onupgradeneeded = () => q.result.createObjectStore("kv");
  q.onerror = () => rej(q.error);
  q.onsuccess = () => { const tx = q.result.transaction("kv", mode), r = fn(tx.objectStore("kv")); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); };
});
const pad2 = n => String(n).padStart(2, "0");
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const show = (title, body, tag) => self.registration.showNotification(title, { body, icon: "icons/blank-96.png", badge: "icons/badge-96.png", tag, data: { url: "./" } });

async function remind() {
  const st = await idb("readonly", s => s.get("state"));
  if (!st || !st.notif || Notification.permission !== "granted") return;
  const now = new Date(), today = ymd(now), mins = now.getHours() * 60 + now.getMinutes();
  let fired = await idb("readonly", s => s.get("fired")); if (!fired || fired.date !== today) fired = { date: today, ids: [] };
  let changed = false;
  for (let i = 0; i < st.rem.length; i++) {
    const r = st.rem[i]; if (!r.on || fired.ids.includes(i)) continue;
    const [h, m] = r.t.split(":").map(Number), at = h * 60 + m;
    if (mins < at || mins - at > 90) continue;
    fired.ids.push(i); changed = true;
    if (st.date === today) { if (!r.skip) await show(r.title, r.body, "elan-" + i); }      // données du jour : message précis
    else await show("Élan 🌱", "Prends un moment pour cocher tes habitudes du jour.", "elan-" + i);
  }
  if (changed) await idb("readwrite", s => s.put(fired, "fired"));
}
self.addEventListener("periodicsync", e => { if (e.tag === "elan-remind") e.waitUntil(remind().catch(() => {})); });

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) if ("focus" in w) return w.focus();
    await self.clients.openWindow(new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href);
  })());
});
