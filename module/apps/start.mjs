import { ASSETS, MODES, RULES, TEMPLATES } from "../constants.mjs";
import { ProtagonistModel } from "../models.mjs";
import { validSplit } from "../rules.mjs";
import { ContentService } from "../services/content.mjs";
import { GameplayService } from "../services/gameplay.mjs";
import { StateService } from "../services/state.mjs";
import { SystemApp, t } from "./base.mjs";
import { openApp } from "./registry.mjs";

/** Crear un protagonista listo para jugar: cuatro rasgos vacíos, reparto 5/5 y visible para todos. */
export async function createProtagonist(name = t("CdA.Actor.DefaultName")) {
  return Actor.implementation.create({
    name, type: "protagonist", img: ASSETS.portrait, system: ProtagonistModel.seed(),
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER },
    prototypeToken: { actorLink: true, name, disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY }
  });
}

/** Nuevo relato: escenario, protagonista, modo y reparto de recursos en una sola vista. */
export class StartApp extends SystemApp {
  static MEMORY = "start";
  static DEFAULT_OPTIONS = {
    id: "cda-start", classes: ["cda-start-app"],
    window: { title: "CdA.Session.New", icon: "fa-solid fa-book" },
    position: { width: 1060, height: 720 },
    actions: { scenario: StartApp.#pickScenario, mode: StartApp.#pickMode, start: StartApp.#start }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/start.hbs`, scrollable: [".cda-start-scenarios"] } };

  selected = { scenario: "", mode: "", actor: "", spirit: null };

  static open(options) {
    if (!game.user.isGM) return ui.notifications.warn(t("CdA.Session.GMOnly"));
    return super.open(options);
  }

  configure({ scenario } = {}) {
    if (scenario) this.selected = { ...this.selected, scenario: scenario.uuid, mode: "", spirit: null };
  }

  async _prepareContext() {
    const scenarios = ContentService.scenarios();
    const state = StateService.get();
    const sel = this.selected;
    sel.scenario ||= state.scenarioUuid || scenarios[0]?.uuid || "";
    const scenario = fromUuidSync(sel.scenario);
    sel.mode ||= scenario?.system.modes[0] ?? MODES.GUARDIAN;
    sel.spirit ??= scenario?.system.recommendedSpirit ?? 5;
    const protagonists = game.actors.filter(a => a.type === "protagonist");
    return {
      scenarios: scenarios.map(s => ({ uuid: s.uuid, name: s.name, img: s.system.cover || s.img, duration: s.system.duration, hook: s.system.hook, selected: s.uuid === sel.scenario })),
      scenario: scenario ? { name: scenario.name, synopsis: scenario.system.hook, notes: scenario.system.contentNotes.join(" · ") } : null,
      modes: Object.values(MODES).map(m => ({ key: m, label: t(`CdA.Mode.${m}`), hint: t(`CdA.Mode.${m}Hint`), selected: m === sel.mode, recommended: scenario?.system.modes.includes(m) })),
      protagonists: protagonists.map(a => ({ uuid: a.uuid, name: a.name, selected: a.uuid === sel.actor })),
      spirit: sel.spirit, determination: RULES.resourceTotal - sel.spirit,
      min: RULES.resourceMin, max: RULES.resourceMax, total: RULES.resourceTotal,
      running: state.phase !== "idle"
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const range = this.element.querySelector("input[name=spirit]");
    range?.addEventListener("input", () => {
      this.selected.spirit = Number(range.value);
      this.element.querySelector("[data-out=spirit]").textContent = range.value;
      this.element.querySelector("[data-out=determination]").textContent = RULES.resourceTotal - Number(range.value);
    });
    this.element.querySelector("select[name=actor]")?.addEventListener("change", e => { this.selected.actor = e.target.value; });
  }

  static #pickScenario(event, target) {
    this.selected.scenario = target.dataset.uuid;
    const s = fromUuidSync(target.dataset.uuid);
    this.selected.mode = s?.system.modes[0] ?? this.selected.mode;
    this.selected.spirit = s?.system.recommendedSpirit ?? this.selected.spirit;
    this.render();
  }
  static #pickMode(event, target) { this.selected.mode = target.dataset.mode; this.render(); }

  static async #start() {
    const scenario = fromUuidSync(this.selected.scenario);
    if (!scenario) return ui.notifications.warn(t("CdA.Session.PickScenario"));
    const spirit = Number(this.selected.spirit), determination = RULES.resourceTotal - spirit;
    if (!validSplit(spirit, determination)) return ui.notifications.warn(t("CdA.Session.BadSplit"));
    const name = this.element.querySelector("input[name=newName]")?.value.trim();
    let actor = this.selected.actor ? fromUuidSync(this.selected.actor) : null;
    const fresh = !actor;
    if (fresh) actor = await createProtagonist(name || undefined);
    if (!actor) return;
    const result = await GameplayService.start({ scenario, actor, mode: this.selected.mode, spirit, determination });
    if (!result) return;
    await this.close();
    openApp("table");
    if (fresh) actor.sheet.render(true);
  }
}
