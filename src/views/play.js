import Mandate, { FX_MOVES, expectedDepreciation, CONGRESS, GUIDANCE, GUIDANCE_RULES } from '../game/mandate.js';
import { CHARACTERS } from '../model/events.js';
import { PARAMS, inBand } from '../model/economy.js';
import { fanChart, compareChart } from './fanChart.js';
import { logo, andeanBand } from './art.js';
import { openModal, modalOpen, closeModal } from './modal.js';
import { openGlossary } from './glossary.js';
import { coach } from './coach.js';
import { music, musicButton, bindMusicButton } from '../audio/music.js';
import { getSettings, DIFFICULTIES, getFlag, setFlag } from '../storage.js';
import { rateTradeoff } from '../game/people.js';
import { congressMood, BILL_RESPONSES, ANSWER_EFFECTS, BILLS } from '../model/congress.js';
import { face } from './people.js';
import { peoplePanel, sectorsReport, regionsReport, peopleBalance, bindPeople, hurtCount } from './people.js';
import { tabs, bindTabs } from './tabs.js';
import { bindMap } from './peruMap.js';
import { icon, KIND_ICON, hawk, dove, bust, congressScene } from './icons.js';

const pct = (v, d = 1) => `${v.toFixed(d)}%`;
const moveLabel = m => m === 0 ? '=' : `${m > 0 ? '+' : '−'}${Math.abs(m).toFixed(2)}`;
const help = term => `<button class="help" data-term="${term}" aria-label="¿Qué es esto?">?</button>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

export const GAME_OVER = {
    presion: { title: 'El Congreso busca remover al Directorio', text: 'Con el Congreso en tu contra, se acusa al Directorio de "falta grave", la única causa por la que la Constitución permite removerlo. Sin respaldo político, la autonomía se vuelve frágil.' },
    credibilidad: { title: 'Crisis de confianza en el BCR', text: 'Nadie cree que la inflación vaya a volver a la meta. Sin credibilidad, las expectativas se desanclan.' },
    inflacion: { title: 'La inflación se descontrola', text: 'Los peruanos recuerdan bien lo que pasa cuando los precios se desbocan. Esta vez no hubo freno a tiempo.' },
    recesion: { title: 'Recesión profunda', text: 'La economía se contrajo con fuerza. Frenar la inflación a costa del empleo también es fracasar.' }
};

/** Medidor con zona sana; `pos`, `zone` y `danger` en 0–1 sobre la escala. */
function meter({ id, label, term, ico, display, pos, zone, danger, tone, sub }) {
    return `
    <div class="meter ${tone}" id="${id}">
      <div class="meter-top"><span class="kpi-label"><span class="meter-ico">${icon(ico, { size: 16 })}</span>${label} ${help(term)}</span><strong class="meter-val num">${display}</strong></div>
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
            id: 'm-infl', label: 'Inflación', term: 'inflacion', ico: 'cart', display: pct(s.inflation),
            pos: inflScale(s.inflation), zone: [inflScale(PARAMS.bandMin), inflScale(PARAMS.bandMax)],
            tone: inBand(s.inflation) ? 'good' : 'bad', sub: `Meta 1%–3% · pierdes sobre ${L.inflation}%`
        }),
        meter({
            id: 'm-growth', label: 'Crecimiento PBI', term: 'pbi', ico: 'factory', display: pct(s.growth),
            pos: growthScale(s.growth), zone: [growthScale(healthy[0]), growthScale(healthy[1])],
            tone: s.growth < 0 ? 'bad' : s.growth < healthy[0] || s.growth > healthy[1] + 1 ? 'warn' : 'good',
            sub: `Potencial ~${pct(m.params.potentialGrowth)}${L.growth > -12 ? ` · pierdes bajo ${L.growth}%` : ''}`
        }),
        meter({
            id: 'm-cred', label: 'Credibilidad', term: 'credibilidad', ico: 'handshake', display: `${Math.round(s.credibility)}`,
            pos: s.credibility / 100, danger: [0, L.credibility / 100],
            tone: s.credibility >= 60 ? 'good' : s.credibility >= 35 ? 'warn' : 'bad', sub: `Expectativas: ${pct(s.expectations)} · pierdes bajo ${L.credibility}`
        }),
        meter({
            id: 'm-press', label: 'Congreso', term: 'autonomia', ico: 'congress',
            display: `<span class="congress-val">${face(congressMood(m.pressure).mood, 26)}${congressMood(m.pressure).label}</span>`,
            pos: m.pressure / 100, danger: [0.8, 1],
            tone: m.pressure < 50 ? 'good' : m.pressure < 80 ? 'warn' : 'bad',
            sub: `Enojo ${Math.round(m.pressure)}/100${m.scenario.citations ? ` · te cita desde ${CONGRESS.citeAt}` : ''} · pierdes en 100`
        }),
        ...(m.fx ? [meter({
            id: 'm-fx', label: 'Dólar', term: 'intervencion', ico: 'dollar', display: `S/ ${m.fx.rate.toFixed(3)}`,
            pos: m.fx.reserves / (m.fx.initialReserves * 1.3), danger: [0, 0.3 / 1.3],
            tone: Math.abs(m.fx.lastDep) < 2 && m.fx.reserves > 0.5 * m.fx.initialReserves ? 'good' : Math.abs(m.fx.lastDep) < 4 ? 'warn' : 'bad',
            sub: `Reservas US$ ${m.fx.reserves.toFixed(1)} mil M${m.fx.lastDep ? ` · ${m.fx.lastDep > 0 ? '▲' : '▼'} ${Math.abs(m.fx.lastDep).toFixed(1)}% el trimestre` : ''}`
        })] : [])
    ].join('');
}

export function avatar(who) {
    const c = CHARACTERS[who] ?? CHARACTERS.analista;
    return `<span class="avatar" style="--c:${c.color}" title="${c.name}">${bust(who in CHARACTERS ? who : 'analista', c.color, 52)}</span>`;
}

function eventCard(e) {
    const c = CHARACTERS[e.who] ?? CHARACTERS.analista;
    const ask = e.asks === 'bajar'
        ? `<span class="pill warn">Pide bajar la tasa</span><span class="ask-hint">Si la subes: +${Math.round(e.pressure * CONGRESS.askWeight)} de presión</span>`
        : e.asks === 'subir'
            ? '<span class="pill bad">Pide actuar contra la inflación</span><span class="ask-hint">Si no subes con inflación alta: −credibilidad</span>'
            : '';
    const kind = { demanda: 'Choque de demanda', oferta: 'Choque de oferta', politica: 'Presión política', externo: 'Choque externo', calma: 'Sin sobresaltos' }[e.kind] ?? 'Coyuntura';
    return `
    <section class="card event kind-${e.kind ?? 'calma'}" id="event">
      <div class="event-head">${avatar(e.who)}<div><small>${c.name}</small><h3>${e.title}</h3></div><span class="pill info">${icon(KIND_ICON[e.kind] ?? 'globe', { size: 14 })}${kind}</span></div>
      <blockquote class="bubble">“${e.quote}”</blockquote>
      ${ask ? `<div class="ask">${ask}</div>` : ''}
    </section>`;
}

function advisorCard(kind, a, selected) {
    const name = kind === 'hawk' ? 'Consejero Halcón' : 'Consejera Paloma';
    const tag = kind === 'hawk' ? 'Prioriza la inflación' : 'Prioriza el empleo';
    const on = Math.abs(a.move - selected) < 1e-9;
    return `
    <button class="advisor ${kind}${on ? ' on' : ''}" data-follow="${a.move}">
      <span class="adv-top"><span class="adv-bird">${kind === 'hawk' ? hawk : dove}</span><span class="adv-name"><strong>${name}</strong><small>${tag}</small></span><span class="adv-move num">${moveLabel(a.move)}</span></span>
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

/** Franja fija: quién eres y qué tienes que lograr. */
function missionBar(m, opts) {
    const goals = m.scenario.goals
        ? m.scenario.goals.map(g => g.label ?? ({ finalInBand: 'terminar con la inflación entre 1% y 3%' }[g.type] ?? '')).filter(Boolean)
        : [`inflación entre 1% y 3% (${m.scenario.reappoint?.minInBand ?? 9} de ${m.turns} trimestres y al final)`, 'sin hundir la economía', 'que el Congreso no te saque'];
    return `
    <div class="mission" role="note">
      <span class="mission-role"><span class="mission-ico">${icon('user', { size: 16 })}</span><strong>Tú diriges el BCR.</strong> Decides la tasa${m.fx ? ' y cuándo vender o comprar dólares' : ''}.</span>
      <span class="mission-goal"><span class="mission-ico">${icon('target', { size: 16 })}</span><strong>Tu objetivo:</strong> ${goals.map(g => g.charAt(0).toLowerCase() + g.slice(1)).join(' · ')}.</span>
    </div>`;
}

const FX_LABEL = { 3: 'Vender 3', 1.5: 'Vender 1.5', 0: 'No intervenir', '-1.5': 'Comprar 1.5', '-3': 'Comprar 3' };

/** Bloque del mercado cambiario en la tarjeta de decisión. */
function fxBlock(m, move, sell, diff) {
    const pressure = m.fxPressure();
    const dep = expectedDepreciation(pressure, move, sell);
    const newRate = m.fx.rate * (1 + dep / 100);
    const reserves = m.fx.reserves - sell;
    const max = m.maxSale();
    const tone = diff.hints ? (Math.abs(dep) < 2 ? 'txt-good' : 'txt-bad') : '';
    return `
      <div class="fx-block">
        <div class="fx-head"><strong>Mercado cambiario ${help('intervencion')}</strong>
          <span>Presión sobre el dólar este trimestre: <strong class="num">${pressure > 0 ? '+' : ''}${pressure.toFixed(1)}%</strong></span></div>
        <div class="steps" style="grid-template-columns:repeat(${FX_MOVES.length},1fr)" role="radiogroup" aria-label="Intervención cambiaria">
          ${FX_MOVES.map(v => `<button role="radio" aria-checked="${v === sell}" class="${v === sell ? 'on' : ''}" data-sell="${v}" ${v > max + 1e-9 ? 'disabled' : ''}>${FX_LABEL[v]}<small>${v === 0 ? 'US$' : 'mil M US$'}</small></button>`).join('')}
        </div>
        <div class="fx-out">Dólar esperado: <strong class="num ${tone}">S/ ${newRate.toFixed(3)}</strong> (${dep >= 0 ? '+' : ''}${dep.toFixed(1)}%) · reservas quedarían en <strong class="num">US$ ${reserves.toFixed(1)} mil M</strong></div>
      </div>`;
}

/** Quién gana y quién pierde con la intervención cambiaria. */
function fxTradeoff(sell) {
    if (sell > 0) return { win: 'Quienes deben en dólares y quienes compran importados.', lose: 'Las reservas: quedan menos para la próxima crisis.', winWho: ['deudoresUsd', 'importadores'], loseWho: ['reservas'] };
    if (sell < 0) return { win: 'Exportadores y el colchón de reservas.', lose: 'Quienes deben en dólares: el dólar sube un poco más.', winWho: ['exportadores', 'reservas'], loseWho: ['deudoresUsd'] };
    return { win: 'Nadie en particular: el mercado decide.', lose: 'Si hay presión, el dólar se mueve sin freno.', winWho: [], loseWho: [] };
}

/** Recuadro de resultado tras el Congreso: ícono, valor nuevo y cuánto cambió. */
function congressDelta(ico, label, before, after, goodWhenUp) {
    const d = Math.round(after) - Math.round(before);
    const tone = d === 0 ? '' : (d > 0) === goodWhenUp ? 'good' : 'bad';
    return `<span class="delta cdelta ${tone}"><span class="cd-ico">${icon(ico, { size: 18 })}</span><span>${label}<strong class="num">${Math.round(after)}${d ? ` <em>${d > 0 ? '+' : ''}${d}</em>` : ''}</strong><small>antes ${Math.round(before)}</small></span></span>`;
}

/** Ícono del tema de cada proyecto de ley. */
const BILL_ICON = { 'retiro-afp': 'piggy', 'topes-tasas': 'percent', 'oro-bcr': 'gold', 'usar-reservas': 'vault' };

/** Etiqueta "hecho real" que despliega la fuente del episodio (menos texto a la vista). */
const realChip = (label, detail) => `
    <details class="real-chip"><summary>${icon('pin', { size: 13 })}${label}</summary><p>${detail}</p></details>`;

/** Pistas (modo fácil) como fichas con ícono: qué pasa con el Congreso y la credibilidad. */
function effectChips({ pressure = 0, credibility = 0, extra = '' }) {
    const chip = (ico, label, v, goodWhenUp) => v ? `<span class="fx-chip ${(v > 0) === goodWhenUp ? 'good' : 'bad'}">${icon(ico, { size: 13 })}${label} ${v > 0 ? '▲' : '▼'}</span>` : '';
    return `<span class="fx-chips">${chip('congress', 'Enojo', pressure, false)}${chip('handshake', 'Credibilidad', credibility, true)}${extra ? `<span class="fx-chip warn">${extra}</span>` : ''}</span>`;
}

/** El comunicado: tres tonos con su efecto inmediato y lo que comprometen para el próximo turno. */
function guidanceBlock(m, move, tone, diff) {
    const prev = m.guidance;
    const broken = m.breaksGuidance(move);
    const commit = { halcon: 'Te compromete: no bajar la tasa el próximo turno', neutral: 'No te compromete a nada', paloma: 'Te compromete: no subir la tasa el próximo turno' };
    const chips = {
        halcon: [['Expectativas', -1, true], ['Dólar', -1, true], ['Mypes y deudores', -1, false], ['Enojo', 1, false]],
        neutral: [],
        paloma: [['Expectativas', 1, false], ['Mypes y deudores', 1, true], ['Enojo', -1, true]]
    };
    const ico = { halcon: 'up', neutral: 'equal', paloma: 'down' };
    return `
      <div class="guidance">
        <div class="fx-head"><strong>${icon('megaphone', { size: 16 })} Comunicado ${help('comunicado')}</strong>
          <span>Pesa más con más credibilidad (${Math.round(m.state.credibility)})</span></div>
        ${prev ? `<div class="guidance-prev ${broken ? 'bad' : ''}">${broken
            ? `Tu comunicado anterior fue <strong>${GUIDANCE[prev].label.toLowerCase()}</strong>: con esta tasa romperás tu palabra (−${GUIDANCE_RULES.broken} de credibilidad y el dólar salta).`
            : `Tu comunicado anterior fue <strong>${GUIDANCE[prev].label.toLowerCase()}</strong>. ${(prev === 'halcon' && move > 0) || (prev === 'paloma' && move < 0) ? `Cumplirlo suma +${GUIDANCE_RULES.kept} de credibilidad.` : 'Cuidado con contradecirlo.'}`}</div>` : ''}
        <div class="tones" role="radiogroup" aria-label="Tono del comunicado">${Object.entries(GUIDANCE).map(([id, g]) => `
          <button role="radio" aria-checked="${id === tone}" class="tone ${id}${id === tone ? ' on' : ''}" data-tone="${id}">
            <span class="tone-top">${icon(ico[id], { size: 14 })}<strong>${g.label}</strong></span>
            <span class="tone-phrase">«${g.phrase}»</span>
            ${diff.hints && chips[id].length ? `<span class="fx-chips">${chips[id].map(([l, d, good]) => `<span class="fx-chip ${good ? 'good' : 'bad'}">${l} ${d > 0 ? '▲' : '▼'}</span>`).join('')}</span>` : ''}
            <small>${commit[id]}</small>
          </button>`).join('')}
        </div>
      </div>`;
}

/** Las cuatro secciones del turno. */
const SECTIONS = [
    { id: 'noticias', ico: 'megaphone', kicker: 'Qué pasó', title: 'Noticias y gente' },
    { id: 'estado', ico: 'congress', kicker: 'Qué te piden', title: 'El Estado' },
    { id: 'directorio', ico: 'chat', kicker: 'Qué opinan', title: 'El Directorio' },
    { id: 'anuncio', ico: 'gavel', kicker: 'Qué decides', title: 'El anuncio' }
];

/** Grupos del cuadro "quién gana y quién pierde": ícono y nombre corto. */
const GROUPS = {
    ahorristas: ['piggy', 'Ahorristas'], jubilados: ['elder', 'Jubilados'], familias: ['home', 'Familias'],
    deudores: ['card', 'Deudores'], mypes: ['store', 'Mypes'], empleo: ['briefcase', 'Empleo'],
    deudoresUsd: ['card', 'Deudores en US$'], importadores: ['box', 'Importadores'],
    exportadores: ['ship', 'Exportadores'], reservas: ['vault', 'Reservas']
};
const groupChips = (ids, side) => ids.length
    ? `<span class="tt-chips">${ids.map(id => `<span class="tt-chip ${side}" title="${GROUPS[id][1]}">${icon(GROUPS[id][0], { size: 15 })}<small>${GROUPS[id][1]}</small></span>`).join('')}</span>`
    : `<span class="tt-chips"><span class="tt-chip none">${icon('equal', { size: 15 })}<small>Sin cambio</small></span></span>`;

/** Un solo cuadro de "quién gana y quién pierde": una fila por decisión. */
function tradeoffTable(move, sell, withFx) {
    const rows = [['Tasa', rateTradeoff(move)], ...(withFx ? [['Dólares', fxTradeoff(sell)]] : [])];
    return `
      <div class="tradeoff-table" role="table" aria-label="Quién gana y quién pierde">
        <div class="tt-head" role="row"><span></span><span>${face(1, 20)}Ganan</span><span>${face(-1, 20)}Pierden</span></div>
        ${rows.map(([k, t]) => `<div class="tt-row" role="row"><strong>${k}</strong>
          <span>${groupChips(t.winWho, 'win')}${t.win}</span>
          <span>${groupChips(t.loseWho, 'lose')}${t.lose}</span></div>`).join('')}
      </div>`;
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
    let shownRate = null;   // para animar el número cuando cambia la tasa elegida
    let tone = 'neutral';   // el comunicado del turno
    let sell = 0; // intervención cambiaria del turno (US$ miles de millones; positivo = vender)
    let busy = false;
    let lastPeople = null;
    let lastRegions = null;
    const timer = createTimer(diff.timer, () => { move = 0; sell = 0; announce({ timeout: true }); }, () => busy);

    const onKey = e => {
        if (modalOpen() || busy) return;
        if (m.fx && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            const i = FX_MOVES.indexOf(sell) + (e.key === 'ArrowDown' ? 1 : -1);
            if (i >= 0 && i < FX_MOVES.length && FX_MOVES[i] <= m.maxSale() + 1e-9) { sell = FX_MOVES[i]; updateDecision(); }
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const i = m.moves.indexOf(move) + (e.key === 'ArrowRight' ? 1 : -1);
            if (i >= 0 && i < m.moves.length) { move = m.moves[i]; updateDecision(); }
            e.preventDefault();
        } else if (/^[1-4]$/.test(e.key) && !e.target.closest('input, textarea')) {
            goTo(SECTIONS[Number(e.key) - 1].id);
        } else if (e.key === 'Enter' && !e.target.closest('button')) {
            announce();
        }
    };
    document.addEventListener('keydown', onKey);
    const cleanup = () => { document.removeEventListener('keydown', onKey); timer.stop(); };
    const exit = () => { cleanup(); closeModal(); opts.onExit(); };

    // El turno se recorre en cuatro secciones, en el orden en que piensa el Directorio.
    let section = 'noticias';
    let seen = new Set(['noticias']);
    let lastRec = null;

    const sectionSummary = id => {
        if (id === 'noticias') return m.event.title;
        if (id === 'estado') {
            const asks = m.event.asks === 'bajar' ? ' · te piden bajar la tasa' : '';
            return `Congreso ${congressMood(m.pressure).label.toLowerCase()}${asks}${m.congress.promise ? ' · promesa vigente' : ''}`;
        }
        if (id === 'directorio') {
            const a = m.advisors();
            return `Halcón ${moveLabel(a.hawk.move)} · Paloma ${moveLabel(a.dove.move)}`;
        }
        return `Tasa actual ${pct(m.state.rate, 2)}${m.guidance ? ` · comunicado previo: ${GUIDANCE[m.guidance].label.toLowerCase()}` : ''}`;
    };

    const panelNext = next => {
        const sec = SECTIONS.find(x => x.id === next);
        return `<div class="panel-next">
            ${next !== 'anuncio' ? '<button class="btn btn-ghost" data-goto="anuncio">Ir directo al anuncio</button>' : ''}
            <button class="btn btn-primary" data-goto="${next}">Siguiente: ${sec.title} ${icon('down', { size: 16 })}</button>
          </div>`;
    };

    const goTo = id => {
        section = id;
        seen.add(id);
        root.querySelectorAll('[data-panel]').forEach(p => { p.hidden = p.dataset.panel !== id; });
        root.querySelectorAll('[data-goto][role="tab"]').forEach(b => {
            const on = b.dataset.goto === id;
            b.classList.toggle('on', on);
            b.setAttribute('aria-selected', on);
            if (seen.has(b.dataset.goto)) b.classList.remove('unseen');
        });
        const nav = root.querySelector('.turn-nav');
        if (nav && nav.getBoundingClientRect().top < 0) nav.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };

    /** Sección "El Estado": cómo está el Congreso y qué pide el Gobierno. */
    const statePanel = () => {
        const cm = congressMood(m.pressure);
        const laws = m.effects.filter(e => BILLS.some(b => b.id === e.id)).map(e => BILLS.find(b => b.id === e.id));
        const ministro = CHARACTERS.ministro;
        const gov = m.event.who === 'ministro'
            ? `<blockquote class="bubble">“${m.event.quote}”</blockquote>${m.event.asks === 'bajar' ? `<p class="state-ask">${icon('down', { size: 14 })}Pide bajar la tasa. Si la subes: +${Math.round(m.event.pressure * CONGRESS.askWeight)} de enojo en el Congreso.</p>` : ''}`
            : m.event.asks === 'bajar'
                ? `<p>El Gobierno respalda el pedido de ${(CHARACTERS[m.event.who] ?? CHARACTERS.analista).name.toLowerCase()}: quiere una tasa más baja.</p>`
                : '<p>Este trimestre el MEF no hace pedidos al BCR. Recuerda: el BCR es autónomo y no recibe órdenes del Gobierno.</p>';
        return `
        <div class="mandate-grid">
          <section class="card state-card" id="congress-card">
            <h3><span class="h-ico cg">${icon('congress', { size: 16 })}</span>El Congreso ${help('autonomia')}</h3>
            <div class="cg-mood">${face(cm.mood, 64)}
              <div class="cg-body"><strong>${cm.label}</strong>
                <div class="meter-track"><span class="meter-danger" style="left:80%;width:20%"></span><span class="meter-fill cg-fill" style="width:${m.pressure}%"></span></div>
                <small>Enojo ${Math.round(m.pressure)}/100${m.scenario.citations ? ` · te cita desde ${CONGRESS.citeAt}` : ''} · en 100 piden tu salida</small>
              </div>
            </div>
            ${lastRec?.declaration ? `<blockquote class="bubble cg-quote">“${lastRec.declaration.text}”<cite>Frase real de un congresista (${lastRec.declaration.year}, ${lastRec.declaration.context})</cite></blockquote>` : '<p class="quiet">Por ahora no hay declaraciones nuevas. No te confíes.</p>'}
            ${m.congress.promise ? '<div class="promise-banner">Prometiste al Congreso <strong>no subir la tasa</strong> este trimestre.</div>' : ''}
            ${laws.length ? `<div class="laws"><small>Leyes en vigor que afectan la economía</small>${laws.map(b => `<span class="law">${icon(BILL_ICON[b.id] ?? 'scroll', { size: 14 })}${b.title.replace(/^Proyecto de ley: /, '')}</span>`).join('')}</div>` : ''}
          </section>
          <section class="card state-card">
            <h3><span class="h-ico">${icon('scroll', { size: 16 })}</span>El Gobierno (MEF)</h3>
            <div class="gov">${avatar('ministro')}<div><small>${ministro.name}</small>${gov}</div></div>
          </section>
        </div>`;
    };

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
        ${missionBar(m, opts)}
        <main class="page mandate ${diff.hints ? 'hints-on' : 'hints-off'}">
          <div class="meters${m.fx ? ' five' : ''}">${meters(m)}</div>
          <nav class="turn-nav" role="tablist" aria-label="Secciones del turno">${SECTIONS.map((sec, i) => `
            <button role="tab" data-goto="${sec.id}" aria-selected="${sec.id === section}" class="${sec.id === section ? 'on' : ''}${seen.has(sec.id) ? '' : ' unseen'}">
              <span class="tn-ico">${icon(sec.ico, { size: 20 })}</span>
              <span class="tn-text"><small>${i + 1} · ${sec.kicker}</small><strong>${sec.title}</strong><span class="tn-sum">${sectionSummary(sec.id)}</span></span>
            </button>`).join('')}
          </nav>
          <section class="turn-panel" data-panel="noticias" ${section === 'noticias' ? '' : 'hidden'}>
            <div class="mandate-grid">
              <div class="col">
                ${tip ? `<div class="tip"><strong>Consejo:</strong> ${tip}</div>` : ''}
                ${eventCard(m.event)}
                ${lastRec ? `<section class="card last-paper"><h3><span class="h-ico">${icon('book', { size: 16 })}</span>El diario del trimestre pasado</h3><p class="lp-head">${lastRec.headline}</p></section>` : ''}
              </div>
              <div class="col">${peoplePanel(lastPeople, { regions: lastRegions })}</div>
            </div>
            ${panelNext('estado')}
          </section>
          <section class="turn-panel" data-panel="estado" ${section === 'estado' ? '' : 'hidden'}>
            ${statePanel()}
            ${panelNext('directorio')}
          </section>
          <section class="turn-panel" data-panel="directorio" ${section === 'directorio' ? '' : 'hidden'}>
            <div class="mandate-grid">
              <section class="card" id="debate">
                <h3><span class="h-ico">${icon('chat', { size: 16 })}</span>Debate del Directorio <span class="sub">Toca una propuesta para seguirla</span></h3>
                <div class="advisors"></div>
              </section>
              <section class="card" id="projection">
                <h3><span class="h-ico">${icon('telescope', { size: 16 })}</span>Inflación y proyección a un año <span class="sub">Según la tasa que elijas</span></h3>
                <div class="fan"></div>
              </section>
            </div>
            ${panelNext('anuncio')}
          </section>
          <section class="turn-panel" data-panel="anuncio" ${section === 'anuncio' ? '' : 'hidden'}>
            <div class="mandate-grid announce-grid">
              <section class="card decision" id="decision"></section>
              <section class="card mini-fan">
                <h3><span class="h-ico">${icon('telescope', { size: 16 })}</span>Así se vería la inflación</h3>
                <div class="fan"></div>
              </section>
            </div>
          </section>
        </main>`;
        root.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { goTo(b.dataset.goto); music.click(); }));
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
        // Si el Congreso te citó, la sesión va antes de la reunión del Directorio.
        if (m.congress.pending) return showCitation();
        if (m.congress.pendingBill) return showBill();
        const steps = opts.coachSteps?.briefing?.[m.quarter];
        if (steps) coach(steps(m));
        timer.start();
    };

    const showBill = () => {
        const b = m.congress.pendingBill;
        const icons = ['megaphone', 'handshake', 'mute'];
        music.setMood('surprise');
        music.sting();
        const modal = openModal(`
          <div class="citation bill">
            <div class="cite-hero">
              ${congressScene(BILL_ICON[b.id] ?? 'scroll', { angry: m.pressure >= CONGRESS.insistAt })}
              <div>
                <div class="breaking-tag">PROYECTO DE LEY</div>
                <h2>${b.title.replace(/^Proyecto de ley: (.)/, (_, c) => c.toUpperCase())}</h2>
                ${realChip(`Hecho real · ${b.year}`, b.basis)}
              </div>
            </div>
            <p class="bill-text">${b.text}</p>
            <p class="cite-ask">${icon('gavel', { size: 16 })}El BCR no vota las leyes, pero su opinión pesa. ¿Qué haces?</p>
            <div class="answers">${BILL_RESPONSES.map((r, i) => `
              <button class="answer" data-bill="${i}">
                <span class="ans-ico ${r.style}">${icon(icons[i], { size: 22 })}</span>
                <span class="ans-body"><strong>${r.label}</strong><span>${r.text}</span>
                ${diff.hints ? effectChips({ pressure: r.pressure, credibility: r.credibility, extra: ['', 'El proyecto pasa a medias', 'El proyecto pasa completo'][i] }) : ''}</span>
              </button>`).join('')}
            </div>
          </div>`, { dismissible: false, wide: true });
        modal.querySelectorAll('[data-bill]').forEach(btn => btn.addEventListener('click', () => {
            const r = m.answerBill(Number(btn.dataset.bill));
            music.setMood(r.passed ? 'bad' : 'good');
            const outcome = !r.passed ? 'El proyecto se archivó. Esta vez ganó el argumento técnico.'
                : r.insisted ? 'Te opusiste, pero el Congreso estaba tan molesto que lo aprobó por insistencia.'
                    : r.factor < 1 ? 'Se aprobó una versión moderada: el daño es menor, pero existe.'
                        : 'El proyecto se aprobó tal cual.';
            modal.innerHTML = `
              <div class="citation">
                <div class="cite-hero result">
                  <span class="verdict-stamp ${r.passed ? 'bad' : 'good'}">${icon(r.passed ? 'gavel' : 'scroll', { size: 30 })}</span>
                  <div><div class="eyebrow">Resultado de la votación</div><h2>${r.passed ? 'Aprobado' : 'Archivado'}</h2></div>
                  <span class="cite-face">${face(congressMood(r.after.pressure).mood, 52)}<small>${congressMood(r.after.pressure).label}</small></span>
                </div>
                <p class="lead">${outcome}</p>
                <div class="deltas two">
                  ${congressDelta('congress', 'Enojo del Congreso', r.before.pressure, r.after.pressure, false)}
                  ${congressDelta('handshake', 'Credibilidad', r.before.credibility, r.after.credibility, true)}
                </div>
                ${r.passed && r.bill.effects.shock?.demand ? `<div class="note warn">Efecto en la economía: ${r.bill.effects.shock.demand > 0 ? 'más gasto y más presión sobre los precios' : 'menos crédito y menos gasto'} en ${r.bill.effects.turns === 1 ? 'el próximo trimestre' : `los próximos ${r.bill.effects.turns} trimestres`}. Tenlo en cuenta al decidir la tasa.</div>` : ''}
                ${r.passed && r.bill.effects.reserves && r.after.reserves != null ? `<div class="note bad">Las reservas bajan a US$ ${r.after.reserves.toFixed(1)} mil millones.</div>` : ''}
                <div class="modal-actions"><button class="btn btn-primary" data-back>Volver al Directorio</button></div>
              </div>`;
            modal.querySelector('[data-back]').addEventListener('click', () => {
                modal.parentElement._close();
                render();
                briefingCoach();
            });
        }));
    };

    const showCitation = () => {
        const q = m.congress.pending;
        const labels = { tecnica: 'Responder con el mandato', promesa: 'Calmar con una promesa', evasiva: 'Salir por la tangente' };
        const icons = { tecnica: 'scroll', promesa: 'handshake', evasiva: 'shuffle' };
        const effects = { tecnica: { extra: '' }, promesa: { extra: 'Te comprometes a no subir la tasa' }, evasiva: { extra: '' } };
        music.setMood('surprise');
        music.sting();
        const modal = openModal(`
          <div class="citation">
            <div class="cite-hero">
              <span class="cite-bust">${bust('congreso', CHARACTERS.congreso.color, 84)}</span>
              <div>
                <div class="breaking-tag">CITACIÓN</div>
                <h2>El Congreso cita al Directorio del BCR</h2>
                ${q.kind === 'recreacion' ? realChip(`Recreación de un hecho real · ${q.year}`, q.basis) : realChip(`Pregunta real · ${q.year}`, `Hecha en el Congreso (${q.context}). Se muestra sin el nombre del congresista.`)}
              </div>
            </div>
            <blockquote class="bubble cite-q">“${q.text}”${q.note ? `<span class="q-note">${icon('pin', { size: 13 })}${q.note}</span>` : ''}</blockquote>
            <p class="cite-ask">${icon('megaphone', { size: 16 })}${m.pressure >= CONGRESS.citeAt + 10 ? 'Están furiosos contigo.' : 'Quieren escuchar al BCR.'} Lo que digas también lo oyen los mercados.</p>
            <div class="answers">${q.answers.map((a, i) => `
              <button class="answer" data-answer="${i}">
                <span class="ans-ico ${a.style}">${icon(icons[a.style], { size: 22 })}</span>
                <span class="ans-body"><strong>${labels[a.style]}</strong><span>“${a.text}”</span>
                ${diff.hints ? effectChips({ ...ANSWER_EFFECTS[a.style], ...effects[a.style] }) : ''}</span>
              </button>`).join('')}
            </div>
          </div>`, { dismissible: false, wide: true });
        modal.querySelectorAll('[data-answer]').forEach(b => b.addEventListener('click', () => {
            const r = m.answerCitation(Number(b.dataset.answer));
            music.setMood(r.fx.pressure < 0 ? 'good' : 'bad');
            modal.innerHTML = `
              <div class="citation">
                <div class="cite-hero result">
                  <span class="cite-face">${face(congressMood(r.after.pressure).mood, 64)}<small>${congressMood(r.after.pressure).label}</small></span>
                  <div><div class="eyebrow">Después de la sesión</div><h2>${r.fx.pressure < 0 ? 'El Congreso baja el tono' : 'El Congreso sale más molesto'}</h2></div>
                </div>
                <p class="lead">${r.fx.result}</p>
                ${r.followUp ? `<div class="question"><small>Réplica real (${r.followUp.year}, ${r.followUp.context})</small><p>“${r.followUp.text}”</p></div>` : ''}
                <div class="deltas two">
                  ${congressDelta('congress', 'Enojo del Congreso', r.before.pressure, r.after.pressure, false)}
                  ${congressDelta('handshake', 'Credibilidad', r.before.credibility, r.after.credibility, true)}
                </div>
                ${r.fx.promise ? '<div class="note warn"><strong>Compromiso público:</strong> prometiste no subir la tasa este trimestre.</div>' : ''}
                <div class="modal-actions"><button class="btn btn-primary" data-back>Volver al Directorio</button></div>
              </div>`;
            modal.querySelector('[data-back]').addEventListener('click', () => {
                modal.parentElement._close();
                render();
                briefingCoach();
            });
        }));
    };

    // Solo se redibuja lo que depende de la tasa elegida: la respuesta es inmediata.
    const updateDecision = () => {
        const s = m.state;
        const rate = Math.max(m.minRate, s.rate + move);
        const adv = m.advisors();
        const proj = m.projection(rate, sell, tone);
        const end = proj.at(-1);
        const endOk = inBand(end.inflation);

        root.querySelector('.advisors').innerHTML = advisorCard('hawk', adv.hawk, move) + advisorCard('dove', adv.dove, move);
        root.querySelectorAll('[data-follow]').forEach(b => b.addEventListener('click', () => {
            const want = Number(b.dataset.follow);
            move = m.moves.reduce((best, x) => Math.abs(x - want) < Math.abs(best - want) ? x : best, 0);
            music.click();
            updateDecision();
        }));

        const fan = fanChart({ history: m.history, projection: proj, total: m.turns, labels: m.labels().map(shortLabel) });
        root.querySelectorAll('.fan').forEach(f => { f.innerHTML = fan; });

        const hikeCost = scenario.hikePressure ?? 4;
        const hikeP = move > 0 ? Math.round(move / 0.25 * hikeCost) + (m.event.asks === 'bajar' ? Math.round(m.event.pressure * CONGRESS.askWeight) : 0) : 0;
        const toneP = m.guidanceOn ? GUIDANCE[tone].pressure : 0;
        const pressHint = hikeP + toneP > 0 ? ` · enojo del Congreso +${hikeP + toneP}${m.event.asks === 'bajar' && move > 0 ? ' (ignoras un pedido)' : ''}` : '';
        const tools = m.tools.map(t => `
          <div class="tool">
            <div><strong>${t.name}</strong><small>${t.desc}</small></div>
            <button class="btn" data-tool="${t.id}" ${t.left > 0 ? '' : 'disabled'}>${t.left > 0 ? 'Activar' : 'Activado'}</button>
          </div>`).join('');
        const el = root.querySelector('#decision');
        el.innerHTML = `
          <div class="current">
            <div><div class="from">Nueva tasa de referencia ${help('tasa')}</div><div class="big num${shownRate !== null && shownRate !== rate ? ' bump' : ''}">${pct(rate, 2)}</div></div>
            <div class="from" style="text-align:right">Actual: <strong class="num">${pct(s.rate, 2)}</strong><br>
              En un año: <strong class="num ${endOk ? 'txt-good' : 'txt-bad'}">${pct(end.inflation)}</strong> inflación, <strong class="num">${pct(end.growth)}</strong> PBI</div>
          </div>
          <div class="steps" style="grid-template-columns:repeat(${m.moves.length},1fr)" role="radiogroup" aria-label="Cambio de tasa">
            ${m.moves.map(v => `<button role="radio" aria-checked="${v === move}" class="${v === move ? 'on' : ''}" data-move="${v}" data-dir="${Math.sign(v)}" ${s.rate + v < m.minRate - 1e-9 ? 'disabled' : ''}><span class="step-main">${v === 0 ? icon('equal', { size: 16 }) : `${icon(v > 0 ? 'up' : 'down', { size: 14 })}${moveLabel(v)}`}</span><small>${v === 0 ? 'Mantener' : `${Math.round(Math.abs(v) * 100)} pb`}</small></button>`).join('')}
          </div>
          ${m.fx ? fxBlock(m, move, sell, diff) : ''}
          ${m.guidanceOn ? guidanceBlock(m, move, tone, diff) : ''}
          ${tools}
          ${m.congress.promise ? '<div class="promise-banner">Prometiste al Congreso <strong>no subir la tasa</strong> este trimestre. Puedes romper la promesa, pero te costará credibilidad.</div>' : ''}
          ${tradeoffTable(move, sell, !!m.fx)}
          <div class="decision-actions">
            ${diff.timer ? '<div class="timer-slot"></div>' : ''}
            <span class="press-hint">${[
                diff.hints ? (endOk ? 'La proyección termina dentro de la meta.' : 'La proyección termina fuera de la meta.') : '',
                pressHint.replace(/^ · /, ''),
                rate <= m.minRate + 1e-9 ? 'La tasa ya está en su piso (0.25%).' : ''
            ].filter(Boolean).join(' · ')}</span>
            <button class="btn btn-primary btn-announce" data-announce>${icon('gavel', { size: 18 })}Anunciar decisión <span class="kbd">Enter</span></button>
          </div>`;
        shownRate = rate;
        el.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { move = Number(b.dataset.move); music.click(); updateDecision(); }));
        el.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => { sell = Number(b.dataset.sell); music.click(); updateDecision(); }));
        el.querySelectorAll('[data-tone]').forEach(b => b.addEventListener('click', () => { tone = b.dataset.tone; music.click(); updateDecision(); }));
        el.querySelector('[data-term="comunicado"]')?.addEventListener('click', () => openGlossary('comunicado'));
        el.querySelector('[data-term="intervencion"]')?.addEventListener('click', () => openGlossary('intervencion'));
        el.querySelector('[data-announce]').addEventListener('click', announce);
        el.querySelector('[data-term="tasa"]').addEventListener('click', () => openGlossary('tasa'));
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
            : `El Directorio acordó ${d > 0 ? 'elevar' : 'reducir'} la tasa de referencia a ${pct(rate, 2)}…`
            + (sell > 0 ? ` y vender US$ ${sell} mil millones` : sell < 0 ? ` y comprar US$ ${-sell} mil millones` : '')
            + (m.guidanceOn && tone !== 'neutral' ? ` «${GUIDANCE[tone].phrase}»` : ''));
        const rec = m.decide(rate, sell, tone);
        tone = 'neutral';
        sell = 0;
        rec.timeout = timeout;
        lastPeople = rec.people;
        lastRegions = rec.regions;
        lastRec = rec;
        section = 'noticias';
        seen = new Set(['noticias']);
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
            ${rec.tone && rec.tone !== 'neutral' ? `<p class="paper-quote">${icon('megaphone', { size: 14 })}Comunicado: «${GUIDANCE[rec.tone].phrase}»</p>` : ''}
          </div>
          <div class="reveal">
            <div class="reveal-num"><small>Inflación</small><span class="num" data-anim-from="${rec.prev.inflation}" data-anim-to="${rec.state.inflation}">${pct(rec.prev.inflation)}</span></div>
            <p class="reveal-note">Proyectabas ${pct(rec.projected)}. ${surprise}</p>
          </div>
          <div class="deltas${rec.fx ? ' six' : ''}">
            ${chip('Inflación', rec.prev.inflation, rec.state.inflation, v => pct(v), rec.state.inflation < PARAMS.target)}
            ${chip('PBI', rec.prev.growth, rec.state.growth, v => pct(v), true)}
            ${chip('Credibilidad', rec.prev.credibility, rec.state.credibility, v => `${Math.round(v)}`, true)}
            ${chip('Congreso', rec.prevPressure, rec.pressure, v => `${Math.round(v)}`, false)}
            ${rec.fx ? chip('Dólar (S/)', rec.fx.before.rate, rec.fx.rate, v => v.toFixed(3), false) : ''}
            ${rec.fx ? chip('Reservas (US$ mil M)', rec.fx.before.reserves, rec.fx.reserves, v => v.toFixed(1), true) : ''}
          </div>
          ${tabs([
            { key: 'resumen', label: 'Resumen', html: `
              ${rec.streak >= 2 ? `<div class="streak-pop">¡${rec.streak} turnos seguidos en la meta!</div>` : ''}
              ${rec.timeout ? '<div class="note warn">Se acabó el tiempo y no hubo decisión: todo siguió como estaba. En una crisis, no decidir también es una decisión.</div>' : ''}
              ${rec.notes.map(n => `<div class="note ${n.tone}">${n.text}</div>`).join('')}
              ${rec.declaration ? `<div class="declaration"><small>Desde el Congreso · frase real (${rec.declaration.year}, ${rec.declaration.context})</small><p>“${rec.declaration.text}”</p></div>` : ''}
              ${real}
              ${!rec.notes.length && !rec.declaration && !real && !rec.timeout && rec.streak < 2 ? '<p class="quiet">Un trimestre sin sobresaltos en la prensa. Revisa cómo lo vivió la gente y cada región.</p>' : ''}` },
            { key: 'gente', label: 'La gente', badge: hurtCount(rec.people) || null, html: sectorsReport(rec.people) },
            { key: 'regiones', label: 'Regiones', html: regionsReport(rec.regions) },
            { key: 'porque', label: '¿Por qué?', html: `
              <div class="factors">${factors.map(([label, v]) => `
                <div class="factor"><span>${label}</span>
                  <div class="bar"><div class="fill ${v >= 0 ? 'up' : 'down'}" style="width:${Math.min(50, Math.abs(v) / scale * 50)}%"></div></div>
                  <span class="val num">${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} pp</span></div>`).join('')}
              </div>
              <p class="why-note">${rec.event.kind === 'oferta' ? 'Fue sobre todo un choque de oferta: la tasa no lo evita, pero sí impide que contagie a las expectativas.' : 'La tasa actúa sobre la demanda con rezago: lo que decides hoy pesa más en los próximos trimestres.'}</p>
              ${rec.fx ? `<p class="why-note">El dólar se movió ${rec.fx.dep >= 0 ? '+' : ''}${rec.fx.dep.toFixed(1)}%: ${rec.fx.dep > 0 ? 'eso encareció lo importado y sumó a la inflación.' : 'eso abarató lo importado y restó un poco a la inflación.'}</p>` : ''}` }
          ])}
          <div class="modal-actions"><button class="btn btn-primary" data-continue>${over ? 'Ver el veredicto' : 'Siguiente turno'}</button></div>
        `, { dismissible: false });
        animateNumber(modal.querySelector('[data-anim-to]'));
        bindTabs(modal);
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
    if (m.fx && !getFlag('fxIntro')) {
        setFlag('fxIntro');
        openModal(`
          <div class="eyebrow">Nueva herramienta</div>
          <h2>El mercado cambiario</h2>
          <p class="lead">Además de la tasa, ahora puedes <strong>vender o comprar dólares</strong> para suavizar los movimientos del tipo de cambio, como hace el BCR de verdad.</p>
          <ul class="goals">
            <li><span class="mark">1</span><span>Si el dólar sube, <strong>lo importado se encarece</strong> (combustible, trigo, repuestos) y sube la inflación.</span></li>
            <li><span class="mark">2</span><span>Muchas familias y empresas <strong>deben en dólares</strong> pero ganan en soles: cuando el dólar sube, sus deudas crecen.</span></li>
            <li><span class="mark">3</span><span>Vender dólares frena el alza, pero gasta <strong>reservas internacionales</strong>. Si bajan demasiado, los mercados dejan de confiar.</span></li>
            <li><span class="mark">4</span><span>La Fed, las guerras, el cobre y la política interna mueven el dólar. Subir la tasa también ayuda a fortalecer el sol.</span></li>
          </ul>
          <div class="modal-actions"><button class="btn btn-primary" data-close>Entendido</button></div>`, { onClose: briefingCoach });
    } else {
        briefingCoach();
    }
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
    const fxChart = m.fx ? compareChart({ labels, band: false, unit: '', title: 'Tipo de cambio (S/ por US$)' + (real?.fxRate ? ': tú vs. la historia real' : ''), series: [
        { values: m.history.map(h => h.fx), color: 'var(--navy)', label: 'Tu tipo de cambio' },
        ...(real?.fxRate ? [{ values: [null, ...real.fxRate], color: 'var(--red)', label: 'Tipo de cambio real', dash: true }] : [])] }) : '';
    const charts = real
        ? compareChart({ labels, title: 'Inflación: tú vs. la historia real', series: [
            { values: yours, color: 'var(--navy)', label: 'Tu inflación' },
            { values: [null, ...real.inflation], color: 'var(--red)', label: 'Inflación real', dash: true }] })
        + compareChart({ labels, band: false, title: 'Tasa de referencia: tú vs. el BCRP', series: [
            { values: m.history.map(h => h.rate), color: 'var(--navy)', label: 'Tu tasa' },
            { values: [null, ...real.rate], color: 'var(--red)', label: 'Tasa real del BCRP', dash: true }] })
        : fanChart({ history: m.history, projection: [], total: m.turns, labels });

    root.innerHTML = `
    <header class="topbar"><div class="brand">${logo}<span>Sol Firme</span></div><div class="spacer"></div>${musicButton()}<button class="btn btn-ghost" data-exit>Salir</button></header>
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
        <div class="chart">${charts}${fxChart}</div>
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
