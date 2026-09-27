import { FLAGS, SOCKET, SYSTEM_ID } from "../constants.mjs";
import { CardOverlay } from "../apps/card-overlay.mjs";
import { refreshApps } from "../apps/registry.mjs";
import { cardView } from "../apps/view.mjs";
import { DeckService } from "./decks.mjs";
import { StateService } from "./state.mjs";
import { SoundService } from "./sound.mjs";

/**
 * Lo que ve y oye cada cliente cuando cambia el relato, lo haya provocado quien sea.
 * Compara con lo último que este cliente mostró; nunca escribe en el mundo.
 */
export class Presenter {
  static #seen = null;
  static #resources = new Map();
  static #refresh = foundry.utils.debounce(refreshApps, 40);

  static init() {
    this.#seen = StateService.get();
    for (const actor of game.actors.filter(a => a.type === "protagonist")) this.#onResources(actor);
    Hooks.on("updateCards", (doc, changes) => {
      const role = doc.getFlag(SYSTEM_ID, FLAGS.ROLE);
      if (!role) return;
      if (role === "event" && foundry.utils.hasProperty(changes, `flags.${SYSTEM_ID}.${FLAGS.STATE}`)) this.#onState(StateService.get());
      this.#refresh();
    });
    for (const hook of ["createCard", "deleteCard", "updateCard"]) Hooks.on(hook, card => { if (card.parent?.getFlag(SYSTEM_ID, FLAGS.ROLE)) this.#refresh(); });
    Hooks.on("updateActor", actor => { if (actor.type === "protagonist") { this.#onResources(actor); this.#refresh(); } });
    Hooks.on("updateItem", item => { if (item.type === "scenario") this.#refresh(); });
    game.socket.on(SOCKET, data => this.#onSocket(data));
    SoundService.setAmbient(this.#seen.ambient);
  }

  static #onState(state) {
    const before = this.#seen ?? {};
    this.#seen = state;
    if (state.currentCardId && state.currentCardId !== before.currentCardId) {
      SoundService.flip();
      const tableOpen = foundry.applications.instances.get("cda-table")?.rendered;
      if (!tableOpen) CardOverlay.show(cardView(DeckService.current()), { flip: true });
    }
    if (state.grayLadies > (before.grayLadies ?? 0)) SoundService.gray(state.grayLadies);
    const o = state.obstacle, p = before.obstacle;
    if (o?.value != null && (o.value !== p?.value || o.rerolled !== p?.rerolled)) SoundService.flip();
    if (o?.outcome && o.outcome !== p?.outcome) o.outcome === "success" ? SoundService.success() : SoundService.failure();
    if (state.ambient !== before.ambient) SoundService.setAmbient(state.ambient);
    if (state.phase === "finished" && before.phase !== "finished") {
      const scenario = StateService.scenario();
      const key = StateService.history().findLast(e => e.type === "epilogue")?.result;
      if (scenario && key) CardOverlay.epilogue(scenario, { key, text: scenario.system.epilogues[key] });
    }
  }

  /** Piedras y brasas suenan en todos los clientes al gastarse. */
  static #onResources(actor) {
    const now = { spirit: actor.system.spirit.value, determination: actor.system.determination.value };
    const before = this.#resources.get(actor.id);
    this.#resources.set(actor.id, now);
    if (!before || actor.uuid !== StateService.get().protagonistUuid) return;
    if (now.spirit < before.spirit) SoundService.stone();
    if (now.determination < before.determination) SoundService.ember();
    if (now.spirit > before.spirit) SoundService.crystal();
  }

  /** Avisos efímeros entre clientes: recuerdos lanzados por el Guardián. La seguridad tiene su propio canal. */
  static #onSocket(data) {
    if (data?.type === "memory") CardOverlay.memory(data.memory);
    if (data?.type === "card") CardOverlay.show(data.card);
  }

  static broadcast(data) {
    game.socket.emit(SOCKET, data);
    this.#onSocket(data);
  }
}
