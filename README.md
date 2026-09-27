<p align="center">
  <img src="docs/img/mesa.webp" alt="La Mesa de Ánimas en Foundry VTT" width="100%">
</p>

<h1 align="center">MR · Cuentos de Ánimas</h1>

<p align="center">
  <b>Una caja de relatos malditos encontrada en una vieja casa rural, convertida en sistema para Foundry VTT 13 y 14.</b><br>
  Cartas que se giran sobre madera · piedras frías de Espíritu · ámbar de Determinación · tres Damas Grises · un modo íntimo 1 + 1
</p>

<p align="center">
  <a href="https://github.com/ManuRomera/mr-cuentos-de-animas/releases/latest"><img alt="Última versión" src="https://img.shields.io/github/v/release/ManuRomera/mr-cuentos-de-animas?label=versi%C3%B3n&color=c49a57"></a>
  <img alt="Foundry VTT 13 · 14" src="https://img.shields.io/badge/Foundry-13%20%C2%B7%2014-2a1c13">
  <a href="https://manuromera.github.io/mr-cuentos-de-animas/"><img alt="Página del proyecto" src="https://img.shields.io/badge/p%C3%A1gina-GitHub%20Pages-8a2f3c"></a>
</p>

> Sistema **no oficial**. No incluye ni reproduce el texto, las cartas, las ilustraciones ni los escenarios de *Cuentos de Ánimas*. Si tienes el libro, puedes introducir su contenido en tu mundo, para uso privado, con el editor y el importador de escenarios.

## Instalación

En Foundry: **Sistemas de juego → Instalar sistema → URL del manifiesto**

```
https://github.com/ManuRomera/mr-cuentos-de-animas/releases/latest/download/system.json
```

Crea un mundo con **MR · Cuentos de Ánimas**. Al entrar como Guardián aparece un aviso pequeño con los accesos. La Mesa **nunca se abre sola**: está en los controles de escena (icono de luna), en los directorios de Actores y Objetos, en Ajustes y con **Mayús + M**.

## Qué hay dentro

| | |
|---|---|
| **Mesa de Ánimas** | Mesa física vista desde arriba: mazo, carta actual, descarte, tres huecos para las Damas Grises, piedras de Espíritu y ámbar de Determinación. La carta sale del mazo, viaja, gira y se asienta. |
| **Cartas** | Documentos *Cards* de Foundry como almacenamiento y sincronización; presentación propia. Pista, Obstáculo de entorno, Obstáculo de personaje, Percance, Dama Gris y carta numérica 1–10, cada familia con su marco, icono y nombre. |
| **Resolución** | Dificultad, carta revelada, Determinación gastada y resultado en la propia mesa, sincronizado para todos. +2 antes de revelar, +1 al empujar, repetir desde la segunda Dama. |
| **Damas Grises** | Tres umbrales de tensión: cada una pide su precio, endurece los obstáculos y enfría la mesa (niebla, sombra, desaturación). La tercera abre el epílogo. |
| **Mazo automático** | Tres bloques con una Dama en cada uno: *distribución clásica* o *Damas impredecibles*. El Guardián ve cuántas cartas quedan por bloque y si la Dama sigue dentro, nunca qué carta viene. |
| **A solas con el Guardián** | Verdades (establecida, dudosa, contradicha, reinterpretada, revelación pendiente, resuelta) con origen, autor, enlaces y notas ocultas; recuerdos y preguntas que el Guardián lanza a todos. |
| **Diario y Crónica** | Cada carta, resultado, verdad y epílogo se anota solo; el jugador escribe lo que sintió. Exporta a Markdown y HTML; la crónica estructurada se exporta en JSON. |
| **Escenarios** | Editor completo sin JSON (13 pestañas) y pestaña **En juego** para el Guardián. Biblioteca editorial con filtros, duplicar, variantes, exportar e importar con validación. |
| **Seguridad** | Pausa, Velo y Tarjeta X: inmediatas, sincronizadas y anónimas. |
| **Sonido** | Ambientes sintetizados sin archivos (hoguera, lluvia, viento, casa vieja, bosque, costa, tormenta, cinta magnética, silencio sobrenatural) y microefectos, con volúmenes separados. |
| **Accesibilidad** | Tamaño de texto, alto contraste, tipografía sencilla, espaciado, botones grandes, reducir movimiento (y `prefers-reduced-motion`), reducir efectos, lectura limpia, ayuda contextual. |
| **Mejoras MR** | Memoria de ventanas por usuario y mundo, siempre dentro de la pantalla; ayuda al detenerse sobre un elemento y ficha ampliada con clic derecho; español e inglés. |

## Escenarios originales incluidos

- **La voz que dejaste atrás** · 1 + Guardián · 90–150 min. Un piso que se vacía mañana, un magnetófono y siete cintas con tu nombre. No hay crimen que resolver: hay dos personas que necesitaron contarse una versión soportable de lo que pasó.
- **La casa que respira** · 1–4 jugadores · 45–70 min. Escenario corto para aprender la Mesa: robar, resolver, gastar Determinación, perder Espíritu y ver llegar una Dama Gris.

<p align="center">
  <img src="docs/img/guardian.webp" alt="La Mesa junto a la herramienta del Guardián" width="49%">
  <img src="docs/img/expediente.webp" alt="Expediente del protagonista" width="49%">
  <img src="docs/img/verdades.webp" alt="Verdades y Recuerdos" width="49%">
  <img src="docs/img/escenario.webp" alt="Editor de escenarios" width="49%">
</p>

## Si algo falla

El arranque va por fases aisladas: si una falla, Foundry sigue funcionando y aparece un aviso. Abre **Ajustes → MR · Cuentos de Ánimas → Diagnóstico** (o ejecuta `game.mrCuentosDeAnimas.diagnostic({ show: true })` en la consola), pulsa **Copiar** y pégalo en una [incidencia](https://github.com/ManuRomera/mr-cuentos-de-animas/issues).

## Arte

El arte actual es **provisional** y está generado por código. La lista de imágenes definitivas, con tamaños, encuadres y prompts, está en [`docs/ARTE.md`](docs/ARTE.md). Para incorporarlas basta con dejarlas en `art-inbox/` y ejecutar `python3 scripts/import-art.py`.

## Desarrollo

```bash
npm test        # reglas, estructura, imports, idiomas y seguridad de arranque
npm run check   # sintaxis, JSON y rutas de arte
npm run build   # dist/mr-cuentos-de-animas.zip + dist/system.json
```

- Una sola base de código para Foundry 13 y 14; las diferencias viven en `module/compat.mjs`.
- Reglas puras en `module/rules.mjs` (sin Foundry, probadas en Node). Si tu edición del libro usa otros valores, se cambian ahí.
- Publicar: subir la versión en `system.json`, `package.json` y `CHANGELOG.md`, y empujar la etiqueta `vX.Y.Z`. La acción **Publicar** crea la release con `system.json` y el zip.

## Créditos

- Diseño e implementación para Foundry VTT: **Manu Romera**.
- *Cuentos de Ánimas* pertenece a sus autores y editorial. Foundry Virtual Tabletop es de Foundry Gaming LLC. Este proyecto no está afiliado a ninguno de ellos. Ver [`NOTICE.md`](NOTICE.md).
- Licencia del código: [`LICENSE`](LICENSE).
