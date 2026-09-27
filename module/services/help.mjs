import { SYSTEM_ID } from "../constants.mjs";
const HELP = {
  spirit: ["Espíritu", "Tu equilibrio emocional y físico. Cuando se extingue, el relato cobra un precio muy alto."],
  determination: ["Determinación", "La voluntad de seguir adelante. Puedes consumirla para inclinar a tu favor una prueba difícil."],
  deck: ["Mazo de Ánimas", "Cada carta abre una nueva escena. El reverso oculta pistas, obstáculos, percances o una Dama Gris."],
  gray: ["Damas Grises", "Tres umbrales de tensión. Cada aparición endurece el relato y la tercera conduce al epílogo."],
  truth: ["Verdad establecida", "Una afirmación que el protagonista ha hecho cierta durante la ficción. Más adelante puede ser matizada o contradicha."],
  memory: ["Recuerdo", "Una pregunta sobre el pasado. No busca una respuesta correcta: busca descubrir quién era el personaje."],
  diary: ["Diario", "El relato conserva automáticamente sus escenas. Puedes editarlo y exportarlo al terminar."],
  number: ["Carta numérica", "Revela un valor del 1 al 10. Si iguala o supera la dificultad modificada, superas el obstáculo."]
};

export class RichHelp {
  static #tip; static #timer;
  static init() {
    document.addEventListener("pointerover", e => this.#schedule(e.target.closest?.("[data-mr-help]")));
    document.addEventListener("pointerout", e => { if (e.target.closest?.("[data-mr-help]")) this.hide(); });
    document.addEventListener("contextmenu", e => {
      const target = e.target.closest?.("[data-mr-help]"); if (!target) return;
      e.preventDefault(); this.show(target, true);
    });
  }
  static #schedule(target) {
    if (!target || !game.settings.get(SYSTEM_ID, "richHelp")) return;
    clearTimeout(this.#timer); this.#timer = setTimeout(() => this.show(target), 650);
  }
  static show(target, pinned = false) {
    clearTimeout(this.#timer); this.hide();
    const key = target.dataset.mrHelp; const data = HELP[key]; if (!data) return;
    const el = document.createElement("aside"); el.className = `cda-rich-help${pinned ? " pinned" : ""}`;
    el.innerHTML = `<strong>${data[0]}</strong><p>${data[1]}</p>${pinned ? '<small>Clic para cerrar</small>' : ''}`;
    document.body.append(el); this.#tip = el;
    const r = target.getBoundingClientRect(), w = 320;
    el.style.left = `${Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2))}px`;
    el.style.top = `${Math.min(window.innerHeight - el.offsetHeight - 12, r.bottom + 10)}px`;
    if (pinned) el.addEventListener("click", () => this.hide(), { once: true });
  }
  static hide() { clearTimeout(this.#timer); this.#tip?.remove(); this.#tip = null; }
}
