import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate from '../src/game/mandate.js';
import { QUESTIONS, DECLARATIONS, FOLLOW_UP } from '../src/model/congress.js';

// Sube la tasa sin parar hasta que el Congreso cite al Directorio.
function untilCitation(seed = 1) {
    const m = new Mandate(seed);
    while (!m.isOver && !m.congress.pending) m.decide(m.state.rate + 0.75);
    return m;
}

test('anonimato: ninguna frase del Congreso incluye nombres de las personas citadas', () => {
    const names = /Velarde|Quispe|Agüero|Pariona|Morales|Zunini|Verano|Balcázar|Pantoja|Gupioc|Luna|Olivares|Flores Villegas|Chipana/i;
    for (const x of [...QUESTIONS, ...DECLARATIONS, FOLLOW_UP]) {
        assert.ok(!names.test(x.text), x.text);
        assert.match(x.source, /^https:\/\//, 'toda frase real necesita su fuente');
    }
});

test('el Congreso molesto cita al Directorio', () => {
    const m = untilCitation();
    assert.ok(m.congress.pending, 'debería haber una citación pendiente');
    assert.ok(m.pressure >= 65);
});

test('prometer "no subir" calma al Congreso, pero romper la promesa cuesta credibilidad', () => {
    const m = untilCitation();
    const p0 = m.pressure;
    m.answerCitation(1); // promesa
    assert.ok(m.pressure < p0);
    const cred = m.state.credibility;
    const rec = m.decide(m.state.rate + 0.5); // rompe la promesa
    assert.ok(rec.notes.some(n => /Rompiste tu promesa/.test(n.text)));
    assert.ok(m.state.credibility < cred);
    assert.equal(m.congress.promisesBroken, 1);
});

test('cumplir la promesa no castiga', () => {
    const m = untilCitation();
    m.answerCitation(1);
    const rec = m.decide(m.state.rate);
    assert.ok(rec.notes.some(n => /Cumpliste tu palabra/.test(n.text)));
});

test('la respuesta técnica gana credibilidad y molesta más al Congreso', () => {
    const m = untilCitation();
    const { before, after } = m.answerCitation(0);
    assert.ok(after.credibility > before.credibility);
    assert.ok(after.pressure > before.pressure);
});

test('los capítulos históricos no citan con preguntas de otra época', () => {
    for (const q of QUESTIONS) assert.ok(q.year >= 2024);
});
