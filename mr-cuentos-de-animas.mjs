import { DATA_MODELS } from "./module/models.mjs";
import { DocumentSheetConfig, addSceneTool, diagnostic, generation, loadTemplates } from "./module/compat.mjs";
import { PATH, SYSTEM_ID, TEMPLATES, VERSION } from "./module/constants.mjs";
import { registerSettings, applyPreferences } from "./module/settings.mjs";
import { ProtagonistSheet } from "./module/sheets/protagonist.mjs";
import { ScenarioSheet } from "./module/sheets/scenario.mjs";
import { TableApp } from "./module/apps/table.mjs";
import { LibraryApp } from "./module/apps/library.mjs";
import { AccessPanel } from "./module/apps/access.mjs";
import { SafetyPanel } from "./module/apps/safety.mjs";
import { DiaryApp } from "./module/apps/diary.mjs";
import { TruthRegistryApp } from "./module/apps/truths.mjs";
import { RichHelp } from "./module/services/help.mjs";
import { ContentService } from "./module/services/content.mjs";
import { DeckService } from "./module/services/decks.mjs";
import { GameplayService } from "./module/services/gameplay.mjs";
import { SessionService } from "./module/services/session.mjs";
import { StateService } from "./module/services/state.mjs";

Hooks.once("init", () => {
  console.info(`MR · Cuentos de Ánimas ${VERSION} | Inicializando`);
  Object.assign(CONFIG.Actor.dataModels, DATA_MODELS.Actor);
  Object.assign(CONFIG.Item.dataModels, DATA_MODELS.Item);
  CONFIG.Actor.trackableAttributes = { protagonist: { bar: ["spirit", "determination"], value: [] } };
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, ProtagonistSheet, { types:["protagonist"], makeDefault:true, label:"MR · Cuentos de Ánimas" });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, ScenarioSheet, { types:["scenario"], makeDefault:true, label:"MR · Escenario" });
  registerSettings();
  loadTemplates([`${TEMPLATES}/apps/table.hbs`,`${TEMPLATES}/apps/access.hbs`,`${TEMPLATES}/apps/library.hbs`,`${TEMPLATES}/apps/diary.hbs`,`${TEMPLATES}/apps/truths.hbs`,`${TEMPLATES}/apps/safety.hbs`]);
  game.keybindings.register(SYSTEM_ID,"openTable",{name:"CdA.App.Table",editable:[{key:"KeyA",modifiers:["Shift"]}],onDown:()=>{TableApp.open();return true;}});
  game.mrCuentosDeAnimas = Object.freeze({ open:()=>TableApp.open(), library:()=>LibraryApp.open(), access:()=>AccessPanel.open(), safety:()=>SafetyPanel.open(), start:opts=>SessionService.startWizard(opts), draw:()=>GameplayService.drawEvent(), resolve:()=>GameplayService.resolveObstacle(), epilogue:()=>GameplayService.epilogue(), state:()=>StateService.get(), diagnostic });
});

Hooks.once("ready", async () => {
  applyPreferences(); RichHelp.init(); SafetyPanel.init();
  if (game.user.isGM) { await ContentService.ensureSeed(); await DeckService.ensureStacks(); }
  console.info(`MR · Cuentos de Ánimas ${game.system.version} · Foundry ${game.version} (generación ${generation()})`);
  if (game.user.isGM && game.settings.get(SYSTEM_ID,"welcomeVersion") !== VERSION) {
    await game.settings.set(SYSTEM_ID,"welcomeVersion",VERSION);
    ui.notifications.info("MR · Cuentos de Ánimas está listo. Abriendo la Mesa de Ánimas.");
    TableApp.open();
  } else if (game.settings.get(SYSTEM_ID,"autoOpen")) TableApp.open();
});

const refresh = () => { for (const app of foundry.applications.instances.values()) if (app instanceof TableApp || app instanceof LibraryApp || app instanceof DiaryApp || app instanceof TruthRegistryApp) app.render(); };
Hooks.on("mrCdaRefresh", refresh);
Hooks.on("updateCards", refresh); Hooks.on("createCard", refresh); Hooks.on("deleteCard", refresh);
Hooks.on("updateActor", actor => { if (actor.type === "protagonist") refresh(); });
Hooks.on("updateItem", item => { if (item.type === "scenario") refresh(); });

Hooks.on("getSceneControlButtons", controls => {
  addSceneTool(controls,"notes",{name:"cdaTable",title:game.i18n.localize("CdA.App.Table"),icon:"fa-solid fa-fire-flame-curved",onChange:()=>TableApp.open()});
  addSceneTool(controls,"notes",{name:"cdaLibrary",title:game.i18n.localize("CdA.App.Library"),icon:"fa-solid fa-book-open",onChange:()=>LibraryApp.open()});
});

Hooks.on("renderActorDirectory", (_app, html) => {
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector(".cda-directory-actions"))return;
  const box=document.createElement("div");box.className="cda-directory-actions";box.innerHTML=`<button type="button" data-cda="table"><i class="fa-solid fa-fire-flame-curved"></i>Mesa de Ánimas</button><button type="button" data-cda="new"><i class="fa-solid fa-user-plus"></i>Protagonista</button>`;
  box.querySelector('[data-cda="table"]').onclick=()=>TableApp.open();box.querySelector('[data-cda="new"]').onclick=async()=>{const a=await SessionService.createProtagonist();a.sheet.render(true);};(root.querySelector(".directory-header")??root).append(box);
});

Hooks.on("renderItemDirectory", (_app, html) => {
  const root=html instanceof HTMLElement?html:html?.[0];if(!root||root.querySelector(".cda-item-actions"))return;
  const box=document.createElement("div");box.className="cda-directory-actions cda-item-actions";box.innerHTML=`<button type="button"><i class="fa-solid fa-book-open"></i>Biblioteca de Ánimas</button>`;box.querySelector("button").onclick=()=>LibraryApp.open();(root.querySelector(".directory-header")??root).append(box);
});
