import { ASSETS, CARD_KINDS } from "../constants.mjs";
import { DeckService } from "../services/decks.mjs";

/** Datos de presentación compartidos por la Mesa, el Guardián y la carta ampliada. */
export const KIND_ICONS = {
  clue: "fa-solid fa-key", environment: "fa-solid fa-tree", character: "fa-solid fa-user-large",
  incident: "fa-solid fa-bolt-lightning", gray: "fa-solid fa-ghost", number: "fa-solid fa-diamond"
};
const ROMAN = ["", "I", "II", "III"];
export const roman = n => ROMAN[n] ?? String(n);

export function cardView(card, { gm = game.user.isGM } = {}) {
  if (!card) return null;
  const meta = DeckService.meta(card);
  const face = card.faces?.[card.face ?? 0] ?? card.faces?.[0];
  const kind = meta.kind ?? CARD_KINDS.CLUE;
  return {
    id: card.id, kind, icon: KIND_ICONS[kind],
    kindLabel: game.i18n.localize(`CdA.Kind.${kind}`),
    title: meta.title || face?.name || card.name,
    text: meta.text ?? face?.text ?? "",
    img: face?.img || ASSETS.kinds[kind] || ASSETS.cardBack,
    back: card.back?.img || ASSETS.cardBack,
    difficulty: meta.difficulty || 0,
    gray: kind === CARD_KINDS.GRAY ? roman(meta.grayIndex) : "",
    guardian: gm ? meta.guardian ?? "" : ""
  };
}

export const resource = (actor, key) => {
  const r = actor?.system[key];
  if (!r) return { value: 0, max: 0, items: [] };
  return { value: r.value, max: r.max, low: r.value <= 1, items: Array.from({ length: r.max }, (_, i) => ({ n: i + 1, on: i < r.value })) };
};

/** Opciones de una lista para <select>, ya traducidas. */
export const choices = (keys, prefix, selected) =>
  keys.map(value => ({ value, label: game.i18n.localize(`${prefix}.${value || "none"}`), selected: value === selected }));


/**
 * `url(...)` para variables CSS en línea. Una ruta relativa dentro de una variable se
 * resuelve contra la hoja de estilos, no contra la página: hay que darla absoluta
 * (respetando el prefijo de ruta de Foundry si lo tiene).
 */
export function cssUrl(path) {
  if (!path) return "none";
  const absolute = /^(https?:|data:|blob:|\/)/.test(path) ? path : foundry.utils.getRoute(path);
  return `url("${absolute.replace(/"/g, "%22")}")`;
}
