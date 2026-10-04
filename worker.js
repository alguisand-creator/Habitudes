// Élan – serveur (Cloudflare Worker). Sert l'appli (fichiers statiques) et gère :
//   • les rappels fiables par notifications Web Push (/api/push/*, déclencheur chaque minute)
//   • la synchronisation chiffrée entre appareils (/api/sync/<id>)
// Stockage KV (binding ELAN) :
//   s:<id>              abonnement push + rappels d'un appareil (id = SHA-256 de l'adresse d'envoi)
//   t:<fuseau>:<HH:MM>  ids des appareils qui ont un rappel à cette heure locale
//   tzs                 liste des fuseaux horaires utilisés
//   y:<id>              copie chiffrée des données d'un utilisateur (le serveur ne peut pas la lire)
// Secret VAPID_JWK : clé privée (JWK) qui prouve aux services push que c'est bien Élan qui écrit.

const MAX_BODY = 20000;          // taille maximale d'une requête de rappels
const MAX_SYNC = 400000;         // taille maximale d'une copie synchronisée (octets)
const LIMIT = 40;                // requêtes par minute et par visiteur (au mieux, par instance)
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/, /(^|\.)push\.apple\.com$/];
const MAX_ITEMS = 8;             // rappels par appareil
const MAX_TZS = 60;              // fuseaux horaires différents acceptés
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const te = new TextEncoder();

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0))
};
const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

/* ───────────── Web Push (VAPID + chiffrement RFC 8291) ───────────── */
let vapidCache = null;
async function vapid(env) {
  if (!vapidCache) {
    const jwk = JSON.parse(env.VAPID_JWK);
    vapidCache = (async () => ({
      key: await crypto.subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, d: jwk.d }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]),
      pub: b64u.enc(concat(new Uint8Array([4]), b64u.dec(jwk.x), b64u.dec(jwk.y)))
    }))();
    vapidCache.catch(() => { vapidCache = null; });
  }
  return vapidCache;
}

async function vapidAuth(env, endpoint) {
  const { key, pub } = await vapid(env);
  const part = o => b64u.enc(te.encode(JSON.stringify(o)));
  const unsigned = part({ typ: "JWT", alg: "ES256" }) + "." +
    part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://github.com/alguisand-creator/Habitudes" });
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, te.encode(unsigned));
  return `vapid t=${unsigned}.${b64u.enc(sig)}, k=${pub}`;
}

async function encryptPayload(sub, text) {
  const ua = b64u.dec(sub.keys.p256dh), auth = b64u.dec(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", eph.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const secret = await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, eph.privateKey, 256);
  const hkdf = async (ikm, salt, info, len) => {
    const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
  };
  const ikm = await hkdf(secret, auth, concat(te.encode("WebPush: info\0"), ua, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(ikm, salt, te.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(ikm, salt, te.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const data = concat(te.encode(text), new Uint8Array([2]));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, data));
  return concat(salt, new Uint8Array([0, 0, 0x10, 0, 65]), asPub, ct);
}

// Envoie une notification ; renvoie le code HTTP du service push (404/410 = abonnement périmé).
async function sendPush(env, sub, payload) {
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream",
      TTL: "900", Urgency: "normal", Authorization: await vapidAuth(env, sub.endpoint)
    },
    body: await encryptPayload(sub, JSON.stringify(payload))
  });
  return res.status;
}

async function subId(endpoint) {
  const h = await crypto.subtle.digest("SHA-256", te.encode(endpoint));
  return [...new Uint8Array(h)].slice(0, 16).map(b => b.toString(16).padStart(2, "0")).join("");
}

function validTz(tz) {
  try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return typeof tz === "string" && tz.length < 60; } catch (_) { return false; }
}

function validSub(s) {
  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 600 || !s.keys) return false;
  let u; try { u = new URL(s.endpoint); } catch (_) { return false; }
  if (u.protocol !== "https:" || !PUSH_HOSTS.some(re => re.test(u.hostname))) return false;
  return typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string" && s.keys.p256dh.length < 200 && s.keys.auth.length < 60;
}

// Rappels : { time, title, body (message à jour), alt (message générique si l'appli n'a pas été ouverte aujourd'hui), skip, days }
function cleanItems(items) {
  if (!Array.isArray(items) || items.length > MAX_ITEMS) return null;
  const out = [];
  for (const it of items) {
    if (!it || !TIME_RE.test(it.time) || typeof it.title !== "string" || !it.title.trim()) return null;
    const days = Array.isArray(it.days) ? [...new Set(it.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))] : null;
    out.push({
      time: it.time,
      title: it.title.trim().slice(0, 60),
      body: typeof it.body === "string" ? it.body.trim().slice(0, 180) : "",
      alt: typeof it.alt === "string" ? it.alt.trim().slice(0, 180) : "",
      skip: it.skip === true,
      days: days && days.length && days.length < 7 ? days : null
    });
  }
  return out;
}

const slots = rec => new Set(rec ? rec.items.map(i => `t:${rec.tz}:${i.time}`) : []);

async function reindex(env, id, oldRec, newRec) {
  const before = slots(oldRec), after = slots(newRec);
  for (const k of before) {
    if (after.has(k)) continue;
    const ids = ((await env.ELAN.get(k, "json")) || []).filter(x => x !== id);
    if (ids.length) await env.ELAN.put(k, JSON.stringify(ids)); else await env.ELAN.delete(k);
  }
  for (const k of after) {
    const ids = (await env.ELAN.get(k, "json")) || [];
    if (!ids.includes(id)) { ids.push(id); await env.ELAN.put(k, JSON.stringify(ids)); }
  }
}

async function dropSub(env, id, rec) {
  await reindex(env, id, rec, null);
  await env.ELAN.delete("s:" + id);
}

function localNow(tz, date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short" })
    .formatToParts(date).map(x => [x.type, x.value]));
  return { hhmm: `${p.hour}:${p.minute}`, day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), date: `${p.year}-${p.month}-${p.day}` };
}

async function fire(env, id, hhmm, day, today) {
  const rec = await env.ELAN.get("s:" + id, "json");
  if (!rec) return;
  const fresh = rec.d === today;                       // l'appli a envoyé ses messages aujourd'hui : ils sont à jour
  for (const it of rec.items) {
    if (it.time !== hhmm || (it.days && !it.days.includes(day))) continue;
    if (fresh && it.skip) continue;                    // rien à rappeler (tout est déjà fait)
    try {
      const status = await sendPush(env, rec.sub, { title: it.title, body: (fresh ? it.body : it.alt) || it.body, tag: "elan-" + hhmm });
      if (status === 404 || status === 410) { await dropSub(env, id, rec); return; }
      if (status >= 400) console.error("Push refusé", status);
    } catch (e) { console.error("Échec de l'envoi", e && e.message); }
  }
}

async function runDue(env, date) {
  if (!env.ELAN || !env.VAPID_JWK) return;
  const tzs = (await env.ELAN.get("tzs", "json")) || [];
  for (const tz of tzs) {
    const { hhmm, day, date: today } = localNow(tz, date);
    const ids = await env.ELAN.get(`t:${tz}:${hhmm}`, "json");
    if (ids && ids.length) await Promise.allSettled(ids.map(id => fire(env, id, hhmm, day, today)));
  }
}

async function handlePush(request, env, url) {
  if (!env.ELAN || !env.VAPID_JWK) return json({ error: "Les rappels ne sont pas encore activés sur le serveur." }, 503);
  const action = url.pathname.slice("/api/push/".length);

  if (action === "key" && request.method === "GET") {
    const { pub } = await vapid(env);
    return json({ key: pub });
  }
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== url.host) return json({ error: "Origine refusée" }, 403);
  if (limited(request.headers.get("CF-Connecting-IP") || "inconnu")) return json({ error: "Trop de demandes, réessaie dans une minute." }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "Requête trop grande" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch (_) { return json({ error: "Requête invalide" }, 400); }

  if (action === "save") {
    const items = cleanItems(body.items);
    if (!validSub(body.sub) || !items || !validTz(body.tz) || !/^\d{4}-\d{2}-\d{2}$/.test(body.d || "")) return json({ error: "Requête invalide" }, 400);
    const tzs = (await env.ELAN.get("tzs", "json")) || [];
    if (!tzs.includes(body.tz)) {
      if (tzs.length >= MAX_TZS) return json({ error: "Fuseau horaire non pris en charge" }, 400);
      tzs.push(body.tz);
      await env.ELAN.put("tzs", JSON.stringify(tzs));
    }
    const id = await subId(body.sub.endpoint);
    const old = await env.ELAN.get("s:" + id, "json");
    const rec = { sub: { endpoint: body.sub.endpoint, keys: { p256dh: body.sub.keys.p256dh, auth: body.sub.keys.auth } }, tz: body.tz, d: body.d, items };
    // Évite d'écrire dans le KV si rien n'a changé (le plan gratuit limite les écritures par jour).
    if (!old || JSON.stringify(old) !== JSON.stringify(rec)) {
      await env.ELAN.put("s:" + id, JSON.stringify(rec));
      await reindex(env, id, old, rec);
    }
    return json({ ok: true });
  }

  if (action === "remove") {
    if (typeof body.endpoint !== "string") return json({ error: "Requête invalide" }, 400);
    const id = await subId(body.endpoint);
    const old = await env.ELAN.get("s:" + id, "json");
    if (old) await dropSub(env, id, old);
    return json({ ok: true });
  }

  if (action === "test") {
    if (typeof body.endpoint !== "string") return json({ error: "Requête invalide" }, 400);
    const rec = await env.ELAN.get("s:" + await subId(body.endpoint), "json");
    if (!rec) return json({ error: "Enregistre d'abord tes rappels." }, 404);
    const status = await sendPush(env, rec.sub, { title: "Élan", body: "Les rappels fiables fonctionnent. 🔔", tag: "test" });
    return status < 300 ? json({ ok: true }) : json({ error: "Envoi refusé par le service de notifications" }, 502);
  }

  return json({ error: "Introuvable" }, 404);
}

/* ───────────── Synchronisation chiffrée ───────────── */
// Le client chiffre ses données (AES-GCM) avec une clé qui ne quitte jamais l'appareil ; ici on stocke un bloc opaque
// { t: date de dernière modification, d: données chiffrées } sous un identifiant secret dérivé du code de l'utilisateur.
async function handleSync(request, env, url) {
  if (!env.ELAN) return json({ error: "La synchronisation n'est pas activée sur le serveur." }, 503);
  const id = url.pathname.slice("/api/sync/".length);
  if (!/^[0-9a-f]{32}$/.test(id)) return json({ error: "Identifiant invalide" }, 400);
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== url.host) return json({ error: "Origine refusée" }, 403);
  if (limited(request.headers.get("CF-Connecting-IP") || "inconnu")) return json({ error: "Trop de demandes, réessaie dans une minute." }, 429);
  const key = "y:" + id;

  if (request.method === "GET") {
    const rec = await env.ELAN.get(key, "json");
    return rec ? json(rec) : json({ error: "Introuvable" }, 404);
  }
  if (request.method === "DELETE") { await env.ELAN.delete(key); return json({ ok: true }); }
  if (request.method === "PUT") {
    const raw = await request.text();
    if (raw.length > MAX_SYNC) return json({ error: "Données trop volumineuses" }, 413);
    let body; try { body = JSON.parse(raw); } catch (_) { return json({ error: "Requête invalide" }, 400); }
    if (!body || !Number.isFinite(body.t) || typeof body.d !== "string" || !/^[A-Za-z0-9+/=]+$/.test(body.d)) return json({ error: "Requête invalide" }, 400);
    await env.ELAN.put(key, JSON.stringify({ t: body.t, d: body.d }), { expirationTtl: 60 * 60 * 24 * 400 });   // supprimé après ~13 mois sans mise à jour
    return json({ ok: true });
  }
  return json({ error: "Méthode non autorisée" }, 405);
}

/* ───────────── Compteurs anonymes ───────────── */
// Aucun identifiant, aucune IP conservée : seulement des totaux par jour (installations, visites par source de lien).
// Les totaux des 30 derniers jours sont lisibles publiquement sur GET /api/stat.
const STAT_MAX_DAY = 800;   // plafond d'événements par jour (protège le quota d'écritures gratuit de KV)
async function handleStat(request, env, url) {
  if (!env.ELAN) return json({ error: "Indisponible" }, 503);
  if (request.method === "GET") {
    // jours : { "2026-10-04": { visites: { tiktok: 3, direct: 5 }, installations: { tiktok: 1, inconnue: 1 } } }
    const out = { jours: {}, total: { visites: {}, installations: {} } };
    for (let i = 0; i < 30; i++) {
      const day = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
      const rec = await env.ELAN.get("stat:" + day, "json");
      if (!rec) continue;
      const inst = Object.assign({}, rec.inst || {});
      const known = Object.values(inst).reduce((a, b) => a + b, 0);
      if ((rec.install || 0) > known) inst.inconnue = (inst.inconnue || 0) + (rec.install - known);   // anciens comptages sans source
      out.jours[day] = { visites: rec.src || {}, installations: inst };
      for (const [s, n] of Object.entries(rec.src || {})) out.total.visites[s] = (out.total.visites[s] || 0) + n;
      for (const [s, n] of Object.entries(inst)) out.total.installations[s] = (out.total.installations[s] || 0) + n;
    }
    return json(out);
  }
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && new URL(origin).host !== url.host) return json({ error: "Origine refusée" }, 403);
  if (limited(request.headers.get("CF-Connecting-IP") || "inconnu")) return json({ error: "Trop de demandes" }, 429);
  let body; try { body = await request.json(); } catch (_) { return json({ error: "Requête invalide" }, 400); }
  const e = body && body.e;
  if (e !== "install" && e !== "visit") return json({ error: "Requête invalide" }, 400);
  let src = String((body && body.src) || "").toLowerCase();
  if (!/^[a-z0-9_-]{1,20}$/.test(src)) src = "";
  if (e === "visit" && !src) return json({ ok: true });
  const key = "stat:" + new Date().toISOString().slice(0, 10);
  const rec = (await env.ELAN.get(key, "json")) || { install: 0, src: {}, inst: {}, n: 0 };
  if (rec.n >= STAT_MAX_DAY) return json({ ok: true });
  rec.n++;
  if (!rec.inst) rec.inst = {};
  if (e === "install") { rec.install++; const s = src || "inconnue"; rec.inst[s] = (rec.inst[s] || 0) + 1; }
  else rec.src[src] = (rec.src[src] || 0) + 1;
  await env.ELAN.put(key, JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 100 });
  return json({ ok: true });
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDue(env, new Date(event.scheduledTime)));
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/push/")) return await handlePush(request, env, url);
      if (url.pathname.startsWith("/api/sync/")) return await handleSync(request, env, url);
      if (url.pathname === "/api/stat") return await handleStat(request, env, url);
    } catch (e) {
      console.error("Erreur serveur", e && e.message);
      return json({ error: "Erreur du serveur" }, 500);
    }
    return env.ASSETS.fetch(request);
  }
};
