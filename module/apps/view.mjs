import { ASSETS, CARD_KINDS, SYSTEM_ID } from "../constants.mjs";
import { safeImage } from "../services/direction.mjs";
import { DeckService } from "../services/decks.mjs";

/** Datos de presentación compartidos por la Mesa, el Guardián y la carta ampliada. */
export const KIND_ICONS = {
  clue: "fa-solid fa-key", environment: "fa-solid fa-tree", character: "fa-solid fa-user-large",
  incident: "fa-solid fa-bolt-lightning", gray: "fa-solid fa-ghost", number: "fa-solid fa-diamond"
};
const ROMAN = ["", "I", "II", "III"];
export const roman = n => ROMAN[n] ?? String(n);

/** Estilo de cartas de este usuario: "mr" (fotográfico) o "classic" (cartas oficiales del libro). */
export const classicSkin = () => game.settings.get(SYSTEM_ID, "cardSkin") === "classic";

/** Cara de una carta de evento según el estilo elegido. En las Damas, `value` es su número (1‑3). */
export function eventArt(kind, value, classic = classicSkin()) {
  if (!classic) return kind === CARD_KINDS.GRAY ? ASSETS.gray[Math.clamp((value || 1) - 1, 0, 2)] : ASSETS.kinds[kind] ?? ASSETS.cardBack;
  const c = ASSETS.classic;
  if (kind === CARD_KINDS.ENVIRONMENT || kind === CARD_KINDS.CHARACTER) return c[kind](Math.clamp(value || 4, 4, 7));
  return c[kind] ?? c.back;
}
export const backArt = (custom, classic = classicSkin()) => custom || (classic ? ASSETS.classic.back : ASSETS.cardBack);
export const numberArt = (value, classic = classicSkin()) => classic ? ASSETS.classic.number(Math.clamp(value || 1, 1, 10)) : ASSETS.numberArt;
export const numberBackArt = (classic = classicSkin()) => classic ? ASSETS.classic.numberBack : ASSETS.numberBack;
export const tokenArt = (resource, on, classic = classicSkin()) => classic ? ASSETS.classic[resource] : ASSETS[resource][on ? "on" : "off"];

/**
 * Vista de una carta de evento. `scene` es lo que el relato ha puesto encima: la entrada
 * elegida del escenario o, en una Dama Gris, su texto de la Tabla de Tensión.
 */
export function cardView(card, { scene = null, customBack = "" } = {}) {
  if (!card) return null;
  const meta = DeckService.meta(card);
  scene ??= meta.scene ?? null;
  const kind = meta.kind ?? CARD_KINDS.CLUE;
  const classic = classicSkin();
  const value = kind === CARD_KINDS.GRAY ? meta.grayIndex : meta.value;
  return {
    id: card.id, kind, classic, icon: KIND_ICONS[kind],
    kindLabel: game.i18n.localize(`CdA.Kind.${kind}`),
    value: kind === CARD_KINDS.GRAY ? 0 : meta.value || 0,
    gray: kind === CARD_KINDS.GRAY ? roman(meta.grayIndex) : "",
    img: eventArt(kind, value, classic),
    back: backArt(customBack, classic),
    scene: scene?.title || scene?.text ? { title: scene.title ?? "", text: scene.text ?? "", image: safeImage(scene.image) } : null,
    title: card.name
  };
}

export const resource = (actor, key) => {
  const r = actor?.system[key];
  if (!r) return { value: 0, max: 0, items: [] };
  return {
    value: r.value, max: r.max, low: r.value <= 1,
    items: Array.from({ length: r.max }, (_, i) => ({ n: i + 1, on: i < r.value, img: tokenArt(key, i < r.value) }))
  };
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
