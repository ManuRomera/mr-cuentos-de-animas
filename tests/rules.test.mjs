/**
 * Reglas comprobadas contra el libro (Cuentos de ánimas, El Refugio de Ryhope 2019, págs. 13‑24).
 */
import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/rules.mjs";

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

test("reparto inicial: 10 puntos y mínimo 3 (pág. 14)", () => {
  assert.ok(R.validSplit(5, 5)); assert.ok(R.validSplit(3, 7)); assert.ok(R.validSplit(4, 6));
  assert.ok(!R.validSplit(2, 8)); assert.ok(!R.validSplit(5, 6)); assert.ok(!R.validSplit(5.5, 4.5));
});

test("Cartas de Evento: 4 Pistas, 4 Percances y Obstáculos 4‑7 de Entorno y de Personaje (págs. 15‑16, 88‑93)", () => {
  const cards = R.eventCards();
  assert.equal(cards.length, 16);
  const count = k => cards.filter(c => c.kind === k).length;
  assert.equal(count("clue"), 4); assert.equal(count("incident"), 4);
  assert.deepEqual(cards.filter(c => c.kind === "environment").map(c => c.value), [4, 5, 6, 7]);
  assert.deepEqual(cards.filter(c => c.kind === "character").map(c => c.value), [4, 5, 6, 7]);
  assert.equal(R.eventCards("short").length, 12);
  assert.equal(R.eventCards("shorter").length, 8);
});

test("preparación: montones de 6, 6 y 4, cada uno sobre su Dama (pág. 17)", () => {
  const grays = [1, 2, 3].map(n => ({ kind: "gray", n }));
  const deck = R.orderDeck(R.eventCards(), grays, "fixed", seq([0.3, 0.8, 0.1, 0.6]));
  assert.equal(deck.length, 19);
  assert.deepEqual(deck.map((c, i) => c.kind === "gray" ? i : -1).filter(i => i >= 0), [6, 13, 18]);
  assert.deepEqual([1, 2, 3].map(b => deck.filter(c => c.block === b).length), [7, 7, 5]);
  assert.deepEqual(R.blockSizes(12), [4, 4, 4]);
});

test("Damas impredecibles: cada Dama barajada dentro de su montón (pág. 25)", () => {
  const grays = [1, 2, 3].map(n => ({ kind: "gray", n }));
  for (let run = 0; run < 30; run++) {
    const deck = R.orderDeck(R.eventCards(), grays, "random-third");
    for (const b of [1, 2, 3]) assert.equal(deck.filter(c => c.block === b && c.kind === "gray")[0].n, b);
  }
});

test("dificultad: la impresa en la carta +1 por cada Dama en juego (pág. 23)", () => {
  assert.equal(R.difficulty(5, 0), 5);
  assert.equal(R.difficulty(5, 2), 7);
  assert.equal(R.newObstacle({ base: 6 }, 1).difficulty, 7);
});

test("+2 antes de revelar; iguala o supera y se supera (pág. 22)", () => {
  let o = R.newObstacle({ base: 7 });
  assert.ok(R.obstacleOptions(o, { determination: 1 }).spend);
  const r = R.spendBeforeReveal(o);
  assert.equal(r.cost, 1);
  o = R.reveal(r.obstacle, 5);
  assert.equal(R.total(o), 7);
  assert.equal(o.outcome, "success");
});

test("solo UN contador de Determinación por carta de obstáculo (pág. 22)", () => {
  const spent = R.reveal(R.spendBeforeReveal(R.newObstacle({ base: 9 })).obstacle, 5);
  assert.equal(spent.outcome, null);
  const opts = R.obstacleOptions(spent, { determination: 3, grayLadies: 2 });
  assert.ok(!opts.push && !opts.reroll && opts.accept, "tras gastar antes de revelar ya no se puede empujar ni repetir");
  assert.equal(R.push(spent).cost, 0);
});

test("+1 tras revelar para intentar igualar (pág. 22)", () => {
  const o = R.reveal(R.newObstacle({ base: 6 }), 5);
  assert.ok(R.obstacleOptions(o, { determination: 1 }).push);
  const p = R.push(o);
  assert.equal(p.cost, 1);
  assert.equal(p.obstacle.outcome, "success");
  const far = R.reveal(R.newObstacle({ base: 9 }), 3);
  assert.ok(R.obstacleOptions(far, { determination: 1 }).push, "se permite aunque no baste");
  assert.equal(R.accept(R.push(far).obstacle).outcome, "failure");
});

test("repetir la prueba solo con dos Damas en juego (págs. 22‑23)", () => {
  const o = R.reveal(R.newObstacle({ base: 7 }, 2), 3);
  assert.ok(!R.obstacleOptions(o, { determination: 1, grayLadies: 1 }).reroll);
  assert.ok(R.obstacleOptions(o, { determination: 1, grayLadies: 2 }).reroll);
  const again = R.reroll(o, 10);
  assert.equal(again.cost, 1);
  assert.equal(again.obstacle.outcome, "success");
});

test("sin Determinación: solo aceptar el fallo", () => {
  const o = R.reveal(R.newObstacle({ base: 6 }), 5);
  const opts = R.obstacleOptions(o, { determination: 0, grayLadies: 2 });
  assert.ok(!opts.push && !opts.reroll && opts.accept);
  assert.equal(R.accept(o).outcome, "failure");
});

test("Tabla de Espíritu‑Epílogo: la primera fila que encaja", () => {
  const rows = [{ min: 2, max: 99, text: "A" }, { min: 1, max: 99, text: "B" }, { min: 0, max: 0, text: "C" }];
  assert.equal(R.epilogueRow(rows, 5).text, "A");
  assert.equal(R.epilogueRow(rows, 1).text, "B");
  assert.equal(R.epilogueRow(rows, 0).text, "C");
  assert.equal(R.epilogueRow([], 3), null);
});

test("resumen del Guardián: recuento por montón sin identidades", () => {
  const deck = R.orderDeck(R.eventCards(), [1, 2, 3].map(n => ({ kind: "gray", n })), "fixed");
  const summary = R.blockSummary(deck.slice(7));
  assert.deepEqual(summary.map(b => b.count), [0, 7, 5]);
  assert.deepEqual(Object.keys(summary[0]).sort(), ["block", "count", "gray"]);
});
