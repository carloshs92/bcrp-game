/**
 * Cola de cartas del turno (Game Design): qué carta toca mostrar ahora, en orden de prioridad.
 * Módulo puro: solo lee el estado del motor y arma respuestas con `buildResponses`.
 *
 * Una carta: { type: 'consequence' | 'citation' | 'bill' | 'shock' | 'crisis' | 'climax', … }
 * - 'consequence': { type, card, respond() } — una sola respuesta, "Seguir".
 * - 'citation': { type, question, responses: [{ id, label, text, style, respond(i) }] }
 * - 'bill': { type, bill, responses: [...] }
 * - 'shock' / 'crisis' / 'climax': { type, event, responses: buildResponses(m) }
 */
import { buildResponses } from './responses.js';
import { BILL_RESPONSES } from '../model/congress.js';

/** La carta que toca mostrar ahora. Se vuelve a llamar tras resolver cada carta especial. */
export function nextCard(m) {
    if (m.consequences.length) {
        const card = m.consequences[0];
        return { type: 'consequence', card, respond: () => { m.ackConsequence(); } };
    }
    if (m.congress.pending) {
        const q = m.congress.pending;
        return {
            type: 'citation',
            question: q,
            responses: q.answers.map((a, i) => ({ id: `ans-${i}`, label: a.style, text: a.text, style: a.style, respond: () => m.answerCitation(i) }))
        };
    }
    if (m.congress.pendingBill) {
        const bill = m.congress.pendingBill;
        return {
            type: 'bill',
            bill,
            responses: BILL_RESPONSES.map((r, i) => ({ id: `bill-${i}`, label: r.label, text: r.text, style: r.style, respond: () => m.answerBill(i) }))
        };
    }
    const event = m.event;
    const isClimax = m.scenario.climax?.turn === m.quarter;
    const type = isClimax ? 'climax' : event?.midterm ? 'crisis' : 'shock';
    return { type, event, responses: buildResponses(m) };
}
