/**
 * Reglas del relato. Módulo puro: no toca Foundry, así se prueba en Node.
 * Si tu edición del libro usa otros valores, cámbialos aquí y en ningún otro sitio.
 */
export const RULES = Object.freeze({
  resourceTotal: 10,          // Espíritu + Determinación al crear el protagonista
  resourceMin: 3,             // mínimo en cada recurso
  resourceMax: 7,             // máximo en cada recurso al repartir (10 − 3)
  preRevealBonus: 2,          // gastar 1 Determinación antes de revelar
  pushBonus: 1,               // gastar 1 Determinación tras revelar, si basta para superar
  rerollFromGray: 2,          // desde esta Dama Gris se puede repetir la carta pagando Determinación
  grayDifficultyStep: 1,      // cada Dama Gris revelada endurece la dificultad
  failureSpiritLoss: 1,       // Espíritu perdido al fallar un obstáculo
  grayLadies: 3               // la tercera abre el epílogo
});

export const CARD_KINDS = Object.freeze({
  CLUE: "clue", ENVIRONMENT: "environment", CHARACTER: "character", INCIDENT: "incident", GRAY: "gray", NUMBER: "number"
});
export const OBSTACLE_KINDS = Object.freeze([CARD_KINDS.ENVIRONMENT, CARD_KINDS.CHARACTER]);

/** Reparto inicial válido: suma exacta y mínimos. */
export function validSplit(spirit, determination) {
  return Number.isInteger(spirit) && Number.isInteger(determination)
    && spirit >= RULES.resourceMin && determination >= RULES.resourceMin
    && spirit + determination === RULES.resourceTotal;
}

/** Dificultad real de un obstáculo según las Damas Grises ya reveladas. */
export function difficulty(base, grayLadies = 0) {
  return Math.max(0, Number(base) || 0) + Math.max(0, grayLadies) * RULES.grayDifficultyStep;
}

/** Obstáculo recién robado, antes de revelar ninguna carta numérica. */
export function newObstacle({ cardId = "", title = "", kind = CARD_KINDS.ENVIRONMENT, base = 0 }, grayLadies = 0) {
  return { cardId, title, kind, base: Number(base) || 0, difficulty: difficulty(base, grayLadies), preBonus: 0, value: null, bonus: 0, rerolled: false, outcome: null, spent: 0 };
}

export const total = o => (o.value ?? 0) + o.preBonus + o.bonus;

/** Opciones disponibles en cada momento de la resolución. */
export function obstacleOptions(o, { determination = 0, grayLadies = 0 } = {}) {
  if (!o || o.outcome) return { spend: false, reveal: false, push: false, reroll: false, accept: false };
  if (o.value === null) return { spend: determination > 0 && o.preBonus === 0, reveal: true, push: false, reroll: false, accept: false };
  const short = o.difficulty - total(o);
  return {
    spend: false, reveal: false,
    push: short > 0 && short <= RULES.pushBonus && o.bonus === 0 && determination > 0,
    reroll: short > 0 && !o.rerolled && grayLadies >= RULES.rerollFromGray && determination > 0,
    accept: short > 0
  };
}

/** Transiciones. Devuelven un obstáculo nuevo y lo que hay que cobrar; no mutan. */
export function spendBeforeReveal(o) {
  if (o.value !== null || o.preBonus) return { obstacle: o, cost: 0 };
  return { obstacle: { ...o, preBonus: RULES.preRevealBonus, spent: o.spent + 1 }, cost: 1 };
}
export function reveal(o, value) {
  const next = { ...o, value: Number(value) };
  return settle(next);
}
export function push(o) {
  if (o.value === null || o.bonus || o.outcome) return { obstacle: o, cost: 0 };
  return { obstacle: settle({ ...o, bonus: RULES.pushBonus, spent: o.spent + 1 }), cost: 1 };
}
export function reroll(o, value) {
  if (o.value === null || o.rerolled || o.outcome) return { obstacle: o, cost: 0 };
  return { obstacle: settle({ ...o, value: Number(value), bonus: 0, rerolled: true, spent: o.spent + 1 }), cost: 1 };
}
export function accept(o) {
  return { ...o, outcome: total(o) >= o.difficulty ? "success" : "failure" };
}
/** Un éxito se resuelve solo; un fallo espera a que el jugador decida si empuja o acepta. */
function settle(o) {
  return total(o) >= o.difficulty ? { ...o, outcome: "success" } : o;
}

/** Qué epílogo corresponde a los recursos finales. */
export function epilogueKey(spirit) {
  if (spirit <= 0) return "zero";
  if (spirit <= 1) return "low";
  return "high";
}

/**
 * Orden del Mazo de Ánimas.
 *  - "fixed" (distribución clásica): tres bloques, la Dama cierra cada bloque.
 *  - "random-third" (Damas impredecibles): cada Dama se baraja dentro de su tercio.
 * Devuelve las cartas en orden de robo con `block` (1‑3) anotado.
 */
export function orderDeck(normal, grays, variant = "fixed", random = Math.random) {
  const cards = shuffle(normal, random);
  const blocks = [[], [], []];
  cards.forEach((card, i) => blocks[Math.min(2, Math.floor(i * 3 / Math.max(1, cards.length)))].push(card));
  return blocks.flatMap((block, i) => {
    const withGray = grays[i] ? [...block, grays[i]] : block;
    const ordered = variant === "random-third" ? shuffle(withGray, random) : withGray;
    return ordered.map(card => ({ ...card, block: i + 1 }));
  });
}

export function shuffle(list, random = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Resumen del mazo para el Guardián: cuántas quedan por bloque y si la Dama sigue dentro, sin identidades. */
export function blockSummary(remaining) {
  return [1, 2, 3].map(block => {
    const cards = remaining.filter(c => c.block === block);
    return { block, count: cards.length, gray: cards.some(c => c.kind === CARD_KINDS.GRAY) };
  });
}
