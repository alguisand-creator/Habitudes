"use strict";
/* Élan – suivi d'habitudes. Tout est stocké dans le navigateur (localStorage), rien n'est envoyé sur internet. */

/* ---------- constantes ---------- */
const KEY = "habitudes-v1";
const COLORS = ["#2f9e6e", "#3b8fd9", "#8a63d2", "#e0577d", "#e8863a", "#d9b12a", "#17a2b8", "#7a8794"];
const ACCENTS = ["#2f9e6e", "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#14b8a6"];
const EMOJIS = ["💧","📖","🏃","🧘","💪","🥗","😴","🧹","📝","🎸","🚭","💊","🦷","🌿","🚶","☀️"];
const CATS = [
  { id: "mind", name: "Mindset", emoji: "🧠" }, { id: "work", name: "Travail", emoji: "💼" },
  { id: "sport", name: "Sport", emoji: "💪" }, { id: "rel", name: "Relations", emoji: "❤️" },
  { id: "nutri", name: "Nutrition", emoji: "🍎" }, { id: "sleep", name: "Sommeil", emoji: "😴" },
  { id: "other", name: "Autre", emoji: "✨" }
];
const catOf = id => CATS.find(c => c.id === id) || CATS[CATS.length - 1];
const WD = ["L","M","M","J","V","S","D"];
const WDLONG = ["lundi","mardi","mercredi","jeudi","vendredi","samedi","dimanche"];
const WD3 = ["LUN","MAR","MER","JEU","VEN","SAM","DIM"];
// [icône, nom, objectif chiffré (0 = simple case à cocher), unité, catégorie]
const SUGGEST = [
  ["🚶","Marcher 10 km",10,"km","sport"], ["👟","Faire 10 000 pas",10000,"pas","sport"], ["💧","Boire 2 L d'eau",2,"L","nutri"],
  ["📖","Lire 30 pages",30,"pages","mind"], ["🧘","Méditer 15 min",15,"min","mind"], ["💪","Faire du sport 45 min",45,"min","sport"],
  ["🥗","Manger 5 fruits et légumes",5,"portions","nutri"], ["😴","Dormir 8 h",8,"h","sleep"],
  ["💼","Travail concentré 2 h",2,"h","work"], ["❤️","Appeler un proche",0,"","rel"],
  ["🦷","Me brosser les dents",0,"","other"], ["📝","Écrire dans mon journal",0,"","mind"],
  ["📖","Apprendre 20 min",20,"min","mind"], ["📝","Planifier ma journée",0,"","work"], ["😴","Écrans coupés avant 22 h",0,"","sleep"]
];
const QUOTES = [
  "Petit à petit, l'oiseau fait son nid.", "Ce n'est pas la perfection qui compte, c'est la régularité.",
  "Une petite action aujourd'hui vaut mieux qu'un grand plan demain.", "Tu n'as pas à tout faire, juste à faire le prochain pas.",
  "Chaque case cochée est un vote pour la personne que tu veux devenir.", "La motivation démarre, l'habitude continue.",
  "Un jour raté n'est pas une série perdue : reprends dès demain.", "Les grands changements sont faits de minuscules victoires.",
  "Commence là où tu es, avec ce que tu as.", "Fais-le même quand tu n'en as pas envie : c'est là que ça compte.",
  "Mieux vaut 5 minutes tous les jours que 2 heures une fois par mois.", "Tes habitudes dessinent ton avenir."
];
const LEVELS = [[0,"Graine"],[5,"Pousse"],[15,"Éveillé"],[30,"Régulier"],[60,"Motivé"],[100,"Déterminé"],[150,"Inarrêtable"],[250,"Maître"],[400,"Champion"],[600,"Légende"],[1000,"Élan ultime"]];
const BADGES = [
  ["🌱","Premier pas","1re validation", s => s.total >= 1], ["🔟","Dix !","10 validations", s => s.total >= 10],
  ["💯","Centurion","100 validations", s => s.total >= 100], ["🔥","3 d'affilée","Série de 3 jours", s => s.best >= 3],
  ["⚡","Semaine de feu","Série de 7 jours", s => s.best >= 7], ["🏆","Mois parfait","Série de 30 jours", s => s.best >= 30],
  ["🎯","Journée parfaite","Tout à 100 % un jour", s => s.perfect >= 1], ["🧩","Collectionneur","5 habitudes", s => s.habits >= 5],
  ["🌈","Équilibré","3 catégories actives", s => s.cats >= 3],
  ["🎯","Premier défi","1 défi réussi", s => s.chals >= 1], ["🏁","Défi de 30 jours","Un défi de 30 jours réussi", s => s.chal30 >= 1]
];
const GOALS = [["sport", "🏃", "Bouger plus"], ["mind", "🧠", "Me sentir mieux"], ["nutri", "🥗", "Mieux manger"], ["sleep", "😴", "Mieux dormir"], ["work", "💼", "Être plus productif"], ["rel", "❤️", "Soigner mes proches"]];
const DEFAULTS = { theme: "auto", accent: ACCENTS[0], fs: "m", anim: true, ws: "mon", doneLast: false, streaks: true, quote: true, vibrate: true, sound: false, confetti: true, name: "", notif: false, onlyIfLeft: true, joker: true, serverPush: true };
const REM_NAMES = ["Rappel du matin", "Rappel de l'après-midi", "Rappel du soir", "Revue du dimanche"];
const REM_DEFAULT = [{ on: true, t: "08:00" }, { on: false, t: "14:00" }, { on: true, t: "20:00" }, { on: false, t: "19:00" }];
// Routines : plusieurs habitudes ajoutées d'un coup. [icône, nom, objectif (0 = case à cocher), unité, catégorie]
const ROUTINES = [
  { id: "matin", emoji: "☀️", name: "Routine du matin", desc: "Bien démarrer la journée", items: [
    ["💧", "Boire un grand verre d'eau", 0, "", "nutri"], ["🧘", "Étirements 10 min", 10, "min", "sport"], ["🧠", "Méditer 10 min", 10, "min", "mind"],
    ["📝", "Noter mes 3 priorités", 0, "", "work"], ["🥗", "Petit-déjeuner équilibré", 0, "", "nutri"] ] },
  { id: "etudiant", emoji: "🎓", name: "Étudiant", desc: "Réviser sans s'épuiser", items: [
    ["📖", "Réviser 1 h 30", 1.5, "h", "work"], ["📝", "Relire mes cours du jour", 0, "", "work"], ["🚶", "Marcher 30 min", 30, "min", "sport"],
    ["😴", "Dormir 8 h", 8, "h", "sleep"], ["💧", "Boire 1,5 L d'eau", 1.5, "L", "nutri"] ] },
  { id: "sportif", emoji: "💪", name: "Sportif", desc: "Performance et récupération", items: [
    ["💪", "Entraînement 60 min", 60, "min", "sport"], ["💧", "Boire 3 L d'eau", 3, "L", "nutri"], ["🥗", "Protéines à chaque repas", 0, "", "nutri"],
    ["🧘", "Étirements 10 min", 10, "min", "sport"], ["😴", "Dormir 8 h", 8, "h", "sleep"] ] },
  { id: "bienetre", emoji: "🌿", name: "Bien-être", desc: "Calme et équilibre", items: [
    ["🧘", "Méditer 10 min", 10, "min", "mind"], ["📝", "Écrire 3 gratitudes", 0, "", "mind"], ["🚶", "Marcher 30 min", 30, "min", "sport"],
    ["❤️", "Appeler un proche", 0, "", "rel"], ["😴", "Écrans coupés avant 22 h", 0, "", "sleep"] ] },
  { id: "pro", emoji: "💼", name: "Productivité", desc: "Travailler mieux, pas plus", items: [
    ["📝", "Planifier ma journée", 0, "", "work"], ["💼", "Travail concentré 2 h", 2, "h", "work"], ["🧹", "Ranger mon bureau", 0, "", "work"],
    ["🚶", "Pause marche 10 min", 10, "min", "sport"], ["📖", "Apprendre 20 min", 20, "min", "mind"] ] }
];

/* ---------- utilitaires ---------- */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
// Rouge (0 %) → orange → jaune → vert (100 %), de façon continue.
const pctColor = p => `hsl(${Math.round(Math.max(0, Math.min(100, p)) * 1.2)} 72% 42%)`;

const pad = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
const wday = k => (parse(k).getDay() + 6) % 7;            // lundi = 0
const todayKey = () => dkey(new Date());
const isKey = k => typeof k === "string" && /^\d{4}-\d{2}-\d{2}$/.test(k);
const wk = k => S.settings.ws === "sun" ? addDays(k, -parse(k).getDay()) : addDays(k, -wday(k));   // début de la semaine

/* ---------- données ---------- */
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) return clean(s); } catch (_) {}
  return clean({});
}
// Nettoie des données (stockage ou import) : on ne garde que ce qui a la bonne forme.
function clean(s) {
  const habits = (Array.isArray(s.habits) ? s.habits : []).filter(h => h && typeof h.id === "string" && typeof h.name === "string" && isKey(h.created)).slice(0, 200).map(h => ({
    id: h.id.slice(0, 40),
    name: h.name.slice(0, 60),
    emoji: typeof h.emoji === "string" ? h.emoji.slice(0, 8) : "✅",
    color: COLORS.includes(h.color) ? h.color : COLORS[0],
    cat: CATS.some(c => c.id === h.cat) ? h.cat : "other",
    days: Array.isArray(h.days) ? [...new Set(h.days.filter(n => Number.isInteger(n) && n >= 0 && n <= 6))] : [0,1,2,3,4,5,6],
    created: h.created,
    archived: !!h.archived,
    goal: h.goal && Number.isFinite(h.goal.target) && h.goal.target > 0 && h.goal.target <= 1e6
      ? { target: h.goal.target, unit: String(h.goal.unit || "").slice(0, 12) } : null,
    // défi : valider l'habitude N jours (pas forcément d'affilée) à partir de la date de départ
    challenge: h.challenge && Number.isInteger(h.challenge.days) && h.challenge.days >= 1 && h.challenge.days <= 365 && isKey(h.challenge.start)
      ? { days: h.challenge.days, start: h.challenge.start, completed: isKey(h.challenge.completed) ? h.challenge.completed : "" } : null
  }));
  const ids = new Set(habits.map(h => h.id)), log = {}, prog = {};
  if (s.log && typeof s.log === "object") for (const [k, v] of Object.entries(s.log)) {
    if (isKey(k) && Array.isArray(v)) { const l = [...new Set(v.filter(i => ids.has(i)))]; if (l.length) log[k] = l; }
  }
  // prog[jour][id] = avancement de 1 à 100 % pour les habitudes chiffrées
  if (s.prog && typeof s.prog === "object") for (const [k, v] of Object.entries(s.prog)) {
    if (!isKey(k) || !v || typeof v !== "object") continue;
    const o = {};
    for (const [i, p] of Object.entries(v)) if (ids.has(i) && Number.isFinite(p) && p > 0) o[i] = Math.min(100, Math.round(p));
    if (Object.keys(o).length) prog[k] = o;
  }
  const st = { ...DEFAULTS, rem: REM_DEFAULT.map(x => ({ ...x })) }, r = s.settings && typeof s.settings === "object" ? s.settings : {};
  if (Array.isArray(r.rem)) st.rem = REM_DEFAULT.map((d, i) => { const x = r.rem[i]; return { on: typeof (x && x.on) === "boolean" ? x.on : d.on, t: /^([01]\d|2[0-3]):[0-5]\d$/.test((x && x.t) || "") ? x.t : d.t }; });
  if (["auto", "light", "dark"].includes(r.theme)) st.theme = r.theme;
  if (/^#[0-9a-f]{6}$/i.test(r.accent || "")) st.accent = r.accent;
  if (["s", "m", "l"].includes(r.fs)) st.fs = r.fs;
  if (["mon", "sun"].includes(r.ws)) st.ws = r.ws;
  for (const k of ["anim", "doneLast", "streaks", "quote", "vibrate", "sound", "confetti", "notif", "onlyIfLeft", "joker", "serverPush"]) if (typeof r[k] === "boolean") st[k] = r[k];
  if (typeof r.name === "string") st.name = r.name.slice(0, 20);
  // jokers : jours de repos qui ne cassent pas les séries (un par semaine)
  const jokers = (Array.isArray(s.jokers) ? s.jokers : []).filter(isKey).slice(-400);
  const num = v => Number.isFinite(v) && v > 0 ? v : 0;
  const sync = /^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/.test(s.sync || "") ? s.sync : "";
  return { habits, log, prog, jokers: [...new Set(jokers)], settings: st, updated: num(s.updated), backup: num(s.backup), snooze: num(s.snooze), sync, onboarded: s.onboarded === true || habits.length > 0 };
}
let S = load();
// Enregistre dans le navigateur, puis déclenche (en différé) la copie vers le fichier, la synchro et les rappels serveur.
// quiet = true : changement venu de la synchro, on ne le renvoie pas.
const save = quiet => {
  if (!quiet) S.updated = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) { toast("Enregistrement impossible : stockage plein ou bloqué."); }
  mirror();
  if (!quiet) { fileSoon(); syncSoon(); }
  pushSoon();
};

function applySettings() {
  const s = S.settings, r = document.documentElement;
  r.dataset.theme = s.theme;
  r.style.fontSize = { s: "15px", m: "16px", l: "18px" }[s.fs];
  r.style.setProperty("--accent", s.accent);
  const n = parseInt(s.accent.slice(1), 16), lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  r.style.setProperty("--accent-ink", lum > 0.62 ? "#0b1410" : "#fff");
  r.classList.toggle("noanim", !s.anim);
  const dark = s.theme === "dark" || (s.theme === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.removeAttribute("media"); m.content = dark ? "#0f161c" : "#f3f6f8"; });
}

/* ---------- logique ---------- */
const active = () => S.habits.filter(h => !h.archived);
const sched = (h, k) => h.days.includes(wday(k)) && k >= h.created;
const done = (h, k) => (S.log[k] || []).includes(h.id);
const forDay = k => active().filter(h => sched(h, k));

// Avancement d'une habitude un jour donné, de 0 à 100 %. Une habitude simple vaut 0 ou 100.
const pct = (h, k) => h.goal ? ((S.prog[k] || {})[h.id] || 0) : (done(h, k) ? 100 : 0);
const dayPct = k => { const hs = forDay(k); return hs.length ? hs.reduce((n, h) => n + pct(h, k), 0) / hs.length : 0; };

// Règle l'avancement ; à 100 % l'habitude compte comme faite (séries, statistiques).
function setPct(h, k, p) {
  p = Math.max(0, Math.min(100, Math.round(p)));
  const P = S.prog[k] || (S.prog[k] = {});
  if (h.goal && p > 0) P[h.id] = p; else delete P[h.id];
  if (!Object.keys(P).length) delete S.prog[k];
  const l = S.log[k] || (S.log[k] = []), i = l.indexOf(h.id);
  if (p >= 100 && i < 0) l.push(h.id);
  if (p < 100 && i >= 0) l.splice(i, 1);
  if (!l.length) delete S.log[k];
}
function toggle(id, k) {
  const h = S.habits.find(x => x.id === id);
  setPct(h, k, pct(h, k) >= 100 ? 0 : 100);
  save();
}
// Joker : un jour de repos par semaine. Les habitudes non faites ce jour-là ne cassent pas la série et ne comptent pas dans les moyennes.
const isJoker = k => S.jokers.includes(k);
const jokerIn = k => { const s = wk(k), e = addDays(s, 6); return S.jokers.find(j => j >= s && j <= e) || null; };   // joker utilisé dans la semaine de k
const skipped = (h, k) => isJoker(k) && !done(h, k);

function toggleJoker(k) {
  if (isJoker(k)) S.jokers = S.jokers.filter(j => j !== k);
  else { if (jokerIn(k)) return false; S.jokers.push(k); S.jokers.sort(); }
  save(); return true;
}

// Série en cours : jours prévus consécutifs réalisés. Aujourd'hui non fait ne casse pas la série.
function streak(h) {
  const t = todayKey(); let n = 0, k = t;
  for (let i = 0; i < 1500 && k >= h.created; i++, k = addDays(k, -1)) {
    if (!sched(h, k) || skipped(h, k)) continue;
    if (done(h, k)) n++; else if (k !== t) break;
  }
  return n;
}
function bestStreak(h) {
  const t = todayKey(); let cur = 0, best = 0;
  for (let k = h.created, i = 0; k <= t && i < 4000; k = addDays(k, 1), i++) {
    if (!sched(h, k) || skipped(h, k)) continue;
    if (done(h, k)) { cur++; best = Math.max(best, cur); } else if (k !== t) cur = 0;
  }
  return best;
}
function rate(h, days) {
  const t = todayKey(); let p = 0, d = 0;
  for (let i = 0; i < days; i++) { const k = addDays(t, -i); if (k < h.created) break; if (sched(h, k) && !skipped(h, k)) { p++; if (done(h, k)) d++; } }
  return p ? d / p : null;
}
// Avancement moyen (0-100) d'une habitude sur les derniers jours prévus ; null s'il n'y en a aucun.
function avgPct(h, days) {
  const t = todayKey(); let s = 0, n = 0;
  for (let i = 0; i < days; i++) { const k = addDays(t, -i); if (k < h.created) break; if (sched(h, k) && !skipped(h, k)) { s += pct(h, k); n++; } }
  return n ? s / n : null;
}
const total = h => Object.values(S.log).reduce((n, l) => n + (l.includes(h.id) ? 1 : 0), 0);
function dayRatio(k) { const hs = forDay(k); return hs.length && !(isJoker(k) && dayPct(k) === 0) ? dayPct(k) / 100 : null; }
const scheduleText = h => h.days.length === 7 ? "Tous les jours" : h.days.length === 0 ? "Aucun jour" :
  [0,1,2,3,4].every(i => h.days.includes(i)) && h.days.length === 5 ? "En semaine" :
  h.days.length === 2 && h.days.includes(5) && h.days.includes(6) ? "Le week-end" :
  [...h.days].sort().map(i => WDLONG[i].slice(0, 3) + ".").join(" ");

function globalStats() {
  const hs = active();
  let totalDone = 0, perfect = 0;
  for (const [k, l] of Object.entries(S.log)) {
    totalDone += l.length;
    const d = forDay(k); if (d.length && d.every(h => done(h, k))) perfect++;
  }
  const won = S.habits.filter(h => h.challenge && h.challenge.completed);
  return { total: totalDone, perfect, habits: hs.length, cats: new Set(hs.map(h => h.cat)).size, best: Math.max(0, ...hs.map(bestStreak)),
    chals: won.length, chal30: won.filter(h => h.challenge.days >= 30).length };
}

/* ---------- défis ---------- */
const chalCount = h => { const c = h.challenge; if (!c) return 0; let n = 0; for (const [k, l] of Object.entries(S.log)) if (k >= c.start && l.includes(h.id)) n++; return n; };
// Un défi est réussi quand l'habitude a été validée autant de jours que prévu ; renvoie l'habitude qui vient de le réussir.
function checkChallenges() {
  for (const h of active()) {
    const c = h.challenge;
    if (c && !c.completed && chalCount(h) >= c.days) { c.completed = todayKey(); save(); return h; }
  }
  return null;
}
function celebrateChallenge(h) { confetti(); setTimeout(confetti, 450); beep([523, 659, 784, 1047, 1319]); toast(`🏆 Défi de ${h.challenge.days} jours réussi : ${h.name} !`); }
const chalBar = h => {
  const c = h.challenge; if (!c || c.completed) return "";
  return `<span class="chbar" aria-hidden="true"><i style="width:${Math.min(100, Math.round(chalCount(h) / c.days * 100))}%"></i></span>`;
};

/* ---------- retours : vibration, son, confettis ---------- */
let ac;
function beep(freqs) {
  if (!S.settings.sound) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + i * 0.11;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.32);
    });
  } catch (_) {}
}
const buzz = () => { if (S.settings.vibrate && navigator.vibrate) try { navigator.vibrate(15); } catch (_) {} };

let confettiRaf = 0;
function confetti() {
  if (!S.settings.confetti || !S.settings.anim) return;
  const c = $("#cv"), ctx = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  const cols = ["#ef4444", "#f97316", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"];
  const ps = Array.from({ length: 110 }, () => ({
    x: innerWidth * (0.2 + Math.random() * 0.6), y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 10, vy: -4 - Math.random() * 9,
    w: 6 + Math.random() * 6, h: 4 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: cols[Math.floor(Math.random() * cols.length)]
  }));
  cancelAnimationFrame(confettiRaf);
  const t0 = performance.now();
  const frame = now => {
    const t = now - t0; ctx.clearRect(0, 0, c.width, c.height);
    for (const p of ps) {
      p.vy += 0.28; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - t / 2400); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
    }
    if (t < 2400) confettiRaf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, c.width, c.height);
  };
  confettiRaf = requestAnimationFrame(frame);
}
function celebrate() { confetti(); beep([523, 659, 784, 1047]); toast("Journée complète, bravo ! 🎉"); }

/* ---------- état de l'interface ---------- */
let tab = "today", sel = todayKey(), radarDays = 7;

function render() {
  $("#fab").style.display = tab === "settings" ? "none" : "";
  document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  $("#app").innerHTML = tab === "today" ? viewToday() : tab === "stats" ? viewStats() : viewSettings();
  if (tab === "today") animateMeter();
}

// Pendant qu'on glisse une jauge : met à jour la carte et le compteur sans tout redessiner (sinon le doigt perd le curseur).
function live(input) {
  const h = S.habits.find(x => x.id === input.dataset.gauge); if (!h) return;
  const p = +input.value;
  setPct(h, sel, p);
  const card = input.closest(".hab"), g = input.closest(".gauge");
  g.style.setProperty("--p", p); g.style.setProperty("--pc", pctColor(p));
  card.querySelector(".meta").innerHTML = metaText(h, sel);
  card.classList.toggle("done", done(h, sel));
  const chk = card.querySelector(".check"); chk.textContent = done(h, sel) ? "✓" : h.emoji; chk.setAttribute("aria-pressed", done(h, sel));
  const dp = Math.round(dayPct(sel)), hs = forDay(sel);
  cancelAnimationFrame(tween); shown = dp;
  $("#mnum").textContent = dp; $("#mfill").style.width = dp + "%"; $("#meter").style.setProperty("--pc", pctColor(dp));
  $("#mmsg").textContent = meterMsg(dp, hs.length, hs.filter(x => done(x, sel)).length);
}

const EMPTY_SVG = `<svg viewBox="0 0 160 112" aria-hidden="true"><defs><linearGradient id="eg" x1="0" x2="1"><stop offset="0" stop-color="#ef4444"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs>
  <path d="M20 92 A60 60 0 0 1 140 92" fill="none" stroke="url(#eg)" stroke-width="15" stroke-linecap="round"/>
  <path d="M80 90 V50 M63 66 L80 49 L97 66" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="132" cy="22" r="3.5" fill="#facc15"/><circle cx="28" cy="30" r="2.5" fill="#a855f7"/><circle cx="148" cy="52" r="2" fill="#22c55e"/></svg>`;

function greeting() {
  const h = new Date().getHours(), g = h < 5 || h >= 18 ? "Bonsoir" : h < 12 ? "Bonjour" : "Bon après-midi";
  return `${g}${S.settings.name ? " " + esc(S.settings.name) : ""} 👋`;
}
const dayOfYear = () => Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);

function viewToday() {
  const t = todayKey(), start = wk(sel), d = parse(sel);
  const strip = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(start, i), r = dayRatio(k), fut = k > t, w = wday(k);
    return `<button class="day${k === sel ? " sel" : ""}${k === t ? " today" : ""}" data-day="${k}" ${fut ? "disabled" : ""} aria-label="${WDLONG[w]} ${parse(k).getDate()}">
      <small>${WD[w]}</small><b>${parse(k).getDate()}</b><i><span style="width:${r === null ? 0 : Math.round(r * 100)}%;background:${pctColor(r === null ? 0 : r * 100)}"></span></i></button>`;
  }).join("");

  let hs = forDay(sel);
  const nd = hs.filter(h => done(h, sel)).length, dp = Math.round(dayPct(sel));
  if (S.settings.doneLast) hs = [...hs.filter(h => !done(h, sel)), ...hs.filter(h => done(h, sel))];
  const label = sel === t ? "Aujourd'hui" : sel === addDays(t, -1) ? "Hier" : "Ce jour-là";

  let body;
  if (!active().length) {
    body = `<div class="card empty">${EMPTY_SVG}<h2 style="margin:.4rem 0;justify-content:center">Ajoute ta première habitude</h2>
      <p style="color:var(--muted);margin:0">Commence petit : une seule habitude suffit. Choisis une idée ou crée la tienne.</p>
      <div class="chips">${SUGGEST.map((s, i) => `<button class="chip" data-sug="${i}">${s[0]} ${esc(s[1])}</button>`).join("")}</div>
      <p style="margin:1.2rem 0 0"><button class="btn" data-new>Créer une habitude</button> <button class="btn ghost" data-routines>📦 Routines</button></p></div>`;
  } else if (!hs.length) {
    body = `<div class="card empty"><div class="em">😌</div><p style="margin:.4rem 0 0">Aucune habitude prévue ce jour-là. Profite !</p></div>`;
  } else {
    body = `<div class="list">${hs.map(h => {
      const dn = done(h, sel), p = pct(h, sel);
      return `<div class="hab card${dn ? " done" : ""}" style="--c:${h.color}" data-card="${h.id}">
        <button class="check" data-toggle="${h.id}" aria-pressed="${dn}" aria-label="${dn ? "Décocher" : "Cocher"} ${esc(h.name)}">${dn ? "✓" : esc(h.emoji)}</button>
        <button class="txt" data-toggle="${h.id}"><span class="name">${esc(h.name)}</span>
          <span class="meta">${metaText(h, sel)}</span>${chalBar(h)}</button>
        <button class="more" data-edit="${h.id}" aria-label="Modifier ${esc(h.name)}">⋯</button>
        ${h.goal ? `<div class="gauge" style="--p:${p};--pc:${pctColor(p)}"><input type="range" min="0" max="100" step="1" value="${p}" data-gauge="${h.id}" aria-label="Avancement de ${esc(h.name)}">
          <div class="scale"><span>0 %</span><span>50 %</span><span>100 %</span></div></div>` : ""}</div>`;
    }).join("")}</div><p style="text-align:center;margin:1rem 0 0"><button class="btn ghost" data-routines>📦 Ajouter une routine</button></p>`;
  }

  const q = QUOTES[dayOfYear() % QUOTES.length];
  return `<div class="stick"><div class="card meter" id="meter" style="--pc:${pctColor(shown)}">
      <div class="mt"><div><span class="mn" id="mnum">${Math.round(shown)}</span><span class="mu">%</span></div>
        <div class="ml"><b>${label}</b><span id="mmsg">${esc(meterMsg(dp, hs.length, nd))}</span></div></div>
      <div class="mbar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${dp}" aria-label="Avancement de la journée"><span id="mfill" style="width:${shown}%"></span></div></div></div>
    <div class="head"><h1><img src="icons/icon-192.png" alt="" width="34" height="34"><span class="gt">Élan</span></h1>${installed() ? "" : `<button class="btn dl" id="dl">⬇ Télécharger</button>`}</div>
    <p class="hello">${greeting()}</p>
    <p class="sub">${esc(d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }))}</p>
    ${S.settings.quote ? `<p class="quote"><i>“</i>${esc(q)}<i>”</i></p>` : ""}
    <div class="week"><button class="iconbtn" data-week="-1" aria-label="Semaine précédente">‹</button><div class="days">${strip}</div>
    <button class="iconbtn" data-week="1" aria-label="Semaine suivante" ${wk(sel) >= wk(t) ? "disabled" : ""}>›</button></div>
    ${backupBanner()}${reviewBanner(t)}${jokerRow(t, hs.length)}
    ${body}`;
}

// Joker du jour sélectionné : un seul par semaine, il protège la série ce jour-là.
function jokerRow(t, n) {
  if (!S.settings.joker || !active().length || !n || sel > t) return "";
  if (isJoker(sel)) return `<div class="joker on"><span>🃏 <b>Jour de repos</b> : ta série est protégée.</span><button class="btn ghost" data-joker>Retirer</button></div>`;
  const used = jokerIn(sel);
  if (used) return `<div class="joker"><span>🃏 Joker déjà utilisé cette semaine (${esc(parse(used).toLocaleDateString("fr-FR", { weekday: "long" }))}).</span></div>`;
  return `<div class="joker"><span>🃏 <b>1 joker</b> dispo cette semaine : saute un jour sans casser ta série.</span><button class="btn ghost" data-joker>Utiliser</button></div>`;
}
// Le dernier jour de la semaine, on propose la revue.
function reviewBanner(t) {
  if (sel !== t || !active().length || t !== addDays(wk(t), 6)) return "";
  return `<div class="joker on"><span>📋 <b>Ta revue de la semaine est prête.</b></span><button class="btn ghost" data-review>Voir</button></div>`;
}

// Texte sous le nom : quantité atteinte pour une habitude chiffrée, série de jours sinon.
function metaText(h, k) {
  const s = S.settings.streaks ? streak(h) : 0, streakTxt = s ? `🔥 ${s} ${s > 1 ? "jours" : "jour"} d'affilée` : "";
  const c = h.challenge, chTxt = c ? (c.completed ? "🏆 défi réussi" : `🎯 défi ${chalCount(h)}/${c.days}`) : "";
  if (!h.goal) return esc(streakTxt || (chTxt ? "" : scheduleText(h))) + (chTxt ? (streakTxt ? " · " : "") + esc(chTxt) : "");
  const p = pct(h, k), amount = `${nf.format(Math.round(h.goal.target * p) / 100)} / ${nf.format(h.goal.target)}${h.goal.unit ? " " + esc(h.goal.unit) : ""}`;
  return `${amount} · <span class="pcol" style="--pc:${pctColor(p)}">${p} %</span>${streakTxt ? " · " + streakTxt : ""}${chTxt ? " · " + esc(chTxt) : ""}`;
}
function meterMsg(p, n, nd) {
  if (!n) return "Rien de prévu ce jour-là";
  if (isJoker(sel) && p < 100) return nd ? `${nd}/${n} faites · jour de repos 🃏` : "Jour de repos 🃏 série protégée";
  if (p >= 100) return "Journée parfaite, bravo ! 🎉";
  if (p === 0) return `${n} à faire, c'est parti !`;
  if (p < 50) return `${nd}/${n} terminées, continue !`;
  return `${nd}/${n} terminées, presque !`;
}

// Compteur du haut : le nombre « monte » en douceur jusqu'à la nouvelle valeur, la couleur glisse du rouge au vert.
let shown = 0, tween = 0;
function animateMeter() {
  const target = Math.round(dayPct(sel)), fill = $("#mfill"), num = $("#mnum"), box = $("#meter");
  if (!fill) return;
  cancelAnimationFrame(tween);
  const from = shown, t0 = performance.now(), dur = (!S.settings.anim || matchMedia("(prefers-reduced-motion:reduce)").matches) ? 0 : 650;
  requestAnimationFrame(() => { fill.style.width = target + "%"; box.style.setProperty("--pc", pctColor(target)); });
  const step = now => {
    const f = dur ? Math.min(1, (now - t0) / dur) : 1;
    shown = from + (target - from) * (1 - Math.pow(1 - f, 3));
    num.textContent = Math.round(shown);
    if (f < 1) tween = requestAnimationFrame(step); else shown = target;
  };
  tween = requestAnimationFrame(step);
}

/* ---------- statistiques ---------- */
// Graphique en toile d'araignée : un axe par catégorie, valeur = avancement moyen sur la période.
function radarSvg(days) {
  const hs = active(), used = new Set(hs.map(h => h.cat));
  let axes = CATS.filter(c => used.has(c.id)).map(c => ({ ...c }));
  for (const c of CATS) if (axes.length < 3 && !used.has(c.id) && c.id !== "other") axes.push({ ...c, empty: true });
  axes.sort((a, b) => CATS.indexOf(catOf(a.id)) - CATS.indexOf(catOf(b.id)));
  const n = axes.length, W = 360, H = 340, cx = W / 2, cy = 168, R = 100;
  axes.forEach(a => {
    const v = hs.filter(h => h.cat === a.id).map(h => avgPct(h, days)).filter(x => x !== null);
    a.v = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0;
  });
  const pt = (i, r) => { const ang = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, Math.cos(ang), Math.sin(ang)]; };
  const rings = [20, 40, 60, 80, 100].map(p => `<polygon class="ring" points="${axes.map((_, i) => pt(i, R * p / 100).slice(0, 2).map(x => x.toFixed(1)).join(",")).join(" ")}"/>`).join("");
  const spokes = axes.map((_, i) => { const [x, y] = pt(i, R); return `<line class="axis" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
  const poly = axes.map((a, i) => pt(i, Math.max(4, R * a.v / 100)).slice(0, 2).map(x => x.toFixed(1)).join(",")).join(" ");
  const dots = axes.map((a, i) => { const [x, y] = pt(i, Math.max(4, R * a.v / 100)); return `<circle class="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>`; }).join("");
  const labels = axes.map((a, i) => {
    const [x, y, c, s] = pt(i, R + 16), anchor = c > 0.25 ? "start" : c < -0.25 ? "end" : "middle", dy = s > 0.5 ? 10 : s < -0.5 ? -10 : 0;
    return `<text class="lab${a.empty ? " empty" : ""}" x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}"><tspan>${a.emoji} ${esc(a.name)}</tspan><tspan class="v" x="${x.toFixed(1)}" dy="1.3em">${Math.round(a.v)} %</tspan></text>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Équilibre par catégorie">${rings}${spokes}<polygon class="poly" points="${poly}"/>${dots}${labels}</svg>`;
}

// Bilan d'une semaine (du premier jour de la semaine jusqu'à aujourd'hui au plus).
function weekStats(start) {
  const t = todayKey(), end = addDays(start, 6) > t ? t : addDays(start, 6);
  let sum = 0, n = 0, perfect = 0, jokers = 0, doneN = 0;
  const per = new Map();
  for (let k = start; k <= end; k = addDays(k, 1)) {
    const hs = forDay(k); if (!hs.length) continue;
    if (isJoker(k)) jokers++;
    const live = hs.filter(h => !skipped(h, k)); if (!live.length) continue;
    sum += live.reduce((a, h) => a + pct(h, k), 0) / live.length; n++;
    if (live.every(h => done(h, k))) perfect++;
    for (const h of live) {
      const e = per.get(h.id) || { h, s: 0, n: 0 };
      e.s += pct(h, k); e.n++; if (done(h, k)) doneN++; per.set(h.id, e);
    }
  }
  return { score: n ? sum / n : null, perfect, jokers, done: doneN, habits: [...per.values()].map(e => ({ h: e.h, avg: e.s / e.n })) };
}
const TIPS = ["Accroche-la à un moment fixe de ta journée (après le café, avant de dormir…).", "Réduis l'objectif de moitié pendant une semaine : mieux vaut petit mais régulier.",
  "Place un rappel à l'heure où tu es le plus disponible.", "Prépare tout la veille pour que ce soit plus facile à lancer."];
// Défis en cours et réussis.
function chalSection() {
  const hs = S.habits.filter(h => h.challenge).sort((a, b) => (a.challenge.completed ? 1 : 0) - (b.challenge.completed ? 1 : 0));
  if (!hs.length) return "";
  return `<h2>🎯 Défis</h2>` + hs.map(h => {
    const c = h.challenge, n = Math.min(c.days, chalCount(h));
    return `<div class="card hs" style="--c:${h.color}"><div class="top"><span style="font-size:1.4rem">${esc(h.emoji)}</span><b>${esc(h.name)}</b>
      <span class="hint">${c.completed ? "🏆 réussi le " + esc(parse(c.completed).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })) : `${n} / ${c.days} jours`}</span></div>
      <div class="bar" style="margin-top:.6rem"><span style="width:${c.completed ? 100 : Math.round(n / c.days * 100)}%"></span></div></div>`;
  }).join("");
}

// Image à partager (score de la semaine) : dessinée sur un canevas, envoyée via le menu de partage du téléphone ou téléchargée.
function rrect(g, x, y, w, h, r) { r = Math.min(r, h / 2, w / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
async function shareWeek() {
  const t = todayKey(), start = addDays(wk(t), -7 * reviewOff), cur = weekStats(start);
  if (cur.score === null) { toast("Pas encore de résultat à partager."); return; }
  const sc = Math.round(cur.score), W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H;
  const g = c.getContext("2d"), font = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Color Emoji', sans-serif", acc = S.settings.accent;
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0f161c"); bg.addColorStop(1, "#1f3140"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, 760); glow.addColorStop(0, acc + "66"); glow.addColorStop(1, acc + "00"); g.fillStyle = glow; g.fillRect(0, 0, W, H);
  g.textAlign = "left"; g.fillStyle = "#fff"; g.font = `800 70px ${font}`; g.fillText("Élan", 110, 150);
  g.fillStyle = "#9db0bf"; g.font = `500 38px ${font}`;
  const end = addDays(start, 6), fmt = k => parse(k).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  g.fillText(`Ma semaine · ${fmt(start)} – ${fmt(end)}`, 110, 215);
  // anneau du score
  const cx = W / 2, cy = 540, R = 230;
  g.lineWidth = 52; g.lineCap = "round"; g.strokeStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = pctColor(sc); g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, sc / 100)); g.stroke();
  g.textAlign = "center"; g.fillStyle = "#fff"; g.font = `800 190px ${font}`; g.fillText(`${sc}%`, cx, cy + 62);
  g.fillStyle = "#9db0bf"; g.font = `600 40px ${font}`; g.fillText("de réussite", cx, cy + 130);
  // barres de la semaine
  const bw = 96, gap = 26, x0 = (W - (7 * bw + 6 * gap)) / 2, by = 870, bh = 180;
  for (let i = 0; i < 7; i++) {
    const k = addDays(start, i), x = x0 + i * (bw + gap), has = k <= t && forDay(k).length > 0, r = has ? dayPct(k) : 0;
    g.fillStyle = "rgba(255,255,255,.1)"; rrect(g, x, by, bw, bh, 24); g.fill();
    if (has) { g.fillStyle = pctColor(r); rrect(g, x, by + bh - Math.max(16, bh * r / 100), bw, Math.max(16, bh * r / 100), 24); g.fill(); }
    g.fillStyle = "#9db0bf"; g.font = `700 30px ${font}`; g.fillText(WD3[wday(k)], x + bw / 2, by + bh + 52);
  }
  // chiffres clés
  const streakN = Math.max(0, ...active().map(streak)), boxes = [["🔥", streakN, streakN > 1 ? "jours d'affilée" : "jour d'affilée"], ["✅", cur.done, cur.done > 1 ? "validations" : "validation"], ["🎯", cur.perfect, cur.perfect > 1 ? "journées parfaites" : "journée parfaite"]];
  const sw3 = 290, sg = 35, sx0 = (W - (3 * sw3 + 2 * sg)) / 2;
  boxes.forEach(([ic, n, l], i) => {
    const x = sx0 + i * (sw3 + sg); g.fillStyle = "rgba(255,255,255,.08)"; rrect(g, x, 1160, sw3, 130, 28); g.fill();
    g.fillStyle = "#fff"; g.font = `800 54px ${font}`; g.fillText(`${ic} ${n}`, x + sw3 / 2, 1228);
    g.fillStyle = "#9db0bf"; g.font = `500 26px ${font}`; g.fillText(l, x + sw3 / 2, 1268);
  });
  g.fillStyle = "#6f8496"; g.font = `500 28px ${font}`; g.fillText(location.host, W / 2, 1332);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  const file = new File([blob], "elan-ma-semaine.png", { type: "image/png" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Élan", text: `Ma semaine sur Élan : ${sc} % 💪 ${location.origin}` }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "elan-ma-semaine.png";
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast("Image enregistrée : partage-la où tu veux 📤");
}

let reviewOff = 0;
function reviewCard() {
  const t = todayKey(), cur = weekStats(addDays(wk(t), -7 * reviewOff)), prev = weekStats(addDays(wk(t), -7 * (reviewOff + 1)));
  const head = `<h2>📋 Revue de la semaine <small><span class="seg"><button data-rv="0" class="${reviewOff === 0 ? "on" : ""}">En cours</button><button data-rv="1" class="${reviewOff === 1 ? "on" : ""}">Dernière</button></span></small></h2>`;
  if (cur.score === null) return `<div id="review">${head}<div class="card review"><p class="hint" style="margin:0">Pas encore de données pour cette semaine. Coche tes premières habitudes !</p></div></div>`;
  const sc = Math.round(cur.score);
  let delta = "";
  if (prev.score !== null) { const d = sc - Math.round(prev.score); delta = d > 0 ? `<span class="up">▲ +${d} pts</span> vs semaine précédente` : d < 0 ? `<span class="down">▼ ${d} pts</span> vs semaine précédente` : "= comme la semaine précédente"; }
  else delta = "Première semaine de données";
  const hb = [...cur.habits].sort((a, b) => b.avg - a.avg), best = hb[0], weak = hb.length > 1 ? hb[hb.length - 1] : null;
  const verdict = sc >= 80 ? "Superbe semaine, continue comme ça ! 🌟" : sc >= 50 ? "Belle régularité, tu es sur la bonne voie. 👍" : "Pas grave : chaque semaine est une nouvelle chance. 🌱";
  return `<div id="review">${head}<div class="card review">
    <div class="rv-top"><div class="rv-score" style="--pc:${pctColor(sc)}">${sc}<small>%</small></div><div><b>${verdict}</b><span class="hint" style="display:block">${delta}</span></div></div>
    <ul class="rv-list">
      ${best ? `<li>🏆 <span><b>Ta meilleure habitude</b><br>${esc(best.h.emoji)} ${esc(best.h.name)} · ${Math.round(best.avg)} %</span></li>` : ""}
      ${weak && weak.avg < 100 && weak !== best ? `<li>🎯 <span><b>À renforcer</b><br>${esc(weak.h.emoji)} ${esc(weak.h.name)} · ${Math.round(weak.avg)} %<br><span class="hint">${TIPS[dayOfYear() % TIPS.length]}</span></span></li>` : ""}
      <li>✅ <span><b>${cur.done} validation${cur.done > 1 ? "s" : ""}</b> · ${cur.perfect} journée${cur.perfect > 1 ? "s" : ""} parfaite${cur.perfect > 1 ? "s" : ""}${cur.jokers ? ` · ${cur.jokers} joker 🃏` : ""}</span></li>
    </ul><button class="btn block" data-share style="margin-top:1rem">📤 Partager ma semaine</button></div></div>`;
}

function viewStats() {
  const hs = active(), t = todayKey();
  if (!hs.length) return `<h1><span class="gt">Statistiques</span></h1><div class="card empty" style="margin-top:1rem">${EMPTY_SVG}<p>Ajoute une habitude pour voir tes statistiques.</p></div>`;
  const gs = globalStats();

  // niveau
  let li = 0; LEVELS.forEach((l, i) => { if (gs.total >= l[0]) li = i; });
  const nextL = LEVELS[li + 1], lvlPct = nextL ? Math.round((gs.total - LEVELS[li][0]) / (nextL[0] - LEVELS[li][0]) * 100) : 100;
  const hero = `<div class="card hero"><span class="big">🏅</span><div><b>Niveau ${li + 1} · ${LEVELS[li][1]}</b>
    <small>${gs.total} validation${gs.total > 1 ? "s" : ""}${nextL ? ` · encore ${nextL[0] - gs.total} pour « ${nextL[1]} »` : " · niveau maximum atteint !"}</small>
    <div class="bar" style="--c:var(--accent)"><span style="width:${lvlPct}%"></span></div></div></div>`;

  // cette semaine
  const start = wk(t); let wsum = 0, wn = 0;
  const cols = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(start, i), fut = k > t, has = forDay(k).length > 0, r = fut || !has ? 0 : dayPct(k);
    if (!fut && has) { wsum += r; wn++; }
    return `<div class="col${fut ? " fut" : ""}${k === t ? " today" : ""}"><em style="color:${pctColor(r)}">${fut ? "" : has ? Math.round(r) + "%" : "–"}</em>
      <div class="track"><div class="fill" style="height:${r}%;background:linear-gradient(180deg,${pctColor(Math.min(100, r + 15))},${pctColor(r)})"></div></div><small>${WD3[wday(k)]}</small></div>`;
  }).join("");
  const weekAvg = wn ? Math.round(wsum / wn) + " %" : "–";

  // 7 derniers jours (taux de réussite)
  let p = 0, d = 0;
  for (let i = 0; i < 7; i++) { const k = addDays(t, -i); for (const h of forDay(k)) { if (skipped(h, k)) continue; p++; if (done(h, k)) d++; } }

  // calendrier : 12 semaines, colonnes = semaines
  const first = addDays(wk(t), -7 * 11); let cells = "";
  for (let i = 0; i < 84; i++) {
    const k = addDays(first, i), r = k > t ? undefined : dayRatio(k);
    const cls = r === undefined ? "none" : r === null || r === 0 ? "" : r < .5 ? "l1" : r < 1 ? "l2" : "l3";
    cells += `<i class="${cls}" title="${k}${r == null ? "" : " : " + Math.round(r * 100) + " %"}"></i>`;
  }

  const badges = BADGES.map(b => { const ok = b[3](gs); return `<div class="card badge ${ok ? "got" : "lock"}"><span class="ic">${ok ? b[0] : "🔒"}</span><b>${b[1]}</b><small>${b[2]}</small></div>`; }).join("");
  const got = BADGES.filter(b => b[3](gs)).length;

  return `<h1><span class="gt">Statistiques</span></h1>${hero}
    <div class="grid2" style="margin-top:.7rem">
      <div class="card stat"><b>${p ? Math.round(d / p * 100) + " %" : "–"}</b><span>réussite sur 7 jours</span></div>
      <div class="card stat"><b>🔥 ${Math.max(0, ...hs.map(streak))}</b><span>meilleure série en cours</span></div>
      <div class="card stat"><b>${gs.perfect}</b><span>journée${gs.perfect > 1 ? "s" : ""} parfaite${gs.perfect > 1 ? "s" : ""}</span></div>
      <div class="card stat"><b>${gs.best}</b><span>record de série</span></div></div>
    ${reviewCard()}
    <h2>Cette semaine <small>moyenne ${weekAvg}</small></h2><div class="card bars">${cols}</div>
    <h2>Équilibre <small><span class="seg"><button data-radar="7" class="${radarDays === 7 ? "on" : ""}">7 j</button><button data-radar="30" class="${radarDays === 30 ? "on" : ""}">30 j</button></span></small></h2>
    <div class="card radar">${radarSvg(radarDays)}</div>
    <h2>12 dernières semaines</h2><div class="card heat" aria-label="Calendrier des 12 dernières semaines">${cells}</div>
    ${chalSection()}
    <h2>Badges <small>${got} / ${BADGES.length}</small></h2><div class="badges">${badges}</div>
    <h2>Par habitude</h2>${hs.map(h => {
      const r = rate(h, 30), c = catOf(h.cat);
      return `<div class="card hs" style="--c:${h.color}"><div class="top"><span style="font-size:1.4rem">${esc(h.emoji)}</span><b>${esc(h.name)}</b><span class="hint" title="${c.name}">${c.emoji}</span><button class="more" data-edit="${h.id}" aria-label="Modifier">⋯</button></div>
        <div class="nums"><span><strong>${streak(h)}</strong> série</span><span><strong>${bestStreak(h)}</strong> record</span><span><strong>${total(h)}</strong> fois</span><span><strong>${r === null ? "–" : Math.round(r * 100) + " %"}</strong> sur 30 j</span></div>
        <div class="bar"><span style="width:${r === null ? 0 : Math.round(r * 100)}%"></span></div></div>`;
    }).join("")}`;
}

/* ---------- paramètres ---------- */
const sw = (k, label, desc) => `<label class="row2"><span><b>${label}</b>${desc ? `<small>${desc}</small>` : ""}</span><span class="switch"><input type="checkbox" data-sk="${k}" ${S.settings[k] ? "checked" : ""}><i></i></span></label>`;
const seg = (k, opts) => `<div class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-sk="${k}" data-sv="${v}" class="${S.settings[k] === v ? "on" : ""}">${l}</button>`).join("")}</div>`;

function notifGroup() {
  const perm = notifPerm(), on = notifOn(), ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  let state = on ? "Activées" : perm === "denied" ? "Bloquées dans le navigateur" : perm === "unsupported" ? "Non disponibles ici" : "Désactivées";
  let help = "";
  if (perm === "unsupported") help = ios ? "Sur iPhone, installe d'abord Élan sur l'écran d'accueil (bouton Télécharger), puis rouvre l'appli : les notifications seront disponibles." : "Ce navigateur ne gère pas les notifications. Essaie Chrome, Edge ou Firefox.";
  else if (perm === "denied") help = "Tu as bloqué les notifications pour ce site. Autorise-les dans les réglages du navigateur (icône 🔒 à côté de l'adresse), puis reviens ici.";
  const rows = on ? `
      ${S.settings.rem.map((r, i) => `<div class="row2"><span><b>${REM_NAMES[i]}</b></span>
        <input type="time" class="txtin" style="max-width:7rem" data-rem="${i}" data-rf="t" value="${r.t}" aria-label="Heure du ${REM_NAMES[i].toLowerCase()}">
        <span class="switch"><input type="checkbox" data-rem="${i}" data-rf="on" ${r.on ? "checked" : ""} aria-label="${REM_NAMES[i]}"><i></i></span></div>`).join("")}
      ${sw("onlyIfLeft", "Seulement s'il reste des habitudes", "Pas de rappel si tout est déjà fait")}
      ${srv.ok ? sw("serverPush", "Rappels fiables (serveur)", serverLive ? "Actifs : tu les reçois même appli fermée ✅" : "Reçois-les même appli fermée") : ""}
      <div class="row2"><span><b>Tester</b><small>Envoie une notification maintenant</small></span><button class="btn ghost" id="ntest">Envoyer un test</button></div>` : "";
  return `<div class="group"><h2>Notifications</h2><div class="card rows">
      <label class="row2"><span><b>Autoriser les notifications</b><small>${state}</small></span><span class="switch"><input type="checkbox" data-sk="notif" ${on ? "checked" : ""} ${perm === "unsupported" ? "disabled" : ""}><i></i></span></label>${rows}</div>
    ${help ? `<p class="hint" style="margin:.6rem .3rem 0">${help}</p>` : ""}
    ${on ? `<p class="hint" style="margin:.6rem .3rem 0">${serverLive ? "Les rappels sont envoyés par le serveur à l'heure choisie, même si Élan est fermé. La revue du dimanche arrive le dernier jour de la semaine." : "Les rappels partent à l'heure choisie quand Élan est ouvert ou tourne en arrière-plan. Sur Chrome (appli installée), ils peuvent aussi arriver appli fermée, selon l'économie d'énergie du téléphone."}</p>` : ""}</div>`;
}

// Sauvegarde automatique dans un fichier : seulement Chrome / Edge sur ordinateur.
function fileCard() {
  if (!fileSupported()) return "";
  const p = fileInfo.perm;
  return `<div class="card set"><b>Sauvegarde automatique dans un fichier</b>
    <p>Choisis un fichier (par exemple dans ton cloud ou ton dossier Documents) : Élan le met à jour à chaque changement.${p === "granted" && fileInfo.last ? ` Dernière écriture : ${esc(new Date(fileInfo.last).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))}.` : ""}</p>
    <div class="row">${fileHandle ? (p === "granted" ? `<button class="btn ghost" id="fileoff">Arrêter</button>` : `<button class="btn" id="reconnectfile">Reconnecter le fichier</button><button class="btn ghost" id="fileoff">Arrêter</button>`) : `<button class="btn ghost" id="pickfile">Choisir le fichier…</button>`}</div></div>`;
}
// Synchronisation chiffrée entre appareils (nécessite le serveur Cloudflare).
function syncCard() {
  if (!srv.ok) return "";
  if (S.sync) return `<div class="card set"><b>Synchronisation entre appareils</b>
    <p>Saisis ce code sur ton autre appareil (Paramètres → « J'ai déjà un code ») pour retrouver tes habitudes. <b>Garde-le secret</b> : il sert aussi de clé de chiffrement, personne ne peut lire tes données sans lui, pas même le serveur.</p>
    <div class="code" aria-label="Code de synchronisation">${esc(S.sync)}</div>
    <div class="row"><button class="btn ghost" id="synccopy">Copier</button><button class="btn ghost" id="syncnow">Synchroniser</button><button class="btn danger" id="syncdelete">Arrêter</button></div></div>`;
  return `<div class="card set"><b>Synchronisation entre appareils</b>
    <p>Retrouve tes habitudes sur ton téléphone et ton ordinateur. Tes données sont chiffrées sur l'appareil avant l'envoi : le serveur ne peut pas les lire.</p>
    <div class="row"><button class="btn" id="synccreate">Activer la synchronisation</button></div>
    <p style="margin:1rem 0 .4rem">J'ai déjà un code :</p>
    <div class="row"><input type="text" id="synccode" class="txtin" style="max-width:15rem" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX" autocomplete="off" autocapitalize="characters" aria-label="Code de synchronisation"><button class="btn ghost" id="syncjoin">Relier</button></div></div>`;
}

function viewSettings() {
  const s = S.settings, arch = S.habits.filter(h => h.archived);
  return `<h1><span class="gt">Paramètres</span></h1>
    <div class="group"><h2>Profil</h2><div class="card rows">
      <div class="row2"><span><b>Ton prénom</b><small>Pour te saluer chaque jour</small></span><input type="text" class="txtin" data-sk="name" maxlength="20" placeholder="Prénom" value="${esc(s.name)}" autocomplete="off"></div></div></div>

    <div class="group"><h2>Apparence</h2><div class="card rows">
      <div class="row2"><span><b>Thème</b></span>${seg("theme", [["auto", "Auto"], ["light", "Clair"], ["dark", "Sombre"]])}</div>
      <div class="row2"><span><b>Couleur principale</b></span><div class="swatches">${ACCENTS.map(c => `<button type="button" data-sk="accent" data-sv="${c}" style="--c:${c}" class="${s.accent === c ? "on" : ""}" aria-label="Couleur ${c}"></button>`).join("")}</div></div>
      <div class="row2"><span><b>Taille du texte</b></span>${seg("fs", [["s", "Petit"], ["m", "Normal"], ["l", "Grand"]])}</div>
      ${sw("anim", "Animations", "Compteur animé, transitions")}</div></div>

    <div class="group"><h2>Ma journée</h2><div class="card rows">
      <div class="row2"><span><b>La semaine commence le</b></span>${seg("ws", [["mon", "Lundi"], ["sun", "Dimanche"]])}</div>
      ${sw("doneLast", "Terminées en bas de liste", "Les habitudes faites descendent")}
      ${sw("streaks", "Afficher les séries 🔥", "Jours d'affilée sous chaque habitude")}
      ${sw("quote", "Citation du jour", "Un petit mot d'encouragement")}
      ${sw("joker", "Joker hebdomadaire 🃏", "Un jour de repos par semaine sans casser ta série")}</div></div>

    <div class="group"><h2>Retours</h2><div class="card rows">
      ${sw("confetti", "Confettis 🎉", "Quand la journée est à 100 %")}
      ${sw("sound", "Sons", "Petite mélodie à chaque réussite")}
      ${sw("vibrate", "Vibration", "Au toucher, sur téléphone")}</div></div>

    ${notifGroup()}

    <div class="group"><h2>Données</h2>
      <div class="card set"><b>Sauvegarde</b><p>Tes données sont sur cet appareil. Exporte-les pour les garder en sécurité ou les passer sur un autre appareil.${S.backup ? ` Dernière sauvegarde : ${esc(new Date(S.backup).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }))}.` : ""}</p>
        <div class="row"><button class="btn ghost" id="export">Exporter (fichier)</button><button class="btn ghost" id="import">Importer…</button></div>
        <input type="file" id="file" accept="application/json,.json" hidden></div>
      ${fileCard()}${syncCard()}
      ${arch.length ? `<div class="card set"><b>Habitudes archivées</b><p>Elles n'apparaissent plus mais gardent leur historique.</p>${arch.map(h => `<div class="row" style="align-items:center;margin-bottom:.4rem"><span>${esc(h.emoji)}</span><span style="flex:1">${esc(h.name)}</span><button class="btn ghost" data-restore="${h.id}">Restaurer</button></div>`).join("")}</div>` : ""}
      <div class="card set"><b>Zone sensible</b><p>Effacer supprime toutes les habitudes et tout l'historique de cet appareil (tes paramètres sont gardés). Action définitive.</p>
        <div class="row"><button class="btn danger" id="wipe">Tout effacer</button><button class="btn ghost" id="resetset">Réinitialiser les paramètres</button><button class="btn ghost" id="replay">Revoir la présentation</button></div></div></div>

    ${installed() ? "" : `<div class="group"><h2>Application</h2><div class="card set"><b>Télécharger l'application</b><p>Ajoute Élan à ton écran d'accueil : elle s'ouvre comme une vraie app, même sans internet.</p><button class="btn" id="dl">⬇ Télécharger</button></div></div>`}
    <p class="legal">Élan · gratuit, sans compte, sans pub.<br>Aucune donnée n'est envoyée sur internet.</p>`;
}

/* ---------- fenêtre d'édition ---------- */
const dlg = $("#dlg");
let form = null;
function openForm(id) {
  const h = id ? S.habits.find(x => x.id === id) : null;
  form = h ? { ...h, days: [...h.days], id: h.id, gt: h.goal ? String(h.goal.target).replace(".", ",") : "", gu: h.goal ? h.goal.unit : "", ch: h.challenge && !h.challenge.completed ? h.challenge.days : 0 }
           : { id: null, name: "", emoji: EMOJIS[0], color: COLORS[0], cat: "other", days: [0,1,2,3,4,5,6], gt: "", gu: "", ch: 0 };
  drawForm(); dlg.showModal();
  if (!h) setTimeout(() => dlg.querySelector("#fname").focus(), 50);
}
function drawForm() {
  const isNew = !form.id;
  dlg.innerHTML = `<form method="dialog" id="f" novalidate>
    <h3>${isNew ? "Nouvelle habitude" : "Modifier l'habitude"}</h3>
    ${isNew ? `<div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Exemples</b><div class="exs">${SUGGEST.map((s, i) => `<button type="button" class="chip" data-ex="${i}">${s[0]} ${esc(s[1])}</button>`).join("")}</div></div>` : ""}
    <label class="f">Nom<input type="text" id="fname" maxlength="60" placeholder="Ex. : Lire 10 minutes" autocomplete="off" value="${esc(form.name)}"></label>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Catégorie <span class="hint">(pour le graphique d'équilibre)</span></b><div class="cats">${CATS.map(c => `<button type="button" class="chip${c.id === form.cat ? " on" : ""}" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join("")}</div></div>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Icône</b><div class="emojis">${EMOJIS.map(e => `<button type="button" data-emoji="${e}" class="${e === form.emoji ? "on" : ""}">${e}</button>`).join("")}</div></div>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Couleur</b><div class="colors">${COLORS.map(c => `<button type="button" data-color="${c}" style="--c:${c}" class="${c === form.color ? "on" : ""}" aria-label="Couleur ${c}"></button>`).join("")}</div></div>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Jours concernés</b><div class="dow">${WD.map((w, i) => `<button type="button" data-dow="${i}" class="${form.days.includes(i) ? "on" : ""}" aria-label="${WDLONG[i]}">${w}</button>`).join("")}</div>
      <div class="presets"><button type="button" data-preset="all">Tous les jours</button><button type="button" data-preset="week">Semaine</button><button type="button" data-preset="we">Week-end</button></div></div>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">Objectif chiffré <span class="hint">(facultatif)</span></b>
      <div class="goalrow"><input type="text" id="gt" inputmode="decimal" autocomplete="off" placeholder="Ex. : 10" value="${esc(form.gt)}" aria-label="Quantité à atteindre"><input type="text" id="gu" maxlength="12" autocomplete="off" placeholder="km, pages, min…" value="${esc(form.gu)}" aria-label="Unité"></div>
      <span class="hint">Avec un objectif, tu règles ta progression de 0 à 100 % avec une jauge. Sans objectif, c'est une simple case à cocher.</span></div>
    <div class="f" style="display:grid;gap:.35rem"><b style="font-size:.92rem">🎯 Défi <span class="hint">(facultatif)</span></b>
      <div class="cats">${[[0, "Aucun"], [7, "7 jours"], [21, "21 jours"], [30, "30 jours"]].map(([n, l]) => `<button type="button" class="chip${form.ch === n ? " on" : ""}" data-ch="${n}">${l}</button>`).join("")}</div>
      <span class="hint">Valide cette habitude le nombre de jours choisi (pas forcément d'affilée) pour décrocher un badge. Le compte démarre aujourd'hui.</span></div>
    <p id="ferr" style="color:#d64545;margin:0;min-height:1.2em" role="alert"></p>
    <div class="acts">${isNew ? "" : `<button type="button" class="btn danger" id="arch">Archiver</button>`}
      <div class="r"><button type="button" class="btn ghost" id="cancel">Annuler</button><button type="submit" class="btn" id="ok">Enregistrer</button></div></div>
    ${isNew ? "" : `<button type="button" class="btn danger block" id="del" style="margin-top:-.2rem">Supprimer définitivement</button>`}
  </form>`;
}
dlg.addEventListener("click", e => {
  if (e.target === dlg) { dlg.close(); return; }                     // clic sur le fond
  const b = e.target.closest("button"); if (!b) return;
  const keep = () => { const n = dlg.querySelector("#fname"); if (!n) return; form.name = n.value; form.gt = dlg.querySelector("#gt").value; form.gu = dlg.querySelector("#gu").value; };
  if (b.dataset.addroutine) { addRoutine(b.dataset.addroutine); return; }
  if (b.dataset.ex !== undefined) {
    const [emoji, name, target, unit, cat] = SUGGEST[+b.dataset.ex];
    Object.assign(form, { name, emoji, cat, gt: target ? String(target) : "", gu: unit }); drawForm();
  } else if (b.dataset.ch !== undefined) { keep(); form.ch = +b.dataset.ch; drawForm(); }
  else if (b.dataset.cat) { keep(); form.cat = b.dataset.cat; drawForm(); }
  else if (b.dataset.emoji) { keep(); form.emoji = b.dataset.emoji; drawForm(); }
  else if (b.dataset.color) { keep(); form.color = b.dataset.color; drawForm(); }
  else if (b.dataset.dow !== undefined) {
    keep(); const i = +b.dataset.dow;
    form.days = form.days.includes(i) ? form.days.filter(x => x !== i) : [...form.days, i]; drawForm();
  } else if (b.dataset.preset) {
    keep(); form.days = b.dataset.preset === "all" ? [0,1,2,3,4,5,6] : b.dataset.preset === "week" ? [0,1,2,3,4] : [5,6]; drawForm();
  } else if (b.id === "cancel") dlg.close();
  else if (b.id === "arch") { S.habits.find(h => h.id === form.id).archived = true; save(); dlg.close(); toast("Habitude archivée (Paramètres pour la restaurer)."); render(); }
  else if (b.id === "del") {
    if (confirm("Supprimer cette habitude et tout son historique ?")) {
      S.habits = S.habits.filter(h => h.id !== form.id);
      for (const k of Object.keys(S.log)) { S.log[k] = S.log[k].filter(i => i !== form.id); if (!S.log[k].length) delete S.log[k]; }
      for (const k of Object.keys(S.prog)) { delete S.prog[k][form.id]; if (!Object.keys(S.prog[k]).length) delete S.prog[k]; }
      save(); dlg.close(); render();
    }
  }
});
dlg.addEventListener("submit", e => {
  e.preventDefault();
  const name = dlg.querySelector("#fname").value.trim();
  const err = dlg.querySelector("#ferr");
  if (!name) { err.textContent = "Donne un nom à ton habitude."; return; }
  if (!form.days.length) { err.textContent = "Choisis au moins un jour."; return; }
  const gtRaw = dlg.querySelector("#gt").value.trim(), target = parseFloat(gtRaw.replace(",", "."));
  if (gtRaw && !(target > 0 && target <= 1e6)) { err.textContent = "L'objectif doit être un nombre positif (ex. : 10)."; return; }
  const goal = gtRaw ? { target, unit: dlg.querySelector("#gu").value.trim().slice(0, 12) } : null;
  const newChal = () => form.ch ? { days: form.ch, start: todayKey(), completed: "" } : null;
  if (form.id) {
    const h = S.habits.find(x => x.id === form.id), old = h.challenge;
    // défi : on garde le défi en cours s'il n'a pas changé, un défi réussi reste dans l'historique
    const challenge = old && !old.completed && old.days === form.ch ? old : (old && old.completed && !form.ch ? old : newChal());
    Object.assign(h, { name, emoji: form.emoji, color: form.color, cat: form.cat, days: [...form.days].sort(), goal, challenge });
    // Objectif retiré : l'avancement partiel n'a plus de sens, on le supprime (les jours terminés restent faits).
    if (!goal) for (const k of Object.keys(S.prog)) { delete S.prog[k][h.id]; if (!Object.keys(S.prog[k]).length) delete S.prog[k]; }
  } else S.habits.push({ id: uid(), name, emoji: form.emoji, color: form.color, cat: form.cat, days: [...form.days].sort(), created: todayKey(), archived: false, goal, challenge: newChal() });
  save(); dlg.close(); render();
});

/* ---------- routines ---------- */
function openRoutines() {
  dlg.innerHTML = `<form method="dialog" style="display:grid;gap:.8rem;padding:1.2rem">
    <h3 style="margin:0">📦 Routines en un clic</h3>
    <p style="margin:0;color:var(--muted);font-size:.92rem">Ajoute plusieurs habitudes d'un coup. Tu pourras ensuite les modifier ou en supprimer.</p>
    ${ROUTINES.map(r => `<div class="card routine"><div class="rt-h"><span class="rt-e">${r.emoji}</span><span><b>${esc(r.name)}</b><small>${esc(r.desc)}</small></span>
        <button type="button" class="btn" data-addroutine="${r.id}">Ajouter</button></div>
        <p class="hint" style="margin:.5rem 0 0">${r.items.map(i => esc(i[0] + " " + i[1])).join(" · ")}</p></div>`).join("")}
    <button type="button" class="btn ghost" id="cancel">Fermer</button></form>`;
  dlg.showModal();
}
function addRoutine(id) {
  const r = ROUTINES.find(x => x.id === id); if (!r) return;
  const have = new Set(S.habits.map(h => h.name.toLowerCase()));
  let n = 0;
  for (const [emoji, name, target, unit, cat] of r.items) {
    if (have.has(name.toLowerCase())) continue;
    S.habits.push({ id: uid(), name, emoji, cat, color: COLORS[S.habits.length % COLORS.length], days: [0,1,2,3,4,5,6], created: todayKey(), archived: false, goal: target ? { target, unit } : null });
    n++;
  }
  save(); dlg.close(); tab = "today"; render();
  toast(n ? `${n} habitude${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""} ✨` : "Tu as déjà toutes ces habitudes.");
}

/* ---------- événements ---------- */
function setSetting(k, v) { S.settings[k] = v; applySettings(); save(); render(); }

$("#fab").addEventListener("click", () => openForm());
document.querySelector(".tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { tab = b.dataset.tab; render(); window.scrollTo(0, 0); } });

$("#app").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const d = b.dataset;
  if (d.sk && d.sv !== undefined) { setSetting(d.sk, d.sv); return; }
  if (d.toggle) {
    const was = forDay(sel).every(h => done(h, sel));
    toggle(d.toggle, sel);
    const now = forDay(sel).length && forDay(sel).every(h => done(h, sel));
    const won = checkChallenges();
    render(); buzz();
    if (won) celebrateChallenge(won);
    else if (now && !was) celebrate(); else if (S.habits.find(h => h.id === d.toggle) && done(S.habits.find(h => h.id === d.toggle), sel)) beep([660]);
  }
  else if (d.edit) openForm(d.edit);
  else if (d.day) { sel = d.day; render(); }
  else if (d.week) { const t = todayKey(), n = addDays(sel, +d.week === -1 ? -7 : 7); sel = n > t ? t : n; render(); }
  else if (d.radar) { radarDays = +d.radar; render(); }
  else if (d.rv) { reviewOff = +d.rv; render(); }
  else if ("joker" in d) { if (!toggleJoker(sel)) toast("Un seul joker par semaine."); else if (isJoker(sel)) toast("Joker utilisé : ta série est protégée 🃏"); render(); }
  else if ("review" in d) { tab = "stats"; reviewOff = 0; render(); const r = $("#review"); if (r) r.scrollIntoView({ behavior: "smooth", block: "start" }); }
  else if ("routines" in d) openRoutines();
  else if ("share" in d) shareWeek();
  else if (b.id === "replay") { S.onboarded = false; save(true); openOnboarding(); }
  else if ("new" in d) openForm();
  else if (d.sug !== undefined) {
    const [emoji, name, target, unit, cat] = SUGGEST[+d.sug];
    S.habits.push({ id: uid(), name, emoji, cat, color: COLORS[S.habits.length % COLORS.length], days: [0,1,2,3,4,5,6], created: todayKey(), archived: false, goal: target ? { target, unit } : null });
    save(); render();
  }
  else if (d.restore) { S.habits.find(h => h.id === d.restore).archived = false; save(); render(); }
  else if (b.id === "export" || "export" in d) { exportData(); toast("Sauvegarde téléchargée 💾"); render(); }
  else if ("snooze" in d) { S.snooze = Date.now() + 7 * 864e5; save(true); render(); }
  else if (b.id === "import") $("#file").click();
  else if (b.id === "wipe") {
    if (confirm("Tout effacer définitivement ? Pense à exporter avant.")) { S.habits = []; S.log = {}; S.prog = {}; S.jokers = []; shown = 0; save(); tab = "today"; toast("Données effacées."); render(); }
  }
  else if (b.id === "resetset") { S.settings = clean({}).settings; applySettings(); save(); toast("Paramètres réinitialisés."); render(); }
  else if (b.id === "ntest") testNotif();
  else if (b.id === "pickfile") pickFile();
  else if (b.id === "reconnectfile") reconnectFile();
  else if (b.id === "fileoff") fileOff();
  else if (b.id === "synccreate") syncCreate();
  else if (b.id === "syncjoin") syncJoin($("#synccode").value);
  else if (b.id === "syncnow") { syncPull().then(r => { toast(r === "error" ? "Synchro impossible pour l'instant." : "Synchronisé ✅"); render(); }); }
  else if (b.id === "syncdelete") syncDelete();
  else if (b.id === "synccopy") { navigator.clipboard && navigator.clipboard.writeText(S.sync).then(() => toast("Code copié 📋"), () => toast("Copie impossible : note le code à la main.")); }
  else if (b.id === "dl") download();
});
// Jauge et paramètres : mise à jour en direct pendant le glissement ou la saisie.
$("#app").addEventListener("input", e => {
  if (e.target.dataset.gauge) live(e.target);
  else if (e.target.dataset.sk === "name") { S.settings.name = e.target.value.slice(0, 20); save(); }
});
$("#app").addEventListener("change", e => {
  const el = e.target;
  if (el.dataset.gauge) {
    const hs = forDay(sel), all = hs.length && hs.every(h => done(h, sel));
    save(); const won = checkChallenges(); render();
    if (won) celebrateChallenge(won); else if (all) celebrate();
    return;
  }
  if (el.dataset.rem !== undefined) {
    const r = S.settings.rem[+el.dataset.rem];
    if (el.dataset.rf === "on") { r.on = el.checked; save(); render(); }
    else if (/^([01]\d|2[0-3]):[0-5]\d$/.test(el.value)) { r.t = el.value; idbSet("fired", { date: todayKey(), ids: [] }).catch(() => {}); save(); }
    return;
  }
  if (el.dataset.sk === "notif") { if (el.checked) enableNotifs(); else { S.settings.notif = false; save(); pushOff().then(render); } return; }
  if (el.dataset.sk === "serverPush") { S.settings.serverPush = el.checked; save(); (el.checked ? pushNow() : pushOff()).then(render); return; }
  if (el.type === "checkbox" && el.dataset.sk) { setSetting(el.dataset.sk, el.checked); return; }
  if (el.id !== "file" || !el.files[0]) return;
  const f = el.files[0];
  if (f.size > 5e6) { toast("Fichier trop gros."); return; }
  f.text().then(txt => {
    const n = clean(JSON.parse(txt));
    if (!n.habits.length) throw new Error("vide");
    if (!confirm(`Importer ${n.habits.length} habitude(s) ? Elles remplaceront les données actuelles.`)) return;
    n.sync = S.sync; n.settings.notif = S.settings.notif; n.settings.rem = S.settings.rem;     // ce qui est propre à cet appareil est conservé
    S = n; applySettings(); save(); tab = "today"; toast("Import réussi."); render();
  }).catch(() => toast("Fichier invalide."));
});

/* ---------- notifications ----------
   Deux modes : rappels « locaux » (partent quand Élan est ouvert, ou via la synchro périodique de Chrome) et rappels
   « fiables » envoyés par un petit serveur Cloudflare (même appli fermée), disponibles quand le site est hébergé avec ce serveur. */
const notifSupported = () => "Notification" in window && "serviceWorker" in navigator;
const notifPerm = () => "Notification" in window ? Notification.permission : "unsupported";
const notifOn = () => S.settings.notif && notifPerm() === "granted";
const REM_TITLES = ["Bonjour ☀️", "Petit point 🌿", "Bilan du soir 🌙", "Ta revue de la semaine 📋"];

// Petite base IndexedDB partagée avec le service worker (qui n'a pas accès à localStorage).
const idb = (mode, fn) => new Promise((res, rej) => {
  const q = indexedDB.open("elan", 1);
  q.onupgradeneeded = () => q.result.createObjectStore("kv");
  q.onerror = () => rej(q.error);
  q.onsuccess = () => { const tx = q.result.transaction("kv", mode), r = fn(tx.objectStore("kv")); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); };
});
const idbGet = k => idb("readonly", s => s.get(k));
const idbSet = (k, v) => idb("readwrite", s => s.put(v, k));

// Le dernier jour de la semaine (dimanche, ou samedi si la semaine commence le dimanche) : jour de la revue.
const isReviewDay = t => t === addDays(wk(t), 6);

function buildMsg(i) {
  const t = todayKey(), all = forDay(t).filter(h => !skipped(h, t)), left = all.filter(h => !done(h, t)), nm = S.settings.name, who = nm ? nm + ", " : "";
  if (i === 3) {
    if (!isReviewDay(t)) return null;
    const ws = weekStats(wk(t)); if (ws.score === null) return null;
    return { title: REM_TITLES[3], body: `Score de la semaine : ${Math.round(ws.score)} %, ${ws.done} validation${ws.done > 1 ? "s" : ""}. Viens voir le détail !` };
  }
  if (!all.length) return null;
  const list = left.slice(0, 4).map(h => h.name).join(", ") + (left.length > 4 ? "…" : ""), pl = left.length > 1 ? "s" : "";
  if (S.settings.onlyIfLeft && !left.length) return null;
  if (i === 0) return { title: `Bonjour${nm ? " " + nm : ""} ☀️`, body: `${all.length} habitude${all.length > 1 ? "s" : ""} t'attendent aujourd'hui : ${list}.` };
  if (i === 1) return { title: REM_TITLES[1], body: left.length ? `${who}il te reste ${left.length} habitude${pl} : ${list}.` : "Tout est fait pour l'instant, bravo !" };
  return { title: REM_TITLES[2], body: left.length ? `${who}encore un effort, il reste ${left.length} habitude${pl} : ${list}.` : `Journée à ${Math.round(dayPct(t))} % : bravo ! 🎉` };
}
// Copie des rappels pour le service worker.
function mirror() {
  if (!window.indexedDB) return;
  const st = {
    date: todayKey(), notif: notifOn(), server: serverLive,
    rem: S.settings.rem.map((r, i) => { const m = buildMsg(i); return { on: r.on, t: r.t, skip: !m, title: m && m.title, body: m && m.body, dow: i === 3 ? (S.settings.ws === "sun" ? 6 : 0) : -1 }; })
  };
  idbSet("state", st).catch(() => {});
}
async function notify(title, body, tag) {
  try { const reg = await navigator.serviceWorker.ready; await reg.showNotification(title, { body, icon: "icons/blank-96.png", badge: "icons/badge-96.png", tag, data: { url: "./" } }); }
  catch (_) { try { new Notification(title, { body, icon: "icons/blank-96.png" }); } catch (__) {} }
}
async function registerPeriodic() {
  try { const reg = await navigator.serviceWorker.ready; if (reg.periodicSync) await reg.periodicSync.register("elan-remind", { minInterval: 3600 * 1000 }); } catch (_) {}
}
let checking = false;
async function checkReminders() {
  if (!notifOn() || checking || serverLive) return;       // en mode serveur, c'est lui qui envoie
  checking = true;
  try {
    const now = new Date(), today = todayKey(), mins = now.getHours() * 60 + now.getMinutes();
    let fired = (await idbGet("fired")) || {}; if (fired.date !== today) fired = { date: today, ids: [] };
    let changed = false;
    S.settings.rem.forEach((r, i) => {
      if (!r.on || fired.ids.includes(i)) return;
      const [h, m] = r.t.split(":").map(Number), at = h * 60 + m;
      if (mins < at || mins - at > 90) return;                 // pas encore l'heure, ou trop tard pour que ça serve encore
      fired.ids.push(i); changed = true;
      const msg = buildMsg(i); if (msg) notify(msg.title, msg.body, "elan-" + i);
    });
    if (changed) await idbSet("fired", fired);
  } catch (_) {} finally { checking = false; }
}
async function enableNotifs() {
  if (!("Notification" in window)) { toast("Les notifications ne sont pas disponibles ici."); render(); return; }
  let p = Notification.permission;
  if (p === "default") { try { p = await Notification.requestPermission(); } catch (_) {} }
  if (p === "granted") {
    S.settings.notif = true; save(); registerPeriodic();
    await probeServer(); await pushNow();
    notify("Notifications activées ✅", serverLive ? "Rappels fiables activés : tu les recevras même appli fermée." : "Tu recevras tes rappels d'habitudes à l'heure choisie.", "elan-on"); toast("Notifications activées.");
  } else {
    S.settings.notif = false; save();
    toast(p === "denied" ? "Notifications bloquées : autorise-les dans les réglages du navigateur." : "Autorisation refusée.");
  }
  render();
}

/* ---------- rappels fiables (serveur Cloudflare) ---------- */
const api = async (path, body, method) => {
  const r = await fetch("api/" + path, { method: method || "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error || String(r.status)); e.status = r.status; throw e; }
  return j;
};
const b64uBytes = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), c => c.charCodeAt(0));
let srv = { checked: false, ok: false, key: "" }, serverLive = false, pushTimer = 0;

// Le serveur n'existe que si le site est hébergé avec le Worker Cloudflare : on le détecte.
async function probeServer() {
  try { const j = await api("push/key", undefined, "GET"); srv = { checked: true, ok: !!j.key, key: j.key || "" }; }
  catch (_) { srv = { checked: true, ok: false, key: "" }; }
  return srv;
}
async function ensureSub() {
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try { sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(srv.key) }); }
    catch (_) { const old = await reg.pushManager.getSubscription(); if (old) await old.unsubscribe(); sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uBytes(srv.key) }); }
  }
  return sub;
}
function pushItems() {
  const out = [];
  S.settings.rem.forEach((r, i) => {
    if (!r.on) return;
    const m = buildMsg(i), alt = i === 3 ? "Découvre ta revue de la semaine dans Élan." : "Prends un moment pour cocher tes habitudes du jour.";
    out.push({ time: r.t, title: m ? m.title : REM_TITLES[i], body: m ? m.body : alt, alt, skip: !m, days: i === 3 ? [S.settings.ws === "sun" ? 6 : 0] : null });
  });
  return out;
}
// Envoie au serveur l'abonnement + les rappels (et les messages à jour). Appelé après chaque enregistrement, en différé.
function pushSoon() { clearTimeout(pushTimer); if (srv.ok && notifOn() && S.settings.serverPush) pushTimer = setTimeout(pushNow, 2500); }
async function pushNow() {
  if (!srv.ok || !notifOn() || !S.settings.serverPush) { if (serverLive) { serverLive = false; mirror(); } return; }
  try {
    const sub = await ensureSub();
    await api("push/save", { sub: sub.toJSON(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, d: todayKey(), items: pushItems() });
    if (!serverLive) { serverLive = true; mirror(); }
  } catch (_) { if (serverLive) { serverLive = false; mirror(); } }
}
async function pushOff() {
  clearTimeout(pushTimer); serverLive = false;
  try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { if (srv.ok) await api("push/remove", { endpoint: sub.endpoint }).catch(() => {}); await sub.unsubscribe(); } } catch (_) {}
  mirror();
}
async function testNotif() {
  if (serverLive) {
    try { const sub = await ensureSub(); await api("push/test", { endpoint: sub.endpoint }); toast("Notification envoyée par le serveur ✅"); return; } catch (_) {}
  }
  notify("Ça marche ! 🔔", "Voilà à quoi ressembleront tes rappels Élan.", "elan-test");
}

/* ---------- sauvegarde ---------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: "elan", version: 2, ...S, sync: "" }, null, 1)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `elan-${todayKey()}.json`;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  S.backup = Date.now(); save(true);
}
// Rappel de sauvegarde : si rien n'est copié ailleurs depuis 14 jours.
function backupBanner() {
  if (!S.habits.length || S.sync || fileInfo.perm === "granted") return "";
  const first = S.habits.reduce((m, h) => h.created < m ? h.created : m, "9999-99-99"), ref = S.backup || parse(first).getTime(), now = Date.now();
  if (now - ref < 14 * 864e5 || now < S.snooze) return "";
  return `<div class="joker"><span>💾 <b>Pense à sauvegarder tes données</b> : elles ne sont que sur cet appareil.</span><span class="row" style="display:flex;gap:.4rem"><button class="btn ghost" data-export>Exporter</button><button class="btn ghost" data-snooze>Plus tard</button></span></div>`;
}

// Sauvegarde automatique dans un fichier (Chrome / Edge sur ordinateur).
const fileSupported = () => "showSaveFilePicker" in window;
let fileHandle = null, fileTimer = 0, fileInfo = { perm: "none", last: 0 };
async function fileInit() {
  if (!fileSupported()) return;
  try { fileHandle = await idbGet("fileHandle") || null; if (fileHandle) fileInfo.perm = await fileHandle.queryPermission({ mode: "readwrite" }); } catch (_) {}
  if (fileInfo.perm === "granted") fileSoon();
}
async function pickFile() {
  try {
    const h = await showSaveFilePicker({ suggestedName: "elan-sauvegarde.json", types: [{ description: "Sauvegarde Élan", accept: { "application/json": [".json"] } }] });
    fileHandle = h; fileInfo.perm = "granted"; await idbSet("fileHandle", h).catch(() => {}); await fileWrite(); toast("Sauvegarde automatique activée.");
  } catch (e) { if (e && e.name !== "AbortError") toast("Impossible d'utiliser ce fichier."); }
  render();
}
async function reconnectFile() {
  try { fileInfo.perm = await fileHandle.requestPermission({ mode: "readwrite" }); if (fileInfo.perm === "granted") await fileWrite(); } catch (_) {}
  render();
}
async function fileWrite() {
  if (!fileHandle || fileInfo.perm !== "granted") return;
  try {
    const w = await fileHandle.createWritable();
    await w.write(JSON.stringify({ app: "elan", version: 2, ...S, sync: "" }, null, 1)); await w.close();
    fileInfo.last = Date.now(); S.backup = fileInfo.last; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {}
  } catch (_) { fileInfo.perm = "prompt"; }
}
function fileSoon() { clearTimeout(fileTimer); if (fileHandle && fileInfo.perm === "granted") fileTimer = setTimeout(fileWrite, 2000); }
async function fileOff() { fileHandle = null; fileInfo.perm = "none"; clearTimeout(fileTimer); await idbSet("fileHandle", null).catch(() => {}); render(); }

/* ---------- synchronisation entre appareils (chiffrée de bout en bout) ----------
   Un code secret est généré sur l'appareil. Il ne quitte jamais l'appareil : le serveur ne voit qu'un identifiant dérivé
   du code et des données chiffrées. Pour relier un autre appareil, on y saisit le même code. */
const SYNC_ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newSyncCode = () => [...crypto.getRandomValues(new Uint8Array(20))].map(x => SYNC_ALPHA[x & 31]).join("").match(/.{4}/g).join("-");
const syncOk = () => srv.ok && !!S.sync;
let syncTimer = 0, syncBusy = false, syncLast = 0;
const b64 = u8 => btoa(String.fromCharCode(...u8));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function syncKeys(code) {
  const norm = code.replace(/-/g, ""), te = new TextEncoder();
  const sha = async s => new Uint8Array(await crypto.subtle.digest("SHA-256", te.encode(s)));
  const id = [...(await sha("elan-id:" + norm)).slice(0, 16)].map(b => b.toString(16).padStart(2, "0")).join("");
  return { id, key: await crypto.subtle.importKey("raw", await sha("elan-key:" + norm), "AES-GCM", false, ["encrypt", "decrypt"]) };
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
  const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return b64(out);
}
async function unseal(key, str) {
  const raw = unb64(str);
  return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, key, raw.slice(12))));
}
const syncData = () => ({ habits: S.habits, log: S.log, prog: S.prog, jokers: S.jokers, name: S.settings.name });
async function syncPush() {
  if (!syncOk()) return;
  const { id, key } = await syncKeys(S.sync);
  await api("sync/" + id, { t: S.updated, d: await seal(key, syncData()) }, "PUT");
  syncLast = Date.now();
}
function syncSoon() { clearTimeout(syncTimer); if (syncOk()) syncTimer = setTimeout(() => syncPush().catch(() => {}), 4000); }
// Récupère la version du serveur si elle est plus récente ; sinon envoie la nôtre. force = remplacer sans comparer.
async function syncPull(force) {
  if (!syncOk() || syncBusy) return "off";
  syncBusy = true;
  try {
    const { id, key } = await syncKeys(S.sync);
    let j; try { j = await api("sync/" + id, undefined, "GET"); } catch (e) { if (e.status === 404) return "none"; throw e; }
    if (force || j.t > S.updated) {
      const remote = await unseal(key, j.d);
      const n = clean({ ...remote, settings: { ...S.settings, name: remote.name || S.settings.name }, sync: S.sync, backup: S.backup, snooze: S.snooze });
      S.habits = n.habits; S.log = n.log; S.prog = n.prog; S.jokers = n.jokers; S.settings.name = n.settings.name; S.updated = j.t;
      save(true); syncLast = Date.now(); render(); return "pulled";
    }
    if (j.t < S.updated) { syncBusy = false; await syncPush(); return "pushed"; }
    syncLast = Date.now(); return "same";
  } catch (_) { return "error"; } finally { syncBusy = false; }
}
async function syncCreate() {
  S.sync = newSyncCode(); save(true);
  try { await syncPush(); toast("Synchronisation activée. Note bien ton code !"); } catch (_) { S.sync = ""; save(true); toast("Le serveur n'a pas répondu, réessaie."); }
  render();
}
async function syncJoin(code) {
  const c = code.toUpperCase().replace(/[^A-Z2-9]/g, "").match(/.{1,4}/g);
  const norm = c ? c.join("-") : "";
  if (!/^[A-Z2-9]{4}(-[A-Z2-9]{4}){4}$/.test(norm)) { toast("Code invalide (20 caractères, par groupes de 4)."); return; }
  if (S.habits.length && !confirm("Les habitudes de cet appareil seront remplacées par celles du code saisi. Continuer ?")) return;
  const prev = S.sync; S.sync = norm;
  const r = await syncPull(true);
  if (r === "pulled") toast("Appareil relié : données récupérées ✅");
  else { S.sync = prev; save(true); toast(r === "none" ? "Code introuvable." : "Connexion impossible, réessaie."); }
  render();
}
async function syncDelete() {
  if (!S.sync || !confirm("Supprimer la copie en ligne et arrêter la synchronisation ? Tes données restent sur cet appareil.")) return;
  try { const { id } = await syncKeys(S.sync); await api("sync/" + id, undefined, "DELETE"); } catch (_) {}
  S.sync = ""; save(true); toast("Copie en ligne supprimée."); render();
}

/* ---------- écran de bienvenue (3 étapes) ---------- */
let ob = { step: 0, name: "", goals: [], picks: [], chal: true };
const obList = () => {
  const g = ob.goals.length ? ob.goals : ["sport", "mind", "nutri"], idx = [];
  SUGGEST.forEach((s, i) => { if (g.includes(s[4]) && idx.length < 7) idx.push(i); });
  return idx;
};
function openOnboarding() {
  ob = { step: 0, name: S.settings.name, goals: [], picks: [], chal: true };
  $("#ob").hidden = false; document.body.style.overflow = "hidden"; obRender();
}
function obClose() { $("#ob").hidden = true; document.body.style.overflow = ""; }
function obRender() {
  const dots = [0, 1, 2].map(i => `<i class="${i === ob.step ? "on" : ""}"></i>`).join("");
  let body;
  if (ob.step === 0) body = `<img src="icons/icon-192.png" alt="" width="96" height="96" class="ob-logo">
    <h1 class="ob-h">Bienvenue sur <span class="gt">Élan</span></h1>
    <p class="ob-p">Construis de bonnes habitudes, un jour à la fois : séries, jauges, défis et statistiques. Gratuit, sans compte, et tes données restent chez toi.</p>
    <label class="f" style="text-align:left">Comment t'appelles-tu ? <span class="hint">(facultatif)</span><input type="text" id="obname" maxlength="20" placeholder="Ton prénom" autocomplete="given-name" value="${esc(ob.name)}"></label>
    <button class="btn block" data-obnext>Commencer →</button>`;
  else if (ob.step === 1) body = `<h1 class="ob-h">Qu'est-ce qui compte pour toi ?</h1>
    <p class="ob-p">Choisis un ou plusieurs thèmes : on te proposera des habitudes adaptées.</p>
    <div class="ob-goals">${GOALS.map(([id, e, l]) => `<button type="button" class="obgoal${ob.goals.includes(id) ? " on" : ""}" data-obgoal="${id}"><span>${e}</span>${l}</button>`).join("")}</div>
    <div class="ob-nav"><button class="btn ghost" data-obback>Retour</button><button class="btn" data-obnext>Suivant →</button></div>`;
  else body = `<h1 class="ob-h">Tes premières habitudes</h1>
    <p class="ob-p">Garde celles qui te plaisent : commence petit, tu pourras en ajouter ensuite.</p>
    <div class="ob-picks">${obList().map(i => `<button type="button" class="obpick${ob.picks.includes(i) ? " on" : ""}" data-obpick="${i}"><span>${SUGGEST[i][0]} ${esc(SUGGEST[i][1])}</span><b>${ob.picks.includes(i) ? "✓" : ""}</b></button>`).join("")}</div>
    <button type="button" class="obpick${ob.chal ? " on" : ""}" data-obchal style="margin-top:.8rem"><span>🎯 Relever un défi de 30 jours sur la première</span><b>${ob.chal ? "✓" : ""}</b></button>
    <div class="ob-nav"><button class="btn ghost" data-obback>Retour</button><button class="btn" data-obfinish>C'est parti 🚀</button></div>`;
  $("#ob").innerHTML = `<div class="ob-in"><div class="ob-top"><span class="ob-dots">${dots}</span><button class="ob-skip" data-obskip>Passer</button></div>${body}</div>`;
}
function obFinish() {
  S.settings.name = ob.name.trim().slice(0, 20);
  const have = new Set(S.habits.map(h => h.name.toLowerCase())); let first = null, n = 0;
  for (const i of ob.picks) {
    const [emoji, name, target, unit, cat] = SUGGEST[i];
    if (have.has(name.toLowerCase())) continue;
    const h = { id: uid(), name, emoji, cat, color: COLORS[S.habits.length % COLORS.length], days: [0,1,2,3,4,5,6], created: todayKey(), archived: false, goal: target ? { target, unit } : null,
      challenge: !first && ob.chal ? { days: 30, start: todayKey(), completed: "" } : null };
    if (!first) first = h;
    S.habits.push(h); n++;
  }
  S.onboarded = true; save(); obClose(); tab = "today"; sel = todayKey(); shown = 0; applySettings(); render();
  if (n) { confetti(); toast(`C'est parti${S.settings.name ? " " + S.settings.name : ""} ! ${n} habitude${n > 1 ? "s" : ""} ajoutée${n > 1 ? "s" : ""} ✨`); }
}
$("#ob").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const d = b.dataset;
  if ("obskip" in d) { S.onboarded = true; save(true); obClose(); return; }
  if ("obnext" in d) { if (ob.step === 1) ob.picks = obList().slice(0, 3); ob.step++; obRender(); return; }
  if ("obback" in d) { ob.step--; obRender(); return; }
  if (d.obgoal) { ob.goals = ob.goals.includes(d.obgoal) ? ob.goals.filter(x => x !== d.obgoal) : [...ob.goals, d.obgoal]; obRender(); return; }
  if (d.obpick !== undefined) { const i = +d.obpick; ob.picks = ob.picks.includes(i) ? ob.picks.filter(x => x !== i) : [...ob.picks, i]; obRender(); return; }
  if ("obchal" in d) { ob.chal = !ob.chal; obRender(); return; }
  if ("obfinish" in d) obFinish();
});
$("#ob").addEventListener("input", e => { if (e.target.id === "obname") ob.name = e.target.value; });

/* ---------- divers ---------- */
let tt;
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600); }

let deferred = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; });
window.addEventListener("appinstalled", () => { deferred = null; toast("Application installée !"); render(); });
const installed = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// Bouton « Télécharger » : lance l'installation du navigateur si elle est disponible, sinon explique comment faire.
function download() {
  if (deferred) { deferred.prompt(); deferred.userChoice.finally(() => { deferred = null; render(); }); return; }
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua), android = /Android/.test(ua);
  const steps = ios ? ["Ouvre cette page dans <b>Safari</b>.", "Appuie sur le bouton <b>Partager</b> (carré avec une flèche vers le haut).", "Choisis <b>Sur l'écran d'accueil</b>, puis <b>Ajouter</b>."]
    : android ? ["Ouvre cette page dans <b>Chrome</b>.", "Appuie sur le menu <b>⋮</b> en haut à droite.", "Choisis <b>Installer l'application</b> (ou <b>Ajouter à l'écran d'accueil</b>)."]
    : ["Ouvre cette page dans <b>Chrome</b> ou <b>Edge</b>.", "Clique sur l'icône d'installation à droite de la barre d'adresse (écran avec une flèche), ou sur le menu <b>⋮</b> → <b>Installer Élan</b>."];
  dlg.innerHTML = `<form method="dialog" style="display:grid;gap:1rem;padding:1.2rem">
    <h3 style="margin:0">Télécharger l'application</h3>
    <p style="margin:0;color:var(--muted)">Gratuite, sans compte, et elle fonctionne sans internet une fois installée.</p>
    <ol style="margin:0;padding-left:1.2rem;display:grid;gap:.5rem">${steps.map(s => `<li>${s}</li>`).join("")}</ol>
    <button type="button" class="btn" id="cancel">Compris</button></form>`;
  dlg.showModal();
}

// Nouveau jour (appli restée ouverte, ou retour dessus) : on repasse sur aujourd'hui.
let lastDay = todayKey();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) return;
  const t = todayKey();
  if (t !== lastDay) { if (sel === lastDay) sel = t; lastDay = t; render(); }
  mirror(); checkReminders(); pushSoon();
  if (syncOk()) syncPull();
});
setInterval(checkReminders, 30000);
setInterval(() => { if (!document.hidden && syncOk()) syncPull(); }, 120000);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySettings);

if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
applySettings();
render();
if (!S.onboarded) openOnboarding();
mirror(); checkReminders(); if (notifOn()) registerPeriodic();
// Demande au navigateur de ne pas effacer les données automatiquement.
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}
fileInit().then(() => { if (tab === "settings") render(); });
// Serveur Cloudflare (s'il existe) : rappels fiables et synchronisation.
probeServer().then(async () => {
  if (!srv.ok) { if (tab === "settings") render(); return; }
  if (S.sync) await syncPull();
  await pushNow();
  if (tab === "settings") render();
});
