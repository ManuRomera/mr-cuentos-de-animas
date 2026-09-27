import { ApplicationV2, HandlebarsApplicationMixin } from "../compat.mjs";
import { TEMPLATES } from "../constants.mjs";
import { WithMemory } from "../memory.mjs";
import { ContentService } from "../services/content.mjs";
import { SessionService } from "../services/session.mjs";
export class LibraryApp extends WithMemory(HandlebarsApplicationMixin(ApplicationV2)) {
  static MEMORY="library";static DEFAULT_OPTIONS={id:"cda-library",classes:["mr-cda","cda-app","cda-library"],window:{title:"CdA.App.Library",icon:"fa-solid fa-book-open",resizable:true},position:{width:1040,height:760},actions:{open:LibraryApp.#open,play:LibraryApp.#play,create:LibraryApp.#create,import:LibraryApp.#import}};static PARTS={body:{template:`${TEMPLATES}/apps/library.hbs`,scrollable:[".cda-library-grid"]}};static #instance;static open(){return(this.#instance??=new LibraryApp()).render({force:true});}
  async _prepareContext(){return{scenarios:ContentService.scenarios().map(s=>({uuid:s.uuid,name:s.name,img:s.system.cover||s.img,hook:s.system.hook,duration:s.system.duration,tone:s.system.tone.join(" · ")})),isGM:game.user.isGM};}
  static #open(e,b){fromUuidSync(b.dataset.uuid)?.sheet.render(true);} static #play(e,b){SessionService.startWizard({scenarioUuid:b.dataset.uuid});}
  static async #create(){if(!game.user.isGM)return;const item=await Item.implementation.create({name:game.i18n.localize("CdA.Library.NewScenario"),type:"scenario"});item.sheet.render(true);this.render();}
  static async #import(){
    if(!game.user.isGM)return;
    const input=document.createElement("input");input.type="file";input.accept="application/json,.json";
    input.addEventListener("change",async()=>{const file=input.files?.[0];if(!file)return;try{const data=JSON.parse(await file.text());delete data._id;delete data.folder;data.type="scenario";data.name ||= "Escenario importado";const item=await Item.implementation.create(data);ui.notifications.info(game.i18n.format("CdA.Library.Imported",{name:item.name}));item.sheet.render(true);this.render();}catch(error){console.error(error);ui.notifications.error(game.i18n.localize("CdA.Library.InvalidImport"));}});
    input.click();
  }
}
