/**
 * Mazos de eventos. Personajes ficticios pero reconocibles del Perú de a pie.
 *
 * - `who`: personaje que la presenta (clave de CHARACTERS).
 * - `shock`: efecto total sobre el turno ({ demand, supply, credibility }), en
 *   unidades mensuales del modelo; se reparte entre los meses del turno.
 * - `asks`: 'bajar' | 'subir' | null: lo que el personaje pide al Directorio.
 *   Ir en contra suma presión política (`pressure`); ceder cuando no conviene resta credibilidad.
 * - `tier`: 1 = suave (primer año), 2 = medio, 3 = fuerte. La intensidad sube con el mandato.
 * - `next`: id de una carta que se agenda para el turno siguiente (arcos de 2 turnos).
 * - `kind`: 'demanda' | 'oferta' | 'politica' | 'externo' | 'calma'.
 *
 * IMPREVISTOS: aparecen DESPUÉS de anunciar la decisión, así que la proyección no los veía.
 */

export const CHARACTERS = {
    ministro: { name: 'Ministro de Economía (MEF)', color: '#1b365d', initials: 'MEF' },
    congreso: { name: 'Presidenta de la Comisión de Economía del Congreso', color: '#7a2e8e', initials: 'CE' },
    gremio: { name: 'Don Aurelio, gremio de empresarios', color: '#a15c00', initials: 'DA' },
    gamarra: { name: 'Jessica, confeccionista de Gamarra', color: '#c2185b', initials: 'JG' },
    caserita: { name: 'Doña Rosa, caserita del mercado de Surquillo', color: '#1d7a4c', initials: 'DR' },
    chofer: { name: 'Don Mario, chofer de combi', color: '#5d4037', initials: 'DM' },
    cambista: { name: 'Pepe, cambista del jirón Ocoña', color: '#00695c', initials: 'PC' },
    analista: { name: 'Analista de una consultora limeña', color: '#28508a', initials: 'AN' },
    meteo: { name: 'Meteoróloga del ENFEN', color: '#0f7c8a', initials: 'EN' },
    agricultor: { name: 'Don Teodoro, agricultor de Ica', color: '#558b2f', initials: 'DT' },
    prensa: { name: 'Editor de Diario La Moneda', color: '#6a7686', initials: 'DLM' },
    minero: { name: 'Vocera de una minera del corredor sur', color: '#795548', initials: 'VM' }
};

export const EVENTS = [
    // ---------- Tier 1: suaves ----------
    {
        id: 'consumo-sube', tier: 1, kind: 'demanda', who: 'gamarra',
        title: 'Gamarra no para de vender',
        quote: '¡Estamos vendiendo como en campaña navideña! La gente está sacando préstamos para todo, caserito.',
        shock: { demand: 0.9 }, asks: null
    },
    {
        id: 'mercado-precios', tier: 1, kind: 'demanda', who: 'caserita',
        title: 'El pollo y el arroz suben cada semana',
        quote: 'Hijito, ya no me alcanza. Lo que antes compraba con veinte soles ahora me cuesta veinticinco.',
        shock: { demand: 0.5, credibility: -2 }, asks: 'subir', pressure: 0
    },
    {
        id: 'ministro-impulso', tier: 1, kind: 'politica', who: 'ministro',
        title: 'El MEF lanza un "shock de inversiones"',
        quote: 'Vamos a destrabar obras en todo el país. Una tasa más baja ayudaría a que la inversión despegue.',
        shock: { demand: 0.6 }, asks: 'bajar', pressure: 10
    },
    {
        id: 'calma', tier: 1, kind: 'calma', who: 'analista',
        title: 'Un respiro sin sobresaltos',
        quote: 'Sin mayores sobresaltos. Buen momento para ver si tus decisiones anteriores están funcionando.',
        shock: {}, asks: null
    },
    {
        id: 'cobre-alto', tier: 1, kind: 'externo', who: 'minero',
        title: 'El cobre está por las nubes',
        quote: 'Con estos precios entran más dólares, el sol se fortalece y en el sur se siente la bonanza.',
        shock: { demand: 0.6, supply: -0.3 }, asks: null
    },
    {
        id: 'fed-baja', tier: 1, kind: 'externo', who: 'cambista',
        title: 'La Fed baja sus tasas',
        quote: 'Los capitales vuelven a mercados como el nuestro. Hoy todos venden dólares, jefe: está bajando.',
        shock: { demand: 0.3, supply: -0.2 }, asks: null
    },
    {
        id: 'gremio-credito', tier: 1, kind: 'politica', who: 'gamarra',
        title: 'Las mypes piden crédito más barato',
        quote: 'Con estos intereses la caja municipal me cobra un ojo de la cara. ¡Bajen la tasa, pues!',
        shock: { demand: -0.3 }, asks: 'bajar', pressure: 8
    },
    // ---------- Tier 2: medios ----------
    {
        id: 'nino-aviso', tier: 2, kind: 'oferta', who: 'meteo',
        title: 'Alerta: se forma El Niño costero',
        quote: 'El mar frente a Piura y Tumbes está varios grados más caliente. Se vienen lluvias fuertes en el norte.',
        shock: { supply: 0.2 }, asks: null, next: 'nino-golpe'
    },
    {
        id: 'nino-golpe', tier: 99, kind: 'oferta', who: 'caserita',
        title: 'El Niño golpea: el limón cuesta el triple',
        quote: 'Los huaicos cortaron la Panamericana Norte. El limón, la cebolla y el pollo no llegan al mercado.',
        shock: { supply: 1.6, demand: -0.6 }, asks: 'subir', pressure: 0
    },
    {
        id: 'fed-sube', tier: 2, kind: 'externo', who: 'cambista',
        title: 'La Fed sube tasas y el dólar se dispara',
        quote: '¡Dólar, dólar! Hoy todos quieren comprar. Lo importado se va a poner más caro, jefe.',
        shock: { supply: 0.5, demand: -0.3, credibility: -3 }, asks: null
    },
    {
        id: 'elecciones', tier: 2, kind: 'politica', who: 'congreso',
        title: 'Se vienen las elecciones',
        quote: 'La gente necesita chamba. Si el BCR sube la tasa ahora, lo citaremos al Congreso para que explique.',
        shock: { demand: -0.4, credibility: -2 }, asks: 'bajar', pressure: 18
    },
    {
        id: 'petroleo', tier: 2, kind: 'oferta', who: 'chofer',
        title: 'El galón de gasolina sube otra vez',
        quote: 'Con lo que cuesta el combustible tenemos que subir el pasaje. Si no, no sale ni para el día.',
        shock: { supply: 1.0 }, asks: null
    },
    {
        id: 'guerra-petroleo', tier: 2, kind: 'externo', who: 'chofer',
        title: 'Guerra en Medio Oriente: el petróleo se dispara',
        quote: 'Dicen que es por una guerra al otro lado del mundo, pero el galón lo pago yo aquí. Otra vez sube el pasaje.',
        shock: { supply: 1.3, demand: -0.2, credibility: -2 }, asks: null
    },
    {
        id: 'boom-inmobiliario', tier: 2, kind: 'demanda', who: 'gremio',
        title: 'Boom inmobiliario en Lima',
        quote: 'Se venden departamentos en planos en Surco y Jesús María. Los bancos se pelean por dar hipotecas.',
        shock: { demand: 1.3 }, asks: null
    },
    // ---------- Tier 3: fuertes ----------
    // ---------- Ruido político (patrones reales del Perú, eventos ficticios y sin nombres) ----------
    {
        id: 'cambio-gabinete', tier: 2, kind: 'politica', who: 'prensa',
        title: 'Otro cambio de gabinete',
        quote: 'Es el tercer premier en lo que va del periodo. Los inversionistas prefieren esperar antes de decidir nada.',
        shock: { demand: -0.7, supply: 0.3 }, fx: 2.5, tags: ['politica'], asks: null
    },
    {
        id: 'elecciones-polarizadas', tier: 2, kind: 'politica', who: 'cambista',
        title: 'Elecciones polarizadas',
        quote: 'Con estas encuestas la gente viene a comprar dólares "por si acaso". Hoy no me alcanza el sencillo, jefe.',
        shock: { demand: -0.6, supply: 0.5 }, fx: 4, tags: ['politica', 'dolar'], asks: null
    },
    {
        id: 'paro-regional', tier: 2, kind: 'oferta', who: 'agricultor',
        title: 'Paro y bloqueos en el sur',
        quote: 'Las carreteras están tomadas: no podemos sacar la cosecha y en Lima los precios ya se movieron.',
        shock: { supply: 1.1, demand: -0.5 }, tags: ['politica', 'transporte'], asks: 'bajar', pressure: 8
    },
    {
        id: 'mocion-vacancia', tier: 3, kind: 'politica', who: 'prensa',
        title: 'El Congreso debate una moción de vacancia',
        quote: 'Otra vez la vacancia presidencial en agenda. El dólar salta y las empresas congelan sus planes.',
        shock: { demand: -1.3, supply: 0.4, credibility: -3 }, fx: 5, tags: ['politica'], asks: null
    },
    {
        id: 'conflicto-minero', tier: 3, kind: 'demanda', who: 'minero',
        title: 'Bloqueo en el corredor minero',
        quote: 'Llevamos semanas sin poder sacar el concentrado. Se paraliza la producción y se frenan inversiones.',
        shock: { demand: -1.4, credibility: -2 }, asks: 'bajar', pressure: 10
    },
    {
        id: 'recesion-mundial', tier: 3, kind: 'externo', who: 'analista',
        title: 'China y EE.UU. se enfrían a la vez',
        quote: 'Cae el precio del cobre y caen las exportaciones. Esto se va a sentir en el empleo.',
        shock: { demand: -1.8, supply: -0.3 }, asks: 'bajar', pressure: 12
    },
    {
        id: 'ministro-presiona', tier: 3, kind: 'politica', who: 'ministro',
        title: 'El ministro pide una reunión urgente',
        quote: 'Necesito que bajen la tasa ya. En Palacio están preocupados por las encuestas.',
        shock: { demand: 0.3 }, asks: 'bajar', pressure: 22
    },
    {
        id: 'expectativas-suben', tier: 3, kind: 'demanda', who: 'analista',
        title: 'Las expectativas de inflación se desanclan',
        quote: 'Las empresas ya planean remarcar precios 5% el próximo año. Nadie cree que la inflación vaya a bajar.',
        shock: { demand: 0.6, credibility: -8 }, asks: 'subir', pressure: 0
    },
    {
        id: 'rumor-viral', tier: 2, kind: 'politica', who: 'cambista',
        title: 'Rumor viral: «el BCR se queda sin dólares»',
        quote: 'Un audio de WhatsApp dice que el BCR no tiene dólares. Es falso, pero hoy la cola en mi esquina da la vuelta a la cuadra.',
        // Con credibilidad alta, el rumor casi no mueve al dólar (ver `credShield` en game/mandate.js).
        shock: { demand: -0.4, supply: 0.3, credibility: -3 }, credShield: true, asks: null
    },
    {
        id: 'gasto-fiscal', tier: 3, kind: 'demanda', who: 'congreso',
        title: 'El Congreso aprueba retiro de fondos de AFP',
        quote: 'Es la plata de la gente y tiene derecho a usarla. Aprobado por amplia mayoría.',
        shock: { demand: 1.6 }, asks: null
    }
];

// Etiquetas regionales: qué departamentos golpea cada evento (ver model/regions.js).
const EVENT_TAGS = {
    'consumo-sube': ['consumo+'], 'ministro-impulso': ['fiscal+'], 'cobre-alto': ['cobre+'],
    'nino-golpe': ['nino'], 'fed-sube': ['dolar'], elecciones: ['politica'], petroleo: ['combustible'],
    'boom-inmobiliario': ['credito+', 'consumo+'], 'conflicto-minero': ['conflicto-minero'],
    'recesion-mundial': ['exportaciones-', 'cobre-'], 'ministro-presiona': ['politica'], 'gasto-fiscal': ['fiscal+'],
    'guerra-petroleo': ['combustible'], 'fed-baja': ['credito+'], 'rumor-viral': ['dolar']
};
// Presión sobre el dólar (% de depreciación del sol en el turno si nadie interviene; el modo libre la escala).
const EVENT_FX = {
    'cobre-alto': -2.5, 'nino-golpe': 0.8, 'fed-sube': 3.5, elecciones: 2.5, petroleo: 0.8,
    'conflicto-minero': 1.2, 'recesion-mundial': 3, 'ministro-presiona': 1, 'expectativas-suben': 1.5, 'gasto-fiscal': 1,
    'guerra-petroleo': 2, 'fed-baja': -2.5, 'rumor-viral': 5
};
EVENTS.forEach(e => { e.tags = EVENT_TAGS[e.id] ?? []; e.fx = EVENT_FX[e.id] ?? 0; });

/**
 * La carta como lección (Game Design): qué golpea, cuál es la tentación del jugador y qué enseña.
 * La lección se revela en el diario, después de decidir: se aprende de la consecuencia.
 */
export const CARD_LESSONS = {
    'nino-golpe': { hits: 'Suben los alimentos', tempt: 'Subir la tasa de golpe', lesson: 'La tasa no hace llover: hay choques de oferta que solo se esperan, cuidando que no contagien las expectativas.' },
    'nino-aviso': { hits: 'Se viene un golpe a los alimentos', tempt: 'Actuar antes de tiempo', lesson: 'Un aviso no es un hecho. Prepararse no es lo mismo que sobrerreaccionar.' },
    'fed-sube': { hits: 'El dólar se dispara', tempt: 'Vender reservas sin parar', lesson: 'Las reservas se acaban: hay que dosificarlas. A veces subir la tasa o un discurso firme calman al dólar sin gastar.' },
    petroleo: { hits: 'Transporte y precios', tempt: 'Reaccionar con todo', lesson: 'Distinguir un choque temporal de una inflación persistente es la mitad del trabajo.' },
    'guerra-petroleo': { hits: 'Combustible, transporte y el dólar', tempt: 'Reaccionar con todo', lesson: 'Un choque externo de energía sube los precios, pero la tasa solo evita que se vuelva inflación persistente.' },
    'cobre-alto': { hits: 'Entran dólares, sube el ánimo', tempt: 'Bajar la tasa para celebrar', lesson: 'Los buenos tiempos también recalientan la economía.' },
    'cambio-gabinete': { hits: 'Cae la confianza y salta el dólar', tempt: 'Ignorarla', lesson: 'Un discurso firme puede valer más que mover la tasa.' },
    'mocion-vacancia': { hits: 'Cae la confianza y salta el dólar', tempt: 'Ignorarla', lesson: 'En una crisis política, la credibilidad acumulada del BCR es lo que sostiene al sol.' },
    'rumor-viral': { hits: 'Corrida hacia el dólar', tempt: 'Entrar en pánico', lesson: 'La credibilidad acumulada es el seguro: un BCR creíble calma con palabras lo que otro calma con reservas.' },
    elecciones: { hits: 'El Congreso presiona por bajar la tasa', tempt: 'Ceder', lesson: 'El costo de perder autonomía llega después, cuando nadie te cree.' },
    'elecciones-polarizadas': { hits: 'Todos compran dólares «por si acaso»', tempt: 'Vender reservas sin parar', lesson: 'La incertidumbre política pasa; las reservas gastadas no vuelven solas.' },
    'ministro-presiona': { hits: 'Presión de Palacio por bajar la tasa', tempt: 'Ceder', lesson: 'El BCR es autónomo por algo: la Constitución lo protege de las encuestas.' },
    'gasto-fiscal': { hits: 'Más gasto y más demanda', tempt: 'Dejarlo pasar', lesson: 'Cuando el Estado o el Congreso inyectan plata, el BCR tiene que compensar para que no se vuelva inflación.' },
    'boom-inmobiliario': { hits: 'Crédito y demanda a tope', tempt: 'Dejarlo pasar', lesson: 'Un boom de crédito se frena mejor temprano, con la tasa o con el encaje.' },
    'expectativas-suben': { hits: 'Las expectativas se desanclan', tempt: 'Esperar que se calmen solas', lesson: 'Cuando nadie cree en la meta, hay que actuar y hablar firme para recuperar la credibilidad.' }
};

/** Lección genérica por tipo de choque, para las cartas sin una propia (incluidas las de los capítulos). */
export const KIND_LESSONS = {
    demanda: { hits: 'La demanda y el crédito', tempt: 'Esperar a que se enfríe solo', lesson: 'La tasa actúa con rezago: con la demanda, conviene anticiparse.' },
    oferta: { hits: 'Los precios de alimentos o energía', tempt: 'Subir la tasa de golpe', lesson: 'Un choque de oferta pasa solo; lo importante es que no contagie las expectativas.' },
    politica: { hits: 'La presión política', tempt: 'Ceder', lesson: 'La autonomía del BCR se defiende con resultados y con credibilidad.' },
    externo: { hits: 'El dólar y el comercio exterior', tempt: 'Reaccionar con todo', lesson: 'No todo lo que pasa afuera se arregla con la tasa: a veces basta con amortiguar.' },
    calma: { hits: 'Nada en particular', tempt: 'Relajarse', lesson: 'Los meses tranquilos sirven para ver si tus decisiones anteriores están funcionando.' }
};

export function cardLesson(e) {
    return CARD_LESSONS[e?.id] ?? KIND_LESSONS[e?.kind] ?? KIND_LESSONS.calma;
}

export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));

/** Imprevistos de última hora (se revelan después de anunciar la decisión). */
export const SURPRISES = [
    { id: 'paro-transportistas', who: 'chofer', title: 'Paro de transportistas', text: 'Las combis y los camiones de carga paralizan Lima y las carreteras por el alza del combustible y la inseguridad.', shock: { supply: 0.45, demand: -0.35 } },
    { id: 'huaico-central', who: 'agricultor', title: 'Huaico bloquea la Carretera Central', text: 'Los alimentos de la sierra central no llegan a Lima durante días. Suben la papa y las verduras.', shock: { supply: 0.5 } },
    { id: 'balon-gas', who: 'caserita', title: 'Sube el balón de gas', text: 'El balón de 10 kilos sube cinco soles de golpe. Se siente en cada cocina y en cada menú.', shock: { supply: 0.35 } },
    { id: 'cobre-cae', who: 'minero', title: 'Se desploma el precio del cobre', text: 'Una mala noticia desde China tumba el precio del cobre. Menos dólares y menos inversión minera.', shock: { demand: -0.7, supply: 0.1 } },
    { id: 'heladas-sur', who: 'agricultor', title: 'Heladas y friaje en el sur', text: 'Las heladas en Puno y Cusco malogran cultivos. Sube el precio de la papa y la carne.', shock: { supply: 0.35 } },
    { id: 'anchoveta', who: 'analista', title: 'Se suspende la temporada de pesca', text: 'La anchoveta no aparece: el mar está caliente. Cae la producción de harina de pescado.', shock: { demand: -0.5 } },
    { id: 'crisis-politica', who: 'prensa', title: 'Crisis política: el Congreso cambia al Gabinete', text: 'Censuran al Premier y juramenta un nuevo Consejo de Ministros. Los inversionistas se ponen nerviosos.', shock: { demand: -0.4, credibility: -3 }, pressure: 8 },
    { id: 'turismo', who: 'gremio', title: 'Temporada récord de turismo', text: 'Cusco y Machu Picchu reciben más visitantes que nunca. Hoteles y restaurantes a tope.', shock: { demand: 0.35 } },
    { id: 'dolar-baja', who: 'cambista', title: 'El dólar se abarata', text: 'Entran capitales al Perú y el dólar baja. Lo importado se abarata un poco.', shock: { supply: -0.3 } },
    { id: 'fletes', who: 'gremio', title: 'Se disparan los fletes marítimos', text: 'Ataques a buques en una ruta clave del comercio mundial encarecen el transporte de contenedores. Lo importado llega más caro.', shock: { supply: 0.4 } },
    { id: 'lluvias-norte', who: 'meteo', title: 'Lluvias intensas en el norte', text: 'Desbordes en Piura y Lambayeque. Se pierden cosechas de limón y arroz.', shock: { supply: 0.4, demand: -0.2 } }
];

const SURPRISE_TAGS = {
    'paro-transportistas': ['transporte'], 'huaico-central': ['central'], 'balon-gas': ['combustible'],
    'cobre-cae': ['cobre-'], 'heladas-sur': ['heladas'], anchoveta: ['pesca-'], 'crisis-politica': ['politica'],
    turismo: ['turismo+'], 'lluvias-norte': ['lluvias'], fletes: ['combustible']
};
const SURPRISE_FX = { fletes: 0.5, 'cobre-cae': 2.5, 'crisis-politica': 3, 'dolar-baja': -2.5, 'paro-transportistas': 0.5, turismo: -0.5 };
SURPRISES.forEach(x => { x.tags = SURPRISE_TAGS[x.id] ?? []; x.fx = SURPRISE_FX[x.id] ?? 0; });

export const SURPRISE_BY_ID = Object.fromEntries(SURPRISES.map(s => [s.id, s]));
