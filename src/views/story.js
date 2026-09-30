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

function chapterIntro(root, ch, { onHome }) {
    const milestones = INTERLUDES[ch.id] ?? [];
    const modal = openModal(`
      <div class="eyebrow">Capítulo ${ch.number} · ${ch.year}</div>
      <h2>${ch.title}</h2>
      ${milestones.length ? `<ul class="milestones compact">${milestones.map(x => `<li><strong>${x.year}</strong> ${x.text}</li>`).join('')}</ul>` : ''}
      ${ch.context.map(p => `<p class="lead">${p}</p>`).join('')}
      <div class="modal-actions">
        <button class="btn" data-close>Volver</button>
        <button class="btn btn-primary" data-start>Asumir el cargo</button>
      </div>`, { wide: true });
    modal.querySelector('[data-start]').addEventListener('click', () => {
        modal.parentElement._close();
        playChapter(root, ch, { onHome });
    });
}

function playChapter(root, ch, { onHome }) {
    const back = () => renderStory(root, { onHome });
    const next = CHAPTERS[CHAPTERS.indexOf(ch) + 1];
    const actions = r => [
        { id: 'exit', label: 'Volver a la línea de tiempo', run: back },
        { id: 'retry', label: 'Reintentar', run: () => playChapter(root, ch, { onHome }) },
        ...(r.passed && next ? [{ id: 'next', label: `Siguiente: ${next.year}`, primary: true, run: () => chapterIntro(root, next, { onHome }) }] : [])
    ];

    if (ch.kind === 'hyper') {
        playHyper(root, ch, {
            onExit: back,
            onFinish: (h, r) => {
                saveChapter(ch.id, r);
                renderHyperVerdict(root, h, r, { actions: actions(r) });
            }
        });
        return;
    }

    playScenario(root, ch, {
        title: `${ch.year} · ${ch.title}`,
        onExit: back,
        onFinish: (m, r) => {
            saveChapter(ch.id, r);
            const go = r.gameOver && GAME_OVER[r.gameOver];
            renderVerdict(root, m, r, {
                title: go ? go.title : r.passed ? '¡Capítulo superado!' : 'No lograste los objetivos',
                text: go ? go.text : r.passed
                    ? `Tu desempeño frente al BCRP real, con los mismos imprevistos: ${r.score}%. ${r.score >= 100 ? '¡Lo hiciste igual o mejor que la historia!' : 'Buen trabajo, aunque el BCRP real mantuvo la inflación más cerca de la meta.'}`
                    : 'Revisa los objetivos y compara tus decisiones con las del BCRP real.',
                reality: ch.reality,
                sources: ch.sources,
                stats: [
                    [`${r.score}%`, 'vs. BCRP real (100% = igual)'],
                    [r.passed ? stars(r.stars) : '—', 'estrellas'],
                    [`${Math.round(r.final.credibility)}`, 'credibilidad final'],
                    [`${m.stats.surprises}`, 'imprevistos']
                ],
                actions: actions(r)
            });
        }
    });
}
