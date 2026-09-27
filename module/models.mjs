const f = foundry.data.fields;
const str = (initial = "") => new f.StringField({ required: true, nullable: false, initial });
const num = (initial = 0, min = 0, max = 99) => new f.NumberField({ required: true, nullable: false, integer: true, min, max, initial });
const bool = (initial = false) => new f.BooleanField({ required: true, nullable: false, initial });
const html = () => new f.HTMLField({ required: true, nullable: false, initial: "" });
const list = schema => new f.ArrayField(new f.SchemaField(schema), { required: true, nullable: false, initial: [] });

export class ProtagonistModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      profession: str(), origin: str(), portraitCaption: str(), physicalDescription: html(), backstory: html(), notes: html(),
      spirit: new f.SchemaField({ value: num(5, 0, 10), max: num(5, 3, 10) }),
      determination: new f.SchemaField({ value: num(5, 0, 10), max: num(5, 3, 10) }),
      traits: list({ label: str(), text: str(), icon: str("fa-solid fa-feather") }),
      objects: list({ label: str(), text: str(), image: str() }),
      memories: list({ title: str(), text: str(), locked: bool(false), revealed: bool(false) }),
      truths: list({ text: str(), status: str("established"), source: str(), createdAt: num(0, 0, 9999999999999) }),
      diary: list({ title: str(), text: str(), kind: str("scene"), createdAt: num(0, 0, 9999999999999) })
    };
  }
  prepareDerivedData() {
    this.spirit.value = Math.min(this.spirit.max, Math.max(0, this.spirit.value));
    this.determination.value = Math.min(this.determination.max, Math.max(0, this.determination.value));
  }
}

const promptEntry = { title: str(), text: str(), difficulty: num(0, 0, 12), image: str() };
const personEntry = { name: str(), description: str(), secret: str(), image: str() };
const memoryEntry = { title: str(), prompt: str(), followUp: str() };

export class ScenarioModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      author: str("MR · Cuentos de Ánimas"), duration: str("90–150 min"), hook: str(), synopsis: html(), instructions: html(),
      cover: str(), tone: new f.ArrayField(str(), { initial: [] }), modes: new f.ArrayField(str(), { initial: ["guardian"] }),
      contentNotes: new f.ArrayField(str(), { initial: [] }),
      secondaryCharacters: list(personEntry), clues: list(promptEntry), environmentObstacles: list(promptEntry), characterObstacles: list(promptEntry), incidents: list(promptEntry),
      tension: list({ title: str(), text: str() }),
      epilogues: new f.SchemaField({ high: str(), low: str(), zero: str() }),
      memories: list(memoryEntry),
      ambient: new f.SchemaField({ label: str("Casa en silencio"), intensity: num(35, 0, 100) }),
      customBack: str(),
      recommendedSpirit: num(5, 3, 7), recommendedDetermination: num(5, 3, 7)
    };
  }
}

export class NarrativeModel extends foundry.abstract.TypeDataModel {
  static defineSchema() { return { text: html(), category: str(), difficulty: num(0, 0, 12), secret: html() }; }
}

export const DATA_MODELS = {
  Actor: { protagonist: ProtagonistModel },
  Item: {
    scenario: ScenarioModel,
    clue: NarrativeModel,
    obstacle: NarrativeModel,
    memory: NarrativeModel,
    truth: NarrativeModel
  }
};
