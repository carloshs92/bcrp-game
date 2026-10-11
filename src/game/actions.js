/**
 * Acciones del turno (Game Design): el jugador tiene 2 acciones por turno para repartir entre
 * cuatro palancas. No actuar también es una decisión: "esperar" no gasta nada, pero la economía
 * sigue moviéndose. Módulo puro: la vista lo usa para habilitar palancas y el test para las reglas.
 *
 * plan = { move, sell, tone, tool, scripted } (scripted = una herramienta del capítulo, p. ej. Reactiva)
 */

export const ACTION_POINTS = 2;

/** Las palancas, con qué logran, qué cuestan y cuándo hacen efecto. */
export const LEVERS = {
    tasa: {
        name: 'Tasa de referencia', icon: 'percent',
        gives: 'Subir enfría la inflación; bajar impulsa empleo y crédito.',
        costs: 'Subir frena el empleo y enoja al Congreso; bajar arriesga inflación.',
        lag: { mes: 'Hace efecto en 2 a 3 meses', trimestre: 'Hace efecto en 1 a 2 trimestres' }
    },
    dolares: {
        name: 'Vender o comprar dólares', icon: 'dollar',
        gives: 'Calma el tipo de cambio de inmediato.',
        costs: 'Gasta reservas, que no se reponen solas.',
        lag: { mes: 'Inmediato, pero se diluye', trimestre: 'Inmediato, pero se diluye' }
    },
    discurso: {
        name: 'Discurso del presidente', icon: 'megaphone',
        gives: 'Mueve las expectativas: firme, neutral o calmado.',
        costs: 'Si prometes y luego no cumples, cae la credibilidad.',
        lag: { mes: 'Inmediato', trimestre: 'Inmediato' }
    },
    herramienta: {
        name: 'Encaje y otras herramientas', icon: 'vault',
        gives: 'Frena o suelta el crédito sin tocar la tasa.',
        costs: 'Molesta a bancos y emprendedores; tiene recarga.',
        lag: { mes: 'Hace efecto en 1 a 2 meses', trimestre: 'Hace efecto este trimestre' }
    }
};

/** Palancas que usa un plan. */
export function planActions({ move = 0, sell = 0, tone = 'neutral', tool = null, scripted = false } = {}) {
    const used = [];
    if (Math.abs(move) > 1e-9) used.push('tasa');
    if (Math.abs(sell) > 1e-9) used.push('dolares');
    if (tone && tone !== 'neutral') used.push('discurso');
    if (tool || scripted) used.push('herramienta');
    return used;
}

export const planCost = plan => planActions(plan).length;

/** ¿Se puede tocar esta palanca? Siempre, si ya está en uso (para cambiarla o soltarla). */
export function canUse(plan, lever) {
    const used = planActions(plan);
    return used.includes(lever) || used.length < ACTION_POINTS;
}

/** El plan respeta el límite de acciones. */
export const planIsValid = plan => planCost(plan) <= ACTION_POINTS;
