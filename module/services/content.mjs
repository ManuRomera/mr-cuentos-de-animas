import { FLAGS, SYSTEM_ID } from "../constants.mjs";
import { SCENARIOS } from "../content/scenarios.mjs";
import { download, slug } from "./records.mjs";

const FORMAT = "mr-cuentos-de-animas/scenario";
const MAX_IMPORT_BYTES = 2_000_000;

/** Escenarios: semilla, biblioteca, importación validada y exportación. */
export class ContentService {
  static scenarios() { return game.items.filter(i => i.type === "scenario").sort((a, b) => a.name.localeCompare(b.name)); }

  /** Crea los escenarios originales que falten. Nunca sobrescribe los que el usuario haya editado. */
  static async ensureSeed() {
    if (!game.user.isGM) return;
    // v1.0.x marcaba la semilla con `true`; se reconoce por nombre para no duplicarla.
    const isSeed = (item, data) => {
      const flag = item.getFlag(SYSTEM_ID, FLAGS.SEED);
      return flag === data.flags[SYSTEM_ID][FLAGS.SEED] || (flag === true && item.name === data.name);
    };
    const missing = SCENARIOS.filter(data => !game.items.some(i => isSeed(i, data)));
    if (missing.length) {
      const created = await Item.implementation.createDocuments(foundry.utils.deepClone(missing));
      if (created.length < missing.length) throw new Error(`Solo se crearon ${created.length} de ${missing.length} escenarios; revisa la consola.`);
    }
    await game.settings.set(SYSTEM_ID, "seedVersion", game.system.version);
  }

  /** Paquete exportable: formato propio versionado, sin ids ni permisos del mundo. */
  static pack(item) {
    const data = item.toObject();
    return {
      format: FORMAT, version: 1, system: game.system.version,
      scenario: { name: data.name, img: data.img, type: "scenario", system: data.system }
    };
  }

  static export(item) {
    download(JSON.stringify(this.pack(item), null, 2), `${slug(item.name)}.json`, "application/json");
  }

  /**
   * Valida un JSON de escenario sin tocar el mundo. Acepta el formato propio y,
   * por compatibilidad, un Item exportado desde Foundry. Devuelve datos limpios o lanza un Error legible.
   */
  static validate(raw) {
    let json = raw;
    if (typeof raw === "string") {
      if (raw.length > MAX_IMPORT_BYTES) throw new Error(game.i18n.localize("CdA.Import.TooBig"));
      try { json = JSON.parse(raw); } catch { throw new Error(game.i18n.localize("CdA.Import.NotJSON")); }
    }
    const source = json?.format === FORMAT ? json.scenario : json;
    if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error(game.i18n.localize("CdA.Import.NotScenario"));
    if (source.type && source.type !== "scenario") throw new Error(game.i18n.localize("CdA.Import.NotScenario"));
    if (typeof source.system !== "object" || source.system === null) throw new Error(game.i18n.localize("CdA.Import.NoSystem"));
    const data = {
      name: String(source.name || game.i18n.localize("CdA.Library.Imported")).slice(0, 200),
      type: "scenario", img: typeof source.img === "string" ? source.img : undefined, system: source.system
    };
    // El modelo de datos limpia tipos y descarta campos desconocidos; si algo es irrecuperable, lanza aquí.
    const probe = new Item.implementation(data);
    return { ...data, system: probe.system.toObject() };
  }

  static async importText(text) {
    const data = this.validate(text);
    return Item.implementation.create(data);
  }

  /** Copia literal o variante (recuerda de qué escenario nace). */
  static async duplicate(item, { variant = false } = {}) {
    const data = item.toObject();
    delete data._id; delete data.folder; delete data.sort; delete data.ownership;
    if (data.flags?.[SYSTEM_ID]) delete data.flags[SYSTEM_ID][FLAGS.SEED];
    data.name = game.i18n.format(variant ? "CdA.Library.VariantName" : "CdA.Library.CopyName", { name: item.name });
    if (variant) data.system.variantOf = item.uuid;
    return Item.implementation.create(data);
  }

  /** Elegir un archivo local y devolver su texto. */
  static pickFile() {
    return new Promise(resolve => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json,.json";
      input.addEventListener("change", async () => resolve(input.files?.[0] ? await foundry.utils.readTextFromFile(input.files[0]) : null));
      input.click();
    });
  }
}
