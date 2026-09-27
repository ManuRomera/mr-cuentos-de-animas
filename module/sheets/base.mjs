import { ActorSheetV2, HandlebarsApplicationMixin, ItemSheetV2 } from "../compat.mjs";
import { WithMemory } from "../memory.mjs";

/**
 * Listas editadas en formulario (`system.lista.3.campo`) llegan como objetos indexados.
 * Se fusionan con el array guardado para no perder los campos que la vista no muestra
 * (ids, fechas, notas del Guardián ocultas a los jugadores…).
 */
export function mergeLists(changes, source) {
  for (const [key, value] of Object.entries(changes ?? {})) {
    const original = source?.[key];
    if (Array.isArray(original) && value && typeof value === "object" && !Array.isArray(value)) {
      const merged = foundry.utils.deepClone(original);
      for (const [i, entry] of Object.entries(value)) {
        const n = Number(i);
        if (!Number.isInteger(n) || n < 0) continue;
        merged[n] = typeof entry === "object" && entry !== null ? foundry.utils.mergeObject(merged[n] ?? {}, entry, { inplace: false }) : entry;
      }
      changes[key] = merged;
    }
    else if (value && typeof value === "object" && !Array.isArray(value) && original && typeof original === "object") mergeLists(value, original);
  }
  return changes;
}

/** Campos de etiquetas escritos como «a, b, c». */
export const splitTags = text => String(text ?? "").split(",").map(s => s.trim()).filter(Boolean);

const SheetMixin = Base => class extends WithMemory(HandlebarsApplicationMixin(Base)) {
  static DEFAULT_OPTIONS = { classes: ["mr-cda", "cda-window", "cda-sheet"], form: { submitOnChange: true }, window: { resizable: true } };

  _processFormData(event, form, formData) {
    const data = super._processFormData(event, form, formData);
    if (data.system) mergeLists(data.system, this.document.system.toObject());
    return data;
  }

  /** Añadir y quitar entradas de cualquier lista con `data-list`. */
  async addEntry(list, entry) {
    const data = foundry.utils.deepClone(foundry.utils.getProperty(this.document.system, list) ?? []);
    data.push(entry);
    await this.document.update({ [`system.${list}`]: data });
  }
  async removeEntry(list, index) {
    const data = foundry.utils.deepClone(foundry.utils.getProperty(this.document.system, list) ?? []);
    data.splice(index, 1);
    await this.document.update({ [`system.${list}`]: data });
  }
  async moveEntry(list, index, delta) {
    const data = foundry.utils.deepClone(foundry.utils.getProperty(this.document.system, list) ?? []);
    const to = index + delta;
    if (to < 0 || to >= data.length) return;
    [data[index], data[to]] = [data[to], data[index]];
    await this.document.update({ [`system.${list}`]: data });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const el of this.element.querySelectorAll("[role=button][data-action]")) {
      el.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); el.click(); }
      });
    }
  }
};

export const BaseActorSheet = SheetMixin(ActorSheetV2);
export const BaseItemSheet = SheetMixin(ItemSheetV2);
