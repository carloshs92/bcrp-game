import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO } from '../src/game/mandate.js';
import { TOOLBOX, unlockedTools } from '../src/game/toolbox.js';
import { CHAPTERS } from '../src/model/history.js';
import { staffRecommendation } from '../src/model/economy.js';

const ALL = { ...FREE_SCENARIO, toolbox: TOOLBOX.map(t => t.id) };
const fresh = (seed = 4) => {
    const m = new Mandate(seed, ALL);
    m.congress.pending = null;
    m.congress.pendingBill = null;
    return m;
};

test('herramientas: subir el encaje baja la inflación proyectada y bajarlo la sube', () => {
    const m = fresh();
    const r = m.state.rate;
    const end = id => m.projection(r, 0, 'neutral', id).at(-1).inflation;
    assert.ok(end('encaje-sube') < end(null));
    assert.ok(end('encaje-baja') > end(null));
});

test('herramientas: subir y bajar el mismo encaje comparten la recarga', () => {
    const m = fresh();
    m.decide(m.state.rate, 0, 'neutral', 'encaje-sube');
    assert.equal(m.toolReady('encaje-baja'), false);
    assert.equal(m.toolReady('repos'), true);
});

test('herramientas: la desdolarización se usa una vez y luego el dólar pesa menos en los precios', () => {
    const m = fresh();
    m.decide(m.state.rate, 0, 'neutral', 'desdolarizacion');
    for (let i = 0; i < 3 && !m.isOver; i++) { m.congress.pending = null; m.congress.pendingBill = null; m.decide(m.state.rate); }
    assert.ok(m.fxPassMult < 1);
    assert.equal(m.toolReady('desdolarizacion'), false);
});

test('herramientas: se ganan superando capítulos', () => {
    assert.deepEqual(unlockedTools({}), []);
    const after2008 = unlockedTools({ 'crisis-2008': { passed: true } });
    assert.ok(after2008.includes('encaje-sube') && after2008.includes('repos'));
    assert.ok(!after2008.includes('swaps'));
});

test('herramientas: cada capítulo con caja solo usa herramientas que existen', () => {
    const ids = new Set(TOOLBOX.map(t => t.id));
    for (const ch of CHAPTERS) for (const id of ch.toolbox ?? []) assert.ok(ids.has(id), `${ch.id}: ${id}`);
});

test('herramientas: usarlas todas sin criterio no es mejor que no usarlas', () => {
    const rate = pick => {
        let won = 0;
        for (let seed = 1; seed <= 120; seed++) {
            const m = new Mandate(seed, ALL);
            while (!m.isOver) {
                if (m.congress.pending) m.answerCitation(0);
                if (m.congress.pendingBill) m.answerBill(1);
                m.decide(Math.max(0.25, staffRecommendation(m.state)), 0, 'neutral', pick(m));
            }
            if (m.evaluate().reappointed) won++;
        }
        return won / 120;
    };
    const none = rate(() => null);
    const spam = rate(m => TOOLBOX.map(t => t.id).find(id => m.toolReady(id)) ?? null);
    assert.ok(spam <= none + 0.02, `todo ${spam} vs nada ${none}`);
});
