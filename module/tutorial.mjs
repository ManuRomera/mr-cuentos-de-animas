import { LOG, SYSTEM_ID, PATH } from "./constants.mjs";
import { DialogV2 } from "./compat.mjs";
import { openApp } from "./apps/registry.mjs";
import { get, set } from "./settings.mjs";

/**
 * Tutorial guiado con los «tours» de Foundry (foundry.nue.Tour), como el de bienvenida del propio Foundry.
 * Dos recorridos: el Guardián (GM) y quien juega. Los textos están en lang/ (CdA.Tour.*).
 */
const TOURS = [
  { key: "guardian", gm: true },
  { key: "player", gm: false }
];

const wait = ms => new Promise(r => setTimeout(r, ms));
const table = async () => { await openApp("table"); await wait(500); };

/** Preparación de cada paso: `<tour>.<id>`. Si falla, el tour sigue. */
const ON_TABLE = ["table", "resources", "deck", "story", "guardian", "safety", "hide"];
const BEFORE = {
  ...Object.fromEntries(TOURS.flatMap(({ key }) => ON_TABLE.map(id => [`${key}.${id}`, table]))),
  "guardian.directory": async () => ui.actors?.activate?.(),
  "guardian.settings": async () => ui.settings?.activate?.()
};

class SystemTour extends foundry.nue.Tour {
  async _preStep() {
    await super._preStep();
    const step = this.currentStep;
    try { await BEFORE[`${this.id}.${step.id}`]?.(); } catch (error) { console.warn(`${LOG} tutorial: no se pudo preparar «${step.id}»`, error); }
    // Un elemento que no existe (aún no hay relato, la Mesa está oculta…) no debe romper el tour: el paso sale centrado.
    if (step.selector && !document.querySelector(step.selector)) step.selector = "";
  }
}

export async function registerTutorial() {
  for (const { key } of TOURS) {
    try { game.tours.register(SYSTEM_ID, key, await SystemTour.fromJSON(`${PATH}/tours/${key}.json`)); }
    catch (error) { console.error(`${LOG} no se pudo registrar el tour «${key}»`, error); }
  }
}

/** Foundry solo admite un tour a la vez: se cierra el activo antes de empezar. */
export async function startTutorial(key = game.user.isGM ? "guardian" : "player") {
  const tour = game.tours.get(`${SYSTEM_ID}.${key}`);
  if (!tour) return null;
  for (const other of game.tours.values()) if (other.status === foundry.nue.Tour.STATUS.IN_PROGRESS) await other.exit();
  await tour.reset();
  return tour.start();
}

/** La primera vez se ofrece (una vez por navegador), como hace Foundry con el suyo. */
export async function offerTutorial() {
  if (get("tutorialOfrecido")) return;
  await set("tutorialOfrecido", true);
  const t = game.i18n.localize.bind(game.i18n);
  const yes = await DialogV2.confirm({
    window: { title: t("CdA.Tour.OfferTitle"), icon: "fa-solid fa-graduation-cap" },
    content: `<p>${t("CdA.Tour.OfferBody")}</p>`,
    yes: { label: t("CdA.Tour.Start"), icon: "fa-solid fa-graduation-cap" },
    no: { label: t("CdA.Tour.NotNow") },
    rejectClose: false
  });
  if (yes) startTutorial();
}
