import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_STATE, MODES, SYSTEM_ID } from "../module/constants.mjs";
import { Direction, authorized, safeImage } from "../module/services/direction.mjs";
import { StateService } from "../module/services/state.mjs";
import { DeckService } from "../module/services/decks.mjs";
import { GameplayService } from "../module/services/gameplay.mjs";
import { Records } from "../module/services/records.mjs";

const gm = { id: "gm", name: "GM", isGM: true, active: true }, p1 = { id: "p1", name: "Narrator", isGM: false, active: true }, p2 = { id: "p2", name: "Other", isGM: false, active: true };
const collection = array => Object.assign(array, { get: id => array.find(x => x.id === id) });
let state, messages, writes, actor, card;
const clone = x => structuredClone(x);
const setup = () => {
  state = { ...clone(DEFAULT_STATE), mode: MODES.DIRECTED, phase: "playing", startedAt: 100, turn: 1, narratorId: "p1", narrationDone: false, event: { cardId: "card1", kind: "clue", value: 0, choice: null } };
  messages = collection([]); writes = [];
  actor = { uuid: "Actor.a", isOwner: true, system: { spirit: { value: 5 }, determination: { value: 5 }, diary: [], truths: [], memories: [] }, update: async changes => { writes.push(changes); for (const [k,v] of Object.entries(changes)) actor.system[k.replace("system.", "")] = v; } };
  card = { update: async changes => writes.push(changes) };
  globalThis.game = { user: gm, users: collection([gm,p1,p2]), messages, i18n: { localize: k => k }, settings: { get: () => true } };
  globalThis.foundry = { utils: { deepClone: clone, randomID: () => `r${writes.length}`, escapeHTML: s => String(s).replaceAll("<", "&lt;") } };
  globalThis.ui = { notifications: { warn: () => {}, error: () => {} } };
  globalThis.ChatMessage = { implementation: { create: async data => { const message = { ...data, id: `m${messages.length}`, author: game.user, getFlag: (ns, key) => data.flags?.[ns]?.[key], setFlag: async (ns,key,value) => { if (key === "direction.handled") data.flags[ns].direction.handled = value; } }; messages.push(message); return message; } } };
  StateService.get = () => clone(state);
  StateService.patch = async changes => { state = { ...state, ...clone(changes) }; return state; };
  StateService.protagonist = () => actor;
  StateService.scenario = () => ({ name: "Story", system: { epilogueTable: [{ min: 0, max: 99, label: "Ending", text: "secret end" }], sounds: {} } });
  StateService.log = async data => writes.push(data);
  DeckService.current = () => card;
};

test("authority: only narrator requests directed mechanics; normal choices remain public", () => {
  setup();
  assert.equal(authorized(p1,state,"reveal"), true);
  for (const action of ["choose","draw","epilogue","spend","publish","change","finish"]) assert.equal(authorized(p2,state,action),false,action);
  assert.equal(authorized(p1,state,"choose"),false);
  assert.equal(authorized(p1,{...state,mode:MODES.BONFIRE},"choose"),true);
  assert.equal(authorized(gm,state,"epilogue"),true);
});
test("scene is whispered to GM+narrator without writing text to public state, card, diary or log", async () => {
  setup();
  await Direction.deliverScene({ title:"secret title", text:"secret text", image:"art.webp", list:"clues", index:1 });
  assert.deepEqual(messages[0].whisper,["gm","p1"]);
  assert.equal(messages[0].getFlag(SYSTEM_ID,"direction").text,"secret text");
  assert.ok(!JSON.stringify(state).includes("secret"));
  assert.deepEqual(writes,[]);
  assert.deepEqual(state.event.choice,{delivered:true});
});
test("one change per scene preserves already spent resources and resolution", async () => {
  setup(); state.event.kind = "environment"; state.event.value = 5;
  await Direction.deliverScene({ title:"first",text:"a" });
  state.obstacle.spent = true; state.obstacle.value = 4; const obstacle = clone(state.obstacle);
  await Direction.change();
  assert.equal(state.changeUsed,true); assert.equal(state.event.choice,null);
  await Direction.deliverScene({ title:"replacement",text:"b" });
  assert.deepEqual(state.obstacle,obstacle);
  const deliveryId = state.deliveryId;
  await Direction.change(); assert.equal(state.deliveryId,deliveryId);
});
test("reveal publishes exactly once; finish waits for mechanics and allows next draw", async () => {
  setup(); await Direction.deliverScene({ title:"secret", text:"scene" });
  await Direction.publish();
  assert.equal(state.scenePublic,true); assert.equal(state.narrationDone,false);
  assert.equal(state.clues.length,1); assert.equal(GameplayService.canDraw(state),false);
  const n = writes.length; await Direction.publish(); assert.equal(writes.length,n);
  state.obstacle = { outcome:null }; await Direction.publish(true); assert.equal(state.narrationDone,false);
  state.obstacle.outcome = "success"; await Direction.publish(true);
  assert.equal(state.narrationDone,true); assert.equal(GameplayService.canDraw(state),true);
});
test("reassignment delivers only to new narrator, keeps previous whisper, and ignores stale actions", async () => {
  setup(); await Direction.deliverScene({title:"secret",text:"scene"});
  const before = state.deliveryId;
  await Direction.narrator("p2"); assert.equal(state.narratorId,"p2"); assert.notEqual(state.deliveryId,before);
  assert.deepEqual(messages[0].whisper,["gm","p1"]); assert.deepEqual(messages[1].whisper,["gm","p2"]);
  let count=0; Direction.engine={spend:()=>count++};
  const request = { author:p1, getFlag:()=>({type:"request",gm:"gm",session:100,turn:1,phase:"playing",deliveryId:before,action:"spend",args:{}}), setFlag:async()=>{} };
  await Direction.handle(request, request.author.id); assert.equal(count,0);
});
test("request author, phase token and handled marker prevent unrelated user and replay", async () => {
  setup(); let count=0; Direction.engine={spend:()=>count++};
  const data={type:"request",gm:"gm",session:100,turn:1,phase:"playing",deliveryId:"",action:"spend",args:{userId:"p1"}};
  const message={author:p2,getFlag:()=>data,setFlag:async()=>{data.handled=true;}};
  await Direction.handle(message, message.author.id); assert.equal(count,0);
  message.author=p1; await Direction.handle(message, message.author.id); await Direction.handle(message, message.author.id); assert.equal(count,1);
});
test("private ending never enters public diary/log until GM reveals it", async () => {
  setup(); state.phase="epilogue";
  await Direction.final("p2"); assert.deepEqual(messages[0].whisper,["gm","p2"]);
  assert.equal(state.epiloguePublic,false); assert.equal(state.publicEpilogue,null); assert.deepEqual(writes,[]);
  await Direction.final("",true); assert.equal(state.epiloguePublic,true); assert.equal(state.publicEpilogue.text,"secret end");
  assert.ok(writes.some(x=>x.type==="epilogue"));
});
test("hidden truths and unknown memories migrate to GM whispers and remain editable", async () => {
  setup(); actor.system.truths=[{id:"hidden",text:"secret",hidden:true},{id:"public",text:"visible",hidden:false}];
  actor.system.memories=[{id:"unknown",text:"secret memory",known:false}];
  await Records.secure(actor);
  assert.equal(actor.system.truths.length,1); assert.equal(actor.system.memories.length,0);
  assert.deepEqual(messages[0].whisper,["gm"]);
  assert.equal(Records.entries(actor,"truths").length,2);
  game.user=p1; assert.equal(Records.entries(actor,"truths").length,1); assert.equal(Records.entries(actor,"memories").length,0);
});
test("unsafe image schemes are excluded", () => {
  for (const url of ["javascript:alert(1)","data:text/html,test",'x\" onerror=bad']) assert.equal(safeImage(url),"");
  assert.equal(safeImage("systems/test/art.webp"),"systems/test/art.webp");
});

test("normal-mode GM choice remains immediately public in card, clue, history and diary", async () => {
  setup(); state.mode=MODES.GUARDIAN;
  await GameplayService.choose({custom:"public scene"});
  assert.equal(state.event.choice.title,"public scene");
  assert.equal(state.clues[0].title,"public scene");
  assert.ok(writes.some(x=>x[`flags.${SYSTEM_ID}.cardMeta.scene`]?.title==="public scene"));
  assert.ok(writes.some(x=>x.type==="scene"&&x.text==="public scene"));
  assert.equal(actor.system.diary[0].title,"public scene");
  assert.equal(messages.length,0);
});
test("sensitive services reject direct player calls, independently of UI", async () => {
  setup(); game.user=p2;
  assert.equal(await GameplayService.start({scenario:{type:"scenario"},actor:{type:"protagonist"}}),null);
  assert.equal(await GameplayService.end(),null);
  assert.equal(await GameplayService.toEpilogue(),null);
  assert.equal(await Direction.final("p2"),null);
  assert.equal(await Direction.send({text:"secret"},"p1"),null);
  assert.equal(await Direction.change(),null);
  assert.deepEqual(writes,[]); assert.equal(messages.length,0);
});
test("creator id mismatch rejects a forged author in request hook", async () => {
  setup(); let count=0; Direction.engine={spend:()=>count++};
  const data={type:"request",gm:"gm",session:100,turn:1,phase:"playing",deliveryId:"",action:"spend",args:{}};
  await Direction.handle({author:p1,getFlag:()=>data,setFlag:async()=>{}},p2.id);
  assert.equal(count,0);
});
test("opening the private card records one receipt without a render/update loop", async () => {
  setup(); await Direction.deliverScene({title:"scene",text:"text"});
  let reads={},count=0; p1.getFlag=()=>reads; p1.setFlag=async(ns,key,value)=>{reads=value;count++;};
  game.user=p1; await Direction.markRead(messages[0]); await Direction.markRead(messages[0]);
  assert.equal(count,1); assert.equal(Direction.status(messages[0]),"read");
});
