import { CARD_KINDS, SYSTEM_ID } from "../constants.mjs";
import { DialogV2 } from "../compat.mjs";
import { DeckService } from "./decks.mjs";
import { DiaryService } from "./diary.mjs";
import { StateService } from "./state.mjs";
import { SoundService } from "./sound.mjs";
import { CardOverlay } from "../apps/card-overlay.mjs";

const escape = text => foundry.utils.escapeHTML(String(text ?? ""));
const spend = async (actor, resource, amount = 1) => {
  const now = actor.system[resource]?.value ?? 0; if (now < amount) return false;
  await actor.update({ [`system.${resource}.value`]: Math.max(0, now - amount) });
  resource === "spirit" ? SoundService.stone() : SoundService.ember(); return true;
};

export class GameplayService {
  static async drawEvent() {
    const state = StateService.get(); if (state.phase === "idle") return ui.notifications.warn(game.i18n.localize("CdA.Game.NoStory"));
    if (state.activeObstacle) return ui.notifications.warn(game.i18n.localize("CdA.Game.PendingObstacle"));
    const card = await DeckService.drawEvent(); if (!card) return ui.notifications.info(game.i18n.localize("CdA.Game.EmptyDeck"));
    const meta = DeckService.meta(card); const actor = StateService.protagonist();
    await StateService.patch({ lastCardUuid: card.uuid });
    SoundService.card(); await CardOverlay.showCard(card);
    if (actor) await DiaryService.add(actor, { title: meta.title || card.name, text: meta.text || card.currentFace?.text || "", kind: meta.kind || "scene" });
    if (meta.kind === CARD_KINDS.GRAY) return this.#grayLady(card, meta, actor);
    if ([CARD_KINDS.ENVIRONMENT, CARD_KINDS.CHARACTER].includes(meta.kind)) {
      const bonus = StateService.get().difficultyBonus;
      await StateService.patch({ activeObstacle: { cardUuid: card.uuid, kind: meta.kind, title: meta.title, baseDifficulty: meta.difficulty, difficulty: Number(meta.difficulty || 0) + bonus } });
    }
    Hooks.callAll("mrCdaRefresh");
    return card;
  }

  static async #grayLady(card, meta, actor) {
    const index = Number(meta.grayIndex || (StateService.get().grayLadies + 1));
    SoundService.gray(index);
    if (actor) {
      const choices = [];
      if (actor.system.determination.value > 0) choices.push({ action: "determination", label: game.i18n.localize("CdA.Game.SpendDetermination"), icon: "fa-solid fa-fire" });
      if (actor.system.spirit.value > 0) choices.push({ action: "spirit", label: game.i18n.localize("CdA.Game.LoseSpirit"), icon: "fa-solid fa-gem" });
      if (choices.length) {
        const picked = await DialogV2.wait({
          window: { title: `${game.i18n.localize("CdA.Game.GrayLady")} ${index}`, icon: "fa-solid fa-ghost" },
          classes: ["mr-cda", "cda-dialog"],
          content: `<div class="cda-dialog-copy"><p>${game.i18n.localize("CdA.Game.GrayCrosses")}</p></div>`,
          buttons: choices, rejectClose: false
        });
        if (picked === "determination" || picked === "spirit") await spend(actor, picked, 1);
      }
    }
    await StateService.patch({ grayLadies: index, difficultyBonus: index, activeObstacle: null, phase: index >= 3 ? "epilogue" : "playing" });
    Hooks.callAll("mrCdaRefresh");
  }

  static async resolveObstacle() {
    const state = StateService.get(); const obstacle = state.activeObstacle; const actor = StateService.protagonist();
    if (!obstacle) return ui.notifications.info(game.i18n.localize("CdA.Game.NoObstacle"));
    if (!actor) return ui.notifications.warn(game.i18n.localize("CdA.Game.NoProtagonist"));
    let preBonus = 0;
    const preButtons = [{ action: "reveal", label: game.i18n.localize("CdA.Game.Reveal"), icon: "fa-solid fa-clone" }];
    if (actor.system.determination.value > 0) preButtons.unshift({ action: "push", label: game.i18n.localize("CdA.Game.Push2"), icon: "fa-solid fa-fire" });
    const pre = await DialogV2.wait({
      window: { title: obstacle.title || game.i18n.localize("CdA.Game.ResolveObstacle"), icon: "fa-solid fa-diamond-turn-right" }, classes: ["mr-cda", "cda-dialog"],
      content: `<div class="cda-dialog-copy"><p>${game.i18n.localize("CdA.Game.CurrentDifficulty")}: <strong>${obstacle.difficulty}</strong>.</p><p>Puedes consumir Determinación antes de revelar para obtener +2.</p></div>`,
      buttons: preButtons, rejectClose: false
    });
    if (!pre) return;
    if (pre === "push") { if (await spend(actor, "determination")) preBonus = 2; }
    let card = await DeckService.drawNumber(); if (!card) return;
    let value = Number(DeckService.meta(card).value ?? card.value ?? card.name.match(/\d+/)?.[0] ?? 0);
    await CardOverlay.showNumber(card, obstacle.difficulty, preBonus);
    let total = value + preBonus; let success = total >= obstacle.difficulty;

    if (!success && actor.system.determination.value > 0) {
      const options = [{ action: "accept", label: game.i18n.localize("CdA.Game.AcceptFail"), icon: "fa-solid fa-heart-crack" }];
      if (total + 1 >= obstacle.difficulty) options.unshift({ action: "plus", label: game.i18n.localize("CdA.Game.Push1"), icon: "fa-solid fa-fire" });
      if (state.grayLadies >= 2) options.unshift({ action: "reroll", label: game.i18n.localize("CdA.Game.Reroll"), icon: "fa-solid fa-rotate" });
      const after = await DialogV2.wait({
        window: { title: "CdA.Game.NotEnough", icon: "fa-solid fa-scale-unbalanced" }, classes: ["mr-cda", "cda-dialog"],
        content: `<div class="cda-dialog-copy"><p>Has revelado <strong>${value}</strong>${preBonus ? ` + ${preBonus}` : ""} frente a dificultad <strong>${obstacle.difficulty}</strong>.</p></div>`,
        buttons: options, rejectClose: false
      });
      if (after === "plus" && await spend(actor, "determination")) { total += 1; success = total >= obstacle.difficulty; }
      else if (after === "reroll" && await spend(actor, "determination")) {
        card = await DeckService.drawNumber(); value = Number(DeckService.meta(card).value ?? card.value ?? 0); total = value; success = total >= obstacle.difficulty;
        await CardOverlay.showNumber(card, obstacle.difficulty, 0);
      }
    }

    if (success) SoundService.success();
    else { await spend(actor, "spirit", 1); SoundService.failure(); }
    const outcome = game.i18n.localize(success ? "CdA.Game.Success" : "CdA.Game.Failure");
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<div class="cda-chat-card ${success ? "success" : "failure"}"><strong>${escape(obstacle.title)}</strong><span>${outcome}</span><small>${total} / ${obstacle.difficulty}</small></div>` });
    await DiaryService.add(actor, { title: `${obstacle.title} · ${outcome}`, text: `Carta numérica: ${value}. Dificultad: ${obstacle.difficulty}.`, kind: success ? "success" : "failure" });
    await StateService.patch({ activeObstacle: null, phase: state.grayLadies >= 3 ? "epilogue" : "playing" });
    Hooks.callAll("mrCdaRefresh");
    return success;
  }

  static async epilogue() {
    const scenario = StateService.scenario(), actor = StateService.protagonist(); if (!scenario || !actor) return;
    const spirit = actor.system.spirit.value;
    const key = spirit <= 0 ? "zero" : spirit === 1 ? "low" : "high";
    const text = scenario.system.epilogues[key];
    await CardOverlay.showEpilogue(scenario, text, key);
    await DiaryService.add(actor, { title: game.i18n.localize("CdA.Game.Epilogue"), text, kind: "epilogue" });
    await StateService.patch({ phase: "finished" }); Hooks.callAll("mrCdaRefresh");
  }
}
