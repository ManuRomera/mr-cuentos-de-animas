export { CARD_KINDS, KIND_LIST, RULES } from "./rules.mjs";

export const SYSTEM_ID = "mr-cuentos-de-animas";
export const PATH = `systems/${SYSTEM_ID}`;
export const TEMPLATES = `${PATH}/templates`;
export const SOCKET = `system.${SYSTEM_ID}`;
export const LOG = "MR · Cuentos de Ánimas |";

export const FLAGS = Object.freeze({ ROLE: "role", STATE: "sessionState", HISTORY: "history", CARD: "cardMeta", SEED: "seed" });

export const TRUTH_STATUS = Object.freeze(["established", "doubtful", "contradicted", "reinterpreted", "pending", "resolved"]);
export const MEMORY_KINDS = Object.freeze(["memory", "question", "locked", "confirmed", "contradicted"]);
export const LINK_TYPES = Object.freeze(["", "scene", "object", "clue", "character", "truth", "card", "epilogue"]);

export const SCENARIO_TAGS = Object.freeze(["rural", "supernatural", "psychological", "folklore", "mystery", "scifi", "urban"]);

export const MODES = Object.freeze({ GUARDIAN: "guardian", BONFIRE: "bonfire", DIARY: "diary", FREE: "free" });

/** Estado compartido de la partida. Vive en un flag del Mazo de Ánimas: se sincroniza solo. */
export const DEFAULT_STATE = Object.freeze({
  scenarioUuid: "",
  protagonistUuid: "",
  mode: MODES.GUARDIAN,
  phase: "idle",            // idle · playing · epilogue · finished
  grayLadies: 0,
  pendingGray: 0,           // Dama recién revelada que aún espera su precio
  obstacle: null,           // ver rules.newObstacle
  currentCardId: "",
  event: null,              // { cardId, kind, value, choice: null | { list, index, title, text } }
  clues: [],                // pistas halladas: { title, text }
  used: {},                 // { lista: [índices ya elegidos] }
  tension: [],              // textos de las Damas ya reveladas
  turn: 0,                  // La Hoguera: quién narra la escena
  scene: 0,                 // escena del escenario en la que está el Guardián
  ambient: "",
  startedAt: 0
});

const img = p => `${PATH}/assets/${p}`;
/** Todas las rutas de arte en un único sitio. Sustituir un archivo con el mismo nombre basta para cambiar el arte. */
export const ASSETS = Object.freeze({
  cover: img("branding/cover.webp"),
  logo: img("branding/logo.webp"),
  icon: img("branding/icon.svg"),
  table: img("table/table.webp"),
  scene: img("table/scene.webp"),
  cardBack: img("cards/back.webp"),
  numberBack: img("cards/number-back.webp"),
  numberArt: img("cards/number-art.webp"),
  kinds: {
    clue: img("cards/clue.webp"),
    environment: img("cards/environment.webp"),
    character: img("cards/character.webp"),
    incident: img("cards/incident.webp")
  },
  gray: [img("cards/gray-1.webp"), img("cards/gray-2.webp"), img("cards/gray-3.webp")],
  spirit: { on: img("counters/spirit-on.webp"), off: img("counters/spirit-off.webp") },
  determination: { on: img("counters/determination-on.webp"), off: img("counters/determination-off.webp") },
  scenarios: {
    voice: img("scenarios/la-voz-que-dejaste-atras.webp"),
    house: img("scenarios/la-casa-que-respira.webp")
  },
  portrait: img("branding/portrait.webp"),
  /** Cartas oficiales del libro (reproducibles según la propia edición): estilo «Clásico». */
  classic: {
    back: img("classic/back.webp"), numberBack: img("classic/number-back.webp"), gray: img("classic/gray.webp"),
    clue: img("classic/clue.webp"), incident: img("classic/incident.webp"),
    spirit: img("classic/spirit.webp"), determination: img("classic/determination.webp"),
    environment: v => img(`classic/environment-${v}.webp`), character: v => img(`classic/character-${v}.webp`),
    number: n => img(`classic/number-${n}.webp`)
  }
});
