/**
 * Formato de intercambio de escenarios (importar, exportar y colección incluida).
 * Módulo puro: sin Foundry, se prueba en Node. La especificación completa está en
 * docs/IMPORTAR.md y en la ventana «Cómo importar» de la Biblioteca.
 */
import { LINK_TYPES, MEMORY_KINDS, MODES, SCENARIO_TAGS } from "../constants.mjs";

export const FORMAT = "mr-cuentos-de-animas/scenario";
export const FORMAT_VERSION = 2;
export const MAX_SCENARIOS = 200;

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const text = v => (typeof v === "string" ? v : v == null ? "" : String(v)).trim();
const arr = v => Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
const words = v => (typeof v === "string" ? v.split(",") : arr(v)).map(text).filter(Boolean);

/** Texto plano con párrafos separados por línea en blanco → HTML. Si ya es HTML, se respeta. */
export function toHTML(v) {
  const t = text(v);
  if (!t) return "";
  if (/^<[a-z]/i.test(t)) return t;
  return t.split(/\n\s*\n/).map(p => `<p>${esc(p.replace(/\s*\n\s*/g, " "))}</p>`).join("");
}

const entry = e => typeof e === "string"
  ? { title: text(e), text: "", image: "", guardian: "" }
  : { title: text(e?.title ?? e?.titulo), text: text(e?.text ?? e?.texto), image: text(e?.image), guardian: text(e?.guardian ?? e?.guardian_note) };

const character = c => typeof c === "string"
  ? { name: text(c), description: "", secret: "", image: "" }
  : { name: text(c?.name ?? c?.nombre), description: text(c?.description ?? c?.descripcion), secret: text(c?.secret), image: text(c?.image) };

const tensionRow = t => typeof t === "string" ? { title: "", text: text(t), guardian: "" } : { title: text(t?.title), text: text(t?.text), guardian: text(t?.guardian) };

function epilogueTable(v) {
  if (Array.isArray(v)) {
    return v.map(r => typeof r === "string" ? { label: "", min: 0, max: 99, text: text(r) } : {
      label: text(r?.label ?? r?.condition), min: clampInt(r?.min, 0), max: clampInt(r?.max, 99), text: text(r?.text)
    }).filter(r => r.text);
  }
  if (v && typeof v === "object") {
    return [["high", 2, 99], ["low", 1, 1], ["zero", 0, 0]].filter(([k]) => v[k]).map(([k, min, max]) => ({ label: "", min, max, text: text(v[k]) }));
  }
  return [];
}
const clampInt = (v, d) => { const n = Number.parseInt(v, 10); return Number.isFinite(n) ? Math.min(99, Math.max(0, n)) : d; };

/** Gancho para la Biblioteca: frases completas hasta ~90 caracteres, nunca más de 220. */
export function firstSentences(t, min = 90, max = 220) {
  const parts = t.match(/[^.!?…]+[.!?…]+(\s|$)/g) ?? [t];
  let out = "";
  for (const p of parts) {
    if ((out + p).length > max) break;
    out += p;
    if (out.length >= min) break;
  }
  return (out || t.slice(0, max)).trim();
}

/** Acepta { scenarios: [...] }, { scenario: {...} }, un escenario suelto o un array. */
export function unpack(json) {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    if (Array.isArray(json.scenarios)) return json.scenarios;
    if (json.scenario && typeof json.scenario === "object") return [json.scenario];
    return [json];
  }
  return [];
}

/** Escenario de intercambio → datos de Item "scenario". También acepta un Item exportado de Foundry. */
export function normalizeScenario(raw) {
  const src = raw?.system && typeof raw.system === "object" && raw.type === "scenario" ? { ...raw.system, name: raw.name, img: raw.img } : raw ?? {};
  const synopsis = toHTML(src.synopsis ?? src.sinopsis);
  const plainSynopsis = synopsis.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const hook = text(src.hook) || firstSentences(plainSynopsis);
  const tension = arr(src.tension ?? src.tensionTable).slice(0, 3).map(tensionRow);
  while (tension.length < 3) tension.push({ title: "", text: "", guardian: "" });
  const modes = words(src.modes).filter(m => Object.values(MODES).includes(m));
  const system = {
    author: text(src.author ?? src.autor), duration: text(src.duration) || "60–120 min", players: text(src.players) || "1–4",
    hook, cover: text(src.cover ?? src.img),
    synopsis, introduction: toHTML(src.introduction), guardianNotes: toHTML(src.guardianNotes ?? src.notes),
    tone: words(src.tone), tags: words(src.tags).filter(t => SCENARIO_TAGS.includes(t)),
    modes: modes.length ? modes : ["bonfire", "diary", "guardian"], contentNotes: words(src.contentNotes),
    scenes: arr(src.scenes).map(s => ({ title: text(s?.title), text: text(s?.text), guardian: text(s?.guardian), handout: text(s?.handout) })),
    characters: arr(src.characters).map(character).filter(c => c.name),
    clues: arr(src.clues).map(entry).filter(e => e.title || e.text),
    environmentObstacles: arr(src.environmentObstacles).map(entry).filter(e => e.title || e.text),
    characterObstacles: arr(src.characterObstacles).map(entry).filter(e => e.title || e.text),
    incidents: arr(src.incidents).map(entry).filter(e => e.title || e.text),
    tension,
    epilogueTable: epilogueTable(src.epilogueTable ?? src.epilogues),
    memories: arr(src.memories).map(m => ({
      title: text(m?.title), prompt: text(m?.prompt), followUp: text(m?.followUp),
      kind: MEMORY_KINDS.includes(m?.kind) ? m.kind : "question",
      link: { type: LINK_TYPES.includes(m?.link?.type) ? m.link.type : "", label: text(m?.link?.label) }
    })).filter(m => m.title || m.prompt),
    truths: arr(src.truths).map(t => typeof t === "string" ? { text: text(t), contradiction: "", reveal: "" } : { text: text(t?.text), contradiction: text(t?.contradiction), reveal: text(t?.reveal) }).filter(t => t.text),
    handouts: arr(src.handouts).map(h => ({ title: text(h?.title), image: text(h?.image), text: text(h?.text) })).filter(h => h.image),
    recommendedSpirit: clampInt(src.recommendedSpirit, 5), recommendedDetermination: clampInt(src.recommendedDetermination, 5),
    source: { collection: text(src.source?.collection), license: text(src.source?.license), url: text(src.source?.url) }
  };
  if (src.sounds && typeof src.sounds === "object") system.sounds = { intro: text(src.sounds.intro), play: text(src.sounds.play), gray: text(src.sounds.gray), epilogue: text(src.sounds.epilogue) };
  const data = { name: text(src.name ?? src.title ?? src.titulo).slice(0, 200), type: "scenario", system };
  if (text(src.img ?? src.cover)) data.img = text(src.img ?? src.cover);
  return data;
}

/** Problemas que impiden jugar el escenario. Lista vacía = válido. */
export function problems(data) {
  const out = [], s = data.system;
  if (!data.name) out.push("falta «name» (título)");
  if (!s.synopsis) out.push("falta «synopsis» (la narración inicial)");
  for (const [k, label] of [["clues", "clues (pistas)"], ["environmentObstacles", "environmentObstacles (obstáculos de entorno)"], ["characterObstacles", "characterObstacles (obstáculos de personaje)"]]) {
    if (!s[k].length) out.push(`«${label}» está vacía`);
  }
  if (!s.characters.length) out.push("«characters» (personajes secundarios) está vacía");
  if (s.tension.filter(t => t.text).length < 3) out.push("«tension» necesita los tres textos de las Damas Grises");
  if (!s.epilogueTable.length) out.push("«epilogues» está vacía");
  else if (!s.epilogueTable.some(r => r.min === 0)) out.push("«epilogues» no cubre el final con 0 de Espíritu (min: 0)");
  return out;
}

/**
 * Plantilla de referencia del formato. Es lo que se descarga desde «Cómo importar»
 * y lo que se incluye en el prompt para generar escenarios con una IA.
 */
export const TEMPLATE = Object.freeze({
  format: FORMAT,
  version: FORMAT_VERSION,
  scenarios: [{
    name: "Título del escenario",
    author: "Autoría",
    duration: "60–120 min",
    players: "1–4",
    modes: ["bonfire", "diary", "guardian"],
    tags: ["rural", "folklore"],
    tone: ["Horror rural", "Melancólico"],
    contentNotes: ["Muerte de un familiar"],
    hook: "Una frase que atrape (opcional; si falta se usa la primera de la sinopsis).",
    synopsis: "Sinopsis: la narración inicial que se lee en voz alta y queda visible en la Mesa.\n\nSepara los párrafos con una línea en blanco.",
    characters: [
      { name: "Nombre del personaje secundario", description: "Quién es y qué quiere." }
    ],
    clues: ["Una pista o indicio.", "Otra pista."],
    environmentObstacles: ["Un obstáculo del entorno.", "Otro."],
    characterObstacles: ["Un personaje se interpone en tu camino.", "Otro."],
    incidents: [],
    tension: [
      "Lo que ocurre al revelar la primera Dama Gris.",
      "Lo que ocurre al revelar la segunda Dama Gris.",
      "Lo que ocurre al revelar la tercera Dama Gris."
    ],
    epilogues: [
      { label: "Si quedan dos o más contadores de Espíritu", min: 2, max: 99, text: "Final con Espíritu." },
      { label: "Si queda un contador de Espíritu", min: 1, max: 1, text: "Final frágil." },
      { label: "Si no quedan contadores de Espíritu", min: 0, max: 0, text: "Final sin Espíritu." }
    ],
    guardianNotes: "Notas solo para quien dirige (opcional).",
    source: { collection: "De dónde sale el escenario", license: "Licencia o permiso", url: "" }
  }]
});
