import { ASSETS, RULES, TEMPLATES } from "../constants.mjs";
import { openApp } from "../apps/registry.mjs";
import { resource } from "../apps/view.mjs";
import { MEMORY_ICONS, TRUTH_ICONS } from "../apps/archive.mjs";
import { StateService } from "../services/state.mjs";
import { creationProblems, generateProtagonist, ROLL } from "../generator.mjs";
import { validSplit } from "../rules.mjs";
import { BaseActorSheet } from "./base.mjs";

/**
 * Ficha del protagonista como expediente: una sola vista sin pestañas ni scroll
 * en pantallas de escritorio. Recursos arriba, quién es a la izquierda,
 * lo que lleva en medio y lo que recuerda y afirma a la derecha.
 */
export class ProtagonistSheet extends BaseActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["cda-protagonist", "cda-paper-window"],
    position: { width: 1120, height: 800 },
    window: { icon: "fa-solid fa-id-card" },
    actions: {
      pip: ProtagonistSheet.#pip, split: ProtagonistSheet.#split, roll: ProtagonistSheet.#roll, randomize: ProtagonistSheet.#randomize, add: ProtagonistSheet.#add, remove: ProtagonistSheet.#remove,
      open: ProtagonistSheet.#open, table: () => openApp("table")
    }
  };
  static PARTS = { sheet: { template: `${TEMPLATES}/sheets/protagonist.hbs`, scrollable: [".cda-dossier-col"] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document, s = actor.system, gm = game.user.isGM;
    const traits = [...s.traits];
    while (traits.length < 4) traits.push({ label: "", text: "" });
    const truths = s.truths.filter(x => gm || !x.hidden);
    const memories = s.memories.filter(m => gm || m.known);
    return {
      ...context, actor, system: s, gm, editable: this.isEditable, assets: ASSETS,
      spirit: resource(actor, "spirit"), determination: resource(actor, "determination"),
      splitOk: validSplit(s.spirit.max, s.determination.max),
      total: RULES.resourceTotal,
      // El reparto se fija al crear: con el relato en marcha ya no se toca.
      canSplit: this.isEditable && StateService.get().protagonistUuid !== actor.uuid,
      splitMin: s.spirit.max <= RULES.resourceMin, splitMax: s.spirit.max >= RULES.resourceMax,
      missing: creationProblems(actor).map(k => game.i18n.localize(`CdA.Create.Missing.${k}`)),
      traits: traits.slice(0, 4).map((x, i) => ({ ...x, i, n: i + 1 })),
      objects: s.objects.map((x, i) => ({ ...x, i })),
      bonds: s.bonds.map((x, i) => ({ ...x, i })),
      truths: truths.slice(-5).reverse().map(x => ({ ...x, icon: TRUTH_ICONS[x.status], label: game.i18n.localize(`CdA.Truth.Status.${x.status}`) })),
      memories: memories.slice(-5).reverse().map(m => ({ ...m, icon: MEMORY_ICONS[m.kind], label: game.i18n.localize(`CdA.Memory.Kind.${m.kind}`) })),
      diary: s.diary.slice(-3).reverse(),
      counts: { truths: truths.length, memories: memories.length, diary: s.diary.length },
      inStory: StateService.get().protagonistUuid === actor.uuid
    };
  }

  /** Clic en una piedra o brasa: fija el valor; clic en la última encendida la apaga. */
  static async #pip(event, target) {
    const key = target.dataset.resource, n = Number(target.dataset.n);
    const value = this.document.system[key].value;
    await this.document.update({ [`system.${key}.value`]: value === n ? n - 1 : n });
  }
  /** Mueve un punto entre Espíritu y Determinación sin salir nunca del reparto del libro (10, mínimo 3). */
  static async #split(event, target) {
    const spirit = Math.clamp(this.document.system.spirit.max + Number(target.dataset.delta), RULES.resourceMin, RULES.resourceMax);
    const determination = RULES.resourceTotal - spirit;
    await this.document.update({ "system.spirit": { value: spirit, max: spirit }, "system.determination": { value: determination, max: determination } });
  }
  /** Vuelve a tirar un solo campo. */
  static async #roll(event, target) {
    const field = target.dataset.field, s = this.document.system;
    if (field === "name") {
      const name = ROLL.name(Math.random);
      return this.document.update({ name, "prototypeToken.name": name });
    }
    if (field === "trait") {
      const traits = [...s.traits];
      while (traits.length < 4) traits.push({ label: "", text: "" });
      traits[Number(target.dataset.index)] = ROLL.trait(Math.random);
      return this.document.update({ "system.traits": traits });
    }
    const value = field === "profession" ? ROLL.profession(Math.random, this.document.name) : ROLL[field]?.(Math.random);
    if (value !== undefined) await this.document.update({ [`system.${field}`]: value });
  }
  /** Protagonista completo al azar; pide confirmación si ya había algo escrito. */
  static async #randomize() {
    const s = this.document.system;
    const written = [s.profession, s.origin, s.description, s.backstory, ...s.traits.map(x => x.label + x.text)].some(v => v?.trim());
    if (written && !(await foundry.applications.api.DialogV2.confirm({
      window: { title: "CdA.Create.Random" }, content: `<p>${game.i18n.localize("CdA.Create.RandomConfirm")}</p>`
    }))) return;
    const { name, system } = generateProtagonist();
    if (StateService.get().protagonistUuid === this.document.uuid) { delete system.spirit; delete system.determination; }
    await this.document.update({ name, system, "prototypeToken.name": name });
  }
  static async #add(event, target) {
    const list = target.dataset.list;
    const blank = { objects: { label: "", text: "", image: "", significant: false }, bonds: { name: "", text: "" } }[list];
    if (blank) await this.addEntry(list, blank);
  }
  static async #remove(event, target) { await this.removeEntry(target.dataset.list, Number(target.dataset.index)); }
  static #open(event, target) { openApp(target.dataset.app, { actor: this.document }); }
}
