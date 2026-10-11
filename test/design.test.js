import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO } from '../src/game/mandate.js';
import { staffRecommendation } from '../src/model/economy.js';
import { ACTION_POINTS, planCost, canUse, planIsValid } from '../src/game/actions.js';
import { archetypeId, ending, ENDINGS, ARCHETYPES, shareText } from '../src/game/endings.js';
import { castLines, CAST } from '../src/game/cast.js';
import { cardLesson, EVENTS } from '../src/model/events.js';

/**
 * Intenciones del rediseño (Game Design "Sol Firme"): 2 acciones por mes, niebla según credibilidad,
 * cartas de consecuencia, elenco fijo, derrotas dramáticas y arquetipos.
 */

const SEEDS = 150;
const congress = m => { if (m.congress.pending) m.answerCitation(0); if (m.congress.pendingBill) m.answerBill(1); };
function play(seed, strategy, scenario = FREE_SCENARIO) {
    const m = new Mandate(seed, scenario);
    while (!m.isOver) { congress(m); const [rate, sell = 0, tone = 'neutral'] = strategy(m); m.decide(Math.max(0.25, rate), sell, tone); }
    return m;
}
const tally = strategy => {
    const out = {};
    for (let seed = 1; seed <= SEEDS; seed++) {
        const id = archetypeId(play(seed, strategy));
        out[id] = (out[id] ?? 0) + 1;
    }
    return out;
};
const top = t => Object.entries(t).sort((a, b) => b[1] - a[1])[0][0];

test('acciones: 2 por turno; esperar no gasta nada y una palanca en uso siempre se puede cambiar', () => {
    assert.equal(ACTION_POINTS, 2);
    assert.equal(planCost({}), 0);
    assert.equal(planCost({ move: 0.25, sell: 1.5 }), 2);
    assert.equal(planIsValid({ move: 0.25, sell: 1.5, tone: 'halcon' }), false);
    assert.equal(canUse({ move: 0.25, sell: 1.5 }, 'discurso'), false);
    assert.equal(canUse({ move: 0.25, sell: 1.5 }, 'tasa'), true);
});

test('niebla: con menos credibilidad el rango de la proyección es más ancho', () => {
    const width = cred => {
        const m = new Mandate(3);
        m.state = { ...m.state, credibility: cred };
        const p = m.projection(m.state.rate).at(-1);
        return p.hi - p.lo;
    };
    assert.ok(width(30) > width(90) * 1.3);
});

test('modo libre: los turnos son meses con etiqueta de mes', () => {
    const m = new Mandate(1);
    assert.equal(m.unit, 'mes');
    assert.equal(m.label(0), 'Ene 2027');
    assert.equal(m.label(11), 'Dic 2027');
});

test('consecuencias: subir fuerte con la economía débil trae la carta de las mypes, con rezago', () => {
    let found = null;
    for (let seed = 1; seed <= 40 && !found; seed++) {
        const m = new Mandate(seed);
        for (let i = 0; i < 6 && !m.isOver; i++) {
            congress(m);
            m.decide(m.state.rate + (i < 2 ? 0.5 : 0));
            const c = m.consequences.find(x => x.id === 'mypes-cierran');
            if (c) { found = { c, turn: i }; break; }
        }
    }
    assert.ok(found, 'nunca salió la carta');
    assert.ok(found.turn >= 2, 'llegó sin rezago');
    assert.ok(found.c.effect.trust < 0);
});

test('consecuencias: no alteran el modelo macro (la inflación es la misma con o sin cartas)', () => {
    // En modo referencia no salen cartas (ni envidia ni declaraciones): solo cambia la capa política.
    const run = keep => {
        const m = new Mandate(9, { ...FREE_SCENARIO, citations: false, bills: false, board: false });
        m.reference = !keep;
        while (!m.isOver) m.decide(staffRecommendation(m.state));
        return m.history.map(h => h.state.inflation.toFixed(6)).join();
    };
    assert.equal(run(true), run(false));
});

test('derrotas: vender dólares sin parar te deja "sin balas"; no mover la tasa pierde la credibilidad', () => {
    let reservas = 0;
    for (let seed = 1; seed <= 30; seed++) if (play(seed, m => [staffRecommendation(m.state), 3]).gameOver === 'reservas') reservas++;
    assert.ok(reservas >= 25, `reservas=${reservas}`);
    for (const id of Object.keys(ENDINGS)) assert.ok(ENDINGS[id].title && ENDINGS[id].text, id);
});

test('derrotas: la inflación tiene que pasar el límite dos meses seguidos', () => {
    const m = new Mandate(1, { ...FREE_SCENARIO, citations: false, bills: false });
    m.state = { ...m.state, core: 9, inflation: 9.2, expectations: 6 };
    m.decide(m.state.rate);
    assert.equal(m.gameOver, null);
    m.decide(m.state.rate);
    assert.equal(m.gameOver, 'inflacion');
});

test('arquetipos: cada estilo de juego tiene su final más frecuente', () => {
    assert.equal(top(tally(m => [staffRecommendation(m.state)])), 'guardian');
    assert.equal(top(tally(m => [m.advisors().hawk.rate])), 'halcon');
    assert.equal(top(tally(m => [m.state.rate])), 'paloma');
    const seller = tally(m => [staffRecommendation(m.state), m.fxPressure() > 0.5 ? 3 : 0]);
    assert.ok((seller.bombero ?? 0) > 0, 'el bombero nunca aparece');
});

test('balance: copiar al staff no siempre da 3 estrellas y esperar casi nunca', () => {
    const stars = strategy => { const s = [0, 0, 0, 0]; for (let seed = 1; seed <= SEEDS; seed++) { const m = play(seed, strategy); s[m.evaluate().stars]++; } return s; };
    const staff = stars(m => [staffRecommendation(m.state)]);
    assert.ok(staff[3] < SEEDS * 0.5, `staff 3★ ${staff[3]}`);
    assert.ok(staff[2] + staff[3] > SEEDS * 0.5);
    const hold = stars(m => [m.state.rate]);
    // 8% y no 5%: la crisis de mitad de mandato (Fase 1 del rehacer) consume RNG extra en el mes 6
    // y reordena los eventos de los meses siguientes para todas las semillas; sigue siendo una minoría.
    assert.ok(hold[3] < SEEDS * 0.08, `hold 3★ ${hold[3]}`);
});

test('elenco: Doña Rosa sufre con la inflación alta y Kevin con las alzas', () => {
    const m = new Mandate(2);
    const rosa = cred => castLines({ ...m, state: { ...m.state, inflation: cred, supply: 0 }, params: m.params, pressure: 50, trust: 50, fx: m.fx }).find(c => c.id === 'rosa').mood;
    assert.ok(rosa(6) < rosa(2));
    const rec = m.decide(m.state.rate + 0.5);
    assert.equal(castLines(m, rec).find(c => c.id === 'kevin').cause, 'tasaSube');
    for (const id of Object.keys(CAST)) assert.ok(CAST[id].name, id);
});

test('cartas: todas tienen qué golpean, la tentación y la lección', () => {
    for (const e of EVENTS) {
        const l = cardLesson(e);
        assert.ok(l.hits && l.tempt && l.lesson, e.id);
    }
});

test('final: el texto para compartir trae arquetipo, peor mes y a Doña Rosa', () => {
    const m = play(5, m => [staffRecommendation(m.state)]);
    const end = ending(m, m.evaluate());
    assert.ok(ARCHETYPES[end.archetype.id]);
    const text = shareText(m, end);
    assert.match(text, /Doña Rosa/);
    assert.match(text, /peor mes/);
});
