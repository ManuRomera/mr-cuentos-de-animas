import { MODES, SCENARIO_TAGS, TEMPLATES } from "../constants.mjs";
import { TEMPLATE } from "../content/format.mjs";
import { download } from "../services/records.mjs";
import { SystemApp, f, t } from "./base.mjs";

/** Campos del formato: [clave, obligatorio]. La descripción está en CdA.ImportHelp.Field.<clave>. */
export const FIELDS = [
  ["name", true], ["synopsis", true], ["characters", true], ["clues", true], ["environmentObstacles", true],
  ["characterObstacles", true], ["tension", true], ["epilogues", true],
  ["author", false], ["duration", false], ["players", false], ["modes", false], ["tags", false], ["tone", false],
  ["contentNotes", false], ["hook", false], ["incidents", false], ["guardianNotes", false], ["source", false]
];

/** «Cómo importar»: especificación exacta del archivo, plantilla y prompt para generarlo con una IA. */
export class ImportHelpApp extends SystemApp {
  static MEMORY = "import-help";
  static DEFAULT_OPTIONS = {
    id: "cda-import-help", classes: ["cda-import-help-app"],
    window: { title: "CdA.ImportHelp.Title", icon: "fa-solid fa-file-import" },
    position: { width: 900, height: 780 },
    actions: { template: ImportHelpApp.#template, copy: ImportHelpApp.#copy }
  };
  static PARTS = { body: { template: `${TEMPLATES}/apps/import-help.hbs`, scrollable: [".cda-help-scroll"] } };

  static prompt() {
    return f("CdA.ImportHelp.Prompt", {
      template: JSON.stringify(TEMPLATE, null, 2),
      modes: Object.values(MODES).join(", "),
      tags: SCENARIO_TAGS.join(", ")
    });
  }

  async _prepareContext() {
    return {
      fields: FIELDS.map(([key, required]) => ({ key, required, text: t(`CdA.ImportHelp.Field.${key}`) })),
      modes: Object.values(MODES).map(m => ({ key: m, label: t(`CdA.Mode.${m}`) })),
      tags: SCENARIO_TAGS.map(k => ({ key: k, label: t(`CdA.Tag.${k}`) })),
      template: JSON.stringify(TEMPLATE, null, 2),
      prompt: ImportHelpApp.prompt()
    };
  }

  static #template() { download(JSON.stringify(TEMPLATE, null, 2), "plantilla-escenario.json", "application/json"); }
  static async #copy() {
    try { await navigator.clipboard.writeText(ImportHelpApp.prompt()); ui.notifications.info(t("CdA.ImportHelp.Copied")); }
    catch { this.element.querySelector("textarea.cda-prompt")?.select(); }
  }
}
