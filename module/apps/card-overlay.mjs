import { SYSTEM_ID } from "../constants.mjs";
const wait = ms => new Promise(r => setTimeout(r, ms));
export class CardOverlay {
  static async #show(html, classes = "") {
    document.querySelector(".cda-card-overlay")?.remove();
    const reduced = game.settings.get(SYSTEM_ID, "reducedMotion");
    const layer = document.createElement("div"); layer.className = `cda-card-overlay ${classes}`; layer.tabIndex = -1;
    layer.innerHTML = `<div class="cda-overlay-scrim"></div><div class="cda-overlay-card">${html}<button type="button" class="cda-overlay-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>`;
    if (game.settings.get(SYSTEM_ID, "tableParticles") && !reduced) layer.insertAdjacentHTML("beforeend", Array.from({ length: 18 }, (_, i) => `<i class="cda-mote" style="--i:${i};--x:${8 + (i * 37 % 84)}%;--d:${5 + i % 6}s"></i>`).join(""));
    document.body.append(layer); requestAnimationFrame(() => layer.classList.add("visible"));
    const close = async () => { layer.classList.remove("visible"); await wait(reduced ? 0 : 220); layer.remove(); };
    layer.querySelector(".cda-overlay-close").addEventListener("click", close); layer.querySelector(".cda-overlay-scrim").addEventListener("click", close);
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { document.removeEventListener("keydown", esc); close(); } });
    return layer;
  }
  static showCard(card) {
    const face = card.currentFace ?? card.faces?.[0];
    return this.#show(`<img class="cda-overlay-art" src="${face?.img || card.img}" alt=""><div class="cda-overlay-copy"><span class="eyebrow">${game.i18n.localize("CdA.Overlay.Event")}</span><h2>${foundry.utils.escapeHTML(face?.name || card.name)}</h2><p>${foundry.utils.escapeHTML(face?.text || "")}</p></div>`, "event");
  }
  static showNumber(card, difficulty, bonus = 0) {
    return this.#show(`<img class="cda-overlay-art number" src="${card.currentFace?.img || card.img}" alt=""><div class="cda-overlay-copy compact"><span class="eyebrow">${game.i18n.localize("CdA.Overlay.Number")}</span><h2>${card.value ?? card.name}</h2><p>${game.i18n.localize("CdA.Overlay.Difficulty")} ${difficulty}${bonus ? ` · +${bonus} Determinación` : ""}</p></div>`, "number");
  }
  static showEpilogue(scenario, text, tone) {
    return this.#show(`<img class="cda-overlay-art epilogue-art" src="${scenario.system.cover || scenario.img}" alt=""><div class="cda-overlay-copy"><span class="eyebrow">${game.i18n.localize("CdA.Overlay.Epilogue")}</span><h2>${foundry.utils.escapeHTML(scenario.name)}</h2><p>${foundry.utils.escapeHTML(text)}</p></div>`, `epilogue ${tone}`);
  }
}
