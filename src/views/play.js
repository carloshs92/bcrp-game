import Mandate, { FX_MOVES, expectedDepreciation, GUIDANCE, GUIDANCE_RULES, CLIMAX, BOARD_RULES } from '../game/mandate.js';
import { CHARACTERS, cardLesson } from '../model/events.js';
import { PARAMS, inBand } from '../model/economy.js';
import { fanChart, compareChart } from './fanChart.js';
import { logo, andeanBand } from './art.js';
import { openModal, modalOpen, closeModal } from './modal.js';
import { openGlossary } from './glossary.js';
import { coach } from './coach.js';
import { music, musicButton, bindMusicButton } from '../audio/music.js';
import { getSettings, DIFFICULTIES } from '../storage.js';
import { rateTradeoff } from '../game/people.js';
import { congressMood, BILL_RESPONSES, ANSWER_EFFECTS } from '../model/congress.js';
import { face, sectorsReport, regionsReport, peopleBalance, hurtCount } from './people.js';
import { tabs, bindTabs } from './tabs.js';
import { bindMap } from './peruMap.js';
import { icon, KIND_ICON, hawk, dove, bust, congressScene } from './icons.js';
import { TOOLBOX, TOOL_BY_ID } from '../game/toolbox.js';
import { scene } from './scenes.js';
import { achievementsBlock } from './achievementsView.js';
import { ACTION_POINTS, LEVERS, planActions, planCost, canUse } from '../game/actions.js';
import { CAST, castLines } from '../game/cast.js';
import { ENDINGS, ending, shareText } from '../game/endings.js';
import { drawShareCard, shareCard } from './shareCard.js';

const pct = (v, d = 1) => `${v.toFixed(d)}%`;
const moveLabel = m => m === 0 ? '=' : `${m > 0 ? '+' : '−'}${Math.abs(m).toFixed(2)}`;
const help = term => `<button class="help" data-term="${term}" aria-label="¿Qué es esto?">?</button>`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/** Finales anticipados (los mismos de game/endings.js). Se exporta con el nombre de siempre. */
export const GAME_OVER = ENDINGS;

/** El discurso del presidente: tres tonos con nombre de calle. */
const TONE_UI = {
    halcon: { label: 'Firme', sub: 'halcón', ico: 'up', commit: 'Te compromete a no bajar la tasa el próximo turno' },
    neutral: { label: 'Ambiguo', sub: 'neutral', ico: 'equal', commit: 'No te compromete a nada' },
    paloma: { label: 'Calmado', sub: 'paloma', ico: 'down', commit: 'Te compromete a no subir la tasa el próximo turno' }
};

const FX_LABEL = { 3: 'Vender 3', 1.5: 'Vender 1.5', 0: 'No intervenir', '-1.5': 'Comprar 1.5', '-3': 'Comprar 3' };

export function avatar(who) {
    const c = CHARACTERS[who] ?? CHARACTERS.analista;
    return `<span class="avatar" style="--c:${c.color}" title="${c.name}">${bust(who in CHARACTERS ? who : 'analista', c.color, 52)}</span>`;
}

/** Cara de un personaje del elenco (o el ícono de las redes). */
function castFace(id, size = 48) {
    const c = CAST[id];
    if (!c.bust) return `<span class="cast-ico" style="--c:${c.color}">${icon('chat', { size: Math.round(size * 0.5) })}</span>`;
    return bust(c.bust, c.color, size);
}

// ---------- Termómetros y recursos ----------

function gauge({ id, label, term, ico, value, sub, pos, zone, danger, tone, kind = 'thermo' }) {
    return `
    <div class="gauge ${kind} ${tone}" id="${id}">
      <div class="gauge-top"><span class="gauge-label">${icon(ico, { size: 15 })}${label}${term ? help(term) : ''}</span><strong class="num">${value}</strong></div>
      <div class="meter-track">
        ${zone ? `<span class="meter-zone" style="left:${zone[0] * 100}%;width:${(zone[1] - zone[0]) * 100}%"></span>` : ''}
        ${danger ? `<span class="meter-danger" style="left:${danger[0] * 100}%;width:${(danger[1] - danger[0]) * 100}%"></span>` : ''}
        <span class="meter-fill" style="width:${Math.max(0, Math.min(1, pos)) * 100}%"></span>
      </div>
      <small class="gauge-sub">${sub}</small>
    </div>`;
}

/** 4 termómetros (inflación, dólar, empleo, confianza) y 2 recursos (reservas, credibilidad). */
function hud(m) {
    const s = m.state, L = m.limits, P = m.params;
    const inflMax = Math.max(L.inflation + 1, 6);
    const gMin = Math.max(L.growth, -8), gMax = P.potentialGrowth + 4;
    const gpos = v => (v - gMin) / (gMax - gMin);
    const jobs = s.growth < 0 ? ['Despidos', 'bad'] : s.growth < P.potentialGrowth - 1.5 ? ['Se enfría', 'warn'] : s.growth > P.potentialGrowth + 1.5 ? ['A tope', 'warn'] : ['Contratan', 'good'];
    const thermos = [
        gauge({ id: 'g-infl', label: 'Inflación', term: 'inflacion', ico: 'cart', value: pct(s.inflation), pos: s.inflation / inflMax,
            zone: [PARAMS.bandMin / inflMax, PARAMS.bandMax / inflMax], tone: inBand(s.inflation) ? 'good' : s.inflation > L.inflation - 1.5 ? 'bad' : 'warn',
            sub: `Meta 1%–3% · pierdes sobre ${L.inflation}%${L.inflationTurns > 1 ? ` ${L.inflationTurns} ${m.unitWord(2)} seguidos` : ''}` }),
        ...(m.fx ? [gauge({ id: 'g-fx', label: 'Dólar', term: 'intervencion', ico: 'dollar', value: `S/ ${m.fx.rate.toFixed(3)}`,
            pos: 0.5 + (m.fx.rate / m.fxStart - 1) * 5, zone: [0.4, 0.6],
            tone: Math.abs(m.fx.lastDep) < 1.5 ? 'good' : Math.abs(m.fx.lastDep) < 3.5 ? 'warn' : 'bad',
            sub: m.fx.lastDep ? `${m.fx.lastDep > 0 ? '▲' : '▼'} ${Math.abs(m.fx.lastDep).toFixed(1)}% el último ${m.unit}` : 'Estable' })] : []),
        gauge({ id: 'g-jobs', label: 'Empleo', term: 'pbi', ico: 'briefcase', value: jobs[0], pos: gpos(s.growth),
            zone: [gpos(P.potentialGrowth - 1.5), gpos(P.potentialGrowth + 1.5)], tone: jobs[1],
            sub: `PBI ${s.growth >= 0 ? '+' : ''}${pct(s.growth)}${m.informal != null ? ` · informal ${m.informal.toFixed(0)}%` : ''}` }),
        gauge({ id: 'g-trust', label: 'Confianza', term: 'confianza', ico: 'heart', value: `${Math.round(m.trust)}`, pos: m.trust / 100,
            tone: m.trust >= 55 ? 'good' : m.trust >= 35 ? 'warn' : 'bad', sub: 'Lo que la gente piensa del BCR' })
    ];
    const res = [
        ...(m.fx ? [gauge({ id: 'g-res', kind: 'resource', label: 'Reservas', term: 'reservas', ico: 'vault', value: `$${m.fx.reserves.toFixed(1)} mil M`,
            pos: m.reserveShare(), danger: [0, 0.3], tone: m.reserveShare() > 0.5 ? 'good' : m.reserveShare() > 0.25 ? 'warn' : 'bad',
            sub: `Te queda ${Math.round(m.reserveShare() * 100)}% para usar · no se reponen solas` })] : []),
        gauge({ id: 'g-cred', kind: 'resource', label: 'Credibilidad', term: 'credibilidad', ico: 'handshake', value: `${Math.round(s.credibility)}`,
            pos: s.credibility / 100, danger: [0, L.credibility / 100], tone: s.credibility >= 60 ? 'good' : s.credibility >= 35 ? 'warn' : 'bad',
            sub: `Multiplica tus palancas · pierdes bajo ${L.credibility}` })
    ];
    return `<div class="hud" id="hud"><div class="thermos">${thermos.join('')}</div><div class="resources">${res.join('')}</div></div>`;
}

// ---------- La carta del mes, las consecuencias y el elenco ----------

function shockCard(m) {
    const e = m.event;
    const c = CHARACTERS[e.who] ?? CHARACTERS.analista;
    const L = cardLesson(e);
    const kind = { demanda: 'Demanda', oferta: 'Oferta', politica: 'Política', externo: 'Externo', calma: 'Calma' }[e.kind] ?? 'Coyuntura';
    const ask = e.asks === 'bajar' ? `<span class="pill warn">${icon('down', { size: 13 })}Te piden bajar la tasa</span>`
        : e.asks === 'subir' ? `<span class="pill bad">${icon('up', { size: 13 })}Te piden actuar contra la inflación</span>` : '';
    return `
    <article class="shock-card deal kind-${e.kind ?? 'calma'}" id="shock">
      <div class="shock-top"><span class="shock-n">Carta ${m.quarter + 1} de ${m.turns}</span><span class="pill info">${icon(KIND_ICON[e.kind] ?? 'globe', { size: 13 })}${kind}</span></div>
      <div class="shock-who">${avatar(e.who)}<small>${c.name}</small></div>
      <h2 class="shock-title">${e.title}</h2>
      <blockquote class="bubble">“${e.quote}”</blockquote>
      <div class="shock-foot"><span class="hits">${icon('target', { size: 14 })}<strong>Golpea:</strong> ${L.hits}</span>${ask}</div>
    </article>`;
}

function consequenceBlock(m) {
    if (!m.consequences.length) return '';
    return m.consequences.map(c => {
        const who = CAST[c.who];
        const chips = [
            c.effect.trust ? `<span class="fx-chip ${c.effect.trust > 0 ? 'good' : 'bad'}">${icon('heart', { size: 12 })}Confianza ${c.effect.trust > 0 ? '+' : ''}${c.effect.trust}</span>` : '',
            c.effect.pressure ? `<span class="fx-chip ${c.effect.pressure < 0 ? 'good' : 'bad'}">${icon('congress', { size: 12 })}Congreso ${c.effect.pressure > 0 ? '+' : ''}${c.effect.pressure}</span>` : ''
        ].join('');
        return `
        <article class="conseq ${c.tone}" id="consequence">
          <div class="conseq-tag">${icon(c.tone === 'good' ? 'sun' : 'flame', { size: 14 })}${c.tone === 'good' ? 'Lo bueno también llega' : 'Lo que hiciste te alcanzó'}</div>
          <div class="conseq-body"><span class="conseq-face">${castFace(c.who, 46)}</span>
            <div><small>${who.name} · ${who.role}</small><strong>${c.title}</strong><p>${c.text}</p><span class="fx-chips">${chips}</span></div></div>
        </article>`;
    }).join('');
}

function castStrip(m, lastRec) {
    // Las mismas frases que se oyeron en vivo tras el anuncio.
    const lines = lastRec?.cast ?? castLines(m, lastRec);
    const cm = congressMood(m.pressure);
    return `
    <section class="cast" id="cast">
      <h3 class="cast-h">${icon('people', { size: 16 })}${lastRec ? `Cómo lo viven después de ${m.label(m.quarter - 1)}` : 'El elenco: ellos sentirán tus decisiones'}</h3>
      <div class="cast-row">${lines.map(c => `
        <div class="castm mood${c.mood}" data-cast="${c.id}">
          <span class="castm-face">${castFace(c.id, 50)}<span class="castm-mood">${face(c.mood, 20)}</span></span>
          <div class="castm-body">
            <small><strong>${c.name}</strong> · ${c.watches}</small>
            <p>${c.id === 'feed' ? `<span class="trend">${c.line.split(' · ')[0]}</span> ${c.line.split(' · ').slice(1).join(' · ')}` : `“${c.line}”`}</p>
            ${c.id === 'congresista' ? `<div class="cg-bar"><div class="meter-track"><span class="meter-danger" style="left:80%;width:20%"></span><span class="meter-fill" style="width:${m.pressure}%"></span></div><small>Congreso: ${cm.label.toLowerCase()} · ${Math.round(m.pressure)}/100${m.limits.pressure <= 100 ? ' · en 100 te censuran' : ''}</small></div>` : ''}
          </div>
        </div>`).join('')}
      </div>
      ${lastRec?.declaration ? `<div class="real-quote">${icon('congress', { size: 16 })}<span>“${lastRec.declaration.text}”<small>Frase real de un congresista (${lastRec.declaration.year}, ${lastRec.declaration.context}). Se muestra sin nombre.</small></span></div>` : ''}
    </section>`;
}

// ---------- Palancas ----------

function toolCards(m, pick, scriptedPick, diff) {
    const locked = m.scenario.showLockedTools ? TOOLBOX.filter(t => !m.toolbox.some(x => x.id === t.id) && (!t.needsFx || m.fx)) : [];
    const status = t => {
        if (t.once && t.used) return 'Ya usada';
        if (m.quarter < t.readyAt) {
            const n = t.readyAt - m.quarter;
            return t.unlockAt && m.quarter < t.unlockAt ? `Se desbloquea en ${n} ${m.unitWord(n)}` : `Recargando: ${n} ${m.unitWord(n)}`;
        }
        return t.effect.turns > 1 ? `Dura ${t.effect.turns} ${m.unitWord(t.effect.turns)}` : `Efecto este ${m.unit}`;
    };
    const arrows = t => {
        const e = t.effect, out = [];
        if (e.shock?.demand) out.push(['Crédito', e.shock.demand > 0 ? '▲' : '▼']);
        if (e.fx) out.push(['Dólar', e.fx > 0 ? '▲' : '▼']);
        if (e.pressure) out.push(['Congreso', e.pressure > 0 ? '▲' : '▼']);
        return diff.hints && out.length ? `<span class="fx-chips">${out.map(([l, a]) => `<span class="fx-chip info">${l} ${a}</span>`).join('')}</span>` : '';
    };
    return `
      <div class="tools-grid">
        ${m.tools.map(t => `
          <button class="tcard${scriptedPick === t.id ? ' on' : ''}" data-scripted="${t.id}" ${t.left > 0 ? '' : 'disabled'}>
            <span class="tcard-top"><span class="tcard-ico">${icon('heart', { size: 18 })}</span><strong>${t.name}</strong></span>
            <span class="tcard-desc">${t.desc}</span><small>${t.left > 0 ? 'Una sola vez' : 'Ya activado'}</small>
          </button>`).join('')}
        ${m.toolbox.map(t => {
            const ready = m.toolReady(t.id);
            return `<button class="tcard${t.id === pick ? ' on' : ''}" data-pick="${t.id}" ${ready ? '' : 'disabled'}>
              <span class="tcard-top"><span class="tcard-ico">${icon(ready ? t.icon : 'lock', { size: 18 })}</span><strong>${t.name}</strong></span>
              <span class="tcard-desc">${t.desc}</span>${arrows(t)}<small>${t.cost} · ${status(t)}</small>
            </button>`;
        }).join('')}
        ${locked.map(t => `<div class="tcard locked"><span class="tcard-top"><span class="tcard-ico">${icon('lock', { size: 18 })}</span><strong>${t.name}</strong></span><small>Se gana en el modo historia</small></div>`).join('')}
      </div>`;
}

function boardBlock(m, move, convinced) {
    const ico = { tecnica: 'scale', halcon: 'up', prudente: 'equal', paloma: 'down', empleo: 'briefcase', veterano: 'book' };
    if (move === 0) return '';
    const v = m.boardVote(move, convinced);
    const mv = x => x === 0 ? 'mantener' : `${x > 0 ? '+' : '−'}${Math.abs(x).toFixed(2)}`;
    return `
      <div class="board ${v.passes ? 'ok' : 'no'}">
        <div class="fx-head"><strong>${icon('people', { size: 16 })} Directorio: ${v.yes} de 7 a favor</strong>
          <span>${v.passes ? (v.yes === 7 ? 'unánime (+1 credibilidad)' : v.yes === 4 ? 'ajustada (−1 credibilidad)' : 'se aprueba') : 'no alcanza: la tasa se mantendría'}</span></div>
        <div class="seats">
          <div class="seat yes me" title="Tú, presidente del BCR"><span class="seat-ico">${icon('user', { size: 16 })}</span><small>Tú</small></div>
          ${v.votes.map(d => {
            const canTalk = !d.yes && !convinced && Math.abs(d.pref - move) <= BOARD_RULES.reach + 1e-9;
            return `<div class="seat ${d.yes ? 'yes' : 'no'}${d.id === convinced ? ' talked' : ''}" title="${d.role} (designado por el ${d.origin}). ${d.style} Prefiere: ${mv(d.pref)}.">
              <span class="seat-ico">${icon(ico[d.id] ?? 'user', { size: 16 })}</span><small>${d.role.replace(/^(El|La) /, '')}</small><span class="seat-pref">${mv(d.pref)}</span>
              ${canTalk ? `<button class="seat-talk" data-convince="${d.id}">Convencer</button>` : ''}
            </div>`;
        }).join('')}
        </div>
      </div>`;
}

const GROUPS = {
    ahorristas: ['piggy', 'Ahorristas'], jubilados: ['elder', 'Jubilados'], familias: ['home', 'Familias'],
    deudores: ['card', 'Deudores'], mypes: ['store', 'Mypes'], empleo: ['briefcase', 'Empleo'],
    deudoresUsd: ['card', 'Deudores en US$'], importadores: ['box', 'Importadores'],
    exportadores: ['ship', 'Exportadores'], reservas: ['vault', 'Reservas']
};

function fxTradeoff(sell) {
    if (sell > 0) return { winWho: ['deudoresUsd', 'importadores'], loseWho: ['reservas'] };
    if (sell < 0) return { winWho: ['exportadores', 'reservas'], loseWho: ['deudoresUsd'] };
    return { winWho: [], loseWho: [] };
}

/** Quién gana y quién pierde con el plan: una sola línea de fichas. */
function tradeoffLine(move, sell) {
    const t = rateTradeoff(move), f = fxTradeoff(sell);
    const win = [...new Set([...t.winWho, ...f.winWho])], lose = [...new Set([...t.loseWho, ...f.loseWho])];
    if (!win.length && !lose.length) return `<div class="tradeoff quiet">${icon('equal', { size: 15 })}Si esperas, nadie siente un cambio inmediato… pero la economía sigue moviéndose sin ti.</div>`;
    const chips = (ids, side) => ids.map(id => `<span class="tt-chip ${side}">${icon(GROUPS[id][0], { size: 14 })}<small>${GROUPS[id][1]}</small></span>`).join('');
    return `<div class="tradeoff"><span class="tt-side">${face(1, 18)}Ganan ${chips(win, 'win')}</span><span class="tt-side">${face(-1, 18)}Pierden ${chips(lose, 'lose')}</span></div>`;
}

// ---------- Modales compartidos ----------

/** Pantalla "última hora": el imprevisto que la proyección no veía. */
export function showBreaking(surprise, { onClose }) {
    music.setMood('surprise');
    music.sting();
    return openModal(`
      <div class="breaking">
        <div class="breaking-tag">¡ÚLTIMA HORA!</div>
        <div class="event-head">${avatar(surprise.who)}<div><small>${(CHARACTERS[surprise.who] ?? CHARACTERS.prensa).name}</small><h2>${surprise.title}</h2></div></div>
        <p class="lead">${surprise.text}</p>
        <p class="breaking-note">Esto no estaba en la proyección: tu decisión ya estaba tomada. A veces la decisión correcta igual falla.</p>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Ver qué pasó</button></div>`, { dismissible: false, onClose });
}

/** Mientras el país espera el anuncio (humor de fondo; en 1990 no había redes sociales). */
const QUIPS = {
    hoy: [
        'Mientras tanto, en el jirón Ocoña, Pepe ya está borrando su pizarra…',
        'El Congresista Pérez ya tiene el tuit listo, por si acaso…',
        'Kevin frenó la moto del delivery para escuchar la noticia…',
        'Doña Rosa subió el volumen de la radio en el mercado…',
        'Valeria tiene la calculadora en una mano y el café en la otra…',
        'En la sala del Directorio se acabó el café pasado…',
        'Perú es clave… y esta decisión también.'
    ],
    1990: [
        'En la cola del pan nadie habla de otra cosa…',
        'El cambista de la esquina ya cambió su cartel tres veces hoy…',
        'Las radios interrumpen la música para el anuncio…',
        'En la bodega, el caserito espera antes de remarcar los precios…'
    ]
};

export async function announceSuspense(text, { era = 'hoy' } = {}) {
    music.setMood('announce');
    const quips = QUIPS[era] ?? QUIPS.hoy;
    const overlay = document.createElement('div');
    overlay.className = 'suspense';
    overlay.innerHTML = `<div class="suspense-card">${andeanBand}<div class="suspense-title">Nota Informativa del Programa Monetario</div><div class="suspense-text">${text}</div><div class="suspense-dots"><i></i><i></i><i></i></div><div class="suspense-quip">${quips[Math.floor(Math.random() * quips.length)]}</div></div>`;
    document.body.appendChild(overlay);
    await sleep(2000);
    overlay.remove();
}

/**
 * Reacción en vivo: segundos después del anuncio, el elenco reacciona uno tras otro
 * (y Pepe canta el dólar). Luego, el diario.
 */
function showReaction(m, rec, onDone) {
    const items = [];
    if (rec.fx) {
        const up = rec.fx.dep > 0;
        items.push({ face: avatar('cambista'), name: 'Pepe, cambista del jirón Ocoña', text: `¡${up ? 'Sube' : 'Baja'} el dólar, ${up ? 'sube' : 'baja'}! Ahorita está a <strong class="num ticker" data-from="${rec.fx.before.rate}" data-to="${rec.fx.rate}">S/ ${rec.fx.before.rate.toFixed(3)}</strong> <span class="${up ? 'txt-bad' : 'txt-good'}">${up ? '▲' : '▼'} ${Math.abs(rec.fx.dep).toFixed(1)}%</span>` });
    }
    for (const c of rec.cast ?? castLines(m, rec)) {
        items.push({ face: `${castFace(c.id, 44)}`, mood: c.mood, name: `${c.name} · ${c.watches}`, text: c.id === 'feed' ? `<span class="trend">${c.line.split(' · ')[0]}</span> ${c.line.split(' · ').slice(1).join(' · ')}` : `“${c.line}”` });
    }
    if (rec.declaration) items.push({ face: `<span class="feed-ico">${icon('congress', { size: 22 })}</span>`, name: `Desde el Congreso · frase real (${rec.declaration.year}), sin nombre`, text: `“${rec.declaration.text}”` });

    const modal = openModal(`
      <div class="reaction">
        <div class="live"><span class="live-dot"></span>EN VIVO · reacciones al anuncio</div>
        <div class="feed">${items.map((it, i) => `
          <div class="feed-item${it.mood != null ? ` mood${it.mood}` : ''}" style="animation-delay:${0.15 + i * 0.4}s">
            <span class="feed-ava">${it.face}</span>
            <div><small>${it.name}</small><p>${it.text}</p></div>
          </div>`).join('')}
        </div>
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-paper>Ver el diario</button></div>`, { dismissible: false });
    const ticker = modal.querySelector('.ticker');
    if (ticker) {
        const from = Number(ticker.dataset.from), to = Number(ticker.dataset.to), t0 = performance.now() + 300;
        const tick = t => {
            const k = Math.max(0, Math.min(1, (t - t0) / 1200));
            ticker.textContent = `S/ ${(from + (to - from) * (1 - (1 - k) ** 3)).toFixed(3)}`;
            if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }
    const btn = modal.querySelector('[data-paper]');
    btn.focus();
    btn.addEventListener('click', () => { modal.parentElement._close(); onDone(); });
}

/** Franja fija: quién eres y qué tienes que lograr. */
function missionBar(m) {
    const goals = m.scenario.goals
        ? m.scenario.goals.map(g => g.label ?? ({ finalInBand: 'terminar con la inflación entre 1% y 3%' }[g.type] ?? '')).filter(Boolean)
        : [`la inflación entre 1% y 3% al menos ${m.scenario.reappoint?.minInBand ?? m.turns} de ${m.turns} ${m.unitWord(m.turns)}`, `sin apagar el país (crecimiento promedio de ${m.scenario.reappoint?.minAvgGrowth ?? 0}% o más)`];
    return `
    <div class="mission" role="note">
      <span class="mission-role"><span class="mission-ico">${icon('user', { size: 16 })}</span><strong>Presides el BCR.</strong> ${ACTION_POINTS} acciones por ${m.unit}.</span>
      <span class="mission-goal"><span class="mission-ico">${icon('target', { size: 16 })}</span><strong>Tu misión:</strong> ${goals.map(g => g.charAt(0).toLowerCase() + g.slice(1)).join(' · ')}.</span>
    </div>`;
}

const BILL_ICON = { 'retiro-afp': 'piggy', 'topes-tasas': 'percent', 'oro-bcr': 'gold', 'usar-reservas': 'vault' };
const realChip = (label, detail) => `<details class="real-chip"><summary>${icon('pin', { size: 13 })}${label}</summary><p>${detail}</p></details>`;
function effectChips({ pressure = 0, credibility = 0, extra = '' }) {
    const chip = (ico, label, v, goodWhenUp) => v ? `<span class="fx-chip ${(v > 0) === goodWhenUp ? 'good' : 'bad'}">${icon(ico, { size: 13 })}${label} ${v > 0 ? '▲' : '▼'}</span>` : '';
    return `<span class="fx-chips">${chip('congress', 'Enojo', pressure, false)}${chip('handshake', 'Credibilidad', credibility, true)}${extra ? `<span class="fx-chip warn">${extra}</span>` : ''}</span>`;
}
function congressDelta(ico, label, before, after, goodWhenUp) {
    const d = Math.round(after) - Math.round(before);
    const tone = d === 0 ? '' : (d > 0) === goodWhenUp ? 'good' : 'bad';
    return `<span class="delta cdelta ${tone}"><span class="cd-ico">${icon(ico, { size: 18 })}</span><span>${label}<strong class="num">${Math.round(after)}${d ? ` <em>${d > 0 ? '+' : ''}${d}</em>` : ''}</strong><small>antes ${Math.round(before)}</small></span></span>`;
}

/**
 * Juega un escenario (tutorial, capítulo o modo libre) en la mesa de mando.
 * opts: { title, seed, difficulty, coachSteps, intro, onExit, onFinish(m, result) }
 */
export function playScenario(root, scenario, opts) {
    const m = new Mandate(opts.seed ?? Date.now(), scenario);
    const diff = opts.difficulty ? { difficulty: opts.difficulty, ...DIFFICULTIES[opts.difficulty] } : getSettings();
    // El tutorial enseña sin apuro: sin reloj.
    if (opts.noTimer) diff.timer = 0;
    // El plan del turno: hasta 2 acciones entre cuatro palancas.
    let move = 0, sell = 0, tone = 'neutral', toolPick = null, scriptedPick = null, convinced = null;
    let open = 'tasa';
    let shownRate = null;
    let busy = false;
    let lastRec = null;
    const plan = () => ({ move, sell, tone, tool: toolPick, scripted: !!scriptedPick });
    const resetPlan = () => { move = 0; sell = 0; tone = 'neutral'; toolPick = null; scriptedPick = null; convinced = null; open = 'tasa'; };
    const timer = createTimer(diff.timer, () => { resetPlan(); announce({ timeout: true }); }, () => busy);

    const onKey = e => {
        if (modalOpen() || busy || e.target.closest('input, textarea')) return;
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && canUse(plan(), 'tasa')) {
            const i = m.moves.indexOf(move) + (e.key === 'ArrowRight' ? 1 : -1);
            if (i >= 0 && i < m.moves.length && m.state.rate + m.moves[i] >= m.minRate - 1e-9) { move = m.moves[i]; open = 'tasa'; updateDecision(); }
            e.preventDefault();
        } else if (e.key === 'Enter' && !e.target.closest('button')) {
            announce();
        }
    };
    document.addEventListener('keydown', onKey);
    const cleanup = () => { document.removeEventListener('keydown', onKey); timer.stop(); };
    const exit = () => { cleanup(); closeModal(); opts.onExit(); };
    const isClimax = () => m.scenario.climax?.turn === m.quarter;

    const render = () => {
        root.innerHTML = `
        <header class="topbar">
          <div class="brand">${logo}<span>${opts.title}</span></div>
          <div class="meeting-info"><small>Directorio del BCR</small><strong>${m.label()} · ${cap(m.unit)} ${m.quarter + 1} de ${m.turns}</strong></div>
          <div class="progress" aria-hidden="true">${Array.from({ length: m.turns }, (_, i) => `<span class="${i < m.quarter ? (inBand(m.history[i + 1].state.inflation) ? 'done' : 'done miss') : i === m.quarter ? 'now' : ''}"></span>`).join('')}</div>
          <div class="spacer"></div>
          ${m.streak > 1 ? `<span class="streak">${icon('flame', { size: 14 })}${m.streak} en meta</span>` : ''}
          <span class="diff-chip">${diff.name}</span>
          ${musicButton()}
          <button class="btn btn-ghost" data-glossary>Glosario</button>
          <button class="btn btn-ghost" data-exit>Salir</button>
        </header>
        <div class="andean-strip">${andeanBand}</div>
        ${missionBar(m)}
        <main class="page table ${diff.hints ? 'hints-on' : 'hints-off'}${isClimax() ? ' climax' : ''}">
          ${isClimax() ? `<div class="climax-banner">${icon('flame', { size: 18 })}<strong>Momento decisivo:</strong> ${m.scenario.climax.title}. Te comparas con el BCRP real (±${CLIMAX.reward} de credibilidad).</div>` : ''}
          ${hud(m)}
          <div class="table-grid">
            <div class="col left">
              ${shockCard(m)}
              ${consequenceBlock(m)}
              ${castStrip(m, lastRec)}
            </div>
            <div class="col right">
              <section class="card levers" id="levers"></section>
              <section class="card" id="projection">
                <h3><span class="h-ico">${icon('telescope', { size: 16 })}</span>Hacia dónde iría la inflación ${help('niebla')}<span class="sub">Rango probable · se estrecha con credibilidad</span></h3>
                <div class="fan"></div>
              </section>
            </div>
          </div>
        </main>`;
        root.querySelector('[data-exit]').addEventListener('click', exit);
        root.querySelector('[data-glossary]').addEventListener('click', () => openGlossary());
        root.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', () => openGlossary(b.dataset.term)));
        bindMusicButton(root);
        updateDecision();
        window.scrollTo({ top: 0 });
    };

    /** Tarjeta de una palanca: qué elegiste, cuánto tarda y si te quedan acciones. */
    const leverTile = (id, summary, active) => {
        const L = LEVERS[id];
        const allowed = canUse(plan(), id);
        return `
          <button class="lever${active ? ' used' : ''}${open === id ? ' open' : ''}${allowed ? '' : ' blocked'}" data-lever="${id}" aria-expanded="${open === id}">
            <span class="lever-ico">${icon(L.icon, { size: 20 })}</span>
            <span class="lever-text"><strong>${L.name}</strong><small>${summary}</small></span>
            <span class="lever-lag">${L.lag[m.unit] ?? L.lag.mes}</span>
            ${active ? '<span class="lever-ap" title="Usa una acción">●</span>' : ''}
          </button>`;
    };

    const controlFor = (id, rate) => {
        const s = m.state;
        const L = LEVERS[id];
        const head = `<div class="ctrl-head"><span>${icon('up', { size: 13 })}${L.gives}</span><span>${icon('down', { size: 13 })}${L.costs}</span></div>`;
        if (!canUse(plan(), id)) return `<div class="ctrl">${head}<p class="ap-out">${icon('lock', { size: 15 })}Ya usaste tus ${ACTION_POINTS} acciones. Suelta una para usar esta palanca.</p></div>`;
        if (id === 'tasa') {
            const adv = m.advisors();
            const advBtn = (kind, a) => `<button class="adv-chip ${kind}${Math.abs(a.move - move) < 1e-9 ? ' on' : ''}" data-follow="${a.move}" title="${a.why}"><span class="adv-bird">${kind === 'hawk' ? hawk : dove}</span><span><strong>${kind === 'hawk' ? 'Halcón' : 'Paloma'}</strong> propone ${moveLabel(a.move)}</span></button>`;
            return `<div class="ctrl">${head}
              <div class="rate-now"><span>Tasa: <strong class="num">${pct(s.rate, 2)}</strong> → <strong class="num big${shownRate !== null && shownRate !== rate ? ' bump' : ''}">${pct(rate, 2)}</strong></span>${help('tasa')}</div>
              <div class="steps" style="grid-template-columns:repeat(${m.moves.length},1fr)" role="radiogroup" aria-label="Cambio de tasa">
                ${m.moves.map(v => `<button role="radio" aria-checked="${v === move}" class="${v === move ? 'on' : ''}" data-move="${v}" ${s.rate + v < m.minRate - 1e-9 ? 'disabled' : ''}><span class="step-main">${v === 0 ? icon('equal', { size: 16 }) : `${icon(v > 0 ? 'up' : 'down', { size: 14 })}${moveLabel(v)}`}</span><small>${v === 0 ? 'Mantener' : `${Math.round(Math.abs(v) * 100)} pb`}</small></button>`).join('')}
              </div>
              <div class="advisors-row">${advBtn('hawk', adv.hawk)}${advBtn('dove', adv.dove)}</div>
              ${m.scenario.board ? boardBlock(m, move, convinced) : ''}
              ${m.congress.promise ? '<div class="promise-banner">Prometiste al Congreso <strong>no subir la tasa</strong>. Puedes romper la promesa, pero te costará caro.</div>' : ''}
            </div>`;
        }
        if (id === 'dolares') {
            const pressure = m.fxPressure();
            const dep = expectedDepreciation(pressure, move, sell);
            const max = m.maxSale();
            return `<div class="ctrl">${head}
              <p class="fx-press">Presión sobre el dólar este ${m.unit}: <strong class="num">${pressure > 0 ? '+' : ''}${pressure.toFixed(1)}%</strong>${pressure < 0.5 ? ' · casi nada: vender ahora gasta reservas sin razón' : ''}</p>
              <div class="steps" style="grid-template-columns:repeat(${FX_MOVES.length},1fr)" role="radiogroup" aria-label="Intervención cambiaria">
                ${FX_MOVES.map(v => `<button role="radio" aria-checked="${v === sell}" class="${v === sell ? 'on' : ''}" data-sell="${v}" ${v > max + 1e-9 ? 'disabled' : ''}>${FX_LABEL[v]}<small>${v === 0 ? 'US$' : 'mil M US$'}</small></button>`).join('')}
              </div>
              <p class="fx-out">Dólar esperado: <strong class="num">S/ ${(m.fx.rate * (1 + dep / 100)).toFixed(3)}</strong> (${dep >= 0 ? '+' : ''}${dep.toFixed(1)}%) · reservas: <strong class="num">US$ ${(m.fx.reserves - sell).toFixed(1)} mil M</strong></p>
            </div>`;
        }
        if (id === 'discurso') {
            const prev = m.guidance;
            const broken = m.breaksGuidance(move);
            return `<div class="ctrl">${head}
              ${prev ? `<div class="guidance-prev ${broken ? 'bad' : ''}">${broken
                ? `Tu discurso anterior fue <strong>${TONE_UI[prev].label.toLowerCase()}</strong>: con esta tasa romperás tu palabra (−${GUIDANCE_RULES.broken} de credibilidad).`
                : `Tu discurso anterior fue <strong>${TONE_UI[prev].label.toLowerCase()}</strong>. Cumplirlo suma +${GUIDANCE_RULES.kept} de credibilidad.`}</div>` : ''}
              <div class="tones" role="radiogroup" aria-label="Tono del discurso">${Object.entries(GUIDANCE).map(([tid, g]) => `
                <button role="radio" aria-checked="${tid === tone}" class="tone ${tid}${tid === tone ? ' on' : ''}" data-tone="${tid}">
                  <span class="tone-top">${icon(TONE_UI[tid].ico, { size: 14 })}<strong>${TONE_UI[tid].label}</strong><small>${TONE_UI[tid].sub}</small></span>
                  <span class="tone-phrase">«${g.phrase}»</span><small>${TONE_UI[tid].commit}</small>
                </button>`).join('')}
              </div>
              <p class="fx-press">Pesa más con más credibilidad (hoy ${Math.round(s.credibility)}). Sin credibilidad, las palabras no valen nada.</p>
            </div>`;
        }
        return `<div class="ctrl">${head}${toolCards(m, toolPick, scriptedPick, diff)}</div>`;
    };

    // Solo se redibuja la columna de decisión y el gráfico: la respuesta es inmediata.
    const updateDecision = () => {
        const s = m.state;
        const rate = Math.max(m.minRate, s.rate + move);
        if (toolPick && !m.toolReady(toolPick)) toolPick = null;
        const used = planActions(plan());
        const proj = m.projection(rate, sell, tone, toolPick);
        const end = proj.at(-1);
        const hasTools = m.toolbox.length || m.tools.length || m.scenario.showLockedTools;
        const toolSummary = scriptedPick ? m.tools.find(t => t.id === scriptedPick).name : toolPick ? TOOL_BY_ID[toolPick].short : 'Ninguna';
        const levers = [
            leverTile('tasa', move === 0 ? `Mantener en ${pct(s.rate, 2)}` : `${moveLabel(move)} → ${pct(rate, 2)}`, move !== 0),
            m.fx ? leverTile('dolares', FX_LABEL[sell] + (sell ? ' mil M' : ''), sell !== 0) : '',
            m.guidanceOn ? leverTile('discurso', `${TONE_UI[tone].label} (${TONE_UI[tone].sub})`, tone !== 'neutral') : '',
            hasTools ? leverTile('herramienta', toolSummary, !!(toolPick || scriptedPick)) : ''
        ].join('');
        if ((open === 'dolares' && !m.fx) || (open === 'discurso' && !m.guidanceOn) || (open === 'herramienta' && !hasTools)) open = 'tasa';
        const waiting = used.length === 0;
        const el = root.querySelector('#levers');
        el.innerHTML = `
          <div class="levers-head">
            <h3><span class="h-ico">${icon('gavel', { size: 16 })}</span>Tus acciones este ${m.unit}</h3>
            <span class="ap" id="ap" aria-label="${used.length} de ${ACTION_POINTS} acciones usadas">${Array.from({ length: ACTION_POINTS }, (_, i) => `<i class="${i < used.length ? 'on' : ''}"></i>`).join('')}<small>${ACTION_POINTS - used.length} libre${ACTION_POINTS - used.length === 1 ? '' : 's'}</small></span>
          </div>
          <div class="lever-grid">${levers}</div>
          <div class="lever-ctrl">${controlFor(open, rate)}</div>
          ${tradeoffLine(move, sell)}
          <div class="decision-actions">
            ${diff.timer ? '<div class="timer-slot"></div>' : ''}
            <span class="press-hint">${diff.hints ? (inBand(end.inflation) ? `La proyección termina en la meta (${pct(end.inflation)}).` : `La proyección termina fuera de la meta (${pct(end.inflation)}).`) : `Proyección: ${pct(end.lo)} a ${pct(end.hi)}`}</span>
            <button class="btn btn-primary btn-announce" id="announce" data-announce>${icon(waiting ? 'equal' : 'gavel', { size: 18 })}${waiting ? `Esperar y pasar el ${m.unit}` : `Anunciar (${used.length} ${used.length === 1 ? 'acción' : 'acciones'})`} <span class="kbd">Enter</span></button>
          </div>`;
        shownRate = rate;
        root.querySelector('#projection .fan').innerHTML = fanChart({ history: m.history, projection: proj, total: m.turns, labels: m.labels().map(shortLabel) });

        el.querySelectorAll('[data-lever]').forEach(b => b.addEventListener('click', () => {
            open = b.dataset.lever;
            music.click();
            updateDecision();
        }));
        el.querySelectorAll('[data-move]').forEach(b => b.addEventListener('click', () => { move = Number(b.dataset.move); music.click(); updateDecision(); }));
        el.querySelectorAll('[data-follow]').forEach(b => b.addEventListener('click', () => {
            const want = Number(b.dataset.follow);
            move = m.moves.reduce((best, x) => Math.abs(x - want) < Math.abs(best - want) ? x : best, 0);
            music.click();
            updateDecision();
        }));
        el.querySelectorAll('[data-sell]').forEach(b => b.addEventListener('click', () => { sell = Number(b.dataset.sell); music.click(); updateDecision(); }));
        el.querySelectorAll('[data-tone]').forEach(b => b.addEventListener('click', () => { tone = b.dataset.tone; music.click(); updateDecision(); }));
        el.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => { toolPick = toolPick === b.dataset.pick ? null : b.dataset.pick; scriptedPick = null; music.click(); updateDecision(); }));
        el.querySelectorAll('[data-scripted]').forEach(b => b.addEventListener('click', () => { scriptedPick = scriptedPick === b.dataset.scripted ? null : b.dataset.scripted; toolPick = null; music.sting(); updateDecision(); }));
        el.querySelectorAll('[data-convince]').forEach(b => b.addEventListener('click', () => { convinced = b.dataset.convince; music.sting(); updateDecision(); }));
        el.querySelectorAll('[data-term]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openGlossary(b.dataset.term); }));
        el.querySelector('[data-announce]').addEventListener('click', () => announce());
        timer.mount(el);
    };

    // ---------- Antes del turno: momento decisivo, citaciones y proyectos de ley ----------

    const climaxShown = new Set();
    const showClimax = () => {
        const c = m.scenario.climax;
        climaxShown.add(m.quarter);
        music.setMood('surprise');
        music.sting();
        const modal = openModal(`
          <div class="climax-intro">
            <div class="ch-art">${scene(c.scene)}</div>
            <div class="breaking-tag">${icon('flame', { size: 16 })} MOMENTO DECISIVO</div>
            <h2>${c.title}</h2>
            <p class="lead">${c.text}</p>
            <div class="climax-rule">${icon('scale', { size: 18 })}<span>Este ${m.unit} te comparas con lo que hizo el <strong>BCRP real</strong>, con los mismos imprevistos. Si lo igualas o lo mejoras: <strong>+${CLIMAX.reward} de credibilidad</strong>. Si no: <strong>−${CLIMAX.penalty}</strong>.</span></div>
          </div>
          <div class="modal-actions"><button class="btn btn-primary" data-go>Enfrentarlo</button></div>`, { dismissible: false, wide: true });
        modal.querySelector('[data-go]').addEventListener('click', () => { modal.parentElement._close(); briefing(); });
    };

    const briefing = () => {
        if (isClimax() && !climaxShown.has(m.quarter)) return showClimax();
        music.setMood('decision');
        if (m.congress.pending) return showCitation();
        if (m.congress.pendingBill) return showBill();
        const steps = opts.coachSteps?.briefing?.[m.quarter];
        if (steps) coach(steps(m));
        timer.start();
    };

    const backToTable = modal => {
        modal.querySelector('[data-back]').addEventListener('click', () => {
            modal.parentElement._close();
            render();
            briefing();
        });
    };

    const showBill = () => {
        const b = m.congress.pendingBill;
        const icons = ['megaphone', 'handshake', 'mute'];
        music.setMood('surprise');
        music.sting();
        const modal = openModal(`
          <div class="citation bill">
            <div class="cite-hero">
              ${congressScene(BILL_ICON[b.id] ?? 'scroll', { angry: m.pressure >= m.cg.insistAt })}
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
                    : r.factor < 1 ? 'Se aprobó una versión moderada: el daño es menor, pero existe.' : 'El proyecto se aprobó tal cual.';
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
                ${r.passed && r.bill.effects.shock?.demand ? `<div class="note warn">Efecto en la economía: ${r.bill.effects.shock.demand > 0 ? 'más gasto y más presión sobre los precios' : 'menos crédito y menos gasto'} durante ${r.bill.effects.turns} ${m.unitWord(r.bill.effects.turns)}.</div>` : ''}
                ${r.passed && r.bill.effects.reserves && r.after.reserves != null ? `<div class="note bad">Las reservas bajan a US$ ${r.after.reserves.toFixed(1)} mil millones.</div>` : ''}
                <div class="modal-actions"><button class="btn btn-primary" data-back>Volver a la mesa</button></div>
              </div>`;
            backToTable(modal);
        }));
    };

    const showCitation = () => {
        const q = m.congress.pending;
        const labels = { tecnica: 'Responder con el mandato', promesa: 'Calmar con una promesa', evasiva: 'Salir por la tangente' };
        const icons = { tecnica: 'scroll', promesa: 'handshake', evasiva: 'shuffle' };
        const extra = { tecnica: '', promesa: 'Te comprometes a no subir la tasa', evasiva: '' };
        music.setMood('surprise');
        music.sting();
        const modal = openModal(`
          <div class="citation">
            <div class="cite-hero">
              <span class="cite-bust">${congressScene('megaphone', { angry: m.pressure >= m.cg.citeAt + 10 })}</span>
              <div>
                <div class="breaking-tag">CITACIÓN</div>
                <h2>El Congreso cita al presidente del BCR</h2>
                ${q.kind === 'recreacion' ? realChip(`Recreación de un hecho real · ${q.year}`, q.basis) : realChip(`Pregunta real · ${q.year}`, `Hecha en el Congreso (${q.context}). Se muestra sin el nombre del congresista.`)}
              </div>
            </div>
            <blockquote class="bubble cite-q">“${q.text}”${q.note ? `<span class="q-note">${icon('pin', { size: 13 })}${q.note}</span>` : ''}</blockquote>
            <p class="cite-ask">${icon('megaphone', { size: 16 })}${m.pressure >= m.cg.citeAt + 10 ? 'Están furiosos contigo.' : 'Quieren escuchar al BCR.'} Lo que digas también lo oyen los mercados.</p>
            <div class="answers">${q.answers.map((a, i) => `
              <button class="answer" data-answer="${i}">
                <span class="ans-ico ${a.style}">${icon(icons[a.style], { size: 22 })}</span>
                <span class="ans-body"><strong>${labels[a.style]}</strong><span>“${a.text}”</span>
                ${diff.hints ? effectChips({ ...ANSWER_EFFECTS[a.style], extra: extra[a.style] }) : ''}</span>
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
                ${r.fx.promise ? `<div class="note warn"><strong>Compromiso público:</strong> prometiste no subir la tasa este ${m.unit}.</div>` : ''}
                <div class="modal-actions"><button class="btn btn-primary" data-back>Volver a la mesa</button></div>
              </div>`;
            backToTable(modal);
        }));
    };

    // ---------- Anunciar y ver qué pasó ----------

    const announce = async ({ timeout = false } = {}) => {
        if (busy) return;
        busy = true;
        timer.stop();
        const s = m.state;
        const rate = Math.max(m.minRate, s.rate + move);
        const d = rate - s.rate;
        const parts = [];
        if (d !== 0) parts.push(`${d > 0 ? 'elevar' : 'reducir'} la tasa de referencia a ${pct(rate, 2)}`);
        if (sell > 0) parts.push(`vender US$ ${sell} mil millones`);
        if (sell < 0) parts.push(`comprar US$ ${-sell} mil millones`);
        if (toolPick) parts.push(TOOL_BY_ID[toolPick].name.toLowerCase());
        if (scriptedPick) parts.push(`activar ${m.tools.find(t => t.id === scriptedPick).name}`);
        await announceSuspense(timeout ? `Se acabó el tiempo. El ${m.unit} pasó sin decisión: la tasa se mantiene en ${pct(rate, 2)}…`
            : parts.length ? `El Directorio acordó ${parts.join(', ')}…${tone !== 'neutral' && m.guidanceOn ? ` «${GUIDANCE[tone].phrase}»` : ''}`
                : `${tone !== 'neutral' && m.guidanceOn ? `«${GUIDANCE[tone].phrase}» ` : ''}El Directorio decidió esperar: la tasa se mantiene en ${pct(rate, 2)}…`);
        if (scriptedPick) m.useTool(scriptedPick);
        const rec = m.decide(rate, sell, tone, toolPick, { convinced, timeout });
        rec.timeout = timeout;
        rec.cast = castLines(m, rec);
        lastRec = rec;
        resetPlan();
        const reveal = () => {
            if (!m.isOver) { render(); flash(rec); }
            showReaction(m, rec, () => { showNewspaper(rec); busy = false; });
        };
        if (rec.surprise) {
            showBreaking(rec.surprise, { onClose: reveal });
            const steps = opts.coachSteps?.surprise?.[rec.quarter];
            if (steps) coach(steps(rec));
        } else reveal();
    };

    const flash = rec => {
        [['g-infl', inBand(rec.state.inflation) || rec.state.inflation < rec.prev.inflation], ['g-jobs', rec.state.growth >= rec.prev.growth],
            ['g-cred', rec.state.credibility >= rec.prev.credibility], ['g-trust', m.trust >= rec.prevTrust]]
            .forEach(([id, good]) => root.querySelector(`#${id}`)?.classList.add(good ? 'flash-good' : 'flash-bad'));
    };

    const showNewspaper = rec => {
        const good = inBand(rec.state.inflation) && rec.state.growth > 0;
        music.setMood(good ? 'good' : 'bad');
        const L = cardLesson(rec.event);
        const miss = rec.state.inflation - rec.projected;
        const surprise = Math.abs(miss) < 0.15 ? 'Tal como proyectaste.'
            : rec.surprise ? `${Math.abs(miss).toFixed(1)} pp ${miss > 0 ? 'más' : 'menos'} de lo proyectado, por el imprevisto: ${rec.surprise.title.toLowerCase()}.`
                : `${Math.abs(miss).toFixed(1)} pp ${miss > 0 ? 'más' : 'menos'} de lo proyectado: la realidad nunca es exacta.`;
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
            <p class="paper-sub">${rec.timeout ? `Sin decisión ni comunicado, la tasa quedó en ${pct(rec.rate, 2)}.` : rec.waited ? `El BCR decidió esperar y mantuvo la tasa en ${pct(rec.rate, 2)}.` : `El BCR ${rec.move === 0 ? `mantuvo la tasa en ${pct(rec.rate, 2)}` : `${rec.move > 0 ? 'subió' : 'bajó'} la tasa ${Math.round(Math.abs(rec.move) * 100)} pb, a ${pct(rec.rate, 2)}`}${rec.sell > 0 ? ` y vendió US$ ${rec.sell} mil millones` : rec.sell < 0 ? ` y compró US$ ${-rec.sell} mil millones` : ''}.`}</p>
            ${rec.tone && rec.tone !== 'neutral' ? `<p class="paper-quote">${icon('megaphone', { size: 14 })}Discurso ${TONE_UI[rec.tone].label.toLowerCase()}: «${GUIDANCE[rec.tone].phrase}»</p>` : ''}
            ${rec.tool ? `<p class="paper-tool">${icon(TOOL_BY_ID[rec.tool].icon, { size: 14 })}<span><strong>${TOOL_BY_ID[rec.tool].name}.</strong> ${TOOL_BY_ID[rec.tool].history}</span></p>` : ''}
          </div>
          <div class="reveal">
            <div class="reveal-num"><small>Inflación</small><span class="num" data-anim-from="${rec.prev.inflation}" data-anim-to="${rec.state.inflation}">${pct(rec.prev.inflation)}</span></div>
            <p class="reveal-note">Proyectabas ${pct(rec.projected)}. ${surprise}</p>
          </div>
          <div class="deltas${rec.fx ? ' six' : ''}">
            ${chip('Inflación', rec.prev.inflation, rec.state.inflation, v => pct(v), rec.state.inflation < PARAMS.target)}
            ${chip('PBI', rec.prev.growth, rec.state.growth, v => pct(v), true)}
            ${chip('Confianza', rec.prevTrust, m.trust, v => `${Math.round(v)}`, true)}
            ${chip('Credibilidad', rec.prev.credibility, rec.state.credibility, v => `${Math.round(v)}`, true)}
            ${rec.fx ? chip('Dólar (S/)', rec.fx.before.rate, rec.fx.rate, v => v.toFixed(3), false) : ''}
            ${rec.fx ? chip('Reservas', rec.fx.before.reserves, rec.fx.reserves, v => v.toFixed(1), true) : ''}
          </div>
          <div class="lesson">${icon('book', { size: 16 })}<span><strong>La carta del ${m.unit}: ${rec.event.title}.</strong> La tentación era «${L.tempt.toLowerCase()}». ${L.lesson}</span></div>
          ${tabs([
            { key: 'resumen', label: 'Resumen', html: `
              ${rec.streak >= 3 ? `<div class="streak-pop">¡${rec.streak} ${m.unitWord(rec.streak)} seguidos en la meta!</div>` : ''}
              ${rec.timeout ? '<div class="note warn">Se acabó el tiempo y no hubo decisión. En una crisis, no decidir también es una decisión.</div>' : ''}
              ${rec.notes.map(n => `<div class="note ${n.tone}">${n.text}</div>`).join('')}
              ${real}
              ${!rec.notes.length && !real && !rec.timeout && rec.streak < 3 ? `<p class="quiet">Un ${m.unit} sin sobresaltos en la prensa. Mira cómo lo vivió la gente y cada región.</p>` : ''}` },
            { key: 'gente', label: 'La gente', badge: hurtCount(rec.people) || null, html: sectorsReport(rec.people) },
            { key: 'regiones', label: 'Regiones', html: regionsReport(rec.regions) },
            { key: 'porque', label: '¿Por qué?', html: `
              <div class="factors">${factors.map(([label, v]) => `
                <div class="factor"><span>${label}</span>
                  <div class="bar"><div class="fill ${v >= 0 ? 'up' : 'down'}" style="width:${Math.min(50, Math.abs(v) / scale * 50)}%"></div></div>
                  <span class="val num">${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)} pp</span></div>`).join('')}
              </div>
              <p class="why-note">${rec.event.kind === 'oferta' ? 'Fue sobre todo un choque de oferta: la tasa no lo evita, pero sí impide que contagie a las expectativas.' : `La tasa actúa sobre la demanda con rezago: lo que decides hoy pesa más en los próximos ${m.unitWord(2)}.`}</p>
              ${rec.fx ? `<p class="why-note">El dólar se movió ${rec.fx.dep >= 0 ? '+' : ''}${rec.fx.dep.toFixed(1)}%: ${rec.fx.dep > 0 ? 'eso encareció lo importado y sumó a la inflación.' : 'eso abarató lo importado y restó un poco a la inflación.'}</p>` : ''}` }
          ])}
          <div class="modal-actions"><button class="btn btn-primary" data-continue>${over ? 'Ver el final' : `Siguiente ${m.unit}`}</button></div>
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
                briefing();
            }
        });
    };

    render();
    if (opts.intro) opts.intro(briefing);
    else briefing();
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

const starsHtml = n => `<span class="stars big" aria-label="${n} de 3 estrellas">${[1, 2, 3].map(k => k <= n ? '★' : '<span class="off">★</span>').join('')}</span>`;

/**
 * Pantalla final: arquetipo (o final dramático), estrellas, el peor turno, Doña Rosa, tarjeta para
 * compartir y, debajo, el recorrido, la gente, la historia real y los logros.
 */
export function renderVerdict(root, m, r, { title, text, reality, sources, achievements = [], newAch = [], stats, actions, mode = 'Modo libre', challenge = null }) {
    const end = ending(m, r);
    const won = r.passed;
    const confetti = won ? '<div class="confetti" aria-hidden="true">' + Array.from({ length: 36 }, () => `<i style="left:${Math.random() * 100}%;background:hsl(${Math.random() * 360},70%,55%);animation-delay:${Math.random() * 0.8}s;animation-duration:${2 + Math.random() * 1.5}s"></i>`).join('') + '</div>' : '';
    const labels = m.labels().map(shortLabel);
    const real = m.scenario.realPath;
    const fxChart = m.fx ? compareChart({ labels, band: false, unit: '', title: 'Tipo de cambio (S/ por US$)' + (real?.fxRate ? ': tú vs. la historia real' : ''), series: [
        { values: m.history.map(h => h.fx), color: 'var(--navy)', label: 'Tu tipo de cambio' },
        ...(real?.fxRate ? [{ values: [null, ...real.fxRate], color: 'var(--red)', label: 'Tipo de cambio real', dash: true }] : [])] }) : '';
    const charts = real
        ? compareChart({ labels, title: 'Inflación: tú vs. la historia real', series: [
            { values: m.history.map(h => h.state.inflation), color: 'var(--navy)', label: 'Tu inflación' },
            { values: [null, ...real.inflation], color: 'var(--red)', label: 'Inflación real', dash: true }] })
        + compareChart({ labels, band: false, title: 'Tasa de referencia: tú vs. el BCRP', series: [
            { values: m.history.map(h => h.rate), color: 'var(--navy)', label: 'Tu tasa' },
            { values: [null, ...real.rate], color: 'var(--red)', label: 'Tasa real del BCRP', dash: true }] })
        : fanChart({ history: m.history, projection: [], total: m.turns, labels });
    const hero = end.early ? `
        <div class="ending-hero early">
          <div class="ch-art">${scene(end.early.scene)}</div>
          <div><div class="breaking-tag">FIN DEL MANDATO · ${m.label(Math.max(0, m.quarter - 1))}</div><h1>${end.early.title}</h1><p class="lead">${end.early.text}</p>
          <p class="arch-line">Tu estilo hasta aquí: <strong>${end.archetype.name}</strong>. ${end.archetype.lesson}</p></div>
        </div>` : `
        <div class="ending-hero">
          <div class="arch-emblem ${end.archetype.id}">${icon(end.archetype.icon, { size: 46 })}</div>
          <div><div class="eyebrow">Tu arquetipo</div><h1>${end.archetype.name}</h1>${starsHtml(end.stars)}
          <p class="lead">${end.archetype.how}</p><p class="arch-lesson">«${end.archetype.lesson}»</p></div>
        </div>`;

    root.innerHTML = `
    <header class="topbar"><div class="brand">${logo}<span>Sol Firme</span></div><div class="spacer"></div>${musicButton()}<button class="btn btn-ghost" data-exit>Salir</button></header>
    <div class="andean-strip">${andeanBand}</div>
    <main class="page" style="max-width:920px">
      <section class="card verdict ${won ? 'win' : 'lose'}">
        ${confetti}
        ${hero}
        <div class="paper">
          <div class="masthead"><span>DIARIO LA MONEDA</span><span>Edición especial</span></div>
          ${andeanBand}
          <h2 class="paper-head">${title}</h2>
          <p class="paper-sub">${text}</p>
        </div>
        ${r.checks ? `<div class="section-title">Objetivos</div><ul class="goals">${r.checks.map(c => `<li><span class="mark ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '✗'}</span><span>${c.label}</span><span class="val num">${c.value}</span></li>`).join('')}</ul>` : ''}
        <div class="verdict-stats">${stats.map(([v, l]) => `<div><strong class="num">${v}</strong><small>${l}</small></div>`).join('')}</div>
        <div class="ending-row">
          ${end.worst ? `<div class="worst">${icon('flame', { size: 18 })}<div><small>Tu peor ${m.unit}</small><strong>${end.worst.label}</strong><span>Inflación ${pct(end.worst.inflation)} · PBI ${pct(end.worst.growth)}${end.worst.event ? ` · ${end.worst.event}` : ''}</span></div></div>` : ''}
          <div class="rosa-says"><span>${castFace('rosa', 52)}</span><div><small>Doña Rosa, casera del mercado</small><p>“${end.rosa}”</p></div></div>
        </div>
        <div class="share-box">
          <div class="share-preview"></div>
          <div class="share-blurb"><div class="section-title">Comparte tu mandato</div><p>Una tarjeta con tu arquetipo, tus estrellas, tu peor ${m.unit} y la frase de Doña Rosa. ${challenge ? 'Es el reto de la semana: tus amigos juegan con el mismo mazo.' : ''}</p>
          <div class="share-actions"><button class="btn btn-primary" data-share>${icon('chat', { size: 16 })}Compartir</button><span class="share-msg" aria-live="polite"></span></div></div>
        </div>
        <div class="section-title">Tu recorrido</div>
        <div class="chart">${charts}${fxChart}</div>
        ${peopleBalance(m.peopleHistory, m.regionHistory)}
        ${reality ? `<div class="section-title">Lo que pasó en la realidad</div><p class="reality">${reality}</p>` : ''}
        ${achievementsBlock(achievements, newAch)}
        ${sources?.length ? `<details class="sources"><summary>Fuentes</summary><ul>${sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ul></details>` : ''}
        <div class="modal-actions">${actions.map(a => `<button class="btn ${a.primary ? 'btn-primary' : ''}" data-action="${a.id}">${a.label}</button>`).join('')}</div>
      </section>
    </main>`;
    bindMusicButton(root);
    bindMap(root);
    const canvas = drawShareCard({
        mode: challenge && /^Reto/.test(mode) ? `${mode} · ${challenge}` : `${mode}${challenge ? ` · Reto ${challenge}` : ''}`,
        headline: end.early ? end.early.title : end.archetype.name,
        sub: end.early ? `Mi mandato terminó en ${m.label(Math.max(0, m.quarter - 1))}.` : end.archetype.lesson,
        stars: end.stars, score: m.scenario.realPath ? null : r.score, worst: end.worst, rosa: end.rosa, unit: m.unit
    });
    canvas.className = 'share-canvas';
    root.querySelector('.share-preview').appendChild(canvas);
    root.querySelector('[data-share]').addEventListener('click', async () => {
        const out = await shareCard(canvas, shareText(m, end, { mode, challenge }));
        root.querySelector('.share-msg').textContent = out === 'downloaded' ? 'Imagen descargada y texto copiado. ¡Pásalo por WhatsApp!' : out === 'shared' ? '¡Compartido!' : '';
    });
    root.querySelector('[data-exit]').addEventListener('click', actions.find(a => a.id === 'exit')?.run ?? (() => {}));
    root.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', actions.find(a => a.id === b.dataset.action).run));
    window.scrollTo({ top: 0 });
}

/**
 * Reloj de decisión. Solo corre cuando no hay modales ni mensajes abiertos; al llegar a cero llama
 * `onExpire` (el turno pasa sin decisión). Con `seconds = 0` no hace nada.
 */
export function createTimer(seconds, onExpire, isBusy) {
    let left = seconds, id = null, host = null;
    const draw = () => {
        const slot = host?.querySelector('.timer-slot');
        if (!slot || !seconds) return;
        const k = left / seconds;
        slot.innerHTML = `<div class="timer ${left <= 10 ? 'urgent' : ''}"><div class="timer-bar" style="width:${k * 100}%"></div><span>${Math.ceil(left)} s · el reloj no espera</span></div>`;
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
