import { SYSTEM_ID, TEMPLATES } from "../constants.mjs";
import { SystemApp } from "./base.mjs";
import { openApp } from "./registry.mjs";
import { createProtagonist, randomProtagonist } from "./start.mjs";

/** Aviso pequeño de primer inicio para el Guardián. Nunca a pantalla completa. */
export class WelcomeApp extends SystemApp {
  static MEMORY = "welcome";
  static MEMORY_FIELDS = ["left", "top"];
  static DEFAULT_OPTIONS = {
    id: "cda-welcome", classes: ["cda-welcome-app"],
    window: { title: "CdA.Welcome.Title", icon: "fa-solid fa-moon", resizable: false },
    position: { width: 460, height: "auto" },
    actions: { go: WelcomeApp.#go, hide: WelcomeApp.#hide }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/welcome.hbs` } };

  static maybeShow() {
    if (game.user.isGM && !game.settings.get(SYSTEM_ID, "welcomeHidden")) this.open();
  }

  static async #go(event, target) {
    const app = target.dataset.app;
    if (app === "protagonist") (await createProtagonist())?.sheet.render(true);
    else if (app === "random") (await randomProtagonist())?.sheet.render(true);
    else openApp(app);
    this.close();
  }
  static async #hide() {
    await game.settings.set(SYSTEM_ID, "welcomeHidden", true);
    this.close();
  }
}
