import { renderTemplate } from "../compat.mjs";
import { TEMPLATES } from "../constants.mjs";
import { reducedMotion } from "../settings.mjs";
import { cssUrl } from "./view.mjs";

const esc = s => foundry.utils.escapeHTML(String(s ?? ""));

/**
 * Carta ampliada, pregunta de recuerdo y epílogo. Capa temporal que se cierra con
 * clic, Escape o su botón; nunca queda puesta al recargar y no bloquea Foundry.
 */
export class CardOverlay {
  static #layer = null;
  static #controller = null;

  static close() {
    const layer = this.#layer; if (!layer) return;
    this.#layer = null;
    this.#controller?.abort();
    layer.classList.remove("visible");
    setTimeout(() => layer.remove(), reducedMotion() ? 0 : 220);
  }

  static #open(inner, classes = "", label = "") {
    this.close();
    const layer = document.createElement("div");
    layer.className = `mr-cda cda-overlay ${classes}`;
    layer.setAttribute("role", "dialog");
    layer.setAttribute("aria-modal", "true");
    if (label) layer.setAttribute("aria-label", label);
    layer.innerHTML = `<div class="cda-overlay-scrim"></div><div class="cda-overlay-body">${inner}
      <button type="button" class="cda-overlay-close" aria-label="${esc(game.i18n.localize("CdA.Common.Close"))}"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></div>`;
    document.body.append(layer);
    this.#layer = layer;
    this.#controller = new AbortController();
    const signal = this.#controller.signal;
    layer.querySelector(".cda-overlay-scrim").addEventListener("click", () => this.close(), { signal });
    layer.querySelector(".cda-overlay-close").addEventListener("click", () => this.close(), { signal });
    document.addEventListener("keydown", e => { if (e.key === "Escape") this.close(); }, { signal });
    requestAnimationFrame(() => layer.classList.add("visible"));
    layer.querySelector(".cda-overlay-close").focus();
    return layer;
  }

  /** Carta en grande. `flip`: llega boca abajo y se gira (para quien no tenga la Mesa abierta). */
  static async show(card, { flip = false } = {}) {
    if (!card) return;
    const html = await renderTemplate(`${TEMPLATES}/partials/card.hbs`, { card, size: "huge" });
    const guardian = card.guardian ? `<aside class="cda-overlay-note"><i class="fa-solid fa-hat-wizard" aria-hidden="true"></i>${esc(card.guardian)}</aside>` : "";
    const layer = this.#open(`${html}${guardian}`, "cda-overlay-card", card.title);
    if (flip && !reducedMotion()) {
      layer.querySelector(".cda-card")?.animate([
        { transform: "translateY(60px) scale(.7) rotateY(180deg)" },
        { transform: "translateY(-10px) scale(1.02) rotateY(90deg)", offset: 0.6 },
        { transform: "none" }
      ], { duration: 700, easing: "cubic-bezier(.22,.7,.2,1)" });
    }
  }

  static memory({ title, prompt, followUp }) {
    this.#open(`<div class="cda-overlay-paper"><span class="cda-kicker">${esc(game.i18n.localize("CdA.Memory.Kicker"))}</span>
      <h2>${esc(title)}</h2><blockquote>${esc(prompt)}</blockquote>${followUp ? `<p class="cda-follow">${esc(followUp)}</p>` : ""}</div>`, "cda-overlay-memory", title);
  }

  static epilogue(scenario, { key, text }) {
    if (!scenario) return;
    const cover = scenario.system.cover || scenario.img;
    this.#open(`<div class="cda-overlay-epilogue" style="--cover:${esc(cssUrl(cover))}">
      <span class="cda-kicker">${esc(game.i18n.localize("CdA.Game.Epilogue"))} · ${esc(game.i18n.localize(`CdA.Epilogue.${key}`))}</span>
      <h2>${esc(scenario.name)}</h2><p>${esc(text)}</p></div>`, `cda-overlay-final ${key}`, scenario.name);
  }
}
