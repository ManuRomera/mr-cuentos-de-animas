/** Compatibilidad Foundry VTT v13/v14 centralizada. */
const f = globalThis.foundry;
export const ApplicationV2 = f.applications.api.ApplicationV2;
export const HandlebarsApplicationMixin = f.applications.api.HandlebarsApplicationMixin;
export const DialogV2 = f.applications.api.DialogV2;
export const ActorSheetV2 = f.applications.sheets.ActorSheetV2;
export const ItemSheetV2 = f.applications.sheets.ItemSheetV2;
export const DocumentSheetConfig = f.applications.apps.DocumentSheetConfig;
export const renderTemplate = f.applications.handlebars.renderTemplate;
export const loadTemplates = f.applications.handlebars.loadTemplates;
const textEditor = () => f.applications.ux.TextEditor.implementation;

if (![ApplicationV2, HandlebarsApplicationMixin, ActorSheetV2, ItemSheetV2].every(x => typeof x === "function")) {
  throw new Error("MR · Cuentos de Ánimas requiere Foundry VTT 13 o posterior.");
}

export function generation() {
  return Number(game.release?.generation) || Number(String(game.version).split(".")[0]) || 13;
}

export const enrich = (html, relativeTo) => textEditor().enrichHTML(html ?? "", {
  relativeTo,
  secrets: relativeTo?.isOwner ?? game.user?.isGM ?? false
});

export function addSceneTool(controls, group, tool) {
  const target = controls?.[group];
  if (!target?.tools || target.tools[tool.name]) return;
  target.tools[tool.name] = {
    ...tool,
    button: true,
    order: Object.keys(target.tools).length,
    onChange: (event, active) => { if (active !== false) tool.onChange?.(event); }
  };
}

export function diagnostic() {
  return {
    system: game.system.version,
    foundry: game.version,
    generation: generation(),
    applicationV2: Boolean(ApplicationV2),
    cards: Boolean(game.cards)
  };
}
