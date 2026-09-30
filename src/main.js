import './styles.css';
import { TUTORIAL } from './model/history.js';
import { FREE_SCENARIO } from './game/mandate.js';
import { getStory, markTutorialDone, getMandateRecord, saveMandate, markIntroSeen, getProgress, getSettings, saveSettings, DIFFICULTIES } from './storage.js';
import { renderTitle, renderIntro } from './views/intro.js';
import { renderStory } from './views/story.js';
import { playScenario, renderVerdict, GAME_OVER } from './views/play.js';
import { TUTORIAL_COACH } from './views/tutorialScript.js';
import { openModal } from './views/modal.js';
import { music } from './audio/music.js';

const root = document.getElementById('app');

function title() {
    music.setMood('title');
    renderTitle(root, {
        story: getStory(),
        record: getMandateRecord(),
        settings: getSettings(),
        onSettings: settings,
        onTutorial: tutorial,
        onStory: () => renderStory(root, { onHome: title }),
        onFree: free,
        onIntro: () => renderIntro(root, { onDone: () => { markIntroSeen(); title(); } })
    });
}

function tutorial() {
    const start = () => playScenario(root, TUTORIAL, {
        title: 'Tutorial',
        seed: 7,
        difficulty: 'facil',
        coachSteps: TUTORIAL_COACH,
        onExit: title,
        onFinish: (m, r) => {
            if (r.passed) markTutorialDone();
            renderVerdict(root, m, r, {
                title: r.passed ? '¡Aprobaste tu primer Programa Monetario!' : 'Casi: la inflación quedó alta',
                text: r.passed
                    ? 'Ya sabes lo esencial: la tasa, la proyección, los asesores y los imprevistos. Ahora vive la historia real del BCR.'
                    : `La inflación terminó en ${r.final.inflation.toFixed(1)}%. Prueba subir un poco más la tasa y guíate por la proyección.`,
                stats: [[`${r.final.inflation.toFixed(1)}%`, 'inflación final'], [`${Math.round(r.final.credibility)}`, 'credibilidad'], [`${Math.round(m.pressure)}`, 'presión política'], [`${m.stats.surprises}`, 'imprevistos']],
                actions: [
                    { id: 'exit', label: 'Volver al inicio', run: title },
                    { id: 'retry', label: 'Repetir tutorial', run: tutorial },
                    ...(r.passed ? [{ id: 'story', label: 'Ir al Modo Historia', primary: true, run: () => renderStory(root, { onHome: title }) }] : [])
                ]
            });
        }
    });
    // La primera vez, las 4 pantallas de introducción van antes del tutorial.
    if (!getProgress().introSeen) renderIntro(root, { onDone: () => { markIntroSeen(); start(); } });
    else start();
}

function free() {
    const rec = getMandateRecord();
    const go = () => playScenario(root, FREE_SCENARIO, {
        title: 'Modo Libre',
        tips: rec.tipsSeen ? null : [
            'Mueve la tasa y mira el abanico: es lo que tu equipo proyecta para el próximo año.',
            'La tasa tarda en hacer efecto. Decide pensando en dónde estará la inflación, no dónde está hoy.',
            'Cuidado con los imprevistos: aparecen después de anunciar, y la proyección no los ve.'
        ],
        onExit: title,
        onFinish: (m, r) => {
            const before = getMandateRecord();
            const newAch = r.achievements.filter(a => !before.achievements.includes(a.id));
            saveMandate({
                played: before.played + 1,
                reappointed: before.reappointed + (r.reappointed ? 1 : 0),
                bestScore: Math.max(before.bestScore, r.score),
                achievements: [...new Set([...before.achievements, ...r.achievements.map(a => a.id)])],
                tipsSeen: true
            });
            const over = r.gameOver && GAME_OVER[r.gameOver];
            renderVerdict(root, m, r, {
                title: over ? over.title : r.reappointed ? '¡El Directorio es ratificado por otro período!' : 'El Directorio no es ratificado',
                text: over ? over.text : r.reappointed
                    ? `Mantuviste la inflación en la meta ${r.inBandCount} de ${m.turns} trimestres y terminaste en ${r.final.inflation.toFixed(1)}%.`
                    : `La inflación estuvo en la meta ${r.inBandCount} de ${m.turns} trimestres. Para ser ratificado necesitas 9 trimestres en meta y terminar dentro del rango.`,
                achievements: r.achievements, newAch,
                stats: [[`${r.score}${r.score > before.bestScore && r.score > 0 ? ' ★' : ''}`, r.score > before.bestScore && r.score > 0 ? 'puntaje · ¡nuevo récord!' : 'puntaje'], [`${r.inBandCount}/${m.turns}`, 'trimestres en meta'], [`${r.bestStreak}`, 'mejor racha'], [`${m.stats.surprises}`, 'imprevistos']],
                actions: [
                    { id: 'exit', label: 'Volver al inicio', run: title },
                    { id: 'again', label: 'Nuevo mandato', primary: true, run: free }
                ]
            });
        }
    });
    if (rec.tipsSeen) return go();
    openModal(`
      <div class="eyebrow">Modo libre</div>
      <h2>Tres años en el Directorio del BCR</h2>
      <p class="lead">Doce trimestres con eventos al azar que se ponen más difíciles cada año. Te ratifican si mantienes la inflación en la meta al menos 9 de 12 trimestres y terminas dentro del rango.</p>
      <ul class="goals">
        <li><span class="mark">1</span><span><strong>Inflación</strong> entre 1% y 3%.</span></li>
        <li><span class="mark">2</span><span><strong>Crecimiento</strong>: si frenas de más, llega la recesión.</span></li>
        <li><span class="mark">3</span><span><strong>Credibilidad</strong>: se gana cumpliendo y se pierde cediendo.</span></li>
        <li><span class="mark">4</span><span><strong>Presión política</strong>: las alzas son impopulares.</span></li>
      </ul>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Empezar mandato</button></div>`, { onClose: go });
}

function settings() {
    const current = getSettings().difficulty;
    const modal = openModal(`
      <div class="eyebrow">Configuración</div>
      <h2>Dificultad</h2>
      <p class="lead">Aplica al Modo Historia y al Modo Libre. El tutorial siempre se juega en Fácil.</p>
      <div class="settings-options">${Object.entries(DIFFICULTIES).map(([id, d]) => `
        <button class="setting ${id === current ? 'on' : ''}" data-diff="${id}" role="radio" aria-checked="${id === current}">
          <span class="dot"></span><span><strong>${d.name}</strong><small>${d.desc}</small></span>
        </button>`).join('')}
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Listo</button></div>`, { onClose: title });
    modal.querySelectorAll('[data-diff]').forEach(b => b.addEventListener('click', () => {
        saveSettings({ difficulty: b.dataset.diff });
        modal.querySelectorAll('[data-diff]').forEach(x => {
            const on = x === b;
            x.classList.toggle('on', on);
            x.setAttribute('aria-checked', on);
        });
        music.click();
    }));
}

title();
