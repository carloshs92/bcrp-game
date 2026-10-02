import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate from '../src/game/mandate.js';
import { QUESTIONS, DECLARATIONS, FOLLOW_UP } from '../src/model/congress.js';

// Un Congreso muy molesto: al terminar el turno debería citar al Directorio.
function untilCitation(seed = 1) {
    const m = new Mandate(seed);
    m.decide(m.state.rate);
    m.pressure = 80;
    m.decide(m.state.rate);
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

test('toda pregunta está rotulada como real o recreación, y las recreaciones explican el hecho', () => {
    for (const q of QUESTIONS) {
        assert.ok(['real', 'recreacion'].includes(q.kind), q.id);
        if (q.kind === 'recreacion') assert.ok(q.basis?.length > 20, q.id);
    }
});

test('capítulos: la citación guionada ocurre en su trimestre y solo con preguntas de la época', async () => {
    const { CHAPTER_BY_ID } = await import('../src/model/history.js');
    const ch = CHAPTER_BY_ID['pandemia-2020'];
    const m = new Mandate(1, ch);
    m.decide(1.25); m.decide(0.25);
    assert.equal(m.congress.pending?.id, 'congelar-deudas');
    const ch2 = CHAPTER_BY_ID['inflacion-2022'];
    const m2 = new Mandate(1, ch2);
    assert.equal(m2.congress.pending?.id, 'dolar-sube', 'la citación del dólar abre el capítulo (T3 2021)');
    // Nunca una pregunta posterior al capítulo.
    for (let seed = 1; seed <= 30; seed++) {
        const x = new Mandate(seed, ch2);
        while (!x.isOver) {
            if (x.congress.pending) { assert.ok(x.congress.pending.year <= 2023); x.answerCitation(0); }
            x.decide(x.state.rate + 0.5, 0);
        }
    }
});

test('proyectos de ley: callar deja pasar el proyecto; oponerse lo archiva si el Congreso no está furioso', async () => {
    const { BILLS } = await import('../src/model/congress.js');
    const make = pressure => {
        const m = new Mandate(1);
        m.pressure = pressure;
        m.congress.pendingBill = BILLS.find(b => b.id === 'retiro-afp');
        return m;
    };
    const quiet = make(40).answerBill(2);
    assert.equal(quiet.passed, true);
    const oppose = make(40).answerBill(0);
    assert.equal(oppose.passed, false);
    const insist = make(90).answerBill(0);
    assert.equal(insist.passed, true, 'con el Congreso furioso lo aprueban por insistencia');
    const m = make(40);
    m.answerBill(2);
    assert.ok(m.effects.some(e => e.id === 'retiro-afp'), 'el retiro de las AFP empuja la demanda');
});

test('proyectos de ley: todos traen fuente y el hecho real en que se basan', async () => {
    const { BILLS } = await import('../src/model/congress.js');
    for (const b of BILLS) {
        assert.match(b.source, /^https:\/\//);
        assert.ok(b.basis.length > 30, b.id);
    }
});
