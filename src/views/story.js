import { scene } from './scenes.js';
import { award } from './achievementsView.js';
import { openShare } from './share.js';
import { CHAPTERS, INTERLUDES, INTERLUDE_SOURCES } from '../model/history.js';
import { logo, andeanBand } from './art.js';
import { openModal } from './modal.js';
import { music, musicButton, bindMusicButton } from '../audio/music.js';
import { playScenario, renderVerdict, GAME_OVER } from './play.js';
import { playHyper, renderHyperVerdict } from './hyper.js';
import { getStory, saveChapter } from '../storage.js';

const stars = n => `<span class="stars" aria-label="${n} de 3 estrellas">${[1, 2, 3].map(k => k <= n ? '★' : '<span class="off">★</span>').join('')}</span>`;

export function isChapterUnlocked(i, story) {
    return i === 0 || !!story.chapters[CHAPTERS[i - 1].id]?.passed;
}

/** Línea de tiempo del Modo Historia. */
export function renderStory(root, { onHome }) {
    const story = getStory();
    music.setMood('title');
    const items = CHAPTERS.map((ch, i) => {
        const open = isChapterUnlocked(i, story);
        const best = story.chapters[ch.id];
        const milestones = (INTERLUDES[ch.id] ?? []).map(x => `<li><strong>${x.year}</strong> ${x.text}</li>`).join('');
        return `
        ${milestones ? `<ul class="milestones">${milestones}</ul>` : ''}
        <article class="chapter ${open ? '' : 'locked'}">
          <div class="chapter-year">${ch.year}</div>
          <div class="chapter-body">
            <div class="concept">Capítulo ${ch.number} · ${ch.concept}</div>
            <h3>${ch.title}</h3>
            <p>${open ? ch.context[0] : 'Supera el capítulo anterior para desbloquearlo.'}</p>
          </div>
          <div class="chapter-cta">
            ${best?.passed ? stars(best.stars) : ''}
            <button class="btn ${open && !best?.passed ? 'btn-primary' : ''}" data-chapter="${ch.id}" ${open ? '' : 'disabled'}>${best?.passed ? 'Jugar de nuevo' : 'Jugar'}</button>
          </div>
        </article>`;
    }).join('');

    root.innerHTML = `
    <header class="topbar"><div class="brand">${logo}<span>Modo Historia</span></div><div class="spacer"></div>${musicButton()}<button class="btn btn-ghost" data-home>Inicio</button></header>
    <div class="andean-strip">${andeanBand}</div>
    <main class="page" style="max-width:880px">
      <div class="levels-head">
        <div class="eyebrow">De la hiperinflación a las metas de inflación</div>
        <h1>Cien años del BCR en cinco crisis</h1>
        <p>Vive los momentos más difíciles de la historia monetaria del Perú. Al final de cada capítulo verás qué hizo el BCRP en la realidad.</p>
      </div>
      <div class="timeline">${items}</div>
      <details class="sources"><summary>Fuentes de la línea de tiempo</summary><ul>${INTERLUDE_SOURCES.map(s => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join('')}</ul></details>
    </main>`;
    bindMusicButton(root);
    root.querySelector('[data-home]').addEventListener('click', onHome);
    root.querySelectorAll('[data-chapter]').forEach(b => b.addEventListener('click', () =>
        chapterIntro(root, CHAPTERS.find(c => c.id === b.dataset.chapter), { onHome })));
}

/** Ilustración de cada diapositiva: hitos (por año) y párrafos de contexto (en orden). */
const SLIDE_SCENES = {
    'hiper-1990': { hitos: { 1922: 'banco-1922', 1931: 'ley-1931', 1985: 'inti-1985' }, contexto: ['hiper', 'shock', 'imprenta'] },
    'crisis-2008': { hitos: { 1991: 'sol-1991', 1993: 'constitucion', 2002: 'meta-2002', 2007: 'meta' }, contexto: ['boom', 'crash'] },
    'nino-2017': { hitos: { '2010–2016': 'desdolarizacion' }, contexto: ['nino', 'mercado'] },
    'pandemia-2020': { hitos: {}, contexto: ['cuarentena', 'reactiva'] },
    'inflacion-2022': { hitos: { 2021: 'mercado' }, contexto: ['dolar-sube', 'guerra'] }
};

/** Intro del capítulo como slider: primero los hitos que llevaron hasta aquí, luego la situación y tu reto. */
function chapterIntro(root, ch, { onHome }) {
    const art = SLIDE_SCENES[ch.id] ?? { hitos: {}, contexto: [] };
    const slides = [
        ...(INTERLUDES[ch.id] ?? []).map(x => ({ kicker: `Antes de este capítulo · ${x.year}`, text: x.text, img: art.hitos[x.year] })),
        ...ch.context.map((p, i) => ({ kicker: i === ch.context.length - 1 ? 'Tu reto' : ch.year, text: p, img: art.contexto[i] }))
    ];
    let i = 0;
    const onKey = e => {
        if (e.key === 'ArrowRight' && i < slides.length - 1) { i++; draw(); }
        else if (e.key === 'ArrowLeft' && i > 0) { i--; draw(); }
    };
    document.addEventListener('keydown', onKey);
    const modal = openModal('<div class="ch-slider"></div>', { wide: true, onClose: () => document.removeEventListener('keydown', onKey) });
    const box = modal.querySelector('.ch-slider');
    const start = () => {
        modal.parentElement._close();
        playChapter(root, ch, { onHome });
    };
    const draw = () => {
        const sl = slides[i], last = i === slides.length - 1;
        box.innerHTML = `
          <div class="ch-art" key="${i}">${scene(sl.img)}</div>
          <div class="ch-body">
            <div class="eyebrow">Capítulo ${ch.number} · ${ch.title}</div>
            <div class="ch-kicker${last ? ' reto' : ''}">${sl.kicker}</div>
            <p class="lead">${sl.text}</p>
          </div>
          <div class="ch-foot">
            <div class="dots">${slides.map((_, k) => `<button class="${k === i ? 'on' : ''}" data-dot="${k}" aria-label="Diapositiva ${k + 1}"></button>`).join('')}</div>
            <div class="ch-actions">
              ${i === 0 ? '<button class="btn" data-close>Volver</button>' : '<button class="btn" data-prev>Atrás</button>'}
              ${!last ? '<button class="btn btn-ghost" data-skip>Saltar</button>' : ''}
              <button class="btn btn-primary" data-next>${last ? 'Asumir el cargo' : 'Siguiente'}</button>
            </div>
          </div>`;
        box.querySelector('[data-prev]')?.addEventListener('click', () => { i--; draw(); });
        box.querySelector('[data-skip]')?.addEventListener('click', start);
        box.querySelector('[data-next]').addEventListener('click', () => { if (last) start(); else { i++; draw(); } });
        box.querySelectorAll('[data-dot]').forEach(b => b.addEventListener('click', () => { i = Number(b.dataset.dot); draw(); }));
    };
    draw();
}

function playChapter(root, ch, { onHome }) {
    const back = () => renderStory(root, { onHome });
    const next = CHAPTERS[CHAPTERS.indexOf(ch) + 1];
    const shareAction = (r, earned) => ({
        id: 'share', label: 'Compartir', run: () => openShare({
            mode: `Capítulo ${ch.number} · ${ch.year}`, won: r.passed,
            score: ch.kind === 'hyper' ? `${r.final.inflation.toFixed(0)}%` : r.score,
            scoreLabel: ch.kind === 'hyper' ? 'inflación del mes' : 'vs. BCRP real',
            title: r.passed ? `Superé «${ch.title}»` : `«${ch.title}» me ganó… por ahora`,
            stats: ch.kind === 'hyper'
                ? [[`${r.final.inflation.toFixed(1)}%`, 'inflación final del mes'], [`${Math.round(r.final.credibility)}`, 'credibilidad'], [r.passed ? '✓' : '✗', 'capítulo superado'], [`${earned.length}`, 'logros']]
                : [[`${r.final.inflation.toFixed(1)}%`, 'inflación final'], [`${r.stars ?? 0}/3`, 'estrellas'], [`${Math.round(r.final.credibility)}`, 'credibilidad'], [`${earned.length}`, 'logros']],
            achievements: earned.map(a => a.name),
            text: `Jugué «${ch.title}» (${ch.year}) en Sol Firme${r.passed ? ' y lo superé' : ''}.`
        })
    });
    const actions = (r, earned = []) => [
        { id: 'exit', label: 'Volver a la línea de tiempo', run: back },
        { id: 'retry', label: 'Reintentar', run: () => playChapter(root, ch, { onHome }) },
        // El capítulo 1990 tiene su propio veredicto; los demás comparten desde renderVerdict.
        ...(ch.kind === 'hyper' ? [shareAction(r, earned)] : []),
        ...(r.passed && next ? [{ id: 'next', label: `Siguiente: ${next.year}`, primary: true, run: () => chapterIntro(root, next, { onHome }) }] : [])
    ];

    if (ch.kind === 'hyper') {
        playHyper(root, ch, {
            onExit: back,
            onFinish: (h, r) => {
                saveChapter(ch.id, r);
                const { earned, fresh } = award({ mode: 'capitulo', chapter: ch.id, m: h, r });
                renderHyperVerdict(root, h, r, { actions: actions(r, earned), achievements: earned, newAch: fresh });
            }
        });
        return;
    }

    playScenario(root, ch, {
        title: `${ch.year} · ${ch.title}`,
        onExit: back,
        onFinish: (m, r) => {
            saveChapter(ch.id, r);
            const { earned, fresh } = award({ mode: 'capitulo', chapter: ch.id, m, r });
            const go = r.gameOver && GAME_OVER[r.gameOver];
            renderVerdict(root, m, r, {
                mode: `Historia · ${ch.year}`,
                title: go ? 'Fin anticipado del capítulo' : r.passed ? '¡Capítulo superado!' : 'No lograste los objetivos',
                text: go ? 'Compara tus decisiones con las del BCRP real y vuelve a intentarlo.' : r.passed
                    ? `Tu desempeño frente al BCRP real, con los mismos imprevistos: ${r.score}%. ${r.score >= 100 ? '¡Lo hiciste igual o mejor que la historia!' : 'Buen trabajo, aunque el BCRP real mantuvo la inflación más cerca de la meta.'}`
                    : 'Revisa los objetivos y compara tus decisiones con las del BCRP real.',
                reality: ch.reality,
                sources: ch.sources,
                achievements: earned, newAch: fresh,
                stats: [
                    [`${r.score}%`, 'vs. BCRP real (100% = igual)'],
                    [r.passed ? stars(r.stars) : '—', 'estrellas'],
                    [`${Math.round(r.final.credibility)}`, 'credibilidad final'],
                    [`${m.stats.surprises}`, 'imprevistos']
                ],
                actions: actions(r, earned)
            });
        }
    });
}
