import { ApplicationV2, DialogV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { TEMPLATES } from "../constants.mjs";
import { WithMemory } from "../memory.mjs";
export class TruthRegistryApp extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static DEFAULT_OPTIONS={id:"cda-truths",classes:["mr-cda","cda-app","cda-truths"],window:{title:"CdA.App.Truths",icon:"fa-solid fa-eye",resizable:true},position:{width:680,height:650},actions:{add:TruthRegistryApp.#add,status:TruthRegistryApp.#status,remove:TruthRegistryApp.#remove}};
  static PARTS={body:{template:`${TEMPLATES}/apps/truths.hbs`,scrollable:[".cda-truth-list"]}}; static #instance;
  constructor(actor,options={}){super({...options,memory:`truths.${actor?.uuid??"none"}`});this.actor=actor;}
  static open(actor){if(!actor)return;this.#instance?.close();this.#instance=new TruthRegistryApp(actor);return this.#instance.render({force:true});}
  async _prepareContext(){return{actor:this.actor,truths:(this.actor?.system.truths??[]).map((x,i)=>({...x,i,established:x.status==="established",questioned:x.status==="questioned",contradicted:x.status==="contradicted"}))};}
  static async #add(){const r=await DialogV2.wait({window:{title:"CdA.Truth.DialogTitle"},classes:["mr-cda","cda-dialog"],content:`<form><label>${game.i18n.localize("CdA.Truth.Statement")}<textarea name="text" rows="4"></textarea></label><label>${game.i18n.localize("CdA.Truth.Source")}<input name="source" placeholder="${game.i18n.localize("CdA.Truth.SourcePlaceholder")}"></label></form>`,buttons:[{action:"ok",label:game.i18n.localize("CdA.Truth.Register"),icon:"fa-solid fa-eye",default:true,callback:(e,b)=>Object.fromEntries(new FormData(b.form))},{action:"cancel",label:game.i18n.localize("CdA.Common.Cancel")}],rejectClose:false});if(!r||r==="cancel"||!r.text?.trim())return;const truths=foundry.utils.deepClone(this.actor.system.truths);truths.push({text:r.text.trim(),source:r.source?.trim()??"",status:"established",createdAt:Date.now()});await this.actor.update({"system.truths":truths});this.render();}
  static async #status(e,b){const truths=foundry.utils.deepClone(this.actor.system.truths),i=Number(b.dataset.index),cycle={established:"questioned",questioned:"contradicted",contradicted:"established"};truths[i].status=cycle[truths[i].status]??"established";await this.actor.update({"system.truths":truths});this.render();}
  static async #remove(e,b){const truths=foundry.utils.deepClone(this.actor.system.truths);truths.splice(Number(b.dataset.index),1);await this.actor.update({"system.truths":truths});this.render();}
}
