import { SYSTEM_ID, VERSION } from "../constants.mjs";
import { SCENARIOS } from "../content/scenarios.mjs";

export class ContentService {
  static async ensureSeed() {
    if (!game.user.isGM) return;
    const current = game.settings.get(SYSTEM_ID, "seedVersion");
    for (const data of SCENARIOS) {
      const existing = game.items.find(i => i.type === "scenario" && i.name === data.name && i.getFlag(SYSTEM_ID, "seed"));
      if (!existing) {
        const item = await Item.implementation.create(data);
        await item.setFlag(SYSTEM_ID, "seed", true);
        await item.setFlag(SYSTEM_ID, "seedVersion", VERSION);
      }
    }
    if (current !== VERSION) await game.settings.set(SYSTEM_ID, "seedVersion", VERSION);
  }
  static scenarios() { return game.items.filter(i => i.type === "scenario"); }
  static scenario(uuid) { return uuid ? fromUuidSync(uuid) : null; }
}
