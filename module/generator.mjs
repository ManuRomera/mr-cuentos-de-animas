/**
 * Generador de protagonistas: puro, sin Foundry, probado en Node.
 * Todo lo que produce cumple las reglas de creación del libro: nombre, profesión, lugar de origen,
 * descripción física, breve historial, cuatro rasgos u objetos y un reparto de 10 entre Espíritu y
 * Determinación con un mínimo de 3 en cada uno.
 * Las frases evitan concordancias de género salvo en nombre y profesión, que van emparejados.
 */
import { RULES } from "./rules.mjs";

const pick = (list, rng) => list[Math.floor(rng() * list.length) % list.length];
const pickMany = (list, n, rng) => {
  const pool = [...list], out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length) % pool.length, 1)[0]);
  return out;
};
const int = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

/* -------------------------------------------- */
/*  Tablas                                      */
/* -------------------------------------------- */

export const NAMES = {
  f: ["Amparo", "Ana", "Aurora", "Begoña", "Blanca", "Candela", "Carmen", "Celia", "Consuelo", "Dolores", "Elena", "Elvira",
    "Encarna", "Esperanza", "Eulalia", "Fermina", "Filomena", "Gloria", "Guadalupe", "Herminia", "Inés", "Irene", "Isabel",
    "Jacinta", "Josefa", "Julia", "Leonor", "Lucía", "Luz", "Macarena", "Manuela", "Margarita", "María", "Marina", "Marta",
    "Mercedes", "Milagros", "Nieves", "Olvido", "Paloma", "Pilar", "Remedios", "Rocío", "Rosa", "Rosario", "Sagrario",
    "Soledad", "Teresa", "Trinidad", "Valle", "Vega", "Xiana", "Uxía", "Ainhoa", "Nerea", "Iratxe", "Montse", "Nuria", "Laia", "Olga"],
  m: ["Abel", "Adrián", "Agustín", "Alfonso", "Álvaro", "Amador", "Andrés", "Anselmo", "Antonio", "Aurelio", "Baltasar",
    "Benito", "Bernardo", "Casimiro", "Cipriano", "Claudio", "Damián", "Eladio", "Elías", "Emilio", "Esteban", "Eusebio",
    "Faustino", "Federico", "Felipe", "Fermín", "Gabriel", "Genaro", "Gonzalo", "Hilario", "Ignacio", "Isidro", "Jacinto",
    "Jaime", "Joaquín", "Julián", "León", "Lorenzo", "Lucas", "Manuel", "Marcelo", "Martín", "Matías", "Nicanor", "Pascual",
    "Pedro", "Ramiro", "Rodrigo", "Rufino", "Salvador", "Santiago", "Sebastián", "Tomás", "Valentín", "Xoán", "Brais", "Iker",
    "Unai", "Jordi", "Pau"]
};

export const SURNAMES = ["Aguirre", "Alonso", "Arenas", "Barrio", "Benítez", "Blanco", "Bravo", "Caballero", "Calvo", "Campos",
  "Carrasco", "Castro", "Cid", "Cortés", "Crespo", "Cuevas", "Delgado", "Díez", "Domínguez", "Escudero", "Espinosa", "Esteban",
  "Ferrer", "Flores", "Fuentes", "Gallego", "Garrido", "Gil", "Herrero", "Hidalgo", "Iglesias", "Lago", "León", "Lozano",
  "Luna", "Marín", "Márquez", "Medina", "Molina", "Montero", "Mora", "Moreno", "Navarro", "Nieto", "Ortega", "Otero", "Pardo",
  "Pastor", "Peña", "Prieto", "Quintana", "Ramos", "Reyes", "Ríos", "Robles", "Rojas", "Roldán", "Rubio", "Salazar", "Sanz",
  "Serrano", "Soler", "Soto", "Tejada", "Toledo", "Urrutia", "Valle", "Vargas", "Vidal", "Villar", "Zamora", "Varela",
  "Lamas", "Etxeberria", "Arrieta", "Puig", "Casals"];

/** Profesiones en pareja [masculino, femenino] con objetos propios del oficio. */
export const PROFESSIONS = [
  ["Maestro rural", "Maestra rural", ["Una caja de tizas a medias", "El cuaderno de asistencia de la escuela", "Un mapa escolar enrollado"]],
  ["Médico de pueblo", "Médica de pueblo", ["Un maletín de cuero gastado", "Un estetoscopio con el nombre grabado", "Un frasco de láudano"]],
  ["Enfermero", "Enfermera", ["Un termómetro de mercurio", "Un reloj de solapa", "Vendas limpias y alcohol"]],
  ["Sacerdote", "Monja", ["Un breviario lleno de notas", "Un rosario de madera", "Una estola bordada"]],
  ["Guardia civil", "Guardia civil", ["Un tricornio abollado", "Una libreta de atestados", "Una linterna de dinamo"]],
  ["Periodista", "Periodista", ["Una grabadora de casete", "Una libreta con recortes", "Una cámara Kodak"]],
  ["Fotógrafo", "Fotógrafa", ["Una cámara de fuelle", "Un carrete sin revelar", "Placas de cristal envueltas en paño"]],
  ["Escritor", "Escritora", ["Una pluma estilográfica", "Un manuscrito sin terminar", "Una máquina de escribir portátil"]],
  ["Pastor", "Pastora", ["Un cayado de fresno", "Un zurrón con pan y queso", "Un cuerno para llamar al rebaño"]],
  ["Campesino", "Campesina", ["Una hoz afilada", "Un saco de semillas", "Un pañuelo para el sol"]],
  ["Leñador", "Leñadora", ["Un hacha de mango largo", "Una sierra de arco", "Cuerda de cáñamo"]],
  ["Minero", "Minera", ["Una lámpara de carburo", "Un pico corto", "Un canario en una jaula"]],
  ["Pescador", "Pescadora", ["Una red remendada", "Un cuchillo de destripar", "Un chubasquero amarillo"]],
  ["Farero", "Farera", ["Un libro de registro del faro", "Una lata de queroseno", "Un catalejo de latón"]],
  ["Molinero", "Molinera", ["Un saco de harina", "Una llave de hierro del molino", "Un candil de aceite"]],
  ["Herrero", "Herrera", ["Un martillo de forja", "Unas tenazas", "Una herradura de la suerte"]],
  ["Carpintero", "Carpintera", ["Una garlopa", "Un metro plegable", "Clavos de forja en un bolsillo"]],
  ["Cartero", "Cartera", ["Una saca de cartas sin entregar", "Una bicicleta vieja", "Un sello de caucho"]],
  ["Tabernero", "Tabernera", ["Una bota de vino", "Un libro de fiado", "Un manojo de llaves"]],
  ["Boticario", "Boticaria", ["Un mortero de mármol", "Frascos etiquetados a mano", "Una balanza de precisión"]],
  ["Curandero", "Curandera", ["Un manojo de hierbas secas", "Un amuleto de azabache", "Un ungüento en una lata"]],
  ["Partero", "Partera", ["Tijeras hervidas envueltas en lino", "Una oración cosida a la ropa", "Un cazo de cobre"]],
  ["Enterrador", "Enterradora", ["Una pala de hoja estrecha", "Un farol de mano", "El plano del cementerio"]],
  ["Sereno", "Serena", ["Un chuzo", "Un manojo enorme de llaves", "Un silbato"]],
  ["Veterinario", "Veterinaria", ["Un maletín con jeringas", "Una cuerda para reses", "Un libro de enfermedades del ganado"]],
  ["Ingeniero de caminos", "Ingeniera de caminos", ["Un teodolito plegable", "Planos del pantano", "Un compás de puntas"]],
  ["Topógrafo", "Topógrafa", ["Una brújula de mira", "Estacas numeradas", "Un mapa con cotas corregidas"]],
  ["Arqueólogo", "Arqueóloga", ["Una paleta de albañil", "Un cepillo de cerdas suaves", "Una bolsa de fragmentos cerámicos"]],
  ["Folclorista", "Folclorista", ["Una grabadora de bobina", "Un cuaderno de coplas", "Fotografías de fiestas antiguas"]],
  ["Historiador", "Historiadora", ["Legajos fotocopiados", "Una lupa", "Una carta de un archivo diocesano"]],
  ["Bibliotecario", "Bibliotecaria", ["Un sello de préstamo", "Un libro nunca devuelto", "Unas gafas de media luna"]],
  ["Notario", "Notaria", ["Un testamento lacrado", "Una pluma de oro", "El registro de una herencia"]],
  ["Abogado", "Abogada", ["Un expediente judicial", "Una cartera de piel", "Una citación sin firmar"]],
  ["Inspector de policía", "Inspectora de policía", ["Una placa", "Un revólver descargado", "Fotografías de un caso cerrado"]],
  ["Detective privado", "Detective privada", ["Una libreta de seguimientos", "Una petaca", "Una foto de alguien desaparecido"]],
  ["Estudiante", "Estudiante", ["Apuntes subrayados", "Un walkman con una cinta", "Una mochila con parches"]],
  ["Músico ambulante", "Música ambulante", ["Un acordeón", "Una gaita remendada", "Un sombrero para las monedas"]],
  ["Actor de compañía", "Actriz de compañía", ["Un libreto ajado", "Maquillaje de teatro", "Un disfraz doblado"]],
  ["Pintor", "Pintora", ["Una caja de óleos", "Un cuaderno de bocetos", "Un lienzo a medio pintar"]],
  ["Relojero", "Relojera", ["Una lupa de ojo", "Un reloj que se retrasa", "Destornilladores diminutos"]],
  ["Camionero", "Camionera", ["Un termo de café", "Un mapa de carreteras manchado", "Una radio de banda ciudadana"]],
  ["Taxista", "Taxista", ["Un taxímetro roto", "Una estampa en el retrovisor", "Monedas sueltas en un bote"]],
  ["Conductor de autobús de línea", "Conductora de autobús de línea", ["El horario de la línea", "Una gorra de uniforme", "Un billete sin picar"]],
  ["Guarda forestal", "Guarda forestal", ["Unos prismáticos", "Una escopeta de dos cañones", "Un mapa de cortafuegos"]],
  ["Cazador", "Cazadora", ["Una escopeta vieja", "Un cuchillo de monte", "Un perro de caza"]],
  ["Apicultor", "Apicultora", ["Un ahumador", "Un velo de apicultura", "Un tarro de miel oscura"]],
  ["Vendedor ambulante", "Vendedora ambulante", ["Una maleta de muestras", "Un catálogo de enciclopedias", "Una furgoneta que falla"]],
  ["Emigrante que regresa", "Emigrante que regresa", ["Una maleta de cartón", "Cartas nunca enviadas", "Una foto del barco"]],
  ["Radioaficionado", "Radioaficionada", ["Un receptor de onda corta", "Un cuaderno de frecuencias", "Auriculares de baquelita"]],
  ["Técnico de telefonía", "Técnica de telefonía", ["Un auricular de pruebas", "Cable de cobre", "Una escalera plegable"]],
  ["Electricista", "Electricista", ["Un buscapolos", "Cinta aislante", "Una linterna frontal"]],
  ["Agente inmobiliario", "Agente inmobiliaria", ["Un llavero de casas vacías", "Fotos de una finca en venta", "Un contrato de arras"]],
  ["Tasador de antigüedades", "Tasadora de antigüedades", ["Una lupa de joyero", "Un inventario manuscrito", "Guantes de algodón"]],
  ["Investigador de lo paranormal", "Investigadora de lo paranormal", ["Un medidor de campos", "Una grabadora de psicofonías", "Una cámara infrarroja"]],
  ["Cocinero", "Cocinera", ["Un cuchillo cebollero", "Un recetario familiar", "Un delantal manchado"]],
  ["Costurero", "Costurera", ["Tijeras de sastre", "Un acerico lleno de alfileres", "Un vestido a medio coser"]],
  ["Marinero", "Marinera", ["Una navaja de marinero", "Un chubasquero", "Una brújula de bolsillo"]],
  ["Soldado de permiso", "Soldado de permiso", ["Una cantimplora abollada", "Una carta de su unidad", "Unas placas de identificación"]],
  ["Contable", "Contable", ["Un libro mayor", "Una calculadora de manivela", "Unas gafas de pinza"]],
  ["Jubilado", "Jubilada", ["Un bastón con puño de plata", "Una radio de transistores", "Un álbum de fotos"]]
];

export const ORIGINS = [
  "Una aldea de los Ancares", "Un pueblo minero de León", "La Ribeira Sacra", "Un caserío de la Montaña de Navarra",
  "Una pedanía de la Alpujarra", "Un pueblo pesquero de la Costa da Morte", "Un valle del Pirineo aragonés",
  "La Sierra de Gata", "Un pueblo abandonado de Soria", "Las Hurdes", "Un cortijo de Jaén", "La Tierra de Campos",
  "Un barrio viejo de Salamanca", "Los Montes de Toledo", "Un pueblo del Maestrazgo", "La comarca de Las Villuercas",
  "Un lugar de la Serranía de Cuenca", "Una isla de la Graciosa", "La Gomera", "Un pueblo de las Arribes del Duero",
  "Un puerto del Cantábrico", "La Sierra de Francia", "Un pueblo de La Mancha con molinos", "Una masía del Empordà",
  "Un pueblo de la huerta valenciana", "La Siberia extremeña", "Un valle de Liébana", "Un pueblo de pizarra de Guadalajara",
  "Las Merindades", "Un pueblo de la Raya portuguesa", "Madrid, un barrio obrero", "Barcelona, el Raval",
  "Bilbao, junto a la ría", "Sevilla, Triana", "Valencia, el Cabanyal", "Zaragoza, junto al Ebro", "Oviedo",
  "Una colonia minera de Río Tinto", "Un pueblo anegado por un pantano", "Una ciudad de provincias sin nombre en los mapas",
  "Buenos Aires, San Telmo", "Un pueblo de Jalisco", "La sierra de Oaxaca", "Un pueblo andino de Perú", "Valparaíso",
  "La Habana Vieja", "Montevideo", "Un pueblo de Galicia vaciado por la emigración", "Una aldea de Trás-os-Montes",
  "Una casa de huéspedes en un puerto que ya no recibe barcos"
];

export const DESCRIPTION = {
  build: ["Complexión enjuta", "Complexión ancha y fuerte", "Estatura baja y paso rápido", "Estatura alta, algo encorvada",
    "Cuerpo menudo, casi frágil", "Hombros caídos de cansancio", "Manos grandes de trabajar", "Postura rígida, siempre alerta",
    "Andar lento, como quien mide el suelo", "Cuerpo curtido a la intemperie", "Figura delgada como un junco",
    "Presencia robusta que llena las puertas", "Movimientos nerviosos", "Porte tranquilo de quien ha visto mucho"],
  hair: ["pelo cano recogido", "pelo negro muy corto", "melena rizada y rebelde", "pelo castaño con mechones grises",
    "pelo rubio casi blanco", "cabeza rapada", "trenza larga y oscura", "pelo pelirrojo apagado", "pelo lacio que cae sobre la frente",
    "pelo revuelto por el viento", "pelo teñido que ya deja ver las raíces", "pelo escaso peinado con cuidado"],
  eyes: ["ojos claros que no parpadean", "ojos oscuros y hundidos", "mirada huidiza", "mirada que sostiene demasiado tiempo",
    "ojos de distinto color", "ojeras profundas", "ojos pequeños y vivos", "gafas de montura gruesa", "gafas remendadas con cinta",
    "un ojo entrecerrado por una vieja herida", "mirada miope y amable", "ojos enrojecidos por el insomnio"],
  mark: ["una cicatriz en la ceja", "un lunar junto a la boca", "manos manchadas de tinta", "uñas mordidas", "un diente de oro",
    "pecas por toda la cara", "una quemadura antigua en el antebrazo", "dedos amarillos de tabaco", "una marca de nacimiento en el cuello",
    "una cojera leve", "voz ronca", "un tic en el párpado", "risa demasiado alta", "silencios largos antes de responder",
    "olor a humo de leña", "olor a colonia barata", "piel muy pálida", "piel oscurecida por el sol", "un tatuaje marinero descolorido",
    "una oreja perforada varias veces", "barba descuidada de varios días", "manos que no dejan de moverse"],
  clothes: ["abrigo de paño demasiado grande", "chaqueta de pana gastada en los codos", "jersey de lana hecho a mano",
    "gabardina con los bolsillos llenos", "ropa de luto que nadie recuerda por quién", "botas de agua embarradas",
    "traje planchado con esmero", "chal de lana negra", "cazadora de cuero agrietada", "boina calada hasta las cejas",
    "mono de trabajo con remiendos", "camisa blanca siempre abotonada hasta arriba", "bufanda larga de colores",
    "ropa prestada que no es de su talla", "un medallón que nunca se quita"]
};

export const BACKSTORY = {
  why: ["Vuelve al lugar donde creció después de muchos años fuera", "Ha llegado para hacerse cargo de una herencia inesperada",
    "Busca a un familiar que dejó de escribir hace meses", "Le han destinado aquí sin que nadie le diga por qué",
    "Está de paso, pero el coche se ha averiado", "Ha aceptado un encargo que nadie más quería", "Huye de algo que no cuenta",
    "Viene a cerrar para siempre la casa familiar", "Sigue la pista de una historia que podría cambiar su vida",
    "Recibió una carta sin remite que le pedía venir", "Viene a enterrar a alguien", "Necesita el dinero de este trabajo",
    "Quiere comprobar que lo que recuerda de su infancia no fue un sueño", "Acompaña a otra persona que ha desaparecido nada más llegar",
    "Ha venido a descansar por prescripción médica", "Investiga una desaparición que la prensa olvidó"],
  wound: ["En su infancia presenció algo que nunca ha contado", "Perdió a su pareja en un accidente del que se siente culpable",
    "Rompió con su familia y nunca pidió perdón", "Pasó una temporada en un sanatorio", "Dejó atrás a un hermano cuando más le necesitaba",
    "Sobrevivió a un incendio en el que murió alguien", "Arrastra una deuda que no puede pagar", "Tuvo que renunciar a su vocación",
    "Nadie en su familia le creyó cuando habló de las voces", "Una promesa incumplida le persigue desde hace años",
    "Un amor de juventud desapareció sin explicación", "Estuvo a punto de ahogarse y desde entonces sueña con agua",
    "Lleva años sin dormir una noche entera", "Firmó algo que no debía y perjudicó a otras personas"],
  secret: ["Guarda una carta que no se atreve a abrir", "Conoce el nombre de alguien que todo el pueblo quiere olvidar",
    "Cree que alguien le sigue desde hace semanas", "A veces escribe en sueños con una letra que no es la suya",
    "Nunca le ha dicho a nadie que puede oír cuando alguien va a morir", "Tiene una fotografía en la que aparece donde nunca estuvo",
    "Sabe que su apellido no es el suyo", "Lleva encima algo que robó de una iglesia", "Reconoce este lugar aunque jura no haber estado nunca",
    "Mintió en una declaración y un inocente pagó por ello", "Todavía llama a un número que ya no existe",
    "Sospecha que la muerte de su abuela no fue natural", "Oye su nombre en el viento desde la infancia", "No recuerda un año entero de su vida"]
};

export const EPITHETS = ["Manos de ceniza", "Ojos de invierno", "Voz de lluvia", "Sombra en el umbral", "Quien vuelve siempre",
  "Pies de camino", "Corazón de pizarra", "Sal en las heridas", "Última luz del faro", "Quien no duerme", "Memoria de piedra",
  "Hilo suelto", "Llave sin puerta", "Nieve tardía", "Eco del pozo", "Paso en la escalera", "Perro sin amo", "Candil en la niebla",
  "Tinta y hueso", "Promesa rota", "Raíz al aire", "Nudo en la garganta", "Viento del norte", "Flor de cementerio", "Silencio de misa",
  "Madera vieja", "Agua quieta", "Sin retrato", "Pulso firme", "Mirada de búho", "Carta sin sello", "Bruma de otoño", "Brasas bajo la nieve",
  "Quien cuenta los pasos", "Sin padre ni madre", "Los bolsillos llenos", "Siempre de luto", "Sonrisa torcida", "Frío en los huesos", "Reloj parado"];

/** Rasgos: carácter y oficio que sirven para narrar (etiqueta + detalle). */
export const TRAITS = [
  ["Ojo observador", "Se fija en lo que los demás pasan por alto."], ["Testarudez", "No se rinde aunque todo apunte a que debería."],
  ["Fe inquebrantable", "Reza cuando el miedo aprieta, y a veces funciona."], ["Escepticismo", "Busca siempre una explicación racional."],
  ["Buena memoria", "Recuerda nombres, fechas y caras de hace décadas."], ["Sangre fría", "Mantiene la calma cuando otros gritan."],
  ["Don de gentes", "Consigue que cualquiera le cuente sus secretos."], ["Oído fino", "Distingue un crujido de una pisada."],
  ["Conoce el monte", "Se orienta sin brújula y sabe leer el terreno."], ["Manos hábiles", "Arregla, abre y fuerza casi cualquier cosa."],
  ["Latín de seminario", "Entiende inscripciones y viejos documentos."], ["Primeros auxilios", "Sabe cortar una hemorragia y entablillar."],
  ["Buen nado", "Aguanta en el agua fría más que nadie."], ["Resistencia", "Camina horas sin quejarse."], ["Sigilo", "Se mueve sin hacer ruido."],
  ["Intuición", "Presiente cuando algo va mal antes de verlo."], ["Curiosidad", "Abre la puerta que nadie quiere abrir."],
  ["Compasión", "No deja a nadie atrás, aunque le cueste caro."], ["Humor negro", "Bromea para no temblar."],
  ["Supersticiones", "Conoce los remedios de la abuela contra el mal de ojo."], ["Leyendas locales", "Sabe las historias que se cuentan junto al fuego."],
  ["Paciencia", "Puede esperar en silencio toda la noche."], ["Mentiras convincentes", "Inventa una historia creíble al instante."],
  ["Buena puntería", "Acierta con la escopeta a buena distancia."], ["Fuerza bruta", "Levanta, empuja y derriba."],
  ["Conducción temeraria", "Saca el coche de cualquier cuneta."], ["Ojo para las antigüedades", "Distingue lo valioso de lo falso."],
  ["Lectura de mapas", "Encuentra caminos que ya no aparecen en ninguno."], ["Hierbas medicinales", "Sabe qué planta cura y cuál mata."],
  ["Mecánica", "Entiende de motores, poleas y engranajes."], ["Canto", "Su voz calma a los niños y a los animales."],
  ["Oración aprendida", "Conoce una letanía antigua contra las ánimas."], ["Sueño ligero", "Se despierta con el menor ruido."],
  ["Instinto de supervivencia", "Sabe cuándo huir sin mirar atrás."], ["Contactos", "Siempre conoce a alguien que conoce a alguien."],
  ["Rigor", "Anota todo con fecha y hora."], ["Terquedad amable", "Pregunta una y otra vez hasta que le responden."],
  ["Valentía", "Da el primer paso hacia la oscuridad."], ["Culpa", "Carga con lo que pasó y eso le empuja a actuar."],
  ["Nostalgia", "Todo le recuerda a alguien que ya no está."], ["Empatía con los muertos", "A veces siente lo que sintieron."],
  ["Claustrofobia", "Los espacios cerrados le cortan el aliento."], ["Miedo al agua", "Nunca ha superado aquel verano."],
  ["Insomnio", "Las noches son largas y las pasa en vela."], ["Instinto protector", "Se interpone entre el peligro y los suyos."]
];

export const OBJECTS = ["Un mechero de gasolina que siempre prende", "Una navaja que fue de su abuelo", "Una estampa de la Virgen del Carmen",
  "Una llave que no sabe qué abre", "Una linterna con pilas de repuesto", "Un paquete de cartas atadas con cinta", "Una petaca de aguardiente",
  "Una brújula que no apunta al norte", "Un reloj de bolsillo sin cadena", "Una fotografía de alguien que no conoce", "Una caja de cerillas de un hotel",
  "Una medalla de comunión", "Un cuaderno de tapas negras", "Una bolsa de sal", "Un espejito de bolsillo", "Un colgante de azabache",
  "Una muñeca de trapo", "Un rosario de su madre", "Una armónica", "Un mapa dibujado a mano", "Una vela bendecida", "Un paraguas negro",
  "Un transistor de pilas", "Un anillo que no es suyo", "Una bala guardada en un pañuelo", "Un diario ajeno", "Una cinta de casete sin etiqueta",
  "Un frasco de agua bendita", "Una baraja española incompleta", "Unas gafas rotas que no tira", "Un silbato de hueso", "Una campanilla de plata",
  "Un billete de tren sin usar", "Un pañuelo bordado con iniciales", "Un trozo de tiza", "Una lupa pequeña", "Una herradura", "Un tintero vacío",
  "Un recorte de periódico amarillento", "Una piedra con un agujero en el centro"];

/* -------------------------------------------- */
/*  Generación                                  */
/* -------------------------------------------- */

/** Reparto válido al azar: Espíritu entre el mínimo y el máximo del libro, Determinación el resto. */
export function randomSplit(rng = Math.random) {
  const spirit = int(RULES.resourceMin, RULES.resourceMax, rng);
  return { spirit, determination: RULES.resourceTotal - spirit };
}

const gender = rng => (rng() < 0.5 ? "f" : "m");
const professionOf = (name, rng) => {
  const g = NAMES.f.includes(name.split(" ")[0]) ? 1 : 0;
  const p = pick(PROFESSIONS, rng);
  return { label: p[g], objects: p[2] };
};
const trait = ([label, text]) => ({ label, text });

/** Cada campo por separado, para volver a tirar solo ese. */
export const ROLL = {
  name: (rng, g = gender(rng)) => `${pick(NAMES[g], rng)} ${pick(SURNAMES, rng)}`,
  /** La profesión concuerda con el nombre que ya tenga el protagonista. */
  profession: (rng, name = "") => professionOf(name, rng).label,
  origin: rng => pick(ORIGINS, rng),
  age: rng => String(int(17, 78, rng)),
  epithet: rng => pick(EPITHETS, rng),
  description: rng => {
    const d = DESCRIPTION;
    return `${pick(d.build, rng)}, ${pick(d.hair, rng)} y ${pick(d.eyes, rng)}. Se le reconoce por ${pick(d.mark, rng)} y ${pick(d.clothes, rng)}.`;
  },
  backstory: rng => `${pick(BACKSTORY.why, rng)}. ${pick(BACKSTORY.wound, rng)}. ${pick(BACKSTORY.secret, rng)}.`,
  trait: rng => trait(pick(TRAITS, rng))
};

/**
 * Protagonista completo y jugable: dos rasgos de carácter, un objeto del oficio y uno personal
 * (los «cuatro rasgos u objetos» del libro) y un reparto de recursos válido.
 */
export function generateProtagonist(rng = Math.random) {
  const name = ROLL.name(rng);
  const profession = professionOf(name, rng);
  const { spirit, determination } = randomSplit(rng);
  const [a, b] = pickMany(TRAITS, 2, rng).map(trait);
  const tool = pick(profession.objects, rng), keepsake = pick(OBJECTS, rng);
  return {
    name,
    system: {
      profession: profession.label, origin: ROLL.origin(rng), age: ROLL.age(rng), epithet: ROLL.epithet(rng),
      description: ROLL.description(rng), backstory: ROLL.backstory(rng),
      spirit: { value: spirit, max: spirit }, determination: { value: determination, max: determination },
      traits: [a, b, { label: "Del oficio", text: tool }, { label: "Recuerdo", text: keepsake }]
    }
  };
}

/**
 * Lo que falta para que un protagonista cumpla la creación del libro.
 * Devuelve claves de i18n (`CdA.Create.Missing.*`); lista vacía = listo para jugar.
 */
export function creationProblems(actor) {
  const s = actor.system ?? {};
  const problems = [];
  if (!actor.name?.trim()) problems.push("name");
  for (const key of ["profession", "origin", "description", "backstory"]) if (!s[key]?.trim()) problems.push(key);
  if ((s.traits ?? []).filter(x => x.label?.trim() || x.text?.trim()).length < 4) problems.push("traits");
  const sp = s.spirit?.max, de = s.determination?.max;
  if (!(sp >= RULES.resourceMin && de >= RULES.resourceMin && sp + de === RULES.resourceTotal)) problems.push("split");
  return problems;
}
