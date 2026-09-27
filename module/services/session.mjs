import { DialogV2 } from "../compat.mjs";
import { ASSETS, MODES, SYSTEM_ID } from "../constants.mjs";
import { ContentService } from "./content.mjs";
import { DeckService } from "./decks.mjs";
import { StateService } from "./state.mjs";

export class SessionService {
  static async createProtagonist(name = "Protagonista") {
    return Actor.implementation.create({ name, type: "protagonist", img: `${ASSETS.logo}` });
  }
  static async startWizard({ scenarioUuid = "" } = {}) {
    const scenarios = ContentService.scenarios(); const protagonists = game.actors.filter(a => a.type === "protagonist");
    if (!scenarios.length) return ui.notifications.warn("No hay escenarios disponibles.");
    const selectedScenario = scenarioUuid || scenarios[0].uuid;
    const t=k=>game.i18n.localize(k);
    const content = `<form class="cda-start-form">
      <label>${t("CdA.Session.Scenario")}<select name="scenario">${scenarios.map(s=>`<option value="${s.uuid}" ${s.uuid===selectedScenario?"selected":""}>${foundry.utils.escapeHTML(s.name)}</option>`).join("")}</select></label>
      <label>${t("CdA.Session.Protagonist")}<select name="actor"><option value="">${t("CdA.Session.NewProtagonist")}</option>${protagonists.map(a=>`<option value="${a.uuid}">${foundry.utils.escapeHTML(a.name)}</option>`).join("")}</select></label>
      <label>${t("CdA.Session.Mode")}<select name="mode"><option value="${MODES.GUARDIAN}">${t("CdA.Mode.guardian")}</option><option value="${MODES.BONFIRE}">${t("CdA.Mode.bonfire")}</option><option value="${MODES.DIARY}">${t("CdA.Mode.diary")}</option><option value="${MODES.FREE}">${t("CdA.Mode.free")}</option></select></label>
      <p class="hint">${t("CdA.Session.Hint")}</p>
    </form>`;
    const data = await DialogV2.wait({ window:{title:"CdA.Session.New",icon:"fa-solid fa-book"},classes:["mr-cda","cda-dialog"],content,
      buttons:[{action:"start",label:t("CdA.Session.Start"),icon:"fa-solid fa-fire-flame-curved",default:true,callback:(e,b)=>Object.fromEntries(new FormData(b.form))},{action:"cancel",label:t("CdA.Common.Cancel"),icon:"fa-solid fa-xmark"}],rejectClose:false });
    if (!data || data === "cancel") return null;
    const scenario = fromUuidSync(data.scenario); if (!scenario) return null;
    let actor = data.actor ? fromUuidSync(data.actor) : null;
    if (!actor) { actor = await this.createProtagonist(); actor.sheet.render(true); }
    const desiredSpirit = scenario.system.recommendedSpirit || 5, desiredDetermination = scenario.system.recommendedDetermination || 5;
    if ((actor.system.spirit.max + actor.system.determination.max) !== 10) await actor.update({"system.spirit.max":desiredSpirit,"system.spirit.value":desiredSpirit,"system.determination.max":desiredDetermination,"system.determination.value":desiredDetermination});
    await DeckService.buildEventDeck(scenario,{variant:game.settings.get(SYSTEM_ID,"grayVariant")});
    await StateService.patch({scenarioUuid:scenario.uuid,protagonistUuid:actor.uuid,mode:data.mode,phase:"playing",grayLadies:0,difficultyBonus:0,activeObstacle:null,lastCardUuid:"",startedAt:Date.now()});
    Hooks.callAll("mrCdaRefresh"); return { scenario, actor };
  }
}
