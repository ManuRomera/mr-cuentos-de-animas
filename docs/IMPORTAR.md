# Importar escenarios · MR · Cuentos de Ánimas

La **Biblioteca** importa escenarios desde un archivo **JSON**. Esta misma guía está dentro de Foundry: *Biblioteca → Cómo importar*, con un botón para descargar la plantilla y otro para copiar el prompt de IA.

## 1. El archivo

- Formato **JSON** en UTF‑8, con extensión `.json`.
- Puede estar en **cualquier carpeta de tu ordenador**: se elige desde *Biblioteca → Importar*. No hay que copiarlo a la carpeta de Foundry.
- Un archivo puede contener **uno o muchos escenarios** dentro de la lista `scenarios` (máximo 200).
- Todo es texto normal. Los párrafos se separan con una línea en blanco (`\n\n` dentro del JSON). No hace falta HTML.

## 2. Estructura

```json
{
  "format": "mr-cuentos-de-animas/scenario",
  "version": 2,
  "scenarios": [
    {
      "name": "Título del escenario",
      "author": "Autoría",
      "duration": "60–120 min",
      "players": "1–4",
      "modes": ["bonfire", "diary", "guardian"],
      "tags": ["rural", "folklore"],
      "tone": ["Horror rural", "Melancólico"],
      "contentNotes": ["Muerte de un familiar"],
      "hook": "Una frase que atrape (opcional).",
      "synopsis": "La narración inicial que se lee en voz alta.\n\nSegundo párrafo.",
      "characters": [
        { "name": "Nombre", "description": "Quién es y qué quiere." }
      ],
      "clues": ["Una pista o indicio.", "Otra pista."],
      "environmentObstacles": ["Un obstáculo del entorno."],
      "characterObstacles": ["Un personaje se interpone en tu camino."],
      "incidents": [],
      "tension": [
        "Primera Dama Gris revelada.",
        "Segunda Dama Gris revelada.",
        "Tercera Dama Gris revelada."
      ],
      "epilogues": [
        { "label": "Si quedan dos o más contadores de Espíritu", "min": 2, "max": 99, "text": "…" },
        { "label": "Si queda un contador de Espíritu", "min": 1, "max": 1, "text": "…" },
        { "label": "Si no quedan contadores de Espíritu", "min": 0, "max": 0, "text": "…" }
      ],
      "guardianNotes": "Notas solo para quien dirige (opcional).",
      "source": { "collection": "Procedencia", "license": "Licencia o permiso", "url": "" }
    }
  ]
}
```

### Campos obligatorios

| Clave | Qué contiene |
|---|---|
| `name` | Título. |
| `synopsis` | La **Sinopsis**: se lee al empezar y queda visible en la Mesa para releerla. |
| `characters` | **Personajes secundarios**: `{ "name", "description" }`. Los Percances se los lleva uno de ellos. |
| `clues` | **Pistas e indicios**: una frase por entrada. Las elegidas quedan a la vista, fuera del descarte. |
| `environmentObstacles` | **Obstáculos de entorno**: una frase por entrada. |
| `characterObstacles` | **Obstáculos de personaje**: una frase por entrada. |
| `tension` | **Tabla de Tensión**: exactamente tres textos, uno por Dama Gris. |
| `epilogues` | **Tabla de Espíritu‑Epílogo**: `{ "label", "min", "max", "text" }`. Se usa la **primera** fila cuyo rango incluya el Espíritu final. Debe haber una fila con `min: 0`. `99` = sin límite. |

La **dificultad** de los obstáculos no va en el escenario: la trae impresa la carta que se roba (4‑7), como en el libro.

### Campos opcionales

`author`, `duration`, `players`, `modes`, `tags`, `tone`, `contentNotes`, `hook`, `incidents` (percances propios; si falta, se elige un personaje), `guardianNotes`, `source`, `img` o `cover` (ruta a una imagen de Foundry), y los extras del modo 1 + 1: `scenes`, `memories`, `truths`, `handouts`.

- `modes`: `guardian` (A solas con el Guardián), `bonfire` (La Hoguera), `diary` (El Diario), `free` (Relato libre).
- `tags`: `rural`, `supernatural`, `psychological`, `folklore`, `mystery`, `scifi`, `urban`.

## 3. Generarlo con una IA

En *Biblioteca → Cómo importar → Copiar prompt* tienes el texto exacto. Pégalo en tu IA, añade debajo el escenario (copiado del PDF o escrito por ti), guarda la respuesta como `.json` e impórtalo.

## 4. Si algo falla

Cada escenario se revisa **antes** de tocar el mundo. Los válidos se importan; de los demás aparece una lista con lo que falta exactamente (por ejemplo, «tension necesita los tres textos de las Damas Grises»). Un JSON mal formado no se importa y no cambia nada.

## 5. Exportar

Cada escenario del mundo se exporta desde la Biblioteca (menú ⋯ → Exportar) en este mismo formato: sirve de copia de seguridad o para compartirlo.
