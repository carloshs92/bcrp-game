import { test } from 'node:test';
import assert from 'node:assert/strict';
import Mandate, { FREE_SCENARIO } from '../src/game/mandate.js';
import { nextCard } from '../src/game/cards.js';
import { BILLS } from '../src/model/congress.js';

test('cola de cartas: el orden es consecuencia → citación → proyecto → carta del mes', () => {
    const m = new Mandate(3, FREE_SCENARIO);

    // Fuerza las tres cartas especiales a la vez para probar la prioridad.
    m.consequences = [{ id: 'test', who: 'rosa', title: 'Prueba', text: 'Texto', effect: {} }];
    m.congress.pending = { id: 'q', text: '¿?', answers: [{ style: 'tecnica', text: 'a' }] };
    m.congress.pendingBill = BILLS[0];

    let card = nextCard(m);
    assert.equal(card.type, 'consequence');
    card.respond();
    assert.equal(m.consequences.length, 0);

    card = nextCard(m);
    assert.equal(card.type, 'citation');

    card.responses[0].respond();
    assert.equal(m.congress.pending, null);

    card = nextCard(m);
    assert.equal(card.type, 'bill');

    card.responses[1].respond();
    assert.equal(m.congress.pendingBill, null);

    card = nextCard(m);
    assert.equal(card.type, 'shock');
    assert.ok(card.responses.length >= 2);
});

test('cartas: "Seguir" en una consecuencia no cambia el estado macro', () => {
    const m = new Mandate(4, FREE_SCENARIO);
    m.congress.pending = null;
    m.congress.pendingBill = null;
    m.consequences = [{ id: 'test', who: 'rosa', title: 'Prueba', text: 'Texto', effect: { trust: -5, pressure: 3 } }];
    const stateBefore = JSON.stringify(m.state);
    const card = nextCard(m);
    card.respond();
    assert.equal(JSON.stringify(m.state), stateBefore);
});

test('cartas: en el modo libre, la carta del mes 6 trae midterm: true', () => {
    let found = false;
    for (let seed = 1; seed <= 10 && !found; seed++) {
        const m = new Mandate(seed, FREE_SCENARIO);
        for (let i = 0; i < 5 && !m.isOver; i++) {
            m.congress.pending = null;
            m.congress.pendingBill = null;
            m.decide(m.state.rate);
        }
        if (m.isOver) continue;
        assert.equal(m.quarter, 5);
        if (m.event.midterm) found = true;
    }
    assert.ok(found, 'ninguna de las 10 semillas trajo una carta midterm en el mes 6');
});

test('cartas: el exprés y el reto no tienen crisis de mitad de mandato', () => {
    const express = { ...FREE_SCENARIO, id: 'expres', turns: 6, yearLength: 2, midterm: null };
    for (let seed = 1; seed <= 10; seed++) {
        const m = new Mandate(seed, express);
        while (!m.isOver) {
            m.congress.pending = null;
            m.congress.pendingBill = null;
            assert.ok(!m.event.midterm, `seed ${seed}, mes ${m.quarter}: no debería haber midterm`);
            m.decide(m.state.rate);
        }
    }
});
