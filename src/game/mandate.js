import { TOOL_BY_ID } from './toolbox.js';
import { createState, step, inBand, neutralRate, PARAMS, staffRecommendation } from '../model/economy.js';
import { EVENTS, EVENT_BY_ID, SURPRISES, SURPRISE_BY_ID } from '../model/events.js';
import { rateMoods, regionMoods } from './people.js';
import { consequenceCards } from './consequences.js';
import { QUESTIONS, ANSWER_EFFECTS, FOLLOW_UP, BILLS, BILL_RESPONSES, pickDeclaration } from '../model/congress.js';

/**
 * Motor por turnos basado en escenarios. Un turno = `stepsPerTurn` pasos mensuales del
 * modelo con la misma tasa (3 = trimestre). Agrega presión política, eventos (guionados o
 * aleatorios), imprevistos que se revelan después de decidir y ruido. Módulo puro (sin DOM).
 *
 * El modo libre usa FREE_SCENARIO; el tutorial y los capítulos históricos viven en model/history.js.
 */

export const MOVES = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];
/** Intervención cambiaria por turno, en miles de millones de US$ (positivo = vender dólares). */
export const FX_MOVES = [3, 1.5, 0, -1.5, -3];

/**
 * Mercado cambiario (trimestral). La depreciación del sol en el turno (%):
 *   presión externa/interna del evento − efecto de subir la tasa − ventas de dólares + ruido.
 * Un dólar más caro se traslada a precios (choque de oferta) y golpea a quienes deben en dólares.
 */
export const FX = {
    rateEffect: 1.2,     // cada punto de alza de la tasa aprecia el sol ~1.2% en el trimestre
    saleEffect: 1.0,     // cada US$ 1 mil millones vendido reduce ~1% la depreciación
    passThrough: 0.12,   // 10% de depreciación suma ~1.2 al choque de oferta del trimestre
    balanceSheet: 0.06,  // dolarización: cada 1% de depreciación resta demanda
    noise: 1.6,
    calmPressure: 0.5,   // bajo esta presión (%), vender dólares no tiene razón de ser
    idleSale: 1          // credibilidad perdida por cada US$ mil millones vendidos sin razón
};

/** Traslado a precios: asimétrico (los precios suben con el dólar más de lo que bajan). */
function passThrough(dep) {
    return FX.passThrough * (dep > 0 ? dep : 0.5 * dep);
}

/** Depreciación esperada (%) sin ruido: la usa la proyección y la mesa de dinero. */
export function expectedDepreciation(pressure, move, sell) {
    return pressure - FX.rateEffect * move - FX.saleEffect * sell;
}
export const DEFAULT_LIMITS = { pressure: 100, credibility: 15, inflation: 7, growth: -3, inflationTurns: 1 };

/** Las reservas se acaban cuando llegan al piso que el BCR no puede tocar (30% del nivel inicial). */
export const RESERVE_FLOOR = 0.3;

/**
 * Confianza ciudadana (0–100): cómo ve la gente al BCR. Sigue el ánimo de los sectores, cae con la
 * inflación alta y la recesión, y la mueven las cartas de consecuencia. No cambia el modelo macro.
 */
export const TRUST = { start: 60, base: 66, mood: 6, inflation: 9, recession: 6, jobs: 10, dollar: 1.5, speed: 0.4 };

/**
 * Niebla: la proyección es un rango, no un número. Con más credibilidad el rango se estrecha.
 * Ancho (pp de inflación) por turno de horizonte: base + extra × (1 − credibilidad/100).
 */
export const FOG = { base: 0.12, extra: 0.45 };

/** El Congreso: qué tan rápido se enoja y cuándo interrumpe al Directorio. */
export const CONGRESS = {
    start: 50,         // enojo inicial: el Congreso ya llega molesto con el BCR
    revert: 0.3,       // cada turno el enojo vuelve este tanto hacia `start` (nunca se calma del todo)
    askWeight: 1.25,   // multiplicador del enojo cuando ignoras un pedido de bajar la tasa
    citeAt: 60,        // desde este enojo te cita
    citeGap: 2,        // turnos mínimos entre citaciones
    billGap: 2,        // turnos mínimos entre proyectos de ley
    billBase: 0.18,    // probabilidad base de un proyecto por turno (+ enojo / 300)
    insistAt: 75,      // con este enojo, aprueban el proyecto aunque te opongas (por insistencia)
    envy: 4,           // el éxito también molesta: enojo extra por turno con la inflación en meta y prestigio
    envyCred: 65,      // desde esta credibilidad, el BCR "se lleva los aplausos"
    envyCap: 60        // la envidia sola nunca te saca: llega justo a la zona de citaciones, no más
};

/**
 * El Directorio (art. 86 de la Constitución): 7 miembros; el Ejecutivo designa 4 (incluido el presidente,
 * que eres tú) y el Congreso elige 3. Ninguno representa intereses particulares: aquí cada uno tiene
 * su criterio. Votan a favor si tu propuesta está a 25 pb o menos de lo que prefieren.
 */
export const BOARD = [
    { id: 'tecnica', role: 'La técnica', origin: 'Ejecutivo', style: 'Sigue la regla del equipo técnico.' },
    { id: 'halcon', role: 'El halcón', origin: 'Ejecutivo', style: 'Teme más a la inflación que a la recesión.' },
    { id: 'prudente', role: 'La prudente', origin: 'Ejecutivo', style: 'Prefiere pasos cortos: la mitad de lo que pide el staff.' },
    { id: 'paloma', role: 'La paloma', origin: 'Congreso', style: 'Teme más al desempleo que a la inflación.' },
    { id: 'empleo', role: 'El del empleo', origin: 'Congreso', style: 'A medio camino entre el staff y la paloma.' },
    { id: 'veterano', role: 'El veterano', origin: 'Congreso', style: 'No le gustan los bandazos: prefiere seguir la dirección del último movimiento.' }
];
export const BOARD_RULES = { tolerance: 0.5, majority: 4, unanimous: 1, split: -1, lost: -5, reach: 0.75 };

/**
 * Informalidad: 70.2% del empleo en 2025 (INEI). Según el BCRP (Carrera y Razzo, DT 2026-001), el empleo
 * informal absorbe los desequilibrios del mercado laboral: en vez de desempleo, aparece chamba precaria.
 */
export const INFORMAL = { gapEffect: 0.6, recovery: 0.25, revert: 0.1, min: 62, max: 82 };

/** Puntaje del modo libre para 2 y 3 estrellas. */
export const SCORE_STARS = [62, 78];

/** Quedarse callado cuando se acaba el reloj: costo frente a esperar a propósito. */
export const SILENCE = { credibility: 3, fx: 1.5 };

/** Momento decisivo: margen frente al BCRP real y premio o castigo de credibilidad. */
export const CLIMAX = { inflationSlack: 0.25, growthSlack: 1.0, reward: 6, penalty: 6 };

/** Cuando al BCR le va bien, algunos congresistas buscan protagonismo. Notas de juego, no citas reales. */
const ENVY_NOTES = [
    'Te va bien y eso incomoda: algunos congresistas salen en los medios a decir que el BCR "no hace nada por la gente".',
    'Con la inflación en meta, en el Congreso se preguntan por qué el BCR acumula tantas reservas "sin usarlas".',
    'Tu prestigio crece y varios congresistas buscan protagonismo criticando al BCR.',
    'Las encuestas aplauden al BCR y eso no le gusta a todos en el Congreso: piden que rindas cuentas otra vez.'
];

/**
 * El comunicado (guía futura): lo que el BCR dice sobre sus próximos pasos.
 * `exp` mueve las expectativas al instante, escalado por la credibilidad (sin credibilidad,
 * las palabras no valen nada); `demand` y `fx` son el efecto en las condiciones financieras.
 * El tono compromete el turno siguiente: decir halcón y luego bajar la tasa es romper tu palabra.
 */
export const GUIDANCE = {
    halcon: { label: 'Halcón', phrase: 'El Directorio evaluará ajustes adicionales si la inflación no cede.', exp: -0.3, demand: -0.2, fx: -0.6, pressure: 3 },
    neutral: { label: 'Neutral', phrase: 'El Directorio está atento a la nueva información sobre la inflación y sus determinantes.', exp: 0, demand: 0, fx: 0, pressure: 0 },
    paloma: { label: 'Paloma', phrase: 'El Directorio considera que hay espacio para seguir apoyando a la economía.', exp: 0.2, demand: 0.3, fx: 0.4, pressure: -3 }
};
export const GUIDANCE_RULES = { kept: 2, broken: 7, idle: 2, brokenFx: 1.5 };

/** Efecto inmediato de un tono: el estado de partida con expectativas movidas y el choque extra. */
export function guidanceEffect(state, tone) {
    const g = GUIDANCE[tone] ?? GUIDANCE.neutral;
    return {
        start: g.exp ? { ...state, expectations: state.expectations + g.exp * state.credibility / 100 } : state,
        shock: { demand: g.demand },
        fx: g.fx,
        pressure: g.pressure
    };
}

export const FREE_SCENARIO = {
    id: 'libre',
    stepsPerTurn: 1,   // un turno = una reunión mensual del Directorio
    turnUnit: 'mes',
    startMonth: 0,
    shockScale: 0.45,  // las cartas son del mes, no del trimestre
    horizon: 6,        // la proyección mira seis meses adelante
    hikePressure: 3,
    congress: { citeGap: 3, billGap: 3 },
    // El encaje se gana a mitad del mandato (mes 6) aunque no hayas jugado el modo historia.
    toolUnlock: { 'encaje-sube': 5, 'encaje-baja': 5 },
    limits: { inflation: 8, inflationTurns: 2 },
    board: true, // el Directorio vota tus propuestas
    informal: 70.2, // % de empleo informal (INEI, EPEN 2025)
    title: 'Modo libre',
    turns: 12,
    startYear: 2027,
    initial: { rate: 4.25, outputGap: 0.3, core: 2.4, supply: 0.1, expectations: 2.3, credibility: 70 },
    firstEvent: 'consumo-sube',
    randomEvents: true,
    intensityGrowth: 0.3,
    surpriseChance: 0.3,
    citations: true, // el Congreso cita al Directorio cuando está molesto
    bills: true,     // y presenta proyectos de ley que afectan al BCR
    // Tipo de cambio S/ por US$ y reservas en US$ miles de millones. El piso es alto: el BCR guarda la
    // mayor parte de las reservas como seguro, y lo que puede usar en un mandato es limitado.
    fx: { rate: 3.75, reserves: 80, floor: 0.6 },
    // Ratificación: inflación en meta Y sin apagar el país (sin esto, apretar siempre ganaba el 74% de las veces).
    reappoint: { minInBand: 8, minAvgGrowth: 1.8 }
};

// Compatibilidad: el modo libre sigue exponiendo estas constantes.
export const QUARTERS = FREE_SCENARIO.turns;
export const LIMITS = DEFAULT_LIMITS;

// PRNG determinista para poder repetir una partida con la misma semilla.
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const roundQ = v => Math.round(v * 4) / 4;

export function quarterLabel(q, startYear = FREE_SCENARIO.startYear) {
    return `T${(q % 4) + 1} ${startYear + Math.floor(q / 4)}`;
}

export const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];

export function monthLabel(q, startYear = FREE_SCENARIO.startYear, startMonth = 0) {
    const k = startMonth + q;
    return `${MONTHS[k % 12]} ${startYear + Math.floor(k / 12)}`;
}

function scaleShock(shock = {}, k) {
    return { demand: (shock.demand ?? 0) * k, supply: (shock.supply ?? 0) * k, credibility: shock.credibility ?? 0 };
}

function splitShock(shock = {}, n = 3) {
    return {
        demand: (shock.demand ?? 0) / n,
        supply: (shock.supply ?? 0) / n,
        credibility: (shock.credibility ?? 0) / n
    };
}

function addShock(a = {}, b = {}) {
    return {
        demand: (a.demand ?? 0) + (b.demand ?? 0),
        supply: (a.supply ?? 0) + (b.supply ?? 0),
        credibility: (a.credibility ?? 0) + (b.credibility ?? 0)
    };
}

/**
 * Camino esperado si la tasa se mantiene: lo que el equipo técnico "sabe" hoy
 * (incluye el evento del turno, no los imprevistos ni el ruido ni eventos futuros).
 */
export function projectPath(state, rate, event, quarters = 4, params = PARAMS, steps = 3, extra = {}, gradual = false) {
    let s = state;
    const path = [];
    for (let q = 0; q < quarters; q++) {
        for (let m = 0; m < steps; m++) {
            const shock = q === 0 ? splitShock(addShock(event?.shock, extra), steps) : {};
            s = step(s, q === 0 ? monthRate(state.rate, rate, m, steps, gradual) : rate, shock, params).state;
        }
        path.push({ inflation: s.inflation, growth: s.growth });
    }
    return path;
}

/**
 * Tasa del mes m dentro del turno. Con `gradual`, el cambio se reparte entre los
 * Programas Monetarios mensuales del trimestre (como hace el BCRP en la realidad).
 */
function monthRate(from, to, m, steps, gradual) {
    return gradual ? from + (to - from) * (m + 1) / steps : to;
}

export default class Mandate {
    constructor(seed = Date.now(), scenario = FREE_SCENARIO) {
        this.scenario = scenario;
        this.seed = seed;
        this.rng = mulberry32(seed);
        this.params = { ...PARAMS, ...(scenario.params ?? {}) };
        this.limits = { ...DEFAULT_LIMITS, ...(scenario.limits ?? {}) };
        this.turns = scenario.turns;
        this.steps = scenario.stepsPerTurn ?? 3;
        this.unit = scenario.turnUnit ?? (this.steps === 1 ? 'mes' : 'trimestre');
        this.shockScale = scenario.shockScale ?? 1;
        this.horizon = scenario.horizon ?? 4;
        this.cg = { ...CONGRESS, ...(scenario.congress ?? {}) };
        this.trust = scenario.trust ?? TRUST.start;
        this.overLimit = 0;           // turnos seguidos con la inflación sobre el límite
        this.consequences = [];       // cartas de consecuencia que se muestran al empezar el turno
        this.consequenceLog = [];     // todas las que salieron, con su turno
        this.records = [];            // cada turno jugado, para las consecuencias y el final
        this.consequenceCooldown = {};
        this.minRate = scenario.minRate ?? 0.25;
        this.moves = scenario.moves ?? MOVES;
        this.maxMove = Math.max(...this.moves.map(Math.abs));
        this.gradual = !!scenario.monthlyMeetings;
        // Mercado cambiario (opcional por escenario): tipo de cambio y reservas en US$ miles de millones.
        this.fx = scenario.fx ? { rate: scenario.fx.rate, reserves: scenario.fx.reserves, initialReserves: scenario.fx.reserves, floor: scenario.fx.floor ?? RESERVE_FLOOR, lastDep: 0 } : null;
        this.fxStart = this.fx?.rate ?? null;
        this.state = createState(scenario.initial);
        this.state.growth = this.params.potentialGrowth + this.state.outputGap;
        this.pressure = scenario.pressure ?? CONGRESS.start;
        this.quarter = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.used = new Set();
        this.usedSurprises = new Set();
        this.scheduled = null;
        this.calmCount = 0;
        this.gameOver = null;
        this.stats = { resisted: 0, ceded: 0, bigMoves: 0, surprises: 0, guidanceKept: 0, guidanceBroken: 0, maxPressure: 0, envyTurns: 0, combos: 0, climaxWon: false, convinced: 0, lostVotes: 0 };
        this.tools = (scenario.tools ?? []).map(t => ({ ...t, left: t.uses ?? 1 }));
        this.effects = []; // efectos de herramientas que duran varios turnos
        this.styleLog = []; // cada decisión frente a la del equipo técnico (para el arquetipo)
        // El comunicado existe desde las metas de inflación (2002); el tutorial y 1990 no lo usan.
        this.guidanceOn = scenario.guidance !== false;
        this.guidance = null; // tono del último comunicado, que compromete el turno siguiente
        // Caja de herramientas: lo que el escenario (o lo ganado en la historia) permite usar, una por turno.
        this.toolbox = (scenario.toolbox ?? []).map(id => TOOL_BY_ID[id]).filter(t => t && (!t.needsFx || scenario.fx))
            .map(t => ({ ...t, readyAt: scenario.toolUnlock?.[t.id] ?? 0, unlockAt: scenario.toolUnlock?.[t.id] ?? 0, used: 0 }));
        this.lastTool = null;
        this.fxPassMult = 1; // baja para siempre con la desdolarización
        // Informalidad: el colchón del mercado laboral. Sube cuando la economía crece bajo su potencial.
        this.informal = scenario.informal ?? null;
        this.informalBase = scenario.informal ?? null;
        this.peopleHistory = []; // ánimo de cada sector, turno a turno
        this.regionHistory = []; // ánimo de cada departamento, turno a turno
        this.history = [{ state: this.state, rate: this.state.rate, pressure: this.pressure, trust: this.trust, label: 'Inicio', fx: scenario.fx?.rate ?? null, reserves: scenario.fx?.reserves ?? null }];
        // El Congreso usa su propio azar para no alterar la secuencia de choques (y la calibración).
        this.crng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
        // Y el dólar, otro: se consume exactamente una vez por turno, decida lo que decida el jugador.
        this.fxRng = mulberry32((seed ^ 0x27d4eb2f) >>> 0);
        this.year = Number(String(scenario.year ?? scenario.startYear ?? 2027).match(/\d{4}(?!.*\d{4})/)?.[0] ?? 2027);
        this.congress = { lastCitation: -99, lastBill: -99, promise: null, pending: null, pendingBill: null, used: new Set(), usedBills: new Set(), citations: 0, promisesBroken: 0, billsPassed: 0 };
        this.event = this.drawEvent();
        this.maybeCite(); // una citación guionada puede abrir el capítulo
    }

    get isOver() {
        return !!this.gameOver || this.quarter >= this.turns;
    }

    label(q = this.quarter) {
        if (this.scenario.labels?.[q]) return this.scenario.labels[q];
        return this.unit === 'mes' ? monthLabel(q, this.scenario.startYear, this.scenario.startMonth ?? 0) : quarterLabel(q, this.scenario.startYear);
    }

    /** Palabra para el turno: "mes" o "trimestre" (y su plural). */
    unitWord(n = 1) {
        return n === 1 ? this.unit : this.unit === 'mes' ? 'meses' : 'trimestres';
    }

    /** Intensidad de las cartas: suben a medida que avanza el mandato (solo con eventos al azar). */
    intensity() {
        return (1 + (this.scenario.intensityGrowth ?? 0) * Math.floor(this.quarter / (this.scenario.yearLength ?? 4))) * this.shockScale;
    }

    /** El choque de la carta del mes, ya escalado: lo que el equipo técnico ve venir. */
    eventShock() {
        return scaleShock(this.event.shock, this.intensity());
    }

    /** Ancho de la niebla de la proyección a `k` turnos (1 = el próximo). */
    fog(k) {
        const perTurn = (FOG.base + FOG.extra * (1 - this.state.credibility / 100)) * Math.sqrt(this.steps);
        return perTurn * Math.sqrt(k) * 1.4;
    }

    labels() {
        return ['Inicio', ...Array.from({ length: this.turns }, (_, q) => this.label(q))];
    }

    drawEvent() {
        const scripted = this.scenario.script?.[this.quarter];
        if (scripted) return typeof scripted === 'string' ? this.take(EVENT_BY_ID[scripted]) : scripted;
        if (this.quarter === 0 && this.scenario.firstEvent) return this.take(EVENT_BY_ID[this.scenario.firstEvent]);
        if (this.scheduled) {
            const e = EVENT_BY_ID[this.scheduled];
            this.scheduled = null;
            return this.take(e);
        }
        if (!this.scenario.randomEvents) return EVENT_BY_ID.calma;
        // La intensidad sube con el mandato: año 1 suave, año 2 medio, año 3 fuerte.
        const year = Math.min(2, Math.floor(this.quarter / (this.scenario.yearLength ?? 4)));
        const weights = [[1, 0, 0], [0.35, 0.65, 0], [0.1, 0.4, 0.5]][year];
        // Máximo 2 trimestres tranquilos por mandato: la calma es un respiro, no la norma.
        const pool = EVENTS.filter(e => e.tier <= 3 && !this.used.has(e.id)
            && !(e.next && this.quarter >= this.turns - 1)
            && !(e.id === 'calma' && this.calmCount >= 2));
        const weighted = pool.map(e => ({ e, w: weights[e.tier - 1] })).filter(x => x.w > 0);
        let r = this.rng() * weighted.reduce((a, x) => a + x.w, 0);
        for (const x of weighted) {
            r -= x.w;
            if (r <= 0) return this.take(x.e);
        }
        return this.take(EVENT_BY_ID.calma);
    }

    take(e) {
        if (e.id === 'calma') this.calmCount += 1;
        else this.used.add(e.id);
        if (e.next) this.scheduled = e.next;
        return e;
    }

    /** Imprevisto de este turno: guionado o al azar. Se decide al anunciar. */
    drawSurprise() {
        const scripted = this.scenario.surprises?.[this.quarter];
        if (scripted) return typeof scripted === 'string' ? SURPRISE_BY_ID[scripted] : scripted;
        const chance = this.scenario.surpriseChance ?? 0;
        if (this.quarter === 0 || this.rng() >= chance) return null;
        const pool = SURPRISES.filter(s => !this.usedSurprises.has(s.id));
        if (!pool.length) return null;
        const s = pool[Math.floor(this.rng() * pool.length)];
        this.usedSurprises.add(s.id);
        return s;
    }

    /** Dos asesores con criterios distintos. Ninguno acierta siempre. */
    advisors() {
        const s = this.state;
        const p = this.params;
        const ideal = (wInfl, wGap, useCore) => {
            const infl = useCore ? s.core : s.inflation;
            return neutralRate(s, p) + wInfl * (infl - p.target) + wGap * s.outputGap;
        };
        // El halcón sube rápido y baja despacio; la paloma, al revés.
        const pace = (target, up, down) => {
            const move = clamp((target > s.rate ? up : down) * (target - s.rate), -this.maxMove, this.maxMove);
            return Math.max(this.minRate, roundQ(s.rate + move));
        };
        const snap = r => {
            const m = this.moves.reduce((best, x) => Math.abs(x - (r - s.rate)) < Math.abs(best - (r - s.rate)) ? x : best, 0);
            return Math.max(this.minRate, s.rate + m);
        };
        let hawk = snap(pace(ideal(2.0, 0.3, false), 0.8, 0.35));
        let dove = snap(pace(ideal(1.0, 0.9, true), 0.4, 0.8));
        // Invariante: el halcón nunca propone una tasa más baja que la paloma.
        if (hawk < dove) [hawk, dove] = [dove, hawk];
        // Si coinciden, se separan un paso: siempre hay un debate.
        if (dove === hawk) {
            if (hawk > s.rate) dove = hawk - 0.25;
            else hawk = dove + 0.25;
        }
        const hm = hawk - s.rate, dm = dove - s.rate;
        const why = {
            hawk: s.inflation > p.bandMax
                ? `La inflación está en ${s.inflation.toFixed(1)}%, fuera del rango. Si no actuamos con fuerza, perderemos credibilidad.`
                : hm > 0
                    ? `La inflación (${s.inflation.toFixed(1)}%) está sobre el 2% y la demanda empuja. Mejor prevenir que curar.`
                    : hm < 0
                        ? 'La inflación está bajo control. Podemos aflojar, pero con cuidado de no reavivarla.'
                        : 'No hay razón para moverse: la inflación está donde debe.',
            dove: s.outputGap < -0.75
                ? `La economía crece solo ${s.growth.toFixed(1)}%. ${dm > 0 ? 'Si hay que subir, que sea poco.' : 'Hay que cuidar la chamba de la gente.'}`
                : Math.abs(s.supply) > 0.3
                    ? `Parte de la inflación viene de alimentos y energía (${s.supply.toFixed(1)} pp). Eso pasará solo; miremos la subyacente (${s.core.toFixed(1)}%).`
                    : dm > 0
                        ? 'Coincido en subir, pero gradualmente: la tasa tarda en hacer efecto y no queremos pasarnos.'
                        : `La subyacente está en ${s.core.toFixed(1)}%. No hay que frenar la economía más de lo necesario.`
        };
        return {
            hawk: { rate: hawk, move: hawk - s.rate, why: why.hawk },
            dove: { rate: dove, move: dove - s.rate, why: why.dove }
        };
    }

    /**
     * Inflación que habría logrado el BCRP real con esta misma semilla (mismos imprevistos
     * y ruido): repite su trayectoria de tasas y usa las herramientas cuando las usó (turno 1).
     */
    /** Estados de cada turno replicando al BCRP real (para el momento decisivo). */
    static replayRealStates(seed, scenario) {
        const m = new Mandate(seed, scenario);
        m.reference = true;
        let i = 0;
        while (!m.isOver) {
            if (i === 1) m.tools.forEach(t => m.useTool(t.id));
            m.decide(scenario.realPath.rate[i], scenario.realPath.fxSales?.[i] ?? 0);
            i++;
        }
        return m.history.slice(1).map(h => h.state);
    }

    static replayReal(seed, scenario) {
        const m = new Mandate(seed, scenario);
        m.reference = true;
        let i = 0;
        while (!m.isOver) {
            if (i === 1) m.tools.forEach(t => m.useTool(t.id));
            m.decide(scenario.realPath.rate[i], scenario.realPath.fxSales?.[i] ?? 0);
            i++;
        }
        return m.history.slice(1).map(h => h.state.inflation);
    }

    toolShock() {
        return this.effects.reduce((acc, e) => addShock(acc, e.shock), {});
    }

    /** Presión sobre el dólar que agregan las herramientas activas (swaps, encaje en dólares). */
    toolFx() {
        return this.effects.reduce((a, e) => a + (e.fx ?? 0), 0);
    }

    /** ¿Se puede usar esta herramienta este turno? */
    toolReady(id) {
        const t = this.toolbox.find(x => x.id === id);
        return !!t && this.quarter >= t.readyAt && !(t.once && t.used);
    }

    /** Presión sobre el dólar de este turno según el evento (sin imprevistos). */
    fxPressure() {
        return this.eventFx(this.event);
    }

    /** Presión de una carta sobre el dólar. Un rumor (`credShield`) pesa menos cuanto más creíble es el BCR. */
    eventFx(e) {
        const shield = e?.credShield ? 1.6 - this.state.credibility / 100 : 1;
        return (e?.fx ?? 0) * this.shockScale * shield;
    }

    /** Cuánto se puede vender sin bajar del piso de reservas (30% del nivel inicial). */
    maxSale() {
        return this.fx ? Math.max(0, this.fx.reserves - this.fx.floor * this.fx.initialReserves) : 0;
    }

    /** Reservas que todavía se pueden usar (sobre el piso), de 0 a 1. */
    reserveShare() {
        if (!this.fx) return 1;
        const usable = (1 - this.fx.floor) * this.fx.initialReserves;
        return Math.max(0, Math.min(1, (this.fx.reserves - this.fx.floor * this.fx.initialReserves) / usable));
    }

    /** Lo que prefiere cada director este turno (movimiento de tasa). */
    boardPrefs() {
        const s = this.state;
        const snap = mv => this.moves.reduce((best, x) => Math.abs(x - mv) < Math.abs(best - mv) ? x : best, 0);
        const floor = mv => Math.max(this.minRate - s.rate, mv);
        const a = this.advisors();
        const staff = staffRecommendation(s) - s.rate;
        const last = this.history.length > 1 ? this.history.at(-1).rate - this.history.at(-2).rate : 0;
        const pref = {
            tecnica: staff,
            halcon: a.hawk.rate - s.rate,
            prudente: staff / 2,
            paloma: a.dove.rate - s.rate,
            empleo: (staff + a.dove.rate - s.rate) / 2,
            veterano: clamp(Math.sign(last) * 0.25, staff - 0.25, staff + 0.25)
        };
        return BOARD.map(d => ({ ...d, pref: floor(snap(pref[d.id])) }));
    }

    /** Votación de tu propuesta; `convinced` = un director que aceptó escucharte este turno. */
    boardVote(move, convinced = null) {
        const prefs = this.boardPrefs();
        const votes = prefs.map(d => ({ ...d, yes: Math.abs(d.pref - move) <= BOARD_RULES.tolerance + 1e-9 || (d.id === convinced && Math.abs(d.pref - move) <= BOARD_RULES.reach + 1e-9) }));
        const yes = 1 + votes.filter(v => v.yes).length; // tú votas a favor
        return { votes, yes, passes: yes >= BOARD_RULES.majority };
    }

    projection(rate, sell = 0, tone = 'neutral', toolId = null) {
        const g = guidanceEffect(this.state, this.guidanceOn ? tone : 'neutral');
        const tool = this.toolReady(toolId) ? TOOL_BY_ID[toolId].effect : null;
        let extra = addShock(addShock(this.toolShock(), g.shock), tool?.shock);
        if (this.fx) {
            const dep = expectedDepreciation(this.fxPressure() + g.fx + this.brokenFx(rate - this.state.rate) + this.toolFx() + (tool?.fx ?? 0), rate - this.state.rate, sell);
            extra = addShock(extra, { supply: passThrough(dep) * this.fxPassMult, demand: -FX.balanceSheet * Math.max(0, dep) });
        }
        const path = projectPath(g.start, rate, { shock: this.eventShock() }, this.horizon, this.params, this.steps, extra, this.gradual);
        return path.map((p, k) => ({ ...p, lo: p.inflation - this.fog(k + 1), hi: p.inflation + this.fog(k + 1) }));
    }

    /** ¿Este movimiento rompe lo que dijo el comunicado anterior? */
    breaksGuidance(move) {
        return (this.guidance === 'halcon' && move < 0) || (this.guidance === 'paloma' && move > 0);
    }

    /** Romper la guía desordena al mercado: el dólar salta. */
    brokenFx(move) {
        return this.breaksGuidance(move) ? GUIDANCE_RULES.brokenFx : 0;
    }

    /** Usa una herramienta especial (p. ej. Reactiva Perú). Dura `effect.turns` turnos. */
    useTool(id) {
        const t = this.tools.find(x => x.id === id);
        if (!t || t.left <= 0) return false;
        t.left -= 1;
        this.effects.push({ id, shock: t.effect.shock, turnsLeft: t.effect.turns });
        this.pressure = clamp(this.pressure + (t.effect.pressure ?? 0), 0, 100);
        return true;
    }

    decide(newRate, sell = 0, tone = 'neutral', toolId = null, { convinced = null, timeout = false } = {}) {
        // Un proyecto de ley sin respuesta se da por "no opinar".
        if (this.congress.pendingBill) this.answerBill(2);
        newRate = Math.max(this.minRate, newRate);
        if (!this.fx) sell = 0;
        sell = Math.min(sell, this.maxSale());
        const prev = this.state;
        const prevPressure = this.pressure;
        const event = this.event;
        // El Directorio vota (modo libre): un cambio sin mayoría no se aprueba y la tasa se mantiene.
        let board = null;
        if (this.scenario.board && !this.reference && newRate !== prev.rate) {
            board = this.boardVote(newRate - prev.rate, convinced);
            board.proposed = newRate - prev.rate;
            if (!board.passes) newRate = prev.rate;
        }
        const move = newRate - prev.rate;
        this.styleLog.push({ move, staff: Math.max(this.minRate, staffRecommendation(prev)) - prev.rate, timeout: !!timeout });
        const notes = [];
        const surprise = this.drawSurprise();
        if (surprise) this.stats.surprises += 1;
        if (!this.guidanceOn || !GUIDANCE[tone]) tone = 'neutral';
        // Si se acabó el reloj, el BCR no dijo nada: no hay comunicado.
        if (timeout) tone = 'neutral';
        const voice = guidanceEffect(prev, tone);
        // La herramienta del turno entra como un efecto más (puede durar varios turnos).
        const tool = this.toolReady(toolId) ? this.toolbox.find(x => x.id === toolId) : null;
        if (tool) {
            tool.used += 1;
            for (const t of this.toolbox) if (t.group === tool.group) t.readyAt = this.quarter + 1 + (tool.cooldown ?? 1);
            this.effects.push({ id: tool.id, shock: tool.effect.shock, fx: tool.effect.fx, turnsLeft: tool.effect.turns, after: tool.effect.after });
        }

        // Los choques pegan más fuerte a medida que avanza el mandato (solo modo libre).
        const intensity = this.intensity();
        let total = addShock(addShock(addShock(scaleShock(event.shock, intensity), scaleShock(surprise?.shock, this.shockScale)), this.toolShock()), voice.shock);
        // Mercado cambiario: se resuelve antes que los precios, porque el dólar se traslada a la inflación.
        let fxRecord = null;
        if (this.fx) {
            const pressure = this.eventFx(event) + (surprise?.fx ?? 0) * this.shockScale + voice.fx + this.brokenFx(move) + this.toolFx() + (timeout ? SILENCE.fx : 0);
            const dep = expectedDepreciation(pressure, move, sell) + (this.fxRng() - 0.5) * FX.noise;
            const before = { ...this.fx };
            this.fx.rate *= 1 + dep / 100;
            this.fx.reserves = Math.max(0, this.fx.reserves - sell);
            this.fx.lastDep = dep;
            total = addShock(total, { supply: passThrough(dep) * this.fxPassMult, demand: -FX.balanceSheet * Math.max(0, dep), credibility: dep > 4 ? -2 : 0 });
            fxRecord = { before, rate: this.fx.rate, reserves: this.fx.reserves, dep, sell, pressure };
        }
        const base = splitShock(total, this.steps);

        // Varios meses con la misma tasa, más ruido: el futuro nunca sale igual a la proyección.
        let s = voice.start;
        const drivers = { demand: 0, expectations: 0, supply: 0 };
        for (let m = 0; m < this.steps; m++) {
            const noise = { demand: (this.rng() - 0.5) * 0.6, supply: (this.rng() - 0.5) * 0.3 };
            const out = step(s, monthRate(prev.rate, newRate, m, this.steps, this.gradual), {
                demand: base.demand + noise.demand,
                supply: base.supply + noise.supply,
                credibility: base.credibility
            }, this.params);
            s = out.state;
            drivers.demand += out.drivers.demand;
            drivers.expectations += out.drivers.expectations;
            drivers.supply += out.drivers.supply;
        }
        this.effects = this.effects.map(e => ({ ...e, turnsLeft: e.turnsLeft - 1 }));
        for (const e of this.effects.filter(x => x.turnsLeft <= 0 && x.after?.fxPass)) {
            this.fxPassMult = Math.min(this.fxPassMult, e.after.fxPass);
            notes.push({ tone: 'good', text: 'La desdolarización ya rinde: ahora el dólar pesa mucho menos en los precios.' });
        }
        this.effects = this.effects.filter(e => e.turnsLeft > 0);

        // Promesa hecha al Congreso en una citación: romperla cuesta caro.
        let promiseNote = null;
        if (this.congress.promise === 'noSubir') {
            if (move > 0) {
                s = { ...s, credibility: Math.max(0, s.credibility - 12) };
                this.pressure += 15;
                this.congress.promisesBroken += 1;
                promiseNote = { tone: 'bad', text: 'Rompiste tu promesa al Congreso de no subir la tasa. Los congresistas te acusan de mentir y los mercados dudan de tu palabra.' };
            } else {
                s = { ...s, credibility: Math.min(100, s.credibility + 2) };
                promiseNote = { tone: 'good', text: 'Cumpliste tu palabra ante el Congreso. Una promesa cumplida también es credibilidad.' };
            }
            this.congress.promise = null;
        }

        // El comunicado anterior: cumplir lo dicho suma credibilidad; contradecirlo la hunde.
        let guidanceNote = null;
        if (this.guidance) {
            const said = GUIDANCE[this.guidance].label.toLowerCase();
            if (this.breaksGuidance(move)) {
                s = { ...s, credibility: Math.max(0, s.credibility - GUIDANCE_RULES.broken) };
                this.stats.guidanceBroken += 1;
                guidanceNote = { tone: 'bad', text: `Tu comunicado anterior fue ${said} y ahora hiciste lo contrario. El mercado ya no sabe si creerte.` };
            } else if ((this.guidance === 'halcon' && move > 0) || (this.guidance === 'paloma' && move < 0)) {
                s = { ...s, credibility: Math.min(100, s.credibility + GUIDANCE_RULES.kept) };
                this.stats.guidanceKept += 1;
                guidanceNote = { tone: 'good', text: 'Hiciste lo que anunciaste en tu comunicado. Palabra cumplida, credibilidad ganada.' };
            } else if (this.guidance === 'halcon' && prev.inflation > this.params.bandMax) {
                s = { ...s, credibility: Math.max(0, s.credibility - GUIDANCE_RULES.idle) };
                guidanceNote = { tone: 'warn', text: 'Anunciaste ajustes si la inflación no cedía, no cedió y no hiciste nada.' };
            }
        }
        this.guidance = tone === 'neutral' ? null : tone;

        // Costos de la herramienta: credibilidad, y abusar de los repos turno tras turno.
        if (tool) {
            let cred = tool.effect.credibility ?? 0;
            if (tool.abuse && this.lastTool === tool.id) {
                cred -= tool.abuse;
                notes.push({ tone: 'warn', text: `Usaste ${tool.name.toLowerCase()} dos turnos seguidos: el mercado empieza a preguntarse por qué.` });
            }
            if (cred) s = { ...s, credibility: clamp(s.credibility + cred, 0, 100) };
        }
        this.lastTool = tool?.id ?? null;
        if (board) {
            const tally = `${board.yes}–${7 - board.yes}`;
            if (!board.passes) {
                s = { ...s, credibility: Math.max(0, s.credibility + BOARD_RULES.lost) };
                notes.push({ tone: 'bad', text: `Tu propuesta perdió la votación (${tally}): sin mayoría no hay cambio y la tasa se mantiene. Un presidente sin respaldo pierde credibilidad.` });
                // Proponer ceder ya es una señal: el mercado conoce la propuesta aunque el Directorio la frene.
                if (board.proposed < 0 && event.asks === 'bajar' && prev.inflation > this.params.bandMax) {
                    s = { ...s, credibility: Math.max(0, s.credibility - 7) };
                    this.stats.ceded += 1;
                    notes.push({ tone: 'bad', text: 'Se supo que propusiste bajar la tasa por presión política con la inflación sobre la meta. El Directorio te frenó, pero el mercado ya duda de ti.' });
                }
            }
            else if (board.yes === 7) { s = { ...s, credibility: Math.min(100, s.credibility + BOARD_RULES.unanimous) }; notes.push({ tone: 'good', text: 'Decisión unánime (7–0): el mercado ve un Directorio unido.' }); }
            else if (board.yes === BOARD_RULES.majority) { s = { ...s, credibility: Math.max(0, s.credibility + BOARD_RULES.split) }; notes.push({ tone: 'warn', text: `Votación ajustada (${tally}): el mercado nota un Directorio dividido.` }); }
            if (convinced) this.stats.convinced += 1;
        }

        // Presión política: se disipa sola, las alzas son impopulares y los pedidos ignorados pesan.
        const hikeCost = this.scenario.hikePressure ?? 4; // presión por cada 25 pb de alza
        const CG = this.cg;
        let pressure = this.pressure + (CG.start - this.pressure) * CG.revert + Math.max(0, move) / 0.25 * hikeCost - Math.max(0, -move) / 0.25 * 2;
        pressure += (surprise?.pressure ?? 0) + voice.pressure + (tool?.effect.pressure ?? 0);
        // El éxito también molesta (envidia, ganas de figurar), pero solo hasta un tope.
        let envy = 0, envyTo = null;
        if (!this.reference && inBand(s.inflation) && s.credibility >= CG.envyCred && pressure < CG.envyCap) {
            envy = Math.min(CG.envyCap - pressure, CG.envy * (1 + 0.5 * Math.min(this.streak, 2)));
            pressure += envy;
            envyTo = pressure;
            notes.push({ tone: 'warn', text: ENVY_NOTES[this.quarter % ENVY_NOTES.length] });
        }
        if (event.asks === 'bajar') {
            if (move > 0) {
                pressure += event.pressure * CG.askWeight;
                this.stats.resisted += 1;
                notes.push({ tone: 'warn', text: 'Ignoraste el pedido de bajar la tasa: sube la presión política.' });
            } else if (move < 0) {
                pressure -= event.pressure / 2;
                if (prev.inflation > this.params.bandMax) {
                    s = { ...s, credibility: Math.max(0, s.credibility - 10) };
                    this.stats.ceded += 1;
                    notes.push({ tone: 'bad', text: 'Bajaste la tasa con la inflación sobre la meta: el mercado duda de la autonomía del BCR.' });
                }
            }
        }
        if (event.asks === 'subir' && move <= 0 && prev.inflation > this.params.bandMax) {
            s = { ...s, credibility: Math.max(0, s.credibility - 4) };
            notes.push({ tone: 'bad', text: 'La gente esperaba que actuaras contra la inflación y no lo hiciste.' });
        }
        if (promiseNote) notes.push(promiseNote);
        if (guidanceNote) notes.push(guidanceNote);
        // El silencio no es lo mismo que esperar: si se acabó el reloj, el mercado lee parálisis.
        if (timeout) {
            s = { ...s, credibility: Math.max(0, s.credibility - SILENCE.credibility) };
            this.stats.silences = (this.stats.silences ?? 0) + 1;
            notes.push({ tone: 'bad', text: `Se acabó el tiempo y el BCR no dijo nada. El mercado lo leyó como parálisis: −${SILENCE.credibility} de credibilidad y el dólar se agitó. Esperar a propósito no cuesta esto; quedarse callado, sí.` });
        }
        if (Math.abs(move) / (this.gradual ? this.steps : 1) > this.params.bigMove) this.stats.bigMoves += 1;
        this.pressure = clamp(pressure, 0, 100);

        // Momento decisivo del capítulo: te comparas con lo que logró el BCRP real, con los mismos imprevistos.
        const climax = this.scenario.climax?.turn === this.quarter;
        let climaxWon = null;
        if (climax) {
            const ref = this.reference ? s : Mandate.replayRealStates(this.seed, this.scenario)[this.quarter];
            climaxWon = s.inflation <= ref.inflation + CLIMAX.inflationSlack && s.growth >= ref.growth - CLIMAX.growthSlack;
            s = { ...s, credibility: clamp(s.credibility + (climaxWon ? CLIMAX.reward : -CLIMAX.penalty), 0, 100) };
            notes.push(climaxWon
                ? { tone: 'good', text: `Superaste el momento decisivo: lo hiciste igual o mejor que el BCRP real (inflación ${s.inflation.toFixed(1)}% frente a ${ref.inflation.toFixed(1)}%). Credibilidad +${CLIMAX.reward}.` }
                : { tone: 'bad', text: `En el momento decisivo, el BCRP real lo hizo mejor (inflación ${ref.inflation.toFixed(1)}% y PBI ${ref.growth.toFixed(1)}%, frente a tus ${s.inflation.toFixed(1)}% y ${s.growth.toFixed(1)}%). Credibilidad −${CLIMAX.penalty}.` });
        }
        this.state = s;
        const ok = inBand(s.inflation);
        this.streak = ok ? this.streak + 1 : 0;
        this.bestStreak = Math.max(this.bestStreak, this.streak);

        const label = this.label();
        if (this.fx) {
            if (this.reserveShare() < 0.3) {
                s = { ...s, credibility: Math.max(0, s.credibility - 3) };
                notes.push({ tone: 'bad', text: `Las reservas bajaron a US$ ${this.fx.reserves.toFixed(1)} mil millones. Los mercados temen que el BCR ya no pueda defender al sol.` });
            }
            // Vender dólares sin presión cambiaria gasta reservas para nada: el mercado lo nota.
            if (fxRecord.sell > 0 && fxRecord.pressure < FX.calmPressure) {
                s = { ...s, credibility: Math.max(0, s.credibility - FX.idleSale * fxRecord.sell) };
                notes.push({ tone: 'warn', text: 'Vendiste dólares sin que hubiera presión sobre el sol. El mercado se pregunta por qué gastas reservas.' });
            }
            if (fxRecord.dep > 4) notes.push({ tone: 'warn', text: `El dólar subió ${fxRecord.dep.toFixed(1)}% en el ${this.unit}: quienes deben en dólares pagan más soles y lo importado se encarece.` });
        }
        const record = {
            quarter: this.quarter, label, event, surprise, prev, state: s,
            rate: newRate, move, drivers, notes,
            pressure: this.pressure, prevPressure,
            projected: projectPath(prev, newRate, { shock: scaleShock(event.shock, intensity) }, 1, this.params, this.steps, {}, this.gradual)[0].inflation,
            streak: this.streak,
            real: this.scenario.realPath ? {
                rate: this.scenario.realPath.rate[this.quarter],
                inflation: this.scenario.realPath.inflation[this.quarter]
            } : null
        };
        record.fx = fxRecord;
        record.tone = tone;
        record.tool = tool?.id ?? null;
        record.climax = climax;
        record.board = board;
        if (board && !board.passes) this.stats.lostVotes += 1;
        record.climaxWon = climaxWon;
        if (climaxWon) this.stats.climaxWon = true;
        if (envy > 0) this.stats.envyTurns += 1;
        if (move !== 0 && tone !== 'neutral' && tool) this.stats.combos += 1;
        this.stats.maxPressure = Math.max(this.stats.maxPressure, this.pressure);
        record.envy = envy;
        record.envyTo = envyTo;
        this.lastEnvy = envy;
        if (this.informal !== null) {
            const before = this.informal;
            const gap = s.growth - this.params.potentialGrowth;
            const k = this.steps / 3; // calibrado por trimestre
            this.informal = clamp(before + k * (INFORMAL.gapEffect * Math.max(0, -gap) - INFORMAL.recovery * Math.max(0, gap) + INFORMAL.revert * (this.informalBase - before)), INFORMAL.min, INFORMAL.max);
            record.informal = { before, after: this.informal };
            record.informalUp = this.informal - before;
            this.stats.maxInformal = Math.max(this.stats.maxInformal ?? 0, this.informal);
        }
        record.people = rateMoods(record, this.params.potentialGrowth);
        this.peopleHistory.push(record.people);
        // Confianza ciudadana: sigue el ánimo de la gente; las cartas de consecuencia la mueven aparte.
        const prevTrust = this.trust;
        const avgMood = record.people.reduce((a, p) => a + p.mood, 0) / record.people.length;
        const trustTarget = TRUST.base + TRUST.mood * avgMood - TRUST.inflation * Math.max(0, s.inflation - this.params.bandMax)
            - TRUST.recession * Math.max(0, -s.growth) - TRUST.jobs * Math.max(0, this.params.potentialGrowth - 0.5 - s.growth)
            - TRUST.dollar * Math.max(0, (fxRecord?.dep ?? 0) - 2);
        this.trust = clamp(this.trust + TRUST.speed * (trustTarget - this.trust), 0, 100);
        record.prevTrust = prevTrust;
        record.sell = fxRecord?.sell ?? 0;
        record.waited = move === 0 && !(fxRecord?.sell) && tone === 'neutral' && !tool;
        const fxTags = fxRecord ? (fxRecord.dep > 3 ? ['dolar'] : fxRecord.dep < -3 ? ['sol-fuerte'] : []) : [];
        record.regions = regionMoods({ state: s, move, tags: [...new Set([...(event.tags ?? []), ...(surprise?.tags ?? []), ...fxTags])] });
        this.regionHistory.push(record.regions);
        record.declaration = this.reference ? null : pickDeclaration({ move, pressure: this.pressure, year: this.year, rng: this.crng });
        record.headline = timeout ? 'El BCR, mudo: se acabó el tiempo y no hubo decisión' : headline({ ...record, surprising: Math.abs(move) / (this.gradual ? this.steps : 1) > this.params.bigMove }, this.params);
        this.records.push(record);
        // Cartas de consecuencia: lo que hiciste hace unos turnos te alcanza (solo afectan confianza y Congreso).
        this.consequences = this.reference ? [] : consequenceCards(this);
        for (const c of this.consequences) {
            this.trust = clamp(this.trust + (c.effect.trust ?? 0), 0, 100);
            this.pressure = clamp(this.pressure + (c.effect.pressure ?? 0), 0, 100);
            this.consequenceLog.push({ ...c, turn: this.quarter + 1 });
        }
        record.trust = this.trust;
        record.pressure = this.pressure;
        this.history.push({ state: s, rate: newRate, pressure: this.pressure, trust: this.trust, label, fx: this.fx?.rate ?? null, reserves: this.fx?.reserves ?? null });

        const L = this.limits;
        this.overLimit = s.inflation >= L.inflation ? this.overLimit + 1 : 0;
        if (this.pressure >= L.pressure) this.gameOver = 'presion';
        else if (s.credibility <= L.credibility) this.gameOver = 'credibilidad';
        else if (this.overLimit >= (L.inflationTurns ?? 1)) this.gameOver = 'inflacion';
        else if (s.growth <= L.growth) this.gameOver = 'recesion';
        else if (this.fx && this.reserveShare() <= 1e-6) this.gameOver = 'reservas';

        this.quarter += 1;
        if (!this.isOver) {
            this.event = this.drawEvent();
            this.maybeCite();
        }
        return record;
    }

    /** Si el Congreso está molesto, te cita (como mucho una vez cada 3 turnos). */
    maybeCite() {
        const c = this.congress;
        if (this.reference) return;
        // Citaciones guionadas: episodios reales que ocurrieron en ese momento del capítulo.
        const scripted = this.scenario.scriptedCitations?.[this.quarter];
        if (scripted && !c.used.has(scripted)) {
            c.used.add(scripted);
            c.lastCitation = this.quarter;
            c.pending = QUESTIONS.find(q => q.id === scripted);
            return;
        }
        if (!this.scenario.citations || this.pressure < this.cg.citeAt || this.quarter - c.lastCitation < this.cg.citeGap) return this.maybeBill();
        // Solo preguntas de la época del escenario (sin anacronismos).
        const [from, to] = this.scenario.citationYears ?? [0, this.year];
        const pool = QUESTIONS.filter(q => !c.used.has(q.id) && q.year >= from && q.year <= to);
        if (!pool.length) return this.maybeBill();
        const q = pool[Math.floor(this.crng() * pool.length)];
        c.used.add(q.id);
        c.lastCitation = this.quarter;
        c.pending = q;
    }

    /** El Congreso presenta un proyecto de ley (más probable cuanto más molesto está). */
    maybeBill() {
        const c = this.congress;
        // Nunca en el primer turno: el jugador primero tiene que aprender a decidir.
        if (this.reference || !this.scenario.bills || c.pending || this.quarter < 1 || this.quarter - c.lastBill < this.cg.billGap) return;
        const [from, to] = this.scenario.billYears ?? [0, this.year];
        const pool = BILLS.filter(b => !c.usedBills.has(b.id) && b.year >= from && b.year <= to && (!b.effects.reserves || this.fx));
        if (!pool.length) return;
        if (this.crng() >= this.cg.billBase + this.pressure / 300) return;
        const b = pool[Math.floor(this.crng() * pool.length)];
        c.usedBills.add(b.id);
        c.lastBill = this.quarter;
        c.pendingBill = b;
    }

    /**
     * Responde el proyecto de ley pendiente (0 = oponerse, 1 = negociar, 2 = callar).
     * Oponerse lo archiva, salvo que el Congreso esté tan molesto que lo apruebe por insistencia.
     */
    answerBill(i) {
        const c = this.congress;
        const bill = c.pendingBill;
        if (!bill) return null;
        const r = BILL_RESPONSES[i];
        const before = { pressure: this.pressure, credibility: this.state.credibility, reserves: this.fx?.reserves ?? null };
        const passed = r.style !== 'oponerse' || this.pressure >= this.cg.insistAt;
        const factor = !passed ? 0 : r.style === 'negociar' ? 0.5 : 1;
        this.pressure = clamp(this.pressure + r.pressure, 0, 100);
        let cred = this.state.credibility + r.credibility + (bill.effects.credibility ?? 0) * factor;
        if (factor > 0) {
            const shock = scaleShock(bill.effects.shock, factor);
            this.effects.push({ id: bill.id, shock, turnsLeft: bill.effects.turns });
            if (bill.effects.reserves && this.fx) this.fx.reserves = Math.max(0, this.fx.reserves + bill.effects.reserves * factor);
            c.billsPassed += 1;
        }
        this.state = { ...this.state, credibility: clamp(cred, 0, 100) };
        c.pendingBill = null;
        return { bill, response: r, passed, factor, insisted: r.style === 'oponerse' && passed, before, after: { pressure: this.pressure, credibility: this.state.credibility, reserves: this.fx?.reserves ?? null } };
    }

    /** Responde la citación pendiente con el estilo de la respuesta `i` (0–2). */
    answerCitation(i) {
        const c = this.congress;
        const q = c.pending;
        if (!q) return null;
        const answer = q.answers[i];
        const fx = ANSWER_EFFECTS[answer.style];
        const before = { pressure: this.pressure, credibility: this.state.credibility };
        this.pressure = clamp(this.pressure + fx.pressure, 0, 100);
        this.state = { ...this.state, credibility: clamp(this.state.credibility + fx.credibility, 0, 100) };
        c.promise = fx.promise;
        c.pending = null;
        c.citations += 1;
        return { question: q, answer, fx, before, after: { pressure: this.pressure, credibility: this.state.credibility }, followUp: answer.style === 'evasiva' ? FOLLOW_UP : null };
    }

    evaluate() {
        const qs = this.history.slice(1).map(h => h.state);
        const inBandCount = qs.filter(s => inBand(s.inflation)).length;
        const final = this.state;
        const avg = arr => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
        const minGrowth = Math.min(...qs.map(s => s.growth));
        const inflationLoss = avg(qs.map(s => (s.inflation - this.params.target) ** 2));
        const growthLoss = avg(qs.map(s => Math.max(0, 1.5 - s.growth) ** 2));
        const survived = !this.gameOver;
        const avgTrust = avg(this.history.slice(1).map(h => h.trust ?? this.trust));
        const avgGrowth = avg(qs.map(s => s.growth));

        const goals = this.scenario.goals;
        let checks = null;
        let reappointed;
        let score;
        if (goals) {
            checks = goals.map(g => checkGoal(g, { final, minGrowth, inBandCount, qs }));
            reappointed = survived && checks.every(c => c.ok);
            if (this.scenario.realPath && !this.reference) {
                // Puntaje relativo: 100 = igual que el BCRP real enfrentando los mismos imprevistos.
                const ref = Mandate.replayReal(this.seed, this.scenario);
                const loss = xs => avg(xs.map(v => (v - this.params.target) ** 2)) + 0.5;
                score = survived ? Math.min(200, Math.round(100 * loss(ref) / loss(qs.map(q => q.inflation)))) : 0;
            } else if (this.scenario.realPath) {
                score = 100;
            } else {
                score = survived ? Math.max(0, Math.round(100 - 12 * inflationLoss - 4 * growthLoss)) : 0;
            }
        } else {
            // Modo libre: meses en la meta + confianza ciudadana promedio + credibilidad final + crecimiento.
            const rule = this.scenario.reappoint;
            reappointed = survived && inBandCount >= rule.minInBand && inBand(final.inflation) && avgGrowth >= (rule.minAvgGrowth ?? -Infinity);
            // Puntaje: meses en meta + confianza + credibilidad + no haber apagado el país.
            const growthScore = clamp(avgGrowth / this.params.potentialGrowth, 0, 1);
            score = survived ? Math.round(40 * inBandCount / this.turns + 25 * avgTrust / 100 + 20 * final.credibility / 100 + 15 * growthScore) : 0;
        }
        // Llegar al final ya vale una estrella; el resto depende de cómo llegaste.
        const stars = goals
            ? (!reappointed ? 0 : this.scenario.realPath ? (score >= 100 ? 3 : score >= 75 ? 2 : 1) : (score >= 85 ? 3 : score >= 65 ? 2 : 1))
            : (!survived ? 0 : score >= SCORE_STARS[1] ? 3 : score >= SCORE_STARS[0] ? 2 : 1);

        // Los logros se calculan fuera del motor (game/achievements.js), con el contexto de la partida.
        const achievements = [];

        return { reappointed, passed: goals ? reappointed : survived, survived, gameOver: this.gameOver, inBandCount, score, stars, final, minGrowth, bestStreak: this.bestStreak, achievements, checks, avgTrust, avgGrowth };
    }
}

function checkGoal(g, { final, minGrowth, inBandCount, qs }) {
    const pct = v => `${v.toFixed(1)}%`;
    switch (g.type) {
        case 'finalInflationMax': return { label: g.label ?? `Terminar con la inflación en ${g.value}% o menos`, value: pct(final.inflation), ok: final.inflation <= g.value };
        case 'finalInflationMin': return { label: g.label ?? `Evitar la deflación: terminar sobre ${g.value}%`, value: pct(final.inflation), ok: final.inflation >= g.value };
        case 'finalInBand': return { label: 'Terminar con la inflación entre 1% y 3%', value: pct(final.inflation), ok: inBand(final.inflation) };
        case 'minGrowth': return { label: g.label ?? `Que el PBI no caiga por debajo de ${g.value}%`, value: `mínimo ${pct(minGrowth)}`, ok: minGrowth > g.value };
        case 'finalGrowthMin': return { label: g.label ?? `Terminar con el PBI creciendo sobre ${g.value}%`, value: pct(final.growth), ok: final.growth > g.value };
        case 'minCredibility': return { label: g.label ?? `Mantener la credibilidad sobre ${g.value}`, value: `${Math.round(final.credibility)}`, ok: final.credibility > g.value };
        case 'inBandCount': return { label: `Inflación en la meta al menos ${g.value} de ${qs.length} trimestres`, value: `${inBandCount}`, ok: inBandCount >= g.value };
        case 'maxInflation': {
            const peak = Math.max(...qs.map(s => s.inflation));
            return { label: g.label ?? `Que la inflación nunca pase de ${g.value}%`, value: `máximo ${pct(peak)}`, ok: peak <= g.value };
        }
        default: throw new Error(`Meta desconocida: ${g.type}`);
    }
}

/** Titular de prensa según lo más llamativo del turno. */
function headline({ prev, state, move, surprise, surprising }, p) {
    const pct = v => `${v.toFixed(1)}%`;
    if (state.growth < 0) return `La economía se contrae: el PBI cae ${pct(Math.abs(state.growth))}`;
    if (surprising) return `BCR sorprende: ${move > 0 ? 'sube' : 'baja'} la tasa ${Math.round(Math.abs(move) * 100)} puntos básicos`;
    if (surprise && state.inflation > prev.inflation + 0.3) return `${surprise.title}: la inflación salta a ${pct(state.inflation)}`;
    if (state.inflation > p.bandMax && state.inflation > prev.inflation) return `La inflación no cede y llega a ${pct(state.inflation)}`;
    if (state.inflation > p.bandMax) return `La inflación baja a ${pct(state.inflation)}, pero sigue fuera de la meta`;
    if (state.inflation < p.bandMin) return `Precios casi congelados: la inflación cae a ${pct(state.inflation)}`;
    if (prev.inflation > p.bandMax) return `¡La inflación vuelve al rango meta! Se ubica en ${pct(state.inflation)}`;
    if (state.growth > 4.5) return `La economía vuela: crece ${pct(state.growth)}`;
    return `Estabilidad: inflación en ${pct(state.inflation)} y la economía crece ${pct(state.growth)}`;
}
