import { SYSTEM_ID } from "./constants.mjs";

export const INKS = { soft: "#e5ded2", cream: "#f1e5cc", pearl: "#dfe3e8", amber: "#ecc98f", mint: "#cfe3d5" };

/** Preferencias de lectura y accesibilidad: [ajuste, clase en <html>]. Solo afectan a ventanas del sistema. */
const CLASS_TOGGLES = [
  ["readingMode", "cda-reading"], ["plainFont", "cda-plain-font"], ["wideSpacing", "cda-wide-spacing"],
  ["highContrast", "cda-high-contrast"], ["reducedMotion", "cda-reduced-motion"], ["reducedEffects", "cda-reduced-effects"],
  ["largeButtons", "cda-large-buttons"]
];

export const ACCESS_DEFAULTS = Object.freeze({
  textScale: 1, readingInk: "soft", readingMode: false, plainFont: false, wideSpacing: false, highContrast: false,
  reducedMotion: false, reducedEffects: false, largeButtons: false, richHelp: true, soundFx: true, sfxVolume: 0.6, ambientVolume: 0.35
});

export const get = key => game.settings.get(SYSTEM_ID, key);
export const set = (key, value) => game.settings.set(SYSTEM_ID, key, value);

export function registerSettings() {
  const client = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "client", config: false, onChange: applyPreferences, ...data });
  const world = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "world", config: false, ...data });
  for (const [key, value] of Object.entries(ACCESS_DEFAULTS)) client(key, { type: typeof value === "boolean" ? Boolean : typeof value === "number" ? Number : String, default: value });

  // Única vía para abrir la Mesa al entrar: una preferencia explícita del usuario, apagada por defecto.
  game.settings.register(SYSTEM_ID, "openOnStart", {
    name: "CdA.Settings.OpenOnStart", hint: "CdA.Settings.OpenOnStartHint",
    scope: "client", config: true, type: Boolean, default: false
  });
  game.settings.register(SYSTEM_ID, "cardSkin", {
    name: "CdA.Settings.CardSkin", hint: "CdA.Settings.CardSkinHint", scope: "client", config: true, type: String,
    choices: { mr: "CdA.Skin.mr", classic: "CdA.Skin.classic" }, default: "mr",
    onChange: () => Hooks.callAll("mrCdaSkin")
  });
  game.settings.register(SYSTEM_ID, "deckSize", {
    name: "CdA.Settings.DeckSize", hint: "CdA.Settings.DeckSizeHint", scope: "world", config: true, type: String,
    choices: { full: "CdA.Deck.Size.full", short: "CdA.Deck.Size.short", shorter: "CdA.Deck.Size.shorter" }, default: "full"
  });
  game.settings.register(SYSTEM_ID, "grayVariant", {
    name: "CdA.Settings.GrayVariant", hint: "CdA.Settings.GrayVariantHint", scope: "world", config: true, type: String,
    choices: { fixed: "CdA.Deck.Fixed", "random-third": "CdA.Deck.RandomThird" }, default: "fixed"
  });
  game.settings.register(SYSTEM_ID, "autoDiary", {
    name: "CdA.Settings.AutoDiary", hint: "CdA.Settings.AutoDiaryHint", scope: "world", config: true, type: Boolean, default: true
  });
  world("seedVersion", { type: String, default: "" });
  world("welcomeHidden", { type: Boolean, default: false });
  world("sceneReady", { type: Boolean, default: false });
  world("migratedVersion", { type: String, default: "" });
}

/** Foundry construye una ventana nueva por clic; el proxy reutiliza la única instancia del sistema. */
const menuProxy = App => class extends App { render() { return App.open(); } };

/** Menús en Configurar ajustes. Se registran aparte porque dependen de las clases de las apps. */
export function registerMenus({ AccessPanel, DiagnosticApp }) {
  game.settings.registerMenu(SYSTEM_ID, "accessMenu", {
    name: "CdA.Access.Title", label: "CdA.Access.Open", hint: "CdA.Access.Intro",
    icon: "fa-solid fa-universal-access", type: menuProxy(AccessPanel), restricted: false
  });
  game.settings.registerMenu(SYSTEM_ID, "diagnosticMenu", {
    name: "CdA.Diagnostic.Title", label: "CdA.Diagnostic.Open", hint: "CdA.Diagnostic.Hint",
    icon: "fa-solid fa-stethoscope", type: menuProxy(DiagnosticApp), restricted: false
  });
}

export function applyPreferences() {
  const root = document.documentElement;
  root.style.setProperty("--cda-text-scale", Math.clamp(Number(get("textScale")) || 1, 0.85, 1.6));
  root.style.setProperty("--cda-reading-ink", INKS[get("readingInk")] ?? INKS.soft);
  for (const [setting, cls] of CLASS_TOGGLES) root.classList.toggle(cls, Boolean(get(setting)));
  // El sistema operativo también manda: si pide menos movimiento, se respeta aunque el ajuste esté apagado.
  const osReduced = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (osReduced) root.classList.add("cda-reduced-motion");
}

export const reducedMotion = () => document.documentElement.classList.contains("cda-reduced-motion");
export const reducedEffects = () => reducedMotion() || Boolean(get("reducedEffects"));
