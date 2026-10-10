import { ASSETS } from "../constants.mjs";

/**
 * La escena de la Mesa cubre toda la pantalla. Foundry ajusta la escena «para que quepa» y deja
 * bandas si la pantalla no es 16:9; al cargar la escena de la Mesa se amplía lo justo para taparlas.
 */
export const isTableScene = scene => scene?.background?.src === ASSETS.scene;

/** Zoom que cubre `screen` con una escena de `scene` (el mayor de los dos cocientes). */
export const coverScale = (screen, scene) => Math.max(screen.width / scene.width, screen.height / scene.height);

function cover(canvas) {
  if (!canvas?.ready || !isTableScene(canvas.scene)) return;
  const rect = canvas.dimensions.sceneRect;
  canvas.pan({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, scale: coverScale(canvas.app.screen, rect) });
}

export function registerCover() {
  Hooks.on("canvasReady", canvas => setTimeout(() => cover(canvas), 50));
  globalThis.addEventListener("resize", () => cover(globalThis.canvas));
  // El primer lienzo se dibuja antes del hook `ready`: ya no habrá otro `canvasReady` hasta cambiar de escena.
  setTimeout(() => cover(globalThis.canvas), 50);
}
