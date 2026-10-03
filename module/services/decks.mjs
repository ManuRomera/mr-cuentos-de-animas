import { ASSETS, CARD_KINDS, DEFAULT_STATE, FLAGS, SYSTEM_ID } from "../constants.mjs";
import { blockSummary, eventCards, orderDeck, shuffle } from "../rules.mjs";
import { StateService } from "./state.mjs";

/**
 * Mazos sobre documentos Cards de Foundry: almacenamiento, barajado, robo y
 * sincronización los pone Foundry; la presentación es toda del sistema.
 */
const ROLES = {
  event: { type: "deck", name: "CdA.Deck.Event" },
  eventReveal: { type: "pile", name: "CdA.Deck.EventDiscard" },
  number: { type: "deck", name: "CdA.Deck.Number" },
  numberReveal: { type: "pile", name: "CdA.Deck.NumberDiscard" }
};
const QUIET = { chatNotification: false };
const cardsClass = () => globalThis.Cards?.implementation ?? globalThis.Cards;
const bySort = (a, b) => a.sort - b.sort;

export class DeckService {
  static stack(role) { return game.cards?.find(c => c.getFlag(SYSTEM_ID, FLAGS.ROLE) === role) ?? null; }
  static meta(card) { return card?.getFlag(SYSTEM_ID, FLAGS.CARD) ?? {}; }

  static async ensureStacks() {
    if (!game.user.isGM) return;
    for (const [role, { type, name }] of Object.entries(ROLES)) {
      if (this.stack(role)) continue;
      await cardsClass().create({
        name: game.i18n.localize(name), type, img: ASSETS.cardBack,
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        flags: { [SYSTEM_ID]: { [FLAGS.ROLE]: role, ...(role === "event" ? { [FLAGS.STATE]: foundry.utils.deepClone(DEFAULT_STATE) } : {}) } }
      });
    }
    await this.ensureNumberDeck();
  }

  static async #clear(role) {
    const stack = this.stack(role);
    const ids = stack?.cards.map(c => c.id) ?? [];
    if (ids.length) await stack.deleteEmbeddedDocuments("Card", ids);
  }

  /* ------------------------------------------ */
  /*  Cartas numéricas                          */
  /* ------------------------------------------ */

  static async ensureNumberDeck(force = false) {
    const deck = this.stack("number"); if (!deck) return;
    const valid = deck.cards.size === 10 && deck.cards.contents.every(c => this.meta(c).kind === CARD_KINDS.NUMBER && c.faces[0]?.img === ASSETS.numberArt);
    if (valid && !force) return;
    await this.#clear("numberReveal"); await this.#clear("number");
    const cards = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return {
        name: String(n), type: "base", value: n, sort: n,
        faces: [{ name: String(n), img: ASSETS.numberArt, text: "" }], back: { img: ASSETS.numberBack }, face: null,
        flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind: CARD_KINDS.NUMBER, value: n } } }
      };
    });
    await deck.createEmbeddedDocuments("Card", cards);
    await deck.shuffle(QUIET);
  }

  static async drawNumber() {
    const deck = this.stack("number"), pile = this.stack("numberReveal");
    if (!deck || !pile) return null;
    if (!deck.availableCards.length) { await deck.recall(QUIET); await deck.shuffle(QUIET); }
    const [card] = await pile.draw(deck, 1, { how: CONST.CARD_DRAW_MODES.FIRST, updateData: { face: 0 }, ...QUIET });
    return card ? { card, value: Number(this.meta(card).value ?? card.value) } : null;
  }

  /* ------------------------------------------ */
  /*  Mazo de Ánimas                            */
  /* ------------------------------------------ */

  /** Carta de Evento genérica, como las del libro: tipo y, en los obstáculos, dificultad impresa (4‑7). */
  static cardData(kind, value = 0, back = ASSETS.cardBack) {
    const label = game.i18n.localize(`CdA.Kind.${kind}`);
    const name = value ? `${label} · ${value}` : label;
    return {
      name, type: "base", value: value || null, faces: [{ name, img: ASSETS.kinds[kind] ?? ASSETS.cardBack, text: "" }],
      back: { img: back }, face: null,
      flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind, value: Number(value) || 0 } } }
    };
  }

  static grayData(index, back = ASSETS.cardBack) {
    const name = `${game.i18n.localize("CdA.Kind.gray")} ${["I", "II", "III"][index - 1]}`;
    return {
      name, type: "base", faces: [{ name, img: ASSETS.gray[index - 1], text: "" }], back: { img: back }, face: null,
      flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind: CARD_KINDS.GRAY, grayIndex: index } } }
    };
  }

  /** Prepara el Mazo de Ánimas: 6, 6 y 4 cartas, cada montón sobre su Dama Gris. */
  static async buildEventDeck(scenario, { variant = "fixed", size = "full" } = {}) {
    const deck = this.stack("event"), pile = this.stack("eventReveal");
    if (!deck || !pile) throw new Error("Mazos no inicializados.");
    const back = scenario?.system.customBack || ASSETS.cardBack;
    const normal = eventCards(size).map(c => this.cardData(c.kind, c.value, back));
    const grays = [1, 2, 3].map(i => this.grayData(i, back));
    const ordered = orderDeck(normal, grays, variant).map(({ block, ...card }, i) => {
      card.sort = (i + 1) * 10;
      card.flags[SYSTEM_ID][FLAGS.CARD].block = block;
      return card;
    });
    await this.#clear("eventReveal"); await this.#clear("event");
    await deck.createEmbeddedDocuments("Card", ordered);
    return deck;
  }

  /** Cartas por robar, en orden. Solo para lógica y para el Guardián: nunca se muestra su identidad al jugador. */
  static remaining() { return (this.stack("event")?.availableCards ?? []).sort(bySort); }
  static blocks() { return blockSummary(this.remaining().map(c => ({ block: this.meta(c).block, kind: this.meta(c).kind }))); }
  static discard() { return (this.stack("eventReveal")?.cards.contents ?? []).sort(bySort); }
  static current() { const id = StateService.get().currentCardId; return id ? this.stack("eventReveal")?.cards.get(id) ?? null : null; }

  static async drawEvent() {
    const deck = this.stack("event"), pile = this.stack("eventReveal");
    if (!deck?.availableCards.length || !pile) return null;
    const [card] = await pile.draw(deck, 1, { how: CONST.CARD_DRAW_MODES.FIRST, updateData: { face: 0 }, ...QUIET });
    return card ?? null;
  }

  /**
   * Insertar una carta en el mazo (Guardián).
   * where: "next" (será la siguiente), "block" (al azar dentro del bloque en curso) o "bottom".
   */
  static async insert(data, where = "next") {
    const deck = this.stack("event"); if (!deck) return null;
    const remaining = this.remaining();
    const sorts = remaining.map(c => c.sort);
    let sort, block = this.meta(remaining[0]).block ?? 3;
    if (!sorts.length || where === "bottom") { sort = (Math.max(0, ...deck.cards.map(c => c.sort)) + 10); block = this.meta(remaining.at(-1)).block ?? 3; }
    else if (where === "next") sort = sorts[0] - 1;
    else {
      const inBlock = remaining.filter(c => this.meta(c).block === block);
      const i = Math.floor(Math.random() * inBlock.length);
      sort = inBlock[i].sort - 1;
    }
    data.sort = sort;
    data.flags[SYSTEM_ID][FLAGS.CARD].block = block;
    const [card] = await deck.createEmbeddedDocuments("Card", [data]);
    return card;
  }

  /** Adelanta la siguiente Dama Gris pendiente a la cima del mazo. */
  static async advanceGray() {
    const remaining = this.remaining();
    const gray = remaining.find(c => this.meta(c).kind === CARD_KINDS.GRAY);
    if (!gray) return null;
    await gray.update({ sort: remaining[0].sort - 1 });
    return gray;
  }

  /** Vuelve a barajar lo que queda dentro de cada bloque, sin mover las Damas de su tercio. */
  static async reshuffleBlocks(variant = "fixed") {
    const remaining = this.remaining();
    if (!remaining.length) return;
    const sorts = remaining.map(c => c.sort);
    const byBlock = [1, 2, 3].map(b => remaining.filter(c => (this.meta(c).block ?? 3) === b));
    const ordered = byBlock.flatMap(cards => {
      const isGray = c => this.meta(c).kind === CARD_KINDS.GRAY;
      const ids = [...shuffle(cards.filter(c => !isGray(c))), ...cards.filter(isGray)].map(c => c.id);
      return variant === "random-third" ? shuffle(ids) : ids;
    });
    await this.stack("event").updateEmbeddedDocuments("Card", ordered.map((_id, i) => ({ _id, sort: sorts[i] })));
  }
}
