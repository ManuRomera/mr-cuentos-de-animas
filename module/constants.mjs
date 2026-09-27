export const SYSTEM_ID = "mr-cuentos-de-animas";
export const PATH = `systems/${SYSTEM_ID}`;
export const VERSION = "1.0.0";
export const FLAGS = Object.freeze({ STATE: "sessionState", CARD: "cardMeta", GENERATED: "generated" });
export const CARD_KINDS = Object.freeze({
  CLUE: "clue",
  ENVIRONMENT: "environment",
  CHARACTER: "character",
  INCIDENT: "incident",
  GRAY: "gray"
});
export const MODES = Object.freeze({
  BONFIRE: "bonfire",
  DIARY: "diary",
  GUARDIAN: "guardian",
  FREE: "free"
});
export const DEFAULT_STATE = Object.freeze({
  scenarioUuid: "",
  protagonistUuid: "",
  mode: MODES.GUARDIAN,
  grayLadies: 0,
  difficultyBonus: 0,
  phase: "idle",
  activeObstacle: null,
  lastCardUuid: "",
  startedAt: 0
});
export const ASSETS = Object.freeze({
  cover: `${PATH}/assets/branding/cover.webp`,
  logo: `${PATH}/assets/branding/logo.svg`,
  table: `${PATH}/assets/branding/table.svg`,
  cardBack: `${PATH}/assets/cards/back.svg`,
  numberBack: `${PATH}/assets/cards/number-back.svg`,
  spiritOn: `${PATH}/assets/counters/spirit-on.svg`,
  spiritOff: `${PATH}/assets/counters/spirit-off.svg`,
  determinationOn: `${PATH}/assets/counters/determination-on.svg`,
  determinationOff: `${PATH}/assets/counters/determination-off.svg`
});
export const TEMPLATES = `${PATH}/templates`;
