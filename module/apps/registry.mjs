/**
 * Registro de ventanas del sistema. Cualquier botón abre cualquier ventana por nombre
 * (`data-action="open" data-app="diary"`) sin importar las clases entre sí.
 * Lo rellena el arranque; una ventana que no llegó a registrarse no rompe nada.
 */
export const Apps = {};

export function openApp(name, ...args) {
  const App = Apps[name];
  if (!App) { console.warn(`MR · Cuentos de Ánimas | ventana no disponible: ${name}`); return null; }
  return App.open(...args);
}

/** Repinta las ventanas abiertas del sistema que dependan del estado compartido. */
export function refreshApps() {
  for (const app of foundry.applications.instances.values()) {
    if (app.rendered && app.constructor.LIVE) app.render();
  }
}
