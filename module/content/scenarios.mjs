import { PATH } from "../constants.mjs";

export const SCENARIOS = [
  {
    name: "La voz que dejaste atrás",
    type: "scenario",
    img: `${PATH}/assets/branding/scenario-voice.webp`,
    system: {
      author: "MR · Cuentos de Ánimas", duration: "90–150 min", cover: `${PATH}/assets/branding/scenario-voice.webp`,
      hook: "Siete cintas. Una casa vacía. Una persona muerta que todavía tiene algo que preguntarte.",
      tone: ["Íntimo", "Sobrenatural", "Melancólico", "Misterio"], modes: ["guardian", "diary"],
      contentNotes: ["Duelo", "Rupturas afectivas", "Culpa", "Muerte de una persona cercana"],
      synopsis: `<p>Alguien que fue decisivo en tu vida ha muerto. Llevabais años sin hablar. Antes de que vacíen su vivienda te piden que recojas lo que quieras conservar.</p><p>En la mesa del comedor hay una grabadora y siete cintas. Cada una lleva escrito tu nombre.</p><p>La noche no busca demostrar quién tuvo razón. Busca descubrir qué historia necesitaste contar para poder seguir viviendo.</p>`,
      instructions: `<p>El Guardián nunca establece por adelantado la verdad emocional del pasado. Formula preguntas, conserva las respuestas y deja que los objetos de la casa contradigan, completen o erosionen lo que el protagonista cree recordar.</p><p>No conviertas el relato en un juicio. Las dos personas pudieron amarse y hacerse daño a la vez.</p>`,
      recommendedSpirit: 5, recommendedDetermination: 5,
      secondaryCharacters: [
        { name: "La persona fallecida", description: "Alguien a quien el protagonista amó, necesitó o admiró. El jugador decide qué relación les unía.", secret: "También construyó su propia versión soportable de la ruptura.", image: "" },
        { name: "La gestora del piso", description: "Una voz práctica al teléfono. Mañana a primera hora deben vaciar la vivienda.", secret: "No sabe nada del contenido de las cintas.", image: "" },
        { name: "La tercera persona", description: "Un nombre que aparece en fotografías, cartas o conversaciones antiguas.", secret: "No es necesariamente un amante ni un culpable; sirve para revelar un ángulo que ambos omitieron.", image: "" }
      ],
      clues: [
        { title: "La fotografía vuelta", text: "Encuentras una fotografía feliz colocada boca abajo. Antes de girarla, explica por qué sabes exactamente cuál es.", difficulty: 0 },
        { title: "La llave", text: "Una llave que reconoces al instante. ¿Qué puerta prometiste no volver a abrir?", difficulty: 0 },
        { title: "La carta que nunca llegó", text: "Una carta dirigida a ti, sellada y jamás enviada. Antes de abrirla, di qué llevaste años deseando que dijera.", difficulty: 0 },
        { title: "El objeto insignificante", text: "Conservó algo sin valor material que perteneció a los dos. Decide qué es y por qué te sorprende que no lo tirase.", difficulty: 0 },
        { title: "Dos tazas", text: "En un armario hay dos tazas guardadas juntas. Una tiene una grieta reparada. ¿Qué conversación recuerdas al tocarla?", difficulty: 0 },
        { title: "La agenda", text: "Su vieja agenda contiene tu nombre en una fecha posterior a la última vez que recuerdas haberle visto.", difficulty: 0 }
      ],
      environmentObstacles: [
        { title: "La puerta que no abre", text: "Una habitación permanece cerrada. La casa parece obligarte a decidir si de verdad quieres entrar.", difficulty: 5 },
        { title: "Corte de luz", text: "La vivienda queda a oscuras y la grabadora continúa funcionando sin estar conectada.", difficulty: 5 },
        { title: "La casa recuerda", text: "Al volver a una estancia encuentras un mueble que jurarías que no estaba allí. Contiene algo que reconoces.", difficulty: 6 },
        { title: "La cinta atascada", text: "La cinta se enreda dentro del aparato. Recuperarla exige abrir la carcasa sin destruir el único fragmento que aún no has escuchado.", difficulty: 4 },
        { title: "El reloj detenido", text: "Todos los relojes de la casa marcan la misma hora. Sabes qué sucedió a esa hora.", difficulty: 6 }
      ],
      characterObstacles: [
        { title: "No fue así", text: "La voz de la cinta niega una parte de la versión que acabas de contar. No aporta pruebas; solo recuerda de otra manera.", difficulty: 5 },
        { title: "La llamada", text: "Alguien relacionado con ambos llama justo ahora. Quiere hablar del fallecido y formula una pregunta que preferirías evitar.", difficulty: 4 },
        { title: "Tu propia voz", text: "En una grabación antigua escuchas tu voz diciendo algo que no recuerdas haber dicho.", difficulty: 6 },
        { title: "La acusación incompleta", text: "La persona fallecida empieza a reprocharte algo, pero la cinta se corta antes de pronunciar la parte esencial.", difficulty: 5 },
        { title: "El testigo", text: "Una nota escrita por una tercera persona contradice un detalle aparentemente trivial de tu recuerdo.", difficulty: 6 }
      ],
      incidents: [
        { title: "Un olor conocido", text: "Durante unos segundos la casa huele exactamente como entonces. Describe el recuerdo que trae consigo.", difficulty: 0 },
        { title: "Mensaje borrado", text: "Un teléfono antiguo todavía conserva el encabezado de un mensaje que tú enviaste. El cuerpo fue borrado.", difficulty: 0 },
        { title: "Una canción", text: "La grabadora captura unos segundos de una canción que fue importante para los dos. ¿Qué ocurrió la última vez que la escuchasteis juntos?", difficulty: 0 },
        { title: "La silla ocupada", text: "Al levantar la vista tienes durante un instante la certeza de que alguien está sentado frente a ti. Cuando parpadeas no hay nadie.", difficulty: 0 },
        { title: "La séptima cinta", text: "Encuentras una cinta sin etiqueta en un lugar donde ya habías buscado.", difficulty: 0 }
      ],
      tension: [
        { title: "Primera Dama · La versión", text: "La cinta dice: «Siempre dices que yo fui quien se marchó. Pero no fue así». A partir de ahora, una verdad establecida debe poder ser cuestionada." },
        { title: "Segunda Dama · La conversación imposible", text: "La grabación reproduce una frase pronunciada por el protagonista hace apenas unos minutos. Después, la voz responde: «Eso tampoco es exactamente verdad»." },
        { title: "Tercera Dama · La séptima cinta", text: "En la última grabación se oye la voz actual del protagonista. La otra persona pregunta: «Si pudieras volver a aquella noche sabiendo lo que sabes ahora… ¿harías algo distinto?» No hay tirada para responder." }
      ],
      epilogues: {
        high: "Elige un único objeto para conservar. El resto se queda en la casa. Al salir no sabes si has sido perdonado, pero descubres que ya no necesitas saberlo.",
        low: "Te llevas la última cinta. Años después todavía la escuchas algunas noches. Siempre acaba igual, hasta que una noche aparecen tres segundos nuevos: tu nombre, pronunciado suavemente.",
        zero: "Cuando recoges la séptima cinta ves una fecha escrita bajo la etiqueta. Es la fecha de mañana."
      },
      memories: [
        { title: "La última conversación", prompt: "¿Cuál fue la última frase que recuerdas haberle dicho?", followUp: "¿Estás seguro de que fue la última?" },
        { title: "Lo que nunca pediste", prompt: "¿Qué disculpa esperaste recibir durante años?", followUp: "¿Qué disculpa podría haber esperado la otra persona de ti?" },
        { title: "El día bueno", prompt: "Cuéntame un día en que todo parecía sencillo entre vosotros.", followUp: "¿Qué detalle de aquel día comprendes ahora de otra manera?" },
        { title: "La omisión", prompt: "¿Qué parte de esta historia nunca cuentas cuando alguien te pregunta?", followUp: "¿A quién intentas proteger cuando la omites?" },
        { title: "La decisión", prompt: "¿Qué pequeña decisión cambió algo enorme entre vosotros?", followUp: "¿Cuándo entendiste por primera vez que había sido importante?" }
      ],
      ambient: { label: "Casa vacía · lluvia lejana", intensity: 32 }, customBack: ""
    }
  },
  {
    name: "La casa que respira",
    type: "scenario",
    img: `${PATH}/assets/branding/scenario-house.webp`,
    system: {
      author: "MR · Cuentos de Ánimas", duration: "45–70 min", cover: `${PATH}/assets/branding/scenario-house.webp`,
      hook: "Has venido a inventariar una casa antes de su demolición. La casa lleva toda la noche inventariándote a ti.",
      tone: ["Horror rural", "Casa encantada", "Breve"], modes: ["guardian", "bonfire", "diary"],
      contentNotes: ["Claustrofobia", "Muerte familiar"], recommendedSpirit: 5, recommendedDetermination: 5,
      synopsis: `<p>Una antigua vivienda familiar será demolida al amanecer. Te han encargado fotografiar y catalogar lo que queda dentro.</p><p>Cuando cierras la puerta, las habitaciones empiezan a cambiar de tamaño. En las paredes aparecen marcas de altura con tu nombre y fechas que aún no han sucedido.</p>`,
      instructions: `<p>Partida de demostración para aprender la Mesa de Ánimas. Mantén las escenas cortas y deja que la casa utilice recuerdos cotidianos antes de mostrar abiertamente lo imposible.</p>`,
      secondaryCharacters: [
        { name: "Ramón, el vecino", description: "Tiene las llaves y se niega a entrar después del anochecer.", secret: "Oyó voces en la casa cuando llevaba veinte años vacía.", image: "" },
        { name: "La niña del pasillo", description: "Solo aparece reflejada en cristales.", secret: "No es una niña desconocida.", image: "" }
      ],
      clues: [
        { title: "Marcas de altura", text: "En una jamba aparecen marcas con tu nombre y edades que no recuerdas haber pasado aquí.", difficulty: 0 },
        { title: "Fotografía reciente", text: "Una fotografía instantánea muestra la habitación donde estás, tomada desde detrás de ti.", difficulty: 0 },
        { title: "Plano imposible", text: "El plano municipal incluye una habitación que no existe... todavía.", difficulty: 0 },
        { title: "Polvo interrumpido", text: "Un rastro de pequeñas pisadas atraviesa el polvo y termina en una pared lisa.", difficulty: 0 }
      ],
      environmentObstacles: [
        { title: "El corredor se alarga", text: "La puerta de salida se aleja cada vez que das un paso hacia ella.", difficulty: 5 },
        { title: "La habitación mengua", text: "Las paredes avanzan unos centímetros con cada respiración.", difficulty: 6 },
        { title: "Escalones de más", text: "La escalera tiene un peldaño nuevo. Luego otro.", difficulty: 4 },
        { title: "La ventana no da afuera", text: "Al abrir la contraventana ves otra habitación de la misma casa.", difficulty: 5 }
      ],
      characterObstacles: [
        { title: "Ramón llama", text: "El vecino insiste en que salgas ya, pero al otro lado del teléfono se oye tu propia voz pidiéndole que no abra la puerta.", difficulty: 5 },
        { title: "La niña señala", text: "La figura reflejada señala algo detrás de ti y empieza a llorar.", difficulty: 5 },
        { title: "Una voz familiar", text: "Desde la habitación inexistente alguien utiliza un apodo que solo una persona conocía.", difficulty: 6 },
        { title: "Tu nombre en la pared", text: "La casa escribe una acusación usando tu nombre completo.", difficulty: 4 }
      ],
      incidents: [
        { title: "Golpe bajo el suelo", text: "Tres golpes lentos responden exactamente al ritmo de tus pasos.", difficulty: 0 },
        { title: "Luz en la cocina", text: "Una estancia que estaba sin corriente aparece iluminada con una luz amarilla de otra época.", difficulty: 0 },
        { title: "Una puerta nueva", text: "Donde antes había pared hay ahora una puerta entreabierta.", difficulty: 0 },
        { title: "Respiración", text: "Durante unos segundos toda la estructura se expande y contrae como un pecho dormido.", difficulty: 0 }
      ],
      tension: [
        { title: "Primera Dama · La casa te conoce", text: "Una marca antigua de la pared contiene tu nombre y tu fecha de nacimiento." },
        { title: "Segunda Dama · La habitación", text: "Aparece la habitación del plano imposible. Dentro hay objetos de tu infancia que jamás estuvieron en esta casa." },
        { title: "Tercera Dama · Demolición", text: "Oyes maquinaria acercándose. El amanecer ha llegado, pero las ventanas siguen mostrando noche cerrada." }
      ],
      epilogues: {
        high: "Sales cuando la primera máquina golpea la fachada. Entre el polvo ves, durante un instante, a alguien observando desde una ventana que nunca existió.",
        low: "Escapas, pero semanas después encuentras en tu casa una nueva marca de altura junto al marco de tu dormitorio.",
        zero: "Cuando los obreros derriban la vivienda no encuentran a nadie. En una pared interior aparece una marca nueva con tu nombre y la fecha de hoy."
      },
      memories: [
        { title: "La primera casa", prompt: "¿Qué lugar de tu infancia parecía enorme y hoy sabes que era diminuto?", followUp: "¿Quién estaba siempre allí contigo?" },
        { title: "La voz", prompt: "¿Quién utilizaba ese apodo que acabas de oír?", followUp: "¿Qué fue lo último que te dijo?" },
        { title: "La puerta prohibida", prompt: "¿Qué puerta de tu infancia no tenías permiso para abrir?", followUp: "¿Qué creías que había al otro lado?" }
      ],
      ambient: { label: "Madera · viento · casa asentándose", intensity: 40 }, customBack: ""
    }
  }
];
