import { Direction } from "./direction.mjs";
import { SYSTEM_ID } from "../constants.mjs";
import { StateService } from "./state.mjs";

/**
 * Diario, Verdades y Recuerdos del protagonista. Son listas del actor:
 * se sincronizan con Foundry y las ve quien pueda ver la ficha.
 * Lo marcado como oculto solo lo muestra la interfaz al Guardián.
 */
const uid = () => foundry.utils.randomID();
const clone = (actor, list) => foundry.utils.deepClone(Records.entries(actor, list));
/** Un jugador sin permiso de propietario no puede escribir: el Guardián lo hará por él. */
const canWrite = actor => actor?.isOwner;

export class Records {
  static vault(actor) {
    if (!game.user.isGM || !actor) return null;
    return game.messages.find(m => m.author?.isGM && m.getFlag(SYSTEM_ID, "vault")?.actorUuid === actor.uuid) ?? null;
  }
  static entries(actor, list) {
    const publicEntries = actor?.system[list] ?? [];
    if (!game.user.isGM) return publicEntries.filter(e => list === "truths" ? !e.hidden : list === "memories" ? e.known : true);
    const stored = this.vault(actor)?.getFlag(SYSTEM_ID, "vault") ?? {};
    const privateEntries = stored[list] ?? [];
    return [...publicEntries, ...privateEntries].filter((e, i, all) => !e.id || all.findIndex(x => x.id === e.id) === i).map(e => list === "truths" ? { ...e, note: stored.notes?.[e.id] ?? e.note ?? "" } : e);
  }
  static async write(actor, list, entries) {
    if (!canWrite(actor)) return;
    if (!game.user.isGM) {
      // Only a GM can change visibility or edit the private record store.
      const publicEntries = entries.map(e => list === "truths" ? { ...e, hidden: false } : list === "memories" ? { ...e, known: true } : e);
      return actor.update({ [`system.${list}`]: publicEntries });
    }
    if (!["truths", "memories"].includes(list)) return actor.update({ [`system.${list}`]: entries });
    const isPrivate = e => list === "truths" ? e.hidden : !e.known;
    let vault = this.vault(actor);
    if (entries.some(isPrivate) || (list === "truths" && entries.some(e => e.note)) || vault) {
      const data = { ...(vault?.getFlag(SYSTEM_ID, "vault") ?? { actorUuid: actor.uuid }), [list]: entries.filter(isPrivate), ...(list === "truths" ? { notes: Object.fromEntries(entries.filter(e => e.note).map(e => [e.id, e.note])) } : {}) };
      if (vault) {
        if (list === "truths") for (const id of Object.keys(vault.getFlag(SYSTEM_ID, "vault")?.notes ?? {})) if (!(id in data.notes)) data.notes[`-=${id}`] = null;
        await vault.setFlag(SYSTEM_ID, "vault", data);
      }
      else vault = await ChatMessage.implementation.create({ content: `<p>${foundry.utils.escapeHTML(game.i18n.localize("CdA.Directed.Private"))}</p>`, whisper: game.users.filter(u => u.isGM).map(u => u.id), flags: { [SYSTEM_ID]: { vault: data } } });
    }
    await actor.update({ [`system.${list}`]: entries.filter(e => !isPrivate(e)).map(e => list === "truths" ? { ...e, note: "" } : e) });
  }
  static async secure(actor) {
    if (!game.user.isGM) return;
    for (const list of ["truths", "memories"]) {
      if (actor.system[list]?.some(e => list === "truths" ? (e.hidden || e.note) : !e.known)) await this.write(actor, list, clone(actor, list));
    }
  }

  /* ------------------------------------------ */
  /*  Diario                                    */
  /* ------------------------------------------ */

  static async diary(actor, { title, text = "", kind = "note", card = "", result = "" }, { force = false } = {}) {
    if (!canWrite(actor)) return null;
    if (!force && kind !== "note" && !game.settings.get(SYSTEM_ID, "autoDiary")) return null;
    const entry = { id: uid(), title, text, kind, card, result, createdAt: Date.now(), spirit: actor.system.spirit.value, determination: actor.system.determination.value };
    await actor.update({ "system.diary": [...clone(actor, "diary"), entry] });
    return entry;
  }

  static async editDiary(actor, id, changes) { return this.#edit(actor, "diary", id, changes); }
  static async removeDiary(actor, id) { return this.#remove(actor, "diary", id); }

  /* ------------------------------------------ */
  /*  Verdades                                  */
  /* ------------------------------------------ */

  static async addTruth(actor, data) {
    if (!canWrite(actor) || !data.text?.trim()) return null;
    const truth = {
      id: uid(), text: data.text.trim(), status: data.status ?? "established", category: data.category ?? "",
      origin: data.origin ?? this.#origin(), by: data.by ?? (game.user.isGM ? "guardian" : "player"),
      link: data.link ?? { type: "", label: "" }, hidden: Boolean(data.hidden && game.user.isGM), note: data.note ?? "",
      createdAt: Date.now(), history: [{ status: data.status ?? "established", at: Date.now() }]
    };
    await this.write(actor, "truths", [...clone(actor, "truths"), truth]);
    await StateService.log({ type: "truth", text: truth.text, result: truth.status, hidden: truth.hidden });
    if (!truth.hidden) await this.diary(actor, { title: game.i18n.localize("CdA.Truth.Established"), text: truth.text, kind: "truth" });
    return truth;
  }

  static async setTruthStatus(actor, id, status) {
    if (!canWrite(actor)) return;
    const truths = clone(actor, "truths");
    const truth = truths.find(t => t.id === id); if (!truth || truth.status === status) return;
    truth.status = status;
    truth.history.push({ status, at: Date.now() });
    await this.write(actor, "truths", truths);
    await StateService.log({ type: "truth-status", text: truth.text, result: status, hidden: truth.hidden });
  }

  static async editTruth(actor, id, changes) { return this.#edit(actor, "truths", id, changes); }
  static async removeTruth(actor, id) { return this.#remove(actor, "truths", id); }

  /* ------------------------------------------ */
  /*  Recuerdos                                 */
  /* ------------------------------------------ */

  static async addMemory(actor, data) {
    if (!canWrite(actor)) return null;
    const memory = {
      id: uid(), title: data.title ?? "", text: data.text ?? "", kind: data.kind ?? "memory",
      known: game.user.isGM ? data.known ?? true : true, link: data.link ?? { type: "", label: "" }, source: data.source ?? this.#origin(), createdAt: Date.now()
    };
    await this.write(actor, "memories", [...clone(actor, "memories"), memory]);
    await StateService.log({ type: "memory", text: memory.title || memory.text, result: memory.kind, hidden: !memory.known });
    return memory;
  }

  static async editMemory(actor, id, changes) { return this.#edit(actor, "memories", id, changes); }
  static async removeMemory(actor, id) { return this.#remove(actor, "memories", id); }

  /* ------------------------------------------ */

  /** Origen legible: la carta o escena en curso. */
  static #origin() {
    const state = StateService.get();
    const card = state.currentCardId ? game.cards.find(c => c.cards.has(state.currentCardId))?.cards.get(state.currentCardId) : null;
    if (card) return card.name;
    const scene = StateService.scenario()?.system.scenes?.[state.scene];
    return scene?.title ?? "";
  }

  static async #edit(actor, list, id, changes) {
    if (!canWrite(actor)) return;
    const data = clone(actor, list);
    const entry = data.find(e => e.id === id); if (!entry) return;
    if (!game.user.isGM && ("hidden" in changes || "known" in changes || "note" in changes)) return;
    foundry.utils.mergeObject(entry, changes);
    await this.write(actor, list, data);
  }

  static async #remove(actor, list, id) {
    if (!canWrite(actor)) return;
    await this.write(actor, list, clone(actor, list).filter(e => e.id !== id));
  }

  /** Entradas de listas antiguas sin id: se les asigna uno la primera vez. */
  static async ensureIds(actor) {
    if (!canWrite(actor)) return;
    const update = {};
    for (const list of ["diary", "truths", "memories"]) {
      const data = clone(actor, list);
      if (data.every(e => e.id)) continue;
      data.forEach(e => { e.id ||= uid(); });
      await this.write(actor, list, data);
    }
    if (!foundry.utils.isEmpty(update)) await actor.update(update);
  }
}

/* -------------------------------------------- */
/*  Exportación del diario                      */
/* -------------------------------------------- */

const date = t => t ? new Date(t).toLocaleString(game.i18n.lang) : "";
const esc = s => foundry.utils.escapeHTML(String(s ?? ""));

export function diaryMarkdown(actor) {
  const s = actor.system;
  const lines = [`# ${actor.name}`, ""];
  if (s.profession || s.origin) lines.push(`*${[s.profession, s.origin].filter(Boolean).join(" · ")}*`, "");
  for (const e of s.diary) {
    lines.push(`## ${e.title || game.i18n.localize("CdA.Diary.Entry")}`, `<small>${date(e.createdAt)}${e.result ? ` · ${e.result}` : ""}</small>`, "", e.text || "", "");
  }
  const truths = s.truths.filter(t => !t.hidden);
  if (truths.length) {
    lines.push(`## ${game.i18n.localize("CdA.App.Truths")}`, "");
    for (const t of truths) lines.push(`- **${game.i18n.localize(`CdA.Truth.Status.${t.status}`)}** — ${t.text}`);
  }
  return lines.join("\n");
}

export function diaryHTML(actor) {
  const s = actor.system;
  const entries = s.diary.map(e => `<article><header><h2>${esc(e.title)}</h2><time>${esc(date(e.createdAt))}</time>${e.result ? `<em>${esc(e.result)}</em>` : ""}</header><p>${esc(e.text).replace(/\n/g, "<br>")}</p></article>`).join("");
  const truths = s.truths.filter(t => !t.hidden).map(t => `<li><strong>${esc(game.i18n.localize(`CdA.Truth.Status.${t.status}`))}</strong> ${esc(t.text)}</li>`).join("");
  return `<!doctype html><html lang="${game.i18n.lang}"><meta charset="utf-8"><title>${esc(actor.name)}</title>
<style>body{max-width:44rem;margin:3rem auto;padding:0 1.2rem;font:1.08rem/1.65 Georgia,"Iowan Old Style",serif;background:#f3ead8;color:#2a211a}h1{font-size:2.4rem;margin:0}h2{font-size:1.25rem;margin:0}header time,header em{display:block;font-size:.85rem;color:#7a6650}article{border-top:1px solid #cbb89a;padding:1.2rem 0}.sub{color:#7a6650;font-style:italic}</style>
<h1>${esc(actor.name)}</h1><p class="sub">${esc([s.profession, s.origin].filter(Boolean).join(" · "))}</p>${entries}${truths ? `<h2>${esc(game.i18n.localize("CdA.App.Truths"))}</h2><ul>${truths}</ul>` : ""}</html>`;
}

/** Guardar un texto como archivo en el ordenador del usuario. */
export const download = (text, filename, type) => foundry.utils.saveDataToFile(text, type, filename);

export const slug = name => String(name ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cuento";
