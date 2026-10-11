import './styles.css';
import { TUTORIAL } from './model/history.js';
import { FREE_SCENARIO } from './game/mandate.js';
import { unlockedTools } from './game/toolbox.js';
import { award, openAchievements, achievementsCount } from './views/achievementsView.js';
import { isoWeek, challengeScenario } from './game/challenge.js';
import { getChallengeBest, saveChallengeScore, getStory, markTutorialDone, getMandateRecord, saveMandate, markIntroSeen, getProgress, getSettings, saveSettings, DIFFICULTIES, getFlag, setFlag } from './storage.js';
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
        onStory: () => withIntro(() => renderStory(root, { onHome: title })),
        onFree: () => withIntro(free),
        onExpress: () => withIntro(() => free({ express: true })),
        onChallenge: () => withIntro(() => free({ challenge: true })),
        challenge: { week: isoWeek().week, best: getChallengeBest(isoWeek().seed) },
        onAchievements: openAchievements,
        achievements: achievementsCount(),
        onIntro: () => renderIntro(root, { onDone: () => { markIntroSeen(); title(); } })
    });
}

/** La primera vez, cualquier modo empieza por "¿Qué es el BCR?". */
function withIntro(next) {
    if (getProgress().introSeen) return next();
    renderIntro(root, { onDone: () => { markIntroSeen(); next(); } });
}

function tutorial() {
    const start = () => playScenario(root, TUTORIAL, {
        title: 'Tutorial',
        seed: 7,
        difficulty: 'facil',
        noTimer: true,
        coachSteps: TUTORIAL_COACH,
        onExit: title,
        onFinish: (m, r) => {
            if (r.passed) markTutorialDone();
            const { earned, fresh } = award({ mode: 'tutorial', m, r });
            renderVerdict(root, m, r, {
                mode: 'Tutorial',
                achievements: earned, newAch: fresh,
                title: r.passed ? '¡Sobreviviste tus primeros cuatro meses!' : 'Casi: la inflación se te escapó',
                text: r.passed
                    ? 'Ya sabes lo esencial: dos acciones por mes, la tasa tarda, el discurso pesa si te creen y siempre hay imprevistos. Ahora vive la historia real del BCR o un mandato libre.'
                    : `La inflación terminó en ${r.final.inflation.toFixed(1)}%. Prueba combinar las dos acciones: subir la tasa y dar un discurso firme el mismo mes.`,
                stats: [[`${r.final.inflation.toFixed(1)}%`, 'inflación final'], [`${Math.round(r.final.credibility)}`, 'credibilidad'], [`${Math.round(m.trust)}`, 'confianza'], [`${m.stats.surprises}`, 'imprevistos']],
                actions: [
                    { id: 'exit', label: 'Volver al inicio', run: title },
                    { id: 'retry', label: 'Repetir tutorial', run: tutorial },
                    ...(r.passed ? [{ id: 'story', label: 'Ir al Modo Historia', primary: true, run: () => renderStory(root, { onHome: title }) }] : [])
                ]
            });
        }
    });
    // La primera vez, la introducción "¿Qué es el BCR?" va antes del tutorial.
    if (!getProgress().introSeen) renderIntro(root, { onDone: () => { markIntroSeen(); start(); } });
    else start();
}

/** Cómo se juega, en cuatro ideas (solo la primera vez que entras a un mandato). */
function howTo(onClose, turns = 12) {
    if (getFlag('howto-v3')) return onClose();
    setFlag('howto-v3');
    openModal(`
      <div class="eyebrow">Cómo se juega</div>
      <h2>${turns === 12 ? 'Doce' : turns === 6 ? 'Seis' : turns} meses al frente del BCR</h2>
      <ul class="goals">
        <li><span class="mark">1</span><span><strong>Cada mes llega una carta</strong>: El Niño, la Fed, un rumor viral… La economía nunca se queda quieta.</span></li>
        <li><span class="mark">2</span><span><strong>Tienes 2 acciones por mes</strong>: tasa, dólares, discurso o encaje. Esperar también es una decisión.</span></li>
        <li><span class="mark">3</span><span><strong>La tasa tarda</strong> 2 a 3 meses. La proyección es un rango que se estrecha con tu credibilidad.</span></li>
        <li><span class="mark">4</span><span><strong>Doña Rosa, Kevin, Valeria y el Congreso</strong> sienten cada decisión. Lo que hagas hoy te alcanza después.</span></li>
      </ul>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Asumir el cargo</button></div>`, { onClose });
}

function free({ express = false, challenge = false } = {}) {
    const week = isoWeek();
    // En el modo libre se usan las herramientas ganadas en el modo historia (el encaje llega en el mes 6).
    const scenario = challenge ? challengeScenario() : {
        ...FREE_SCENARIO,
        toolbox: [...new Set([...unlockedTools(getStory().chapters), 'encaje-sube', 'encaje-baja'])],
        showLockedTools: true,
        // Exprés: medio mandato, con las cartas subiendo de intensidad el doble de rápido.
        ...(express ? { id: 'expres', turns: 6, yearLength: 2, toolUnlock: { 'encaje-sube': 2, 'encaje-baja': 2 }, reappoint: { ...FREE_SCENARIO.reappoint, minInBand: 4 } } : {})
    };
    const mode = express ? 'Mandato exprés' : challenge ? 'Reto de la semana' : 'Modo libre';
    const go = () => playScenario(root, scenario, {
        title: challenge ? `Reto · semana ${week.week}` : mode,
        // El reto usa la misma semilla para todos y las mismas herramientas base.
        seed: challenge ? week.seed : Date.now(),
        intro: done => challenge
            ? openModal(`
              <div class="eyebrow">Reto de la semana ${week.week}</div>
              <h2>La misma partida para todos</h2>
              <p class="lead">Esta semana, todos los que juegan el reto enfrentan exactamente las mismas cartas e imprevistos, con las mismas herramientas. Seis meses. Gana quien haga más puntos: comparte tu tarjeta y reta a tus amigos o a tu salón.</p>
              ${getChallengeBest(week.seed) !== null ? `<p class="lead">Tu mejor puntaje esta semana: <strong>${getChallengeBest(week.seed)}</strong>.</p>` : ''}
              <div class="modal-actions"><button class="btn btn-primary" data-close>Aceptar el reto</button></div>`, { onClose: () => howTo(done, scenario.turns) })
            : howTo(done, scenario.turns),
        onExit: title,
        onFinish: (m, r) => {
            const before = getMandateRecord();
            const { earned, fresh } = award({ mode: express || challenge ? 'expres' : 'libre', m, r });
            saveMandate({ played: before.played + 1, reappointed: before.reappointed + (r.reappointed ? 1 : 0), bestScore: Math.max(before.bestScore, r.score), tipsSeen: true });
            if (challenge) saveChallengeScore(week.seed, r.score);
            const over = r.gameOver && GAME_OVER[r.gameOver];
            const record = r.score > before.bestScore && r.score > 0;
            renderVerdict(root, m, r, {
                mode, challenge: challenge ? `semana ${week.week}` : null,
                title: over ? 'Fin anticipado del mandato' : r.reappointed ? '¡El Congreso ratifica tu mandato!' : 'Terminaste el mandato',
                text: over ? `Duraste ${m.quarter} de ${m.turns} meses. ${r.gameOver === 'presion' ? 'La autonomía también se cuida con política.' : 'La próxima vez, mira los termómetros antes de que lleguen al rojo.'}`
                    : `La inflación estuvo en la meta ${r.inBandCount} de ${m.turns} meses y la economía creció ${r.avgGrowth.toFixed(1)}% en promedio${!r.reappointed && r.avgGrowth < (scenario.reappoint.minAvgGrowth ?? 0) ? ` (necesitabas ${scenario.reappoint.minAvgGrowth}%: frenaste de más)` : ''}. La confianza promedio fue ${Math.round(r.avgTrust)} y terminaste con ${Math.round(r.final.credibility)} de credibilidad.`,
                achievements: earned, newAch: fresh,
                stats: [[`${r.score}${record ? ' ★' : ''}`, record ? 'puntaje · ¡récord!' : 'puntaje'], [`${r.inBandCount}/${m.turns}`, 'meses en meta'], [`${Math.round(r.avgTrust)}`, 'confianza promedio'], [`${m.consequenceLog.length}`, 'consecuencias']],
                actions: [
                    { id: 'exit', label: 'Volver al inicio', run: title },
                    challenge
                        ? { id: 'again', label: 'Reintentar el reto', primary: true, run: () => free({ challenge }) }
                        : { id: 'again', label: 'Jugar otra vez (mazo nuevo)', primary: true, run: () => free({ express }) }
                ]
            });
        }
    });
    go();
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
