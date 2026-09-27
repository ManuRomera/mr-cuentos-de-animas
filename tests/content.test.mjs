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
    assert.ok(x.epilogueTable.some(r => r.min === 0) && x.epilogueTable.every(r => r.text.length > 20), "tabla de epílogo");
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

/* -------------------------------------------- */
/*  Colección incluida y formato de importación  */
/* -------------------------------------------- */

import { readFileSync } from "node:fs";
import { FORMAT, TEMPLATE, normalizeScenario, problems, unpack } from "../module/content/format.mjs";

const read = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const index = read("content/collection/index.json");
const collection = index.files.flatMap(f => unpack(read(`content/collection/${f}`)).map(s => ({ file: f, s })));

test("la colección trae los 34 escenarios de distribución libre", () => {
  assert.equal(collection.length, 34);
  const ids = collection.map(c => c.s.id);
  assert.equal(new Set(ids).size, ids.length, "ids únicos");
});

for (const { file, s } of collection) {
  test(`colección · ${s.name}: jugable y con procedencia`, () => {
    const data = normalizeScenario(s);
    assert.deepEqual(problems(data), []);
    assert.ok(data.system.author, "autoría");
    assert.ok(data.system.source.collection && data.system.source.license, "procedencia y licencia");
    assert.ok(data.system.tags.length, "etiquetas");
    for (const row of data.system.epilogueTable) assert.ok(row.min <= row.max, `${row.label}: rango`);
  });
}

test("el libro básico NO va en el repositorio público", () => {
  const names = collection.map(c => c.s.name);
  for (const n of ["La bestia en el páramo", "El río perdido", "Scriptorium", "Miliciana", "Lazos familiares"]) assert.ok(!names.includes(n), n);
});

test("formato: la plantilla es válida y los errores se explican", () => {
  assert.equal(TEMPLATE.format, FORMAT);
  assert.deepEqual(problems(normalizeScenario(TEMPLATE.scenarios[0])), []);
  const bad = problems(normalizeScenario({ name: "", synopsis: "", tension: ["uno"] }));
  assert.ok(bad.some(p => p.includes("name")) && bad.some(p => p.includes("tension")) && bad.some(p => p.includes("epilogues")));
});

test("formato: acepta texto plano, cadenas y el formato antiguo", () => {
  const d = normalizeScenario({
    name: "X", synopsis: "Uno.\n\nDos <b>tres</b>.", clues: ["a"], environmentObstacles: [{ title: "b" }], characterObstacles: ["c"],
    characters: ["Ana"], tension: ["1", "2", "3"], epilogues: { high: "alto", low: "bajo", zero: "cero" }
  });
  assert.equal(d.system.synopsis, "<p>Uno.</p><p>Dos &lt;b&gt;tres&lt;/b&gt;.</p>");
  assert.equal(d.system.clues[0].title, "a");
  assert.equal(d.system.characters[0].name, "Ana");
  assert.deepEqual(d.system.epilogueTable.map(r => [r.min, r.max]), [[2, 99], [1, 1], [0, 0]]);
  assert.equal(unpack({ scenario: { name: "Y" } }).length, 1);
  assert.equal(unpack([{}, {}]).length, 2);
});
