import test from "node:test";
import assert from "node:assert/strict";
import * as R from "../module/rules.mjs";

const seq = values => { let i = 0; return () => values[i++ % values.length]; };

test("reparto inicial: 10 puntos y mínimo 3", () => {
  assert.ok(R.validSplit(5, 5));
  assert.ok(R.validSplit(3, 7));
  assert.ok(!R.validSplit(2, 8));
  assert.ok(!R.validSplit(5, 6));
  assert.ok(!R.validSplit(5.5, 4.5));
});

test("cada Dama Gris endurece la dificultad", () => {
  assert.equal(R.difficulty(5, 0), 5);
  assert.equal(R.difficulty(5, 2), 7);
  assert.equal(R.newObstacle({ base: 6 }, 1).difficulty, 7);
});

test("obstáculo: gastar antes de revelar suma +2 y se supera", () => {
  let o = R.newObstacle({ title: "Puerta", base: 7 }, 0);
  const opts = R.obstacleOptions(o, { determination: 1 });
  assert.ok(opts.spend && opts.reveal && !opts.push);
  const spent = R.spendBeforeReveal(o);
  assert.equal(spent.cost, 1);
  o = R.reveal(spent.obstacle, 5);
  assert.equal(R.total(o), 7);
  assert.equal(o.outcome, "success");
  assert.equal(R.spendBeforeReveal(o).cost, 0, "no se puede gastar dos veces ni tras revelar");
});

test("obstáculo: fallo por uno permite empujar; al empujar se supera", () => {
  let o = R.reveal(R.newObstacle({ base: 6 }), 5);
  assert.equal(o.outcome, null, "un fallo espera decisión");
  const opts = R.obstacleOptions(o, { determination: 2, grayLadies: 0 });
  assert.ok(opts.push && opts.accept && !opts.reroll);
  const pushed = R.push(o);
  assert.equal(pushed.cost, 1);
  assert.equal(pushed.obstacle.outcome, "success");
});

test("obstáculo: sin Determinación no hay empuje y aceptar es fallo", () => {
  const o = R.reveal(R.newObstacle({ base: 6 }), 5);
  assert.ok(!R.obstacleOptions(o, { determination: 0 }).push);
  assert.equal(R.accept(o).outcome, "failure");
});

test("obstáculo: si falta más de uno no se puede empujar", () => {
  const o = R.reveal(R.newObstacle({ base: 9 }), 4);
  assert.ok(!R.obstacleOptions(o, { determination: 3 }).push);
});

test("repetir la carta solo desde la segunda Dama y una vez", () => {
  const o = R.reveal(R.newObstacle({ base: 7 }, 2), 3);
  assert.ok(!R.obstacleOptions(o, { determination: 2, grayLadies: 1 }).reroll);
  assert.ok(R.obstacleOptions(o, { determination: 2, grayLadies: 2 }).reroll);
  const again = R.reroll(o, 10);
  assert.equal(again.cost, 1);
  assert.equal(again.obstacle.outcome, "success");
  const twice = R.reroll({ ...again.obstacle, outcome: null }, 10);
  assert.equal(twice.cost, 0);
});

test("epílogo según el Espíritu final", () => {
  assert.equal(R.epilogueKey(0), "zero");
  assert.equal(R.epilogueKey(1), "low");
  assert.equal(R.epilogueKey(4), "high");
});

const normal = Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, kind: "clue" }));
const grays = [1, 2, 3].map(n => ({ id: `g${n}`, kind: "gray", n }));

test("distribución clásica: tres bloques, cada Dama cierra el suyo", () => {
  const deck = R.orderDeck(normal, grays, "fixed", seq([0.1, 0.7, 0.3, 0.9, 0.5]));
  assert.equal(deck.length, 15);
  for (const b of [1, 2, 3]) {
    const block = deck.filter(c => c.block === b);
    assert.equal(block.filter(c => c.kind === "gray").length, 1);
    assert.equal(block.at(-1).id, `g${b}`);
  }
  assert.deepEqual(deck.map(c => c.block), [...deck.map(c => c.block)].sort());
});

test("Damas impredecibles: cada Dama sigue dentro de su tercio", () => {
  for (let run = 0; run < 25; run++) {
    const deck = R.orderDeck(normal, grays, "random-third");
    for (const b of [1, 2, 3]) assert.ok(deck.filter(c => c.block === b).some(c => c.id === `g${b}`));
  }
});

test("mazo pequeño: también reparte en tres bloques", () => {
  const deck = R.orderDeck(normal.slice(0, 2), grays, "fixed");
  assert.equal(deck.filter(c => c.kind === "gray").length, 3);
});

test("resumen del Guardián: recuento por bloque sin identidades", () => {
  const deck = R.orderDeck(normal, grays, "fixed");
  const summary = R.blockSummary(deck.slice(6));
  assert.equal(summary.reduce((n, b) => n + b.count, 0), 9);
  assert.deepEqual(Object.keys(summary[0]).sort(), ["block", "count", "gray"]);
  assert.equal(summary[0].count, 0);
  assert.ok(summary[2].gray);
});
