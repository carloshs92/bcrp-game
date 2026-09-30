/**
 * Modelo macroeconómico mensual simplificado (una reunión de Directorio = un mes).
 *
 * Cadena de transmisión que el juego quiere enseñar:
 *   tasa de referencia → tasas de mercado (con rezago) → tasa real vs. neutral
 *   → brecha del producto (demanda) → inflación subyacente
 * más dos fuerzas adicionales: expectativas (ancladas por la credibilidad)
 * y choques de oferta (alimentos y energía), que la tasa casi no controla.
 *
 * Es un módulo puro: no toca el DOM, para poder probarlo con `node --test`.
 */

export const PARAMS = {
    target: 2.0,          // meta de inflación del BCRP
    bandMin: 1.0,
    bandMax: 3.0,
    realNeutral: 2.0,     // tasa real neutral: ni estimula ni enfría
    potentialGrowth: 3.0, // crecimiento potencial del PBI
    passThrough: 0.5,     // fracción del cambio de tasa que llega al mercado cada mes
    gapPersistence: 0.85,
    rateToGap: 0.35,      // cuánto enfría la demanda 1 pp de tasa real sobre la neutral
    gapToCore: 0.12,      // cuánto presiona la brecha a la inflación subyacente cada mes
    expToCore: 0.10,      // cuánto arrastran las expectativas a la subyacente cada mes
    supplyDecay: 0.75,    // los choques de oferta se disipan solos
    expAdjust: 0.25,
    credPenalty: 1,       // qué tan rápido se pierde credibilidad fuera de la meta (por escenario)
    bigMove: 0.5          // movimiento de tasa (por paso) a partir del cual sorprende al mercado
};

/** Tasa nominal que sería neutral dadas las expectativas actuales. */
export function neutralRate(state, p = PARAMS) {
    return p.realNeutral + state.expectations;
}

export function inBand(inflation, p = PARAMS) {
    return inflation >= p.bandMin && inflation <= p.bandMax;
}

export function createState(init) {
    const s = {
        rate: init.rate,
        marketRate: init.marketRate ?? init.rate,
        outputGap: init.outputGap,
        core: init.core,
        supply: init.supply ?? 0,
        expectations: init.expectations,
        credibility: init.credibility
    };
    s.inflation = s.core + s.supply;
    s.growth = PARAMS.potentialGrowth + s.outputGap;
    return s;
}

/**
 * Avanza un mes. `newRate` es la decisión del jugador y `shock` lo que trae el
 * escenario ese mes: { demand, supply, credibility }.
 * Devuelve el nuevo estado y la descomposición del cambio de inflación, que
 * la UI usa para explicar "¿por qué pasó esto?".
 */
export function step(prev, newRate, shock = {}, p = PARAMS) {
    const demandShock = shock.demand ?? 0;
    const supplyShock = shock.supply ?? 0;

    const marketRate = prev.marketRate + p.passThrough * (newRate - prev.marketRate);
    const realRateGap = marketRate - prev.expectations - p.realNeutral;
    const outputGap = p.gapPersistence * prev.outputGap - p.rateToGap * realRateGap + demandShock;

    const fromExpectations = p.expToCore * (prev.expectations - prev.core);
    const fromDemand = p.gapToCore * outputGap;
    const core = prev.core + fromExpectations + fromDemand;

    const supply = p.supplyDecay * prev.supply + supplyShock;
    const fromSupply = supply - prev.supply;
    const inflation = core + supply;

    // Con alta credibilidad, la gente espera que la inflación vuelva a la meta.
    const anchor = 0.7 * prev.credibility / 100;
    const expTarget = anchor * p.target + (1 - anchor) * inflation;
    const expectations = prev.expectations + p.expAdjust * (expTarget - prev.expectations);

    let credibility = prev.credibility;
    if (inBand(inflation, p)) {
        credibility += 1.5;
    } else {
        const miss = inflation > p.bandMax ? inflation - p.bandMax : p.bandMin - inflation;
        credibility -= (2 + 3 * miss) * p.credPenalty;
    }
    // Movimientos bruscos e impredecibles restan credibilidad.
    const move = Math.abs(newRate - prev.rate);
    if (move > p.bigMove) credibility -= 4 * (move - p.bigMove) / 0.25;
    credibility += shock.credibility ?? 0;
    credibility = Math.max(0, Math.min(100, credibility));

    const state = {
        rate: newRate,
        marketRate,
        outputGap,
        core,
        supply,
        inflation,
        expectations,
        credibility,
        growth: p.potentialGrowth + outputGap
    };

    return {
        state,
        drivers: {
            expectations: fromExpectations,
            demand: fromDemand,
            supply: fromSupply,
            realRateGap,
            demandShock
        }
    };
}

/**
 * Recomendación del equipo técnico (regla de Taylor simplificada): se usa
 * como "pista" y para probar que el escenario es ganable.
 */
export function staffRecommendation(state, p = PARAMS) {
    const ideal = neutralRate(state, p)
        + 1.5 * (state.inflation - p.target)
        + 0.5 * state.outputGap;
    const maxMove = 0.5;
    const clamped = Math.max(state.rate - maxMove, Math.min(state.rate + maxMove, ideal));
    return Math.max(0.25, Math.round(clamped * 4) / 4);
}
