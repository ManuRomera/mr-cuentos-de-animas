import { get } from "../settings.mjs";

/**
 * Sonido sin archivos ni módulos: ambientes y microefectos sintetizados con Web Audio.
 * Volúmenes independientes (ambiente / efectos) por usuario.
 * Un escenario puede indicar una ruta de audio en lugar de un ambiente sintetizado.
 */
export const AMBIENTS = ["fire", "rain", "wind", "house", "forest", "coast", "storm", "tape", "silence"];

export class SoundService {
  static #ctx; static #sfx; static #amb; static #noise = {};
  static #current = { key: "", nodes: [], timers: [], gain: null, audio: null };

  static get enabled() { return Boolean(get("soundFx")); }

  static #context() {
    if (!this.#ctx) {
      const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Ctx) return null;
      this.#ctx = new Ctx();
      this.#sfx = this.#ctx.createGain(); this.#sfx.connect(this.#ctx.destination);
      this.#amb = this.#ctx.createGain(); this.#amb.connect(this.#ctx.destination);
      this.volumes();
    }
    if (this.#ctx.state === "suspended") this.#ctx.resume().catch(() => {});
    return this.#ctx;
  }

  /** Los navegadores solo permiten audio tras un gesto: se reanuda al primer clic. */
  static init() {
    document.addEventListener("pointerdown", () => { if (this.#ctx?.state === "suspended") this.#ctx.resume(); }, { passive: true });
  }

  static volumes() {
    if (!this.#ctx) return;
    const t = this.#ctx.currentTime;
    this.#sfx.gain.setTargetAtTime(this.enabled ? Number(get("sfxVolume")) : 0, t, 0.05);
    this.#amb.gain.setTargetAtTime(this.enabled ? Number(get("ambientVolume")) : 0, t, 0.4);
    if (this.#current.audio) this.#current.audio.volume = this.enabled ? Number(get("ambientVolume")) : 0;
  }

  static #noiseBuffer(color = "white") {
    const ctx = this.#ctx;
    if (this.#noise[color]) return this.#noise[color];
    const length = ctx.sampleRate * 3, buffer = ctx.createBuffer(1, length, ctx.sampleRate), data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (color === "brown") { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5; }
      else if (color === "pink") { last = 0.97 * last + 0.03 * white; data[i] = (last * 6 + white * 0.25) * 0.5; }
      else data[i] = white;
    }
    return this.#noise[color] = buffer;
  }

  static #source(color, dest) {
    const src = this.#ctx.createBufferSource();
    src.buffer = this.#noiseBuffer(color); src.loop = true; src.connect(dest); src.start();
    return src;
  }
  static #filter(type, frequency, Q = 0.7) {
    const f = this.#ctx.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = Q; return f;
  }
  static #gain(value) { const g = this.#ctx.createGain(); g.gain.value = value; return g; }
  static #lfo(param, rate, depth) {
    const o = this.#ctx.createOscillator(), g = this.#gain(depth);
    o.frequency.value = rate; o.connect(g).connect(param); o.start();
    return [o, g];
  }
  static #chain(...nodes) { for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]); return nodes; }

  /* ------------------------------------------ */
  /*  Ambientes                                 */
  /* ------------------------------------------ */

  static #build(key, out) {
    const nodes = [], timers = [], ctx = this.#ctx;
    const noise = (color, ...chain) => { const g = chain.at(-1); this.#chain(...chain, out); nodes.push(this.#source(color, chain[0]), ...chain); return g; };
    const every = (min, max, fn) => {
      const tick = () => { fn(); timers.push(setTimeout(tick, min + Math.random() * (max - min))); };
      timers.push(setTimeout(tick, min));
    };
    const burst = (color, freq, dur, level, type = "bandpass") => {
      const src = ctx.createBufferSource(), f = this.#filter(type, freq, 1.2), g = this.#gain(0), t = ctx.currentTime;
      src.buffer = this.#noiseBuffer(color); this.#chain(src, f, g, out);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t, Math.random() * 2); src.stop(t + dur + 0.05);
    };
    const creak = () => {
      const o = ctx.createOscillator(), f = this.#filter("bandpass", 300, 8), g = this.#gain(0), t = ctx.currentTime, d = 0.6 + Math.random() * 0.9;
      o.type = "sawtooth"; o.frequency.setValueAtTime(70 + Math.random() * 40, t); o.frequency.linearRampToValueAtTime(55 + Math.random() * 30, t + d);
      this.#chain(o, f, g, out);
      g.gain.linearRampToValueAtTime(0.05, t + d * 0.3); g.gain.linearRampToValueAtTime(0, t + d);
      o.start(t); o.stop(t + d + 0.05);
    };
    const wind = level => {
      const f = this.#filter("bandpass", 420, 0.9), g = this.#gain(level);
      noise("pink", f, g);
      nodes.push(...this.#lfo(f.frequency, 0.07, 260), ...this.#lfo(g.gain, 0.11, level * 0.6));
    };
    const rain = level => noise("white", this.#filter("highpass", 900), this.#filter("lowpass", 7000), this.#gain(level));

    switch (key) {
      case "fire":
        noise("brown", this.#filter("lowpass", 380), this.#gain(0.55));
        every(60, 420, () => burst("white", 2200 + Math.random() * 3000, 0.03 + Math.random() * 0.05, 0.25 * Math.random()));
        break;
      case "rain": rain(0.16); noise("brown", this.#filter("lowpass", 200), this.#gain(0.2)); break;
      case "wind": wind(0.5); break;
      case "house":
        noise("brown", this.#filter("lowpass", 110), this.#gain(0.4));
        every(7000, 19000, creak);
        break;
      case "forest":
        wind(0.22); noise("pink", this.#filter("highpass", 2500), this.#gain(0.03));
        every(3000, 9000, () => burst("white", 3500, 0.12, 0.05));
        break;
      case "coast": {
        const g = this.#gain(0.35);
        noise("pink", this.#filter("lowpass", 1300), g);
        nodes.push(...this.#lfo(g.gain, 0.09, 0.3));
        break;
      }
      case "storm":
        rain(0.2);
        every(9000, 22000, () => burst("brown", 60, 3.5, 0.9, "lowpass"));
        break;
      case "tape": {
        noise("white", this.#filter("highpass", 3500), this.#gain(0.025));
        const hum = ctx.createOscillator(), g = this.#gain(0.015); hum.frequency.value = 50; this.#chain(hum, g, out); hum.start(); nodes.push(hum, g);
        every(4000, 12000, () => burst("white", 1200, 0.04, 0.06));
        break;
      }
      case "silence": {
        // Silencio sobrenatural: dos tonos graves casi iguales que laten muy despacio.
        for (const hz of [55, 55.35]) { const o = ctx.createOscillator(), g = this.#gain(0.05); o.frequency.value = hz; this.#chain(o, g, out); o.start(); nodes.push(o, g); }
        break;
      }
    }
    return { nodes, timers };
  }

  /** Cambia el ambiente con un fundido. `key` puede ser un ambiente sintetizado o una ruta de audio. */
  static setAmbient(key = "") {
    if (key === this.#current.key) return;
    this.#stopAmbient();
    this.#current.key = key;
    if (!key || !this.enabled) return;
    if (!AMBIENTS.includes(key)) {
      const audio = new Audio(key); audio.loop = true; audio.volume = Number(get("ambientVolume"));
      audio.play().catch(() => {});
      this.#current.audio = audio;
      return;
    }
    const ctx = this.#context(); if (!ctx) return;
    const gain = this.#gain(0); gain.connect(this.#amb);
    gain.gain.setTargetAtTime(1, ctx.currentTime, 1.2);
    Object.assign(this.#current, this.#build(key, gain), { gain });
  }

  static #stopAmbient() {
    const { nodes, timers, gain, audio } = this.#current;
    timers.forEach(clearTimeout);
    audio?.pause();
    if (gain && this.#ctx) {
      gain.gain.setTargetAtTime(0, this.#ctx.currentTime, 0.4);
      setTimeout(() => { for (const n of nodes) { try { n.stop?.(); } catch {} n.disconnect(); } gain.disconnect(); }, 2000);
    }
    this.#current = { key: "", nodes: [], timers: [], gain: null, audio: null };
  }

  /** Aplica de nuevo el ajuste on/off (si se apaga, calla; si se enciende, vuelve el ambiente del relato). */
  static refresh(stateAmbient) {
    this.volumes();
    const key = this.#current.key;
    if (!this.enabled) return this.#stopAmbient();
    if (stateAmbient !== undefined && stateAmbient !== key) this.setAmbient(stateAmbient);
    else if (key && !this.#current.gain && !this.#current.audio) { this.#current.key = ""; this.setAmbient(key); }
  }

  /* ------------------------------------------ */
  /*  Efectos                                   */
  /* ------------------------------------------ */

  static #tone(freq, duration, level = 0.05, type = "sine", when = 0, endFreq) {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + when;
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(level, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g).connect(this.#sfx); o.start(t); o.stop(t + duration + 0.05);
  }
  static #rub(freq, duration, level, when = 0) {
    const ctx = this.#context(); if (!ctx || !this.enabled) return;
    const src = ctx.createBufferSource(), f = this.#filter("bandpass", freq, 0.8), g = this.#gain(0), t = ctx.currentTime + when;
    src.buffer = this.#noiseBuffer("white"); this.#chain(src, f, g, this.#sfx);
    g.gain.linearRampToValueAtTime(level, t + duration * 0.3); g.gain.linearRampToValueAtTime(0, t + duration);
    src.start(t, Math.random()); src.stop(t + duration + 0.05);
  }

  static draw() { this.#rub(2600, 0.22, 0.12); this.#rub(1400, 0.12, 0.06, 0.16); }
  static flip() { this.#rub(3200, 0.07, 0.1); this.#tone(180, 0.09, 0.05, "triangle", 0.05); }
  static place() { this.#tone(120, 0.12, 0.08, "triangle"); this.#rub(700, 0.08, 0.05); }
  static stone() { this.#tone(1320, 0.5, 0.05); this.#tone(1980, 0.35, 0.025, "sine", 0.02); this.#tone(160, 0.1, 0.06, "triangle"); }
  static crystal() { this.#tone(2100, 0.9, 0.03); this.#tone(2650, 0.7, 0.02, "sine", 0.05); }
  static ember() { this.#rub(4000, 0.05, 0.08); this.#rub(2500, 0.05, 0.06, 0.07); this.#tone(90, 0.3, 0.04, "sine"); }
  static gray(index = 1) {
    this.#tone(55, 2.2, 0.08 + index * 0.02, "sine", 0, 48);
    this.#tone(82.4 + index * 3, 2.6, 0.03 + index * 0.01, "triangle", 0.3);
    this.#rub(500, 2.5, 0.03 + index * 0.02, 0.2);
  }
  static success() { this.#tone(392, 0.35, 0.04); this.#tone(587, 0.5, 0.03, "sine", 0.1); }
  static failure() { this.#tone(146, 0.6, 0.05, "triangle", 0, 110); }
}
