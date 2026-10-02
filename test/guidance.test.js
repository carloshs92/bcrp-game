import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { GUIDANCE_RULES, FREE_SCENARIO } from '../src/game/mandate.js';
import { TUTORIAL } from '../src/model/history.js';
import { staffRecommendation } from '../src/model/economy.js';

// Sin votación del Directorio: aquí se mide solo el comunicado.
const ready = seed => {
    const m = new Mandate(seed, { ...FREE_SCENARIO, board: false });
    m.congress.pending = null;
    m.congress.pendingBill = null;
    return m;
};

test('comunicado: el tono halcón baja la inflación proyectada y el paloma la sube', () => {
    const m = ready(3);
    const r = m.state.rate;
    const end = tone => m.projection(r, 0, tone).at(-1).inflation;
    assert.ok(end('halcon') < end('neutral'));
    assert.ok(end('paloma') > end('neutral'));
});

test('comunicado: pesa más con más credibilidad', () => {
    const effect = cred => {
        const m = ready(3);
        m.state = { ...m.state, credibility: cred };
        const r = m.state.rate;
        return m.projection(r, 0, 'neutral').at(-1).inflation - m.projection(r, 0, 'halcon').at(-1).inflation;
    };
    assert.ok(effect(90) > effect(30));
});

test('comunicado: contradecirlo cuesta credibilidad y cumplirlo suma', () => {
    const run = second => {
        const m = ready(5);
        m.decide(m.state.rate, 0, 'halcon');
        m.congress.pending = null;
        m.congress.pendingBill = null;
        const before = m.state.credibility;
        const twin = ready(5);
        twin.decide(twin.state.rate, 0, 'neutral');
        twin.congress.pending = null;
        twin.congress.pendingBill = null;
        // Mismo movimiento con y sin comunicado previo: la diferencia es la palabra dada.
        m.decide(m.state.rate + second, 0, 'neutral');
        twin.decide(twin.state.rate + second, 0, 'neutral');
        return { m, twin, before };
    };
    const broken = run(-0.5);
    assert.equal(broken.m.stats.guidanceBroken, 1);
    assert.ok(broken.m.history.at(-1).state.credibility < broken.twin.history.at(-1).state.credibility - GUIDANCE_RULES.broken / 2);
    const kept = run(0.5);
    assert.equal(kept.m.stats.guidanceKept, 1);
});

test('comunicado: el tutorial no lo usa y el BCRP real (neutral) sigue siendo la referencia', () => {
    const t = new Mandate(7, TUTORIAL);
    assert.equal(t.guidanceOn, false);
    const rec = t.decide(t.state.rate, 0, 'halcon');
    assert.equal(rec.tone, 'neutral');
});

test('comunicado: hablar siempre como paloma no es una estrategia ganadora', () => {
    const rate = (tone) => {
        let won = 0;
        for (let seed = 1; seed <= 120; seed++) {
            const m = new Mandate(seed);
            while (!m.isOver) {
                if (m.congress.pending) m.answerCitation(0);
                if (m.congress.pendingBill) m.answerBill(1);
                m.decide(Math.max(0.25, staffRecommendation(m.state)), 0, tone(m));
            }
            if (m.evaluate().reappointed) won++;
        }
        return won / 120;
    };
    const neutral = rate(() => 'neutral');
    const dove = rate(() => 'paloma');
    const smart = rate(m => m.state.inflation > 3 ? 'halcon' : m.state.inflation < 1.5 ? 'paloma' : 'neutral');
    assert.ok(dove < neutral - 0.1, `paloma ${dove} vs neutral ${neutral}`);
    assert.ok(smart >= neutral - 0.03, `con criterio ${smart} vs neutral ${neutral}`);
});
