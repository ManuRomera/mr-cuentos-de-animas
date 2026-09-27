# Biblia de arte · MR · Cuentos de Ánimas

Todo el arte debe parecer sacado **de la misma caja**: una caja de relatos encontrada en una casa rural, fotografiada con una cámara analógica a la luz de una vela. Este documento fija el estilo y enumera cada imagen que usa el sistema, con su nombre de archivo, tamaño y un prompt listo para usar.

El arte actual es **provisional** (generado por código, sin fotos ni IA). Cada imagen definitiva sustituye a la provisional con el mismo nombre; no hay que tocar código.

---

## 1. Cómo entregar las imágenes

1. Genera cada imagen con el tamaño mínimo indicado (más grande también vale; se recorta y reduce solo).
2. Nómbrala con la **clave** de la tabla (por ejemplo `gray-2.png`, `table.jpg`, `spirit-on.png`).
3. Déjalas todas en una carpeta y pásamela, o cópialas tú en `art-inbox/` dentro del repositorio y ejecuta:

   ```bash
   python3 scripts/import-art.py
   ```

   El script recorta al encuadre correcto, reduce, convierte a WebP y las coloca en su sitio. Los contadores conservan la transparencia.

---

## 2. Estilo común

| | |
|---|---|
| **Género** | Horror rural y folclórico, melancólico, íntimo. Nunca gore ni fantasía heroica. |
| **Aspecto** | Fotografía realista, cinematográfica, con un tratamiento pictórico muy sutil. Nada de ilustración vectorial ni de «arte de videojuego». |
| **Época** | Interiores y paisajes de la España rural y de provincias entre 1950 y 1985: casas de piedra y cal, madera oscura, loza, papel pintado, magnetófonos, fotografías con borde blanco. |
| **Luz** | Luz de vela cálida (2000–2400 K) como fuente principal; luna fría y azulada como contraluz. Claroscuro marcado, sombras profundas, niebla o humo ligeros. |
| **Paleta** | Negro carbón, nogal oscuro, sepia, marfil viejo, gris humo, verde musgo, rojo vino, azul noche, latón envejecido, plata ceniza. Saturación baja. |
| **Óptica** | 35 mm o 50 mm, f/1.8–f/2.8, profundidad de campo corta. Grano de película (Kodak Portra 400 en color; Ilford HP5 o Tri‑X para las Damas). Viñeteado natural. |
| **Materiales** | Madera gastada, papel envejecido, cuero, latón con pátina, cera, cristal, piedra pulida, tela de luto. Texturas reales y táctiles. |
| **Composición** | Un solo motivo claro por imagen. Nada cortado de forma torpe. Espacio negativo generoso. |

### Negativos (para todas)

Pon esto en el campo *negative prompt* o añádelo al final del prompt:

```
text, letters, words, numbers, captions, watermark, signature, logo, frame, border, card border, ornamental frame,
cartoon, anime, illustration, 3d render, cgi, video game, fantasy armor, neon, oversaturated, HDR,
gore, blood, monster, zombie, skull, jump scare, extra fingers, deformed hands, distorted face, duplicate objects,
cropped subject, tilted horizon, modern objects, smartphone, plastic
```

> **Importante:** las cartas **no** deben llevar marco, borde, título ni número dibujados. El marco, el texto y los números los pinta el sistema por encima (así se leen bien, se traducen y se adaptan a la accesibilidad). En las cartas, deja el **40 % inferior tranquilo y oscuro**: ahí va el texto.

---

## 3. Lista de imágenes

### Imprescindibles (las ve todo el mundo en cada partida)

| Clave | Destino | Tamaño mínimo | Qué es |
|---|---|---|---|
| `table` | `assets/table/table.webp` | 1920×1080 (16:9) | Fondo de la Mesa de Ánimas |
| `back` | `assets/cards/back.webp` | 900×1200 (3:4) | Reverso de las cartas del relato |
| `clue` | `assets/cards/clue.webp` | 900×1200 (3:4) | Arte por defecto de **Pista** |
| `environment` | `assets/cards/environment.webp` | 900×1200 (3:4) | Arte por defecto de **Obstáculo de entorno** |
| `character` | `assets/cards/character.webp` | 900×1200 (3:4) | Arte por defecto de **Obstáculo de personaje** |
| `incident` | `assets/cards/incident.webp` | 900×1200 (3:4) | Arte por defecto de **Percance** |
| `gray-1` | `assets/cards/gray-1.webp` | 900×1200 (3:4) | Primera Dama Gris |
| `gray-2` | `assets/cards/gray-2.webp` | 900×1200 (3:4) | Segunda Dama Gris |
| `gray-3` | `assets/cards/gray-3.webp` | 900×1200 (3:4) | Tercera Dama Gris |
| `spirit-on` | `assets/counters/spirit-on.webp` | 512×512, **PNG transparente** | Piedra de Espíritu viva |
| `spirit-off` | `assets/counters/spirit-off.webp` | 512×512, **PNG transparente** | Piedra de Espíritu apagada |
| `determination-on` | `assets/counters/determination-on.webp` | 512×512, **PNG transparente** | Ámbar de Determinación encendido |
| `determination-off` | `assets/counters/determination-off.webp` | 512×512, **PNG transparente** | Ámbar de Determinación gastado |

### Muy recomendables

| Clave | Destino | Tamaño mínimo | Qué es |
|---|---|---|---|
| `cover` | `assets/branding/cover.webp` | 1920×1080 (16:9) | Portada del sistema en Foundry y en GitHub |
| `logo` | `assets/branding/logo.webp` | 512×512 (1:1) | Miniatura del sistema en la lista de Foundry |
| `scene` | `assets/table/scene.webp` | 1920×1080 (16:9) | Escena de bienvenida del mundo |
| `number-back` | `assets/cards/number-back.webp` | 900×1200 (3:4) | Reverso de las cartas numéricas |
| `number-art` | `assets/cards/number-art.webp` | 600×800 (3:4) | Fondo de las cartas numéricas (el número lo pone el sistema) |
| `voice` | `assets/scenarios/la-voz-que-dejaste-atras.webp` | 900×1200 (3:4) | Portada de *La voz que dejaste atrás* |
| `house` | `assets/scenarios/la-casa-que-respira.webp` | 900×1200 (3:4) | Portada de *La casa que respira* |
| `portrait` | `assets/branding/portrait.webp` | 512×640 (4:5) | Retrato por defecto de un protagonista nuevo |

### Opcionales · handouts de *La voz que dejaste atrás*

Se mostrarán a los jugadores desde la pestaña «En juego». Van en `assets/scenarios/voice/`; en cuanto existan los enlazo a cada escena.

| Clave | Tamaño | Qué es |
|---|---|---|
| `voice-tapes` | 1600×1000 | El magnetófono y las siete cintas sobre la mesa del comedor |
| `voice-photo` | 1200×900 | La fotografía boca abajo en la estantería |
| `voice-key` | 1200×900 | La llave pequeña atada con un cordel |
| `voice-letter` | 1200×900 | El sobre sellado que nunca pasó por correos |
| `voice-door` | 1000×1400 | La puerta del fondo del pasillo, con la llave por dentro |
| `voice-blank-tape` | 1200×900 | La cinta sin etiqueta |

---

## 4. Prompts

Los prompts están en inglés porque la mayoría de generadores responden mejor así. Añade siempre los **negativos** de arriba.

**Estilo base** (puedes anteponerlo a todos):

```
Cinematic analog photograph, rural Spanish folk horror, 1970s, candlelight 2200K with cold moonlight rim,
deep chiaroscuro, faint smoke, Kodak Portra 400 film grain, 50mm lens, shallow depth of field, muted
palette of charcoal black, dark walnut, sepia, old ivory, smoke grey, moss green, wine red, night blue,
aged brass, subtle painterly finish, photorealistic
```

### `table` · Mesa de Ánimas
```
Top-down overhead photograph of an old dark walnut farmhouse table, worn wood grain with scratches and wax
stains, lit by two candles near the top-left and bottom-right corners, objects only along the edges: brass
candlestick with dripping candle, dried herbs tied with string, a fountain pen, a few smooth river stones,
a small amber bead, yellowed handwritten papers and an old photograph partially out of frame. The centre of
the table is EMPTY and clean (space for cards), soft falloff into darkness at the borders, no text
```
Encuadre: 16:9, cenital exacto. **El centro debe quedar libre**: ahí se colocan las cartas y los recursos.

### `back` · Reverso de las cartas
```
Flat front view of the back of an antique 19th-century tarot-style playing card, dark oxblood leather or
black paper, gold-leaf foil stamping of a symmetrical design: crescent moon in the centre, thorned branches
and leaves growing from it, small spiritualist hands and stars, ornate Victorian corners, realistic wear
on the gold and edges, perfectly centred and symmetrical, filling the whole image edge to edge, studio
lighting, macro detail, no text
```
Aquí **sí** puede haber ornamento en los bordes: es el diseño del reverso. Que ocupe toda la imagen, sin mesa alrededor.

### `number-back` · Reverso numérico
Igual que `back`, pero con estampación **plateada** y un **rombo** en el centro en lugar de la luna.

### `number-art` · Fondo de carta numérica
```
Dark misty night field seen through fog, faint cold moonlight, nearly empty composition with a calm dark
centre, very subtle texture, deep night blue and smoke grey, film grain, no text, no numbers
```

### `clue` · Pista
```
Still life on dark wood by candlelight: an old damp black-and-white photograph with a white border lying
face down, an iron key with a tied string resting on it, a melted candle stub, dust in the light beam,
unsettling quiet discovery, subject in the upper two thirds, dark calm lower third
```

### `environment` · Obstáculo de entorno
```
A muddy rural path disappearing into a foggy chestnut forest at dusk, bare twisted branches, a ruined stone
wall, cold moonlight through mist, the world feels hostile and silent, subject in the upper two thirds,
darker lower third
```

### `character` · Obstáculo de personaje
```
A person standing in a half-open doorway of an old farmhouse, backlit by warm candlelight, face half hidden
in shadow, hands visible at the frame of the door, ambiguous human presence, uncomfortable tension, not a
monster, medium shot, subject in the upper two thirds
```

### `incident` · Percance
```
A glass oil lamp knocked over on a wooden floor, the glass chimney cracked, spilled light and a thin trail
of smoke, dried flowers scattered, an object falling out of frame, sudden accident frozen in time, night
blue ambience with one warm light source
```

### `gray-1` · Primera Dama Gris
```
Black-and-white film photograph, Ilford HP5 grain: a very distant veiled woman in a long grey mourning dress
standing at the far end of a foggy rural road at dawn, barely visible, tiny in the frame, elegant and
ghostly, ash grey tones, something is beginning
```
### `gray-2` · Segunda Dama Gris
```
Black-and-white film photograph: the same veiled woman in a grey mourning dress now standing closer in a
misty orchard, medium distance, the shape of a face can be guessed behind a translucent veil, elegant,
still, ashen, unsettling, no gore
```
### `gray-3` · Tercera Dama Gris
```
Black-and-white film photograph: close portrait of a veiled woman in grey mourning clothes, very near the
camera, her calm face softly visible through a sheer veil, eyes lowered, intimate, inescapable, elegant
and ghostly, ash and silver tones, shallow depth of field, not scary, not grotesque
```
Las tres deben ser **la misma mujer** (misma ropa y velo), cada vez más cerca. Sin rasgos monstruosos.

### `spirit-on` · Piedra de Espíritu
```
Single polished moonstone pebble, milky white quartz with a soft blue inner glow, cold light, isolated on a
transparent background, top-down three-quarter view, soft contact shadow, macro photograph
```
### `spirit-off`
```
The same pebble shape but dull grey stone, no glow, a fine crack across it, matte, isolated on a transparent
background, soft contact shadow
```
### `determination-on` · Ámbar
```
Single piece of polished amber resin, warm honey and ember orange with a glowing heart like a live coal,
isolated on a transparent background, three-quarter top view, soft contact shadow, macro photograph
```
### `determination-off`
```
The same amber piece gone dark brown and opaque, no glow, dusty, isolated on a transparent background
```
Los cuatro con **el mismo encuadre y tamaño de objeto** (que ocupe ~70 % del cuadro), para que se alineen en la Mesa.

### `cover` · Portada
```
Wide cinematic still life on a dark walnut table at night: a wooden box of old cards opened, a few cards
fanned out face down with gold-stamped backs, candles burning, river stones and amber beads, dried herbs,
an old photograph, and in the soft background mist the faint silhouette of a veiled woman in grey,
left half of the image darker and emptier for a title, no text
```
### `logo` · Miniatura
```
Square emblem photograph: a single antique card back with a gold crescent moon and a small candle flame
above it, on black velvet, centred, high contrast, legible at small size, no text
```
### `scene` · Escena de bienvenida
Como `table`, pero más amplia y ambiental (puede verse parte de la habitación en penumbra). Sin texto: el sistema no rotula encima.

### `voice` · Portada de *La voz que dejaste atrás*
```
An old reel-to-reel tape recorder on a dining table in an empty flat at night, seven cassette tapes lined up
beside it, a single lamp, dust sheets on furniture, melancholic, intimate, vertical composition, no text
```
### `house` · Portada de *La casa que respira*
```
An old stone farmhouse at night surrounded by fog and bare trees, one window faintly lit, the building seems
to breathe, rural Spanish folk horror, vertical composition, no text
```
### `portrait` · Protagonista por defecto
```
Vintage 1970s portrait photograph of an anonymous person seen from behind or in deep shadow, wearing a
dark coat, standing by a window, sepia tones, film grain, dignified and mysterious, no visible face
```

### Handouts de *La voz que dejaste atrás*
- `voice-tapes`: *An old reel-to-reel recorder and seven cassette tapes neatly lined up on a dining table, each with a blank paper label, lamp light, empty flat.*
- `voice-photo`: *A framed photograph lying face down on a dusty bookshelf, only the cardboard back visible, candlelight.*
- `voice-key`: *A small brass key tied with a faded red string on an old tablecloth, macro.*
- `voice-letter`: *A sealed envelope with an old stamp, never posted, handwriting blurred and unreadable, on a wooden desk.*
- `voice-door`: *The end of a dark corridor, a closed wooden door with the key visible in the lock, thin light under the door.*
- `voice-blank-tape`: *A single cassette tape with no label on a windowsill at night, rain on the glass.*

---

## 5. Control de calidad

Antes de dar una imagen por buena:

- [ ] Sin texto, marcas de agua ni firmas (ni siquiera pequeñas en una esquina).
- [ ] Manos y rostros correctos; ningún objeto duplicado ni fundido con otro.
- [ ] El motivo no está cortado de forma torpe; en las cartas, el 40 % inferior queda tranquilo.
- [ ] La luz viene de una vela o de la luna, nunca de un flash frontal.
- [ ] Encaja con el resto: pon la imagen junto a las demás y comprueba que parecen de la misma caja.
- [ ] Los contadores tienen fondo transparente real (no un «tablero de ajedrez» dibujado).
