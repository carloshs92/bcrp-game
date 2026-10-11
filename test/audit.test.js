import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO, SILENCE } from '../src/game/mandate.js';
import { archetypeId } from '../src/game/endings.js';
import { staffRecommendation } from '../src/model/economy.js';

// Auditoría del 8 de octubre: ningún botón fijo gana siempre y el final retrata el estilo.
const N = 150;
function play(strategy, scenario = FREE_SCENARIO) {
    const out = [];
    for (let seed = 1; seed <= N; seed++) {
        const m = new Mandate(seed, scenario);
        while (!m.isOver) {
            if (m.congress.pending) m.answerCitation(0);
            if (m.congress.pendingBill) m.answerBill(1);
            m.decide(Math.max(0.25, strategy(m)));
        }
        out.push({ m, r: m.evaluate() });
    }
    return out;
}
const winRate = runs => runs.filter(x => x.r.reappointed).length / runs.length;
const hawk = m => m.advisors().hawk.rate;
const dove = m => m.advisors().dove.rate;
const staff = m => staffRecommendation(m.state);

test('balance: seguir siempre al halcón ya no es la estrategia ganadora', () => {
    const h = winRate(play(hawk)), s = winRate(play(staff));
    assert.ok(h <= 0.45, `halcón ${h}`);
    assert.ok(h < s, `halcón ${h} vs staff ${s}`);
});

test('balance: ninguna estrategia fija pasa de 50%', () => {
    for (const [name, f] of Object.entries({ hawk, dove, staff, wait: m => m.state.rate })) {
        const w = winRate(play(f));
        assert.ok(w <= 0.5, `${name} ${w}`);
    }
});

test('arquetipo: retrata el estilo (halcón, paloma, esperar)', () => {
    const share = (runs, id) => runs.filter(x => archetypeId(x.m) === id).length / runs.length;
    assert.ok(share(play(hawk), 'halcon') >= 0.9);
    assert.ok(share(play(dove), 'paloma') >= 0.9);
    assert.ok(share(play(m => m.state.rate), 'paloma') >= 0.9, 'no hacer nada también es una postura');
});

test('reloj: quedarse callado cuesta más que esperar a propósito', () => {
    const a = new Mandate(9, { ...FREE_SCENARIO, board: false });
    const b = new Mandate(9, { ...FREE_SCENARIO, board: false });
    for (const m of [a, b]) { m.congress.pending = null; m.congress.pendingBill = null; }
    const waited = a.decide(a.state.rate);
    const silent = b.decide(b.state.rate, 0, 'halcon', null, { timeout: true });
    assert.equal(silent.tone, 'neutral', 'sin decisión no hay comunicado');
    assert.ok(silent.state.credibility <= waited.state.credibility - SILENCE.credibility + 0.5);
    assert.match(silent.headline, /mudo/);
});
