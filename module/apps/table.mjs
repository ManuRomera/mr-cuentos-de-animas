import { ApplicationV2, DialogV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { ASSETS, SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { WithMemory } from "../memory.mjs";
import { AccessPanel } from "./access.mjs";
import { DiaryApp } from "./diary.mjs";
import { LibraryApp } from "./library.mjs";
import { TruthRegistryApp } from "./truths.mjs";
import { SafetyPanel } from "./safety.mjs";
import { GameplayService } from "../services/gameplay.mjs";
import { SessionService } from "../services/session.mjs";
import { StateService } from "../services/state.mjs";

const resource = r => Array.from({length:r?.max??0},(_,i)=>({n:i+1,on:i<(r?.value??0)}));
export class TableApp extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORY="table";
  static DEFAULT_OPTIONS={id:"cda-table",classes:["mr-cda","cda-app","cda-table-app"],window:{title:"CdA.App.Table",icon:"fa-solid fa-fire-flame-curved",resizable:true},position:{width:1180,height:820},actions:{start:TableApp.#start,draw:TableApp.#draw,resolve:TableApp.#resolve,epilogue:TableApp.#epilogue,library:TableApp.#library,diary:TableApp.#diary,truths:TableApp.#truths,access:TableApp.#access,safety:TableApp.#safety,sheet:TableApp.#sheet,memory:TableApp.#memory,reset:TableApp.#reset}};
  static PARTS={table:{template:`${TEMPLATES}/apps/table.hbs`,scrollable:[".cda-table-side"]}}; static SCROLL_MEMORY=[".cda-table-side"]; static #instance;
  static open(){return(this.#instance??=new TableApp()).render({force:true});}
  async _prepareContext(){const state=StateService.get(),scenario=StateService.scenario(),actor=StateService.protagonist();const last=state.lastCardUuid?fromUuidSync(state.lastCardUuid):null;const face=last?.currentFace??last?.faces?.[0];return{state,scenario,actor,assets:ASSETS,spirit:resource(actor?.system.spirit),determination:resource(actor?.system.determination),gray:Array.from({length:3},(_,i)=>({n:i+1,on:i<state.grayLadies,img:`systems/${SYSTEM_ID}/assets/cards/gray-${i+1}.svg`})),lastCard:last?{name:face?.name||last.name,img:face?.img||last.img,text:face?.text||""}:null,canDraw:["playing","ready"].includes(state.phase)&&!state.activeObstacle,canResolve:Boolean(state.activeObstacle),canEpilogue:["epilogue","finished"].includes(state.phase),isIdle:state.phase==="idle",modeLabel:game.i18n.localize(`CdA.Mode.${state.mode}`),memories:(scenario?.system.memories??[]).map((m,i)=>({...m,i}))};}
  async _onRender(c,o){await super._onRender(c,o);this.element.classList.toggle("cda-has-gray",StateService.get().grayLadies>0);}
  static #start(){SessionService.startWizard().then(()=>this.render());}
  static #draw(){GameplayService.drawEvent().then(()=>this.render());}
  static #resolve(){GameplayService.resolveObstacle().then(()=>this.render());}
  static #epilogue(){GameplayService.epilogue().then(()=>this.render());}
  static #library(){LibraryApp.open();} static #diary(){DiaryApp.open(StateService.protagonist());} static #truths(){TruthRegistryApp.open(StateService.protagonist());} static #access(){AccessPanel.open();} static #safety(){SafetyPanel.open();}
  static #sheet(){StateService.protagonist()?.sheet.render(true);}
  static async #memory(e,b){const scenario=StateService.scenario();const m=scenario?.system.memories?.[Number(b.dataset.index)];if(!m)return;await DialogV2.wait({window:{title:m.title||game.i18n.localize("CdA.Table.Memory"),icon:"fa-solid fa-cloud-moon"},classes:["mr-cda","cda-dialog","cda-memory-dialog"],content:`<div class="cda-memory-prompt"><blockquote>${foundry.utils.escapeHTML(m.prompt)}</blockquote>${m.followUp?`<p>${foundry.utils.escapeHTML(m.followUp)}</p>`:""}</div>`,buttons:[{action:"close",label:game.i18n.localize("CdA.Common.Close"),icon:"fa-solid fa-feather"}],rejectClose:false});}
  static async #reset(){if(!game.user.isGM)return;const ok=await DialogV2.confirm({window:{title:"CdA.Table.ResetTitle"},content:`<p>${game.i18n.localize("CdA.Table.ResetBody")}</p>`,classes:["mr-cda","cda-dialog"]});if(!ok)return;await StateService.reset();this.render();}
}
