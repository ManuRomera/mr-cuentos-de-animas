import { TEMPLATES } from "../constants.mjs";
import { LINK_TYPES, MEMORY_KINDS, TRUTH_STATUS } from "../models.mjs";
import { Records } from "../services/records.mjs";
import { StateService } from "../services/state.mjs";
import { Presenter } from "../services/presenter.mjs";
import { choices } from "./view.mjs";
import { SystemApp, t } from "./base.mjs";

export const TRUTH_ICONS = {
  established: "fa-solid fa-circle-check", doubtful: "fa-solid fa-circle-question", contradicted: "fa-solid fa-circle-xmark",
  reinterpreted: "fa-solid fa-arrows-rotate", pending: "fa-solid fa-hourglass-half", resolved: "fa-solid fa-lock"
};
export const MEMORY_ICONS = {
  memory: "fa-solid fa-cloud-moon", question: "fa-solid fa-comment-dots", locked: "fa-solid fa-lock",
  confirmed: "fa-solid fa-circle-check", contradicted: "fa-solid fa-circle-xmark"
};

/**
 * Verdades y Recuerdos: lo que el protagonista afirma y lo que recuerda.
 * Cronológico, editable y enlazable. Lo oculto (revelaciones pendientes,
 * notas del Guardián, recuerdos aún no sabidos) solo lo ve el Guardián.
 */
export class ArchiveApp extends SystemApp {
  static MEMORY = "archive";
  static LIVE = true;
  static DEFAULT_OPTIONS = {
    id: "cda-archive", classes: ["cda-archive-app", "cda-paper-window"],
    window: { title: "CdA.App.Archive", icon: "fa-solid fa-eye" },
    position: { width: 920, height: 760 },
    actions: {
      addTruth: ArchiveApp.#addTruth, addMemory: ArchiveApp.#addMemory, remove: ArchiveApp.#remove,
      filter: ArchiveApp.#filter, launch: ArchiveApp.#launch, known: ArchiveApp.#known
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/archive.hbs`, scrollable: [".cda-archive-scroll"] } };
  static SCROLL_MEMORY = [".cda-archive-scroll"];
  static TABS = { archive: { initial: "truths", tabs: [{ id: "truths" }, { id: "memories" }] } };

  filter = "all";
  #actor = null;
  get actor() { return this.#actor?.isOwner || this.#actor?.visible ? this.#actor : StateService.focus(); }
  /** Abierta desde una ficha: muestra ese protagonista; desde la Mesa: el del relato. */
  configure({ actor } = {}) { this.#actor = actor ?? null; }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor, gm = game.user.isGM, canEdit = Boolean(actor?.isOwner);
    const scenario = StateService.scenario();
    const time = at => at ? new Date(at).toLocaleString(game.i18n.lang, { dateStyle: "short", timeStyle: "short" }) : "";
    const truths = (actor?.system.truths ?? []).filter(x => gm || !x.hidden).filter(x => this.filter === "all" || x.status === this.filter);
    return {
      ...context, actor, gm, canEdit, filter: this.filter,
      tab: this.tabGroups.archive ?? "truths",
      filters: ["all", ...TRUTH_STATUS].map(s => ({ key: s, label: t(`CdA.Truth.Status.${s}`), active: s === this.filter })),
      truths: truths.map(x => ({
        ...x, date: time(x.createdAt), icon: TRUTH_ICONS[x.status], statusLabel: t(`CdA.Truth.Status.${x.status}`),
        statuses: choices(TRUTH_STATUS, "CdA.Truth.Status", x.status), links: choices(LINK_TYPES, "CdA.Link", x.link.type),
        byLabel: t(`CdA.Truth.By.${x.by}`), trail: x.history.slice(0, -1).map(h => t(`CdA.Truth.Status.${h.status}`)).join(" → ")
      })),
      memories: (actor?.system.memories ?? []).filter(m => gm || m.known).map(m => ({
        ...m, date: time(m.createdAt), icon: MEMORY_ICONS[m.kind], kinds: choices(MEMORY_KINDS, "CdA.Memory.Kind", m.kind),
        links: choices(LINK_TYPES, "CdA.Link", m.link.type), kindLabel: t(`CdA.Memory.Kind.${m.kind}`)
      })),
      prompts: gm ? (scenario?.system.memories ?? []).map((m, i) => ({ ...m, i })) : [],
      prepared: gm ? scenario?.system.truths ?? [] : [],
      newStatuses: choices(TRUTH_STATUS, "CdA.Truth.Status", "established"),
      newLinks: choices(LINK_TYPES, "CdA.Link", ""),
      newKinds: choices(MEMORY_KINDS, "CdA.Memory.Kind", "memory")
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const field of this.element.querySelectorAll("[data-truth]")) {
      field.addEventListener("change", () => {
        const id = field.dataset.truth, key = field.dataset.field, value = field.type === "checkbox" ? field.checked : field.value;
        if (key === "status") return Records.setTruthStatus(this.actor, id, value);
        return Records.editTruth(this.actor, id, foundry.utils.expandObject({ [key]: value }));
      });
    }
    for (const field of this.element.querySelectorAll("[data-memory-id]")) {
      field.addEventListener("change", () => Records.editMemory(this.actor, field.dataset.memoryId, foundry.utils.expandObject({ [field.dataset.field]: field.value })));
    }
  }

  static #read(form) {
    const data = Object.fromEntries(new FormData(form));
    form.reset();
    return data;
  }

  static async #addTruth(event, target) {
    const form = target.closest("form"); if (!form) return;
    const d = ArchiveApp.#read(form);
    await Records.addTruth(this.actor, { text: d.text, status: d.status, category: d.category, origin: d.origin || undefined, hidden: d.hidden === "on", link: { type: d.linkType ?? "", label: d.linkLabel ?? "" } });
  }
  static async #addMemory(event, target) {
    const form = target.closest("form"); if (!form) return;
    const d = ArchiveApp.#read(form);
    if (!d.title?.trim() && !d.text?.trim()) return;
    await Records.addMemory(this.actor, { title: d.title, text: d.text, kind: d.kind, known: game.user.isGM ? d.known === "on" : true });
  }
  static #remove(event, target) {
    return target.dataset.list === "truths" ? Records.removeTruth(this.actor, target.dataset.id) : Records.removeMemory(this.actor, target.dataset.id);
  }
  static #filter(event, target) { this.filter = target.dataset.filter; this.render(); }
  static #known(event, target) {
    const memory = this.actor?.system.memories.find(m => m.id === target.dataset.id);
    if (memory) Records.editMemory(this.actor, memory.id, { known: !memory.known });
  }

  /** El Guardián lanza una pregunta del escenario: la ven todos y queda en los Recuerdos. */
  static async #launch(event, target) {
    const prompt = StateService.scenario()?.system.memories?.[Number(target.dataset.index)];
    if (!prompt) return;
    Presenter.broadcast({ type: "memory", memory: { title: prompt.title, prompt: prompt.prompt, followUp: prompt.followUp } });
    await Records.addMemory(this.actor, { title: prompt.title, text: prompt.prompt, kind: prompt.kind, link: prompt.link, known: true });
  }
}
