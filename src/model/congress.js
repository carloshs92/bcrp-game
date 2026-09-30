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
 * Preguntas reales de citaciones al BCR. Cada una trae tres respuestas con estilos distintos:
 *  - tecnica: explica el mandato. Gana credibilidad, pero el Congreso se siente "sermoneado".
 *  - promesa: calma al Congreso comprometiendo tu próxima decisión (forward guidance).
 *  - evasiva: no compromete nada, pero el mercado lee la ambigüedad y el Congreso insiste.
 */
export const QUESTIONS = [
    {
        id: 'empleo-sueldo', year: 2024, context: 'Comisión de Presupuesto',
        text: 'Aparte de ganar S/ 41 mil […], ¿cuáles han sido las obligaciones legales o iniciativas de parte del BCR para buscar apoyar el empleo en la población?',
        source: 'https://rpp.pe/politica/congreso/julio-velarde-explica-a-congresistas-las-funciones-del-bcr-durante-la-comision-de-presupuesto-video-noticia-1588535',
        answers: [
            { style: 'tecnica', text: 'El BCR no es el Gobierno. Por la Constitución, nuestra tarea es preservar la estabilidad monetaria: una inflación baja protege el sueldo de todos, y eso también cuida el empleo.' },
            { style: 'promesa', text: 'Entendemos la preocupación por el empleo. Le aseguro que no volveremos a subir la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'Es un tema muy importante que estamos evaluando con mucha atención, junto a todos los indicadores de la economía.' }
        ]
    },
    {
        id: 'empleo-digno', year: 2024, context: 'Comisión de Presupuesto',
        text: '¿Qué rol debe jugar el BCR para impulsar una política que no solo genere empleo, sino que garantice que este sea digno, con salarios justos y con derechos laborales plenos?',
        source: 'https://rpp.pe/politica/congreso/julio-velarde-explica-a-congresistas-las-funciones-del-bcr-durante-la-comision-de-presupuesto-video-noticia-1588535',
        answers: [
            { style: 'tecnica', text: 'Los salarios y los derechos laborales dependen del Ejecutivo y del propio Congreso. El aporte del BCR es que la inflación no se coma esos salarios.' },
            { style: 'promesa', text: 'Tomamos nota. Nos comprometemos a no subir la tasa en el próximo trimestre para no frenar la creación de empleo.' },
            { style: 'evasiva', text: 'Compartimos plenamente ese objetivo y trabajamos todos los días pensando en el bienestar de los peruanos.' }
        ]
    },
    {
        id: 'reservas-quien', year: 2024, context: 'Comisión de Presupuesto',
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
        id: 'reservas-infraestructura', year: 2026, context: 'sesión con el presidente del BCR',
        text: 'Nos gustaría que nos pueda explicar técnicamente y no doctrinariamente, por qué un país que concentra más del 30% del PBI en reserva no puede usar siquiera una fracción marginal para financiar infraestructura crítica sin poner en riesgo la estabilidad cambiaria.',
        source: 'https://peru21.pe/economia/jpp-quiere-que-se-pueda-intervenir-la-autonomia-del-bcr/',
        answers: [
            { style: 'tecnica', text: 'Porque las reservas no son un ahorro del Estado: contra ellas hay depósitos en dólares de bancos y personas. Si se gastan, en la próxima crisis no habría con qué defender al sol.' },
            { style: 'promesa', text: 'Es una propuesta que podemos conversar. Como señal de buena voluntad, no subiremos la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'Es una pregunta compleja que requiere un análisis más profundo. Le haremos llegar un informe.' }
        ]
    },
    {
        id: 'inestabilidad', year: 2026, context: 'sesión de ratificación del presidente del BCR',
        text: '¿Cómo se resuelve la convivencia entre la estabilidad macroeconómica y la inestabilidad política?',
        source: 'https://www.infobae.com/peru/2026/09/03/tenso-momento-entre-senador-de-juntos-por-el-peru-y-julio-velarde-ha-hecho-el-trabajo-que-se-le-encomendo-y-punto/',
        answers: [
            { style: 'tecnica', text: 'Justamente para eso existe la autonomía del BCR: para separar la política monetaria del ciclo político. Así la moneda se mantiene estable aunque cambien los gobiernos.' },
            { style: 'promesa', text: 'Con más coordinación con el Congreso. Por eso le aseguro que no subiremos la tasa en el próximo trimestre.' },
            { style: 'evasiva', text: 'No creo que sea relevante ahora.' }
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
    if (pressure < 50) return null;
    const topic = move > 0 ? 'tasa' : pressure >= 80 ? 'autonomia' : 'crecimiento';
    const pool = DECLARATIONS.filter(d => d.topic === topic && d.year <= year);
    const any = pool.length ? pool : DECLARATIONS.filter(d => d.year <= year);
    return any.length ? any[Math.floor(rng() * any.length)] : null;
}
