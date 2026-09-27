import { CARD_KINDS, FLAGS, MODES, RULES, SYSTEM_ID } from "../constants.mjs";
import * as R from "../rules.mjs";
import { DeckService } from "./decks.mjs";
import { Records } from "./records.mjs";
import { StateService } from "./state.mjs";

const t = key => game.i18n.localize(key);
const warn = key => { ui.notifications.warn(t(key)); return null; };
/** La escena queda escrita en la propia carta: el descarte y la carta ampliada la muestran siempre. */
const markCard = (card, scene) => card?.update({ [`flags.${SYSTEM_ID}.${FLAGS.CARD}.scene`]: scene });
const plain = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/**
 * Motor del relato, siguiendo el libro:
 *  robar una Carta de Evento → elegir la escena en la lista del escenario → resolverla.
 * Cada acción lee el estado compartido, aplica una regla pura de rules.mjs y escribe
 * el resultado; la Mesa y el resto de clientes reaccionan al cambio de estado.
 */
export class GameplayService {
  static #busy = false;

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
      const size = game.settings.get(SYSTEM_ID, "deckSize");
      await DeckService.buildEventDeck(scenario, { variant, size });
      await StateService.clearHistory();
      await StateService.reset({
        scenarioUuid: scenario.uuid, protagonistUuid: actor.uuid, mode, phase: "playing",
        ambient: scenario.system.sounds?.intro || scenario.system.sounds?.play || "", startedAt: Date.now()
      });
      await StateService.log({ type: "start", text: scenario.name, result: mode, variant, size });
      await Records.diary(actor, { title: scenario.name, text: plain(scenario.system.synopsis) || scenario.system.hook, kind: "start" });
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
    return state.phase === "playing" && !state.pendingGray
      && !(state.event && !state.event.choice)
      && !(state.obstacle && !state.obstacle.outcome);
  }

  static async draw() {
    const state = StateService.get();
    if (state.phase === "idle") return warn("CdA.Game.NoStory");
    if (state.pendingGray) return warn("CdA.Game.PendingGray");
    if (state.event && !state.event.choice) return warn("CdA.Game.PendingChoice");
    if (state.obstacle && !state.obstacle.outcome) return warn("CdA.Game.PendingObstacle");
    if (state.phase !== "playing") return warn("CdA.Game.StoryClosing");
    return this.#run(async () => {
      const card = await DeckService.drawEvent();
      if (!card) { ui.notifications.info(t("CdA.Game.EmptyDeck")); return null; }
      const meta = DeckService.meta(card);
      const actor = StateService.protagonist(), scenario = StateService.scenario();
      const patch = { currentCardId: card.id, obstacle: null, event: null, turn: state.turn + 1 };

      if (meta.kind === CARD_KINDS.GRAY) {
        const n = Math.max(state.grayLadies + 1, Number(meta.grayIndex) || 0);
        const tension = scenario?.system.tension?.[n - 1]?.text ?? "";
        Object.assign(patch, { grayLadies: n, pendingGray: n, tension: [...state.tension, tension] });
        const sounds = scenario?.system.sounds;
        if (sounds?.gray) patch.ambient = sounds.gray;
        await markCard(card, { title: `${t("CdA.Kind.gray")} ${["I", "II", "III"][n - 1]}`, text: tension });
        await StateService.patch(patch);
        await StateService.log({ type: "gray", gray: n, text: tension });
        await Records.diary(actor, { title: `${t("CdA.Kind.gray")} ${["I", "II", "III"][n - 1]}`, text: tension, kind: "gray", card: card.name });
        return card;
      }

      patch.event = { cardId: card.id, kind: meta.kind, value: meta.value || 0, choice: null };
      if (state.turn === 0 && scenario?.system.sounds?.play) patch.ambient = scenario.system.sounds.play;
      await StateService.patch(patch);
      await StateService.log({ type: "card", card: card.name, kind: meta.kind, value: meta.value, block: meta.block });
      return card;
    });
  }

  /** Entradas del escenario para el tipo de carta en curso, marcando las ya usadas. */
  static choices(state = StateService.get()) {
    const scenario = StateService.scenario(), kind = state.event?.kind;
    if (!scenario || !kind) return [];
    const used = state.used ?? {};
    const from = list => (scenario.system[list] ?? []).map((e, index) => ({
      list, index, title: e.title ?? e.name ?? "", text: e.text ?? e.description ?? "", used: (used[list] ?? []).includes(index)
    })).filter(e => e.title || e.text);
    if (kind === CARD_KINDS.INCIDENT) return [...from("incidents"), ...from("characters")];
    return from(R.KIND_LIST[kind]);
  }

  /**
   * Fija la escena de la carta revelada: una entrada del escenario (`list`+`index`) o una escrita a mano (`custom`).
   * Si la carta es un obstáculo, abre su resolución con la dificultad impresa en la carta.
   */
  static async choose({ list = "", index = -1, custom = "" } = {}) {
    const state = StateService.get();
    const event = state.event;
    if (!event || event.choice) return null;
    const entry = index >= 0 ? this.choices(state).find(c => c.list === list && c.index === index) : null;
    const title = entry?.title || custom.trim();
    if (!title) return null;
    return this.#run(async () => {
      const actor = StateService.protagonist();
      const choice = { list: entry ? list : "", index: entry ? index : -1, title, text: entry?.text ?? "" };
      const patch = { event: { ...event, choice } };
      if (entry) patch.used = { ...state.used, [list]: [...new Set([...(state.used?.[list] ?? []), index])] };
      if (event.kind === CARD_KINDS.CLUE) patch.clues = [...state.clues, { title, text: choice.text }];
      if (R.OBSTACLE_KINDS.includes(event.kind)) {
        patch.obstacle = R.newObstacle({ cardId: event.cardId, title, kind: event.kind, base: event.value }, state.grayLadies);
      }
      await markCard(DeckService.current(), { title, text: choice.text });
      await StateService.patch(patch);
      await StateService.log({ type: "scene", kind: event.kind, text: title, value: event.value });
      const kindLabel = t(`CdA.Kind.${event.kind}`);
      const title2 = event.kind === CARD_KINDS.INCIDENT ? `${kindLabel}: ${title}` : title;
      await Records.diary(actor, { title: title2, text: choice.text, kind: event.kind, card: kindLabel });
      return choice;
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
      await this.#finish(actor, obstacle);
      return obstacle;
    });
  }

  /** Guarda el obstáculo y, si ya tiene desenlace, lo aplica y lo anota. El Espíritu a 0 no corta el relato. */
  static async #finish(actor, obstacle) {
    if (obstacle.outcome === "failure") await this.#change(actor, "spirit", -RULES.failureSpiritLoss);
    await StateService.patch({ obstacle });
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

  /** El precio de una Dama: 1 de Determinación o 1 de Espíritu, a elección. Sin ninguno de los dos, no hay precio. */
  static async payGray(resource) {
    const state = StateService.get(), actor = StateService.protagonist();
    if (!state.pendingGray) return null;
    const available = r => (actor?.system[r].value ?? 0) > 0;
    if (resource === "none" && (available("spirit") || available("determination"))) return null;
    if (resource !== "none" && !available(resource)) return null;
    return this.#run(async () => {
      if (resource !== "none") await this.#change(actor, resource, -1);
      const phase = state.pendingGray >= RULES.grayLadies ? "epilogue" : "playing";
      await StateService.patch({ pendingGray: 0, phase });
      await StateService.log({ type: "gray-price", result: resource, gray: state.pendingGray });
      return phase;
    });
  }

  /* ------------------------------------------ */
  /*  Epílogo                                   */
  /* ------------------------------------------ */

  static epilogueRow(scenario = StateService.scenario(), actor = StateService.protagonist()) {
    return R.epilogueRow(scenario?.system.epilogueTable ?? [], actor?.system.spirit.value ?? 0);
  }

  static async epilogue() {
    const scenario = StateService.scenario(), actor = StateService.protagonist();
    if (!scenario) return warn("CdA.Game.NoStory");
    return this.#run(async () => {
      const row = this.epilogueRow(scenario, actor);
      const index = scenario.system.epilogueTable.indexOf(row);
      await StateService.patch({ phase: "finished", obstacle: null, pendingGray: 0, event: null, ambient: scenario.system.sounds?.epilogue ?? "" });
      await StateService.log({ type: "epilogue", result: String(index), text: row?.text ?? "" });
      await Records.diary(actor, { title: t("CdA.Game.Epilogue"), text: row?.text ?? "", kind: "epilogue", result: row?.label ?? "" });
      return row;
    });
  }

  static async toEpilogue() {
    await StateService.patch({ phase: "epilogue", obstacle: null, pendingGray: 0, event: null });
    await StateService.log({ type: "phase", result: "epilogue" });
  }
}
