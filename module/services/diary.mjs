import { SYSTEM_ID } from "../constants.mjs";
export class DiaryService {
  static async add(actor, { title, text, kind = "scene" }) {
    if (!actor || !actor.isOwner || !game.settings.get(SYSTEM_ID, "autoDiary")) return;
    const diary = foundry.utils.deepClone(actor.system.diary ?? []);
    diary.push({ title, text, kind, createdAt: Date.now() });
    await actor.update({ "system.diary": diary });
  }
  static exportMarkdown(actor) {
    const lines = [`# ${actor.name}`, "", actor.system.profession ? `*${actor.system.profession}*` : "", ""];
    for (const entry of actor.system.diary ?? []) {
      lines.push(`## ${entry.title || "Escena"}`, "", entry.text || "", "");
    }
    return lines.join("\n");
  }
  static download(actor) {
    const text = this.exportMarkdown(actor); const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${actor.name.replace(/[^a-z0-9áéíóúüñ -]/gi, "").trim() || "cuento"}.md`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}
