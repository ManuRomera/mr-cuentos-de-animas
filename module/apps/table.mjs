import { ASSETS, CARD_KINDS, MODES, RULES, TEMPLATES } from "../constants.mjs";
import { enrich } from "../compat.mjs";
import { reducedMotion, reducedEffects } from "../settings.mjs";
import { DeckService } from "../services/decks.mjs";
import { GameplayService as Game } from "../services/gameplay.mjs";
import { StateService } from "../services/state.mjs";
import { SoundService } from "../services/sound.mjs";
import { backArt, cardView, classicSkin, eventArt, numberArt, numberBackArt, resource, roman } from "./view.mjs";
import { CardOverlay } from "./card-overlay.mjs";
import { openApp } from "./registry.mjs";
import { SystemApp } from "./base.mjs";

const PROMPTS = { clue: "CdA.Choose.clue", environment: "CdA.Choose.environment", character: "CdA.Choose.character", incident: "CdA.Choose.incident" };

/**
 * Mesa de Ánimas: la mesa física vista desde arriba. Nunca se abre sola.
 * Izquierda, los recursos; centro, mazo, carta y escena; derecha, el relato
 * (sinopsis, pistas halladas y tensión) siempre a mano para releer.
 */
export class TableApp extends SystemApp {
  static MEMORY = "table";
  static SIZE_LIMITS = { minWidth: 960, minHeight: 620 };
  static DEFAULT_OPTIONS = {
    id: "cda-table",
    classes: ["cda-table-app"],
    window: { title: "CdA.App.Table", icon: "fa-solid fa-fire-flame-curved", resizable: true },
    position: { width: 1320, height: 840 },
    actions: {
      draw: TableApp.#draw, zoom: TableApp.#zoom, zoomClue: TableApp.#zoomClue, choose: TableApp.#choose, custom: TableApp.#custom,
      spend: () => Game.spend(), reveal: () => Game.reveal(), push: () => Game.push(), reroll: () => Game.reroll(), accept: () => Game.accept(),
      payGray: TableApp.#payGray, epilogue: () => Game.epilogue(), open: TableApp.#open, story: TableApp.#story
    }
  };
  static PARTS = { table: { template: `${TEMPLATES}/apps/table.hbs`, scrollable: [".cda-story-scroll", ".cda-choice-list"] } };
  static SCROLL_MEMORY = [".cda-story-scroll"];
  static LIVE = true;

  /** Primera apertura: ocupa el hueco entre los controles de escena y la barra lateral, sin taparlas. */
  static initialPosition({ width, height }) {
    const w = Math.round(Math.min(1360, Math.max(960, width - 400)));
    const h = Math.round(Math.min(860, Math.max(620, height - 120)));
    return { width: w, height: h, left: Math.max(60, Math.round((width - 330 - w) / 2) + 50), top: Math.max(8, Math.round((height - h) / 2) - 20) };
  }

  #shown = { card: null, number: null, gray: null };

  async _prepareContext() {
    const state = StateService.get();
    const actor = StateService.protagonist();
    const scenario = StateService.scenario();
    const current = DeckService.current();
    const event = state.event;
    const obstacle = state.obstacle;
    const discard = DeckService.discard().filter(c => c.id !== state.currentCardId);
    const remaining = DeckService.remaining().length;
    const scene = scenario?.system.scenes?.[state.scene];
    const finishing = ["epilogue", "finished"].includes(state.phase);
    const epilogueRow = finishing ? Game.epilogueRow(scenario, actor) : null;
    const players = game.users.filter(u => u.active && !u.isGM);
    const narrator = state.mode === MODES.BONFIRE && players.length && state.turn ? players[(state.turn - 1) % players.length] : null;
    const classic = classicSkin();
    return {
      gm: game.user.isGM, state, assets: ASSETS, classic,
      phase: game.i18n.localize(`CdA.Phase.${state.phase}`),
      mode: game.i18n.localize(`CdA.Mode.${state.mode}`),
      idle: state.phase === "idle",
      narrator: narrator?.name ?? "",
      storyOpen: this.sectionOpen("story", true),
      scenario: scenario ? {
        name: scenario.name, hook: scenario.system.hook,
        synopsis: await enrich(scenario.system.synopsis, scenario),
        introduction: scenario.system.introduction ? await enrich(scenario.system.introduction, scenario) : ""
      } : null,
      scene: scene ? { title: scene.title, text: scene.text } : null,
      clues: state.clues.map((c, i) => ({ ...c, i, n: i + 1 })),
      tension: state.tension.map((text, i) => ({ text, roman: roman(i + 1) })).filter(x => x.text),
      actor: actor ? { name: actor.name, img: actor.img, profession: actor.system.profession } : null,
      spirit: resource(actor, "spirit"),
      determination: resource(actor, "determination"),
      grays: [1, 2, 3].map(n => ({ n, roman: roman(n), on: n <= state.grayLadies, img: eventArt(CARD_KINDS.GRAY, n, classic), pending: n === state.pendingGray })),
      deck: { count: remaining, canDraw: Game.canDraw(state) && remaining > 0, back: backArt(scenario?.system.customBack, classic) },
      discard: { count: discard.length, top: cardView(discard.at(-1)) },
      card: cardView(current, { customBack: scenario?.system.customBack }),
      choosing: event && !event.choice ? {
        label: game.i18n.localize(`CdA.Kind.${event.kind}`), value: event.value,
        prompt: game.i18n.localize(PROMPTS[event.kind] ?? "CdA.Choose.clue"),
        entries: Game.choices(state)
      } : null,
      obstacle: obstacle ? {
        ...obstacle, options: Game.options(state), total: (obstacle.value ?? 0) + obstacle.preBonus + obstacle.bonus,
        revealed: obstacle.value !== null, grayBonus: obstacle.difficulty - obstacle.base,
        bonus: obstacle.preBonus + obstacle.bonus, success: obstacle.outcome === "success", failure: obstacle.outcome === "failure",
        numberArt: numberArt(obstacle.value, classic), numberBack: numberBackArt(classic),
        pushBonus: RULES.pushBonus, preBonus: RULES.preRevealBonus
      } : null,
      pendingGray: state.pendingGray ? {
        roman: roman(state.pendingGray),
        canSpend: (actor?.system.determination.value ?? 0) > 0, canLose: (actor?.system.spirit.value ?? 0) > 0,
        free: !((actor?.system.determination.value ?? 0) > 0 || (actor?.system.spirit.value ?? 0) > 0)
      } : null,
      epilogue: finishing ? {
        ready: state.phase === "epilogue", finished: state.phase === "finished",
        label: epilogueRow?.label ?? "", text: state.phase === "finished" ? epilogueRow?.text ?? "" : ""
      } : null,
      motes: reducedEffects() ? [] : Array.from({ length: 12 }, (_, i) => ({ x: (i * 37) % 96 + 2, d: 9 + (i % 5) * 3, delay: -i * 1.7 }))
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
    root.classList.toggle("cda-skin-classic", context.classic);
    const custom = root.querySelector(".cda-choice-custom input");
    custom?.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); root.querySelector("[data-action=custom]")?.click(); } });

    const first = this.#shown.card === null;
    const numberKey = state.obstacle?.value != null ? `${state.obstacle.cardId}:${state.obstacle.value}:${state.obstacle.rerolled}` : "";
    if (!first && state.currentCardId && state.currentCardId !== this.#shown.card) this.#animateDraw();
    if (!first && numberKey && numberKey !== this.#shown.number) this.#animateNumber();
    if (!first && state.grayLadies > (this.#shown.gray ?? 0)) this.#animateGray(state.grayLadies);
    this.#shown = { card: state.currentCardId, number: numberKey, gray: state.grayLadies };
  }

  /** La carta sale del mazo, viaja, gira y se asienta. Sin filter ni opacity: aplanarían el 3D. */
  #animateDraw() {
    const card = this.element.querySelector(".cda-slot-current .cda-card");
    const deck = this.element.querySelector(".cda-deck .cda-card-stack");
    if (!card) return;
    if (reducedMotion() || !deck) { card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); return; }
    const a = deck.getBoundingClientRect(), b = card.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    const s = a.width / b.width;
    card.animate([
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
    if (card) CardOverlay.show(cardView(card, { customBack: StateService.scenario()?.system.customBack }));
  }
  static #zoomClue(event, target) {
    const clue = StateService.get().clues[Number(target.dataset.index)];
    if (clue) CardOverlay.memory({ title: clue.title, prompt: clue.text || "", followUp: "", kicker: game.i18n.localize("CdA.Kind.clue") });
  }
  static #choose(event, target) { return Game.choose({ list: target.dataset.list, index: Number(target.dataset.index) }); }
  static #custom(event, target) {
    const input = target.closest(".cda-choice-custom")?.querySelector("input");
    if (input?.value.trim()) return Game.choose({ custom: input.value });
  }
  static #payGray(event, target) { return Game.payGray(target.dataset.resource); }
  static #open(event, target) { openApp(target.dataset.app); }
  /** Plegar o desplegar la columna del relato; se recuerda por usuario y mundo. */
  static #story() {
    this.setSection("story", !this.sectionOpen("story", true));
    this.render();
  }
}
