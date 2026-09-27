import { SYSTEM_ID } from "../constants.mjs";
/** Microsonidos sintetizados: sin assets externos ni dependencias. */
export class SoundService {
  static #ctx;
  static enabled() { return game.settings.get(SYSTEM_ID, "soundFx"); }
  static context() { return this.#ctx ??= new (window.AudioContext || window.webkitAudioContext)(); }
  static #tone(freq, duration, gain = 0.035, type = "sine", when = 0) {
    if (!this.enabled()) return;
    const ctx = this.context(); const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, ctx.currentTime + when); g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + when + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + duration);
    o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + when); o.stop(ctx.currentTime + when + duration + 0.02);
  }
  static card() { this.#tone(170, .09, .018, "triangle"); this.#tone(260, .08, .012, "sine", .04); }
  static stone() { this.#tone(720, .12, .018, "sine"); this.#tone(1040, .18, .010, "sine", .03); }
  static ember() { this.#tone(110, .16, .018, "sawtooth"); }
  static gray(index = 1) { this.#tone(64, .65, .028, "sine"); this.#tone(94 + index * 7, .85, .014, "triangle", .12); this.#tone(190, .35, .008, "sine", .32); }
  static success() { this.#tone(420, .16, .02, "sine"); this.#tone(620, .23, .016, "sine", .08); }
  static failure() { this.#tone(145, .24, .024, "triangle"); this.#tone(92, .34, .018, "sine", .08); }
}
