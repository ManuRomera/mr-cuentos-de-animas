import { TEMPLATES, MODES } from "../constants.mjs";
import { Direction, deliveryLabel } from "../services/direction.mjs";
import { StateService } from "../services/state.mjs";
import { SystemApp } from "./base.mjs";

/** Persistent private card: reopening and reconnecting read the original whisper. */
export class DeliveryApp extends SystemApp {
  static LIVE = true;
  static DEFAULT_OPTIONS = { id: "cda-delivery", classes: ["cda-guardian-app"], window: { title: "CdA.Directed.Private", resizable: true }, position: { width: 480, height: 580 }, actions: {
    change: () => Direction.request("change"), publish: () => Direction.request("publish"), finish: () => Direction.request("finish")
  } };
  static PARTS = { body: { template: `${TEMPLATES}/apps/delivery.hbs`, scrollable: [".cda-guardian-scroll"] } };
  messageId = "";
  configure({ messageId } = {}) { this.messageId = messageId ?? Direction.deliveries().at(-1)?.id ?? ""; }
  async _prepareContext() {
    const message = game.messages.get(this.messageId), data = Direction.payload(message), state = StateService.get();
    if (!data || (!game.user.isGM && data.recipient !== game.user.id)) return {};
    const controls = state.mode === MODES.DIRECTED && data.purpose === "scene" && state.deliveryId === message.id && game.user.id === state.narratorId && !state.narrationDone;
    return { data, kind: deliveryLabel(data.kind), controls,
      canChange: controls && !state.changeUsed && !state.scenePublic,
      canFinish: controls && (!state.obstacle || state.obstacle.outcome), canPublish: controls && !state.scenePublic };
  }
  async _onRender(context, options) {
    await super._onRender(context, options);
    if (context.data) await Direction.markRead(game.messages.get(this.messageId));
  }
}
