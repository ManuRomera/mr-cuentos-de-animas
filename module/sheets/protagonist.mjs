import { ASSETS, RULES, TEMPLATES } from "../constants.mjs";
import { openApp } from "../apps/registry.mjs";
import { resource } from "../apps/view.mjs";
import { MEMORY_ICONS, TRUTH_ICONS } from "../apps/archive.mjs";
import { StateService } from "../services/state.mjs";
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
      pip: ProtagonistSheet.#pip, add: ProtagonistSheet.#add, remove: ProtagonistSheet.#remove,
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
      splitOk: s.spirit.max + s.determination.max === RULES.resourceTotal,
      total: RULES.resourceTotal,
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
  static async #add(event, target) {
    const list = target.dataset.list;
    const blank = { objects: { label: "", text: "", image: "", significant: false }, bonds: { name: "", text: "" } }[list];
    if (blank) await this.addEntry(list, blank);
  }
  static async #remove(event, target) { await this.removeEntry(target.dataset.list, Number(target.dataset.index)); }
  static #open(event, target) { openApp(target.dataset.app, { actor: this.document }); }
}
