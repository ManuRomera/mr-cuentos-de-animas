import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const es=JSON.parse(await readFile(new URL("../lang/es.json",import.meta.url),"utf8"));
const en=JSON.parse(await readFile(new URL("../lang/en.json",import.meta.url),"utf8"));
test("ES y EN exponen las mismas claves de interfaz",()=>assert.deepEqual(Object.keys(en).sort(),Object.keys(es).sort()));
test("las traducciones principales existen",()=>{for(const k of ["CdA.App.Table","CdA.Table.Spirit","CdA.Table.Determination","CdA.Safety.X","CdA.Scenario.Art"]) assert.ok(es[k]&&en[k],k);});
