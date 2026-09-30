import { createState, step, inBand, neutralRate, PARAMS } from '../model/economy.js';
import { EVENTS, EVENT_BY_ID, SURPRISES, SURPRISE_BY_ID } from '../model/events.js';
import { rateMoods, regionMoods } from './people.js';
import { QUESTIONS, ANSWER_EFFECTS, FOLLOW_UP, pickDeclaration } from '../model/congress.js';

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
    noise: 1.6
};

/** Traslado a precios: asimétrico (los precios suben con el dólar más de lo que bajan). */
function passThrough(dep) {
    return FX.passThrough * (dep > 0 ? dep : 0.5 * dep);
}

/** Depreciación esperada (%) sin ruido: la usa la proyección y la mesa de dinero. */
export function expectedDepreciation(pressure, move, sell) {
    return pressure - FX.rateEffect * move - FX.saleEffect * sell;
}
export const DEFAULT_LIMITS = { pressure: 100, credibility: 15, inflation: 7, growth: -3 };

export const FREE_SCENARIO = {
    id: 'libre',
    title: 'Modo libre',
    turns: 12,
    startYear: 2027,
    initial: { rate: 4.25, outputGap: 0.3, core: 2.4, supply: 0.1, expectations: 2.3, credibility: 80 },
    pressure: 20,
    firstEvent: 'consumo-sube',
    randomEvents: true,
    intensityGrowth: 0.3,
    surpriseChance: 0.3,
    citations: true, // el Congreso cita al Directorio cuando está molesto
    fx: { rate: 3.75, reserves: 80 }, // tipo de cambio S/ por US$ y reservas en US$ miles de millones
    reappoint: { minInBand: 9 }
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
        this.minRate = scenario.minRate ?? 0.25;
        this.moves = scenario.moves ?? MOVES;
        this.maxMove = Math.max(...this.moves.map(Math.abs));
        this.gradual = !!scenario.monthlyMeetings;
        // Mercado cambiario (opcional por escenario): tipo de cambio y reservas en US$ miles de millones.
        this.fx = scenario.fx ? { rate: scenario.fx.rate, reserves: scenario.fx.reserves, initialReserves: scenario.fx.reserves, lastDep: 0 } : null;
        this.fxStart = this.fx?.rate ?? null;
        this.state = createState(scenario.initial);
        this.state.growth = this.params.potentialGrowth + this.state.outputGap;
        this.pressure = scenario.pressure ?? 20;
        this.quarter = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.used = new Set();
        this.usedSurprises = new Set();
        this.scheduled = null;
        this.calmCount = 0;
        this.gameOver = null;
        this.stats = { resisted: 0, ceded: 0, bigMoves: 0, surprises: 0 };
        this.tools = (scenario.tools ?? []).map(t => ({ ...t, left: t.uses ?? 1 }));
        this.effects = []; // efectos de herramientas que duran varios turnos
        this.peopleHistory = []; // ánimo de cada sector, turno a turno
        this.regionHistory = []; // ánimo de cada departamento, turno a turno
        this.history = [{ state: this.state, rate: this.state.rate, pressure: this.pressure, label: 'Inicio', fx: scenario.fx?.rate ?? null, reserves: scenario.fx?.reserves ?? null }];
        // El Congreso usa su propio azar para no alterar la secuencia de choques (y la calibración).
        this.crng = mulberry32((seed ^ 0x5bd1e995) >>> 0);
        // Y el dólar, otro: se consume exactamente una vez por turno, decida lo que decida el jugador.
        this.fxRng = mulberry32((seed ^ 0x27d4eb2f) >>> 0);
        this.year = Number(String(scenario.year ?? scenario.startYear ?? 2027).match(/\d{4}(?!.*\d{4})/)?.[0] ?? 2027);
        this.congress = { lastCitation: -99, promise: null, pending: null, used: new Set(), citations: 0, promisesBroken: 0 };
        this.event = this.drawEvent();
    }

    get isOver() {
        return !!this.gameOver || this.quarter >= this.turns;
    }

    label(q = this.quarter) {
        return this.scenario.labels?.[q] ?? quarterLabel(q, this.scenario.startYear);
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
        const year = Math.min(2, Math.floor(this.quarter / 4));
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

    /** Presión sobre el dólar de este turno según el evento (sin imprevistos). */
    fxPressure() {
        return this.event.fx ?? 0;
    }

    /** Cuánto se puede vender sin bajar del piso de reservas (30% del nivel inicial). */
    maxSale() {
        return this.fx ? Math.max(0, this.fx.reserves - 0.3 * this.fx.initialReserves) : 0;
    }

    projection(rate, sell = 0) {
        let extra = this.toolShock();
        if (this.fx) {
            const dep = expectedDepreciation(this.fxPressure(), rate - this.state.rate, sell);
            extra = addShock(extra, { supply: passThrough(dep), demand: -FX.balanceSheet * Math.max(0, dep) });
        }
        return projectPath(this.state, rate, this.event, 4, this.params, this.steps, extra, this.gradual);
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

    decide(newRate, sell = 0) {
        newRate = Math.max(this.minRate, newRate);
        if (!this.fx) sell = 0;
        sell = Math.min(sell, this.maxSale());
        const prev = this.state;
        const prevPressure = this.pressure;
        const event = this.event;
        const move = newRate - prev.rate;
        const notes = [];
        const surprise = this.drawSurprise();
        if (surprise) this.stats.surprises += 1;

        // Los choques pegan más fuerte a medida que avanza el mandato (solo modo libre).
        const intensity = 1 + (this.scenario.intensityGrowth ?? 0) * Math.floor(this.quarter / 4);
        let total = addShock(addShock(scaleShock(event.shock, intensity), surprise?.shock), this.toolShock());
        // Mercado cambiario: se resuelve antes que los precios, porque el dólar se traslada a la inflación.
        let fxRecord = null;
        if (this.fx) {
            const pressure = (event.fx ?? 0) + (surprise?.fx ?? 0);
            const dep = expectedDepreciation(pressure, move, sell) + (this.fxRng() - 0.5) * FX.noise;
            const before = { ...this.fx };
            this.fx.rate *= 1 + dep / 100;
            this.fx.reserves = Math.max(0, this.fx.reserves - sell);
            this.fx.lastDep = dep;
            total = addShock(total, { supply: passThrough(dep), demand: -FX.balanceSheet * Math.max(0, dep), credibility: dep > 4 ? -2 : 0 });
            fxRecord = { before, rate: this.fx.rate, reserves: this.fx.reserves, dep, sell, pressure };
        }
        const base = splitShock(total, this.steps);

        // Varios meses con la misma tasa, más ruido: el futuro nunca sale igual a la proyección.
        let s = prev;
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
        this.effects = this.effects.map(e => ({ ...e, turnsLeft: e.turnsLeft - 1 })).filter(e => e.turnsLeft > 0);

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

        // Presión política: se disipa sola, las alzas son impopulares y los pedidos ignorados pesan.
        const hikeCost = this.scenario.hikePressure ?? 4; // presión por cada 25 pb de alza
        let pressure = this.pressure - 4 + Math.max(0, move) / 0.25 * hikeCost - Math.max(0, -move) / 0.25 * 2;
        pressure += surprise?.pressure ?? 0;
        if (event.asks === 'bajar') {
            if (move > 0) {
                pressure += event.pressure * 1.5;
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
        if (Math.abs(move) / (this.gradual ? this.steps : 1) > this.params.bigMove) this.stats.bigMoves += 1;
        this.pressure = clamp(pressure, 0, 100);

        this.state = s;
        const ok = inBand(s.inflation);
        this.streak = ok ? this.streak + 1 : 0;
        this.bestStreak = Math.max(this.bestStreak, this.streak);

        const label = this.label();
        if (this.fx) {
            const share = this.fx.reserves / this.fx.initialReserves;
            if (share < 0.5) {
                s = { ...s, credibility: Math.max(0, s.credibility - 3) };
                notes.push({ tone: 'bad', text: `Las reservas bajaron a US$ ${this.fx.reserves.toFixed(1)} mil millones. Los mercados temen que el BCR ya no pueda defender al sol.` });
            }
            if (fxRecord.dep > 4) notes.push({ tone: 'warn', text: `El dólar subió ${fxRecord.dep.toFixed(1)}% en el trimestre: quienes deben en dólares pagan más soles y lo importado se encarece.` });
        }
        const record = {
            quarter: this.quarter, label, event, surprise, prev, state: s,
            rate: newRate, move, drivers, notes,
            pressure: this.pressure, prevPressure,
            projected: projectPath(prev, newRate, event, 1, this.params, this.steps, {}, this.gradual)[0].inflation,
            streak: this.streak,
            real: this.scenario.realPath ? {
                rate: this.scenario.realPath.rate[this.quarter],
                inflation: this.scenario.realPath.inflation[this.quarter]
            } : null
        };
        record.fx = fxRecord;
        record.people = rateMoods(record, this.params.potentialGrowth);
        this.peopleHistory.push(record.people);
        const fxTags = fxRecord ? (fxRecord.dep > 3 ? ['dolar'] : fxRecord.dep < -3 ? ['sol-fuerte'] : []) : [];
        record.regions = regionMoods({ state: s, move, tags: [...new Set([...(event.tags ?? []), ...(surprise?.tags ?? []), ...fxTags])] });
        this.regionHistory.push(record.regions);
        record.declaration = this.reference ? null : pickDeclaration({ move, pressure: this.pressure, year: this.year, rng: this.crng });
        record.headline = headline({ ...record, surprising: Math.abs(move) / (this.gradual ? this.steps : 1) > this.params.bigMove }, this.params);
        this.history.push({ state: s, rate: newRate, pressure: this.pressure, label, fx: this.fx?.rate ?? null, reserves: this.fx?.reserves ?? null });

        const L = this.limits;
        if (this.pressure >= L.pressure) this.gameOver = 'presion';
        else if (s.credibility <= L.credibility) this.gameOver = 'credibilidad';
        else if (s.inflation >= L.inflation) this.gameOver = 'inflacion';
        else if (s.growth <= L.growth) this.gameOver = 'recesion';

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
        if (!this.scenario.citations || this.pressure < 65 || this.quarter - c.lastCitation < 3) return;
        // Solo preguntas de la época del escenario (sin anacronismos).
        const [from, to] = this.scenario.citationYears ?? [0, this.year];
        const pool = QUESTIONS.filter(q => !c.used.has(q.id) && q.year >= from && q.year <= to);
        if (!pool.length) return;
        const q = pool[Math.floor(this.crng() * pool.length)];
        c.used.add(q.id);
        c.lastCitation = this.quarter;
        c.pending = q;
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
            reappointed = survived && inBandCount >= this.scenario.reappoint.minInBand && inBand(final.inflation);
            score = survived ? Math.max(0, Math.round(100 - 12 * inflationLoss - 8 * growthLoss)) : 0;
        }
        const stars = !reappointed ? 0 : goals && this.scenario.realPath
            ? (score >= 100 ? 3 : score >= 75 ? 2 : 1)
            : (score >= 85 ? 3 : score >= 65 ? 2 : 1);

        const achievements = [];
        if (!goals) {
            if (reappointed && final.growth >= 2) achievements.push({ id: 'aterrizaje', name: 'Aterrizaje suave', text: 'Terminaste en la meta con la economía creciendo sobre 2%.' });
            if (this.bestStreak >= 6) achievements.push({ id: 'racha', name: 'Racha de estabilidad', text: `${this.bestStreak} trimestres seguidos en la meta.` });
            if (survived && this.stats.resisted >= 2 && this.stats.ceded === 0) achievements.push({ id: 'autonomo', name: 'Autonomía', text: 'Resististe la presión política sin ceder.' });
            if (survived && this.stats.bigMoves === 0) achievements.push({ id: 'gradual', name: 'Mano firme', text: 'Nunca moviste la tasa más de 50 pb de golpe.' });
            if (this.used.has('nino-golpe') && survived && inBand(final.inflation)) achievements.push({ id: 'nino', name: 'Sobreviviste a El Niño', text: 'Superaste un choque de oferta sin perder el rumbo.' });
            if (survived && this.stats.surprises >= 3) achievements.push({ id: 'imprevistos', name: 'Nervios de acero', text: `Sobreviviste a ${this.stats.surprises} imprevistos.` });
        }

        return { reappointed, passed: reappointed, survived, gameOver: this.gameOver, inBandCount, score, stars, final, minGrowth, bestStreak: this.bestStreak, achievements, checks };
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
