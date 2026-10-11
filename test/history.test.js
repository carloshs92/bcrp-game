import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate from '../src/game/mandate.js';
import HyperChapter from '../src/game/hyper.js';
import { CHAPTERS, TUTORIAL, INTERLUDES } from '../src/model/history.js';

const SEEDS = 100;

// Tasa de éxito de una estrategia (turno → tasa) sobre muchas semillas; `tool` usa Reactiva en el turno 1.
function winRate(scenario, strategy, { tool = false, fx = () => 0 } = {}) {
    let won = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
        const m = new Mandate(seed, scenario);
        let i = 0;
        while (!m.isOver) {
            if (tool && i === 1) m.tools.forEach(t => m.useTool(t.id));
            m.decide(strategy(m, i), fx(m, i));
            i++;
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
        const r = winRate(ch, (m, i) => ch.realPath.rate[i], { tool: true, fx: (m, i) => ch.realPath.fxSales?.[i] ?? 0 });
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

test('tutorial: tasa y discurso firme juntos ganan; quedarse quieto o solo subir poco, no', () => {
    const run = (strategy, tone) => {
        let won = 0;
        for (let seed = 1; seed <= SEEDS; seed++) {
            const m = new Mandate(seed, TUTORIAL);
            while (!m.isOver) m.decide(strategy(m), 0, tone);
            if (m.evaluate().passed) won++;
        }
        return won / SEEDS;
    };
    assert.ok(run(m => m.state.rate + 0.25, 'halcon') > 0.8, 'dos acciones');
    assert.ok(run(m => m.state.rate + 0.25, 'neutral') < 0.4, 'solo la tasa');
    assert.ok(run(m => m.state.rate, 'neutral') < 0.1, 'esperar siempre');
});

test('los caminos reales del BCRP caben en 2 acciones por turno', async () => {
    const { planCost, ACTION_POINTS } = await import('../src/game/actions.js');
    for (const ch of rateChapters) {
        let prev = ch.initial.rate;
        ch.realPath.rate.forEach((r, i) => {
            const cost = planCost({ move: r - prev, sell: ch.realPath.fxSales?.[i] ?? 0, scripted: i === 1 && !!ch.tools?.length });
            assert.ok(cost <= ACTION_POINTS, `${ch.id} turno ${i + 1}: ${cost} acciones`);
            prev = r;
        });
    }
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
            // Sin proyectos de ley: sus choques son del jugador, no del camino real del BCRP.
            const m = new Mandate(seed, { ...ch, bills: false });
            let i = 0;
            while (!m.isOver) {
                if (i === 1) m.tools.forEach(t => m.useTool(t.id));
                m.decide(ch.realPath.rate[i], ch.realPath.fxSales?.[i] ?? 0);
                i++;
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

test('dólar: replicar al BCRP reproduce el tipo de cambio real (±3%)', () => {
    for (const ch of rateChapters.filter(c => c.fx)) {
        const m = new Mandate(1, { ...ch, surpriseChance: 0 });
        let i = 0;
        while (!m.isOver) { m.decide(ch.realPath.rate[i], ch.realPath.fxSales[i]); i++; }
        m.history.slice(1).forEach((h, k) => {
            const err = Math.abs(h.fx / ch.realPath.fxRate[k] - 1);
            assert.ok(err < 0.03, `${ch.id} ${ch.labels[k]}: ${h.fx.toFixed(3)} vs ${ch.realPath.fxRate[k]}`);
        });
    }
});

test('dólar: vender reservas frena la depreciación y no se puede bajar del piso', () => {
    const ch = CHAPTERS.find(c => c.id === 'crisis-2008');
    const run = sell => { const m = new Mandate(1, { ...ch, surpriseChance: 0 }); for (let i = 0; i < 4; i++) m.decide(m.state.rate, i === 3 ? sell : 0); return m; };
    assert.ok(run(3).fx.rate < run(0).fx.rate);
    const m = new Mandate(1, ch);
    while (!m.isOver) m.decide(m.state.rate, 3);
    assert.ok(m.fx.reserves >= 0.3 * m.fx.initialReserves - 1e-9);
});

test('momento decisivo: copiar al BCRP real lo supera; subir la tasa en plena crisis de 2008 no', () => {
    const ch = CHAPTERS.find(c => c.id === 'crisis-2008');
    const climaxOf = strategy => {
        const m = new Mandate(11, ch);
        let i = 0, rec = null;
        while (!m.isOver) {
            if (i === 1) m.tools.forEach(t => m.useTool(t.id));
            const r = m.decide(strategy(m, i), ch.realPath.fxSales?.[i] ?? 0);
            if (r.climax) rec = r;
            i++;
        }
        return rec;
    };
    assert.equal(climaxOf((m, i) => ch.realPath.rate[i]).climaxWon, true);
    assert.equal(climaxOf(m => m.state.rate + 0.75).climaxWon, false);
    for (const c of CHAPTERS.filter(x => x.climax)) assert.ok(c.climax.turn < c.turns, c.id);
});
