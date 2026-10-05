# Changelog

## 2.0.1 · 2026-10-05

- Añadido el botón «Créditos» en los ajustes del paquete (Manu Romera · Digital RPG Design). No cambia el juego.

## 2.0.0 · 2026-10-03 · candidata pendiente de prueba multicliente

### Dirigido y experiencia de dirección
- Nuevo modo **Dirigido**, cabina **Ahora**, rotación sugerida y selector manual de narrador.
- Tarjetas privadas persistentes con título, texto, imagen y tipo de carta; whisper nativo GM + jugador, acuse de apertura y reenvíos, sin depender de MR Telegram.
- Un cambio de opción por escena; decisiones mecánicas del narrador; revelación anticipada o al finalizar la narración.
- Texto libre y handouts privados desde la cabina y controles anteriores.
- Epílogo calculado por Espíritu bajo control GM: leer, enviar a un jugador o revelar a todos.
- publicSynopsis opcional y compatible con escenarios existentes; introducción y escenas preparadas reservadas en Dirigido.

### Permisos y correcciones
- Mazos en observador y peticiones verificadas ejecutadas por GM, vinculadas a sesión, turno, fase y entrega.
- Permisos temporales del protagonista/escenario en Dirigido, con respaldo y restauración.
- Verdades ocultas, notas, Recuerdos desconocidos e historial privado separados de los documentos públicos mediante registros solo GM.
- Recursos del precio de Dama limitados a una lista cerrada; publicación y diario deduplicados.
- ES/EN y plantillas del estilo existente. Los modos normales conservan la información narrativa pública.

### Validación y alcance
- Nuevas pruebas automatizadas de autoridad, entrega, cambio único, reenvío, revelación y final; comprobaciones de estructura, idiomas y sintaxis.
- Compatible en manifiesto con Foundry 13/14; **pendiente de prueba visual y multicliente real**, especialmente v14.
- La privacidad se ajusta a los whispers nativos: no se garantiza cifrado frente a clientes hostiles. Registros y respaldos requieren conservar el chat.
- Guía y auditoría: [DIRIGIDO](docs/DIRIGIDO.md), [AUDIT-2.0](docs/AUDIT-2.0.md).

## 1.4.1 · 2026-09-27

### Correcciones
- El reparto de Espíritu y Determinación ya no queda bloqueado: las flechas del expediente funcionan siempre, también en pleno relato (entonces mueven el punto sin rellenar lo ya gastado), y nunca se salen de las reglas (10 en total, 3‑7 en cada uno).
- *Nuevo relato* respeta el reparto del protagonista elegido: ya no lo devuelve a 5/5 al cambiar de escenario ni al empezar.

## 1.4.0 · 2026-09-27

### Creación de protagonistas
- **Reparto tutorizado**: en el expediente ya no se escriben los máximos a mano. Unas flechas mueven un punto entre Espíritu y Determinación sin salir nunca de las reglas (10 en total, entre 3 y 7 en cada uno). Si un protagonista antiguo tiene un reparto imposible, se avisa y se corrige con un clic.
- **Lista de lo que falta**: mientras el protagonista no está completo, el expediente enseña qué pide el libro y aún no tiene (profesión, origen, descripción física, historial, cuatro rasgos u objetos, reparto).
- **Protagonista al azar**: un botón en el expediente, en *Nuevo relato* y en el aviso de bienvenida crea un protagonista completo y válido: 120 nombres, 77 apellidos, 60 profesiones con sus objetos, 50 procedencias, miles de descripciones e historiales, 45 rasgos, 40 recuerdos y 40 epítetos. Cada campo tiene su dado para volver a tirar solo ese.
- En *Nuevo relato*, al elegir un protagonista ya hecho el reparto parte del suyo.

### Correcciones
- El **Percance** ya no mezcla listas: si el escenario trae percances propios se elige el percance; si no, el personaje secundario que lo sufre, con la pregunta adecuada en cada caso.
- Al empezar un relato nuevo, las escenas del anterior ya no aparecen como «ya usadas».
- «Abrir la Mesa al entrar» fallaba (`trap returned falsish for property 'top'`) cuando la ventana recordada estaba pegada al borde superior o izquierdo.
- La ayuda del Espíritu decía que quedarse a 0 terminaba el relato; no es así.

## 1.3.0 · 2026-09-27

### Arte final
- **Arte definitivo del estilo fotográfico**: mesa, escena de bienvenida, portada del sistema, logo, reverso y reverso numérico, las cuatro familias de cartas, las tres Damas Grises (cada vez más cerca), piedras de Espíritu y ámbar de Determinación (encendidos y apagados), fondo de las cartas numéricas, retrato por defecto y portadas de *La voz que dejaste atrás* y *La casa que respira*.
- **Handouts de *La voz que dejaste atrás***: el magnetófono y las siete cintas, la fotografía, la llave, la carta sin enviar, la puerta del fondo y la cinta sin etiqueta, enlazados a sus escenas (pestaña «En juego» → Mostrar handout). Los mundos ya creados los reciben al actualizar.
- Retirado el generador de arte provisional.

## 1.2.0 · 2026-09-27

### Reglas, ahora fieles al libro
- **Mazo de Cartas de Evento genérico**, como el del libro: 4 Pistas, 4 Percances de Personaje, 4 Obstáculos de Entorno y 4 de Personaje con su dificultad impresa (4‑7), y 3 Damas Grises.
- **Preparación**: montones de 6, 6 y 4 cartas, cada uno sobre su Dama; variante de Damas impredecibles; partidas cortas quitando una o dos cartas de cada tipo.
- **Elegir la escena**: al revelar una carta, la Mesa muestra la lista del escenario (pistas, obstáculos de entorno o de personaje, o el personaje que sufre el percance) y se elige una o se escribe otra. Las usadas quedan marcadas.
- **Una sola Determinación por obstáculo**: +2 antes de revelar, o después +1 o repetir (esto último con dos Damas en juego).
- El Espíritu a 0 **no** corta el relato: solo la tercera Dama lleva al epílogo. Si no quedan contadores, la Dama no cobra precio.
- **Tabla de Espíritu‑Epílogo** por rangos, como en los escenarios del libro («dos o más», «uno», «ninguno»…).
- La Hoguera: la Mesa indica qué jugador narra cada escena.

### Mesa de Ánimas
- **El relato siempre a la vista**: columna derecha con la **Sinopsis** para releer, las **Pistas halladas** (fuera del descarte, ampliables) y la **Tensión** revelada. Se puede plegar.
- La escena elegida aparece en una **hoja de papel bajo la carta** y queda escrita en la carta (también en el descarte y al ampliarla).
- **Estilo «Clásico»**: las cartas oficiales del libro (reverso, eventos, numéricas y contadores E/D), nítidas y con su color original. Cada usuario elige su estilo en Configurar ajustes.

### Escenarios
- **Colección incluida: 34 escenarios** de distribución libre (Folclore Rol Jam 2022, Escenarios fanmade, Cuento de Navidad, Desvelos del pasado, Grabación en vivo y Cima), con su autoría y procedencia. En la Biblioteca, pestaña *Colección incluida* → *Añadir y jugar*.
- **Importador documentado**: ventana *Cómo importar* con la especificación exacta, plantilla descargable y un **prompt listo para pegar en una IA**. Importa uno o muchos escenarios por archivo y explica, escenario a escenario, qué falta en los que no pasan. Guía completa en `docs/IMPORTAR.md`.
- Editor: tabla de epílogo por filas; procedencia y licencia; las listas ya no llevan dificultad (la trae la carta).

### Arreglos
- Los iconos de los botones de cabecera (cerrar, minimizar…) de las ventanas del sistema no se veían: el estilo de botones pisaba la fuente de iconos de Foundry. Con prueba automática para que no vuelva.
- La nota de ayuda ya no se queda flotando si el elemento se repinta bajo el ratón.

### Arte
- `docs/ARTE.md` actualizado: qué imágenes necesita el estilo fotográfico y la proporción real de las cartas (900×1275).

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
