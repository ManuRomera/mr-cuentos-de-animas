import { apiReport, generation } from "../compat.mjs";
import { ASSETS, FLAGS, SYSTEM_ID } from "../constants.mjs";
import { DeckService } from "./decks.mjs";
import { StateService } from "./state.mjs";

/** Errores de arranque por fase. El arranque los anota aquí; el diagnóstico los muestra. */
export const BOOT = { phases: {}, errors: [] };

export function bootPhase(name, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => { BOOT.phases[name] = "ok"; }, error => fail(name, error));
    }
    BOOT.phases[name] = "ok";
    return result;
  } catch (error) { fail(name, error); }
}

function fail(name, error) {
  BOOT.phases[name] = "error";
  BOOT.errors.push({ phase: name, message: error?.message ?? String(error) });
  console.error(`MR · Cuentos de Ánimas | fase «${name}» falló; Foundry sigue operativo.`, error);
  try { ui.notifications?.error(game.i18n.format("CdA.Error.Phase", { phase: name })); } catch {}
}

/** Comprueba que un archivo existe sin descargarlo entero. */
async function exists(src) {
  try { return (await fetch(src, { method: "HEAD", cache: "no-store" })).ok; } catch { return false; }
}

/** Estado completo del sistema en un objeto fácil de copiar. */
export async function diagnostic({ assets = true } = {}) {
  const state = StateService.get();
  const decks = Object.fromEntries(["event", "eventReveal", "number", "numberReveal"].map(role => {
    const d = DeckService.stack(role);
    return [role, d ? { id: d.id, cards: d.cards.size, available: d.type === "deck" ? d.availableCards.length : undefined } : null];
  }));
  const paths = [ASSETS.table, ASSETS.cardBack, ASSETS.numberBack, ASSETS.numberArt, ...Object.values(ASSETS.kinds), ...ASSETS.gray,
    ASSETS.spirit.on, ASSETS.spirit.off, ASSETS.determination.on, ASSETS.determination.off, ASSETS.cover];
  const missing = assets ? (await Promise.all(paths.map(async p => [p, await exists(p)]))).filter(([, ok]) => !ok).map(([p]) => p) : null;
  const report = {
    system: game.system.version,
    foundry: game.version,
    generation: generation(),
    world: game.world.id,
    user: { gm: game.user.isGM, lang: game.i18n.lang },
    apis: apiReport(),
    boot: BOOT,
    decks,
    state: { phase: state.phase, mode: state.mode, grayLadies: state.grayLadies, scenario: StateService.scenario()?.name ?? null, protagonist: StateService.protagonist()?.name ?? null },
    scenarios: game.items.filter(i => i.type === "scenario").length,
    protagonists: game.actors.filter(a => a.type === "protagonist").length,
    scenes: { total: game.scenes.size, active: game.scenes.active?.name ?? null, canvas: Boolean(canvas?.ready) },
    history: StateService.history().length,
    assets: missing ? { checked: paths.length, missing } : "sin comprobar",
    ui: {
      sidebar: Boolean(document.getElementById("sidebar")), controls: Boolean(document.getElementById("scene-controls")),
      overlays: [...document.querySelectorAll(".cda-overlay, .cda-safety-signal")].length
    },
    settings: Object.fromEntries(["openOnStart", "grayVariant", "autoDiary"].map(k => [k, game.settings.get(SYSTEM_ID, k)])),
    flags: FLAGS.STATE
  };
  return report;
}
