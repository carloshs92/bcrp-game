import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate from '../src/game/mandate.js';
import { isoWeek, challengeScenario } from '../src/game/challenge.js';

test('reto: la semana ISO es correcta en los bordes del año', () => {
    assert.deepEqual(isoWeek(new Date(2026, 0, 1)), { year: 2026, week: 1, seed: 202601 });
    assert.equal(isoWeek(new Date(2026, 9, 7)).week, 41);
    assert.deepEqual(isoWeek(new Date(2027, 0, 1)), { year: 2026, week: 53, seed: 202653 });
});

test('reto: la misma semana produce exactamente la misma partida', () => {
    const { seed } = isoWeek(new Date(2026, 9, 7));
    const a = new Mandate(seed, challengeScenario());
    const b = new Mandate(seed, challengeScenario());
    for (let i = 0; i < 6; i++) {
        assert.equal(a.event.id, b.event.id);
        a.congress.pending = b.congress.pending = null;
        a.congress.pendingBill = b.congress.pendingBill = null;
        const ra = a.decide(a.state.rate), rb = b.decide(b.state.rate);
        assert.equal(ra.state.inflation, rb.state.inflation);
        assert.equal(ra.surprise?.id, rb.surprise?.id);
    }
});
