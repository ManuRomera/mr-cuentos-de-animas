import { RULES } from "./rules.mjs";
import { LINK_TYPES, MEMORY_KINDS, TRUTH_STATUS } from "./constants.mjs";

export { LINK_TYPES, MEMORY_KINDS, TRUTH_STATUS };

const f = foundry.data.fields;
const str = (initial = "") => new f.StringField({ required: true, nullable: false, blank: true, initial });
const choice = (choices, initial) => new f.StringField({ required: true, nullable: false, blank: choices.includes(""), initial, choices });
const int = (initial = 0, min = 0, max = 99) => new f.NumberField({ required: true, nullable: false, integer: true, min, max, initial });
const bool = (initial = false) => new f.BooleanField({ required: true, nullable: false, initial });
const html = () => new f.HTMLField({ required: true, nullable: false, blank: true, initial: "" });
const time = () => new f.NumberField({ required: true, nullable: false, integer: true, min: 0, initial: 0 });
const list = schema => new f.ArrayField(new f.SchemaField(schema), { required: true, nullable: false, initial: [] });
const tags = initial => new f.ArrayField(new f.StringField({ blank: false }), { required: true, nullable: false, initial });
const id = () => str();


const link = () => new f.SchemaField({ type: choice(LINK_TYPES, ""), label: str() });

/* -------------------------------------------- */
/*  Protagonista                                */
/* -------------------------------------------- */

export class ProtagonistModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      profession: str(), origin: str(), age: str(), epithet: str(),
      description: html(), backstory: html(), notes: html(),
      spirit: new f.SchemaField({ value: int(5, 0, 12), max: int(5, 1, 12) }),
      determination: new f.SchemaField({ value: int(5, 0, 12), max: int(5, 1, 12) }),
      traits: list({ label: str(), text: str() }),
      objects: list({ label: str(), text: str(), image: str(), significant: bool(false) }),
      bonds: list({ name: str(), text: str() }),
      memories: list({
        id: id(), title: str(), text: str(), kind: choice(MEMORY_KINDS, "memory"),
        known: bool(true), link: link(), source: str(), createdAt: time()
      }),
      truths: list({
        id: id(), text: str(), status: choice(TRUTH_STATUS, "established"), category: str(),
        origin: str(), by: choice(["player", "guardian"], "player"), link: link(),
        hidden: bool(false), note: str(), createdAt: time(),
        history: list({ status: str(), at: time() })
      }),
      diary: list({
        id: id(), title: str(), text: str(), kind: str("note"), createdAt: time(),
        card: str(), result: str(), spirit: int(0, 0, 12), determination: int(0, 0, 12)
      })
    };
  }

  static migrateData(source) {
    // v1.0.x guardaba la descripción en `physicalDescription` y rasgos con icono.
    if (typeof source.physicalDescription === "string" && !source.description) source.description = source.physicalDescription;
    for (const t of source.truths ?? []) if (t.status === "questioned") t.status = "doubtful";
    for (const m of source.memories ?? []) {
      if (m.locked && !m.kind) m.kind = "locked";
      if ("revealed" in m && !("known" in m)) m.known = m.revealed;
    }
    return super.migrateData(source);
  }

  prepareDerivedData() {
    for (const r of [this.spirit, this.determination]) r.value = Math.clamp(r.value, 0, r.max);
  }

  /** Protagonista recién creado: cuatro rasgos vacíos y el reparto base 5/5. */
  static seed() {
    const half = RULES.resourceTotal / 2;
    return {
      spirit: { value: half, max: half }, determination: { value: half, max: half },
      traits: Array.from({ length: 4 }, () => ({ label: "", text: "" }))
    };
  }
}

/* -------------------------------------------- */
/*  Escenario                                   */
/* -------------------------------------------- */

const cardEntry = (difficulty = 0) => ({ title: str(), text: str(), difficulty: int(difficulty, 0, 20), image: str(), guardian: str() });

export class ScenarioModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      author: str(), duration: str(), players: str("1 + Guardián"), hook: str(), cover: str(),
      synopsis: html(), introduction: html(), guardianNotes: html(),
      tone: tags([]), tags: tags([]), modes: tags(["guardian"]), contentNotes: tags([]),
      scenes: list({ title: str(), text: str(), guardian: str(), handout: str() }),
      characters: list({ name: str(), description: str(), secret: str(), image: str() }),
      clues: list(cardEntry(0)),
      environmentObstacles: list(cardEntry(5)),
      characterObstacles: list(cardEntry(5)),
      incidents: list(cardEntry(0)),
      tension: list({ title: str(), text: str(), guardian: str() }),
      epilogues: new f.SchemaField({ high: str(), low: str(), zero: str() }),
      memories: list({ title: str(), prompt: str(), followUp: str(), kind: choice(MEMORY_KINDS, "question"), link: link() }),
      truths: list({ text: str(), contradiction: str(), reveal: str() }),
      handouts: list({ title: str(), image: str(), text: str() }),
      sounds: new f.SchemaField({ intro: str(), play: str("house"), gray: str("silence"), epilogue: str("silence") }),
      customBack: str(),
      deckVariant: choice(["world", "fixed", "random-third"], "world"),
      recommendedSpirit: int(5, RULES.resourceMin, RULES.resourceMax),
      recommendedDetermination: int(5, RULES.resourceMin, RULES.resourceMax),
      variantOf: str()
    };
  }

  static migrateData(source) {
    if (Array.isArray(source.secondaryCharacters) && !source.characters) source.characters = source.secondaryCharacters;
    if (typeof source.instructions === "string" && !source.guardianNotes) source.guardianNotes = source.instructions;
    return super.migrateData(source);
  }
}

export const DATA_MODELS = {
  Actor: { protagonist: ProtagonistModel },
  Item: { scenario: ScenarioModel }
};
