import { ASSETS, MODES, SCENARIO_TAGS, TEMPLATES } from "../constants.mjs";
import { DialogV2 } from "../compat.mjs";
import { ContentService } from "../services/content.mjs";
import { SystemApp, f, t } from "./base.mjs";
import { openApp } from "./registry.mjs";


/** Biblioteca editorial de escenarios: portada, ficha breve y filtros por tono y modo. */
export class LibraryApp extends SystemApp {
  static MEMORY = "library";
  static LIVE = true;
  static DEFAULT_OPTIONS = {
    id: "cda-library", classes: ["cda-library-app"],
    window: { title: "CdA.App.Library", icon: "fa-solid fa-book-open" },
    position: { width: 1180, height: 800 },
    actions: {
      filter: LibraryApp.#filter, play: LibraryApp.#play, edit: LibraryApp.#edit, create: LibraryApp.#create,
      import: LibraryApp.#import, export: LibraryApp.#export, duplicate: LibraryApp.#duplicate, variant: LibraryApp.#variant, delete: LibraryApp.#delete
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/library.hbs`, scrollable: [".cda-library-scroll"] } };
  static SCROLL_MEMORY = [".cda-library-scroll"];

  filters = new Set();

  async _prepareContext() {
    const active = this.filters;
    const all = ContentService.scenarios();
    const match = s => [...active].every(k => s.system.tags.includes(k) || s.system.modes.includes(k));
    const chip = (key, label) => ({ key, label, active: active.has(key), count: all.filter(s => s.system.tags.includes(key) || s.system.modes.includes(key)).length });
    return {
      gm: game.user.isGM,
      tags: SCENARIO_TAGS.map(k => chip(k, t(`CdA.Tag.${k}`))),
      modes: Object.values(MODES).map(k => chip(k, t(`CdA.Mode.${k}`))),
      any: active.size > 0,
      scenarios: all.filter(match).map(s => ({
        id: s.id, name: s.name, img: s.system.cover || s.img || ASSETS.cover, hook: s.system.hook, author: s.system.author,
        duration: s.system.duration, players: s.system.players, tone: s.system.tone.join(" · "),
        modes: s.system.modes.map(m => t(`CdA.Mode.${m}`)), tags: s.system.tags.map(k => t(`CdA.Tag.${k}`)),
        variant: Boolean(s.system.variantOf), owner: s.isOwner
      }))
    };
  }

  static #item(target) { return game.items.get(target.closest("[data-id]")?.dataset.id); }
  static #filter(event, target) {
    const key = target.dataset.key;
    if (!key) this.filters.clear();
    else this.filters.has(key) ? this.filters.delete(key) : this.filters.add(key);
    this.render();
  }
  static #play(event, target) { openApp("start", { scenario: LibraryApp.#item(target) }); }
  static #edit(event, target) { LibraryApp.#item(target)?.sheet.render(true); }
  static async #create() {
    const item = await Item.implementation.create({ name: t("CdA.Library.NewScenario"), type: "scenario", img: ASSETS.cover });
    item?.sheet.render(true);
  }
  static async #import() {
    const text = await ContentService.pickFile();
    if (!text) return;
    try {
      const item = await ContentService.importText(text);
      ui.notifications.info(f("CdA.Library.ImportedOk", { name: item.name }));
    } catch (error) {
      console.warn("MR · Cuentos de Ánimas | importación", error);
      ui.notifications.error(f("CdA.Library.ImportFailed", { error: error.message }));
    }
  }
  static #export(event, target) { const item = LibraryApp.#item(target); if (item) ContentService.export(item); }
  static async #duplicate(event, target) { const item = LibraryApp.#item(target); if (item) await ContentService.duplicate(item); }
  static async #variant(event, target) {
    const item = LibraryApp.#item(target); if (!item) return;
    (await ContentService.duplicate(item, { variant: true }))?.sheet.render(true);
  }
  static async #delete(event, target) {
    const item = LibraryApp.#item(target); if (!item) return;
    const ok = await DialogV2.confirm({ window: { title: "CdA.Library.Delete" }, content: `<p>${f("CdA.Library.DeleteConfirm", { name: foundry.utils.escapeHTML(item.name) })}</p>`, rejectClose: false });
    if (ok) await item.delete();
  }
}
