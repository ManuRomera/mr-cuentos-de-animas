import test from "node:test";
import assert from "node:assert/strict";
import { fitToViewport } from "../module/memory.mjs";

test("una ventana más grande que la pantalla se reduce", () => {
  const p = fitToViewport({ left: 0, top: 0, width: 3000, height: 2000 }, { width: 1280, height: 720 });
  assert.ok(p.width <= 1280 - 24 && p.height <= 720 - 24);
});
test("una ventana fuera de pantalla vuelve centrada", () => {
  const p = fitToViewport({ left: 2500, top: 1400, width: 600, height: 400 }, { width: 1440, height: 900 });
  assert.equal(p.left, Math.round((1440 - 600) / 2));
  assert.ok(p.top >= 0 && p.top + 400 <= 900);
});
test("coordenadas negativas no se quedan perdidas", () => {
  const p = fitToViewport({ left: -900, top: -50, width: 500, height: 300 }, { width: 1440, height: 900 });
  assert.ok(p.left >= 0 && p.top >= 0);
});
test("una posición válida se respeta", () => {
  assert.deepEqual(fitToViewport({ left: 100, top: 80, width: 700, height: 500 }, { width: 1920, height: 1080 }), { left: 100, top: 80, width: 700, height: 500 });
});
test("límites mínimos de la clase se respetan si caben", () => {
  const p = fitToViewport({ width: 300, height: 200 }, { width: 1920, height: 1080 }, { minWidth: 900, minHeight: 600 });
  assert.equal(p.width, 900); assert.equal(p.height, 600);
});
