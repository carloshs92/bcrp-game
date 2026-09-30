import Mandate from '../game/mandate.js';
import { CHARACTERS } from '../model/events.js';
import { PARAMS, inBand } from '../model/economy.js';
import { fanChart, compareChart } from './fanChart.js';
import { logo, andeanBand } from './art.js';
import { openModal, modalOpen, closeModal } from './modal.js';
import { openGlossary } from './glossary.js';
import { coach } from './coach.js';
import { music, musicButton, bindMusicButton } from '../audio/music.js';
import { getSettings, DIFFICULTIES } from '../storage.js';
import { rateTradeoff } from '../game/people.js';
import { peoplePanel, peopleReport, peopleBalance, bindPeople } from './people.js';
import { bindMap } from './peruMap.js';

const pct = (v, d = 1) => `${v.toFixed(d)}%`;
const moveLabel = m => m === 0 ? '=' : `${m > 0 ? '+' : '−'}${Math.abs(m).toFixed(2)}`;
const help = term => `<button class="help" data-term="${term}" aria-label="¿Qué es esto?">?</button>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const GAME_OVER = {
    presion: { title: 'El Congreso cita al Directorio y exige su salida', text: 'La presión política llegó al límite. Un banco central necesita respaldo para mantener su autonomía.' },
    credibilidad: { title: 'Crisis de confianza en el BCR', text: 'Nadie cree que la inflación vaya a volver a la meta. Sin credibilidad, las expectativas se desanclan.' },
    inflacion: { title: 'La inflación se descontrola', text: 'Los peruanos recuerdan bien lo que pasa cuando los precios se desbocan. Esta vez no hubo freno a tiempo.' },
    recesion: { title: 'Recesión profunda', text: 'La economía se contrajo con fuerza. Frenar la inflación a costa del empleo también es fracasar.' }
};

/** Medidor con zona sana; `pos`, `zone` y `danger` en 0–1 sobre la escala. */
function meter({ id, label, term, display, pos, zone, danger, tone, sub }) {
    return `
    <div class="meter ${tone}" id="${id}">
      <div class="meter-top"><span class="kpi-label">${label} ${help(term)}</span><strong class="meter-val num">${display}</strong></div>
      <div class="meter-track">
        ${zone ? `<span class="meter-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></span>` : ''}
        ${danger ? `<span class="meter-danger" style="left:${danger[0] * 100}%;width:${(danger[1] - danger[0]) * 100}%"></span>` : ''}
        <span class="meter-fill" style="width:${Math.max(0, Math.min(1, pos)) * 100}%"></span>
      </div>
      <div class="meter-sub">${sub}</div>
    </div>`;
}

function meters(m) {
    const s = m.state, L = m.limits;
    const inflScale = v => v / L.inflation;
    const gMin = Math.max(L.growth, -12), gMax = m.params.potentialGrowth + 5;
    const growthScale = v => (v - gMin) / (gMax - gMin);
    const healthy = [m.params.potentialGrowth - 1.5, m.params.potentialGrowth + 1.5];
    return [
        meter({
            id: 'm-infl', label: 'Inflación', term: 'inflacion', display: pct(s.inflation),
            pos: inflScale(s.inflation), zone: [inflScale(PARAMS.bandMin), inflScale(PARAMS.bandMax)],
            tone: inBand(s.inflation) ? 'good' : 'bad', sub: `Meta 1%–3% · pierdes sobre ${L.inflation}%`
        }),
        meter({
            id: 'm-growth', label: 'Crecimiento PBI', term: 'pbi', display: pct(s.growth),
            pos: growthScale(s.growth), zone: [growthScale(healthy[0]), growthScale(healthy[1])],
            tone: s.growth < 0 ? 'bad' : s.growth < healthy[0] || s.growth > healthy[1] + 1 ? 'warn' : 'good',
            sub: `Potencial ~${pct(m.params.potentialGrowth)}${L.growth > -12 ? ` · pierdes bajo ${L.growth}%` : ''}`
        }),
        meter({
            id: 'm-cred', label: 'Credibilidad', term: 'credibilidad', display: `${Math.round(s.credibility)}`,
            pos: s.credibility / 100, danger: [0, L.credibility / 100],
            tone: s.credibility >= 60 ? 'good' : s.credibility >= 35 ? 'warn' : 'bad', sub: `Expectativas: ${pct(s.expectations)} · pierdes bajo ${L.credibility}`
        }),
        meter({
            id: 'm-press', label: 'Presión política', term: 'autonomia', display: `${Math.round(m.pressure)}`,
            pos: m.pressure / 100, danger: [0.8, 1],
            tone: m.pressure < 50 ? 'good' : m.pressure < 80 ? 'warn' : 'bad', sub: 'Las alzas son impopulares · pierdes en 100'
        })
    ].join('');
}

export function avatar(who) {
    const c = CHARACTERS[who] ?? CHARACTERS.analista;
    return `<span class="avatar" style="background:${c.color}">${c.initials}</span>`;
}

function eventCard(e) {
    const c = CHARACTERS[e.who] ?? CHARACTERS.analista;
    const ask = e.asks === 'bajar'
        ? `<span class="pill warn">Pide bajar la tasa</span><span class="ask-hint">Si la subes: +${Math.round(e.pressure * 1.5)} de presión</span>`
        : e.asks === 'subir'
            ? '<span class="pill bad">Pide actuar contra la inflación</span><span class="ask-hint">Si no subes con inflación alta: −credibilidad</span>'
            : '';
    const kind = { demanda: 'Choque de demanda', oferta: 'Choque de oferta', politica: 'Presión política', externo: 'Choque externo', calma: 'Sin sobresaltos' }[e.kind] ?? 'Coyuntura';
    return `
    <section class="card event" id="event">
      <div class="event-head">${avatar(e.who)}<div><small>${c.name}</small><h3>${e.title}</h3></div><span class="pill info">${kind}</span></div>
      <blockquote>“${e.quote}”</blockquote>
      ${ask ? `<div class="ask">${ask}</div>` : ''}
    </section>`;
}

function advisorCard(kind, a, selected) {
    const name = kind === 'hawk' ? 'Consejero Halcón' : 'Consejera Paloma';
    const tag = kind === 'hawk' ? 'Prioriza la inflación' : 'Prioriza el empleo';
    const on = Math.abs(a.move - selected) < 1e-9;
    return `
    <button class="advisor ${kind}${on ? ' on' : ''}" data-follow="${a.move}">
      <span class="adv-top"><strong>${name}</strong><span class="adv-move num">${moveLabel(a.move)}</span></span>
      <small>${tag}</small>
      <span class="adv-why">${a.why}</span>
    </button>`;
}

/** Pantalla "última hora": el imprevisto que la proyección no veía. */
export function showBreaking(surprise, { onClose }) {
    music.setMood('surprise');
    music.sting();
    const modal = openModal(`
      <div class="breaking">
        <div class="breaking-tag">¡ÚLTIMA HORA!</div>
        <div class="event-head">${avatar(surprise.who)}<div><small>${(CHARACTERS[surprise.who] ?? CHARACTERS.prensa).name}</small><h2>${surprise.title}</h2></div></div>
        <p class="lead">${surprise.text}</p>
        <p class="breaking-note">Esto no estaba en la proyección: tu decisión ya estaba tomada. Así es la política monetaria: se decide con información incompleta.</p>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Ver cómo terminó el trimestre</button></div>
    `, { dismissible: false, onClose });
    return modal;
}

/** Pausa dramática mientras el Directorio "anuncia" la decisión. */
export async function announceSuspense(text) {
    music.setMood('announce');
    const overlay = document.createElement('div');
    overlay.className = 'suspense';
    overlay.innerHTML = `<div class="suspense-card">${andeanBand}<div class="suspense-title">Nota Informativa del Programa Monetario</div><div class="suspense-text">${text}</div><div class="suspense-dots"><i></i><i></i><i></i></div></div>`;
    document.body.appendChild(overlay);
    await sleep(2100);
    overlay.remove();
}

/**
 * Juega un escenario (tutorial, capítulo o modo libre).
 * opts: { mode: 'libre' | 'capitulo' | 'tutorial', title, tips, coachSteps, onExit, onFinish(m, result) }
 */
export function playScenario(root, scenario, opts) {
    const m = new Mandate(opts.seed ?? Date.now(), scenario);
    // El tutorial siempre va en fácil y sin reloj.
    const diff = opts.difficulty ? { difficulty: opts.difficulty, ...DIFFICULTIES[opts.difficulty] } : getSettings();
    let move = 0;
    let busy = false;
    let lastPeople = null;
    let lastRegions = null;
    const timer = createTimer(diff.timer, () => { move = 0; announce({ timeout: true }); }, () => busy);

    const onKey = e => {
        if (modalOpen() || busy) return;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const i = m.moves.indexOf(move) + (e.key === 'ArrowRight' ? 1 : -1);
            if (i >= 0 && i < m.moves.length) { move = m.moves[i]; updateDecision(); }
            e.preventDefault();
        } else if (e.key === 'Enter' && !e.target.closest('button')) {
            announce();
        }
    };
    document.addEventListener('keydown', onKey);
    const cleanup = () => { document.removeEventListener('keydown', onKey); timer.stop(); };
    const exit = () => { cleanup(); closeModal(); opts.onExit(); };

    const render = () => {
        const tip = opts.tips?.[m.quarter];
        root.innerHTML = `
        <header class="topbar">
          <div class="brand">${logo}<span>${opts.title}</span></div>
          <div class="meeting-info"><small>Directorio del BCR</small><strong>${m.label()} · Turno ${m.quarter + 1} de ${m.turns}</strong></div>
          <div class="progress" aria-hidden="true">${Array.from({ length: m.turns }, (_, i) => `<span class="${i < m.quarter ? 'done' : i === m.quarter ? 'now' : ''}"></span>`).join('')}</div>
          <div class="spacer"></div>
          ${m.streak > 0 ? `<span class="streak">Racha: ${m.streak} en meta</span>` : ''}
          <span class="diff-chip">${diff.name}</span>
          ${musicButton()}
          <button class="btn btn-ghost" data-glossary>Glosario</button>
          <button class="btn btn-ghost" data-exit>Salir</button>
        </header>
        <div class="andean-strip">${andeanBand}</div>
        <main class="page mandate ${diff.hints ? 'hints-on' : 'hints-off'}">
          <div class="meters">${meters(m)}</div>
          <div class="mandate-grid">
            <div class="col">
              ${tip ? `<div class="tip"><strong>Consejo:</strong> ${tip}</div>` : ''}
              ${eventCard(m.event)}
              <section class="card" id="debate">
                <h3>Debate del Directorio <span class="sub">Toca una propuesta para seguirla</span></h3>
                <div class="advisors"></div>
              </section>
              ${peoplePanel(lastPeople, { regions: lastRegions })}
            </div>
            <div class="col">
              <section class="card" id="projection">
                <h3>Inflación y proyección a un año <span class="sub">Según la tasa que elijas</span></h3>
                <div class="fan"></div>
              </section>
              <section class="card decision" id="decision"></section>
            </div>
          </div>
        </main>`;
        root.querySelector('[data-exit]').addEventListener('click', exit);
        root.querySelector('[data-glossary]').addEventListener('click', () => openGlossary());
        root.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', () => openGlossary(b.dataset.term)));
        bindMusicButton(root);
        bindPeople(root);
        updateDecision();
        window.scrollTo({ top: 0 });
        timer.mount(root.querySelector('#decision'));
    };

    // El guion del tutorial para el turno se muestra cuando el turno empieza de verdad.
    const briefingCoach = () => {
        music.setMood('decision');
        const steps = opts.coachSteps?.briefing?.[m.quarter];
        if (steps) coach(steps(m));
        timer.start();
    };

    // Solo se redibuja lo que depende de la tasa elegida: la respuesta es inmediata.
    const updateDecision = () => {
        const s = m.state;
        const rate = Math.max(m.minRate, s.rate + move);
        const adv = m.advisors();
        const proj = m.projection(rate);
        const end = proj.at(-1);
        const endOk = inBand(end.inflation);

        root.querySelector('.advisors').innerHTML = advisorCard('hawk', adv.hawk, move) + advisorCard('dove', adv.dove, move);
        root.querySelectorAll('[data-follow]').forEach(b => b.addEventListener('click', () => {
            const want = Number(b.dataset.follow);
            move = m.moves.reduce((best, x) => Math.abs(x - want) < Math.abs(best - want) ? x : best, 0);
            music.click();
            updateDecision();
        }));

        root.querySelector('.fan').innerHTML = fanChart({ history: m.history, projection: proj, total: m.turns, labels: m.labels().map(shortLabel) });

        const hikeCost = scenario.hikePressure ?? 4;
        const pressHint = move > 0 ? ` · presión +${Math.round(move / 0.25 * hikeCost)}${m.event.asks === 'bajar' ? ` (+${Math.round(m.event.pressure * 1.5)} por ignorar el pedido)` : ''}` : '';
        const tools = m.tools.map(t => `
          <div class="tool">
            <div><strong>${t.name}</strong><small>${t.desc}</small></div>
            <button class="btn" data-tool="${t.id}" ${t.left > 0 ? '' : 'disabled'}>${t.left > 0 ? 'Activar' : 'Activado'}</button>
          </div>`).join('');
        const el = root.querySelector('#decision');
        el.innerHTML = `
          <div class="current">
            <div><div class="from">Nueva tasa de referencia ${help('tasa')}</div><div class="big num">${pct(rate, 2)}</div></div>
            <div class="from" style="text-align:right">Actual: <strong class="num">${pct(s.rate, 2)}</strong><br>
              En un año: <strong class="num ${endOk ? 'txt-good' : 'txt-bad'}">${pct(end.inflation)}</strong> inflación, <strong class="num">${pct(end.growth)}</strong> PBI</div>
          </div>
          <div class="steps" style="grid-template-columns:repeat(${m.moves.length},1fr)" role="radiogroup" aria-label="Cambio de tasa">
            ${m.moves.map(v => `<button role="radio" aria-checked="${v === move}" class="${v === move ? 'on' : ''}" data-move="${v}" ${s.rate + v < m.minRate - 1e-9 ? 'disabled' : ''}>${moveLabel(v)}<small>${v === 0 ? 'Mantener' : `${Math.round(Math.abs(v) * 100)} pb`}</small></button>`).join('')}
          </div>
          ${tools}
          <div class="tradeoff two"><span><strong>Ganan:</strong> ${rateTradeoff(move).win}</span><span><strong>Pierden:</strong> ${rateTradeoff(move).lose}</span></div>
          <div class="decision-actions">
            ${diff.timer ? '<div class="timer-slot"></div>' : ''}
            <span class="press-hint">${diff.hints ? (endOk ? 'La proyección termina dentro de la meta.' : 'La proyección termina fuera de la meta.') : ''}${pressHint}${rate <= m.minRate + 1e-9 ? ' · La tasa ya está en su piso (0.25%).' : ''}</span>
            <button class="btn btn-primary" data-announce>Anunciar decisión <span class="kbd">Enter</span></button>
          </div>`;
        el.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { move = Number(b.dataset.move); music.click(); updateDecision(); }));
        el.querySelector('[data-announce]').addEventListener('click', announce);
        el.querySelector('[data-term]').addEventListener('click', () => openGlossary('tasa'));
        el.querySelectorAll('[data-tool]').forEach(b => b.addEventListener('click', () => {
            if (m.useTool(b.dataset.tool)) { music.sting(); render(); }
        }));
        timer.mount(el);
    };

    const announce = async ({ timeout = false } = {}) => {
        if (busy) return;
        busy = true;
        timer.stop();
        const s = m.state;
        const rate = Math.max(m.minRate, s.rate + move);
        const d = rate - s.rate;
        await announceSuspense(timeout ? `Se acabó el tiempo. El Directorio no llegó a un acuerdo: la tasa se mantiene en ${pct(rate, 2)}…`
            : d === 0 ? `El Directorio acordó mantener la tasa de referencia en ${pct(rate, 2)}…`
            : `El Directorio acordó ${d > 0 ? 'elevar' : 'reducir'} la tasa de referencia a ${pct(rate, 2)}…`);
        const rec = m.decide(rate);
        rec.timeout = timeout;
        lastPeople = rec.people;
        lastRegions = rec.regions;
        move = 0;
        const reveal = () => { if (!m.isOver) { render(); flashMeters(rec); } showNewspaper(rec); busy = false; };
        if (rec.surprise) {
            showBreaking(rec.surprise, { onClose: reveal });
            const steps = opts.coachSteps?.surprise?.[rec.quarter];
            if (steps) coach(steps(rec));
        } else {
            reveal();
        }
    };

    const flashMeters = rec => {
        const pairs = [
            ['m-infl', rec.state.inflation - rec.prev.inflation, inBand(rec.state.inflation)],
            ['m-growth', rec.state.growth - rec.prev.growth, rec.state.growth > rec.prev.growth],
            ['m-cred', rec.state.credibility - rec.prev.credibility, rec.state.credibility >= rec.prev.credibility],
            ['m-press', rec.pressure - rec.prevPressure, rec.pressure <= rec.prevPressure]
        ];
        pairs.forEach(([id, d, good]) => {
            const node = root.querySelector(`#${id}`);
            if (node && Math.abs(d) >= 0.05) node.classList.add(good ? 'flash-good' : 'flash-bad');
        });
    };

    const showNewspaper = rec => {
        const good = inBand(rec.state.inflation) && rec.state.growth > 0;
        music.setMood(good ? 'good' : 'bad');
        const diff = rec.state.inflation - rec.projected;
        const surprise = Math.abs(diff) < 0.15 ? 'Tal como proyectaste.'
            : rec.surprise ? `${diff > 0 ? `${diff.toFixed(1)} pp más` : `${Math.abs(diff).toFixed(1)} pp menos`} de lo proyectado, por el imprevisto: ${rec.surprise.title.toLowerCase()}.`
                : diff > 0 ? `${diff.toFixed(1)} pp más de lo proyectado: la realidad nunca es exacta.` : `${Math.abs(diff).toFixed(1)} pp menos de lo proyectado.`;
        const chip = (label, a, b, fmt, goodUp) => {
            const dd = b - a;
            const cls = Math.abs(dd) < 0.05 ? '' : (dd > 0) === goodUp ? 'up-good' : 'up-bad';
            return `<span class="delta ${cls}">${label} <strong class="num">${fmt(b)}</strong> <small>${dd >= 0 ? '▲' : '▼'} ${fmt(Math.abs(dd))}</small></span>`;
        };
        const scale = Math.max(0.3, ...Object.values(rec.drivers).map(Math.abs));
        const factors = [['Demanda', rec.drivers.demand], ['Expectativas', rec.drivers.expectations], ['Alimentos y energía', rec.drivers.supply]];
        const over = m.isOver;
        const real = rec.real ? `<div class="real-note"><strong>En la historia real (${rec.label}):</strong> la tasa del BCRP cerró en ${pct(rec.real.rate, 2)} y la inflación en ${pct(rec.real.inflation, 2)}.</div>` : '';
        const modal = openModal(`
          <div class="paper">
            <div class="masthead"><span>DIARIO LA MONEDA</span><span>${rec.label}</span></div>
            ${andeanBand}
            <h2 class="paper-head">${rec.headline}</h2>
            <p class="paper-sub">El Directorio del BCR ${rec.move === 0 ? `mantuvo la tasa en ${pct(rec.rate, 2)}` : `${rec.move > 0 ? 'subió' : 'bajó'} la tasa ${Math.round(Math.abs(rec.move) * 100)} pb, a ${pct(rec.rate, 2)}`}.</p>
          </div>
          <div class="reveal">
            <div class="reveal-num"><small>Inflación</small><span class="num" data-anim-from="${rec.prev.inflation}" data-anim-to="${rec.state.inflation}">${pct(rec.prev.inflation)}</span></div>
            <p class="reveal-note">Proyectabas ${pct(rec.projected)}. ${surprise}</p>
          </div>
          <div class="deltas">
            ${chip('Inflación', rec.prev.inflation, rec.state.inflation, v => pct(v), rec.state.inflation < PARAMS.target)}
            ${chip('PBI', rec.prev.growth, rec.state.growth, v => pct(v), true)}
            ${chip('Credibilidad', rec.prev.credibility, rec.state.credibility, v => `${Math.round(v)}`, true)}
            ${chip('Presión', rec.prevPressure, rec.pressure, v => `${Math.round(v)}`, false)}
          </div>
          ${rec.streak >= 2 ? `<div class="streak-pop">¡${rec.streak} turnos seguidos en la meta!</div>` : ''}
          ${rec.timeout ? '<div class="note warn">Se acabó el tiempo y no hubo decisión: todo siguió como estaba. En una crisis, no decidir también es una decisión.</div>' : ''}
          ${rec.notes.map(n => `<div class="note ${n.tone}">${n.text}</div>`).join('')}
          ${real}
          ${peopleReport(rec.people, rec.regions)}
          <details class="why">
            <summary>¿Por qué cambió la inflación?</summary>
            <div class="factors">${factors.map(([label, v]) => `
              <div class="factor"><span>${label}</span>
                <div class="bar"><div class="fill ${v >= 0 ? 'up' : 'down'}" style="width:${Math.min(50, Math.abs(v) / scale * 50)}%"></div></div>
                <span class="val num">${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} pp</span></div>`).join('')}
            </div>
            <p class="why-note">${rec.event.kind === 'oferta' ? 'Fue sobre todo un choque de oferta: la tasa no lo evita, pero sí impide que contagie a las expectativas.' : 'La tasa actúa sobre la demanda con rezago: lo que decides hoy pesa más en los próximos trimestres.'}</p>
          </details>
          <div class="modal-actions"><button class="btn btn-primary" data-continue>${over ? 'Ver el veredicto' : 'Siguiente turno'}</button></div>
        `, { dismissible: false });
        animateNumber(modal.querySelector('[data-anim-to]'));
        bindMap(modal);
        const steps = opts.coachSteps?.result?.[rec.quarter];
        if (steps) coach(steps(rec));
        modal.querySelector('[data-continue]').addEventListener('click', () => {
            modal.parentElement._close();
            if (m.isOver) {
                cleanup();
                const r = m.evaluate();
                music.setMood(r.passed ? 'victory' : 'defeat');
                opts.onFinish(m, r);
            } else {
                briefingCoach();
            }
        });
    };

    render();
    briefingCoach();
    return m;
}

export function shortLabel(t) {
    return t.replace(/ 20(\d\d)$/, " '$1").replace(/ 19(\d\d)$/, " '$1");
}

export function animateNumber(el, suffix = '%') {
    if (!el) return;
    const from = Number(el.dataset.animFrom), to = Number(el.dataset.animTo);
    const t0 = performance.now(), dur = 900;
    const tick = t => {
        const k = Math.min(1, (t - t0) / dur);
        const e = 1 - (1 - k) ** 3;
        el.textContent = `${(from + (to - from) * e).toFixed(1)}${suffix}`;
        if (k < 1) requestAnimationFrame(tick);
        else el.classList.add(el.dataset.good === 'false' || (!el.dataset.good && !inBand(to)) ? 'txt-bad' : 'txt-good', 'landed');
    };
    requestAnimationFrame(tick);
}

/** Pantalla final común: veredicto, gráfico(s), comparación con la historia real, logros. */
export function renderVerdict(root, m, r, { title, text, reality, sources, achievements = [], newAch = [], stats, actions }) {
    const confetti = r.passed ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 36 }, () => `<i style="left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},70%,55%);animation-delay:${Math.random() * 0.8}s;animation-duration:${2 + Math.random() * 1.5}s"></i>`).join('') + '</div>' : '';
    const labels = m.labels().map(shortLabel);
    const yours = m.history.map(h => h.state.inflation);
    const real = m.scenario.realPath;
    const charts = real
        ? compareChart({ labels, title: 'Inflación: tú vs. la historia real', series: [
            { values: yours, color: 'var(--navy)', label: 'Tu inflación' },
            { values: [null, ...real.inflation], color: 'var(--red)', label: 'Inflación real', dash: true }] })
        + compareChart({ labels, band: false, title: 'Tasa de referencia: tú vs. el BCRP', series: [
            { values: m.history.map(h => h.rate), color: 'var(--navy)', label: 'Tu tasa' },
            { values: [null, ...real.rate], color: 'var(--red)', label: 'Tasa real del BCRP', dash: true }] })
        : fanChart({ history: m.history, projection: [], total: m.turns, labels });

    root.innerHTML = `
    <header class="topbar"><div class="brand">${logo}<span>Guardián de la Estabilidad</span></div><div class="spacer"></div>${musicButton()}<button class="btn btn-ghost" data-exit>Salir</button></header>
    <div class="andean-strip">${andeanBand}</div>
    <main class="page" style="max-width:900px">
      <section class="card verdict ${r.passed ? 'win' : 'lose'}">
        ${confetti}
        <div class="paper">
          <div class="masthead"><span>DIARIO LA MONEDA</span><span>Edición especial</span></div>
          ${andeanBand}
          <h1 class="paper-head big">${title}</h1>
          <p class="paper-sub">${text}</p>
        </div>
        ${r.checks ? `<div class="section-title">Objetivos</div><ul class="goals">${r.checks.map(c => `<li><span class="mark ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'}</span><span>${c.label}</span><span class="val num">${c.value}</span></li>`).join('')}</ul>` : ''}
        <div class="verdict-stats">${stats.map(([v, l]) => `<div><strong class="num">${v}</strong><small>${l}</small></div>`).join('')}</div>
        <div class="section-title">Tu recorrido</div>
        <div class="chart">${charts}</div>
        ${peopleBalance(m.peopleHistory, m.regionHistory)}
        ${reality ? `<div class="section-title">Lo que pasó en la realidad</div><p class="reality">${reality}</p>` : ''}
        ${achievements.length ? `<div class="section-title">Logros</div>
        <div class="achievements">${achievements.map(a => `<div class="ach${newAch.includes(a) ? ' new' : ''}"><strong>${a.name}</strong><small>${a.text}</small>${newAch.includes(a) ? '<span class="pill good">Nuevo</span>' : ''}</div>`).join('')}</div>` : ''}
        ${sources?.length ? `<details class="sources"><summary>Fuentes</summary><ul>${sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ul></details>` : ''}
        <div class="modal-actions">${actions.map(a => `<button class="btn ${a.primary ? 'btn-primary' : ''}" data-action="${a.id}">${a.label}</button>`).join('')}</div>
      </section>
    </main>`;
    bindMusicButton(root);
    bindMap(root);
    root.querySelector('[data-exit]').addEventListener('click', actions.find(a => a.id === 'exit')?.run ?? (() => {}));
    root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', actions.find(a => a.id === b.dataset.action).run));
    window.scrollTo({ top: 0 });
}

/**
 * Reloj de decisión (modo difícil). Solo corre cuando no hay modales ni mensajes abiertos;
 * al llegar a cero llama `onExpire`. Con `seconds = 0` no hace nada.
 */
export function createTimer(seconds, onExpire, isBusy) {
    let left = seconds, id = null, host = null;
    const draw = () => {
        const slot = host?.querySelector('.timer-slot');
        if (!slot || !seconds) return;
        const k = left / seconds;
        slot.innerHTML = `<div class="timer ${left <= 10 ? 'urgent' : ''}"><div class="timer-bar" style="width:${k * 100}%"></div><span>${Math.ceil(left)} s · si no decides, todo sigue igual</span></div>`;
    };
    return {
        mount(el) { host = el; draw(); },
        start() {
            if (!seconds) return;
            clearInterval(id);
            left = seconds;
            draw();
            // Se mide con el reloj real: los navegadores ralentizan setInterval en pestañas de fondo.
            let last = performance.now();
            id = setInterval(() => {
                const now = performance.now();
                const dt = (now - last) / 1000;
                last = now;
                if (modalOpen() || isBusy()) return; // el reloj se pausa con modales y mensajes
                const before = Math.ceil(left);
                left = Math.max(0, left - dt);
                if (Math.ceil(left) < before && left <= 10 && left > 0) music.click();
                draw();
                if (left <= 0) { clearInterval(id); onExpire(); }
            }, 250);
        },
        stop() { clearInterval(id); }
    };
}
