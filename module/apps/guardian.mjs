import { CARD_KINDS, TEMPLATES } from "../constants.mjs";
import { DialogV2 } from "../compat.mjs";
import { AMBIENTS } from "../services/sound.mjs";
import { DeckService } from "../services/decks.mjs";
import { GameplayService as Game } from "../services/gameplay.mjs";
import { Records } from "../services/records.mjs";
import { StateService } from "../services/state.mjs";
import { Presenter } from "../services/presenter.mjs";
import { SoundService } from "../services/sound.mjs";
import { SystemApp, f, t } from "./base.mjs";
import { cardView, roman } from "./view.mjs";
import { openApp } from "./registry.mjs";


/**
 * Herramienta del Guardián: todo el control de la partida en una ventana compacta.
 * Ve la forma del mazo (bloques y si la Dama sigue dentro) sin ver qué carta viene.
 */
export class GuardianApp extends SystemApp {
  static MEMORY = "guardian";
  static LIVE = true;
  static MEMORY_FIELDS = ["left", "top", "height"];
  static DEFAULT_OPTIONS = {
    id: "cda-guardian", classes: ["cda-guardian-app"],
    window: { title: "CdA.App.Guardian", icon: "fa-solid fa-hat-wizard" },
    position: { width: 440, height: 760 },
    actions: {
      draw: () => Game.draw(), resource: GuardianApp.#resource, gray: GuardianApp.#gray, insert: GuardianApp.#insert,
      discard: GuardianApp.#discard, reshuffle: GuardianApp.#reshuffle, rebuild: GuardianApp.#rebuild, scene: GuardianApp.#scene,
      truth: GuardianApp.#truth, note: GuardianApp.#note, memory: GuardianApp.#memory, epilogue: () => Game.toEpilogue(),
      show: GuardianApp.#show, open: (e, target) => openApp(target.dataset.app), end: GuardianApp.#end
    }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/guardian.hbs`, scrollable: [".cda-guardian-scroll"] } };
  static SCROLL_MEMORY = [".cda-guardian-scroll"];

  /** A la derecha, junto a la barra lateral: la Mesa queda a la vista. */
  static initialPosition({ width, height }) {
    return { left: Math.max(10, width - 440 - 330), top: 50, height: Math.min(760, height - 110) };
  }

  static open(options) {
    if (!game.user.isGM) return null;
    return super.open(options);
  }

  async _prepareContext() {
    const state = StateService.get(), scenario = StateService.scenario(), actor = StateService.protagonist();
    const scenes = scenario?.system.scenes ?? [];
    const next = DeckService.remaining()[0];
    return {
      state, idle: state.phase === "idle",
      phase: t(`CdA.Phase.${state.phase}`),
      scenario: scenario ? { name: scenario.name, epilogues: scenario.system.epilogueTable.map(r => ({ label: r.label || `${r.min}–${r.max}`, text: r.text, current: r === Game.epilogueRow(scenario, actor) })) } : null,
      scene: scenes[state.scene] ? { ...scenes[state.scene], n: state.scene + 1, of: scenes.length } : null,
      hasPrev: state.scene > 0, hasNext: state.scene < scenes.length - 1,
      actor: actor ? { name: actor.name, spirit: actor.system.spirit, determination: actor.system.determination } : null,
      blocks: DeckService.blocks().map(b => ({ ...b, roman: roman(b.block), current: b.block === DeckService.meta(next).block })),
      remaining: DeckService.remaining().length,
      grayLeft: DeckService.remaining().some(c => DeckService.meta(c).kind === CARD_KINDS.GRAY),
      canDraw: Game.canDraw(state),
      current: cardView(DeckService.current()),
      memories: (scenario?.system.memories ?? []).map((m, i) => ({ i, title: m.title })),
      ambients: [{ value: "", label: t("CdA.Ambient.none"), selected: !state.ambient }, ...AMBIENTS.map(a => ({ value: a, label: t(`CdA.Ambient.${a}`), selected: a === state.ambient }))]
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.querySelector("select[name=ambient]")?.addEventListener("change", async e => {
      await StateService.patch({ ambient: e.target.value });
      SoundService.setAmbient(e.target.value);
    });
  }

  static #value(root, name) { const el = root.querySelector(`[name="${name}"]`); const v = el?.value?.trim() ?? ""; if (el) el.value = ""; return v; }

  static async #resource(event, target) {
    const actor = StateService.protagonist(); if (!actor) return;
    const key = target.dataset.resource, delta = Number(target.dataset.delta);
    const r = actor.system[key];
    const update = target.dataset.max ? { [`system.${key}.max`]: Math.clamp(r.max + delta, 1, 12) } : { [`system.${key}.value`]: Math.clamp(r.value + delta, 0, r.max) };
    await actor.update(update);
    await StateService.log({ type: "adjust", result: key, delta, max: Boolean(target.dataset.max) });
  }

  static async #gray() {
    const card = await DeckService.advanceGray();
    if (!card) return ui.notifications.info(t("CdA.Guardian.NoGrayLeft"));
    await StateService.log({ type: "gm", result: "advance-gray", hidden: true });
    ui.notifications.info(t("CdA.Guardian.GrayNext"));
  }

  /** Insertar una Carta de Evento genérica (tipo y, si es obstáculo, dificultad 4‑7). */
  static async #insert(event, target) {
    const root = target.closest("fieldset");
    const kind = root.querySelector("[name=insertKind]").value;
    const obstacle = kind === CARD_KINDS.ENVIRONMENT || kind === CARD_KINDS.CHARACTER;
    const value = obstacle ? Number(root.querySelector("[name=insertValue]").value) || 5 : 0;
    const where = root.querySelector("[name=insertWhere]").value;
    const data = DeckService.cardData(kind, value, StateService.scenario()?.system.customBack || undefined);
    await DeckService.insert(data, where);
    await StateService.log({ type: "gm", result: "insert", card: data.name, hidden: true });
    ui.notifications.info(f("CdA.Guardian.Inserted", { name: data.name }));
  }
  static async #discard() {
    await StateService.patch({ currentCardId: "", obstacle: null, event: null });
  }
  static async #reshuffle() {
    await DeckService.reshuffleBlocks(game.settings.get("mr-cuentos-de-animas", "grayVariant"));
    ui.notifications.info(t("CdA.Guardian.Reshuffled"));
  }
  static async #rebuild() {
    const scenario = StateService.scenario(); if (!scenario) return;
    const ok = await DialogV2.confirm({ window: { title: "CdA.Guardian.Rebuild" }, content: `<p>${t("CdA.Guardian.RebuildConfirm")}</p>`, rejectClose: false });
    if (!ok) return;
    const actor = StateService.protagonist(), state = StateService.get();
    await Game.start({ scenario, actor, mode: state.mode });
  }
  static async #scene(event, target) {
    const state = StateService.get(), scenes = StateService.scenario()?.system.scenes ?? [];
    const n = Math.clamp(state.scene + Number(target.dataset.delta), 0, Math.max(0, scenes.length - 1));
    if (n === state.scene) return;
    await StateService.patch({ scene: n });
    await StateService.log({ type: "scene", text: scenes[n]?.title ?? "" });
  }
  static async #truth(event, target) {
    const root = target.closest("fieldset");
    const text = GuardianApp.#value(root, "truth");
    const hidden = root.querySelector("[name=truthHidden]")?.checked;
    if (text) await Records.addTruth(StateService.protagonist(), { text, by: "guardian", hidden, status: hidden ? "pending" : "established" });
  }
  static async #note(event, target) {
    const text = GuardianApp.#value(target.closest("fieldset"), "note");
    if (text) await StateService.log({ type: "note", text, hidden: true });
  }
  static async #memory(event, target) {
    const i = Number(target.closest("fieldset").querySelector("[name=memory]").value);
    const prompt = StateService.scenario()?.system.memories?.[i]; if (!prompt) return;
    Presenter.broadcast({ type: "memory", memory: { title: prompt.title, prompt: prompt.prompt, followUp: prompt.followUp } });
    await Records.addMemory(StateService.protagonist(), { title: prompt.title, text: prompt.prompt, kind: prompt.kind, link: prompt.link });
  }
  /** Mostrar a todos la carta actual en grande. */
  static #show() {
    const card = cardView(DeckService.current(), { gm: false });
    if (card) Presenter.broadcast({ type: "card", card });
  }
  static async #end() {
    const ok = await DialogV2.confirm({ window: { title: "CdA.Table.End" }, content: `<p>${t("CdA.Table.EndConfirm")}</p>`, rejectClose: false });
    if (ok) await Game.end();
  }
}
