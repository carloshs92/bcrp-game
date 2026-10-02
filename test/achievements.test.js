import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO } from '../src/game/mandate.js';
import { ACHIEVEMENTS, earnedAchievements } from '../src/game/achievements.js';
import { staffRecommendation } from '../src/model/economy.js';

test('logros: ids únicos, con nombre, texto e ícono', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const a of ACHIEVEMENTS) assert.ok(a.name && a.text && a.icon && typeof a.check === 'function', a.id);
});

test('logros: Perú es clave exige los cinco capítulos', () => {
    const all = Object.fromEntries(['hiper-1990', 'crisis-2008', 'nino-2017', 'pandemia-2020', 'inflacion-2022'].map(id => [id, { passed: true }]));
    const ids = ctx => earnedAchievements(ctx).map(a => a.id);
    assert.ok(ids({ mode: 'capitulo', chapter: 'inflacion-2022', r: { passed: true }, story: all }).includes('peru-es-clave'));
    const four = { ...all, 'nino-2017': { passed: false } };
    assert.ok(!ids({ mode: 'capitulo', chapter: 'inflacion-2022', r: { passed: true }, story: four }).includes('peru-es-clave'));
});

test('logros: un buen mandato gana algunos, pero no todos; ninguno revienta con datos incompletos', () => {
    let some = 0;
    for (let seed = 1; seed <= 20; seed++) {
        const m = new Mandate(seed, FREE_SCENARIO);
        while (!m.isOver) {
            if (m.congress.pending) m.answerCitation(0);
            if (m.congress.pendingBill) m.answerBill(1);
            m.decide(Math.max(0.25, staffRecommendation(m.state)));
        }
        const got = earnedAchievements({ mode: 'libre', m, r: m.evaluate(), story: {} });
        some += got.length;
        assert.ok(got.length < ACHIEVEMENTS.length);
    }
    assert.ok(some > 0);
    assert.doesNotThrow(() => earnedAchievements({ mode: 'libre' }));
});
