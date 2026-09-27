import { ASSETS, RULES, TEMPLATES } from "../constants.mjs";
import { reducedMotion, reducedEffects } from "../settings.mjs";
import { DeckService } from "../services/decks.mjs";
import { GameplayService as Game } from "../services/gameplay.mjs";
import { StateService } from "../services/state.mjs";
import { SoundService } from "../services/sound.mjs";
import { cardView, resource, roman } from "./view.mjs";
import { CardOverlay } from "./card-overlay.mjs";
import { openApp } from "./registry.mjs";
import { SystemApp } from "./base.mjs";

/**
 * Mesa de Ánimas: la mesa física vista desde arriba. Nunca se abre sola.
 * Se pinta a partir del estado compartido; las animaciones se deciden
 * comparando lo que ya se mostró con lo que hay ahora, en cada cliente.
 */
export class TableApp extends SystemApp {
  static MEMORY = "table";
  static SIZE_LIMITS = { minWidth: 900, minHeight: 600 };
  static DEFAULT_OPTIONS = {
    id: "cda-table",
    classes: ["cda-table-app"],
    window: { title: "CdA.App.Table", icon: "fa-solid fa-fire-flame-curved", resizable: true },
    position: { width: 1320, height: 820 },
    actions: {
      draw: TableApp.#draw, zoom: TableApp.#zoom, spend: () => Game.spend(), reveal: () => Game.reveal(),
      push: () => Game.push(), reroll: () => Game.reroll(), accept: () => Game.accept(),
      payGray: TableApp.#payGray, epilogue: TableApp.#epilogue, open: TableApp.#open
    }
  };
  static PARTS = { table: { template: `${TEMPLATES}/apps/table.hbs` } };

  static LIVE = true;

  /** Primera apertura: ocupa el hueco entre los controles de escena y la barra lateral, sin taparlas. */
  static initialPosition({ width, height }) {
    const w = Math.round(Math.min(1320, Math.max(900, width - 420)));
    const h = Math.round(Math.min(840, Math.max(600, height - 150)));
    return { width: w, height: h, left: Math.max(70, Math.round((width - 330 - w) / 2) + 50), top: Math.max(10, Math.round((height - h) / 2) - 20) };
  }
  #shown = { card: null, number: null, gray: null };

  async _prepareContext() {
    const state = StateService.get();
    const actor = StateService.protagonist();
    const scenario = StateService.scenario();
    const current = DeckService.current();
    const obstacle = state.obstacle;
    const options = obstacle ? Game.options(state) : {};
    const discard = DeckService.discard().filter(c => c.id !== state.currentCardId);
    const remaining = DeckService.remaining().length;
    const scene = scenario?.system.scenes?.[state.scene];
    const gm = game.user.isGM;
    const epilogueKey = ["epilogue", "finished"].includes(state.phase) ? Game.epilogueKey() : null;
    return {
      gm, state, assets: ASSETS,
      phase: game.i18n.localize(`CdA.Phase.${state.phase}`),
      mode: game.i18n.localize(`CdA.Mode.${state.mode}`),
      idle: state.phase === "idle",
      scenario: scenario ? { name: scenario.name, hook: scenario.system.hook, cover: scenario.system.cover || scenario.img } : null,
      scene: scene ? { title: scene.title, text: scene.text } : null,
      actor: actor ? { name: actor.name, img: actor.img, profession: actor.system.profession, canEdit: actor.isOwner } : null,
      spirit: resource(actor, "spirit"),
      determination: resource(actor, "determination"),
      grays: [1, 2, 3].map(n => ({ n, roman: roman(n), on: n <= state.grayLadies, img: ASSETS.gray[n - 1], pending: n === state.pendingGray })),
      deck: { count: remaining, canDraw: Game.canDraw(state) && remaining > 0, empty: !remaining && !state.idle },
      discard: { count: discard.length, top: cardView(discard.at(-1)) },
      card: cardView(current),
      obstacle: obstacle ? {
        ...obstacle, options, total: (obstacle.value ?? 0) + obstacle.preBonus + obstacle.bonus,
        revealed: obstacle.value !== null, grayBonus: obstacle.difficulty - obstacle.base,
        bonus: obstacle.preBonus + obstacle.bonus, success: obstacle.outcome === "success", failure: obstacle.outcome === "failure",
        numberArt: ASSETS.numberArt, numberBack: ASSETS.numberBack, pushBonus: RULES.pushBonus, preBonus: RULES.preRevealBonus
      } : null,
      pendingGray: state.pendingGray ? { roman: roman(state.pendingGray), canSpend: (actor?.system.determination.value ?? 0) > 0, canLose: (actor?.system.spirit.value ?? 0) > 0 } : null,
      epilogue: epilogueKey ? {
        ready: state.phase === "epilogue", finished: state.phase === "finished",
        label: game.i18n.localize(`CdA.Epilogue.${epilogueKey}`),
        text: state.phase === "finished" ? scenario?.system.epilogues[epilogueKey] : ""
      } : null,
      effects: !reducedEffects(),
      motes: reducedEffects() ? [] : Array.from({ length: 14 }, (_, i) => ({ x: (i * 37) % 96 + 2, d: 9 + (i % 5) * 3, delay: -i * 1.7 }))
    };
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const root = this.element;
    const { state, spirit, determination } = context;
    root.dataset.gray = state.grayLadies;
    root.dataset.phase = state.phase;
    root.classList.toggle("cda-spirit-low", Boolean(context.actor) && spirit.value <= 1);
    root.classList.toggle("cda-determination-low", Boolean(context.actor) && determination.value === 0);

    // Primera pintura: lo que ya estaba sobre la mesa aparece sin animación.
    const first = this.#shown.card === null;
    const numberKey = state.obstacle?.value != null ? `${state.obstacle.cardId}:${state.obstacle.value}:${state.obstacle.rerolled}` : "";
    if (!first && state.currentCardId && state.currentCardId !== this.#shown.card) this.#animateDraw();
    if (!first && numberKey && numberKey !== this.#shown.number) this.#animateNumber();
    if (!first && state.grayLadies > (this.#shown.gray ?? 0)) this.#animateGray(state.grayLadies);
    this.#shown = { card: state.currentCardId, number: numberKey, gray: state.grayLadies };
  }

  /** La carta sale del mazo, viaja, gira y se asienta. Sin movimiento: aparece con un fundido corto. */
  #animateDraw() {
    const card = this.element.querySelector(".cda-slot-current .cda-card");
    const deck = this.element.querySelector(".cda-deck .cda-card-stack");
    if (!card) return;
    if (reducedMotion() || !deck) { card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
    const a = deck.getBoundingClientRect(), b = card.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const s = a.width / b.width;
    card.animate([
      // Sin filter ni opacity: aplanarían el 3D y se vería la cara al revés durante el giro.
      { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotateY(180deg)` },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 30}px) scale(${(s + 1) / 2 + 0.05}) rotateY(180deg)`, offset: 0.45 },
      { transform: "translate(0, -12px) scale(1.04) rotateY(90deg)", offset: 0.72 },
      { transform: "none" }
    ], { duration: 720, easing: "cubic-bezier(.22,.7,.2,1)" });
  }

  #animateNumber() {
    const el = this.element.querySelector(".cda-number-card");
    if (!el) return;
    if (reducedMotion()) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
    el.animate([
      { transform: "translateY(-40px) rotateY(180deg)" },
      { transform: "translateY(-8px) rotateY(90deg)", offset: 0.55 },
      { transform: "none" }
    ], { duration: 520, easing: "cubic-bezier(.22,.7,.2,1)" });
  }

  #animateGray(n) {
    const el = this.element.querySelector(`.cda-gray-slot[data-n="${n}"]`);
    if (!el || reducedMotion()) return;
    el.animate([{ opacity: 0, filter: "blur(8px) brightness(2)" }, { opacity: 1, filter: "none" }], { duration: 1400, easing: "ease-out" });
    this.element.querySelector(".cda-table")?.animate(
      [{ transform: "none" }, { transform: "translateX(-1.5px)" }, { transform: "translateX(1.5px)" }, { transform: "none" }],
      { duration: 260, iterations: 2 });
  }

  /* ------------------------------------------ */

  static async #draw() {
    const card = await Game.draw();
    if (card) SoundService.draw();
  }
  static #zoom() {
    const card = DeckService.current();
    if (card) CardOverlay.show(cardView(card));
  }
  static #payGray(event, target) { return Game.payGray(target.dataset.resource); }
  /** El texto final lo muestra el presentador en todos los clientes a la vez. */
  static #epilogue() { return Game.epilogue(); }
  static #open(event, target) { openApp(target.dataset.app); }
}
