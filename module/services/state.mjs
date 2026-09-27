import { DEFAULT_STATE, FLAGS, SYSTEM_ID } from "../constants.mjs";
export class StateService {
  static eventDeck() { return game.cards?.find(c => c.getFlag(SYSTEM_ID, "role") === "event") ?? null; }
  static get() { return foundry.utils.mergeObject(foundry.utils.deepClone(DEFAULT_STATE), this.eventDeck()?.getFlag(SYSTEM_ID, FLAGS.STATE) ?? {}, { inplace: false }); }
  static async patch(changes) {
    const deck = this.eventDeck(); if (!deck) throw new Error("No existe el Mazo de Ánimas.");
    const next = foundry.utils.mergeObject(this.get(), changes, { inplace: false });
    await deck.setFlag(SYSTEM_ID, FLAGS.STATE, next); Hooks.callAll("mrCdaState", next); return next;
  }
  static async reset(patch = {}) { return this.patch({ ...foundry.utils.deepClone(DEFAULT_STATE), ...patch }); }
  static protagonist() { const uuid = this.get().protagonistUuid; return uuid ? fromUuidSync(uuid) : null; }
  static scenario() { const uuid = this.get().scenarioUuid; return uuid ? fromUuidSync(uuid) : null; }
}
