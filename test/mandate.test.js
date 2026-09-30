import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { QUARTERS } from '../src/game/mandate.js';
import { staffRecommendation } from '../src/model/economy.js';

const SEEDS = 200;

// Tasa de reelección de una estrategia sobre muchas semillas.
function reappointRate(strategy) {
    let won = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
        const m = new Mandate(seed);
        while (!m.isOver) m.decide(Math.max(0.25, strategy(m)));
        if (m.evaluate().reappointed) won++;
    }
    return won / SEEDS;
}

test('la misma semilla produce la misma partida', () => {
    const play = () => {
        const m = new Mandate(42);
        while (!m.isOver) m.decide(staffRecommendation(m.state));
        return m.history.map(h => h.state.inflation.toFixed(4)).join();
    };
    assert.equal(play(), play());
});

test('un mandato completo tiene 12 trimestres', () => {
    const m = new Mandate(7);
    while (!m.isOver) m.decide(staffRecommendation(m.state));
    assert.equal(m.quarter, QUARTERS);
});

test('balance: jugar con criterio gana a menudo, pero no siempre', () => {
    const r = reappointRate(m => staffRecommendation(m.state));
    assert.ok(r > 0.4 && r < 0.85, `staff=${r}`);
});

test('balance: no mover la tasa casi nunca gana', () => {
    assert.ok(reappointRate(m => m.state.rate) < 0.15);
});

test('balance: ceder siempre a la presión política rinde menos que resistir', () => {
    const staff = reappointRate(m => staffRecommendation(m.state));
    const cede = reappointRate(m => m.event.asks === 'bajar' ? m.state.rate - 0.5 : staffRecommendation(m.state));
    assert.ok(cede < staff, `cede=${cede} staff=${staff}`);
});

test('la proyección responde a la tasa elegida', () => {
    const m = new Mandate(3);
    const low = m.projection(m.state.rate - 0.5).at(-1).inflation;
    const high = m.projection(m.state.rate + 0.5).at(-1).inflation;
    assert.ok(high < low);
});

test('el halcón nunca propone una tasa menor que la paloma', () => {
    for (let seed = 1; seed <= 100; seed++) {
        const m = new Mandate(seed);
        while (!m.isOver) {
            const a = m.advisors();
            assert.ok(a.hawk.rate >= a.dove.rate, `seed ${seed} q${m.quarter}: halcón ${a.hawk.rate} < paloma ${a.dove.rate}`);
            m.decide(staffRecommendation(m.state));
        }
    }
});
