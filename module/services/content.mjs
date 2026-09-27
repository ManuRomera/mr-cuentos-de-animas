import { FLAGS, PATH, SYSTEM_ID } from "../constants.mjs";
import { SCENARIOS } from "../content/scenarios.mjs";
import { FORMAT, FORMAT_VERSION, MAX_SCENARIOS, normalizeScenario, problems, unpack } from "../content/format.mjs";
import { download, slug } from "./records.mjs";

const MAX_IMPORT_BYTES = 5_000_000;
const COLLECTION = `${PATH}/content/collection`;

/** Escenarios: semilla, colección incluida, importación validada y exportación. */
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

  /* ------------------------------------------ */
  /*  Colección incluida                        */
  /* ------------------------------------------ */

  static #collection = null;

  /** Escenarios que acompañan al sistema (content/collection). Se cargan una vez por sesión. */
  static async collection() {
    if (this.#collection) return this.#collection;
    try {
      const index = await (await fetch(`${COLLECTION}/index.json`)).json();
      const docs = await Promise.all(index.files.map(async f => (await fetch(`${COLLECTION}/${f}`)).json()));
      this.#collection = docs.flatMap(doc => unpack(doc).map(s => ({ id: s.id, collection: doc.collection?.title ?? "", raw: s })));
    } catch (error) {
      console.error("MR · Cuentos de Ánimas | colección de escenarios", error);
      this.#collection = [];
    }
    return this.#collection;
  }

  static inWorld(collectionId) {
    return game.items.find(i => i.getFlag(SYSTEM_ID, "collectionId") === collectionId) ?? null;
  }

  static async addFromCollection(collectionId) {
    const existing = this.inWorld(collectionId);
    if (existing) return existing;
    const entry = (await this.collection()).find(e => e.id === collectionId);
    if (!entry) return null;
    const data = normalizeScenario(entry.raw);
    data.flags = { [SYSTEM_ID]: { collectionId } };
    return Item.implementation.create(data);
  }

  /* ------------------------------------------ */
  /*  Exportar                                  */
  /* ------------------------------------------ */

  /** Paquete de intercambio: el mismo formato que se importa. */
  static pack(items) {
    const list = Array.isArray(items) ? items : [items];
    return {
      format: FORMAT, version: FORMAT_VERSION, system: game.system.version,
      scenarios: list.map(item => {
        const { epilogueTable, ...s } = item.toObject().system;
        return { name: item.name, img: item.img, ...s, epilogues: epilogueTable };
      })
    };
  }

  static export(item) {
    download(JSON.stringify(this.pack(item), null, 2), `${slug(item.name)}.json`, "application/json");
  }

  /* ------------------------------------------ */
  /*  Importar                                  */
  /* ------------------------------------------ */

  /**
   * Lee un JSON de escenarios sin tocar el mundo. Devuelve los válidos y, por escenario,
   * los problemas en lenguaje claro. Solo lanza si el archivo entero es ilegible.
   */
  static parse(raw) {
    if (typeof raw === "string" && raw.length > MAX_IMPORT_BYTES) throw new Error(game.i18n.localize("CdA.Import.TooBig"));
    let json = raw;
    if (typeof raw === "string") {
      try { json = JSON.parse(raw); } catch (e) { throw new Error(`${game.i18n.localize("CdA.Import.NotJSON")} (${e.message})`); }
    }
    const list = unpack(json);
    if (!list.length || list.some(s => !s || typeof s !== "object" || Array.isArray(s))) throw new Error(game.i18n.localize("CdA.Import.NotScenario"));
    if (list.length > MAX_SCENARIOS) throw new Error(game.i18n.localize("CdA.Import.TooMany"));
    const valid = [], errors = [];
    list.forEach((s, i) => {
      const label = s.name || s.title || `#${i + 1}`;
      try {
        const data = normalizeScenario(s);
        const issues = problems(data);
        if (issues.length) { errors.push({ name: label, issues }); return; }
        new Item.implementation(data); // el modelo de datos rechaza tipos imposibles antes de tocar el mundo
        valid.push(data);
      } catch (error) {
        errors.push({ name: label, issues: [error.message] });
      }
    });
    return { valid, errors };
  }

  /** @returns {Promise<{ created: Item[], errors: {name: string, issues: string[]}[] }>} */
  static async importText(text) {
    const { valid, errors } = this.parse(text);
    const created = valid.length ? await Item.implementation.createDocuments(valid) : [];
    return { created, errors };
  }

  /** Copia literal o variante (recuerda de qué escenario nace). */
  static async duplicate(item, { variant = false } = {}) {
    const data = item.toObject();
    delete data._id; delete data.folder; delete data.sort; delete data.ownership;
    if (data.flags?.[SYSTEM_ID]) { delete data.flags[SYSTEM_ID][FLAGS.SEED]; delete data.flags[SYSTEM_ID].collectionId; }
    data.name = game.i18n.format(variant ? "CdA.Library.VariantName" : "CdA.Library.CopyName", { name: item.name });
    if (variant) data.system.variantOf = item.uuid;
    return Item.implementation.create(data);
  }

  static pickFile() {
    return new Promise(resolve => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "application/json,.json";
      input.addEventListener("change", async () => resolve(input.files?.[0] ? await foundry.utils.readTextFromFile(input.files[0]) : null));
      input.click();
    });
  }
}
