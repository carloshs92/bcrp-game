/**
 * Reto de la semana: la misma partida para todos (misma semilla, mismos eventos e imprevistos),
 * para comparar resultados entre amigos o en un aula. Módulo puro.
 */
import { FREE_SCENARIO } from './mandate.js';

/** Semana ISO (lunes a domingo) de una fecha: { year, week, seed }. */
export function isoWeek(date = new Date()) {
    const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const year = t.getUTCFullYear();
    const week = Math.ceil(((t - Date.UTC(year, 0, 1)) / 864e5 + 1) / 7);
    return { year, week, seed: year * 100 + week };
}

/**
 * Escenario del reto: las mismas reglas que el mandato exprés (6 meses, 4 en meta, encaje desde el mes 2)
 * y las mismas herramientas para todos, sin importar lo que cada uno haya ganado en la historia.
 */
export function challengeScenario() {
    return {
        ...FREE_SCENARIO, id: 'reto', turns: 6, yearLength: 2, midterm: null,
        toolUnlock: { 'encaje-sube': 2, 'encaje-baja': 2 },
        reappoint: { ...FREE_SCENARIO.reappoint, minInBand: 4 },
        toolbox: ['encaje-sube', 'encaje-baja', 'repos'], showLockedTools: false
    };
}
