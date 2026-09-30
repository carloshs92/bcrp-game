import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate from '../src/game/mandate.js';
import HyperChapter from '../src/game/hyper.js';
import { CHAPTERS, TUTORIAL, INTERLUDES } from '../src/model/history.js';

const SEEDS = 100;

// Tasa de éxito de una estrategia (turno → tasa) sobre muchas semillas; `tool` usa Reactiva en el turno 1.
function winRate(scenario, strategy, { tool = false } = {}) {
    let won = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
        const m = new Mandate(seed, scenario);
        let i = 0;
        while (!m.isOver) {
            if (tool && i === 1) m.tools.forEach(t => m.useTool(t.id));
            m.decide(strategy(m, i++));
        }
        if (m.evaluate().passed) won++;
    }
    return won / SEEDS;
}

const rateChapters = CHAPTERS.filter(c => c.kind === 'rate');

for (const ch of rateChapters) {
    test(`${ch.id}: datos completos y alineados`, () => {
        assert.equal(ch.script.length, ch.turns);
        assert.equal(ch.labels.length, ch.turns);
        assert.equal(ch.realPath.rate.length, ch.turns);
        assert.equal(ch.realPath.inflation.length, ch.turns);
    });

    test(`${ch.id}: replicar al BCRP real gana casi siempre`, () => {
        const r = winRate(ch, (m, i) => ch.realPath.rate[i], { tool: true });
        assert.ok(r >= 0.8, `real=${r}`);
    });

    test(`${ch.id}: los movimientos reales caben en los botones del capítulo`, () => {
        const moves = ch.moves ?? [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];
        let prev = ch.initial.rate;
        for (const r of ch.realPath.rate) {
            assert.ok(moves.some(x => Math.abs(x - (r - prev)) < 1e-9), `movimiento ${r - prev} no disponible`);
            prev = r;
        }
    });
}

test('2008, 2020 y 2022: no mover la tasa rara vez gana', () => {
    for (const id of ['crisis-2008', 'pandemia-2020', 'inflacion-2022']) {
        const ch = CHAPTERS.find(c => c.id === id);
        assert.ok(winRate(ch, m => m.state.rate) < 0.6, id);
    }
});

test('2017: subir la tasa ante El Niño (el halcón) rinde peor que la historia real', () => {
    const ch = CHAPTERS.find(c => c.id === 'nino-2017');
    const hawk = winRate(ch, m => m.advisors().hawk.rate);
    const real = winRate(ch, (m, i) => ch.realPath.rate[i]);
    assert.ok(hawk < real, `halcón=${hawk} real=${real}`);
});

test('tutorial: se aprueba subiendo la tasa y no sin moverla', () => {
    assert.ok(winRate(TUTORIAL, m => m.state.rate + 0.5) > 0.7);
    assert.ok(winRate(TUTORIAL, m => m.state.rate) < 0.2);
});

test('1990: imprimir o financiar a medias pierde; Comité de Caja + apoyo social gana', () => {
    const ch = CHAPTERS.find(c => c.id === 'hiper-1990');
    const play = (choices, tool) => {
        const h = new HyperChapter(ch, 1);
        choices.forEach((c, i) => { if (h.isOver) return; if (tool && i === 3) h.useTool(); h.decide(c); });
        return h.evaluate();
    };
    assert.equal(play(Array(6).fill('imprimir')).passed, false);
    assert.equal(play(Array(6).fill('mitad')).passed, false);
    assert.equal(play(Array(6).fill('caja')).gameOver, 'estallido');
    assert.equal(play(Array(6).fill('caja'), true).passed, true);
});

test('interludios: cada capítulo tiene entrada (aunque sea vacía)', () => {
    for (const ch of CHAPTERS) assert.ok(Array.isArray(INTERLUDES[ch.id]), ch.id);
});

test('puntaje: copiar al BCRP real da exactamente 100% (mismos imprevistos)', () => {
    for (const ch of rateChapters) {
        for (const seed of [1, 2, 3]) {
            const m = new Mandate(seed, ch);
            let i = 0;
            while (!m.isOver) {
                if (i === 1) m.tools.forEach(t => m.useTool(t.id));
                m.decide(ch.realPath.rate[i++]);
            }
            const r = m.evaluate();
            if (r.survived) assert.equal(r.score, 100, `${ch.id} seed ${seed}`);
        }
    }
});

test('gente: subir la tasa entristece a deudores y alegra a ahorristas', async () => {
    const { rateMoods } = await import('../src/game/people.js');
    const base = { prev: {}, state: { inflation: 2.5, supply: 0, outputGap: 0, growth: 3, expectations: 2.5 }, rate: 4 };
    const up = Object.fromEntries(rateMoods({ ...base, move: 0.75, rate: 5 }).map(s => [s.id, s.mood]));
    const down = Object.fromEntries(rateMoods({ ...base, move: -0.75, rate: 3 }).map(s => [s.id, s.mood]));
    assert.ok(up.deudores < down.deudores);
    assert.ok(up.ahorristas > down.ahorristas);
});

test('gente 1990: el Comité de Caja golpea a los estatales; imprimir, a los ahorristas', async () => {
    const ch = CHAPTERS.find(c => c.id === 'hiper-1990');
    const caja = new HyperChapter(ch, 1).decide('caja').people;
    const imprimir = new HyperChapter(ch, 1).decide('imprimir').people;
    const get = (ps, id) => ps.find(p => p.id === id).mood;
    assert.ok(get(caja, 'estatales') < get(imprimir, 'estatales'));
    assert.ok(get(caja, 'ahorristas') > get(imprimir, 'ahorristas'));
});
