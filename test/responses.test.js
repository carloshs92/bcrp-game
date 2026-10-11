import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO } from '../src/game/mandate.js';
import { buildResponses, previewResponse, applyResponse } from '../src/game/responses.js';
import { planIsValid } from '../src/game/actions.js';

function freshMandate(seed = 1, scenario = FREE_SCENARIO) {
    const m = new Mandate(seed, scenario);
    m.congress.pending = null;
    m.congress.pendingBill = null;
    return m;
}

test('respuestas: siempre hay entre 2 y 4, y "esperar" está presente', () => {
    for (let seed = 1; seed <= 30; seed++) {
        const m = freshMandate(seed);
        const responses = buildResponses(m);
        assert.ok(responses.length >= 2 && responses.length <= 4, `seed ${seed}: ${responses.length} respuestas`);
        assert.ok(responses.some(r => r.id === 'esperar'), `seed ${seed}: falta esperar`);
    }
});

test('respuestas: ningún plan viola el límite de 2 acciones', () => {
    for (let seed = 1; seed <= 30; seed++) {
        const m = freshMandate(seed);
        for (const r of buildResponses(m)) {
            assert.ok(planIsValid(r.plan), `seed ${seed}, ${r.id}: plan inválido`);
        }
    }
});

test('respuestas: apretar ≥ medido ≥ dar aire (en movimiento de tasa)', () => {
    for (let seed = 1; seed <= 30; seed++) {
        const m = freshMandate(seed);
        const byId = Object.fromEntries(buildResponses(m).map(r => [r.id, r]));
        if (byId.apretar && byId.medido) assert.ok(byId.apretar.plan.move >= byId.medido.plan.move, `seed ${seed}`);
        if (byId.medido && byId.aire) assert.ok(byId.medido.plan.move >= byId.aire.plan.move, `seed ${seed}`);
    }
});

test('respuestas: con presión cambiaria y reservas, "defender" reemplaza a "dar aire"', () => {
    let foundDefend = false, foundAire = false;
    for (let seed = 1; seed <= 30; seed++) {
        const m = freshMandate(seed);
        for (let t = 0; t < 12 && !m.isOver; t++) {
            m.congress.pending = null;
            m.congress.pendingBill = null;
            if (m.fx) {
                const fxPressure = m.eventFx(m.event);
                const canSell = m.maxSale() >= 1.5;
                const ids = buildResponses(m).map(r => r.id);
                if (fxPressure >= 2 && canSell) {
                    assert.ok(ids.includes('defender'), `seed ${seed} mes ${t}: esperaba defender`);
                    assert.ok(!ids.includes('aire'), `seed ${seed} mes ${t}: no debería tener aire`);
                    foundDefend = true;
                } else {
                    foundAire = foundAire || ids.includes('aire');
                }
            }
            m.decide(m.state.rate);
        }
    }
    assert.ok(foundDefend, 'nunca apareció "defender" en 30 semillas');
    assert.ok(foundAire, 'nunca apareció "aire" en 30 semillas');
});

test('vista previa: incluye rango de inflación, caras del elenco y costos', () => {
    const m = freshMandate(5);
    const responses = buildResponses(m);
    const apretar = responses.find(r => r.id === 'apretar');
    const preview = previewResponse(m, apretar.plan);
    assert.ok(typeof preview.inflation.lo === 'number' && typeof preview.inflation.hi === 'number');
    assert.ok(preview.inflation.hi >= preview.inflation.lo);
    assert.ok(typeof preview.faces === 'object');
    assert.ok(Array.isArray(preview.costs) && preview.costs.length <= 2);
});

test('vista previa: apretar fuerte nunca proyecta menos inflación que esperar', () => {
    for (let seed = 1; seed <= 20; seed++) {
        const m = freshMandate(seed);
        const responses = buildResponses(m);
        const apretar = responses.find(r => r.id === 'apretar');
        const esperar = responses.find(r => r.id === 'esperar');
        if (!apretar) continue;
        const pA = previewResponse(m, apretar.plan);
        const pE = previewResponse(m, esperar.plan);
        assert.ok(pA.inflation.hi <= pE.inflation.hi + 1e-6, `seed ${seed}: apretar no debería proyectar más inflación que esperar`);
    }
});

test('aplicar una respuesta llama al motor y devuelve un registro válido', () => {
    const m = freshMandate(7);
    const before = m.state.rate;
    const responses = buildResponses(m);
    const medido = responses.find(r => r.id === 'medido');
    const rec = applyResponse(m, medido);
    assert.ok(rec);
    assert.equal(rec.rate, before + medido.plan.move);
});

test('balance: ninguna respuesta fija gana más de 50%, y "esperar" gana menos de 10%', () => {
    const N = 300;
    const strategies = ['apretar', 'medido', 'aire', 'esperar'];
    const wins = Object.fromEntries(strategies.map(id => [id, 0]));
    for (let seed = 1; seed <= N; seed++) {
        for (const id of strategies) {
            const m = new Mandate(seed, FREE_SCENARIO);
            while (!m.isOver) {
                if (m.congress.pending) m.answerCitation(0);
                if (m.congress.pendingBill) m.answerBill(1);
                const responses = buildResponses(m);
                const r = responses.find(x => x.id === id) ?? responses.find(x => x.id === 'medido') ?? responses[0];
                applyResponse(m, r);
            }
            if (m.evaluate().reappointed) wins[id] += 1;
        }
    }
    for (const id of strategies) {
        const rate = wins[id] / N;
        assert.ok(rate <= 0.5, `${id} gana ${(rate * 100).toFixed(0)}%, debería ser ≤ 50%`);
    }
    assert.ok(wins.esperar / N < 0.1, `esperar gana ${(wins.esperar / N * 100).toFixed(0)}%, debería ser < 10%`);
});
