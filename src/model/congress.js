/**
 * El Congreso: declaraciones y preguntas REALES hechas por congresistas, mostradas de forma
 * ANÓNIMA en el juego (solo se indica el año y el contexto). Las fuentes quedan aquí para
 * verificación; no se muestran en pantalla. No agregar frases sin una fuente verificable.
 *
 * Donde una cita se recortó se marca con […]. Se quitaron los nombres propios de las citas.
 */

/** Declaraciones reales. `topic` define cuándo aparecen. */
export const DECLARATIONS = [
    {
        topic: 'tasa', year: 2020, context: 'debate de la ley contra la usura',
        text: 'Ha llegado el momento de ponerle un alto a las tasas abusivas que impiden que el pequeño inversor pueda salir adelante.',
        source: 'https://comunicaciones.congreso.gob.pe/noticias/ccongreso-aprueba-ley-que-protege-de-la-usura-a-consumidores-de-servicios-financieros/'
    },
    {
        topic: 'tasa', year: 2020, context: 'debate de la ley contra la usura',
        text: 'Nosotros no somos enemigos de las empresas ni del sistema actual, pero sí rechazamos el abuso.',
        source: 'https://comunicaciones.congreso.gob.pe/noticias/ccongreso-aprueba-ley-que-protege-de-la-usura-a-consumidores-de-servicios-financieros/'
    },
    {
        topic: 'tasa', year: 2020, context: 'debate de la ley contra la usura',
        text: 'Lo que se busca es que se limite y se penalice la usura que no está penalizada.',
        source: 'https://comunicaciones.congreso.gob.pe/noticias/ccongreso-aprueba-ley-que-protege-de-la-usura-a-consumidores-de-servicios-financieros/'
    },
    {
        topic: 'tasa', year: 2020, context: 'debate sobre el congelamiento de deudas en la pandemia',
        text: 'Dadas las circunstancias, y que los bancos vienen reprogramando las deudas, pero con altos intereses moratorios, propongo a ustedes que se modifique esta disposición.',
        source: 'https://gestion.pe/economia/congreso-podemos-peru-ahora-plantea-congelar-por-120-dias-incluso-las-deudas-renegociadas-noticia/'
    },
    {
        topic: 'autonomia', year: 2026, context: 'sesión con el presidente del BCR, sobre el caso de la Reserva Federal',
        text: 'Eso ha ocurrido en Estados Unidos, eso lo ha hecho Donald Trump, es decir, limitar la autonomía de su entidad encargada de la política monetaria.',
        source: 'https://peru21.pe/economia/jpp-quiere-que-se-pueda-intervenir-la-autonomia-del-bcr/'
    },
    {
        topic: 'autonomia', year: 2026, context: 'sesión de ratificación del presidente del BCR',
        text: 'Yo creo que usted […] ha hecho el trabajo que se le encomendó y punto.',
        source: 'https://www.infobae.com/peru/2026/09/03/tenso-momento-entre-senador-de-juntos-por-el-peru-y-julio-velarde-ha-hecho-el-trabajo-que-se-le-encomendo-y-punto/'
    },
    {
        topic: 'crecimiento', year: 2026, context: 'al convocar al presidente del BCR para "evaluar la mejora económica"',
        text: 'Hay cosas que no pueden esperar.',
        source: 'https://www.infobae.com/peru/2026/02/19/jose-maria-balcazar-convoca-a-julio-velarde-para-evaluar-el-rol-del-bcr-hay-cosas-que-no-pueden-esperar/'
    }
];

/** Réplica real cuando el Directorio responde con evasivas. */
export const FOLLOW_UP = {
    year: 2026, context: 'sesión de ratificación del presidente del BCR',
    text: 'Por favor, quisiera que me conteste la pregunta originalmente. Usted contestó el comentario, pero no la pregunta.',
    source: 'https://www.infobae.com/peru/2026/09/03/tenso-momento-entre-senador-de-juntos-por-el-peru-y-julio-velarde-ha-hecho-el-trabajo-que-se-le-encomendo-y-punto/'
};

/**
 * Preguntas de citaciones al BCR. `kind: 'real'` = pregunta textual; `kind: 'recreacion'` = la
 * pregunta la redacta el juego, pero el episodio (`basis`) ocurrió y está documentado en `source`.
 * La pantalla lo rotula de forma distinta para no hacer pasar una recreación por una cita.
 *
 * Preguntas reales de citaciones al BCR. Cada una trae tres respuestas con estilos distintos:
 *  - tecnica: explica el mandato. Gana credibilidad, pero el Congreso se siente "sermoneado".
 *  - promesa: calma al Congreso comprometiendo tu próxima decisión (forward guidance).
 *  - evasiva: no compromete nada, pero el mercado lee la ambigüedad y el Congreso insiste.
 */
export const QUESTIONS = [
    {
        id: 'empleo-sueldo', kind: 'real', year: 2024, context: 'Comisión de Presupuesto',
        text: 'Aparte de ganar S/ 41 mil […], ¿cuáles han sido las obligaciones legales o iniciativas de parte del BCR para buscar apoyar el empleo en la población?',
        source: 'https://rpp.pe/politica/congreso/julio-velarde-explica-a-congresistas-las-funciones-del-bcr-durante-la-comision-de-presupuesto-video-noticia-1588535',
        answers: [
            { style: 'tecnica', text: 'El BCR no es el Gobierno. Por la Constitución, nuestra tarea es preservar la estabilidad monetaria: una inflación baja protege el sueldo de todos, y eso también cuida el empleo.' },
            { style: 'promesa', text: 'Entendemos la preocupación por el empleo. Le aseguro que no volveremos a subir la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'Es un tema muy importante que estamos evaluando con mucha atención, junto a todos los indicadores de la economía.' }
        ]
    },
    {
        id: 'empleo-digno', kind: 'real', year: 2024, context: 'Comisión de Presupuesto',
        text: '¿Qué rol debe jugar el BCR para impulsar una política que no solo genere empleo, sino que garantice que este sea digno, con salarios justos y con derechos laborales plenos?',
        source: 'https://rpp.pe/politica/congreso/julio-velarde-explica-a-congresistas-las-funciones-del-bcr-durante-la-comision-de-presupuesto-video-noticia-1588535',
        answers: [
            { style: 'tecnica', text: 'Los salarios y los derechos laborales dependen del Ejecutivo y del propio Congreso. El aporte del BCR es que la inflación no se coma esos salarios.' },
            { style: 'promesa', text: 'Tomamos nota. Nos comprometemos a no subir la tasa en el próximo trimestre para no frenar la creación de empleo.' },
            { style: 'evasiva', text: 'Compartimos plenamente ese objetivo y trabajamos todos los días pensando en el bienestar de los peruanos.' }
        ]
    },
    {
        id: 'reservas-quien', kind: 'real', year: 2024, context: 'Comisión de Presupuesto',
        text: 'Constantemente, el país se pide préstamos internacionales […] pero nos manifiestan que el BCR tiene US$ 82 millones. ¿Quién utiliza estos fondos?',
        note: 'Las reservas del BCR superaban los US$ 80 mil millones, no millones.',
        source: 'https://rpp.pe/politica/congreso/julio-velarde-explica-a-congresistas-las-funciones-del-bcr-durante-la-comision-de-presupuesto-video-noticia-1588535',
        answers: [
            { style: 'tecnica', text: 'Son más de 80 mil millones de dólares, y no son una caja para gastar: respaldan al sol y protegen al país ante crisis externas. Usarlas para gasto corriente sería repetir los errores de los 80.' },
            { style: 'promesa', text: 'Vamos a estudiar con el MEF cómo apoyar al país, y mientras tanto no subiremos la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'Las reservas se administran con criterios técnicos, de acuerdo con nuestra Ley Orgánica.' }
        ]
    },
    {
        id: 'reservas-infraestructura', kind: 'real', year: 2026, context: 'sesión con el presidente del BCR',
        text: 'Nos gustaría que nos pueda explicar técnicamente y no doctrinariamente, por qué un país que concentra más del 30% del PBI en reserva no puede usar siquiera una fracción marginal para financiar infraestructura crítica sin poner en riesgo la estabilidad cambiaria.',
        source: 'https://peru21.pe/economia/jpp-quiere-que-se-pueda-intervenir-la-autonomia-del-bcr/',
        answers: [
            { style: 'tecnica', text: 'Porque las reservas no son un ahorro del Estado: contra ellas hay depósitos en dólares de bancos y personas. Si se gastan, en la próxima crisis no habría con qué defender al sol.' },
            { style: 'promesa', text: 'Es una propuesta que podemos conversar. Como señal de buena voluntad, no subiremos la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'Es una pregunta compleja que requiere un análisis más profundo. Le haremos llegar un informe.' }
        ]
    },
    {
        id: 'inestabilidad', kind: 'real', year: 2026, context: 'sesión de ratificación del presidente del BCR',
        text: '¿Cómo se resuelve la convivencia entre la estabilidad macroeconómica y la inestabilidad política?',
        source: 'https://www.infobae.com/peru/2026/09/03/tenso-momento-entre-senador-de-juntos-por-el-peru-y-julio-velarde-ha-hecho-el-trabajo-que-se-le-encomendo-y-punto/',
        answers: [
            { style: 'tecnica', text: 'Justamente para eso existe la autonomía del BCR: para separar la política monetaria del ciclo político. Así la moneda se mantiene estable aunque cambien los gobiernos.' },
            { style: 'promesa', text: 'Con más coordinación con el Congreso. Por eso le aseguro que no subiremos la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'No creo que sea relevante ahora.' }
        ]
    },
    // ---------- Recreaciones de episodios reales (no son citas textuales) ----------
    {
        id: 'congelar-deudas', kind: 'recreacion', year: 2020, context: 'Comisión de Economía',
        basis: 'en la pandemia, la Comisión de Economía aprobó por unanimidad un dictamen para congelar deudas bancarias, y el BCR se opuso',
        text: 'Las familias no pueden pagar sus créditos en plena cuarentena. ¿Por qué el BCR se opone a congelar las deudas?',
        source: 'https://rpp.pe/economia/economia/bcr-proyecto-de-congelamiento-de-deudas-del-congreso-es-irresponsable-julio-velarde-banco-central-de-reserva-entidades-financieras-noticia-1296089',
        answers: [
            { style: 'tecnica', text: 'Congelar por ley todas las deudas haría que muchos dejen de pagar esperando la norma, y los bancos dejarían de prestar. La salida es reprogramar caso por caso, con garantías como Reactiva Perú.' },
            { style: 'promesa', text: 'Entendemos la emergencia. No subiremos la tasa en el próximo trimestre y seguiremos inyectando liquidez.' },
            { style: 'evasiva', text: 'Estamos revisando el proyecto con mucho detalle y enviaremos nuestra opinión técnica.' }
        ]
    },
    {
        id: 'topes-tasas', kind: 'recreacion', year: 2021, context: 'debate de la ley contra la usura',
        basis: 'en 2021 el Congreso aprobó por insistencia la ley que obligó al BCR a fijar tasas máximas al crédito de consumo',
        text: 'Los bancos cobran tasas de más de 100% a la gente humilde. ¿Por qué el BCR se opone a ponerles un tope?',
        source: 'https://www.mef.gob.pe/es/funciones/833-estadisticas-de-deuda-publica/6982-ministro-mendoza-gobierno-observara-la-ley-contra-la-usura-bancaria-aprobada-por-insistencia-por-el-congreso',
        answers: [
            { style: 'tecnica', text: 'Porque un tope deja sin crédito formal a quienes más riesgo tienen, y los empuja al prestamista informal, que cobra mucho más. Es mejor más competencia y más transparencia en las tasas.' },
            { style: 'promesa', text: 'Vamos a aplicar la ley con responsabilidad, y como señal no subiremos la tasa de referencia en el próximo trimestre.' },
            { style: 'evasiva', text: 'Respetamos las decisiones del Congreso y cumpliremos la ley.' }
        ]
    },
    {
        id: 'dolar-sube', kind: 'recreacion', year: 2021, context: 'Comisión de Fiscalización',
        basis: 'en 2021, con el dólar sobre S/ 4, el presidente del BCR fue a la Comisión de Fiscalización y los congresistas le preguntaron por el tipo de cambio',
        text: 'El dólar ya pasó los cuatro soles y la gente está asustada. ¿Qué está haciendo el BCR para frenarlo?',
        source: 'https://gestion.pe/economia/dolar-tipo-de-cambio-julio-velarde-repasa-aqui-todo-lo-que-dijo-sobre-el-futuro-del-billete-verde-en-la-comision-de-fiscalizacion-del-congreso-nndc-noticia/',
        answers: [
            { style: 'tecnica', text: 'Estamos vendiendo dólares para evitar saltos bruscos, pero no podemos fijar el precio: la presión viene del miedo por la incertidumbre política. Si esta baja, el sol se fortalecerá.' },
            { style: 'promesa', text: 'Vamos a hacer todo lo necesario. Mientras tanto, no subiremos la tasa en el próximo trimestre para no golpear más la economía.' },
            { style: 'evasiva', text: 'El tipo de cambio es flexible y lo determina el mercado.' }
        ]
    }
];

/**
 * Efecto de cada estilo de respuesta. `promise` compromete la decisión del turno siguiente.
 * Romper la promesa cuesta caro; cumplirla da un poco de credibilidad.
 */
export const ANSWER_EFFECTS = {
    tecnica: { pressure: 6, credibility: 4, promise: null, result: 'Tu respuesta fue impecable… y al Congreso no le gustó nada que le explicaran la Constitución. Pero los mercados tomaron nota: el BCR no cede.' },
    promesa: { pressure: -22, credibility: -2, promise: 'noSubir', result: 'El Congreso se calmó. Pero ahora estás atado: si subes la tasa el próximo trimestre, romperás tu palabra en público.' },
    evasiva: { pressure: -4, credibility: -5, promise: null, result: 'Nadie quedó contento. Los congresistas insisten y los analistas leen tu ambigüedad como duda.' }
};

/** Estado de ánimo del Congreso según la presión (0–100). */
export function congressMood(pressure) {
    if (pressure >= 85) return { mood: -2, label: 'Quiere tu cabeza' };
    if (pressure >= 65) return { mood: -1, label: 'Molesto' };
    if (pressure >= 40) return { mood: 0, label: 'Vigilante' };
    if (pressure >= 20) return { mood: 1, label: 'Tranquilo' };
    return { mood: 2, label: 'Contento' };
}

/** Declaración real acorde a lo que molesta al Congreso, o null. */
export function pickDeclaration({ move, pressure, year, rng = Math.random }) {
    // El Congreso opina casi siempre: desde un enojo moderado, o cada vez que subes la tasa.
    if (pressure < 30 && move <= 0) return null;
    const topic = move > 0 ? 'tasa' : pressure >= 80 ? 'autonomia' : 'crecimiento';
    const pool = DECLARATIONS.filter(d => d.topic === topic && d.year <= year);
    const any = pool.length ? pool : DECLARATIONS.filter(d => d.year <= year);
    return any.length ? any[Math.floor(rng() * any.length)] : null;
}

/**
 * Proyectos de ley que el Congreso presenta y que afectan al BCR. Todos son RECREACIONES
 * de iniciativas reales (`basis` + `source`); el texto del juego no es una cita.
 * `effects.pass`: lo que ocurre si se aprueba tal cual (choque durante `turns` turnos,
 * credibilidad, reservas). Negociar aplica la mitad; oponerse puede frenarlo.
 */
export const BILLS = [
    {
        id: 'retiro-afp', year: 2020, title: 'Proyecto de ley: un nuevo retiro de fondos de las AFP',
        basis: 'en 2020 el Congreso aprobó el primer retiro de hasta 25% de los fondos de las AFP, con 105 votos a favor; luego vinieron varios retiros más',
        source: 'https://www.tvperu.gob.pe/noticias/politica/congreso-aprobo-retiro-del-25-de-los-fondos-de-afp',
        text: 'Los congresistas quieren liberar otra parte de los fondos de pensiones. Es plata en el bolsillo hoy… que empuja el consumo, sube los precios y deja pensiones más bajas mañana.',
        effects: { shock: { demand: 1.4, supply: 0.2 }, turns: 1, credibility: -3 }
    },
    {
        id: 'topes-tasas', year: 2020, title: 'Proyecto de ley: topes a las tasas de interés',
        basis: 'la Ley 31143 (2021), aprobada por insistencia, obligó al BCR a fijar tasas máximas al crédito de consumo',
        source: 'https://www.mef.gob.pe/es/funciones/833-estadisticas-de-deuda-publica/6982-ministro-mendoza-gobierno-observara-la-ley-contra-la-usura-bancaria-aprobada-por-insistencia-por-el-congreso',
        text: 'El Congreso quiere que el BCR fije un techo a lo que cobran bancos y cajas. Suena justo, pero quienes más riesgo tienen podrían quedarse sin crédito formal y caer en manos del prestamista informal.',
        effects: { shock: { demand: -0.5 }, turns: 2, credibility: -2 }
    },
    {
        id: 'oro-bcr', year: 2025, title: 'Proyecto de ley: que el BCR guarde el oro de las mineras',
        basis: 'en 2025 se presentó el proyecto 12172/2025-CR para que el BCR reciba en custodia oro extraído legalmente y lo cuente como reservas',
        source: 'https://www.rumbominero.com/peru/noticias/mineria/congreso-propone-que-bcrp-custodie-oro-minero-pese-a-record-historico-de-reservas/',
        text: 'Proponen que el BCR guarde oro de mineras privadas y lo cuente como parte de las reservas. Los economistas advierten que son activos poco líquidos y que pone en riesgo la institucionalidad del BCR.',
        effects: { shock: {}, turns: 1, credibility: -4 }
    },
    {
        id: 'usar-reservas', year: 2026, title: 'Proyecto de ley: usar parte de las reservas para obras',
        basis: 'en 2026, en una sesión con el presidente del BCR, legisladores plantearon usar "una fracción marginal" de las reservas para infraestructura',
        source: 'https://peru21.pe/economia/jpp-quiere-que-se-pueda-intervenir-la-autonomia-del-bcr/',
        text: 'Quieren tomar una parte de las reservas internacionales para financiar obras. Pero las reservas no son una caja chica: respaldan al sol y protegen al país en las crisis.',
        effects: { shock: { demand: 0.4 }, turns: 1, credibility: -6, reserves: -8 }
    }
];

/** Respuestas del Directorio ante un proyecto de ley. */
export const BILL_RESPONSES = [
    { style: 'oponerse', label: 'Advertir públicamente los riesgos', text: 'El BCR publica un informe técnico y su presidente sale a los medios a explicar por qué el proyecto es dañino.', pressure: 12, credibility: 3 },
    { style: 'negociar', label: 'Negociar una versión más moderada', text: 'El BCR se reúne con la comisión y propone cambios para reducir el daño.', pressure: -10, credibility: -1 },
    { style: 'callar', label: 'No opinar: es un tema del Congreso', text: 'El BCR guarda silencio para no enfrentarse con los congresistas.', pressure: 0, credibility: -3 }
];
