# Auditoría UX, privacidad y permisos · candidata 2.0.0

Fecha: 2026-10-03. Base: 1.4.1, commit `f9275b6a420d3caf7de01720fc8a5b71745abedb`.

## Hallazgos y correcciones

| Riesgo observado | Cambio aplicado | Verificación |
|---|---|---|
| Todos los jugadores pueden leer las alternativas narrativas | Dirigido: opciones solo en contexto GM; espera en Mesa de jugadores | Pruebas de autoridad y entrega privada; revisión de TableApp |
| La elección aparece inmediatamente en cartas, pistas, diario e historial | Elección privada en whisper; estado público contiene solo un marcador; publicar explícitamente | Pruebas de ausencia de texto y publicación única |
| Permisos OWNER en todos los mazos permiten modificar estado y orden directamente | Mazos OBSERVER; peticiones del jugador ejecutadas por GM | Inspección de permisos y pruebas del receptor |
| Acciones expuestas por API dependen de botones ocultos | Inicio, fin, cambios de fase y escrituras verifican GM; narrador validado por usuario creador, autor y contexto | Pruebas de usuario ajeno, repetición y petición antigua |
| Precio de Dama acepta nombres de recurso sin lista cerrada | Solo espíritu, determinación o ninguno | Validación en GameplayService |
| Epílogo se publica automáticamente al finalizar | En Dirigido lo gestiona el GM; destinatario concreto, GM o todos | Prueba de final privado y posterior revelación |
| Verdades ocultas, notas y recuerdos desconocidos viven en Actor compartido | Registro solo GM, con migración y edición desde las ventanas existentes | Prueba de migración sin exposición en Actor |
| Notas privadas del historial viven en flags compartidos | Traslado a registros solo GM y deduplicación al migrar | Revisión de migración y StateService.log |
| Navegación de escenas del GM registra títulos futuros públicamente | Registro privado en Dirigido | Revisión de ambos controles de navegación |
| Botones antiguos de recuerdos, pistas y handouts pueden revelar información | Entrega privada al narrador en Dirigido; presentación pública en modos normales | Revisión de GuardianApp, ArchiveApp y ScenarioSheet |
| Sinopsis e introducción pueden contener revelaciones | Campo adicional publicSynopsis; fallback al gancho; modelo anterior conservado | Normalizador e interfaz de edición |
| El GM tiene que buscar entre varias ventanas lo que toca | Cabina Ahora con narrador, carta, petición de cambio, decisión pendiente y siguiente paso | Plantillas compiladas; prueba visual pendiente |
| La tarjeta privada se pierde al cerrar o recargar | Whisper persistente, botón para reabrir y recuperación al entrar | Revisión de persistencia; prueba multicliente pendiente |
| La recepción del mensaje se confunde con lectura | Estados enviado / conectado / tarjeta abierta | Acuse solo al renderizar la tarjeta; no se promete lectura del texto |

## Límites y asuntos pendientes

1. **Privacidad frente a clientes hostiles:** los datos de documentos de Foundry y los escenarios públicos pueden inspeccionarse técnicamente. El backend local 13.351 retransmite documentos modificados. Los whispers y permisos son el alcance nativo solicitado; no se ofrece cifrado. Esto requiere una arquitectura adicional si se pretende seguridad frente a usuarios que manipulan el navegador.
2. **Foundry real:** las pruebas automatizadas del flujo usan dobles de documentos. Se compilaron las plantillas con Handlebars incluido en Foundry 13.351 y se inspeccionó la validación del autor de ChatMessage, pero no se ha jugado una sesión multicliente real ni ejecutado Foundry 14. El manifiesto mantiene la compatibilidad previa sin afirmar una nueva verificación de v14.
3. **Persistencia en chat:** borrar el chat puede eliminar entregas, registros privados y respaldos de permisos. Hacer copia del mundo antes de actualizar y antes de limpiar chat. Una gestión de almacenamiento independiente y recuperación ante borrado queda pendiente.
4. **Concurrencia:** las peticiones de jugadores pasan por una cola de un GM. La intervención simultánea desde varios GM o mientras un GM ejecuta una acción directa exige prueba real; no se implementa una transacción distribuida.
5. **Migraciones:** la primera carga modifica permisos de mazos y traslada secretos existentes a registros solo GM. Los cambios deben revisarse y probarse en una copia. No se ha ejecutado esta migración en ningún mundo del usuario.
6. **Protagonista dirigido:** su ficha queda en lectura para jugadores durante Dirigido; el GM gestiona edición de rasgos y registros. Se restaura el permiso original al cerrar o iniciar otro relato. Esto protege recursos, con coste de autonomía de edición que debe evaluarse en la partida de prueba.

## Verificación realizada

- Suite de reglas, estructura, contenido, arranque y memoria, ampliada con pruebas de Dirigido.
- Sintaxis de módulos, JSON, rutas de arte e importaciones.
- Paridad ES/EN y existencia de claves literales y dinámicas.
- Compilación de todas las plantillas con el Handlebars de Foundry 13.351.
- Comparación conceptual con MR Telegram: destinatarios GM+jugador, cola, persistencia y acuses. No se ha copiado código de ese módulo ni añadido una dependencia.

## Prueba de aceptación antes de publicar

Usar una **copia** del mundo, con GM, narrador A y jugador B en tres sesiones. Repetir en Foundry 13 y 14.

- [ ] Empezar cada modo normal: elección pública, cartas, reglas, diario y epílogo como antes.
- [ ] Empezar Dirigido: A/B no ven opciones, notas guardian, escenas futuras ni epílogos en hojas o biblioteca.
- [ ] Enviar una opción con imagen: solo GM y A la ven en su interfaz y chat; B ve carta/tipo y espera.
- [ ] Gastar, revelar carta numérica, empujar, repetir y aceptar fallo con A; B no puede provocar la acción desde la API.
- [ ] Pedir cambio: una petición por escena; conservar coste, resultado y recursos cuando ya se resolvió mecánica.
- [ ] Revelar antes de terminar: texto público sin desbloquear el siguiente robo. Finalizar: diario/pista solo una vez.
- [ ] Reasignar a B: B recibe la tarjeta, A pierde control, el whisper anterior sigue disponible.
- [ ] Desconectar y reconectar A: recuperar tarjeta; comprobar destinatario desconectado, cambio manual y GM ausente.
- [ ] Texto libre, handout, reenvío y revelación desde cabina y botones anteriores.
- [ ] Tercera Dama: elegir precio, epílogo solo GM, envío a A/B y revelación pública.
- [ ] Migrar un actor con Verdades ocultas, notas y Recuerdos desconocidos; editar y revelar sin pérdida.
- [ ] Cerrar/nuevo relato: restaurar permisos exactos; verificar que no quedan decisiones o entregas activas de la sesión anterior.
- [ ] Revisar teclado, foco, contraste, movimiento reducido y pantallas pequeñas en ambos idiomas.
- [ ] Confirmar entrega en sesión con varios GM, doble clic, y desconexión del GM durante una escritura.

No publicar una release estable hasta completar esta lista y revisar los límites de privacidad y persistencia.
