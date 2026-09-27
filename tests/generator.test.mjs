import test from "node:test";
import assert from "node:assert/strict";
import { creationProblems, generateProtagonist, NAMES, PROFESSIONS, ROLL } from "../module/generator.mjs";
import { validSplit } from "../module/rules.mjs";

/** Generador determinista para las pruebas (mulberry32). */
const seeded = seed => () => {
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

test("todo protagonista generado cumple la creación del libro", () => {
  const rng = seeded(7);
  for (let i = 0; i < 500; i++) {
    const p = generateProtagonist(rng);
    assert.deepEqual(creationProblems(p), [], p.name);
    assert.ok(validSplit(p.system.spirit.max, p.system.determination.max));
    assert.equal(p.system.spirit.value, p.system.spirit.max);
    assert.equal(p.system.traits.length, 4);
  }
});

test("la profesión concuerda con el nombre", () => {
  const rng = seeded(3);
  const fem = new Set(PROFESSIONS.map(p => p[1])), masc = new Set(PROFESSIONS.map(p => p[0]));
  for (let i = 0; i < 300; i++) {
    const p = generateProtagonist(rng);
    const f = NAMES.f.includes(p.name.split(" ")[0]);
    assert.ok((f ? fem : masc).has(p.system.profession), `${p.name} · ${p.system.profession}`);
  }
  assert.ok(fem.has(ROLL.profession(rng, "Carmen Soto")));
});

test("hay mucha variedad", () => {
  const rng = seeded(11);
  const all = Array.from({ length: 200 }, () => generateProtagonist(rng));
  for (const key of ["name", "description", "backstory"]) {
    const values = new Set(all.map(p => key === "name" ? p.name : p.system[key]));
    assert.ok(values.size > 190, `${key}: ${values.size}`);
  }
  assert.ok(new Set(all.map(p => p.system.profession)).size > 50);
  assert.equal(new Set(all.map(p => p.system.spirit.max)).size, 5);
});

test("creationProblems señala lo que incumple las reglas", () => {
  const bad = { name: "Ana", system: { profession: "x", origin: "", description: "x", backstory: "x",
    traits: [{ label: "a" }], spirit: { max: 8 }, determination: { max: 2 } } };
  assert.deepEqual(creationProblems(bad), ["origin", "traits", "split"]);
});
