import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../module/content/scenarios.mjs";
import { FLAGS, LINK_TYPES, MEMORY_KINDS, MODES, SCENARIO_TAGS, SYSTEM_ID } from "../module/constants.mjs";

test("dos escenarios originales con semilla única", () => {
  assert.equal(SCENARIOS.length, 2);
  const seeds = SCENARIOS.map(s => s.flags[SYSTEM_ID][FLAGS.SEED]);
  assert.equal(new Set(seeds).size, seeds.length);
});

for (const s of SCENARIOS) {
  test(`${s.name}: listo para jugar`, () => {
    const x = s.system;
    assert.equal(s.type, "scenario");
    assert.equal(x.tension.length, 3, "tres Damas Grises");
    assert.ok(x.clues.length >= 4 && x.environmentObstacles.length >= 4 && x.characterObstacles.length >= 3 && x.incidents.length >= 3);
    assert.ok(x.memories.length >= 3 && x.scenes.length >= 5);
    for (const k of ["high", "low", "zero"]) assert.ok(x.epilogues[k]?.length > 20, `epílogo ${k}`);
    for (const o of [...x.environmentObstacles, ...x.characterObstacles]) assert.ok(o.difficulty >= 1 && o.difficulty <= 10, o.title);
    for (const m of x.memories) { assert.ok(MEMORY_KINDS.includes(m.kind), m.title); assert.ok(LINK_TYPES.includes(m.link.type)); }
    for (const t of x.tags) assert.ok(SCENARIO_TAGS.includes(t), t);
    for (const m of x.modes) assert.ok(Object.values(MODES).includes(m), m);
    assert.ok(x.recommendedSpirit + x.recommendedDetermination === 10);
  });
}

test("La voz que dejaste atrás: 1+1, siete escenas y la primera cinta", () => {
  const voice = SCENARIOS.find(s => s.flags[SYSTEM_ID][FLAGS.SEED] === "voice");
  assert.ok(voice.system.modes.includes("guardian"));
  assert.equal(voice.system.scenes.length, 7);
  assert.match(voice.system.introduction, /Si estás escuchando esto es porque al final has venido/);
  assert.doesNotMatch(JSON.stringify(voice), /muerto todo el tiempo/i);
});

test("La casa que respira: corta y apta para aprender", () => {
  const house = SCENARIOS.find(s => s.flags[SYSTEM_ID][FLAGS.SEED] === "house");
  assert.match(house.system.duration, /45/);
  assert.ok(house.system.modes.includes("bonfire"));
});
