import { Direction } from "../services/direction.mjs";
import { ASSETS, CARD_KINDS, MODES, SCENARIO_TAGS, TEMPLATES } from "../constants.mjs";
import { enrich, shareImage } from "../compat.mjs";
import { MEMORY_KINDS, LINK_TYPES } from "../models.mjs";
import { AMBIENTS } from "../services/sound.mjs";
import { ContentService } from "../services/content.mjs";
import { Presenter } from "../services/presenter.mjs";
import { Records } from "../services/records.mjs";
import { StateService } from "../services/state.mjs";
import { openApp } from "../apps/registry.mjs";
import { KIND_ICONS, choices } from "../apps/view.mjs";
import { BaseItemSheet, splitTags } from "./base.mjs";

const t = key => game.i18n.localize(key);

/** Campos de cada lista del escenario. [nombre, tipo, opciones]. */
/** La dificultad no va en la lista: la trae impresa la carta de obstáculo que se roba (4‑7). */
const CARD_FIELDS = [["title", "text"], ["text", "textarea"], ["image", "image"], ["guardian", "textarea", { gm: true }]];
const LISTS = {
  scenes: [["title", "text"], ["text", "textarea"], ["guardian", "textarea", { gm: true }], ["handout", "image"]],
  characters: [["name", "text"], ["description", "textarea"], ["secret", "textarea", { gm: true }], ["image", "image"]],
  clues: CARD_FIELDS,
  environmentObstacles: CARD_FIELDS,
  characterObstacles: CARD_FIELDS,
  incidents: CARD_FIELDS,
  epilogueTable: [["label", "text"], ["min", "number"], ["max", "number"], ["text", "textarea"]],
  tension: [["title", "text"], ["text", "textarea"], ["guardian", "textarea", { gm: true }]],
  memories: [["title", "text"], ["kind", "select", { choices: MEMORY_KINDS, prefix: "CdA.Memory.Kind" }], ["prompt", "textarea"], ["followUp", "textarea"], ["link.type", "select", { choices: LINK_TYPES, prefix: "CdA.Link" }], ["link.label", "text"]],
  truths: [["text", "textarea"], ["contradiction", "textarea", { gm: true }], ["reveal", "text", { gm: true }]],
  handouts: [["title", "text"], ["image", "image"], ["text", "textarea"]]
};
const BLANK = {
  scenes: { title: "", text: "", guardian: "", handout: "" },
  characters: { name: "", description: "", secret: "", image: "" },
  clues: { title: "", text: "", difficulty: 0, image: "", guardian: "" },
  environmentObstacles: { title: "", text: "", difficulty: 5, image: "", guardian: "" },
  characterObstacles: { title: "", text: "", difficulty: 5, image: "", guardian: "" },
  incidents: { title: "", text: "", difficulty: 0, image: "", guardian: "" },
  tension: { title: "", text: "", guardian: "" },
  memories: { title: "", prompt: "", followUp: "", kind: "question", link: { type: "", label: "" } },
  truths: { text: "", contradiction: "", reveal: "" },
  handouts: { title: "", image: "", text: "" },
  epilogueTable: { label: "", min: 0, max: 99, text: "" }
};
const LIST_KIND = { clues: CARD_KINDS.CLUE, environmentObstacles: CARD_KINDS.ENVIRONMENT, characterObstacles: CARD_KINDS.CHARACTER, incidents: CARD_KINDS.INCIDENT };

const TABS = ["play", "presentation", "characters", "clues", "obstacles", "incidents", "tension", "grays", "epilogues", "memories", "truths", "art", "sound", "config"];
const TAB_ICONS = {
  play: "fa-solid fa-hat-wizard", presentation: "fa-solid fa-book", characters: "fa-solid fa-users", clues: KIND_ICONS.clue,
  obstacles: KIND_ICONS.environment, incidents: KIND_ICONS.incident, tension: "fa-solid fa-stairs", grays: KIND_ICONS.gray,
  epilogues: "fa-solid fa-door-open", memories: "fa-solid fa-cloud-moon", truths: "fa-solid fa-eye", art: "fa-solid fa-image",
  sound: "fa-solid fa-music", config: "fa-solid fa-sliders"
};

/**
 * Escenario: editor completo sin tocar JSON (13 pestañas) y, para el Guardián,
 * una pestaña «En juego» con lo que toca en la escena actual.
 */
export class ScenarioSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["cda-scenario"],
    position: { width: 1180, height: 820 },
    window: { icon: "fa-solid fa-book-skull" },
    actions: {
      add: ScenarioSheet.#add, remove: ScenarioSheet.#remove, move: ScenarioSheet.#move, play: ScenarioSheet.#play,
      export: ScenarioSheet.#export, pick: ScenarioSheet.#pick, reveal: ScenarioSheet.#reveal, handout: ScenarioSheet.#handout,
      launch: ScenarioSheet.#launch, truth: ScenarioSheet.#truth, scene: ScenarioSheet.#scene, openApp: (e, target) => openApp(target.dataset.app)
    }
  };
  static PARTS = { sheet: { template: `${TEMPLATES}/sheets/scenario.hbs`, scrollable: [".cda-scenario-scroll"] } };
  static SCROLL_MEMORY = [".cda-scenario-scroll"];
  static TABS = { scenario: { initial: "presentation", tabs: TABS.map(id => ({ id, icon: TAB_ICONS[id], label: `CdA.Scenario.Tab.${id}` })) } };

  get isActive() { return StateService.get().scenarioUuid === this.document.uuid; }

  _getTabsConfig(group) {
    const config = foundry.utils.deepClone(super._getTabsConfig(group));
    if (!game.user.isGM) config.tabs = config.tabs.filter(tab => tab.id !== "play");
    return config;
  }

  /** El Guardián abre el escenario en juego directamente en «En juego»; un jugador nunca ve esa pestaña. */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    if (!options.isFirstRender) return;
    if (game.user.isGM && this.isActive) this.tabGroups.scenario = "play";
    else if (!game.user.isGM && this.tabGroups.scenario === "play") this.tabGroups.scenario = "presentation";
  }

  async _prepareContext(options) {
    if (!game.user.isGM && StateService.get().mode === MODES.DIRECTED) return {};
    const context = await super._prepareContext(options);
    const item = this.document, s = item.system, gm = game.user.isGM;
    const list = name => (s[name] ?? []).map((entry, i) => ({
      i, n: i + 1, list: name, kind: LIST_KIND[name],
      fields: LISTS[name].filter(([, , o]) => gm || !o?.gm).map(([key, type, o = {}]) => ({
        key, type, gm: o.gm, name: `system.${name}.${i}.${key}`, value: foundry.utils.getProperty(entry, key),
        label: t(`CdA.Field.${key}`), wide: type === "textarea",
        options: type === "select" ? choices(o.choices, o.prefix, foundry.utils.getProperty(entry, key)) : null
      }))
    }));
    const state = StateService.get();
    const scene = s.scenes[state.scene];
    return {
      enriched: {
        synopsis: await enrich(s.synopsis, item), introduction: await enrich(s.introduction, item),
        guardianNotes: gm ? await enrich(s.guardianNotes, item) : ""
      },
      ...context, item, system: s, gm, editable: this.isEditable, active: this.isActive, assets: ASSETS,
      cover: s.cover || item.img || ASSETS.cover,
      lists: Object.fromEntries(Object.keys(LISTS).map(k => [k, list(k)])),
      toneText: s.tone.join(", "), notesText: s.contentNotes.join(", "),
      tagChoices: SCENARIO_TAGS.map(k => ({ key: k, label: t(`CdA.Tag.${k}`), checked: s.tags.includes(k) })),
      modeChoices: Object.values(MODES).map(k => ({ key: k, label: t(`CdA.Mode.${k}`), checked: s.modes.includes(k) })),
      grays: [0, 1, 2].map(i => ({ i, roman: ["I", "II", "III"][i], img: ASSETS.gray[i], entry: s.tension[i] ?? { title: "", text: "", guardian: "" } })),
      sounds: ["intro", "play", "gray", "epilogue"].map(k => ({
        key: k, label: t(`CdA.Scenario.Sound.${k}`), value: s.sounds[k], custom: s.sounds[k] && !AMBIENTS.includes(s.sounds[k]),
        options: [{ value: "", label: t("CdA.Ambient.none"), selected: !s.sounds[k] }, ...AMBIENTS.map(a => ({ value: a, label: t(`CdA.Ambient.${a}`), selected: a === s.sounds[k] }))]
      })),
      variants: choices(["world", "fixed", "random-third"], "CdA.Deck.Variant", s.deckVariant),
      counts: { cards: s.clues.length + s.environmentObstacles.length + s.characterObstacles.length + s.incidents.length },
      play: gm && this.isActive ? {
        scene: scene ? { ...scene, n: state.scene + 1, of: s.scenes.length } : null,
        hasPrev: state.scene > 0, hasNext: state.scene < s.scenes.length - 1,
        clues: s.clues.map((c, i) => ({ ...c, i })), handouts: s.handouts.map((h, i) => ({ ...h, i })),
        memories: s.memories.map((m, i) => ({ ...m, i })), gray: state.grayLadies, phase: t(`CdA.Phase.${state.phase}`),
        characters: s.characters
      } : null
    };
  }

  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    const sys = data.system ??= {};
    if ("toneText" in data) { sys.tone = splitTags(data.toneText); delete data.toneText; }
    if ("notesText" in data) { sys.contentNotes = splitTags(data.notesText); delete data.notesText; }
    if (data.tagSet) { sys.tags = Object.entries(data.tagSet).filter(([, on]) => on).map(([k]) => k); delete data.tagSet; }
    if (data.modeSet) { sys.modes = Object.entries(data.modeSet).filter(([, on]) => on).map(([k]) => k); delete data.modeSet; }
    if (sys.cover) data.img = sys.cover;
    return data;
  }

  /* ------------------------------------------ */

  static async #add(event, target) {
    const list = target.dataset.list;
    if (BLANK[list]) await this.addEntry(list, foundry.utils.deepClone(BLANK[list]));
  }
  static async #remove(event, target) { await this.removeEntry(target.dataset.list, Number(target.dataset.index)); }
  static async #move(event, target) { await this.moveEntry(target.dataset.list, Number(target.dataset.index), Number(target.dataset.delta)); }
  static #play() { openApp("start", { scenario: this.document }); }
  static #export() { ContentService.export(this.document); }

  /** Selector de imagen de Foundry para cualquier campo de ruta. */
  static #pick(event, target) {
    const input = target.parentElement.querySelector("input");
    const Picker = foundry.applications.apps.FilePicker.implementation;
    new Picker({ type: "image", current: input.value, callback: path => { input.value = path; input.dispatchEvent(new Event("change", { bubbles: true })); } }).render(true);
  }

  /** En juego: mostrar a todos una pista del escenario como carta. */
  static #reveal(event, target) {
    if (!game.user.isGM) return;
    const entry = this.document.system.clues[Number(target.dataset.index)];
    if (!entry) return;
    if (StateService.get().mode === MODES.DIRECTED) return Direction.send({ purpose: "free", kind: "clue", title: entry.title, text: entry.text, image: entry.image }, StateService.get().narratorId);
    Presenter.broadcast({ type: "clue", clue: { title: entry.title, text: entry.text } });
    StateService.log({ type: "clue", card: entry.title });
  }
  static #handout(event, target) {
    if (!game.user.isGM) return;
    if (StateService.get().mode === MODES.DIRECTED) return Direction.send({ purpose: "free", kind: "note", title: target.dataset.title ?? "", text: "", image: target.dataset.src }, StateService.get().narratorId);
    const src = target.dataset.src; if (src) shareImage(src, target.dataset.title ?? "");
  }
  static async #launch(event, target) {
    if (!game.user.isGM) return;
    const m = this.document.system.memories[Number(target.dataset.index)]; if (!m) return;
    if (StateService.get().mode === MODES.DIRECTED) return Direction.send({ purpose: "free", kind: "memory", title: m.title, text: [m.prompt, m.followUp].filter(Boolean).join("\n") }, StateService.get().narratorId);
    Presenter.broadcast({ type: "memory", memory: { title: m.title, prompt: m.prompt, followUp: m.followUp } });
    await Records.addMemory(StateService.protagonist(), { title: m.title, text: m.prompt, kind: m.kind, link: m.link });
  }
  static async #truth(event, target) {
    if (!game.user.isGM) return;
    const input = target.parentElement.querySelector("input");
    const text = input?.value.trim(); if (!text) return;
    input.value = "";
    await Records.addTruth(StateService.protagonist(), { text, by: "guardian" });
  }
  static async #scene(event, target) {
    if (!game.user.isGM) return;
    const state = StateService.get(), max = this.document.system.scenes.length - 1;
    const n = Math.clamp(state.scene + Number(target.dataset.delta), 0, Math.max(0, max));
    if (n !== state.scene) { await StateService.patch({ scene: n }); await StateService.log({ type: "scene", text: this.document.system.scenes[n]?.title, hidden: state.mode === MODES.DIRECTED }); }
    this.render();
  }
}
