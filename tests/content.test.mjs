import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../module/content/scenarios.mjs";

test("hay dos escenarios originales listos para jugar",()=>assert.equal(SCENARIOS.length,2));
for(const s of SCENARIOS){
  test(`${s.name}: estructura completa`,()=>{
    assert.equal(s.system.tension.length,3);
    assert.ok(s.system.clues.length>=4);
    assert.ok(s.system.environmentObstacles.length>=4);
    assert.ok(s.system.characterObstacles.length>=4);
    assert.ok(s.system.incidents.length>=4);
    assert.ok(s.system.memories.length>=3);
    assert.ok(s.system.epilogues.high && s.system.epilogues.low && s.system.epilogues.zero);
    for(const o of [...s.system.environmentObstacles,...s.system.characterObstacles]) assert.ok(o.difficulty>=1 && o.difficulty<=10);
  });
}
