/**
 * Utilidades de vista compartidas entre el turno (play.js / turn/*) y el capítulo de 1990 (hyper.js).
 * Sin reglas de juego aquí: solo DOM, animación y presentación.
 */
import { CHARACTERS } from '../model/events.js';
import { openModal, modalOpen } from './modal.js';
import { music } from '../audio/music.js';
import { andeanBand } from './art.js';
import { bust } from './icons.js';
import { inBand } from '../model/economy.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Busto ilustrado de un personaje de `model/events.js` (MEF, prensa, gremios…). */
export function avatar(who) {
    const c = CHARACTERS[who] ?? CHARACTERS.analista;
    return `<span class="avatar" style="--c:${c.color}" title="${c.name}">${bust(who in CHARACTERS ? who : 'analista', c.color, 52)}</span>`;
}

/** "Trimestre 2 2026" → "Trimestre 2 '26": las etiquetas largas no caben en los ejes del gráfico. */
export function shortLabel(t) {
    return t.replace(/ 20(\d\d)$/, " '$1").replace(/ 19(\d\d)$/, " '$1");
}

/** Anima un número de `data-anim-from` a `data-anim-to` en `el`, y lo pinta verde o rojo al llegar. */
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

/** Ícono de cada proyecto de ley del Congreso (model/congress.js BILLS), por id. */
export const BILL_ICON = { 'retiro-afp': 'piggy', 'topes-tasas': 'percent', 'oro-bcr': 'gold', 'usar-reservas': 'vault' };
