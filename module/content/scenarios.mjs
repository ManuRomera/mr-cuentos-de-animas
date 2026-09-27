/**
 * Escenarios originales de MR · Cuentos de Ánimas. Texto propio: no reproduce
 * ningún escenario ni carta oficial del juego. `flags.seed` identifica cada uno
 * para no duplicarlo ni pisar las ediciones del Guardián.
 */
import { ASSETS, FLAGS, SYSTEM_ID } from "../constants.mjs";

const seed = id => ({ [SYSTEM_ID]: { [FLAGS.SEED]: id } });

const VOICE = {
  name: "La voz que dejaste atrás",
  type: "scenario",
  img: ASSETS.scenarios.voice,
  flags: seed("voice"),
  system: {
    author: "Manu Romera · MR · Cuentos de Ánimas",
    duration: "90–150 min",
    players: "1 + Guardián",
    cover: ASSETS.scenarios.voice,
    hook: "Siete cintas. Un piso que mañana estará vacío. Una voz que todavía tiene algo que preguntarte.",
    tone: ["Íntimo", "Melancólico", "Sobrio"],
    tags: ["psychological", "supernatural", "mystery", "urban"],
    modes: ["guardian", "diary"],
    contentNotes: ["Duelo", "Ruptura afectiva", "Culpa", "Muerte de una persona cercana"],
    recommendedSpirit: 5,
    recommendedDetermination: 5,
    deckVariant: "world",
    synopsis: `<p>Suena el teléfono a una hora en la que ya nadie llama. Alguien que fue decisivo en tu vida ha muerto —o ha desaparecido, y a efectos prácticos es lo mismo—. Llevabais años sin hablar.</p>
<p>Su piso se vacía mañana a primera hora. Tienes una noche para recoger lo que quieras conservar.</p>
<p>Sobre la mesa del comedor hay un magnetófono y siete cintas. Todas llevan tu nombre.</p>
<p>No hay un crimen que resolver. Hay dos personas que se quisieron y que, para poder seguir, necesitaron contarse una versión soportable de lo que pasó. Esta noche las dos versiones van a encontrarse.</p>`,
    introduction: `<p>La llave está donde te dijeron: bajo la maceta seca del rellano. El piso huele a cerrado y a algo más, un perfume que tu cuerpo reconoce antes que tu memoria.</p>
<p>En la mesa, alineadas como fichas de dominó, hay siete cintas. En cada etiqueta, con su letra, tu nombre. El magnetófono tiene la primera puesta. Solo hay que pulsar.</p>
<blockquote>«Si estás escuchando esto es porque al final has venido.»</blockquote>
<p>Una pausa larga. El sonido de alguien que enciende un cigarro, o que se lo piensa.</p>
<blockquote>«No voy a pedirte que me perdones. Voy a pedirte algo más difícil: que me cuentes cómo lo recuerdas tú.»</blockquote>`,
    guardianNotes: `<p><strong>Tu papel.</strong> No sabes más que el jugador sobre lo que pasó. Nunca fijes de antemano la verdad emocional: haz preguntas, registra las respuestas como Verdades y deja que las cintas, los objetos y las cartas las pongan a prueba.</p>
<p><strong>Las cintas.</strong> Cada escena gira en torno a una cinta. La voz no acusa ni absuelve: recuerda de otra manera. Usa las Verdades registradas para escribir sobre la marcha lo que dice la cinta: si el jugador afirmó «yo nunca volví a llamar», la cinta puede mencionar una llamada que nadie contestó.</p>
<p><strong>Contradicciones.</strong> Marca como <em>Dudosa</em> o <em>Contradicha</em> una verdad cuando la ficción la erosione, no cuando el jugador «se equivoque». La gracia es descubrir qué historia se estaba contando, no pillarle en falta.</p>
<p><strong>Lo que no ocurre.</strong> El protagonista no está muerto. La persona de las cintas no era un monstruo. Nadie tiene toda la razón.</p>
<p><strong>Final.</strong> La séptima cinta se escucha sin cartas. Baja el ritmo, apaga el ambiente y deja silencio después de cada frase.</p>`,
    scenes: [
      { title: "I · La fotografía", text: "Una fotografía feliz, colocada boca abajo en la estantería. La primera cinta termina justo cuando la tocas.", guardian: "Primera cinta: «Si estás escuchando esto…». Pide al jugador que describa la foto ANTES de girarla. Registra lo que diga como primera Verdad.", handout: "" },
      { title: "II · La llave", text: "Una llave pequeña, de las de cajón o de buzón, atada con un cordel que reconoces.", guardian: "Segunda cinta: la voz habla de una promesa. ¿Qué puerta prometió el protagonista no volver a abrir? Ofrece el recuerdo «La decisión».", handout: "" },
      { title: "III · La carta sin enviar", text: "Un sobre cerrado con tu dirección de hace muchos años. Tiene sello. Nunca pasó por correos.", guardian: "Antes de abrirla, pregunta qué llevaba años deseando que dijera. La carta dice algo parecido… pero no exactamente. Marca una Verdad como Dudosa.", handout: "" },
      { title: "IV · El objeto insignificante", text: "Algo sin ningún valor, guardado con un cuidado absurdo. Perteneció a los dos.", guardian: "El jugador decide qué es. Tercera y cuarta cinta: la voz cuenta un día bueno. Si el jugador recuerda ese día de otra forma, ambas versiones son ciertas.", handout: "" },
      { title: "V · La habitación cerrada", text: "La puerta del fondo del pasillo tiene la llave puesta por dentro.", guardian: "Obstáculo natural de la escena. Dentro está la vida que la otra persona hizo sin el protagonista: la tercera persona aparece aquí, como testigo, no como culpable.", handout: "" },
      { title: "VI · La cinta sin etiqueta", text: "Una cinta que no estaba antes. Sin nombre. Lleva grabada tu propia voz.", guardian: "Es una grabación antigua del protagonista diciendo algo que no recuerda haber dicho. Usa la Verdad más firme y dale la vuelta, con suavidad.", handout: "" },
      { title: "VII · La cinta final", text: "La última cinta dura menos que las demás. Antes de pulsar, la habitación se queda en silencio.", guardian: "Sin cartas. La voz pregunta: «Si pudieras volver a aquella noche sabiendo lo que sabes ahora, ¿harías algo distinto?». Deja que el jugador conteste. Después, epílogo.", handout: "" }
    ],
    characters: [
      { name: "La persona de las cintas", description: "Alguien a quien el protagonista quiso, necesitó o admiró. El jugador decide qué les unía: hermano, pareja, maestro, amiga.", secret: "También reescribió la ruptura para poder soportarla. Su versión no es más verdadera; es la otra mitad.", image: "" },
      { name: "La administradora", description: "Una voz práctica al teléfono. Mañana a las ocho llega la empresa de vaciado.", secret: "Encontró las cintas ordenadas sobre la mesa y no se atrevió a tocarlas.", image: "" },
      { name: "La tercera persona", description: "Un nombre que aparece en fotos, cartas y en el buzón.", secret: "Cuidó de la persona de las cintas al final. Sabe qué se decía de ti en esa casa, y no era lo que temes.", image: "" }
    ],
    clues: [
      { title: "La fotografía vuelta", text: "Una fotografía feliz, boca abajo. Antes de girarla, di por qué sabes exactamente cuál es.", difficulty: 0, image: "", guardian: "Registra la respuesta como Verdad." },
      { title: "La llave con cordel", text: "Reconoces el cordel antes que la llave. ¿Qué puerta prometiste no volver a abrir?", difficulty: 0, image: "", guardian: "" },
      { title: "La carta que no llegó", text: "Sellada, con sello, jamás enviada. ¿Qué llevaste años deseando que dijera?", difficulty: 0, image: "", guardian: "La carta dice casi eso. Casi." },
      { title: "Dos tazas", text: "Dos tazas guardadas juntas al fondo del armario. Una tiene una grieta pegada con cuidado.", difficulty: 0, image: "", guardian: "" },
      { title: "La agenda", text: "Tu nombre aparece en una fecha posterior a la última vez que recuerdas haberla visto.", difficulty: 0, image: "", guardian: "Contradice directamente alguna Verdad sobre «la última vez»." },
      { title: "El recibo", text: "Un recibo de un lugar al que solo ibais juntos. La fecha es de hace dos meses.", difficulty: 0, image: "", guardian: "" }
    ],
    environmentObstacles: [
      { title: "La puerta que no cede", text: "La habitación del fondo sigue cerrada. La casa parece esperar a que decidas si de verdad quieres entrar.", difficulty: 5, image: "", guardian: "" },
      { title: "Se va la luz", text: "El piso queda a oscuras. El magnetófono sigue girando aunque no está enchufado.", difficulty: 5, image: "", guardian: "" },
      { title: "El mueble que no estaba", text: "Al volver al salón hay un aparador que jurarías que no estaba ahí. Lo reconoces.", difficulty: 6, image: "", guardian: "" },
      { title: "La cinta enredada", text: "La cinta se enrolla en el cabezal. Para salvarla hay que abrir la carcasa sin romper el único trozo que no has oído.", difficulty: 4, image: "", guardian: "" },
      { title: "Todos los relojes", text: "Todos los relojes del piso marcan la misma hora. Sabes lo que pasó a esa hora.", difficulty: 6, image: "", guardian: "" }
    ],
    characterObstacles: [
      { title: "«No fue así»", text: "La voz de la cinta niega una parte de lo que acabas de contar. No aporta pruebas: solo lo recuerda distinto.", difficulty: 5, image: "", guardian: "Elige una Verdad y márcala como Dudosa si el jugador falla." },
      { title: "La llamada", text: "Alguien que os conocía a los dos llama ahora. Quiere hablar, y hace la pregunta que llevas toda la noche esquivando.", difficulty: 4, image: "", guardian: "" },
      { title: "Tu propia voz", text: "En una grabación antigua oyes tu voz diciendo algo que no recuerdas haber dicho nunca.", difficulty: 6, image: "", guardian: "" },
      { title: "El reproche a medias", text: "La voz empieza a reprocharte algo y la cinta se corta justo antes de la palabra importante.", difficulty: 5, image: "", guardian: "" },
      { title: "El testigo", text: "Una nota de la tercera persona contradice un detalle pequeño de tu recuerdo. Pequeño, pero no trivial.", difficulty: 6, image: "", guardian: "" }
    ],
    incidents: [
      { title: "Un olor", text: "Durante unos segundos el piso huele exactamente como entonces. ¿Qué recuerdo llega con él?", difficulty: 0, image: "", guardian: "" },
      { title: "El mensaje borrado", text: "Un móvil viejo conserva el encabezado de un mensaje que tú enviaste. El texto está borrado.", difficulty: 0, image: "", guardian: "" },
      { title: "La canción", text: "Entre dos grabaciones se cuelan unos segundos de una canción que fue vuestra.", difficulty: 0, image: "", guardian: "" },
      { title: "La silla de enfrente", text: "Al levantar la vista, durante un instante, sabes que hay alguien sentado frente a ti.", difficulty: 0, image: "", guardian: "" },
      { title: "Se cae el marco", text: "Un cuadro se descuelga y el cristal se raja justo sobre un rostro.", difficulty: 0, image: "", guardian: "" }
    ],
    tension: [
      { title: "Primera Dama · La otra versión", text: "La cinta dice: «Siempre has contado que fui yo quien se marchó». Desde ahora cualquier Verdad puede ponerse en duda.", guardian: "Enfría el ambiente. Marca como Dudosa la Verdad más cómoda del jugador." },
      { title: "Segunda Dama · La conversación imposible", text: "La cinta reproduce una frase que has dicho hace unos minutos, en este piso. Después, la voz responde: «Eso tampoco es exactamente así».", guardian: "La cinta ya no es pasado: escucha. Contradice una Verdad." },
      { title: "Tercera Dama · La séptima cinta", text: "Aparece la última cinta. En ella se oye tu voz de ahora mismo.", guardian: "Pasa a la escena VII. Sin cartas." }
    ],
    epilogueTable: [
      { label: "Si quedan dos o más contadores de Espíritu", min: 2, max: 99, text: "Eliges un solo objeto. Lo demás se queda. Al cerrar la puerta no sabes si te han perdonado, pero descubres que ya no necesitas saberlo." },
      { label: "Si queda un contador de Espíritu", min: 1, max: 1, text: "Te llevas la última cinta. Años después aún la escuchas algunas noches. Siempre termina igual, hasta que una noche hay tres segundos nuevos al final: tu nombre, dicho muy bajo." },
      { label: "Si no quedan contadores de Espíritu", min: 0, max: 0, text: "Al recoger la séptima cinta ves una fecha escrita a lápiz bajo la etiqueta. Es la de mañana. La voz, esta vez, es la tuya." }
    ],
    memories: [
      { title: "La última frase", prompt: "¿Cuál es la última frase que recuerdas haberle dicho?", followUp: "¿Seguro que fue la última?", kind: "question", link: { type: "scene", label: "I · La fotografía" } },
      { title: "La disculpa", prompt: "¿Qué disculpa esperaste durante años?", followUp: "¿Y cuál pudo esperar de ti?", kind: "question", link: { type: "", label: "" } },
      { title: "El día bueno", prompt: "Cuéntame un día en que todo parecía fácil entre vosotros.", followUp: "¿Qué detalle de aquel día entiendes ahora de otra manera?", kind: "memory", link: { type: "object", label: "Dos tazas" } },
      { title: "Lo que no cuentas", prompt: "¿Qué parte de esta historia nunca cuentas cuando te preguntan?", followUp: "¿A quién proteges al callarla?", kind: "locked", link: { type: "", label: "" } },
      { title: "La decisión", prompt: "¿Qué decisión pequeña lo cambió todo?", followUp: "¿Cuándo te diste cuenta de que había sido importante?", kind: "question", link: { type: "scene", label: "II · La llave" } },
      { title: "¿Lo recuerdas?", prompt: "¿Lo recuerdas o prefieres no recordarlo?", followUp: "", kind: "question", link: { type: "", label: "" } }
    ],
    truths: [
      { text: "La otra persona fue quien se marchó.", contradiction: "La agenda y el recibo sugieren que siguió buscándole.", reveal: "Primera Dama" },
      { text: "No volvieron a hablar después de aquella noche.", contradiction: "El mensaje borrado y la llamada que nadie contestó.", reveal: "Segunda Dama" },
      { text: "El protagonista no tuvo culpa.", contradiction: "Su propia voz en la cinta sin etiqueta.", reveal: "Escena VI" }
    ],
    handouts: [],
    sounds: { intro: "tape", play: "house", gray: "silence", epilogue: "silence" },
    customBack: ""
  }
};

const HOUSE = {
  name: "La casa que respira",
  type: "scenario",
  img: ASSETS.scenarios.house,
  flags: seed("house"),
  system: {
    author: "Manu Romera · MR · Cuentos de Ánimas",
    duration: "45–70 min",
    players: "1–4",
    cover: ASSETS.scenarios.house,
    hook: "Has venido a inventariar una casa antes de su demolición. La casa lleva toda la noche inventariándote a ti.",
    tone: ["Horror rural", "Breve", "Didáctico"],
    tags: ["rural", "supernatural", "folklore"],
    modes: ["guardian", "bonfire", "diary"],
    contentNotes: ["Claustrofobia", "Muerte familiar"],
    recommendedSpirit: 5,
    recommendedDetermination: 5,
    deckVariant: "world",
    synopsis: `<p>Una casa de labranza será demolida al amanecer. Te han contratado para fotografiar y catalogar lo que quede dentro.</p>
<p>Cuando cierras la puerta, las habitaciones empiezan a cambiar de tamaño. En una jamba aparecen marcas de altura con tu nombre y fechas que aún no han llegado.</p>`,
    introduction: `<p>El vecino te da las llaves por encima de la valla y no cruza. «Antes de que anochezca», dice, y ya está anocheciendo.</p>
<p>Dentro huele a leña vieja y a humedad. La casa cruje como cualquier casa. Luego, durante un segundo, cruje al ritmo de tu respiración.</p>`,
    guardianNotes: `<p><strong>Escenario de aprendizaje.</strong> Úsalo para enseñar la Mesa: robar, resolver un obstáculo, gastar Determinación antes de revelar, perder Espíritu y ver llegar una Dama Gris.</p>
<p>Mantén las escenas cortas (5–8 minutos). Deja que la casa use lo cotidiano antes de mostrar lo imposible.</p>
<p>En modo Hoguera, cada jugador narra una estancia; el protagonista es común.</p>`,
    scenes: [
      { title: "I · La entrada", text: "El recibidor, el perchero con un abrigo que nadie se llevó, las marcas en la jamba.", guardian: "Enseña a robar la primera carta.", handout: "" },
      { title: "II · La cocina", text: "Una luz amarilla de otra época. La mesa está puesta para alguien.", guardian: "Buen sitio para el primer obstáculo: enseña a gastar Determinación antes de revelar.", handout: "" },
      { title: "III · La escalera", text: "Los peldaños no suman lo mismo al subir que al bajar.", guardian: "", handout: "" },
      { title: "IV · La habitación del plano", text: "La habitación que no existía, llena de cosas de tu infancia.", guardian: "Segunda Dama. Ofrece el recuerdo «La primera casa».", handout: "" },
      { title: "V · El amanecer", text: "Maquinaria al otro lado de la pared. Ventanas que siguen mostrando noche.", guardian: "Tercera Dama y epílogo.", handout: "" }
    ],
    characters: [
      { name: "Ramón, el vecino", description: "Tiene las llaves y se niega a entrar después del anochecer.", secret: "Oyó voces en la casa cuando llevaba veinte años vacía. Una era la tuya.", image: "" },
      { name: "La niña del pasillo", description: "Solo aparece reflejada en los cristales.", secret: "No es una niña desconocida.", image: "" }
    ],
    clues: [
      { title: "Marcas de altura", text: "En la jamba hay marcas con tu nombre y edades que no recuerdas haber vivido aquí.", difficulty: 0, image: "", guardian: "" },
      { title: "Fotografía reciente", text: "Una instantánea muestra esta habitación, tomada desde detrás de ti.", difficulty: 0, image: "", guardian: "" },
      { title: "El plano", text: "El plano del catastro incluye una habitación que no existe. Todavía.", difficulty: 0, image: "", guardian: "" },
      { title: "Pisadas en el polvo", text: "Un rastro de pies descalzos cruza el polvo y termina en una pared lisa.", difficulty: 0, image: "", guardian: "" }
    ],
    environmentObstacles: [
      { title: "El pasillo se alarga", text: "La puerta de salida se aleja un paso por cada paso que das.", difficulty: 5, image: "", guardian: "" },
      { title: "La habitación mengua", text: "Las paredes avanzan un palmo con cada respiración de la casa.", difficulty: 6, image: "", guardian: "" },
      { title: "Un peldaño de más", text: "La escalera tiene un escalón nuevo. Y luego otro.", difficulty: 4, image: "", guardian: "" },
      { title: "La ventana que no da fuera", text: "Abres la contraventana y al otro lado hay otra habitación de la casa.", difficulty: 5, image: "", guardian: "" }
    ],
    characterObstacles: [
      { title: "Ramón llama", text: "El vecino te pide que salgas ya. Detrás de su voz se oye la tuya, pidiéndole que no abra.", difficulty: 5, image: "", guardian: "" },
      { title: "La niña señala", text: "La figura del cristal señala algo detrás de ti y rompe a llorar.", difficulty: 5, image: "", guardian: "" },
      { title: "El apodo", text: "Desde la habitación que no existe alguien te llama por un apodo que solo conocía una persona.", difficulty: 6, image: "", guardian: "" }
    ],
    incidents: [
      { title: "Tres golpes", text: "Tres golpes lentos bajo el suelo siguen el ritmo de tus pasos.", difficulty: 0, image: "", guardian: "" },
      { title: "La linterna", text: "La linterna se apaga. Cuando vuelve, estás en otra habitación.", difficulty: 0, image: "", guardian: "" },
      { title: "Respiración", text: "Toda la estructura se hincha y se encoge, como un pecho dormido.", difficulty: 0, image: "", guardian: "" }
    ],
    tension: [
      { title: "Primera Dama · La casa te conoce", text: "Una marca antigua en la pared tiene tu nombre y tu fecha de nacimiento.", guardian: "" },
      { title: "Segunda Dama · La habitación", text: "Aparece la habitación del plano. Dentro hay objetos de tu infancia que jamás estuvieron aquí.", guardian: "" },
      { title: "Tercera Dama · Demolición", text: "Se oye la maquinaria. Ha amanecido, pero las ventanas siguen mostrando noche cerrada.", guardian: "" }
    ],
    epilogueTable: [
      { label: "Si quedan dos o más contadores de Espíritu", min: 2, max: 99, text: "Sales cuando la primera máquina golpea la fachada. Entre el polvo, durante un instante, alguien te mira desde una ventana que nunca existió." },
      { label: "Si queda un contador de Espíritu", min: 1, max: 1, text: "Escapas. Semanas después aparece una marca de altura nueva en el marco de tu dormitorio." },
      { label: "Si no quedan contadores de Espíritu", min: 0, max: 0, text: "Cuando derriban la casa no encuentran a nadie. En una pared interior hay una marca nueva con tu nombre y la fecha de hoy." }
    ],
    memories: [
      { title: "La primera casa", prompt: "¿Qué lugar de tu infancia te parecía enorme y hoy sabes que era diminuto?", followUp: "¿Quién estaba siempre allí contigo?", kind: "question", link: { type: "scene", label: "IV · La habitación del plano" } },
      { title: "La voz", prompt: "¿Quién te llamaba por ese apodo?", followUp: "¿Qué fue lo último que te dijo?", kind: "question", link: { type: "", label: "" } },
      { title: "La puerta prohibida", prompt: "¿Qué puerta de tu infancia no podías abrir?", followUp: "¿Qué creías que había detrás?", kind: "locked", link: { type: "", label: "" } }
    ],
    truths: [
      { text: "El protagonista nunca había estado en esta casa.", contradiction: "Las marcas de altura con su nombre.", reveal: "Primera Dama" }
    ],
    handouts: [],
    sounds: { intro: "wind", play: "house", gray: "wind", epilogue: "silence" },
    customBack: ""
  }
};

export const SCENARIOS = [VOICE, HOUSE];
