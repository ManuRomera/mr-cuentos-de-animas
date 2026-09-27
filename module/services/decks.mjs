import { ASSETS, CARD_KINDS, DEFAULT_STATE, FLAGS, PATH, SYSTEM_ID } from "../constants.mjs";
import { StateService } from "./state.mjs";

const ROLE_NAMES = { event: "Mazo de Ánimas", eventReveal: "Carta revelada", number: "Cartas numéricas", numberReveal: "Número revelado" };
const CARD_ASSET = {
  [CARD_KINDS.CLUE]: `${PATH}/assets/cards/clue.svg`,
  [CARD_KINDS.ENVIRONMENT]: `${PATH}/assets/cards/environment.svg`,
  [CARD_KINDS.CHARACTER]: `${PATH}/assets/cards/character.svg`,
  [CARD_KINDS.INCIDENT]: `${PATH}/assets/cards/incident.svg`
};
const shuffle = input => { const a = [...input]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cardsImpl = () => globalThis.Cards?.implementation ?? globalThis.Cards;

export class DeckService {
  static stack(role) { return game.cards?.find(c => c.getFlag(SYSTEM_ID, "role") === role) ?? null; }
  static async ensureStacks() {
    if (!game.user.isGM) return;
    for (const [role, name] of Object.entries(ROLE_NAMES)) {
      if (this.stack(role)) continue;
      const type = role.endsWith("Reveal") ? "pile" : "deck";
      const doc = await cardsImpl().create({ name: `CdA · ${name}`, type, ownership: { default: 3 } });
      await doc.setFlag(SYSTEM_ID, "role", role);
      await doc.setFlag(SYSTEM_ID, FLAGS.GENERATED, true);
      if (role === "event") await doc.setFlag(SYSTEM_ID, FLAGS.STATE, foundry.utils.deepClone(DEFAULT_STATE));
    }
    await this.ensureNumberDeck();
  }
  static async #clear(role) {
    const stack = this.stack(role); if (!stack) return;
    const ids = stack.cards?.map(c => c.id) ?? [];
    if (ids.length) await stack.deleteEmbeddedDocuments("Card", ids);
  }
  static async ensureNumberDeck(force = false) {
    const deck = this.stack("number"); if (!deck) return;
    if (!force && deck.cards?.size === 10) return;
    await deck.reset?.({ chatNotification: false });
    await this.#clear("numberReveal"); await this.#clear("number");
    const cards = Array.from({ length: 10 }, (_, i) => {
      const n = i + 1;
      return { name: `Carta ${n}`, type: "base", value: n, faces: [{ name: `${n}`, img: `${PATH}/assets/cards/number-${n}.svg`, text: `${n}` }], back: { img: ASSETS.numberBack }, face: null, sort: n * 1000, flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind: "number", value: n } } } };
    });
    await deck.createEmbeddedDocuments("Card", cards); await deck.shuffle({ chatNotification: false });
  }
  static #normalCards(scenario) {
    const s = scenario.system;
    const map = (list, kind) => (list ?? []).map((x, i) => ({
      name: x.title || `${kind} ${i + 1}`, type: "base", value: x.difficulty || null,
      faces: [{ name: x.title, img: x.image || CARD_ASSET[kind], text: x.text }], back: { img: s.customBack || ASSETS.cardBack }, face: null,
      flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind, difficulty: x.difficulty || 0, text: x.text, title: x.title } } }
    }));
    return [
      ...map(s.clues, CARD_KINDS.CLUE), ...map(s.environmentObstacles, CARD_KINDS.ENVIRONMENT),
      ...map(s.characterObstacles, CARD_KINDS.CHARACTER), ...map(s.incidents, CARD_KINDS.INCIDENT)
    ];
  }
  static #grayCard(scenario, index) {
    const entry = scenario.system.tension[index - 1] ?? { title: `Dama Gris ${index}`, text: "La tensión aumenta." };
    return {
      name: entry.title, type: "base", faces: [{ name: entry.title, img: `${PATH}/assets/cards/gray-${index}.svg`, text: entry.text }], back: { img: scenario.system.customBack || ASSETS.cardBack }, face: null,
      flags: { [SYSTEM_ID]: { [FLAGS.CARD]: { kind: CARD_KINDS.GRAY, grayIndex: index, text: entry.text, title: entry.title } } }
    };
  }
  static async buildEventDeck(scenario, { variant = "fixed" } = {}) {
    const deck = this.stack("event"); if (!deck) throw new Error("Mazos no inicializados.");
    await deck.reset?.({ chatNotification: false }); await this.#clear("eventReveal"); await this.#clear("event");
    const normal = shuffle(this.#normalCards(scenario));
    const thirds = [[], [], []]; normal.forEach((card, i) => thirds[Math.min(2, Math.floor(i * 3 / Math.max(1, normal.length)))].push(card));
    const ordered = [];
    for (let i = 0; i < 3; i++) {
      if (variant === "random-third") ordered.push(...shuffle([...thirds[i], this.#grayCard(scenario, i + 1)]));
      else ordered.push(...thirds[i], this.#grayCard(scenario, i + 1));
    }
    ordered.forEach((c, i) => c.sort = (i + 1) * 1000);
    await deck.createEmbeddedDocuments("Card", ordered);
    await StateService.reset({ scenarioUuid: scenario.uuid, phase: "ready" });
    return deck;
  }
  static async drawEvent() {
    const deck = this.stack("event"), pile = this.stack("eventReveal"); if (!deck || !pile) return null;
    if (!deck.availableCards.length) return null;
    const drawn = await pile.draw(deck, 1, { how: CONST.CARD_DRAW_MODES.TOP, updateData: { face: 0 } });
    return drawn?.[0] ?? null;
  }
  static async drawNumber() {
    let deck = this.stack("number"), pile = this.stack("numberReveal"); if (!deck || !pile) return null;
    if (!deck.availableCards.length) { await deck.reset({ chatNotification: false }); await this.#clear("numberReveal"); await deck.shuffle({ chatNotification: false }); }
    const drawn = await pile.draw(deck, 1, { how: CONST.CARD_DRAW_MODES.TOP, updateData: { face: 0 } });
    return drawn?.[0] ?? null;
  }
  static meta(card) { return card?.getFlag(SYSTEM_ID, FLAGS.CARD) ?? {}; }
}
