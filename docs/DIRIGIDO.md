# Modo Dirigido · 2.0

El Director controla las opciones narrativas; el narrador conserva las decisiones mecánicas. Los modos Guardián, Hoguera, Diario y Libre siguen mostrando las opciones y escenas públicamente.

## Una escena

1. El GM empieza un relato en **Dirigido**. El escenario conserva su sinopsis original: el campo **Sinopsis pública** permite escribir una presentación sin spoilers; si está vacío se usa el gancho. La introducción y las escenas preparadas no aparecen automáticamente en la Mesa de jugadores.
2. El GM roba. La cabina **Ahora** propone el siguiente narrador entre los jugadores conectados, muestra la carta, el estado pendiente y la siguiente acción. El selector permite elegir también a un jugador desconectado.
3. El GM elige una opción o escribe una escena personalizada. Las notas `guardian` y los secretos de personajes quedan en el contexto del GM. La tarjeta privada incluye título, texto, imagen si existe y tipo de carta.
4. El narrador recibe una ventana propia y un whisper a GM + destinatario. La tarjeta se puede volver a abrir desde el chat y la Mesa; tras reconectar se recupera la última entrega de esa sesión. No hace falta MR Telegram.
5. El narrador resuelve en la Mesa: gastar Determinación, revelar la carta numérica, empujar, repetir o aceptar el fallo, según las reglas existentes. El GM puede asistir desde su cliente.
6. **Pedir cambio** consume la única petición de la escena. El GM elige otra opción; el cambio no reinicia cartas numéricas, recursos gastados ni resultados mecánicos. No se permite pedirlo después de hacer pública la escena.
7. **Revelar a todos** publica la escena elegida pero mantiene abierta la narración. **Finalizar narración** la publica y permite pasar a la siguiente carta; exige haber resuelto el obstáculo.

Las Damas Grises y su tensión mantienen su presentación pública. Su precio lo elige el narrador o el GM.

## Entregas y final

La cabina permite enviar texto libre, elegir un handout, reenviar una entrega o mostrarla a todos. Cambiar el narrador de una escena abierta entrega la misma tarjeta al nuevo jugador y traslada el control mecánico. El receptor anterior conserva su whisper: un reenvío no borra lo que ya ha leído.

En el epílogo, el GM ve la tabla y la fila correspondiente al Espíritu. Puede **leer él mismo**, enviarla a un jugador o revelarla a todos. El primer final seleccionado queda fijado para los reenvíos; no se publica automáticamente al cambiar de fase. Solo el final público se añade al diario y al historial compartido.

Los estados de entrega son deliberadamente modestos: **enviado**, **destinatario conectado**, **tarjeta abierta**. Estar conectado no certifica recepción ni lectura del texto.

## Permisos, persistencia y recuperación

- Los mazos pasan a observador para jugadores: las escrituras sensibles las ejecuta el GM a partir de peticiones verificadas. Se necesita un GM conectado también para las acciones normales que cambian la partida.
- En Dirigido, el protagonista pasa temporalmente a observador para evitar modificar recursos directamente. El escenario queda sin acceso desde sus hojas de jugador. Los permisos originales se guardan en mensajes solo GM y se restauran al cerrar o iniciar otra partida.
- Las Verdades ocultas, las notas de Verdades y los Recuerdos no conocidos se guardan en un registro de chat solo GM, separado del Actor público. La migración conserva los datos; no los borra sin respaldo. Los mensajes del registro y los respaldos de permisos forman parte de la persistencia: no limpiar el chat durante una partida sin una copia del mundo.
- Una petición se vincula a sesión, turno, fase y entrega. Se comprueba el usuario creador del documento y su autor; solo el narrador actual puede solicitar decisiones dirigidas. Se rechazan peticiones antiguas y repetidas. Un único GM conectado procesa las peticiones.
- Las peticiones pendientes no se repiten automáticamente tras desconectar: pulsar de nuevo cuando vuelva el GM.

## Alcance de privacidad

Dirigido protege el misterio en la experiencia normal de Foundry: hojas, Mesa, overlays, diario, historial y chat visible. Usa whispers nativos y no difunde el contenido mediante el socket del sistema.

Esto **no es cifrado ni aislamiento frente a un jugador que inspeccione el navegador o los archivos del sistema**. La inspección del backend instalado de Foundry 13.351 muestra que las modificaciones de documentos se retransmiten a los clientes; los permisos y el whisper controlan acceso funcional y presentación, pero no deben tratarse como una garantía criptográfica. Los escenarios incluidos son además archivos públicos. Una confidencialidad frente a clientes hostiles necesitaría almacenamiento y transporte cifrados o soporte en el servidor; no se promete en 2.0.

Antes de publicar 2.0, completar la prueba multicliente de `AUDIT-2.0.md` en copias del mundo para Foundry 13 y 14.

## English quick guide

Start a **Directed** story as GM. The **Now** panel suggests the next connected narrator and lets the GM override the selection. Only the GM sees narrative options; the narrator gets the selected scene as a persistent private card and native whisper. Guardian notes are excluded from the player payload.

The narrator keeps mechanical decisions at the Table, can request one scene change, can reveal the scene early, or finish narration after resolving mechanics. A change preserves spent resources and numeric results. The GM can send free text and handouts, forward deliveries, and choose the epilogue recipient or read it privately. Normal modes retain public narrative options. Native whispers provide normal Foundry privacy, not encryption against hostile browser clients. Live v13/v14 verification remains required before release.
