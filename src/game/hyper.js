/**
 * Capítulo 1990: fin de la hiperinflación. Aquí el instrumento no es la tasa de interés
 * sino cuánto dinero emite el banco central para financiar al Tesoro.
 *
 * Modelo mensual simplificado: la inflación del mes combina la inercia (que se rompe
 * cuando crece la credibilidad) con la emisión. El Fujishock de agosto fue un salto
 * único de precios relativos (397%); la inflación "de fondo" antes del shock rondaba 40%-60%.
 */

import { hyperMoods, regionMoods } from './people.js';

export const HYPER_CHOICES = [
    {
        id: 'imprimir', name: 'Imprimir para pagar al Estado', emission: 30, social: -8, credibility: -14, activity: 0.8,
        text: 'El BCR emite para que el Tesoro pague sueldos y deudas. Alivia hoy, pero echa más leña a la inflación.',
        win: 'Trabajadores del Estado (cobran este mes).', lose: 'Todos los demás: la inflación se come los sueldos y los ahorros, sobre todo de los más pobres.'
    },
    {
        id: 'mitad', name: 'Financiar solo la mitad', emission: 12, social: 3, credibility: -3, activity: 0,
        text: 'Un punto medio: menos emisión, pero la gente sigue sin creer que la inflación vaya a parar.',
        win: 'Nadie gana del todo: se reparte el sacrificio.', lose: 'La inflación sigue alta y castiga a quienes no pueden protegerse.'
    },
    {
        id: 'caja', name: 'Comité de Caja: no emitir', emission: 2, social: 11, credibility: 14, activity: -1.2,
        text: 'El Estado solo gasta lo que recauda. Duro para los sueldos y la actividad, pero corta la raíz de la inflación.',
        win: 'Ahorristas y, en unos meses, todos: los precios dejan de volar.', lose: 'Trabajadores del Estado y las familias pobres cargan el ajuste hoy: sueldos atrasados y menos gasto público.'
    }
];

export const HYPER_TOOL = {
    id: 'pcs', name: 'Programa de Compensación Social', uses: 1,
    desc: 'Apoyo a comedores populares y al Vaso de Leche, financiado con presupuesto y ayuda internacional, no con emisión. En la historia real llegó tarde: tú puedes activarlo a tiempo.',
    social: -22
};

const EVENTS = [
    { who: 'caserita', title: 'Los precios se quedaron arriba', quote: 'Después del paquetazo todo cuesta treinta veces más. Con mi sueldo compro una bolsa de arroz y se acabó.', infl: 0, social: 4 },
    { tags: ['sueldos-'], who: 'ministro', title: 'El Tesoro no tiene para los sueldos', quote: 'Tenemos que pagar a maestros y policías. Si el BCR no nos presta, ¿de dónde saco la plata?', infl: 0, social: 0, asks: 'imprimir' },
    { who: 'cambista', title: 'Los cambistas de Ocoña suben el dólar', quote: '¡Dólar, dólar! La gente no confía en el inti y cambia todo lo que puede, jefe.', infl: 3, social: 2 },
    { who: 'caserita', title: 'Llegan las fiestas de fin de año', quote: 'Con las gratificaciones la gente sale a comprar y los comerciantes aprovechan para remarcar.', infl: 7, social: 0 },
    { who: 'prensa', title: 'Se aprueba la ley del Nuevo Sol', quote: 'La Ley 25295 crea el Nuevo Sol: un millón de intis. Empezará a circular en julio.', infl: 0, social: -3, credibility: 6 },
    { who: 'analista', title: 'La economía empieza a ordenarse', quote: 'Los precios se mueven menos que antes. Si esto sigue, volveremos a planificar a más de una semana.', infl: 0, social: 0 }
];

// Imprevisto guionado: la epidemia de cólera que empezó a inicios de 1991.
const SURPRISES = {
    5: { tags: ['colera'], who: 'prensa', title: 'Epidemia de cólera', text: 'Se reportan casos de cólera en la costa. Caen las exportaciones de pescado y crece la angustia en los barrios.', infl: 1, social: 8, activity: -0.8 }
};

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

export default class HyperChapter {
    constructor(chapter, seed = Date.now()) {
        this.chapter = chapter;
        this.rng = mulberry32(seed);
        this.turns = chapter.labels.length;
        this.month = 0;
        // Agosto de 1990: el mes del Fujishock.
        this.state = { inflation: 396.98, core: 45, credibility: 12, social: 45, activity: -5 };
        this.history = [{ state: this.state, label: 'Ago 1990', choice: null }];
        this.toolLeft = HYPER_TOOL.uses;
        this.toolUsedThisTurn = false;
        this.peopleHistory = [];
        this.regionHistory = [];
        this.gameOver = null;
    }

    get isOver() {
        return !!this.gameOver || this.month >= this.turns;
    }

    get event() {
        return EVENTS[this.month];
    }

    label(m = this.month) {
        return this.chapter.labels[m];
    }

    labels() {
        return ['Ago 1990', ...this.chapter.labels];
    }

    /** Inflación esperada del próximo mes con una opción (sin imprevistos ni ruido). */
    project(choiceId) {
        return this.next(this.state, HYPER_CHOICES.find(c => c.id === choiceId), this.event, null, 0).inflation;
    }

    next(s, choice, event, surprise, noise) {
        const credibility = clamp(s.credibility + choice.credibility + (event.credibility ?? 0), 0, 100);
        // Con más credibilidad, la gente deja de indexar sus precios a la inflación pasada.
        const inertia = 0.55 - 0.4 * credibility / 100;
        const inflation = Math.max(0.5, s.core * inertia + 1.1 * choice.emission + event.infl + (surprise?.infl ?? 0) + noise);
        return {
            inflation,
            core: inflation,
            credibility,
            social: clamp(s.social - 3 + choice.social + event.social + (surprise?.social ?? 0), 0, 100),
            activity: clamp(s.activity + choice.activity + 0.6 + (surprise?.activity ?? 0), -15, 8)
        };
    }

    useTool() {
        if (this.toolLeft <= 0) return false;
        this.toolLeft -= 1;
        this.toolUsedThisTurn = true;
        this.state = { ...this.state, social: clamp(this.state.social + HYPER_TOOL.social, 0, 100) };
        return true;
    }

    decide(choiceId) {
        const choice = HYPER_CHOICES.find(c => c.id === choiceId);
        const event = this.event;
        const surprise = SURPRISES[this.month] ?? null;
        const prev = this.state;
        const projected = this.project(choiceId);
        const noise = (this.rng() - 0.5) * 4;
        const state = this.next(prev, choice, event, surprise, noise);
        const notes = [];
        if (event.asks === 'imprimir' && choiceId === 'caja') notes.push({ tone: 'warn', text: 'Le dijiste que no al ministro: el Tesoro tendrá que ajustarse. La tensión social sube.' });
        if (choiceId === 'imprimir') notes.push({ tone: 'bad', text: 'Emitir para financiar al Estado fue justamente lo que causó la hiperinflación.' });

        const label = this.label();
        const record = {
            month: this.month, label, choice, event, surprise, prev, state, projected, notes,
            real: this.chapter.realMonthly[this.month], headline: hyperHeadline(prev, state, choice)
        };
        record.people = hyperMoods({ state, choice, toolUsed: this.toolUsedThisTurn });
        this.peopleHistory.push(record.people);
        record.regions = regionMoods({
            state: { activity: state.activity, growth: state.activity },
            tags: [...(event.tags ?? []), ...(surprise?.tags ?? [])],
            monthlyInflation: state.inflation
        });
        this.regionHistory.push(record.regions);
        this.toolUsedThisTurn = false;
        this.state = state;
        this.history.push({ state, label, choice: choiceId });

        if (state.social >= 100) this.gameOver = 'estallido';
        else if (this.month >= 1 && state.inflation >= 60) this.gameOver = 'hiper';

        this.month += 1;
        return record;
    }

    evaluate() {
        const final = this.state;
        const checks = [
            { label: 'Bajar la inflación mensual a 10% o menos', value: `${final.inflation.toFixed(1)}%`, ok: final.inflation <= 10 },
            { label: 'Evitar un estallido social (tensión bajo 100)', value: `${Math.round(final.social)}`, ok: final.social < 100 },
            { label: 'Recuperar la confianza (credibilidad sobre 50)', value: `${Math.round(final.credibility)}`, ok: final.credibility > 50 }
        ];
        const passed = !this.gameOver && checks.every(c => c.ok);
        const avgInfl = this.history.slice(1).reduce((a, h) => a + h.state.inflation, 0) / Math.max(1, this.history.length - 1);
        const score = passed ? Math.max(0, Math.round(100 - 1.5 * avgInfl)) : 0;
        const stars = !passed ? 0 : score >= 80 ? 3 : score >= 65 ? 2 : 1;
        return { passed, reappointed: passed, survived: !this.gameOver, gameOver: this.gameOver, checks, score, stars, final };
    }
}

function hyperHeadline(prev, s, choice) {
    const pct = v => `${v.toFixed(1)}%`;
    if (s.inflation >= 60) return `¡Vuelve la hiperinflación! Los precios suben ${pct(s.inflation)} en un mes`;
    if (s.social >= 85) return 'Paros y marchas en Lima: la tensión social está al límite';
    if (choice.id === 'caja' && s.inflation < prev.inflation) return `El Comité de Caja funciona: la inflación del mes baja a ${pct(s.inflation)}`;
    if (s.inflation > prev.inflation) return `La inflación rebota: ${pct(s.inflation)} en el mes`;
    return `La inflación mensual se modera a ${pct(s.inflation)}`;
}
