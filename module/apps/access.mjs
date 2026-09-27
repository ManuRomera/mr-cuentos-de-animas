import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { INKS } from "../settings.mjs";
import { WithMemory } from "../memory.mjs";
const get = key => game.settings.get(SYSTEM_ID, key); const set = (key, value) => game.settings.set(SYSTEM_ID, key, value);
const DEFAULTS = { readingMode:false, textScale:1, readingInk:"soft", plainFont:false, wideSpacing:false, highContrast:false, reducedMotion:false, richHelp:true, soundFx:true, tableParticles:true };
export class AccessPanel extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORY = "access";
  static DEFAULT_OPTIONS = { id:"cda-access", classes:["mr-cda","cda-app","cda-access"], window:{title:"CdA.Access.Title",icon:"fa-solid fa-universal-access"}, position:{width:430,height:"auto"}, actions:{toggle:AccessPanel.#toggle,ink:AccessPanel.#ink,reset:AccessPanel.#reset} };
  static MEMORY_FIELDS = ["left","top","width"];
  static PARTS = { panel:{template:`${TEMPLATES}/apps/access.hbs`} };
  static #instance; static open(){ return (this.#instance ??= new AccessPanel()).render({force:true}); }
  async _prepareContext(){ const toggles=["readingMode","plainFont","wideSpacing","highContrast","reducedMotion","richHelp","soundFx","tableParticles"]; return { toggles:toggles.map(key=>({key,on:get(key),label:game.i18n.localize(`CdA.Access.${key}`)})), scale:Math.round(get("textScale")*100), inks:Object.entries(INKS).map(([key,color])=>({key,color,selected:get("readingInk")===key})) }; }
  async _onRender(c,o){ await super._onRender(c,o); const range=this.element.querySelector("input[name=textScale]"),out=this.element.querySelector("[data-scale-out]"); range?.addEventListener("input",()=>{document.documentElement.style.setProperty("--cda-text-scale",range.value/100);out.textContent=`${range.value}%`;}); range?.addEventListener("change",()=>set("textScale",Number(range.value)/100)); }
  static async #toggle(e,t){ await set(t.dataset.key,!get(t.dataset.key)); this.render(); }
  static async #ink(e,t){ await set("readingInk",t.dataset.key); this.render(); }
  static async #reset(){ for(const [k,v] of Object.entries(DEFAULTS)) await set(k,v); this.render(); }
}
