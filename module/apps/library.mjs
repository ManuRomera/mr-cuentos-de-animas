import { ASSETS, MODES, SCENARIO_TAGS, TEMPLATES } from "../constants.mjs";
import { DialogV2 } from "../compat.mjs";
import { normalizeScenario } from "../content/format.mjs";
import { ContentService } from "../services/content.mjs";
import { SystemApp, f, t } from "./base.mjs";
import { openApp } from "./registry.mjs";

const esc = s => foundry.utils.escapeHTML(String(s ?? ""));
const plain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/** Biblioteca editorial: escenarios del mundo y colección incluida, con filtros por modo y tono. */
export class LibraryApp extends SystemApp {
  static MEMORY = "library";
  static LIVE = true;
  static DEFAULT_OPTIONS = {
    id: "cda-library", classes: ["cda-library-app"],
    window: { title: "CdA.App.Library", icon: "fa-solid fa-book-open" },
    position: { width: 1180, height: 800 },
    actions: {
      filter: LibraryApp.#filter, shelf: LibraryApp.#shelf, play: LibraryApp.#play, edit: LibraryApp.#edit, create: LibraryApp.#create,
      import: LibraryApp.#import, help: () => openApp("importHelp"), export: LibraryApp.#export, duplicate: LibraryApp.#duplicate,
      variant: LibraryApp.#variant, delete: LibraryApp.#delete, add: LibraryApp.#add, addPlay: LibraryApp.#addPlay
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/library.hbs`, scrollable: [".cda-library-scroll"] } };
  static SCROLL_MEMORY = [".cda-library-scroll"];

  filters = new Set();
  shelf = "world";

  async _prepareContext() {
    const active = this.filters;
    const world = ContentService.scenarios();
    const collection = (await ContentService.collection()).filter(e => !ContentService.inWorld(e.id)).map(e => ({ ...e, data: normalizeScenario(e.raw) }));
    const all = [...world.map(i => i.system), ...collection.map(e => e.data.system)];
    const has = (s, k) => s.tags.includes(k) || s.modes.includes(k);
    const match = s => [...active].every(k => has(s, k));
    const chip = (key, label) => ({ key, label, active: active.has(key), count: all.filter(s => has(s, key)).length });
    const book = (s, extra) => ({
      name: extra.name, img: s.cover || extra.img, hook: s.hook || plain(s.synopsis).slice(0, 180), author: s.author,
      duration: s.duration, players: s.players, tone: s.tone.join(" · "), source: s.source?.collection ?? "",
      modes: s.modes.map(m => t(`CdA.Mode.${m}`)), tags: s.tags.map(k => t(`CdA.Tag.${k}`)), ...extra
    });
    const worldBooks = world.filter(i => match(i.system)).map(i => book(i.system, {
      id: i.id, name: i.name, img: i.system.cover || (i.img?.includes("mystery-man") || i.img?.includes("icons/svg") ? "" : i.img),
      variant: Boolean(i.system.variantOf), owner: i.isOwner, world: true
    }));
    const collectionBooks = collection.filter(e => match(e.data.system)).map(e => book(e.data.system, { cid: e.id, name: e.data.name, img: "", collection: e.collection }));
    return {
      gm: game.user.isGM, shelf: this.shelf,
      counts: { world: world.length, collection: collection.length },
      tags: SCENARIO_TAGS.map(k => chip(k, t(`CdA.Tag.${k}`))),
      modes: Object.values(MODES).map(k => chip(k, t(`CdA.Mode.${k}`))),
      any: active.size > 0,
      scenarios: this.shelf === "world" ? worldBooks : collectionBooks,
      fallbackCover: ASSETS.cover
    };
  }

  static #item(target) { return game.items.get(target.closest("[data-id]")?.dataset.id); }
  static #cid(target) { return target.closest("[data-cid]")?.dataset.cid; }
  static #filter(event, target) {
    const key = target.dataset.key;
    if (!key) this.filters.clear();
    else this.filters.has(key) ? this.filters.delete(key) : this.filters.add(key);
    this.render();
  }
  static #shelf(event, target) { this.shelf = target.dataset.shelf; this.render(); }
  static #play(event, target) { openApp("start", { scenario: LibraryApp.#item(target) }); }
  static #edit(event, target) { LibraryApp.#item(target)?.sheet.render(true); }
  static async #add(event, target) {
    const item = await ContentService.addFromCollection(LibraryApp.#cid(target));
    if (item) ui.notifications.info(f("CdA.Library.ImportedOk", { name: item.name }));
  }
  static async #addPlay(event, target) {
    const item = await ContentService.addFromCollection(LibraryApp.#cid(target));
    if (item) openApp("start", { scenario: item });
  }
  static async #create() {
    const item = await Item.implementation.create({ name: t("CdA.Library.NewScenario"), type: "scenario" });
    item?.sheet.render(true);
  }

  /** Importar uno o varios escenarios. Lo válido entra; lo que falla se explica escenario a escenario. */
  static async #import() {
    const text = await ContentService.pickFile();
    if (!text) return;
    let result;
    try { result = await ContentService.importText(text); }
    catch (error) {
      ui.notifications.error(f("CdA.Library.ImportFailed", { error: error.message }));
      return;
    }
    const { created, errors } = result;
    if (created.length) ui.notifications.info(f("CdA.Library.ImportedMany", { n: created.length }));
    if (!errors.length) return;
    const list = errors.map(e => `<li><strong>${esc(e.name)}</strong><ul>${e.issues.map(i => `<li>${esc(i)}</li>`).join("")}</ul></li>`).join("");
    await DialogV2.prompt({
      window: { title: "CdA.Library.ImportProblems", icon: "fa-solid fa-triangle-exclamation" },
      classes: ["mr-cda", "cda-dialog"],
      content: `<p>${esc(f("CdA.Library.ImportProblemsText", { n: errors.length }))}</p><ul class="cda-import-errors">${list}</ul>`,
      ok: { label: "CdA.Common.Close" }, rejectClose: false
    });
  }
  static #export(event, target) { const item = LibraryApp.#item(target); if (item) ContentService.export(item); }
  static async #duplicate(event, target) { const item = LibraryApp.#item(target); if (item) await ContentService.duplicate(item); }
  static async #variant(event, target) {
    const item = LibraryApp.#item(target); if (!item) return;
    (await ContentService.duplicate(item, { variant: true }))?.sheet.render(true);
  }
  static async #delete(event, target) {
    const item = LibraryApp.#item(target); if (!item) return;
    const ok = await DialogV2.confirm({ window: { title: "CdA.Library.Delete" }, content: `<p>${f("CdA.Library.DeleteConfirm", { name: esc(item.name) })}</p>`, rejectClose: false });
    if (ok) await item.delete();
  }
}
