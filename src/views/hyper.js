import HyperChapter, { HYPER_CHOICES, HYPER_TOOL } from '../game/hyper.js';
import { CHARACTERS } from '../model/events.js';
import { compareChart } from './fanChart.js';
import { logo, andeanBand } from './art.js';
import { openModal, modalOpen, closeModal } from './modal.js';
import { openGlossary } from './glossary.js';
import { music, musicButton, bindMusicButton } from '../audio/music.js';
import { avatar, announceSuspense, showBreaking, animateNumber, shortLabel, createTimer } from './play.js';
import { getSettings } from '../storage.js';
import { peoplePanel, sectorsReport, regionsReport, peopleBalance, bindPeople, hurtCount } from './people.js';
import { tabs, bindTabs } from './tabs.js';
import { bindMap } from './peruMap.js';

const pct = v => `${v.toFixed(1)}%`;
const help = term => `<button class="help" data-term="${term}" aria-label="¿Qué es esto?">?</button>`;

function meter({ id, label, term, display, pos, danger, tone, sub }) {
    return `
    <div class="meter ${tone}" id="${id}">
      <div class="meter-top"><span class="kpi-label">${label} ${help(term)}</span><strong class="meter-val num">${display}</strong></div>
      <div class="meter-track">
        ${danger ? `<span class="meter-danger" style="left:${danger[0] * 100}%;width:${(danger[1] - danger[0]) * 100}%"></span>` : ''}
        <span class="meter-fill" style="width:${Math.max(0, Math.min(1, pos)) * 100}%"></span>
      </div>
      <div class="meter-sub">${sub}</div>
    </div>`;
}

function meters(h) {
    const s = h.state;
    // Escala logarítmica: de 1% a 400% mensual.
    const logPos = v => Math.log10(Math.max(1, v)) / Math.log10(400);
    return [
        meter({ id: 'h-infl', label: 'Inflación del mes', term: 'hiperinflacion', display: pct(s.inflation), pos: logPos(s.inflation), danger: [logPos(60), 1], tone: s.inflation <= 10 ? 'good' : s.inflation < 40 ? 'warn' : 'bad', sub: 'Meta del capítulo: 10% o menos · pierdes sobre 60%' }),
        meter({ id: 'h-cred', label: 'Credibilidad', term: 'credibilidad', display: `${Math.round(s.credibility)}`, pos: s.credibility / 100, tone: s.credibility > 50 ? 'good' : s.credibility > 25 ? 'warn' : 'bad', sub: '¿La gente cree que la inflación va a parar?' }),
        meter({ id: 'h-social', label: 'Tensión social', term: 'autonomia', display: `${Math.round(s.social)}`, pos: s.social / 100, danger: [0.8, 1], tone: s.social < 60 ? 'good' : s.social < 85 ? 'warn' : 'bad', sub: 'Sueldos que no alcanzan · pierdes en 100' }),
        meter({ id: 'h-act', label: 'Actividad económica', term: 'pbi', display: pct(s.activity), pos: (s.activity + 15) / 23, tone: s.activity > 0 ? 'good' : s.activity > -6 ? 'warn' : 'bad', sub: 'Variación anual aproximada' })
    ].join('');
}

export function playHyper(root, chapter, { onExit, onFinish }) {
    const h = new HyperChapter(chapter);
    const diff = getSettings();
    let choice = null;
    let busy = false;
    let lastChoice = null;
    let lastPeople = null;
    let lastRegions = null;
    // Si se acaba el tiempo, el BCR sigue haciendo lo de siempre: al inicio, imprimir para el Tesoro.
    const timer = createTimer(diff.timer, () => { choice = lastChoice ?? 'imprimir'; announce({ timeout: true }); }, () => busy);

    const onKey = e => {
        if (modalOpen() || busy) return;
        const ids = HYPER_CHOICES.map(c => c.id);
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const i = choice ? ids.indexOf(choice) + (e.key === 'ArrowRight' ? 1 : -1) : 0;
            if (i >= 0 && i < ids.length) { choice = ids[i]; updateChoices(); }
        } else if (e.key === 'Enter' && !e.target.closest('button')) announce();
    };
    document.addEventListener('keydown', onKey);
    const cleanup = () => { document.removeEventListener('keydown', onKey); timer.stop(); };

    const render = () => {
        const e = h.event;
        const c = CHARACTERS[e.who];
        const monthly = h.history.slice(1).map(x => x.state.inflation);
        root.innerHTML = `
        <header class="topbar">
          <div class="brand">${logo}<span>1990 · Hiperinflación</span></div>
          <div class="meeting-info"><small>Directorio del BCR</small><strong>${h.label()} · Mes ${h.month + 1} de ${h.turns}</strong></div>
          <div class="spacer"></div>
          <span class="diff-chip">${diff.name}</span>
          ${musicButton()}
          <button class="btn btn-ghost" data-glossary>Glosario</button>
          <button class="btn btn-ghost" data-exit>Salir</button>
        </header>
        <div class="andean-strip">${andeanBand}</div>
        <main class="page mandate ${diff.hints ? 'hints-on' : 'hints-off'}">
          <div class="meters">${meters(h)}</div>
          <div class="mandate-grid">
            <div class="col">
              <section class="card event" id="event">
                <div class="event-head">${avatar(e.who)}<div><small>${c.name}</small><h3>${e.title}</h3></div><span class="pill info">${h.label()}</span></div>
                <blockquote>“${e.quote}”</blockquote>
                ${e.asks === 'imprimir' ? '<div class="ask"><span class="pill warn">Pide que el BCR imprima dinero</span></div>' : ''}
              </section>
              <section class="card" id="choices">
                <h3>¿Qué hace el BCR con el pedido del Tesoro? ${help('emision')}</h3>
                <div class="hchoices"></div>
                <div class="tool">
                  <div><strong>${HYPER_TOOL.name}</strong><small>${HYPER_TOOL.desc}</small></div>
                  <button class="btn" data-tool ${h.toolLeft > 0 ? '' : 'disabled'}>${h.toolLeft > 0 ? 'Activar' : 'Activado'}</button>
                </div>
              </section>
              ${peoplePanel(lastPeople, { regions: lastRegions, empty: 'Tras el paquetazo, la gente está angustiada. Aquí verás cómo vive cada sector tus decisiones.' })}
            </div>
            <div class="col">
              <section class="card" id="projection">
                <h3>Inflación mensual <span class="sub">Agosto 1990 (Fujishock): 397%</span></h3>
                <div class="hchart">${monthly.length
                    ? compareChart({ labels: h.chapter.labels.slice(0, monthly.length).map(shortLabel), band: false, series: [{ values: monthly, color: 'var(--navy)', label: 'Inflación del mes' }] })
                    : '<p class="empty-chart">Aquí verás la inflación de cada mes. En agosto fue de 397%: los precios casi se quintuplicaron en treinta días.</p>'}</div>
              </section>
              <section class="card decision" id="decision"></section>
            </div>
          </div>
        </main>`;
        root.querySelector('[data-exit]').addEventListener('click', () => { cleanup(); closeModal(); onExit(); });
        root.querySelector('[data-glossary]').addEventListener('click', () => openGlossary());
        root.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', () => openGlossary(b.dataset.term)));
        root.querySelector('[data-tool]').addEventListener('click', () => { if (h.useTool()) { music.sting(); render(); } });
        bindMusicButton(root);
        bindPeople(root);
        updateChoices();
        music.setMood('decision');
        timer.start();
    };

    const updateChoices = () => {
        root.querySelector('.hchoices').innerHTML = HYPER_CHOICES.map(c => {
            const p = h.project(c.id);
            return `<button class="advisor hchoice${c.id === choice ? ' on' : ''} ${c.id}" data-choice="${c.id}">
              <span class="adv-top"><strong>${c.name}</strong><span class="adv-move num ${p <= 10 ? 'txt-good' : p >= 40 ? 'txt-bad' : ''}">~${pct(p)}</span></span>
              <small>Inflación esperada el próximo mes · tensión social ${c.social > 0 ? '+' : ''}${c.social}</small>
              <span class="adv-why">${c.text}</span>
              <span class="tradeoff"><span><strong>Gana:</strong> ${c.win}</span><span><strong>Pierde:</strong> ${c.lose}</span></span>
            </button>`;
        }).join('');
        root.querySelectorAll('[data-choice]').forEach(b => b.addEventListener('click', () => { choice = b.dataset.choice; music.click(); updateChoices(); }));
        const c = HYPER_CHOICES.find(x => x.id === choice);
        root.querySelector('#decision').innerHTML = `
          <div class="current"><div><div class="from">Tu decisión</div><div class="big" style="font-size:24px">${c ? c.name : 'Elige una opción'}</div></div></div>
          <div class="decision-actions">
            ${diff.timer ? '<div class="timer-slot"></div>' : ''}
            <span class="press-hint">${c ? `Emisión: ${c.emission}% en el mes · credibilidad ${c.credibility > 0 ? '+' : ''}${c.credibility}` : 'Compara la inflación esperada y la tensión social de cada opción.'}</span>
            <button class="btn btn-primary" data-announce ${c ? '' : 'disabled'}>Anunciar decisión <span class="kbd">Enter</span></button>
          </div>`;
        root.querySelector('[data-announce]').addEventListener('click', () => announce());
        timer.mount(root.querySelector('#decision'));
    };

    const announce = async ({ timeout = false } = {}) => {
        if (busy || !choice) return;
        busy = true;
        timer.stop();
        const c = HYPER_CHOICES.find(x => x.id === choice);
        await announceSuspense(timeout
            ? `Se acabó el tiempo. Sin una decisión, el BCR sigue como venía: ${c.name.toLowerCase()}…`
            : `El BCR comunica su decisión: ${c.name.toLowerCase()}…`);
        const rec = h.decide(choice);
        rec.timeout = timeout;
        lastChoice = choice;
        lastPeople = rec.people;
        lastRegions = rec.regions;
        choice = null;
        const reveal = () => { if (!h.isOver) render(); showNewspaper(rec); busy = false; };
        if (rec.surprise) showBreaking(rec.surprise, { onClose: reveal });
        else reveal();
    };

    const showNewspaper = rec => {
        const good = rec.state.inflation < rec.prev.inflation && rec.state.social < 85;
        music.setMood(good ? 'good' : 'bad');
        const modal = openModal(`
          <div class="paper">
            <div class="masthead"><span>DIARIO LA MONEDA</span><span>${rec.label}</span></div>
            ${andeanBand}
            <h2 class="paper-head">${rec.headline}</h2>
            <p class="paper-sub">Decisión del BCR: ${rec.choice.name.toLowerCase()}.</p>
          </div>
          <div class="reveal">
            <div class="reveal-num"><small>Inflación del mes</small><span class="num" data-anim-from="${rec.prev.inflation}" data-anim-to="${rec.state.inflation}" data-good="${rec.state.inflation <= 10}">${pct(rec.prev.inflation)}</span></div>
            <p class="reveal-note">Esperabas ~${pct(rec.projected)}. En la historia real, ${rec.label} cerró con ${pct(rec.real)} de inflación mensual.</p>
          </div>
          <div class="deltas">
            <span class="delta">Credibilidad <strong class="num">${Math.round(rec.state.credibility)}</strong></span>
            <span class="delta ${rec.state.social > rec.prev.social ? 'up-bad' : 'up-good'}">Tensión social <strong class="num">${Math.round(rec.state.social)}</strong></span>
            <span class="delta">Actividad <strong class="num">${pct(rec.state.activity)}</strong></span>
            <span class="delta">Emisión <strong class="num">${rec.choice.emission}%</strong></span>
          </div>
          ${tabs([
            { key: 'resumen', label: 'Resumen', html: `
              ${rec.timeout ? '<div class="note warn">Se acabó el tiempo: no decidir también es decidir. El BCR siguió haciendo lo mismo de antes.</div>' : ''}
              ${rec.notes.map(n => `<div class="note ${n.tone}">${n.text}</div>`).join('')}
              ${!rec.notes.length && !rec.timeout ? '<p class="quiet">Revisa cómo vivió la gente este mes y cómo está cada región.</p>' : ''}` },
            { key: 'gente', label: 'La gente', badge: hurtCount(rec.people) || null, html: sectorsReport(rec.people) },
            { key: 'regiones', label: 'Regiones', html: regionsReport(rec.regions) }
          ])}
          <div class="modal-actions"><button class="btn btn-primary" data-continue>${h.isOver ? 'Ver el veredicto' : 'Siguiente mes'}</button></div>
        `, { dismissible: false });
        animateNumber(modal.querySelector('[data-anim-to]'));
        bindTabs(modal);
        bindMap(modal);
        modal.querySelector('[data-continue]').addEventListener('click', () => {
            modal.parentElement._close();
            if (h.isOver) {
                cleanup();
                const r = h.evaluate();
                music.setMood(r.passed ? 'victory' : 'defeat');
                onFinish(h, r);
            } else music.setMood('decision');
        });
    };

    render();
}

/** Veredicto del capítulo 1990, con la trayectoria real mes a mes. */
export function renderHyperVerdict(root, h, r, { actions }) {
    const ch = h.chapter;
    const n = h.history.length - 1;
    const over = r.gameOver === 'estallido'
        ? ['Estallido social', 'Paros y saqueos obligan a cambiar el rumbo. Frenar la inflación exige cuidar a los que más sufren el ajuste.']
        : r.gameOver === 'hiper'
            ? ['Vuelve la hiperinflación', 'Seguir imprimiendo dinero para el Estado reavivó la espiral de precios.']
            : null;
    const title = over ? over[0] : r.passed ? '¡Se quebró la hiperinflación!' : 'La inflación sigue sin control';
    const text = over ? over[1] : r.passed
        ? `La inflación mensual terminó en ${pct(r.final.inflation)}. Cortar la emisión para el Estado rompió la espiral, pero el ajuste lo pagaron primero los que menos tenían.`
        : `La inflación mensual terminó en ${pct(r.final.inflation)}. Mientras el BCR financie al Estado, los precios no se detienen.`;
    const confetti = r.passed ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 36 }, () => `<i style="left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},70%,55%);animation-delay:${Math.random() * 0.8}s;animation-duration:${2 + Math.random() * 1.5}s"></i>`).join('') + '</div>' : '';
    root.innerHTML = `
    <header class="topbar"><div class="brand">${logo}<span>Guardián de la Estabilidad</span></div><div class="spacer"></div>${musicButton()}</header>
    <div class="andean-strip">${andeanBand}</div>
    <main class="page" style="max-width:900px">
      <section class="card verdict ${r.passed ? 'win' : 'lose'}">
        ${confetti}
        <div class="paper"><div class="masthead"><span>DIARIO LA MONEDA</span><span>Edición especial</span></div>${andeanBand}
          <h1 class="paper-head big">${title}</h1><p class="paper-sub">${text}</p></div>
        <div class="section-title">Objetivos</div>
        <ul class="goals">${r.checks.map(c => `<li><span class="mark ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'}</span><span>${c.label}</span><span class="val num">${c.value}</span></li>`).join('')}</ul>
        <div class="section-title">Tu recorrido vs. la historia real</div>
        <div class="chart">${compareChart({
            labels: ch.labels.slice(0, n).map(shortLabel), band: false, title: 'Inflación mensual (%)',
            series: [
                { values: h.history.slice(1).map(x => x.state.inflation), color: 'var(--navy)', label: 'Tu inflación mensual' },
                { values: ch.realMonthly.slice(0, n), color: 'var(--red)', label: 'Inflación real', dash: true }
            ]
        })}</div>
        ${peopleBalance(h.peopleHistory, h.regionHistory)}
        <div class="section-title">Lo que pasó en la realidad</div>
        <p class="reality">${ch.reality}</p>
        <details class="sources"><summary>Fuentes</summary><ul>${ch.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ul></details>
        <div class="modal-actions">${actions.map(a => `<button class="btn ${a.primary ? 'btn-primary' : ''}" data-action="${a.id}">${a.label}</button>`).join('')}</div>
      </section>
    </main>`;
    bindMusicButton(root);
        bindPeople(root);
    root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', actions.find(a => a.id === b.dataset.action).run));
    window.scrollTo({ top: 0 });
}
