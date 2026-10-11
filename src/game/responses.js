/**
 * Respuestas del turno (Game Design): en vez de elegir un número entre siete, el jugador elige una
 * respuesta con nombre humano. Cada una empaqueta un plan completo (tasa, dólares, discurso,
 * herramienta) que ya respeta el límite de 2 acciones. Módulo puro: sin DOM, sin azar propio.
 *
 * Una respuesta: { id, label, sub, plan: { move, sell, tone, tool }, preview }
 * `preview`: { inflation: { lo, hi }, faces, costs, noMajority }
 */
import { staffRecommendation } from '../model/economy.js';
import { planIsValid } from './actions.js';
import { CONGRESS } from './mandate.js';

const round = v => Math.round(v * 100) / 100;

/** Ajusta un movimiento a los botones de tasa disponibles y al piso de la tasa mínima. */
function snapMove(m, move) {
    const target = m.state.rate + move;
    const snapped = m.moves.reduce((best, x) => Math.abs(x - move) < Math.abs(best - move) ? x : best, m.moves[0]);
    return Math.max(m.minRate - m.state.rate, snapped);
}

/** El movimiento que recomienda el equipo técnico, ajustado a los botones y al piso. */
function staffMove(m) {
    const ideal = staffRecommendation(m.state) - m.state.rate;
    return snapMove(m, ideal);
}

const SUB = {
    apretar: move => `Sube ${Math.round(Math.abs(move) * 100)} pb y discurso firme`,
    medido: move => move === 0 ? 'Mantiene la tasa' : `${move > 0 ? 'Sube' : 'Baja'} ${Math.round(Math.abs(move) * 100)} pb, paso a paso`,
    aire: move => `Baja ${Math.round(Math.abs(move) * 100)} pb y discurso calmado`,
    defender: () => 'Mantiene la tasa y vende US$ 1.5 mil M',
    esperar: () => 'No toca nada este mes'
};

/**
 * Respuestas disponibles este turno (2 a 4), siempre con "Esperar" incluida.
 * Determinista: misma llamada, mismo resultado.
 */
export function buildResponses(m) {
    const s = m.state;
    const adv = m.advisors();
    const hawkMove = snapMove(m, adv.hawk.move);
    const doveMove = snapMove(m, adv.dove.move);
    const medidoMove = staffMove(m);

    const out = [];
    const seen = new Set(); // evita respuestas duplicadas (mismo move+sell+tone)
    const tone = id => m.guidanceOn ? id : 'neutral';
    const key = (move, sell, t) => `${round(move)}|${round(sell)}|${t}`;

    const push = (id, label, move, sell, toneId, extra = {}) => {
        const plan = { move: round(move), sell: round(sell), tone: tone(toneId), tool: null };
        if (!planIsValid(plan)) return;
        const k = key(plan.move, plan.sell, plan.tone);
        if (seen.has(k)) return;
        seen.add(k);
        out.push({ id, label, sub: SUB[id](plan.move), plan, ...extra });
    };

    push('apretar', 'Apretar fuerte', hawkMove, 0, 'halcon');
    push('medido', m.event?.kind === 'oferta' && medidoMove <= 0.25 ? 'Mirar más allá del choque' : 'Paso medido', medidoMove, 0, 'neutral');

    // "Dar aire" se reemplaza por "Defender el sol" si hay presión cambiaria y reservas para vender.
    const fxPressure = m.eventFx ? m.eventFx(m.event) : 0;
    const canDefend = !!m.fx && fxPressure >= 2 && m.maxSale() >= 1.5;
    if (canDefend) {
        push('defender', 'Defender el sol', medidoMove, 1.5, 'neutral');
    } else {
        push('aire', 'Dar aire', doveMove, 0, 'paloma');
    }

    push('esperar', 'Esperar', 0, 0, 'neutral');

    // Mínimo 2, máximo 4 (si algo colisionó, "esperar" siempre entra al final por su propio key).
    return out.slice(0, 4);
}

/** Ánimo de una cara del elenco ante un plan (−2 a 2). Señal simple, no un cálculo fino. */
function faceFor(id, m, plan, proj) {
    const hi = proj.at(-1)?.hi ?? 0;
    const center = proj.at(-1)?.inflation ?? m.state.inflation;
    if (id === 'rosa') {
        if (hi > 4) return -2;
        if (hi > 3) return -1;
        if (center < m.state.inflation && m.state.inflation > 2.5) return 1;
        return 0;
    }
    if (id === 'kevin') {
        if (plan.move >= 0.5) return -2;
        if (plan.move > 0) return -1;
        if (plan.move < 0) return 1;
        return 0;
    }
    if (id === 'valeria') {
        if (!m.fx) return null;
        if (plan.sell > 0) return -1;
        if (plan.sell < 0) return 1;
        return 0;
    }
    if (id === 'congresista') {
        if (plan.move > 0) return m.event?.asks === 'bajar' ? -2 : -1;
        if (plan.move < 0) return 1;
        return 0;
    }
    return 0;
}

/** Hasta 2 frases de costo, en orden de prioridad. */
function costsFor(m, plan) {
    const costs = [];
    if (plan.move > 0) {
        const hikeCost = m.scenario.hikePressure ?? 4;
        let pts = Math.round(plan.move / 0.25) * hikeCost;
        if (m.event?.asks === 'bajar') pts += Math.round((m.event.pressure ?? 0) * CONGRESS.askWeight);
        if (pts > 0) costs.push(`Congreso +${pts} de enojo`);
    }
    if (plan.sell > 0) costs.push(`Reservas −US$ ${plan.sell} mil M`);
    if (plan.tone === 'halcon') costs.push('Te compromete a no bajar el próximo mes');
    else if (plan.tone === 'paloma') costs.push('Te compromete a no subir el próximo mes');
    if (costs.length === 0 && plan.move === 0 && plan.sell === 0 && plan.tone === 'neutral') costs.push('La carta sigue golpeando');
    return costs.slice(0, 2);
}

/** Vista previa de un plan: rango de inflación, caras del elenco y costos. */
export function previewResponse(m, plan) {
    const rate = m.state.rate + plan.move;
    const proj = m.projection(rate, plan.sell, plan.tone, plan.tool);
    const last = proj.at(-1) ?? { lo: m.state.inflation, hi: m.state.inflation };

    const faces = {};
    for (const id of ['rosa', 'kevin', 'valeria', 'congresista']) {
        const v = faceFor(id, m, plan, proj);
        if (v !== null) faces[id] = v;
    }

    let noMajority = false;
    if (m.scenario.board && Math.abs(plan.move) > 1e-9) {
        const vote = m.boardVote(plan.move);
        noMajority = !vote.passes;
    }

    return { inflation: { lo: last.lo, hi: last.hi }, faces, costs: costsFor(m, plan), noMajority };
}

/** Aplica una respuesta al motor (o el silencio del reloj si se acabó el tiempo). */
export function applyResponse(m, response, { timeout = false } = {}) {
    const plan = response.plan;
    const rate = m.state.rate + plan.move;
    return m.decide(rate, plan.sell, plan.tone, plan.tool, { timeout });
}
