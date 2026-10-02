/**
 * Logros con humor peruano, para todos los modos. Módulo puro: recibe el contexto de la partida
 * terminada y devuelve los logros obtenidos. Se guardan juntos en storage (unlockAchievements).
 *
 * ctx = { mode: 'libre' | 'expres' | 'capitulo' | 'tutorial', chapter, m, r, story }
 *  m: el motor (Mandate o HyperChapter), r: su evaluate(), story: capítulos superados tras guardar.
 */
const STORY_IDS = ['hiper-1990', 'crisis-2008', 'nino-2017', 'pandemia-2020', 'inflacion-2022'];
const survived = c => !!c.r?.survived;
const freeMode = c => c.mode === 'libre' || c.mode === 'expres';
const passed = (c, id) => c.chapter === id && c.r?.passed;
const moves = c => (c.m?.history ?? []).slice(1).filter((h, i) => Math.abs(h.rate - c.m.history[i].rate) > 1e-9).length;

export const ACHIEVEMENTS = [
    // Historia
    { id: 'tutorial', icon: 'cap', name: '¡Habla, presidente!', text: 'Terminaste el tutorial. Ya tienes asiento en el Directorio.', check: c => c.mode === 'tutorial' && c.r?.passed },
    { id: 'del-inti-al-sol', icon: 'printer', name: 'Del inti al sol', text: 'Apagaste la maquinita de billetes en 1990.', check: c => passed(c, 'hiper-1990') },
    { id: 'wall-street', icon: 'globe', name: 'Wall Street tembló, el Perú no', text: 'Superaste el momento decisivo de la crisis de 2008.', check: c => c.chapter === 'crisis-2008' && c.m?.stats?.climaxWon },
    { id: 'mas-peruano', icon: 'sun', name: 'Más peruano que la papa', text: 'Aguantaste El Niño costero sin perder la cabeza.', check: c => passed(c, 'nino-2017') },
    { id: 'nadie-atras', icon: 'heart', name: 'Nadie se queda atrás', text: 'Sacaste adelante al país en la pandemia.', check: c => passed(c, 'pandemia-2020') },
    { id: 'menu', icon: 'cart', name: 'El menú volvió a su precio (casi)', text: 'Llevaste la inflación de 2021–23 de vuelta a la meta.', check: c => passed(c, 'inflacion-2022') },
    { id: 'peru-es-clave', icon: 'target', name: 'Perú es clave', text: 'Superaste los cinco capítulos. La historia monetaria del Perú ya no tiene secretos para ti.', check: c => STORY_IDS.every(id => c.story?.[id]?.passed) },

    // Mandato (modo libre y exprés)
    { id: 'chamba', icon: 'briefcase', name: 'Chamba es chamba', text: 'Te ratificaron en el modo libre: tres años más en el Directorio.', check: c => c.mode === 'libre' && c.r?.reappointed },
    { id: 'al-toque', icon: 'flame', name: 'Al toque', text: 'Ganaste un mandato exprés.', check: c => c.mode === 'expres' && c.r?.reappointed },
    { id: 'aterrizaje', icon: 'down', name: 'Aterrizaje suave', text: 'Terminaste en la meta con la economía creciendo sobre 2%. Más suave que llegada al Jorge Chávez.', check: c => freeMode(c) && c.r?.reappointed && c.r.final.growth >= 2 },
    { id: 'racha', icon: 'up', name: 'Seis al hilo', text: 'Seis trimestres seguidos con la inflación en la meta.', check: c => (c.r?.bestStreak ?? 0) >= 6 },
    { id: 'ni-un-jalado', icon: 'cap', name: 'Ni un solo jalado', text: 'Todos los trimestres de un mandato con la inflación en la meta.', check: c => survived(c) && c.m?.turns && c.r.inBandCount === c.m.turns },
    { id: 'yapa', icon: 'target', name: 'Con yapa', text: 'Terminaste con la inflación clavada en 2% (±0.1).', check: c => survived(c) && c.r.final && Math.abs(c.r.final.inflation - 2) <= 0.1 },
    { id: 'autonomo', icon: 'shield', name: 'Ni el MEF ni el Congreso', text: 'Resististe la presión política sin ceder ni una vez.', check: c => survived(c) && c.m?.stats?.resisted >= 2 && c.m.stats.ceded === 0 },
    { id: 'gradual', icon: 'equal', name: 'Despacito y buena letra', text: 'Moviste la tasa varias veces, pero nunca más de 50 pb de golpe.', check: c => survived(c) && freeMode(c) && c.m?.stats?.bigMoves === 0 && moves(c) >= 3 },
    { id: 'imprevistos', icon: 'flame', name: 'Ni el huaico te movió', text: 'Sobreviviste a tres imprevistos o más en un mandato.', check: c => survived(c) && (c.m?.stats?.surprises ?? 0) >= 3 },

    // Comunicado y herramientas
    { id: 'a-la-firme', icon: 'handshake', name: 'A la firme', text: 'Cumpliste tu comunicado tres veces y nunca lo rompiste.', check: c => (c.m?.stats?.guidanceKept ?? 0) >= 3 && c.m.stats.guidanceBroken === 0 },
    { id: 'palabra-candidato', icon: 'shuffle', name: 'Palabra de candidato', text: 'Rompiste tu comunicado dos veces en un mismo mandato. Qué roche.', check: c => (c.m?.stats?.guidanceBroken ?? 0) >= 2 },
    { id: 'combo', icon: 'gavel', name: 'Combo completo', text: 'Tasa, comunicado y herramienta en un mismo turno: entrada, segundo y refresco.', check: c => (c.m?.stats?.combos ?? 0) >= 1 },
    { id: 'mas-sol', icon: 'sun', name: 'Más sol que el sol', text: 'Completaste el programa de desdolarización.', check: c => (c.m?.fxPassMult ?? 1) < 1 },
    { id: 'pepe', icon: 'dollar', name: 'Pepe el cambista te quiere', text: 'Terminaste con el dólar casi igual que al inicio (±3%).', check: c => survived(c) && c.m?.fx && c.m.fxStart && Math.abs(c.m.fx.rate / c.m.fxStart - 1) <= 0.03 },

    // Congreso
    { id: 'ni-roche', icon: 'congress', name: 'Te citaron y ni roche', text: 'Te citaron tres veces al Congreso y terminaste el mandato.', check: c => survived(c) && (c.m?.congress?.citations ?? 0) >= 3 },
    { id: 'al-filo', icon: 'flame', name: 'Al filo', text: 'El enojo del Congreso pasó de 90 y aun así terminaste el mandato.', check: c => survived(c) && (c.m?.stats?.maxPressure ?? 0) >= 90 },
    { id: 'bronca', icon: 'flame', name: 'Te tienen bronca', text: 'El Congreso se molestó tres veces solo porque te iba bien.', check: c => (c.m?.stats?.envyTurns ?? 0) >= 3 }
];

export const ACHIEVEMENT_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

/** Logros obtenidos en una partida terminada. */
export function earnedAchievements(ctx) {
    return ACHIEVEMENTS.filter(a => {
        try { return !!a.check(ctx); } catch { return false; }
    });
}
