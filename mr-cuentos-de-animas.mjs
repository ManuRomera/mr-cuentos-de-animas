/**
 * MR · Cuentos de Ánimas — arranque.
 *
 * Regla de oro: el sistema nunca puede dejar Foundry inservible. Cada fase va
 * aislada en `bootPhase`: si falla, avisa, lo anota para el diagnóstico y el
 * resto sigue. Nada se abre solo al entrar; la Mesa se abre a petición.
 */
import { DATA_MODELS } from "./module/models.mjs";
import { DocumentSheetConfig, addControlGroup, loadTemplates, welcomeSceneData } from "./module/compat.mjs";
import { ASSETS, FLAGS, LOG, SYSTEM_ID, TEMPLATES } from "./module/constants.mjs";
import { applyPreferences, registerMenus, registerSettings } from "./module/settings.mjs";
import { BOOT, bootPhase, diagnostic } from "./module/services/diagnostic.mjs";
import { ProtagonistSheet } from "./module/sheets/protagonist.mjs";
import { ScenarioSheet } from "./module/sheets/scenario.mjs";
import { Apps, openApp } from "./module/apps/registry.mjs";
import { cssUrl } from "./module/apps/view.mjs";
import { TableApp } from "./module/apps/table.mjs";
import { LibraryApp } from "./module/apps/library.mjs";
import { GuardianApp } from "./module/apps/guardian.mjs";
import { DiaryApp } from "./module/apps/diary.mjs";
import { ArchiveApp } from "./module/apps/archive.mjs";
import { AccessPanel } from "./module/apps/access.mjs";
import { SafetyPanel } from "./module/apps/safety.mjs";
import { StartApp, createProtagonist } from "./module/apps/start.mjs";
import { WelcomeApp } from "./module/apps/welcome.mjs";
import { DiagnosticApp } from "./module/apps/diagnostic.mjs";
import { ImportHelpApp } from "./module/apps/import-help.mjs";
import { ContentService } from "./module/services/content.mjs";
import { SCENARIOS } from "./module/content/scenarios.mjs";
import { DeckService } from "./module/services/decks.mjs";
import { GameplayService } from "./module/services/gameplay.mjs";
import { StateService } from "./module/services/state.mjs";
import { Records } from "./module/services/records.mjs";
import { RichHelp } from "./module/services/help.mjs";
import { SoundService } from "./module/services/sound.mjs";
import { Direction } from "./module/services/direction.mjs";
import { DeliveryApp } from "./module/apps/delivery.mjs";
import { Presenter } from "./module/services/presenter.mjs";

const TEMPLATE_FILES = [
  "apps/delivery.hbs", "apps/table.hbs", "apps/guardian.hbs", "apps/library.hbs", "apps/start.hbs", "apps/diary.hbs", "apps/archive.hbs",
  "apps/access.hbs", "apps/safety.hbs", "apps/welcome.hbs", "apps/diagnostic.hbs", "apps/import-help.hbs",
  "sheets/protagonist.hbs", "sheets/scenario.hbs", "partials/card.hbs", "partials/slip.hbs", "partials/entries.hbs"
].map(p => `${TEMPLATES}/${p}`);

/* -------------------------------------------- */
/*  init                                        */
/* -------------------------------------------- */

Hooks.once("init", () => {
  console.info(`${LOG} ${game.system.version} · inicializando`);

  bootPhase("models", () => {
    Object.assign(CONFIG.Actor.dataModels, DATA_MODELS.Actor);
    Object.assign(CONFIG.Item.dataModels, DATA_MODELS.Item);
    CONFIG.Actor.trackableAttributes = { protagonist: { bar: ["spirit", "determination"], value: [] } };
  });

  bootPhase("settings", () => {
    registerSettings();
    registerMenus({ AccessPanel, DiagnosticApp });
  });

  bootPhase("sheets", () => {
    DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, ProtagonistSheet, { types: ["protagonist"], makeDefault: true, label: "CdA.Sheet.Protagonist" });
    DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, ScenarioSheet, { types: ["scenario"], makeDefault: true, label: "CdA.Sheet.Scenario" });
  });

  bootPhase("templates", () => {
    Handlebars.registerHelper("cdaUrl", path => cssUrl(path));
    return loadTemplates(TEMPLATE_FILES);
  });

  bootPhase("apps", () => {
    Object.assign(Apps, {
      delivery: DeliveryApp, table: TableApp, library: LibraryApp, guardian: GuardianApp, diary: DiaryApp, access: AccessPanel,
      safety: SafetyPanel, start: StartApp, diagnostic: DiagnosticApp, welcome: WelcomeApp, importHelp: ImportHelpApp,
      truths: { open: (o = {}) => ArchiveApp.open({ ...o, tab: "truths" }) },
      memories: { open: (o = {}) => ArchiveApp.open({ ...o, tab: "memories" }) },
      protagonist: { open: ({ actor } = {}) => (actor ?? StateService.focus())?.sheet.render(true) },
      scenario: { open: () => StateService.scenario()?.sheet.render(true) }
    });
    game.keybindings.register(SYSTEM_ID, "openTable", {
      name: "CdA.Keys.Table", hint: "CdA.Keys.TableHint",
      editable: [{ key: "KeyM", modifiers: ["Shift"] }],
      onDown: () => { openApp("table"); return true; }
    });
  });

  bootPhase("api", () => {
    game.mrCuentosDeAnimas = Object.freeze({
      open: () => openApp("table"), table: () => openApp("table"), library: () => openApp("library"),
      guardian: () => openApp("guardian"), diary: () => openApp("diary"), truths: () => openApp("truths"),
      memories: () => openApp("memories"), access: () => openApp("access"), safety: () => openApp("safety"),
      start: options => openApp("start", options), createProtagonist,
      draw: () => GameplayService.draw(), epilogue: () => GameplayService.epilogue(),
      state: () => StateService.get(), history: () => StateService.history(),
      /** Informe copiable. `game.mrCuentosDeAnimas.diagnostic({ show: true })` abre la ventana. */
      diagnostic: async ({ show = false } = {}) => {
        const report = await diagnostic();
        console.info(`${LOG} diagnóstico`, report);
        if (show) openApp("diagnostic");
        return report;
      },
      boot: BOOT
    });
  });
});

/* -------------------------------------------- */
/*  ready                                       */
/* -------------------------------------------- */

Hooks.once("ready", async () => {
  bootPhase("preferences", applyPreferences);
  bootPhase("help", () => RichHelp.init());
  bootPhase("sound", () => SoundService.init());
  bootPhase("safety", () => SafetyPanel.init());

  if (game.user.isGM) {
    await bootPhase("content", () => ContentService.ensureSeed());
    await bootPhase("decks", async () => { await DeckService.ensureStacks(); await Direction.configure(StateService.get().mode, StateService.scenario()); });
    await bootPhase("migration", migrate);
    await bootPhase("scene", ensureScene);
  }
  bootPhase("direction", () => Direction.init(GameplayService));
  bootPhase("presenter", () => Presenter.init());

  console.info(`${LOG} listo · Foundry ${game.version}`, BOOT.errors.length ? BOOT.errors : "sin errores");
  if (game.user.isGM) bootPhase("welcome", () => WelcomeApp.maybeShow());
  if (game.settings.get(SYSTEM_ID, "openOnStart")) bootPhase("openOnStart", () => openApp("table"));
});

/**
 * Un mundo nuevo no debe quedarse vacío: se crea la mesa ambiental una sola vez, sin abrir ninguna ventana.
 * Foundry 13 crea su propia escena de bienvenida (NUEDEFAULTSCENE0); si es la única, se sustituye como activa.
 */
async function ensureScene() {
  if (game.settings.get(SYSTEM_ID, "sceneReady")) return;
  const onlyCoreDefault = game.scenes.size === 1 && game.scenes.has("NUEDEFAULTSCENE0");
  if (game.scenes.size && !onlyCoreDefault) return game.settings.set(SYSTEM_ID, "sceneReady", true);
  const scene = await Scene.implementation.create(welcomeSceneData({ name: game.i18n.localize("CdA.App.Table"), src: ASSETS.scene }));
  if (scene && !scene.active) await scene.activate();
  await scene?.view(); // el Guardián seguía mirando la escena por defecto de Foundry
  await game.settings.set(SYSTEM_ID, "sceneReady", true);
}

/** Datos de versiones anteriores. Idempotente: se puede ejecutar en cada arranque. */
async function migrate() {
  const version = game.system.version;
  if (game.settings.get(SYSTEM_ID, "migratedVersion") === version) return;
  // v1.0.x guardaba el estado con otras claves; un relato de entonces no puede continuarse.
  const saved = StateService.eventDeck()?.getFlag(SYSTEM_ID, FLAGS.STATE);
  if (saved && ("activeObstacle" in saved || "lastCardUuid" in saved)) await StateService.reset();
  for (const actor of game.actors.filter(a => a.type === "protagonist")) { await Records.ensureIds(actor); await Records.secure(actor); }
  const history = StateService.history();
  for (const entry of history.filter(e => e.hidden)) await Direction.privateRecord(entry);
  if (history.some(e => e.hidden)) await StateService.eventDeck()?.setFlag(SYSTEM_ID, FLAGS.HISTORY, history.filter(e => !e.hidden));
  // 1.3: handouts de «La voz que dejaste atrás» en mundos creados antes de tener su arte.
  const voice = game.items.find(i => i.getFlag(SYSTEM_ID, FLAGS.SEED) === "voice");
  const fresh = SCENARIOS.find(s => s.flags[SYSTEM_ID][FLAGS.SEED] === "voice")?.system;
  if (voice && fresh && !voice.system.handouts.length) {
    const scenes = voice.system.scenes.map((sc, i) => ({ ...sc, handout: sc.handout || fresh.scenes[i]?.handout || "" }));
    await voice.update({ "system.handouts": fresh.handouts, "system.scenes": scenes });
  }
  await game.settings.set(SYSTEM_ID, "migratedVersion", version);
}

/* -------------------------------------------- */
/*  Accesos visibles                            */
/* -------------------------------------------- */

Hooks.on("getSceneControlButtons", controls => {
  try {
    const t = k => game.i18n.localize(k);
    const tools = [
      { name: "cdaTable", title: t("CdA.App.Table"), icon: "fa-solid fa-fire-flame-curved", onChange: () => openApp("table") },
      { name: "cdaProtagonist", title: t("CdA.Controls.Protagonist"), icon: "fa-solid fa-id-card", onChange: () => openApp("protagonist") },
      { name: "cdaLibrary", title: t("CdA.App.Library"), icon: "fa-solid fa-book-open", onChange: () => openApp("library") },
      { name: "cdaDiary", title: t("CdA.App.Diary"), icon: "fa-solid fa-feather-pointed", onChange: () => openApp("diary") },
      { name: "cdaSafety", title: t("CdA.App.Safety"), icon: "fa-solid fa-shield-heart", onChange: () => openApp("safety") }
    ];
    if (game.user.isGM) {
      tools.splice(1, 0, { name: "cdaGuardian", title: t("CdA.App.Guardian"), icon: "fa-solid fa-hat-wizard", onChange: () => openApp("guardian") });
      tools.push({ name: "cdaScenario", title: t("CdA.Controls.Scenario"), icon: "fa-solid fa-book-skull", onChange: () => openApp("scenario") });
    }
    addControlGroup(controls, { name: "cda", title: "MR · Cuentos de Ánimas", icon: "fa-solid fa-moon", tools });
  } catch (error) { console.error(`${LOG} controles de escena`, error); }
});

/** Botonera propia en los directorios de Actores y Objetos. */
function directoryButtons(root, buttons) {
  const el = root instanceof HTMLElement ? root : root?.[0];
  if (!el || el.querySelector(".cda-directory-actions")) return;
  const bar = document.createElement("div");
  bar.className = "cda-directory-actions";
  for (const { label, icon, run } of buttons) {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = `<i class="${icon}" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize(label))}`;
    b.addEventListener("click", run);
    bar.append(b);
  }
  (el.querySelector(".directory-header") ?? el).append(bar);
}

Hooks.on("renderActorDirectory", (app, html) => {
  try {
    directoryButtons(html, [
      { label: "CdA.App.Table", icon: "fa-solid fa-fire-flame-curved", run: () => openApp("table") },
      { label: "CdA.Controls.NewProtagonist", icon: "fa-solid fa-user-plus", run: async () => (await createProtagonist())?.sheet.render(true) }
    ]);
  } catch (error) { console.error(`${LOG} directorio de actores`, error); }
});

Hooks.on("renderItemDirectory", (app, html) => {
  try { directoryButtons(html, [{ label: "CdA.App.Library", icon: "fa-solid fa-book-open", run: () => openApp("library") }]); }
  catch (error) { console.error(`${LOG} directorio de objetos`, error); }
});

Hooks.on("renderSettings", (app, html) => {
  try {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".cda-settings-block")) return;
    const block = document.createElement("section");
    block.className = "cda-settings-block";
    block.innerHTML = `<h4 class="divider">MR · Cuentos de Ánimas</h4>`;
    for (const [label, icon, name] of [["CdA.App.Table", "fa-fire-flame-curved", "table"], ["CdA.Access.Title", "fa-universal-access", "access"], ["CdA.Diagnostic.Title", "fa-stethoscope", "diagnostic"]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.innerHTML = `<i class="fa-solid ${icon}" aria-hidden="true"></i> ${foundry.utils.escapeHTML(game.i18n.localize(label))}`;
      b.addEventListener("click", () => openApp(name));
      block.append(b);
    }
    (root.querySelector("section.settings, .settings") ?? root.querySelector("section") ?? root).prepend(block);
  } catch (error) { console.error(`${LOG} ajustes`, error); }
});
