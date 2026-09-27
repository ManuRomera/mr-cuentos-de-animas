/** Memoria local de geometría, pestañas, secciones y scroll por usuario/mundo. */
const PREFIX = "mr-cda.window.";
const FIELDS = ["left", "top", "width", "height"];
const key = id => `${PREFIX}${game.world?.id}.${game.user?.id}.${id}`;

export function readMemory(id) {
  try { return JSON.parse(localStorage.getItem(key(id))) ?? {}; }
  catch { return {}; }
}
function writeMemory(id, patch) {
  try { localStorage.setItem(key(id), JSON.stringify({ ...readMemory(id), ...patch })); }
  catch (error) { console.warn("MR · Cuentos de Ánimas | memoria", error); }
}
const numeric = (pos, fields = FIELDS) => Object.fromEntries(fields.filter(f => Number.isFinite(pos?.[f])).map(f => [f, Math.round(pos[f])]))

function safeGeometry(pos = {}) {
  const out = { ...pos };
  const vw = Math.max(640, globalThis.innerWidth || 1920);
  const vh = Math.max(480, globalThis.innerHeight || 1080);
  if (Number.isFinite(out.width)) out.width = Math.min(out.width, Math.max(420, vw - 140));
  if (Number.isFinite(out.height)) out.height = Math.min(out.height, Math.max(360, vh - 120));
  if (Number.isFinite(out.left)) out.left = Math.max(0, Math.min(out.left, vw - 120));
  if (Number.isFinite(out.top)) out.top = Math.max(0, Math.min(out.top, vh - 80));
  return out;
}

export function clearWindowMemory() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k);
  }
}

export function WithMemory(Base) {
  return class extends Base {
    static MEMORY_FIELDS = FIELDS;
    constructor(options = {}) {
      const C = new.target;
      const id = options.memory ?? options.document?.uuid ?? C.MEMORY ?? C.name;
      const saved = readMemory(id);
      const inherited = saved.position ? {} : numeric(readMemory(`class.${C.name}`).position, ["width", "height"]);
      super({ ...options, position: safeGeometry({ ...options.position, ...inherited, ...numeric(saved.position, C.MEMORY_FIELDS) }) });
      this._mrMemory = { id, sections: saved.sections ?? {}, scroll: saved.scroll ?? {} };
      if (saved.tabs) Object.assign(this.tabGroups, saved.tabs);
    }
    _onPosition(position) {
      super._onPosition?.(position);
      if (!this.rendered) return;
      clearTimeout(this._mrMemory.timer);
      this._mrMemory.timer = setTimeout(() => this.#savePosition(), 180);
    }
    #savePosition() {
      const fields = this.minimized ? ["left", "top"] : this.constructor.MEMORY_FIELDS;
      const pos = numeric(this.position, fields);
      writeMemory(this._mrMemory.id, { position: { ...readMemory(this._mrMemory.id).position, ...pos } });
      if (!this.minimized) writeMemory(`class.${this.constructor.name}`, { position: numeric(this.position, ["width", "height"]) });
    }
    changeTab(tab, group, options) {
      super.changeTab(tab, group, options);
      writeMemory(this._mrMemory.id, { tabs: { ...this.tabGroups } });
    }
    sectionOpen(id, fallback = true) { return this._mrMemory.sections[id] ?? fallback; }
    async _onRender(context, options) {
      await super._onRender(context, options);
      for (const d of this.element.querySelectorAll("details[data-memory]")) {
        d.addEventListener("toggle", () => {
          this._mrMemory.sections[d.dataset.memory] = d.open;
          writeMemory(this._mrMemory.id, { sections: this._mrMemory.sections });
        });
      }
      if (options.isFirstRender) {
        for (const [selector, top] of Object.entries(this._mrMemory.scroll)) {
          const el = this.element.querySelector(selector);
          if (el) el.scrollTop = top;
        }
      }
    }
    async close(options) {
      if (this.rendered) {
        const scroll = {};
        for (const selector of this.constructor.SCROLL_MEMORY ?? []) {
          const el = this.element.querySelector(selector);
          if (el) scroll[selector] = el.scrollTop;
        }
        this.#savePosition();
        writeMemory(this._mrMemory.id, { scroll });
      }
      return super.close(options);
    }
  };
}
