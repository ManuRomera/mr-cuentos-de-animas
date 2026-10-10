/**
 * Seguridad de arranque: lo que provocó la «pantalla negra» no puede volver.
 *  - la Mesa no se abre sola;
 *  - ninguna ventana nace más grande que una pantalla corriente;
 *  - el CSS no toca la interfaz de Foundry;
 *  - las capas a pantalla completa son solo las efímeras y se pueden cerrar;
 *  - cada fase de arranque está aislada.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const read = p => readFileSync(join(root, p), "utf8");
const walk = dir => readdirSync(join(root, dir)).flatMap(n => {
  const p = join(dir, n);
  return statSync(join(root, p)).isDirectory() ? walk(p) : [p];
});
const code = ["mr-cuentos-de-animas.mjs", ...walk("module").filter(p => p.endsWith(".mjs"))];
const entry = read("mr-cuentos-de-animas.mjs");

test("la Mesa solo se abre al entrar si el usuario lo pidió", () => {
  const settings = read("module/settings.mjs");
  assert.match(settings, /register\(SYSTEM_ID, "openOnStart", \{[^}]*scope: "client"[^}]*default: false/s);
  assert.doesNotMatch(settings, /"mesaOculta", \{[^}]*default: true/s, "ocultar la Mesa no puede venir activado de serie");
  for (const file of code) assert.doesNotMatch(read(file), /autoOpen/, `${file} usa el ajuste antiguo autoOpen`);
  const ready = entry.slice(entry.indexOf('Hooks.once("ready"'), entry.indexOf("async function ensureScene"));
  const opens = ready.split("\n").filter(l => /openApp\("table"\)|TableApp\.(open|restore)/.test(l));
  assert.equal(opens.length, 1);
  assert.match(opens[0], /openOnStart/);
});

test("la escena de bienvenida no abre ninguna ventana", () => {
  const fn = entry.slice(entry.indexOf("async function ensureScene"), entry.indexOf("async function migrate"));
  assert.doesNotMatch(fn, /openApp|\.render\(|\.open\(/);
  assert.match(fn, /sceneReady/, "solo una vez por mundo");
  assert.match(fn, /onlyCoreDefault/, "no sustituye escenas del usuario");
});

test("cada fase del arranque está aislada en bootPhase", () => {
  const init = entry.slice(entry.indexOf('Hooks.once("init"'), entry.indexOf('Hooks.once("ready"'));
  const body = init.split("\n").slice(1, -2).filter(l => /^\s{2}\S/.test(l));
  for (const line of body) assert.match(line, /^\s{2}(bootPhase|console\.info|\}\);)/, line);
  for (const hook of ["getSceneControlButtons", "renderActorDirectory", "renderItemDirectory", "renderSettings"]) {
    const start = entry.indexOf(`Hooks.on("${hook}"`);
    assert.ok(start > 0, hook);
    assert.match(entry.slice(start, start + 200), /try \{/, `${hook} sin try`);
  }
});

test("ninguna ventana nace más grande que 1400×900", () => {
  for (const file of code) {
    for (const m of read(file).matchAll(/position:\s*\{\s*width:\s*(\d+|"auto")\s*,\s*height:\s*(\d+|"auto")/g)) {
      if (m[1] !== '"auto"') assert.ok(Number(m[1]) <= 1400, `${file}: ancho ${m[1]}`);
      if (m[2] !== '"auto"') assert.ok(Number(m[2]) <= 900, `${file}: alto ${m[2]}`);
    }
    // Solo la Mesa va sin marco, y solo porque se oculta con su ojo, la pastilla, Mayús+M y el control de escena.
    if (file !== "module/apps/table.mjs") assert.doesNotMatch(read(file), /frame:\s*false/, `${file}: ventana sin marco (no se podría cerrar)`);
  }
  const table = read("module/apps/table.mjs");
  assert.match(table, /frame: false/);
  assert.match(table, /hide: \(\) => set\("mesaOculta", true\), show: \(\) => set\("mesaOculta", false\)/);
  assert.match(table, /cda-pastilla/);
  assert.match(read("templates/apps/table.hbs"), /data-action="hide"/);
  assert.match(entry, /TableApp\.toggle\(\)/);
  const welcome = read("module/apps/welcome.mjs").match(/width:\s*(\d+)/);
  assert.ok(Number(welcome[1]) <= 520, "el aviso de bienvenida debe ser pequeño");
});

/* -------------------------------------------- */
/*  CSS                                         */
/* -------------------------------------------- */

function rules(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0, buf = "", stack = [];
  for (const ch of clean) {
    if (ch === "{") {
      const sel = buf.trim(); buf = "";
      stack.push(sel);
      depth++;
    } else if (ch === "}") {
      const sel = stack.pop();
      if (sel && !sel.startsWith("@")) out.push({ selector: sel, body: buf, parents: [...stack] });
      buf = "";
      depth--;
    } else buf += ch;
  }
  return out;
}
const css = ["styles/system.css", "styles/accessibility.css"].map(read).join("\n");
const allRules = rules(css).filter(r => !r.parents.some(p => p.startsWith("@keyframes")));

test("todo selector está limitado al sistema", () => {
  const bad = [];
  for (const { selector } of allRules) {
    for (const s of selector.split(",").map(x => x.trim())) {
      if (s === ":root") continue;
      const scoped = /\.mr-cda\b/.test(s) || /^\.cda-[a-z-]+(\s|$|\.|:)/.test(s) || /^\.cda-[a-z-]+$/.test(s);
      if (!scoped) bad.push(s);
    }
  }
  assert.deepEqual(bad, []);
});

test("sin reglas destructivas sobre la interfaz de Foundry", () => {
  const bad = [];
  for (const { selector, body } of allRules) {
    if (/(^|[\s,>])(html|body|#board|#ui-left|#ui-right|#ui-top|#ui-bottom|#interface|#sidebar|#scene-controls|#hotbar|#players|#navigation|canvas)\b/.test(selector)) bad.push(selector);
    if (/^\s*\*|,\s*\*\s*\{/.test(selector)) bad.push(selector);
    if (/display:\s*none/.test(body) && !/\.mr-cda|\.cda-/.test(selector)) bad.push(selector);
  }
  assert.deepEqual(bad, []);
});

test("solo las capas efímeras y la Mesa (ocultable) ocupan la pantalla", () => {
  const allowed = [".mr-cda.cda-overlay", ".mr-cda.cda-safety-signal", ".cda-help", ".mr-cda.cda-table-app"];
  const fixed = allRules.filter(r => /position:\s*fixed/.test(r.body)).map(r => r.selector);
  for (const s of fixed) assert.ok(allowed.some(a => s.startsWith(a)), `position: fixed en ${s}`);
  // y existen sus cierres: botón, Escape y clic fuera
  const overlay = read("module/apps/card-overlay.mjs");
  assert.match(overlay, /Escape/); assert.match(overlay, /cda-overlay-scrim/); assert.match(overlay, /cda-overlay-close/);
  const safety = read("module/apps/safety.mjs");
  assert.match(safety, /safety-clear/);
  // la capa de la Mesa deja pasar el ratón y se puede ocultar con la pastilla de vuelta
  const layer = allRules.find(r => r.selector === ".mr-cda.cda-table-app");
  assert.match(layer.body, /pointer-events:\s*none/);
  assert.ok(allRules.some(r => r.selector === ".mr-cda.cda-mesa-oculta .cda-table" && /display:\s*none/.test(r.body)));
  assert.ok(allRules.some(r => r.selector === ".mr-cda.cda-mesa-oculta .cda-pastilla"));
  assert.doesNotMatch(layer.body, /transform|backdrop-filter/);
});

test("las ventanas del sistema tienen tope de tamaño en CSS", () => {
  const app = allRules.find(r => r.selector === ".application.mr-cda");
  assert.match(app.body, /max-width:\s*calc\(100vw/);
  assert.match(app.body, /max-height:\s*calc\(100vh/);
});

test("se respeta prefers-reduced-motion", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(read("module/settings.mjs"), /prefers-reduced-motion/);
});

test("los estilos de botón no tocan los controles de cabecera de Foundry (sus iconos)", () => {
  for (const { selector, body } of allRules) {
    for (const s of selector.split(",").map(x => x.trim())) {
      if (!/\bbutton(?![.\w-])/.test(s) || /header-control|window-content|\.cda-/.test(s)) continue;
      if (/font|background|border|padding|height/.test(body)) assert.fail(`«${s}» alcanzaría los botones de cabecera`);
    }
  }
});

test("nadie escribe en el Proxy position de ApplicationV2 (un 0 lanza TypeError)", () => {
  for (const file of code) {
    assert.doesNotMatch(read(file), /Object\.assign\(this\.position|this\.position\.\w+\s*=[^=]/, `${file} escribe en this.position`);
  }
});
