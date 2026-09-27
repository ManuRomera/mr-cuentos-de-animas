import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { TEMPLATES } from "../constants.mjs";
import { WithMemory } from "../memory.mjs";
import { DiaryService } from "../services/diary.mjs";
export class DiaryApp extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS={id:"cda-diary",classes:["mr-cda","cda-app","cda-diary"],window:{title:"CdA.App.Diary",icon:"fa-solid fa-book-open",resizable:true},position:{width:720,height:760},actions:{add:DiaryApp.#add,remove:DiaryApp.#remove,export:DiaryApp.#export}};
  static PARTS={body:{template:`${TEMPLATES}/apps/diary.hbs`,scrollable:[".cda-diary-list"]}}; static SCROLL_MEMORY=[".cda-diary-list"]; static #instance;
  constructor(actor,options={}){super({...options,memory:`diary.${actor?.uuid??"none"}`});this.actor=actor;}
  static open(actor){if(!actor)return;this.#instance?.close();this.#instance=new DiaryApp(actor);return this.#instance.render({force:true});}
  async _prepareContext(){return{actor:this.actor,entries:(this.actor?.system.diary??[]).map((x,i)=>({...x,i,date:x.createdAt?new Date(x.createdAt).toLocaleString():""}))};}
  async _onRender(c,o){await super._onRender(c,o);for(const area of this.element.querySelectorAll("textarea[data-entry]")){area.addEventListener("change",async()=>{const diary=foundry.utils.deepClone(this.actor.system.diary);diary[Number(area.dataset.entry)].text=area.value;await this.actor.update({"system.diary":diary});});}}
  static async #add(){const diary=foundry.utils.deepClone(this.actor.system.diary);diary.push({title:game.i18n.localize("CdA.Diary.NewEntry"),text:"",kind:"note",createdAt:Date.now()});await this.actor.update({"system.diary":diary});this.render();}
  static async #remove(e,b){const diary=foundry.utils.deepClone(this.actor.system.diary);diary.splice(Number(b.dataset.index),1);await this.actor.update({"system.diary":diary});this.render();}
  static #export(){DiaryService.download(this.actor);}
}
