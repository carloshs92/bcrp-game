import { REGIONS, TAG_EFFECTS, REGION_VOICES } from '../model/regions.js';

/**
 * Cómo vive la gente cada decisión. Las decisiones de política monetaria no son neutras:
 * cada sector y cada región gana o pierde distinto, y en las crisis casi nunca hay una
 * opción sin costo.
 *
 * El ánimo va de -2 (muy mal) a +2 (muy bien). Cada sector y región guarda también la
 * `cause` que más pesó, para elegir frases que expliquen el porqué. El cálculo es puro;
 * la elección de frases (`sectorVoice`, `regionVoice`) usa azar y evita repetir las recientes.
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const toMood = s => clamp(Math.round(s), -2, 2);

export const RATE_SECTORS = [
    { id: 'familias', name: 'Familias de bajos ingresos', short: 'Familias', who: 'Doña Rosa, caserita de Surquillo' },
    { id: 'trabajo', name: 'Trabajadores y empleo', short: 'Empleo', who: 'Don Mario, chofer de combi' },
    { id: 'mypes', name: 'Mypes y comerciantes', short: 'Mypes', who: 'Jessica, confeccionista de Gamarra' },
    { id: 'deudores', name: 'Familias con préstamos', short: 'Deudores', who: 'Luis y Carmen, crédito hipotecario' },
    { id: 'ahorristas', name: 'Ahorristas y jubilados', short: 'Ahorristas', who: 'Don Julián, jubilado' }
];

export const HYPER_SECTORS = [
    { id: 'familias', name: 'Familias de bajos ingresos', short: 'Familias', who: 'Doña Rosa, caserita de Surquillo' },
    { id: 'estatales', name: 'Trabajadores del Estado', short: 'Estatales', who: 'Profesora Elena, colegio nacional' },
    { id: 'comercio', name: 'Comerciantes y mercados', short: 'Comercio', who: 'Don Aurelio, La Parada' },
    { id: 'ahorristas', name: 'Quienes ahorran en intis', short: 'Ahorristas', who: 'Don Julián, jubilado' },
    { id: 'trabajo', name: 'Empleo', short: 'Empleo', who: 'Don Mario, chofer' }
];

/** Frases por sector y causa. Varias por causa para que no se repitan. */
const SECTOR_VOICES = {
    familias: {
        alimentos: [
            'El limón, la papa, el pollo… todo sube. Hoy almorzamos arroz con huevo.',
            'Fui al mercado con veinte soles y regresé con media bolsa.',
            'Ya no compramos carne. Los chicos preguntan por qué.'
        ],
        inflacion: [
            'Cada semana compro menos con la misma plata.',
            'El sueldo se va en comida y en pasajes. No queda para nada más.',
            'Los precios suben más rápido que lo que gano en el día.'
        ],
        recesion: [
            'Mi esposo perdió la chamba. Estamos viviendo de lo que vendo en la puerta.',
            'Sin trabajo, la olla común del barrio es lo que nos salva.'
        ],
        estable: [
            'Estamos ajustados, pero por lo menos los precios no se mueven tanto.',
            'Vamos llegando a fin de mes, a las justas.'
        ],
        alivio: [
            'Este mes me alcanzó para todo y hasta separé un poquito.',
            'Los precios se calmaron. Ya puedo planificar la semana.'
        ],
        auge: [
            'Hay trabajo y los precios están tranquilos. Estamos mejor que el año pasado.',
            'Por fin pudimos comprar el uniforme de los chicos sin endeudarnos.'
        ]
    },
    trabajo: {
        despidos: [
            'Me despidieron. En la calle no hay chamba y todos buscan lo mismo.',
            'Cerró la fábrica. Ahora hago taxi colectivo para sobrevivir.',
            'Ni cachuelos hay. Esta es la peor época que recuerdo.'
        ],
        enfriamiento: [
            'Hay menos pasajeros y menos cachuelos. Las horas extra se acabaron.',
            'En la obra redujeron personal. A mí todavía me tienen, pero con miedo.'
        ],
        estable: ['La chamba se mantiene, ni más ni menos.', 'Seguimos trabajando igual que siempre.'],
        contratan: [
            'Hay trabajo. Me están llamando para más turnos.',
            'Están contratando en la obra de al lado. Se nota el movimiento.'
        ],
        auge: [
            '¡Hay chamba por todos lados! Hasta me subieron el sueldo.',
            'Me ofrecieron planilla. Primera vez en años.'
        ]
    },
    mypes: {
        tasaSube: [
            'La caja municipal me subió la tasa. El préstamo para la mercadería me sale un ojo de la cara.',
            'Con estos intereses no me animo a pedir para la campaña escolar.',
            'El banco me pide más garantías y me cobra más. Así no se puede crecer.'
        ],
        ventasCaen: [
            'La gente entra, mira y se va. Las ventas están flojas.',
            'Tuve que cerrar el taller los sábados. No hay pedidos.'
        ],
        estable: ['Ni muy bien ni muy mal. Seguimos trabajando.', 'Las ventas van normal, sin sorpresas.'],
        tasaBaja: [
            'Conseguí un préstamo más barato para comprar tela. A ver si crezco.',
            'Con la tasa más baja pude refinanciar mi deuda con la caja.'
        ],
        ventasSuben: [
            '¡Voy a abrir otro puesto! Las ventas van como nunca.',
            'No me alcanza la mercadería. Tuve que contratar ayuda.'
        ]
    },
    deudores: {
        tasaSube: [
            'La cuota del crédito subió. Tenemos que recortar otros gastos.',
            'El banco nos avisó que la tasa variable sube. No sabemos si llegamos.',
            'La tarjeta de crédito ya nos está ahorcando.'
        ],
        tasaAlta: ['Con las tasas tan altas, nadie en el barrio se anima a pedir un préstamo.'],
        estable: ['La cuota sigue igual. Vamos pagando.', 'Pagamos puntual, sin sobresaltos.'],
        tasaBaja: [
            'Refinanciamos el préstamo con una tasa más baja. Respiramos un poco.',
            'Con las tasas bajas pudimos comprar el depa que queríamos.'
        ]
    },
    ahorristas: {
        inflacion: [
            'Lo que tengo en el banco pierde valor mes a mes.',
            'Mi pensión es la misma, pero cada vez compra menos.',
            'Ahorré toda la vida y la inflación se lo está comiendo.'
        ],
        tasaBaja: ['El banco ya casi no paga nada por mis depósitos.', 'Con las tasas bajas mis ahorros no crecen.'],
        estable: ['Mis ahorros se mantienen, pero no crecen.', 'Mi pensión alcanza, a las justas.'],
        tasaReal: [
            'El banco me paga un poquito más por mis depósitos. Mi pensión rinde.',
            'Mi plata gana más que la inflación. Por fin se premia al que ahorra.'
        ]
    },
    estatales: {
        sinSueldo: [
            'Llevamos dos meses sin sueldo completo. Estamos pensando en ir a la huelga.',
            'Los maestros ya nos organizamos: si no pagan, paramos.'
        ],
        sueldoBajo: ['El sueldo llega, pero no alcanza ni para la primera semana.', 'Nos pagan tarde y con intis que ya no valen.'],
        cobran: ['Nos pagaron puntual este mes. Algo es algo.', 'Cobramos completo. Hacía tiempo que no pasaba.']
    },
    comercio: {
        remarcar: ['Remarcamos precios todos los días. Nadie sabe cuánto vale nada.', 'Cambio los precios en la mañana y en la tarde.'],
        ventasCaen: ['La gente compra lo justo. Las ventas cayeron.', 'Nadie compra más de lo necesario para el día.'],
        estabiliza: ['Ya no remarcamos cada día. Se puede trabajar tranquilo.', 'Los precios se quedaron quietos esta semana. ¡Por fin!']
    }
};

/** Elige la causa con mayor peso (en valor absoluto) entre términos [causa, valor]. */
function dominant(terms, fallback) {
    const t = terms.filter(([, v]) => Math.abs(v) >= 0.3).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    return t[0]?.[0] ?? fallback;
}

/** Ánimo por sector tras un turno del motor de tasa. */
export function rateMoods({ state, move, rate }, potentialGrowth = 3) {
    const hurtInfl = Math.max(0, state.inflation - 2.5);
    const food = Math.max(0, state.supply);
    const g = state.growth - potentialGrowth;
    const realRate = rate - state.expectations - 1;

    const fam = {
        alimentos: -0.7 * food,
        inflacion: -0.8 * hurtInfl,
        recesion: -0.4 * Math.max(0, -state.growth) - (state.growth < 0 ? 0.6 : 0),
        auge: 0.25 * state.outputGap
    };
    const famScore = 0.6 + fam.alimentos + fam.inflacion + fam.recesion + fam.auge;
    const famCause = famScore < -0.5 ? dominant([['alimentos', fam.alimentos], ['inflacion', fam.inflacion], ['recesion', fam.recesion]], 'inflacion')
        : famScore > 1.5 ? 'auge' : famScore > 0.5 ? 'alivio' : 'estable';

    const trabScore = 0.3 + 0.6 * g + (state.growth < 0 ? -1.5 : 0);
    const trabCause = ['despidos', 'enfriamiento', 'estable', 'contratan', 'auge'][toMood(trabScore) + 2];

    const ventas = 0.35 * state.outputGap, tasa = -1.0 * move - 0.15 * Math.max(0, rate - 5);
    const mypeScore = 0.3 + ventas + tasa;
    const mypeCause = Math.abs(ventas + tasa) < 0.3 ? 'estable'
        : dominant([['tasa', tasa], ['ventas', ventas]], 'estable') === 'tasa' ? (tasa < 0 ? 'tasaSube' : 'tasaBaja')
            : (ventas < 0 ? 'ventasCaen' : 'ventasSuben');

    const deudScore = 0.5 - 1.6 * move - 0.2 * Math.max(0, rate - 4);
    const deudCause = move > 0 ? 'tasaSube' : move < 0 ? 'tasaBaja' : rate > 6 ? 'tasaAlta' : 'estable';

    const ahoTasa = 0.5 * realRate, ahoInfl = -0.6 * Math.max(0, state.inflation - 3);
    const ahoScore = 0.2 + ahoTasa + ahoInfl;
    const ahoDom = dominant([['tasa', ahoTasa], ['inflacion', ahoInfl]], 'estable');
    const ahoCause = ahoDom === 'inflacion' ? 'inflacion' : ahoDom === 'tasa' ? (realRate > 0 ? 'tasaReal' : 'tasaBaja') : 'estable';

    const scores = {
        familias: [famScore, famCause], trabajo: [trabScore, trabCause], mypes: [mypeScore, mypeCause],
        deudores: [deudScore, deudCause], ahorristas: [ahoScore, ahoCause]
    };
    return RATE_SECTORS.map(d => ({ ...d, mood: toMood(scores[d.id][0]), cause: scores[d.id][1] }));
}

/** Ánimo por sector tras un mes del capítulo 1990. */
export function hyperMoods({ state, choice, toolUsed }) {
    const inf = state.inflation;
    const fam = 1 - 0.06 * inf - (choice.id === 'caja' ? 0.8 : 0) + (toolUsed ? 1.5 : 0);
    const est = { imprimir: 1, mitad: 0, caja: -1.5 }[choice.id] - 0.02 * inf;
    const com = 1.2 - 0.05 * inf + 0.2 * state.activity;
    const aho = 1.2 - 0.1 * inf;
    const tra = 1 + 0.35 * state.activity;
    const scores = {
        familias: [fam, fam < -0.5 ? (choice.id === 'caja' && !toolUsed ? 'recesion' : 'inflacion') : fam > 0.5 ? 'alivio' : 'estable'],
        estatales: [est, est <= -1 ? 'sinSueldo' : est < 0.5 ? 'sueldoBajo' : 'cobran'],
        comercio: [com, inf > 15 ? 'remarcar' : com < 0 ? 'ventasCaen' : 'estabiliza'],
        ahorristas: [aho, aho < 0 ? 'inflacion' : 'estable'],
        trabajo: [tra, ['despidos', 'enfriamiento', 'estable', 'contratan', 'auge'][toMood(tra) + 2]]
    };
    return HYPER_SECTORS.map(d => ({ ...d, mood: toMood(scores[d.id][0]), cause: scores[d.id][1] }));
}

/**
 * Ánimo de cada departamento. Mezcla el contexto nacional (inflación, alimentos,
 * crecimiento, tasa) con los choques del turno según el perfil de cada región.
 * `tags` = etiquetas del evento y del imprevisto del turno. En 1990 se pasa
 * `monthlyInflation` y `activity` en lugar de la inflación anual y la brecha.
 */
export function regionMoods({ state, move = 0, tags = [], monthlyInflation = null }) {
    const hurtInfl = monthlyInflation != null ? monthlyInflation / 8 : Math.max(0, state.inflation - 2.5);
    const food = Math.max(0, state.supply ?? 0);
    const gap = state.outputGap ?? (state.activity ?? 0) / 3;
    const recession = Math.max(0, -(state.growth ?? state.activity ?? 0));
    const out = {};
    for (const [id, r] of Object.entries(REGIONS)) {
        const p = r.profile;
        const terms = [
            ['inflacion', -p.alimentos * (0.45 * hurtInfl + 0.4 * food)],
            ['tasa', -p.credito * 1.2 * move],
            ['auge', p.demanda * 0.35 * Math.max(0, gap)],
            ['recesion', -(0.4 + p.demanda) * (0.2 * Math.min(4, Math.max(0, -gap)) + 0.25 * Math.min(4, recession))]
        ];
        for (const tag of tags) {
            for (const [channel, mag] of TAG_EFFECTS[tag] ?? []) terms.push([tag, mag * (p[channel] ?? 0)]);
        }
        const score = 0.5 + terms.reduce((a, [, v]) => a + v, 0);
        // La causa que se muestra es la de mayor peso; si nada pesa, "estable".
        const main = terms.filter(([, v]) => Math.abs(v) >= 0.35).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
        out[id] = { id, mood: toMood(score), score, cause: main ? main[0] : 'estable', who: r.who, product: r.product, mineral: r.mineral ?? 'los minerales' };
    }
    return out;
}

// ---------- Frases (azar + memoria para no repetir) ----------
const recent = [];

function pick(list, rng = Math.random) {
    if (!list?.length) return '';
    const fresh = list.filter(x => !recent.includes(x));
    const pool = fresh.length ? fresh : list;
    const choice = pool[Math.floor(rng() * pool.length)];
    recent.push(choice);
    if (recent.length > 40) recent.shift();
    return choice;
}

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Frase de un sector según su causa. */
export function sectorVoice(s, rng) {
    return pick(SECTOR_VOICES[s.id]?.[s.cause] ?? SECTOR_VOICES[s.id]?.estable, rng);
}

/** Frase de una región según su causa, con su producto principal. */
export function regionVoice(r, rng) {
    let bank = REGION_VOICES[r.cause] ?? REGION_VOICES.estable;
    // Si una causa positiva convive con un ánimo negativo, se cuenta desde lo general.
    if (r.cause === 'auge' && r.mood < 0) bank = REGION_VOICES.estable;
    return pick(bank, rng).replaceAll('{p}', r.product).replaceAll('{P}', cap(r.product)).replaceAll('{m}', r.mineral ?? 'los minerales');
}

/** El testimonio más fuerte del turno: el sector que más se movió hacia un extremo. */
export function strongestVoice(moods) {
    return moods.reduce((a, b) => Math.abs(b.mood) > Math.abs(a.mood) || (Math.abs(b.mood) === Math.abs(a.mood) && b.mood < a.mood) ? b : a);
}

/** Quién gana y quién pierde con un movimiento de tasa (el "mal menor"). */
export function rateTradeoff(move) {
    if (move > 0) return {
        win: 'Ahorristas, jubilados y, si la inflación baja, las familias que viven del día.',
        lose: 'Quienes tienen deudas, las mypes y el empleo en los próximos trimestres.'
    };
    if (move < 0) return {
        win: 'Quienes tienen deudas, las mypes y el empleo.',
        lose: 'Ahorristas y jubilados; y si la inflación sube, las familias más pobres.'
    };
    return {
        win: 'Nadie siente un cambio inmediato.',
        lose: 'Lo que ya está en marcha sigue su curso: si la inflación sube o la economía se frena, nadie lo detiene.'
    };
}

/** Promedio del ánimo por sector a lo largo de la partida, para el balance final. */
export function averageMoods(turns) {
    if (!turns.length) return [];
    return turns[0].map((s, i) => ({ ...s, avg: turns.reduce((a, t) => a + t[i].mood, 0) / turns.length }));
}

/**
 * Balance de cada región en la partida: mitad promedio y mitad peor momento, para que un golpe
 * fuerte (El Niño, una cuarentena) no se diluya en el promedio. La causa es la del peor turno.
 */
export function averageRegions(turns) {
    if (!turns.length) return null;
    const out = {};
    for (const id of Object.keys(turns[0])) {
        const scores = turns.map(t => t[id].score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const worstIdx = scores.indexOf(Math.min(...scores));
        const score = 0.5 * mean + 0.5 * scores[worstIdx];
        out[id] = { ...turns[worstIdx][id], score, mood: toMood(score) };
    }
    return out;
}

/** Balance humano: quién ganó y quién cargó con el costo. */
export function humanBalance(avg) {
    const winners = avg.filter(s => s.avg >= 0.5).map(s => s.short.toLowerCase());
    const losers = avg.filter(s => s.avg <= -0.5).map(s => s.short.toLowerCase());
    const list = xs => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : xs[0];
    let text;
    if (losers.length && winners.length) text = `Tus decisiones favorecieron a ${list(winners)}, pero el costo lo cargaron ${list(losers)}.`;
    else if (losers.length) text = `El costo de tus decisiones lo cargaron sobre todo ${list(losers)}.`;
    else if (winners.length) text = `A ${list(winners)} les fue bien, y ningún sector quedó muy golpeado.`;
    else text = 'Ningún sector ganó ni perdió demasiado.';
    return {
        text,
        lesson: losers.length
            ? 'En las crisis rara vez hay una decisión sin costo: el trabajo del BCR es elegir el mal menor y proteger lo que más importa a largo plazo, que la moneda no pierda su valor.'
            : 'Lograste un equilibrio poco común. En la historia real, las crisis casi siempre obligaron a elegir quién cargaba con el costo.'
    };
}
