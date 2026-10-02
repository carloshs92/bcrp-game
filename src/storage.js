/** Progreso del jugador en localStorage (puede fallar en modo privado: se ignora). */
const KEY = 'bcrp-guardian-v2';

function read() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) ?? {};
    } catch {
        return {};
    }
}

function write(data) {
    try {
        localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
        // sin almacenamiento disponible: el progreso dura solo esta sesión
    }
}

export function getProgress() {
    const d = read();
    return { introSeen: !!d.introSeen, levels: d.levels ?? {} };
}

export function markIntroSeen() {
    write({ ...read(), introSeen: true });
}

/** Guarda el mejor resultado de un nivel. */
export function saveResult(levelId, { passed, stars, score }) {
    const d = read();
    const levels = d.levels ?? {};
    const prev = levels[levelId] ?? { passed: false, stars: 0, score: 0 };
    levels[levelId] = {
        passed: prev.passed || passed,
        stars: Math.max(prev.stars, stars),
        score: Math.max(prev.score, score)
    };
    write({ ...d, levels });
}

/** Récords y preferencias del modo Mandato. */
export function getMandateRecord() {
    const d = read();
    return d.mandate ?? { played: 0, reappointed: 0, bestScore: 0, achievements: [], tipsSeen: false };
}

export function saveMandate(patch) {
    const d = read();
    write({ ...d, mandate: { ...getMandateRecord(), ...patch } });
}

/** Progreso del Modo Historia y del tutorial. */
export function getStory() {
    const d = read();
    return { tutorialDone: !!d.story?.tutorialDone, chapters: d.story?.chapters ?? {} };
}

export function markTutorialDone() {
    const d = read();
    write({ ...d, story: { ...getStory(), tutorialDone: true } });
}

export function saveChapter(id, { passed, stars, score }) {
    const d = read();
    const story = getStory();
    const prev = story.chapters[id] ?? { passed: false, stars: 0, score: 0 };
    story.chapters[id] = { passed: prev.passed || passed, stars: Math.max(prev.stars, stars ?? 0), score: Math.max(prev.score, score ?? 0) };
    write({ ...d, story });
}

/** Dificultad: 'facil' (con pistas de color), 'normal' (sin pistas), 'dificil' (sin pistas y con tiempo). */
export const DIFFICULTIES = {
    facil: { name: 'Fácil', hints: true, timer: 0, desc: 'Colores y mensajes que te dicen si vas bien. Ideal para aprender.' },
    normal: { name: 'Normal', hints: false, timer: 0, desc: 'Sin pistas de color: solo los datos, como en el Directorio real.' },
    dificil: { name: 'Difícil', hints: false, timer: 30, desc: 'Sin pistas y con 30 segundos por decisión. Si no decides, todo sigue como está.' }
};

export function getSettings() {
    const d = read();
    const difficulty = DIFFICULTIES[d.settings?.difficulty] ? d.settings.difficulty : 'normal';
    return { difficulty, ...DIFFICULTIES[difficulty] };
}

export function saveSettings(patch) {
    const d = read();
    write({ ...d, settings: { ...(d.settings ?? {}), ...patch } });
}

/** Marcas de "ya visto" (introducciones de herramientas, etc.). */
export function getFlag(name) {
    return !!read().flags?.[name];
}

export function setFlag(name) {
    const d = read();
    write({ ...d, flags: { ...(d.flags ?? {}), [name]: true } });
}
