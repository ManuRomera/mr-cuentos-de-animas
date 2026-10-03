import { Direction } from "./direction.mjs";
import { DEFAULT_STATE, FLAGS, SYSTEM_ID } from "../constants.mjs";

const HISTORY_LIMIT = 1000;

/**
 * Estado compartido del relato y su historial estructurado.
 * Ambos viven en flags del Mazo de Ánimas: Foundry los sincroniza entre clientes.
 */
export class StateService {
  static eventDeck() { return game.cards?.find(c => c.getFlag(SYSTEM_ID, FLAGS.ROLE) === "event") ?? null; }

  static get() {
    const saved = this.eventDeck()?.getFlag(SYSTEM_ID, FLAGS.STATE) ?? {};
    return { ...foundry.utils.deepClone(DEFAULT_STATE), ...foundry.utils.deepClone(saved) };
  }

  static async patch(changes) {
    if (!game.user.isGM) throw new Error("GM authority required");
    const deck = this.eventDeck();
    if (!deck) throw new Error("No existe el Mazo de Ánimas.");
    const next = { ...this.get(), ...changes };
    // Todas las claves del estado existen siempre (DEFAULT_STATE, rules.newObstacle): fusionar es seguro.
    await deck.setFlag(SYSTEM_ID, FLAGS.STATE, next);
    return next;
  }

  /** Estado limpio. Se borra antes: setFlag fusiona y dejaría vivas, p. ej., las entradas «ya usadas» del relato anterior. */
  static async reset(patch = {}) {
    if (!game.user.isGM) throw new Error("GM authority required");
    await this.eventDeck()?.unsetFlag(SYSTEM_ID, FLAGS.STATE);
    return this.patch({ ...foundry.utils.deepClone(DEFAULT_STATE), ...patch });
  }

  static protagonist() { const uuid = this.get().protagonistUuid; return uuid ? fromUuidSync(uuid) : null; }

  /** Protagonista de referencia para este usuario: el del relato, su personaje o el primero que pueda ver. */
  static focus() {
    const mine = game.user.character?.type === "protagonist" ? game.user.character : null;
    return this.protagonist() ?? mine ?? game.actors.find(a => a.type === "protagonist" && a.isOwner)
      ?? game.actors.find(a => a.type === "protagonist" && a.visible) ?? null;
  }
  static scenario() { const uuid = this.get().scenarioUuid; return uuid ? fromUuidSync(uuid) : null; }

  /* ------------------------------------------ */
  /*  Historial: reconstruir la sesión          */
  /* ------------------------------------------ */

  static history() { return this.eventDeck()?.getFlag(SYSTEM_ID, FLAGS.HISTORY) ?? []; }

  /**
   * Añade un evento estructurado: { type, card, result, text, ... }.
   * Anota automáticamente hora, protagonista y recursos en ese momento.
   */
  static async log(entry) {
    if (!game.user.isGM) return Direction.request("log", entry);
    if (entry.hidden) return Direction.privateRecord(entry);
    const deck = this.eventDeck(); if (!deck) return;
    const actor = this.protagonist();
    const event = {
      time: new Date().toISOString(),
      user: game.user.name,
      actor: actor?.name ?? "",
      spirit: actor?.system.spirit.value ?? null,
      determination: actor?.system.determination.value ?? null,
      ...entry
    };
    const history = [...this.history(), event].slice(-HISTORY_LIMIT);
    await deck.setFlag(SYSTEM_ID, FLAGS.HISTORY, history);
    return event;
  }

  static async clearHistory() { if (!game.user.isGM) return; await this.eventDeck()?.unsetFlag(SYSTEM_ID, FLAGS.HISTORY); }
}
