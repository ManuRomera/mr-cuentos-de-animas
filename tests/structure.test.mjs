/**
 * Estructura: todo lo que Foundry necesita encontrar existe y encaja.
 * La v1.0.2 se quedaba en negro porque un módulo importaba un nombre que no
 * existía: aquí se comprueba cada import contra los exports reales.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { ASSETS, PATH, SCENARIO_TAGS, TRUTH_STATUS, MEMORY_KINDS, LINK_TYPES, MODES } from "../module/constants.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = p => readFileSync(join(root, p), "utf8");
const walk = dir => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const manifest = JSON.parse(read("system.json"));
const modules = ["mr-cuentos-de-animas.mjs", ...walk("module").filter(p => p.endsWith(".mjs"))];
const templates = walk("templates").filter(p => p.endsWith(".hbs"));

test("system.json: id, versión y compatibilidad v13–v14", () => {
  assert.equal(manifest.id, "mr-cuentos-de-animas");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.version, JSON.parse(read("package.json")).version);
  assert.equal(manifest.compatibility.minimum, "13");
  assert.ok(Number(manifest.compatibility.maximum ?? 14) >= 14);
  assert.equal(manifest.manifest, "https://github.com/ManuRomera/mr-cuentos-de-animas/releases/latest/download/system.json");
  assert.equal(manifest.download, "https://github.com/ManuRomera/mr-cuentos-de-animas/releases/latest/download/mr-cuentos-de-animas.zip");
  assert.deepEqual(Object.keys(manifest.documentTypes.Actor), ["protagonist"]);
  assert.deepEqual(Object.keys(manifest.documentTypes.Item), ["scenario"]);
});

test("system.json: módulos, estilos e idiomas existen", () => {
  for (const p of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(l => l.path)]) assert.ok(existsSync(join(root, p)), p);
  for (const m of manifest.media) assert.ok(existsSync(join(root, m.url.replace(`${PATH}/`, ""))), m.url);
  assert.ok(existsSync(join(root, manifest.background.replace(`${PATH}/`, ""))));
});

test("CHANGELOG documenta la versión actual", () => {
  assert.match(read("CHANGELOG.md"), new RegExp(`^## \\[?${manifest.version.replace(/\./g, "\\.")}`, "m"));
});

/* -------------------------------------------- */
/*  Imports ↔ exports                           */
/* -------------------------------------------- */

function exportsOf(file) {
  const src = read(file);
  const names = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z0-9_$]+)/g)) names.add(m[1]);
  for (const m of src.matchAll(/export\s*\{([^}]*)\}(?:\s*from\s*["']([^"']+)["'])?/g)) {
    for (const part of m[1].split(",").map(s => s.trim()).filter(Boolean)) names.add(part.split(/\s+as\s+/).pop().trim());
  }
  if (/export\s+default/.test(src)) names.add("default");
  return names;
}

test("cada import nombrado existe en el módulo de destino", () => {
  const problems = [];
  for (const file of modules) {
    const src = read(file);
    for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
      const target = relative(root, resolve(dirname(join(root, file)), m[2]));
      if (!existsSync(join(root, target))) { problems.push(`${file}: no existe ${m[2]}`); continue; }
      const available = exportsOf(target);
      for (const part of m[1].split(",").map(s => s.trim()).filter(Boolean)) {
        const name = part.split(/\s+as\s+/)[0].trim();
        if (!available.has(name)) problems.push(`${file}: «${name}» no se exporta desde ${target}`);
      }
    }
    for (const m of src.matchAll(/(?:import|export)\s+(?:\*\s+as\s+\w+|\w+)?\s*(?:from\s*)?["'](\.[^"']+)["']/g)) {
      if (!existsSync(resolve(dirname(join(root, file)), m[1]))) problems.push(`${file}: no existe ${m[1]}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("los módulos puros se cargan fuera de Foundry", async () => {
  for (const p of ["../module/rules.mjs", "../module/constants.mjs", "../module/memory.mjs", "../module/content/scenarios.mjs"]) await import(p);
});

/* -------------------------------------------- */
/*  Plantillas y rutas                          */
/* -------------------------------------------- */

test("toda plantilla referenciada existe y toda plantilla se precarga", () => {
  const entry = read("mr-cuentos-de-animas.mjs");
  const referenced = new Set();
  for (const file of [...modules, ...templates]) {
    for (const m of read(file).matchAll(/(?:TEMPLATES\}|templates)\/((?:apps|sheets|partials)\/[a-z-]+\.hbs)/g)) referenced.add(m[1]);
  }
  for (const t of referenced) assert.ok(existsSync(join(root, "templates", t)), t);
  for (const t of templates) assert.ok(entry.includes(t.replace("templates/", "")), `sin precargar: ${t}`);
});

test("toda ruta de arte usada existe (sin .svg sustituidos por .webp inexistentes)", () => {
  const flat = o => typeof o === "string" ? [o] : Object.values(o).flatMap(flat);
  const paths = new Set(flat(ASSETS));
  for (const file of [...modules, ...templates, ...walk("styles"), "system.json"]) {
    for (const m of read(file).matchAll(/systems\/mr-cuentos-de-animas\/(assets\/[A-Za-z0-9_./-]+\.(?:webp|png|jpg|svg|ogg|mp3))/g)) paths.add(`${PATH}/${m[1]}`);
  }
  const missing = [...paths].filter(p => !existsSync(join(root, p.replace(`${PATH}/`, ""))));
  assert.deepEqual(missing, []);
});

test("el arte es WebP (salvo el icono vectorial) y pesa lo razonable", () => {
  for (const file of walk("assets")) {
    if (file.endsWith(".svg")) continue;
    assert.ok(file.endsWith(".webp"), file);
    assert.ok(statSync(join(root, file)).size < 900_000, `${file} demasiado pesado`);
  }
});

/* -------------------------------------------- */
/*  Idiomas                                     */
/* -------------------------------------------- */

const lang = code => JSON.parse(read(`lang/${code}.json`));
const flatten = (o, prefix = "") => Object.entries(o).flatMap(([k, v]) => typeof v === "object" ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]);
const es = new Map(flatten(lang("es"))), en = new Map(flatten(lang("en")));
const has = (map, key) => map.has(key) || [...map.keys()].some(k => k.startsWith(`${key}.`));

test("español e inglés tienen exactamente las mismas claves", () => {
  assert.deepEqual([...es.keys()].filter(k => !en.has(k)), []);
  assert.deepEqual([...en.keys()].filter(k => !es.has(k)), []);
  for (const [k, v] of es) assert.ok(String(v).trim(), `vacía: ${k}`);
});

test("toda clave literal usada en código y plantillas existe", () => {
  const missing = new Set();
  for (const file of [...modules, ...templates]) {
    for (const m of read(file).matchAll(/["'`](CdA\.[A-Za-z0-9_.-]+)(?=["'`])/g)) {
      if (!has(es, m[1]) || !has(en, m[1])) missing.add(`${file}: ${m[1]}`);
    }
  }
  assert.deepEqual([...missing], []);
});

test("claves dinámicas: modos, fases, estados, tipos, ambientes, ayudas", () => {
  const need = [];
  for (const m of Object.values(MODES)) need.push(`CdA.Mode.${m}`, `CdA.Mode.${m}Hint`);
  for (const p of ["idle", "playing", "epilogue", "finished"]) need.push(`CdA.Phase.${p}`);
  for (const k of ["clue", "environment", "character", "incident", "gray", "number"]) need.push(`CdA.Kind.${k}`, `CdA.Help.card-${k === "number" ? "clue" : k}.Title`);
  for (const s of ["all", ...TRUTH_STATUS]) need.push(`CdA.Truth.Status.${s}`);
  for (const k of MEMORY_KINDS) need.push(`CdA.Memory.Kind.${k}`);
  for (const l of LINK_TYPES) need.push(`CdA.Link.${l || "none"}`);
  for (const t of SCENARIO_TAGS) need.push(`CdA.Tag.${t}`);
  for (const a of ["none", "fire", "rain", "wind", "house", "forest", "coast", "storm", "tape", "silence"]) need.push(`CdA.Ambient.${a}`);
  for (const e of ["high", "low", "zero"]) need.push(`CdA.Epilogue.${e}`, `CdA.Epilogue.${e}Hint`);
  for (const h of ["start", "end", "card", "obstacle", "gray", "epilogue", "phase", "truth", "truth-status", "memory", "adjust", "gm", "scene", "note", "clue"]) need.push(`CdA.History.${h}`);
  const helps = new Set();
  for (const file of templates) for (const m of read(file).matchAll(/data-help="([a-z-]+)"/g)) helps.add(m[1]);
  for (const h of helps) need.push(`CdA.Help.${h}.Title`, `CdA.Help.${h}.Short`);
  const missing = need.filter(k => !es.has(k) || !en.has(k));
  assert.deepEqual(missing, []);
});

test("los modelos no usan nombres reservados de DataModel", () => {
  const models = read("module/models.mjs");
  for (const name of ["parent", "schema", "invalid", "_source", "validationFailures"]) {
    assert.doesNotMatch(models, new RegExp(`^\\s+${name}:`, "m"), `campo reservado «${name}»`);
  }
});

test("las colecciones de Foundry no se tratan como arrays", () => {
  for (const file of modules) {
    assert.doesNotMatch(read(file), /\.(cards|items|actors|scenes)\.(every|forEach|flatMap)\(/, `${file}: usa .contents antes de métodos de array`);
  }
});

test("las variables CSS con imágenes usan rutas absolutas (cdaUrl/cssUrl)", () => {
  for (const file of [...modules, ...templates]) {
    assert.doesNotMatch(read(file), /--[a-z-]+:\s*url\(['"]?(\{\{|\$\{)/, `${file}: url() relativa en variable CSS`);
  }
});
