import { PATH, TEMPLATES } from "../constants.mjs";
import { BaseActorSheet } from "./base-sheet.mjs";
import { DiaryApp } from "../apps/diary.mjs";
import { TruthRegistryApp } from "../apps/truths.mjs";
const pips = r => Array.from({length:r.max},(_,i)=>({n:i+1,on:i<r.value}));
export class ProtagonistSheet extends BaseActorSheet {
  static DEFAULT_OPTIONS = { ...super.DEFAULT_OPTIONS, classes:[...super.DEFAULT_OPTIONS.classes,"cda-protagonist"],position:{width:980,height:760},window:{...super.DEFAULT_OPTIONS.window,icon:"fa-solid fa-person"},actions:{resource:ProtagonistSheet.#resource,add:ProtagonistSheet.#add,remove:ProtagonistSheet.#remove,diary:ProtagonistSheet.#diary,truths:ProtagonistSheet.#truths} };
  static PARTS = { sheet:{template:`${TEMPLATES}/sheets/protagonist.hbs`,scrollable:[".cda-sheet-scroll"]} };
  async _prepareContext(options){const base=await super._prepareContext(options);const s=this.document.system;return{...base,actor:this.document,system:s,spirit:pips(s.spirit),determination:pips(s.determination),traits:s.traits.map((x,i)=>({...x,i})),objects:s.objects.map((x,i)=>({...x,i})),memories:s.memories.map((x,i)=>({...x,i})),truthCount:s.truths.length,diaryCount:s.diary.length};}
  static async #resource(e,b){const resource=b.dataset.resource,n=Number(b.dataset.n);const current=this.document.system[resource].value;await this.document.update({[`system.${resource}.value`]:current===n?n-1:n});}
  static async #add(e,b){const list=b.dataset.list;const data=foundry.utils.deepClone(this.document.system[list]??[]);const defaults={traits:{label:"Nuevo rasgo",text:"",icon:"fa-solid fa-feather"},objects:{label:"Objeto significativo",text:"",image:""},memories:{title:"Recuerdo",text:"",locked:false,revealed:false}};data.push(defaults[list]??{});await this.document.update({[`system.${list}`]:data});}
  static async #remove(e,b){const list=b.dataset.list,data=foundry.utils.deepClone(this.document.system[list]??[]);data.splice(Number(b.dataset.index),1);await this.document.update({[`system.${list}`]:data});}
  static #diary(){DiaryApp.open(this.document);} static #truths(){TruthRegistryApp.open(this.document);}
}
