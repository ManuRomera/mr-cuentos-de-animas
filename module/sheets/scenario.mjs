import { TEMPLATES } from "../constants.mjs";
import { BaseItemSheet } from "./base-sheet.mjs";
import { SessionService } from "../services/session.mjs";
export class ScenarioSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = { ...super.DEFAULT_OPTIONS,classes:[...super.DEFAULT_OPTIONS.classes,"cda-scenario"],position:{width:1060,height:800},window:{...super.DEFAULT_OPTIONS.window,icon:"fa-solid fa-book-skull"},actions:{add:ScenarioSheet.#add,remove:ScenarioSheet.#remove,play:ScenarioSheet.#play,export:ScenarioSheet.#export} };
  static PARTS = { sheet:{template:`${TEMPLATES}/sheets/scenario.hbs`,scrollable:[".cda-sheet-scroll"]} };
  async _prepareContext(options){const base=await super._prepareContext(options),s=this.document.system;const indexed=a=>(a??[]).map((x,i)=>({...x,i}));return{...base,item:this.document,system:s,characters:indexed(s.secondaryCharacters),clues:indexed(s.clues),env:indexed(s.environmentObstacles),char:indexed(s.characterObstacles),incidents:indexed(s.incidents),tension:indexed(s.tension),memories:indexed(s.memories)};}
  static defaults(list){return({secondaryCharacters:{name:"Nuevo personaje",description:"",secret:"",image:""},clues:{title:"Nueva pista",text:"",difficulty:0,image:""},environmentObstacles:{title:"Nuevo obstáculo",text:"",difficulty:5,image:""},characterObstacles:{title:"Nuevo obstáculo",text:"",difficulty:5,image:""},incidents:{title:"Nuevo percance",text:"",difficulty:0,image:""},tension:{title:"Dama Gris",text:""},memories:{title:"Recuerdo",prompt:"",followUp:""}})[list]??{};}
  static async #add(e,b){const list=b.dataset.list,data=foundry.utils.deepClone(this.document.system[list]??[]);data.push(this.constructor.defaults(list));await this.document.update({[`system.${list}`]:data});}
  static async #remove(e,b){const list=b.dataset.list,data=foundry.utils.deepClone(this.document.system[list]??[]);data.splice(Number(b.dataset.index),1);await this.document.update({[`system.${list}`]:data});}
  static #play(){SessionService.startWizard({scenarioUuid:this.document.uuid});}
  static #export(){const blob=new Blob([JSON.stringify(this.document.toObject(),null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${this.document.name.replace(/[^a-z0-9-]/gi,"-").toLowerCase()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
}
