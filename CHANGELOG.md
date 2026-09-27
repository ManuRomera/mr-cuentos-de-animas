# Changelog

## 1.1.0 · 2026-09-27

**Arreglo crítico: pantalla negra.** Desde la 1.0.1 el módulo principal importaba `supportsV2`, que no existía en `compat.mjs`. El navegador rechazaba el sistema entero al cargarlo: sin modelos, fichas, mazos ni escena, el mundo quedaba en negro. Ahora una prueba compara cada import con los exports reales para que no vuelva a pasar.

### Arranque seguro
- Arranque en fases aisladas (modelos, ajustes, fichas, plantillas, apps, contenido, mazos, migración, escena, bienvenida): si una falla, avisa, se anota y Foundry sigue operativo.
- `game.mrCuentosDeAnimas.diagnostic()` y ventana **Diagnóstico** en Ajustes, con informe listo para copiar.
- La Mesa nunca se abre sola; solo con la preferencia explícita «Abrir la Mesa al entrar» (apagada por defecto).
- Un mundo sin escenas recibe la escena ambiental «Mesa de Ánimas» (1920×1080) sin abrir ninguna ventana.
- Aviso de bienvenida pequeño para el Guardián, con «No volver a mostrar».

### Mesa de Ánimas
- Rediseñada como mesa física: mazo, carta actual, descarte, tres huecos de Damas Grises, piedras de Espíritu y ámbar de Determinación.
- La carta sale del mazo, viaja, gira y se asienta; clic para ampliarla. Sin movimiento si se pide.
- Resolución de obstáculos dentro de la propia mesa y sincronizada: dificultad, carta revelada, Determinación gastada y resultado.
- Precio de la Dama Gris en la mesa; crescendo de niebla, frío y sombra con cada Dama; la interfaz se desatura con el Espíritu bajo.
- Grupo propio en los controles de escena (luna), botones en directorios y Ajustes, y atajo Mayús+M.

### Juego
- Motor de reglas puro y probado (`module/rules.mjs`): reparto 10 con mínimo 3, +2 antes de revelar, +1 al empujar, repetir desde la segunda Dama, dificultad creciente, epílogos por Espíritu.
- Preparación automática del mazo: distribución clásica o Damas impredecibles; rebarajar bloques; insertar cartas; adelantar Dama.
- **Guardián**: herramienta compacta con bloques del mazo (sin revelar cartas), escena actual, ambiente, recursos, verdades, recuerdos, notas y epílogos.
- **Verdades y Recuerdos**: estados establecida, dudosa, contradicha, reinterpretada, revelación pendiente y resuelta; cronología, origen, autor, enlaces y notas ocultas del Guardián.
- **Diario** automático con escritura narrativa, exportación a Markdown y HTML, y **Crónica** estructurada exportable (JSON) para reconstruir la sesión.
- Seguridad: Pausa, Velo y Tarjeta X anónimas y sincronizadas.
- Sonido sintetizado sin archivos: hoguera, lluvia, viento, casa vieja, bosque, costa, tormenta, cinta magnética y silencio sobrenatural, con volúmenes separados.

### Escenarios
- Editor completo sin JSON: Presentación, Personajes, Pistas, Obstáculos, Percances, Tensión, Damas Grises, Epílogos, Recuerdos, Verdades y contradicciones, Arte, Sonido y Configuración, más la pestaña **En juego** para el Guardián.
- Biblioteca editorial con filtros por modo y tono; duplicar, crear variante, exportar e importar con validación (un JSON incorrecto no toca el mundo).
- *La voz que dejaste atrás* ampliada: siete escenas, verdades preparadas con su contradicción y notas del Guardián. *La casa que respira* como escenario de aprendizaje.

### Accesibilidad e interfaz
- Tamaño de texto, alto contraste, tipografía sencilla, espaciado, botones grandes, reducir movimiento (y `prefers-reduced-motion`), reducir efectos, lectura limpia con tinta a elegir, ayuda contextual y sonido.
- Ayuda contextual: nota tras 1,2 s de hover, ficha ampliada con clic derecho; no interfiere con campos ni arrastres.
- Memoria de ventanas revalidada al abrir: si cambia el monitor, la ventana vuelve dentro de la pantalla.
- Todo el CSS limitado a las ventanas del sistema (prueba automática).
- Textos de interfaz completos en español e inglés.

### Arte
- Retirado todo el arte anterior: eran miniaturas con marca de agua de OpenArt y recortes rotos. Arte provisional generado por código hasta recibir el definitivo; la lista exacta de imágenes está en `docs/ARTE.md`.

## 1.0.2 · 2026-09-27

- Migración del ajuste antiguo que abría la Mesa al entrar.

## 1.0.1 · 2026-09-27

- Intento de arranque seguro y renovación visual (no llegó a cargar por el import roto).

## 1.0.0 · 2026-09-27

- Primera versión completa para Foundry VTT 13 y 14.
- Mesa de Ánimas con interfaz inmersiva propia sobre el backend nativo `Cards`.
- Protagonista con Espíritu y Determinación mediante contadores rituales.
- Mazo de eventos, mazo numérico 1–10 y tres Damas Grises.
- Preparación automática del mazo, variante de Damas aleatorias por tercio y resolución automatizada de obstáculos.
- Modos La Hoguera, El Diario, A solas con el Guardián y Relato libre.
- Editor y biblioteca visual de escenarios.
- Diario automático exportable a Markdown.
- Registro de verdades, dudas y contradicciones para juego 1+1.
- Preguntas de recuerdo enlazadas al escenario.
- Herramientas de seguridad sincronizadas: Pausa, Velo y Tarjeta X.
- Panel global de accesibilidad, alto contraste, lectura cómoda, escalado tipográfico y reducción de movimiento.
- Ayuda rica mediante hover prolongado y clic derecho.
- Memoria de posición, tamaño y scroll de ventanas por usuario y mundo.
- Microsonidos sintetizados sin archivos externos.
- Arte vectorial original, cartas, contadores y portada.
- Escenarios originales: **La voz que dejaste atrás** y **La casa que respira**.
- Página web de proyecto preparada para GitHub Pages.
- Build/validación y flujo automático de GitHub Releases.
