/**
 * Mazos de eventos. Personajes ficticios pero reconocibles del Perú de a pie.
 *
 * - `who`: personaje que la presenta (clave de CHARACTERS).
 * - `shock`: efecto total sobre el trimestre ({ demand, supply, credibility }), en
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
        title: 'Un trimestre tranquilo',
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
        id: 'boom-inmobiliario', tier: 2, kind: 'demanda', who: 'gremio',
        title: 'Boom inmobiliario en Lima',
        quote: 'Se venden departamentos en planos en Surco y Jesús María. Los bancos se pelean por dar hipotecas.',
        shock: { demand: 1.3 }, asks: null
    },
    // ---------- Tier 3: fuertes ----------
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
    'recesion-mundial': ['exportaciones-', 'cobre-'], 'ministro-presiona': ['politica'], 'gasto-fiscal': ['fiscal+']
};
EVENTS.forEach(e => { e.tags = EVENT_TAGS[e.id] ?? []; });

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
    { id: 'lluvias-norte', who: 'meteo', title: 'Lluvias intensas en el norte', text: 'Desbordes en Piura y Lambayeque. Se pierden cosechas de limón y arroz.', shock: { supply: 0.4, demand: -0.2 } }
];

const SURPRISE_TAGS = {
    'paro-transportistas': ['transporte'], 'huaico-central': ['central'], 'balon-gas': ['combustible'],
    'cobre-cae': ['cobre-'], 'heladas-sur': ['heladas'], anchoveta: ['pesca-'], 'crisis-politica': ['politica'],
    turismo: ['turismo+'], 'lluvias-norte': ['lluvias']
};
SURPRISES.forEach(x => { x.tags = SURPRISE_TAGS[x.id] ?? []; });

export const SURPRISE_BY_ID = Object.fromEntries(SURPRISES.map(s => [s.id, s]));
