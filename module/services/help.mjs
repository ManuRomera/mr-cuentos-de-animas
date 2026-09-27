import { get } from "../settings.mjs";

/**
 * Ayuda contextual en dos niveles:
 *  - Hover prolongado (≈1,2 s) sobre un elemento con `data-help`: nota breve.
 *  - Clic derecho: ficha ampliada que se queda hasta cerrarla.
 * Textos en lang/*.json bajo CdA.Help.<clave>.{Title,Short,Long}.
 * No actúa sobre campos de texto ni mientras se arrastra, y el menú contextual
 * normal sigue funcionando en todo lo que no tenga `data-help`.
 */
const DELAY = 1200;

export class RichHelp {
  static #tip = null; static #timer = null; static #target = null; static #controller = null; static #watch = null;

  static init() {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const signal = this.#controller.signal;
    document.addEventListener("pointerover", e => this.#enter(e), { signal, passive: true });
    document.addEventListener("pointerout", e => this.#leave(e), { signal, passive: true });
    document.addEventListener("pointerdown", e => { if (!this.#tip?.contains(e.target)) this.hide(); }, { signal, passive: true });
    document.addEventListener("contextmenu", e => this.#context(e), { signal });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.hide(); }, { signal });
  }

  static #find(el) {
    const target = el?.closest?.("[data-help]");
    if (!target || target.matches("input, textarea, select, [contenteditable]")) return null;
    return target;
  }

  static #enter(event) {
    if (event.buttons || !get("richHelp")) return;
    const target = this.#find(event.target);
    if (!target || target === this.#target) return;
    clearTimeout(this.#timer);
    this.#target = target;
    this.#timer = setTimeout(() => { if (this.#target === target && target.isConnected) this.show(target); }, DELAY);
  }

  static #leave(event) {
    const target = this.#find(event.target);
    if (!target || target.contains(event.relatedTarget)) return;
    clearTimeout(this.#timer);
    this.#target = null;
    if (!this.#tip?.classList.contains("pinned")) this.hide();
  }

  static #context(event) {
    if (!get("richHelp")) return;
    const target = this.#find(event.target);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    this.show(target, true);
  }

  static text(key) {
    const base = `CdA.Help.${key}`;
    if (!game.i18n.has(`${base}.Title`)) return null;
    return {
      title: game.i18n.localize(`${base}.Title`),
      short: game.i18n.localize(`${base}.Short`),
      long: game.i18n.has(`${base}.Long`) ? game.i18n.localize(`${base}.Long`) : ""
    };
  }

  static show(target, pinned = false) {
    clearTimeout(this.#timer);
    this.hide();
    const data = this.text(target.dataset.help); if (!data) return;
    const el = document.createElement("aside");
    el.className = `cda-help${pinned ? " pinned" : ""}`;
    el.setAttribute("role", pinned ? "dialog" : "tooltip");
    el.setAttribute("aria-label", data.title);
    const esc = s => foundry.utils.escapeHTML(s);
    el.innerHTML = `<strong>${esc(data.title)}</strong><p>${esc(data.short)}</p>`
      + (pinned && data.long ? `<p class="cda-help-long">${esc(data.long)}</p>` : "")
      + (pinned ? `<button type="button" class="cda-help-close">${esc(game.i18n.localize("CdA.Common.Close"))}</button>`
        : `<small>${esc(game.i18n.localize("CdA.Help.RightClick"))}</small>`);
    document.body.append(el);
    this.#tip = el;
    const r = target.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    const below = r.bottom + 10 + h < innerHeight;
    el.style.left = `${Math.round(Math.clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8))}px`;
    el.style.top = `${Math.round(below ? r.bottom + 10 : Math.max(8, r.top - h - 10))}px`;
    if (pinned) {
      const close = el.querySelector(".cda-help-close");
      close.addEventListener("click", () => this.hide());
      close.focus();
    }
    // Si la ventana se repinta bajo el ratón, el elemento desaparece sin «pointerout»: la nota no debe quedarse.
    else this.#watch = setInterval(() => { if (!target.isConnected || !target.matches(":hover")) this.hide(); }, 400);
  }

  static hide() {
    clearTimeout(this.#timer);
    clearInterval(this.#watch);
    this.#tip?.remove();
    this.#tip = null;
  }
}
