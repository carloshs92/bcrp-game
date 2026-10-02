import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regionMoods, regionVoice, sectorVoice, rateMoods } from '../src/game/people.js';
import { REGIONS } from '../src/model/regions.js';
import { DEPARTMENT_SHAPES } from '../src/model/peruMap.js';

const calm = { inflation: 2.2, supply: 0, outputGap: 0, growth: 3, expectations: 2.2 };

test('mapa: los 24 departamentos tienen geometría y perfil', () => {
    assert.equal(DEPARTMENT_SHAPES.length, 24);
    for (const d of DEPARTMENT_SHAPES) {
        assert.ok(REGIONS[d.id], `sin perfil: ${d.id}`);
        assert.ok(d.d.length > 50, `sin trazado: ${d.id}`);
    }
});

test('El Niño golpea más al norte que al sur', () => {
    const r = regionMoods({ state: calm, tags: ['nino'] });
    for (const norte of ['piura', 'tumbes', 'lambayeque']) {
        for (const sur of ['tacna', 'moquegua', 'puno']) assert.ok(r[norte].score < r[sur].score, `${norte} vs ${sur}`);
    }
    assert.equal(r.piura.cause, 'nino');
});

test('la caída del cobre golpea a las regiones mineras', () => {
    const r = regionMoods({ state: calm, tags: ['cobre-'] });
    assert.ok(r.moquegua.score < r.loreto.score);
    assert.equal(r.apurimac.cause, 'cobre-');
});

test('la cuarentena golpea a Cusco por el turismo', () => {
    const r = regionMoods({ state: calm, tags: ['cuarentena'] });
    assert.equal(r.cusco.cause, 'cuarentena');
    assert.ok(r.cusco.score < r['san-martin'].score);
});

test('subir la tasa pega más donde hay más crédito (Lima) que donde hay poco', () => {
    const r = regionMoods({ state: calm, move: 0.75 });
    assert.ok(r.lima.score < r.huancavelica.score);
});

test('las frases regionales usan el producto local y no se repiten seguidas', () => {
    const r = { ...regionMoods({ state: calm, tags: ['nino'] }).piura };
    const a = regionVoice(r), b = regionVoice(r);
    assert.ok(!/\{[pPm]\}/.test(a), a);
    assert.notEqual(a, b);
});

test('las frases de sector varían entre turnos con la misma causa', () => {
    const s = rateMoods({ state: { ...calm, inflation: 6, supply: 1.5 }, move: 0, rate: 4 }).find(x => x.id === 'familias');
    const seen = new Set(Array.from({ length: 3 }, () => sectorVoice(s)));
    assert.ok(seen.size >= 2);
});
