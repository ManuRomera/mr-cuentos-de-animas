import { TEMPLATES } from "../constants.mjs";
import { Records, diaryHTML, diaryMarkdown, download, slug } from "../services/records.mjs";
import { StateService } from "../services/state.mjs";
import { KIND_ICONS } from "./view.mjs";
import { SystemApp, t } from "./base.mjs";

/** Resultado legible de un evento de la crónica según su tipo. */
const RESULT_KEYS = {
  obstacle: r => `CdA.Game.${r === "success" ? "Success" : "Failure"}`, truth: r => `CdA.Truth.Status.${r}`,
  "truth-status": r => `CdA.Truth.Status.${r}`, gray: r => `CdA.Resource.${r}`, memory: r => `CdA.Memory.Kind.${r}`,
  epilogue: r => `CdA.Epilogue.${r}`, start: r => `CdA.Mode.${r}`, phase: r => `CdA.Phase.${r}`, adjust: r => `CdA.Resource.${r}`
};
const resultLabel = e => {
  const key = e.result && RESULT_KEYS[e.type]?.(e.result);
  return key && game.i18n.has(key) ? t(key) : e.result ?? "";
};

const ICONS = { ...KIND_ICONS, note: "fa-solid fa-pen-nib", start: "fa-solid fa-book", success: "fa-solid fa-check", failure: "fa-solid fa-heart-crack", truth: "fa-solid fa-eye", epilogue: "fa-solid fa-door-open", memory: "fa-solid fa-cloud-moon" };

/**
 * Diario del protagonista: escenas registradas solas y texto narrativo del jugador.
 * Pestaña Crónica: historial estructurado del relato para reconstruir la sesión.
 */
export class DiaryApp extends SystemApp {
  static MEMORY = "diary";
  static LIVE = true;
  static DEFAULT_OPTIONS = {
    id: "cda-diary", classes: ["cda-diary-app", "cda-paper-window"],
    window: { title: "CdA.App.Diary", icon: "fa-solid fa-feather-pointed" },
    position: { width: 760, height: 780 },
    actions: { add: DiaryApp.#add, remove: DiaryApp.#remove, md: DiaryApp.#md, html: DiaryApp.#html, view: DiaryApp.#view, history: DiaryApp.#history }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/diary.hbs`, scrollable: [".cda-diary-scroll"] } };
  static SCROLL_MEMORY = [".cda-diary-scroll"];

  view = "diary";
  #actor = null;
  get actor() { return this.#actor?.isOwner || this.#actor?.visible ? this.#actor : StateService.focus(); }
  /** Abierta desde una ficha: muestra ese protagonista; desde la Mesa: el del relato. */
  configure({ actor } = {}) { this.#actor = actor ?? null; }

  async _prepareContext() {
    const actor = this.actor, gm = game.user.isGM;
    const time = at => at ? new Date(at).toLocaleString(game.i18n.lang, { dateStyle: "short", timeStyle: "short" }) : "";
    return {
      actor, view: this.view, canEdit: actor?.isOwner,
      entries: (actor?.system.diary ?? []).map(e => ({ ...e, icon: ICONS[e.kind] ?? ICONS.note, date: time(e.createdAt) })).reverse(),
      history: StateService.history().filter(e => gm || !e.hidden).map(e => ({
        ...e, date: new Date(e.time).toLocaleTimeString(game.i18n.lang, { timeStyle: "short" }),
        label: game.i18n.has(`CdA.History.${e.type}`) ? t(`CdA.History.${e.type}`) : e.type,
        result: resultLabel(e)
      })).reverse()
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const field of this.element.querySelectorAll("[data-entry]")) {
      field.addEventListener("change", () => Records.editDiary(this.actor, field.dataset.entry, { [field.dataset.field]: field.value }));
    }
  }

  static async #add() {
    const entry = await Records.diary(this.actor, { title: t("CdA.Diary.NewEntry"), kind: "note" }, { force: true });
    if (entry) requestAnimationFrame(() => this.element?.querySelector(`textarea[data-entry="${entry.id}"]`)?.focus());
  }
  static #remove(event, target) { return Records.removeDiary(this.actor, target.dataset.id); }
  static #md() { if (this.actor) download(diaryMarkdown(this.actor), `${slug(this.actor.name)}.md`, "text/markdown"); }
  static #html() { if (this.actor) download(diaryHTML(this.actor), `${slug(this.actor.name)}.html`, "text/html"); }
  static #view(event, target) { this.view = target.dataset.view; this.render(); }
  static #history() {
    download(JSON.stringify(StateService.history(), null, 2), "cronica.json", "application/json");
  }
}
