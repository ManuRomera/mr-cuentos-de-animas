import { MODES, SYSTEM_ID } from "../constants.mjs";
import { StateService } from "./state.mjs";
import { DeckService } from "./decks.mjs";
import { Records } from "./records.mjs";
import { newObstacle, OBSTACLE_KINDS, epilogueRow } from "../rules.mjs";
import { openApp, refreshApps } from "../apps/registry.mjs";

const flag = m => m?.getFlag(SYSTEM_ID, "direction");
const esc = value => foundry.utils.escapeHTML(String(value ?? ""));
export const safeImage = value => typeof value === "string" && value && !/^\s*(?!https?:)[a-z][a-z0-9+.-]*:/i.test(value) && !/[<>"']/.test(value) ? value : "";
export const deliveryLabel = kind => game.i18n.localize(kind === "epilogue" ? "CdA.Game.Epilogue" : kind === "note" ? "CdA.Guardian.Note" : kind === "memory" ? "CdA.App.Memories" : `CdA.Kind.${kind}`);
export const authorized = (user, state, action) => Boolean(user && (user.isGM || (state.mode !== MODES.DIRECTED && !["change", "publish", "finish"].includes(action)) || (user.id === state.narratorId && ["spend", "reveal", "push", "reroll", "accept", "payGray", "change", "publish", "finish"].includes(action))));

/** Private payloads only travel in Foundry whispers. Socket broadcasts never carry secrets or commands. */
export class Direction {
  static queue = Promise.resolve();
  static engine;
  static init(engine) {
    this.engine = engine;
    Hooks.on("createChatMessage", (message, options, userId) => {
      const data = flag(message);
      if (!data) return;
      if (data.type === "request") {
        this.queue = this.queue.then(() => this.handle(message, userId)).catch(error => console.error("CdA direction request", error));
      } else if (data.type === "delivery" && message.author?.isGM && data.recipient === game.user.id && userId === message.author.id) openApp("delivery", { messageId: message.id });
      refreshApps();
    });
    const chatCard = (message, html) => {
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (!root) return;
      const data = flag(message);
      const internal = data?.type === "request" || (message.author?.isGM && ["vault", "actorPermissions", "scenarioPermissions"].some(key => message.getFlag(SYSTEM_ID, key)));
      if (internal) { root.hidden = true; return; }
      if (!this.payload(message) || root.querySelector(".cda-open-private")) return;
      const button = document.createElement("button");
      button.type = "button"; button.className = "cda-open-private";
      button.textContent = game.i18n.localize("CdA.Directed.Private");
      button.addEventListener("click", () => openApp("delivery", { messageId: message.id }));
      root.append(button);
    };
    Hooks.on("renderChatMessageHTML", chatCard);
    Hooks.on("renderChatMessage", chatCard);
    Hooks.on("updateUser", refreshApps);
    Hooks.on("updateChatMessage", message => {
      refreshApps();
      const vault = message.getFlag(SYSTEM_ID, "vault");
      if (game.user.isGM && vault) {
        const actor = fromUuidSync(vault.actorUuid);
        if (actor?.sheet?.rendered) actor.sheet.render(false);
      }
    });
    Hooks.on("deleteChatMessage", refreshApps);
    // Pending requests are deliberately not replayed on reconnect.
    const latest = this.deliveries().at(-1);
    if (latest && !game.user.isGM) openApp("delivery", { messageId: latest.id });
  }
  static players() { return game.users.filter(u => !u.isGM); }
  static suggest(state) {
    const players = this.players().filter(u => u.active);
    const last = players.findIndex(u => u.id === state.narratorId);
    return players.length ? players[(last + 1) % players.length].id : "";
  }
  static async restoreActors() {
    if (!game.user.isGM) return;
    for (const message of game.messages.filter(m => m.author?.isGM && (m.getFlag(SYSTEM_ID, "actorPermissions") || m.getFlag(SYSTEM_ID, "scenarioPermissions")))) {
      const key = message.getFlag(SYSTEM_ID, "actorPermissions") ? "actorPermissions" : "scenarioPermissions";
      const saved = message.getFlag(SYSTEM_ID, key);
      const actor = fromUuidSync(saved.uuid);
      if (actor && !saved.restored) {
        await actor.update({ ownership: saved.ownership }, { recursive: false });
        await message.setFlag(SYSTEM_ID, `${key}.restored`, true);
      }
    }
  }
  static async protectActor(actor) {
    if (!game.user.isGM) return;
    await Records.secure(actor);
    await ChatMessage.implementation.create({ content: "<p>CdA · actor permissions</p>", whisper: game.users.filter(u => u.isGM).map(u => u.id), flags: { [SYSTEM_ID]: { actorPermissions: { uuid: actor.uuid, ownership: foundry.utils.deepClone(actor.ownership), restored: false } } } });
    await actor.update({ ownership: Object.fromEntries(["default", ...game.users.map(u => u.id)].map(id => [id, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER])) }, { recursive: false });
  }
  static async configure(mode, scenario) {
    if (!game.user.isGM) throw new Error("GM authority required");
    // Players keep read access to card visuals, but cannot edit state or deck order.
    for (const role of ["event", "eventReveal", "number", "numberReveal"]) {
      const deck = DeckService.stack(role);
      if (deck) await deck.update({ ownership: Object.fromEntries(["default", ...game.users.map(u => u.id)].map(id => [id, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER])) }, { recursive: false });
    }
    if (mode === MODES.DIRECTED && scenario) {
      const saved = game.messages.find(m => m.author?.isGM && m.getFlag(SYSTEM_ID, "scenarioPermissions")?.uuid === scenario.uuid && !m.getFlag(SYSTEM_ID, "scenarioPermissions").restored);
      if (!saved) await ChatMessage.implementation.create({ content: "<p>CdA · scenario permissions</p>", whisper: game.users.filter(u => u.isGM).map(u => u.id), flags: { [SYSTEM_ID]: { scenarioPermissions: { uuid: scenario.uuid, ownership: foundry.utils.deepClone(scenario.ownership), restored: false } } } });
      await scenario.update({ ownership: Object.fromEntries(["default", ...game.users.map(u => u.id)].map(id => [id, CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE])) }, { recursive: false });
    }
  }
  static async request(action, args = {}) {
    const state = StateService.get();
    if (!authorized(game.user, state, action)) return null;
    const gm = game.users.filter(u => u.isGM && u.active).sort((a,b) => a.id.localeCompare(b.id))[0];
    if (!gm) { ui.notifications.warn(game.i18n.localize("CdA.Directed.NoGM")); return null; }
    return ChatMessage.implementation.create({ content: `<p>${esc(game.i18n.localize("CdA.Directed.Request"))}</p>`, whisper: [gm.id], flags: { [SYSTEM_ID]: { direction: { type: "request", action, args, session: state.startedAt, turn: state.turn, deliveryId: state.deliveryId, phase: state.phase, gm: gm.id } } } });
  }
  static async handle(message, creatorId) {
    const data = flag(message), state = StateService.get();
    if (!creatorId || creatorId !== message.author?.id || !game.user.isGM || data.gm !== game.user.id || data.handled || data.session !== state.startedAt || data.turn !== state.turn || data.phase !== state.phase || data.deliveryId !== state.deliveryId || !authorized(message.author, state, data.action)) return;
    const primary = game.users.filter(u => u.isGM && u.active).sort((a,b) => a.id.localeCompare(b.id))[0];
    if (primary?.id !== game.user.id) return;
    // Use the creation hook userId and document author; never trust a supplied userId.
    const handlers = { log: () => { const e = data.args; if (!e || !["truth", "truth-status", "memory"].includes(e.type) || e.hidden) return; return StateService.log({ type: e.type, text: String(e.text ?? "").slice(0, 10000), result: String(e.result ?? ""), user: message.author.name }); }, draw: () => this.engine.draw(), choose: () => this.engine.choose(data.args), spend: () => this.engine.spend(), reveal: () => this.engine.reveal(), push: () => this.engine.push(), reroll: () => this.engine.reroll(), accept: () => this.engine.accept(), payGray: () => this.engine.payGray(data.args?.resource), epilogue: () => this.engine.epilogue(), change: () => this.change(), publish: () => this.publish(), finish: () => this.publish(true) };
    if (!handlers[data.action]) return;
    await message.setFlag(SYSTEM_ID, "direction.handled", true);
    await handlers[data.action]();
  }
  static deliveries() {
    const state = StateService.get();
    return game.messages.filter(m => { const d = flag(m); return m.author?.isGM && d?.type === "delivery" && d.session === state.startedAt && (game.user.isGM || d.recipient === game.user.id); });
  }
  static current() { return game.messages.get(StateService.get().deliveryId); }
  static payload(message = this.current()) {
    const data = flag(message);
    return message?.author?.isGM && data?.type === "delivery" && (game.user.isGM || (data.recipient === game.user.id && message.whisper?.includes(game.user.id))) ? data : null;
  }
  static async send(payload, recipient = "") {
    if (!game.user.isGM) return null;
    if (recipient && !this.players().some(u => u.id === recipient)) return null;
    const data = { ...payload, type: "delivery", session: StateService.get().startedAt, turn: StateService.get().turn, recipient, image: safeImage(payload.image) };
    const whisper = [...game.users.filter(u => u.isGM).map(u => u.id), ...(recipient ? [recipient] : [])];
    return ChatMessage.implementation.create({ content: `<div class="cda-chat-card"><small>${esc(deliveryLabel(data.kind))}</small><strong>${esc(data.title)}</strong><p>${esc(data.text).replace(/\n/g,"<br>")}</p>${data.image ? `<img src="${esc(data.image)}" alt="${esc(data.title)}">` : ""}</div>`, whisper, flags: { [SYSTEM_ID]: { direction: data } } });
  }
  static async deliverScene(choice) {
    const state = StateService.get();
    if (!game.user.isGM || state.mode !== MODES.DIRECTED || !state.event || state.event.choice || !this.players().some(u => u.id === state.narratorId)) return null;
    const message = await this.send({ ...choice, purpose: "scene", kind: state.event.kind }, state.narratorId);
    const event = { ...state.event, choice: { delivered: true } };
    const patch = { event, deliveryId: message.id, changeRequested: false };
    if (choice.list) patch.used = { ...state.used, [choice.list]: [...new Set([...(state.used[choice.list] ?? []), choice.index])] };
    if (OBSTACLE_KINDS.includes(event.kind)) patch.obstacle = state.changeUsed && state.obstacle ? state.obstacle : newObstacle({ cardId: event.cardId, title: game.i18n.localize(`CdA.Kind.${event.kind}`), kind: event.kind, base: event.value }, state.grayLadies);
    await StateService.patch(patch);
    return choice;
  }
  static async change() {
    const state = StateService.get();
    if (!game.user.isGM || state.mode !== MODES.DIRECTED || state.changeUsed || state.scenePublic || state.narrationDone || !state.deliveryId) return null;
    await StateService.patch({ changeUsed: true, changeRequested: true, deliveryId: "", event: { ...state.event, choice: null } });
  }
  static async publish(finish = false) {
    if (!game.user.isGM) return null;
    const state = StateService.get(), data = this.payload();
    if (state.mode !== MODES.DIRECTED || state.phase !== "playing" || !state.event?.choice || !data || data.purpose !== "scene") return null;
    if (finish && state.obstacle && !state.obstacle.outcome) return null;
    if (!state.scenePublic) {
      const choice = { title: data.title, text: data.text, image: data.image };
      await DeckService.current()?.update({ [`flags.${SYSTEM_ID}.cardMeta.scene`]: choice });
      const patch = { scenePublic: true, event: { ...state.event, choice } };
      if (state.event.kind === "clue") patch.clues = [...state.clues, choice];
      await StateService.patch(patch);
      await StateService.log({ type: "scene", text: data.title, kind: data.kind });
      await Records.diary(StateService.protagonist(), { ...choice, kind: data.kind });
    }
    if (finish) await StateService.patch({ narrationDone: true });
  }
  static async narrator(id) {
    if (!game.user.isGM || !this.players().some(u => u.id === id)) return;
    const state = StateService.get(), data = this.payload();
    if (state.mode !== MODES.DIRECTED) return;
    // Existing recipients keep their prior whisper; reassignment cannot erase what was read.
    if (data?.purpose === "scene" && !state.narrationDone && !state.changeRequested) {
      const message = await this.send(data, id);
      await StateService.patch({ narratorId: id, deliveryId: message.id });
    } else await StateService.patch({ narratorId: id });
  }
  static async final(recipient = "", publish = false) {
    const state = StateService.get();
    if (!game.user.isGM || state.mode !== MODES.DIRECTED || !["epilogue", "finished"].includes(state.phase)) return null;
    const scenario = StateService.scenario(), actor = StateService.protagonist();
    const row = epilogueRow(scenario?.system.epilogueTable ?? [], actor?.system.spirit.value ?? 0);
    if (!row) return null;
    const saved = this.payload(game.messages.get(state.finalDeliveryId));
    const payload = saved ?? { purpose: "epilogue", kind: "epilogue", title: row.label || game.i18n.localize("CdA.Game.Epilogue"), text: row.text };
    const message = await this.send(payload, recipient);
    if (publish && !state.epiloguePublic) {
      await ChatMessage.implementation.create({ content: `<div class="cda-chat-card"><strong>${esc(payload.title)}</strong><p>${esc(payload.text)}</p></div>` });
      await Records.diary(actor, { ...payload, kind: "epilogue" });
      await StateService.log({ type: "epilogue", text: payload.text });
    }
    await StateService.patch({ phase: "finished", finalDeliveryId: message.id, epiloguePublic: state.epiloguePublic || publish, publicEpilogue: publish ? payload : state.publicEpilogue ?? null, ambient: scenario.system.sounds?.epilogue ?? "" });
    if (!recipient) openApp("delivery", { messageId: message.id });
    return row;
  }
  static async privateRecord(entry) {
    if (!game.user.isGM) return null;
    if (entry.time) {
      const existing = game.messages.find(m => m.author?.isGM && JSON.stringify(flag(m)?.record) === JSON.stringify(entry));
      if (existing) return existing;
    }
    return this.send({ purpose: "record", kind: "note", title: game.i18n.localize("CdA.Guardian.Note"), text: entry.text ?? "", record: entry });
  }
  static async markRead(message) {
    const data = this.payload(message);
    if (!data || data.recipient !== game.user.id) return;
    if (game.user.getFlag(SYSTEM_ID, "deliveryReads")?.[message.id]) return;
    const reads = Object.fromEntries(Object.entries({ ...(game.user.getFlag(SYSTEM_ID, "deliveryReads") ?? {}), [message.id]: Date.now() }).slice(-200));
    await game.user.setFlag(SYSTEM_ID, "deliveryReads", reads);
  }
  static status(message = this.current()) {
    const data = this.payload(message), user = game.users.get(data?.recipient);
    if (user?.getFlag(SYSTEM_ID, "deliveryReads")?.[message?.id]) return "read";
    return user?.active ? "delivered" : "sent";
  }
}
