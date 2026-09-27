import { ActorSheetV2, HandlebarsApplicationMixin, ItemSheetV2 } from "../compat.mjs";
import { WithMemory } from "../memory.mjs";
export class BaseActorSheet extends WithMemory(HandlebarsApplicationMixin(ActorSheetV2)) {
  static DEFAULT_OPTIONS = { classes:["mr-cda","cda-sheet"],form:{submitOnChange:true},window:{resizable:true} };
  static SCROLL_MEMORY = [".cda-sheet-scroll"];
  get title(){return this.document.name;}
}
export class BaseItemSheet extends WithMemory(HandlebarsApplicationMixin(ItemSheetV2)) {
  static DEFAULT_OPTIONS = { classes:["mr-cda","cda-sheet"],form:{submitOnChange:true},window:{resizable:true} };
  static SCROLL_MEMORY = [".cda-sheet-scroll"];
  get title(){return this.document.name;}
}
