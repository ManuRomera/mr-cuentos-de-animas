import { SYSTEM_ID } from "./constants.mjs";
export const INKS = { soft: "#e5ded2", cream: "#f1e5cc", pearl: "#d9dde2", amber: "#e4c18b", mint: "#c4dacd" };
const get = key => game.settings.get(SYSTEM_ID, key);

export function registerSettings() {
  const client = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "client", config: false, onChange: applyPreferences, ...data });
  const world = (key, data) => game.settings.register(SYSTEM_ID, key, { scope: "world", config: false, ...data });
  client("readingMode", { type: Boolean, default: false });
  client("textScale", { type: Number, default: 1 });
  client("readingInk", { type: String, default: "soft" });
  client("plainFont", { type: Boolean, default: false });
  client("wideSpacing", { type: Boolean, default: false });
  client("highContrast", { type: Boolean, default: false });
  client("reducedMotion", { type: Boolean, default: false });
  client("richHelp", { type: Boolean, default: true });
  client("soundFx", { type: Boolean, default: true });
  client("tableParticles", { type: Boolean, default: true });
  client("autoOpen", { type: Boolean, default: true });
  client("counterSkin", { type: String, default: "stones" });
  world("autoDiary", { type: Boolean, default: true });
  world("grayVariant", { type: String, default: "fixed" });
  world("seedVersion", { type: String, default: "" });
  world("welcomeVersion", { type: String, default: "" });
}

export function applyPreferences() {
  const root = document.documentElement;
  root.style.setProperty("--cda-text-scale", get("textScale"));
  root.style.setProperty("--cda-reading-ink", INKS[get("readingInk")] ?? INKS.soft);
  for (const [setting, cls] of [["readingMode","cda-reading"],["plainFont","cda-plain-font"],["wideSpacing","cda-wide-spacing"],["highContrast","cda-high-contrast"],["reducedMotion","cda-reduced-motion"]]) {
    root.classList.toggle(cls, get(setting));
  }
}
