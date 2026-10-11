import { pickPhrase } from './people.js';

/**
 * El elenco fijo: cinco voces que reaccionan cada turno para que el jugador se encariñe y sienta
 * el costo de cada decisión. Todos son personajes ficticios; las frases reales del Congreso se
 * muestran aparte y sin nombre (ver model/congress.js). Módulo puro salvo la elección de frases,
 * que usa azar y evita repetir las recientes.
 *
 * castLines(m, rec) → [{ id, name, role, mood (−2 a 2), cause, line, tag? }]
 */

export const CAST = {
    rosa: { name: 'Doña Rosa', role: 'Casera del mercado de Surquillo', watches: 'Inflación y bolsillo familiar', bust: 'caserita', color: '#1d7a4c' },
    kevin: { name: 'Kevin', role: 'Emprendedor con préstamo, Los Olivos', watches: 'Tasa y crédito', bust: 'kevin', color: '#c2185b' },
    valeria: { name: 'Valeria', role: 'Exportadora de arándanos, La Libertad', watches: 'Tipo de cambio', bust: 'valeria', color: '#0f7c8a' },
    congresista: { name: 'Congresista Pérez', role: 'Personaje ficticio · Comisión de Economía', watches: 'Presión política', bust: 'congresista', color: '#7a2e8e' },
    feed: { name: 'Las redes', role: 'Lo que es tendencia hoy', watches: 'Confianza ciudadana', bust: null, color: '#28508a' }
};

const LINES = {
    rosa: {
        sube: ['Hijito, ya no me alcanza para el pollo. ¡Todo sube cada semana!', 'El aceite subió otra vez. La gente compra por cuartos, ya no por kilos.', 'Mis caseras preguntan quién manda en el BCR. Yo ya no sé qué decirles.', 'Con veinte soles antes llenaba la bolsa. Ahora traigo la mitad.'],
        alimentos: ['El limón y la cebolla están por las nubes. Dicen que es el clima, pero lo pago yo.', 'No llega la papa de la sierra y todo se encarece. ¿Eso lo arregla el BCR?', 'Con este precio del pollo, el menú ya no es menú.'],
        baja: ['¡Por fin bajó el limón! Hoy sí vendí bien.', 'Los precios se están quedando quietos. Así da gusto ir al mercado.', 'Esta semana nadie se quejó del precio. Milagro, caserito.'],
        estable: ['Los precios están tranquilos. Ojalá siga así.', 'Ni sube ni baja: así me gusta, hijito.', 'Mientras el arroz no se dispare, yo contenta.'],
        recesion: ['Los precios no suben, pero la gente no tiene plata. El mercado está vacío.', 'Mis caseras perdieron la chamba. Ya no compran ni para el lonche.']
    },
    kevin: {
        tasaSube: ['Subió la tasa y mi cuota de la caja municipal ya me ahorca.', 'Iba a pedir otro préstamo para la moto del delivery. Con esta tasa, olvídalo.', 'Cada vez que suben la tasa, mi negocio sufre. ¿Y la chamba, presidente?'],
        tasaBaja: ['¡Bajó la tasa! Ya estoy sacando cuentas para comprar otra moto.', 'Con crédito más barato me animo a contratar a alguien más.', 'Gracias, BCR. Ahora sí la caja me presta a una tasa decente.'],
        tasaAlta: ['La tasa sigue alta y los bancos no prestan a los chicos como yo.', 'Mis amigos emprendedores están aguantando, pero no sé cuánto más.'],
        ventasCaen: ['Los pedidos bajaron. La gente ya no pide delivery como antes.', 'Este mes vendí la mitad. Si sigue así, tengo que cerrar.'],
        ventasSuben: ['¡No paro de vender! Ya tengo tres motos trabajando.', 'La gente está gastando y yo feliz. Que dure.'],
        estable: ['El negocio va normal. Ni para celebrar ni para llorar.', 'Pago mi cuota a tiempo y sigo adelante. Así es la vida del emprendedor.']
    },
    valeria: {
        dolarSube: ['¡El dólar sube! Mis arándanos valen más soles. Hoy invito el ceviche.', 'Con este tipo de cambio, exportar es negocio. Mis clientes de afuera felices.'],
        dolarSalta: ['El dólar subió demasiado rápido. Bien para mí, pero mis proveedores importan fertilizantes y ya me subieron.', 'Tanto sube y baja el dólar que no puedo fijar precios con nadie.'],
        dolarBaja: ['El dólar cae y mis ventas en soles bajan. Así no compito con Chile.', 'Cada vez que el sol se aprecia, a los exportadores nos duele.'],
        estable: ['Dólar tranquilo, contratos tranquilos. Así se planifica.', 'Ni sube ni baja: puedo cerrar mis contratos del año.']
    },
    congresista: {
        furioso: ['¡El presidente del BCR tendrá que venir a explicar al Congreso!', 'Vamos a presentar una moción. Esto no puede seguir así.', 'El BCR vive en una burbuja. ¡Que baje a la calle!'],
        sube: ['¿Subir la tasa ahora? El BCR está ahogando a la gente que trabaja.', 'Exijo que bajen la tasa de inmediato. La gente necesita crédito.', 'Otra alza. Lo vamos a citar, señor presidente.'],
        molesto: ['El BCR tiene que pensar en el pueblo, no solo en sus gráficos.', 'Estamos vigilando cada decisión del Directorio.'],
        tranquilo: ['Por ahora no tenemos observaciones. Por ahora.', 'Seguiremos atentos. Siempre atentos.']
    },
    feed: {
        crisis: ['#ElBCRSeFue · «Ya ni el cambista de Ocoña cree en el sol»', '#RenunciaPresidente · memes del sol cayendo por las escaleras', '#ElPolloA20 · «Pronto vamos a pagar el menú en cuotas»'],
        inflacion: ['#TodoSube · «Fui al mercado con un billete de 100 y volví con un limón»', '#ElPolloCaro · memes de Doña Rosa contra el BCR', '#InflaciónNoPerdona · «Mi sueldo y los precios ya no se hablan»'],
        recesion: ['#SinChamba · «Mi CV ya está en todas las bolsas de trabajo del Perú»', '#EconomíaEnPausa · «Hasta el delivery está en cuarentena»'],
        dolar: ['#DólarPorLasNubes · Pepe el cambista se vuelve influencer', '#ElDólarNoPara · «Compré dólares para ver si me dan vuelto en soles»'],
        sube: ['#TasaAlta · «Mi cuota del celular ya es más cara que el celular»', '#BCRAprieta · memes de una correa que se ajusta'],
        bien: ['#SolFirme · «El BCR la tiene clara»', '#Tranqui · «Hasta mi tía dejó de hablar de los precios»', '#PerúEsClave · «Inflación en meta, como debe ser»'],
        normal: ['#ElBCR · «¿Alguien entendió el comunicado?»', '#Tasa · debate en redes: ¿subir o bajar?', '#Economía · «Los expertos opinan, yo solo quiero llegar a fin de mes»']
    }
};

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toMood = v => clamp(Math.round(v), -2, 2);

/** Ánimo y causa de cada personaje, a partir del estado y del último turno (o del inicio). */
export function castMoods(m, rec = null) {
    const s = m.state;
    const p = m.params;
    const move = rec?.move ?? 0;
    const prevInfl = rec?.prev.inflation ?? s.inflation;
    const dep = rec?.fx?.dep ?? 0;
    const gap = s.growth - p.potentialGrowth;

    const rosaCause = s.growth < 0 ? 'recesion'
        : s.inflation > p.bandMax + 0.3 ? (s.supply > 0.6 ? 'alimentos' : 'sube')
            : s.inflation < prevInfl - 0.2 ? 'baja' : 'estable';
    const rosaMood = toMood(1 - 0.9 * Math.max(0, s.inflation - 2.5) - 0.5 * Math.max(0, s.supply) - (s.growth < 0 ? 1 : 0));

    const kevinCause = move > 0 ? 'tasaSube' : move < 0 ? 'tasaBaja'
        : gap < -1 ? 'ventasCaen' : gap > 1 ? 'ventasSuben' : s.rate > 6 ? 'tasaAlta' : 'estable';
    const kevinMood = toMood(0.5 - 2.4 * move + 0.5 * gap - 0.15 * Math.max(0, s.rate - 5));

    const valeriaCause = dep > 4 ? 'dolarSalta' : dep > 1.2 ? 'dolarSube' : dep < -1.2 ? 'dolarBaja' : 'estable';
    const valeriaMood = toMood(dep > 4 ? -0.5 : 0.4 * dep + 0.3);

    const press = m.pressure;
    const congCause = press >= 78 ? 'furioso' : move > 0 ? 'sube' : press >= 55 ? 'molesto' : 'tranquilo';
    const congMood = toMood(1.5 - press / 30);

    const trust = m.trust;
    const feedCause = trust < 30 ? 'crisis' : s.inflation > p.bandMax + 1 ? 'inflacion' : s.growth < 0.5 ? 'recesion'
        : dep > 3 ? 'dolar' : move > 0.25 ? 'sube' : trust > 65 && s.inflation <= p.bandMax ? 'bien' : 'normal';
    const feedMood = toMood((trust - 50) / 15);

    return [
        { id: 'rosa', mood: rosaMood, cause: rosaCause },
        { id: 'kevin', mood: kevinMood, cause: kevinCause },
        ...(m.fx ? [{ id: 'valeria', mood: valeriaMood, cause: valeriaCause }] : []),
        { id: 'congresista', mood: congMood, cause: congCause },
        { id: 'feed', mood: feedMood, cause: feedCause }
    ];
}

/** Frase de un personaje para una causa. */
export function castLine(id, cause, rng) {
    return pickPhrase(LINES[id]?.[cause] ?? LINES[id]?.estable ?? LINES[id]?.normal ?? [], rng);
}

/** El elenco completo con su frase del turno. */
export function castLines(m, rec = null, rng) {
    return castMoods(m, rec).map(c => ({ ...CAST[c.id], ...c, line: castLine(c.id, c.cause, rng) }));
}

/** La frase final de Doña Rosa para la tarjeta compartible. */
export function rosaVerdict(m) {
    const c = castMoods(m).find(x => x.id === 'rosa');
    return castLine('rosa', c.cause);
}

export const CAST_CAUSES = Object.fromEntries(Object.entries(LINES).map(([id, causes]) => [id, Object.keys(causes)]));
