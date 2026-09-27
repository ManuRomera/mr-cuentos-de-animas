import { CARD_KINDS, MODES, RULES, SYSTEM_ID } from "../constants.mjs";
import * as R from "../rules.mjs";
import { DeckService } from "./decks.mjs";
import { Records } from "./records.mjs";
import { StateService } from "./state.mjs";

const t = key => game.i18n.localize(key);
const warn = key => { ui.notifications.warn(t(key)); return null; };

/**
 * Motor del relato. Cada acción lee el estado compartido, aplica una regla
 * pura de rules.mjs y escribe el resultado; la Mesa y el resto de clientes
 * reaccionan al cambio del estado, no a la acción.
 */
export class GameplayService {
  static #busy = false;

  /** Evita dobles clics y acciones cruzadas mientras una operación escribe. */
  static async #run(fn) {
    if (this.#busy) return null;
    this.#busy = true;
    try { return await fn(); }
    catch (error) {
      console.error("MR · Cuentos de Ánimas | acción de juego", error);
      ui.notifications.error(t("CdA.Error.Action"));
      return null;
    }
    finally { this.#busy = false; }
  }

  static async #change(actor, resource, delta) {
    if (!actor || !delta) return 0;
    const now = actor.system[resource].value;
    const next = Math.clamp(now + delta, 0, actor.system[resource].max);
    if (next !== now) await actor.update({ [`system.${resource}.value`]: next });
    return next - now;
  }

  /* ------------------------------------------ */
  /*  Inicio y fin                              */
  /* ------------------------------------------ */

  static async start({ scenario, actor, mode = MODES.GUARDIAN, spirit, determination }) {
    return this.#run(async () => {
      if (Number.isInteger(spirit) && Number.isInteger(determination)) {
        await actor.update({ "system.spirit": { value: spirit, max: spirit }, "system.determination": { value: determination, max: determination } });
      }
      const worldVariant = game.settings.get(SYSTEM_ID, "grayVariant");
      const variant = scenario.system.deckVariant === "world" ? worldVariant : scenario.system.deckVariant;
      await DeckService.buildEventDeck(scenario, variant);
      await StateService.clearHistory();
      await StateService.reset({
        scenarioUuid: scenario.uuid, protagonistUuid: actor.uuid, mode, phase: "playing",
        ambient: scenario.system.sounds?.play ?? "", startedAt: Date.now()
      });
      await StateService.log({ type: "start", text: scenario.name, result: mode, variant });
      await Records.diary(actor, { title: scenario.name, text: scenario.system.hook, kind: "start" });
      return { scenario, actor };
    });
  }

  static async end() {
    return this.#run(async () => {
      await StateService.log({ type: "end" });
      await StateService.reset();
    });
  }

  /* ------------------------------------------ */
  /*  Robar                                     */
  /* ------------------------------------------ */

  static canDraw(state = StateService.get()) {
    return state.phase === "playing" && !state.pendingGray && !(state.obstacle && !state.obstacle.outcome);
  }

  static async draw() {
    const state = StateService.get();
    if (state.phase === "idle") return warn("CdA.Game.NoStory");
    if (state.pendingGray) return warn("CdA.Game.PendingGray");
    if (state.obstacle && !state.obstacle.outcome) return warn("CdA.Game.PendingObstacle");
    if (state.phase !== "playing") return warn("CdA.Game.StoryClosing");
    return this.#run(async () => {
      const card = await DeckService.drawEvent();
      if (!card) { ui.notifications.info(t("CdA.Game.EmptyDeck")); return null; }
      const meta = DeckService.meta(card);
      const actor = StateService.protagonist();
      const patch = { currentCardId: card.id, obstacle: null };

      if (meta.kind === CARD_KINDS.GRAY) {
        patch.grayLadies = Math.max(state.grayLadies + 1, Number(meta.grayIndex) || 0);
        patch.pendingGray = patch.grayLadies;
        const sounds = StateService.scenario()?.system.sounds;
        if (sounds?.gray) patch.ambient = sounds.gray;
      }
      else if (R.OBSTACLE_KINDS.includes(meta.kind)) {
        patch.obstacle = R.newObstacle({ cardId: card.id, title: meta.title || card.name, kind: meta.kind, base: meta.difficulty }, state.grayLadies);
      }

      await StateService.patch(patch);
      await StateService.log({ type: "card", card: card.name, kind: meta.kind, block: meta.block, text: meta.text });
      await Records.diary(actor, { title: meta.title || card.name, text: meta.text ?? "", kind: meta.kind, card: card.name });
      return card;
    });
  }

  /* ------------------------------------------ */
  /*  Obstáculos                                */
  /* ------------------------------------------ */

  static options(state = StateService.get()) {
    const actor = StateService.protagonist();
    return R.obstacleOptions(state.obstacle, { determination: actor?.system.determination.value ?? 0, grayLadies: state.grayLadies });
  }

  /** Un paso de la resolución, solo si las reglas lo permiten en este momento. */
  static async #step(option, transition, { needsCard = false } = {}) {
    const state = StateService.get();
    const actor = StateService.protagonist();
    if (!state.obstacle) return warn("CdA.Game.NoObstacle");
    if (!actor) return warn("CdA.Game.NoProtagonist");
    if (!this.options(state)[option]) return null;
    return this.#run(async () => {
      let drawn = null;
      if (needsCard) { drawn = await DeckService.drawNumber(); if (!drawn) return null; }
      const { obstacle, cost } = transition(state.obstacle, drawn?.value);
      if (obstacle === state.obstacle) return null;
      if (cost && await this.#change(actor, "determination", -cost) === 0) return warn("CdA.Game.NoDetermination");
      await this.#finish(actor, state, obstacle);
      return obstacle;
    });
  }

  /** Guarda el obstáculo y, si ya tiene desenlace, lo aplica y lo anota. */
  static async #finish(actor, state, obstacle) {
    const patch = { obstacle };
    if (obstacle.outcome === "failure") {
      await this.#change(actor, "spirit", -RULES.failureSpiritLoss);
      if (actor.system.spirit.value <= 0) patch.phase = "epilogue";
    }
    await StateService.patch(patch);
    if (!obstacle.outcome) return;
    const outcome = t(`CdA.Game.${obstacle.outcome === "success" ? "Success" : "Failure"}`);
    const detail = game.i18n.format("CdA.Game.ResultDetail", { value: obstacle.value, bonus: obstacle.preBonus + obstacle.bonus, difficulty: obstacle.difficulty });
    await StateService.log({ type: "obstacle", card: obstacle.title, result: obstacle.outcome, value: obstacle.value, bonus: obstacle.preBonus + obstacle.bonus, difficulty: obstacle.difficulty, spent: obstacle.spent });
    await Records.diary(actor, { title: `${obstacle.title} · ${outcome}`, text: detail, kind: obstacle.outcome, card: obstacle.title, result: outcome });
    await ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor }),
      content: `<div class="cda-chat-card ${obstacle.outcome}"><span class="cda-chat-kicker">${foundry.utils.escapeHTML(obstacle.title)}</span><strong>${outcome}</strong><small>${detail}</small></div>`
    });
  }

  static spend() { return this.#step("spend", o => R.spendBeforeReveal(o)); }
  static reveal() { return this.#step("reveal", (o, value) => ({ obstacle: R.reveal(o, value), cost: 0 }), { needsCard: true }); }
  static push() { return this.#step("push", o => R.push(o)); }
  static reroll() { return this.#step("reroll", (o, value) => R.reroll(o, value), { needsCard: true }); }
  static accept() { return this.#step("accept", o => ({ obstacle: R.accept(o), cost: 0 })); }

  /* ------------------------------------------ */
  /*  Damas Grises                              */
  /* ------------------------------------------ */

  /** El precio de una Dama: gastar Determinación o perder Espíritu. */
  static async payGray(resource) {
    const state = StateService.get(), actor = StateService.protagonist();
    if (!state.pendingGray) return null;
    return this.#run(async () => {
      const paid = actor ? await this.#change(actor, resource, -1) : 0;
      const spiritGone = actor && actor.system.spirit.value <= 0;
      const phase = spiritGone || state.pendingGray >= RULES.grayLadies ? "epilogue" : "playing";
      await StateService.patch({ pendingGray: 0, phase });
      await StateService.log({ type: "gray", result: resource, gray: state.pendingGray, paid: Boolean(paid) });
      return phase;
    });
  }

  /* ------------------------------------------ */
  /*  Epílogo                                   */
  /* ------------------------------------------ */

  static epilogueKey() { return R.epilogueKey(StateService.protagonist()?.system.spirit.value ?? 0); }

  static async epilogue() {
    const scenario = StateService.scenario(), actor = StateService.protagonist();
    if (!scenario) return warn("CdA.Game.NoStory");
    return this.#run(async () => {
      const key = this.epilogueKey();
      const text = scenario.system.epilogues[key] ?? "";
      await StateService.patch({ phase: "finished", obstacle: null, pendingGray: 0, ambient: scenario.system.sounds?.epilogue ?? "" });
      await StateService.log({ type: "epilogue", result: key, text });
      await Records.diary(actor, { title: t("CdA.Game.Epilogue"), text, kind: "epilogue", result: t(`CdA.Epilogue.${key}`) });
      return { key, text };
    });
  }

  /** El Guardián lleva el relato al epílogo aunque queden cartas. */
  static async toEpilogue() {
    await StateService.patch({ phase: "epilogue", obstacle: null, pendingGray: 0 });
    await StateService.log({ type: "phase", result: "epilogue" });
  }
}
