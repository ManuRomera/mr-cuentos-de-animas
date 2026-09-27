/**
 * Reglas de Cuentos de ánimas (Scott Malthouse; ed. El Refugio de Ryhope, 2019).
 * Módulo puro: no toca Foundry, así se prueba en Node.
 *
 *  - Mazo de Cartas de Evento: 4 Pistas, 4 Percances de Personaje, 4 Obstáculos de
 *    Entorno (4‑7) y 4 de Personaje (4‑7), más 3 Damas Grises.
 *  - Se prepara en tres montones de 6, 6 y 4 cartas; cada uno descansa sobre su Dama.
 *  - Una sola Determinación por obstáculo: +2 antes de revelar, o después +1 o
 *    repetir la carta (esto último solo con dos Damas en juego).
 *  - Fallar un obstáculo cuesta 1 de Espíritu. Cada Dama cuesta 1 de Determinación o
 *    de Espíritu y suma +1 a la dificultad. La tercera lleva al epílogo.
 */
export const RULES = Object.freeze({
  resourceTotal: 10,
  resourceMin: 3,
  resourceMax: 7,
  preRevealBonus: 2,
  pushBonus: 1,
  rerollFromGray: 2,
  grayDifficultyStep: 1,
  failureSpiritLoss: 1,
  grayLadies: 3,
  obstacleValues: [4, 5, 6, 7],
  perKind: 4
});

export const CARD_KINDS = Object.freeze({
  CLUE: "clue", ENVIRONMENT: "environment", CHARACTER: "character", INCIDENT: "incident", GRAY: "gray", NUMBER: "number"
});
export const OBSTACLE_KINDS = Object.freeze([CARD_KINDS.ENVIRONMENT, CARD_KINDS.CHARACTER]);

/** Lista del escenario de la que se elige la escena para cada tipo de carta. */
export const KIND_LIST = Object.freeze({
  clue: "clues", environment: "environmentObstacles", character: "characterObstacles", incident: "characters"
});

export function validSplit(spirit, determination) {
  return Number.isInteger(spirit) && Number.isInteger(determination)
    && spirit >= RULES.resourceMin && determination >= RULES.resourceMin
    && spirit + determination === RULES.resourceTotal;
}

export function difficulty(base, grayLadies = 0) {
  return Math.max(0, Number(base) || 0) + Math.max(0, grayLadies) * RULES.grayDifficultyStep;
}

/**
 * Cartas de Evento (sin Damas). `size`: "full" (16), "short" (−1 de cada tipo, 12) o
 * "shorter" (−2 de cada tipo, 8), como propone «Partidas más cortas».
 */
export function eventCards(size = "full") {
  const drop = { full: 0, short: 1, shorter: 2 }[size] ?? 0;
  const n = RULES.perKind - drop;
  const values = RULES.obstacleValues.slice(0, n);
  return [
    ...Array.from({ length: n }, () => ({ kind: CARD_KINDS.CLUE, value: 0 })),
    ...Array.from({ length: n }, () => ({ kind: CARD_KINDS.INCIDENT, value: 0 })),
    ...values.map(value => ({ kind: CARD_KINDS.ENVIRONMENT, value })),
    ...values.map(value => ({ kind: CARD_KINDS.CHARACTER, value }))
  ];
}

/** Tamaño de los tres montones en orden de robo: 6, 6 y 4 con el mazo completo. */
export function blockSizes(n) {
  const first = Math.floor(n * 6 / 16), second = Math.floor(n * 6 / 16);
  return [first, second, n - first - second];
}

/**
 * Orden de robo. "fixed": cada Dama cierra su montón (preparación del libro).
 * "random-third": cada Dama se baraja dentro de su montón («Partidas de duración variable»).
 */
export function orderDeck(normal, grays, variant = "fixed", random = Math.random) {
  const cards = shuffle(normal, random);
  const sizes = blockSizes(cards.length);
  let at = 0;
  return sizes.flatMap((size, i) => {
    const block = cards.slice(at, at += size);
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

export function blockSummary(remaining) {
  return [1, 2, 3].map(block => {
    const cards = remaining.filter(c => c.block === block);
    return { block, count: cards.length, gray: cards.some(c => c.kind === CARD_KINDS.GRAY) };
  });
}

/* -------------------------------------------- */
/*  Obstáculos                                  */
/* -------------------------------------------- */

export function newObstacle({ cardId = "", title = "", kind = CARD_KINDS.ENVIRONMENT, base = 0 }, grayLadies = 0) {
  return { cardId, title, kind, base: Number(base) || 0, difficulty: difficulty(base, grayLadies), preBonus: 0, value: null, bonus: 0, rerolled: false, outcome: null, spent: 0 };
}

export const total = o => (o.value ?? 0) + o.preBonus + o.bonus;

/** Opciones en cada momento. Solo un contador de Determinación por carta de obstáculo. */
export function obstacleOptions(o, { determination = 0, grayLadies = 0 } = {}) {
  if (!o || o.outcome) return { spend: false, reveal: false, push: false, reroll: false, accept: false };
  const canSpend = determination > 0 && o.spent === 0;
  if (o.value === null) return { spend: canSpend, reveal: true, push: false, reroll: false, accept: false };
  const failing = total(o) < o.difficulty;
  return {
    spend: false, reveal: false,
    push: failing && canSpend,
    reroll: failing && canSpend && grayLadies >= RULES.rerollFromGray,
    accept: failing
  };
}

export function spendBeforeReveal(o) {
  if (o.value !== null || o.spent) return { obstacle: o, cost: 0 };
  return { obstacle: { ...o, preBonus: RULES.preRevealBonus, spent: 1 }, cost: 1 };
}
export function reveal(o, value) {
  return settle({ ...o, value: Number(value) });
}
export function push(o) {
  if (o.value === null || o.spent || o.outcome) return { obstacle: o, cost: 0 };
  return { obstacle: settle({ ...o, bonus: RULES.pushBonus, spent: 1 }), cost: 1 };
}
export function reroll(o, value) {
  if (o.value === null || o.spent || o.outcome) return { obstacle: o, cost: 0 };
  return { obstacle: settle({ ...o, value: Number(value), rerolled: true, spent: 1 }), cost: 1 };
}
export function accept(o) {
  return { ...o, outcome: total(o) >= o.difficulty ? "success" : "failure" };
}
/** Un éxito se cierra solo; un fallo espera a que el jugador decida si gasta Determinación o acepta. */
function settle(o) {
  return total(o) >= o.difficulty ? { ...o, outcome: "success" } : o;
}

/* -------------------------------------------- */
/*  Epílogo                                     */
/* -------------------------------------------- */

/** Tabla de Espíritu‑Epílogo: la primera fila cuyo rango incluye el Espíritu restante. */
export function epilogueRow(rows = [], spirit = 0) {
  return rows.find(r => spirit >= (r.min ?? 0) && spirit <= (r.max ?? 99)) ?? rows.at(-1) ?? null;
}
