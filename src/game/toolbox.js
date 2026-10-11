/**
 * Caja de herramientas: instrumentos que el BCRP fue creando y que el jugador gana capítulo a capítulo.
 * Se elige una por turno, junto con la tasa y el comunicado. Módulo puro (sin DOM ni almacenamiento).
 *
 * effect: { shock (demanda/oferta por turno), fx (presión sobre el dólar, % por turno), turns,
 *           pressure (enojo del Congreso), credibility, after: { fxPass } (efecto permanente al terminar) }
 * group: las herramientas de un mismo grupo comparten la recarga (subir o bajar el mismo encaje).
 */
export const TOOLBOX = [
    {
        id: 'encaje-baja', group: 'encaje', icon: 'vault', unlock: 'crisis-2008',
        name: 'Bajar el encaje en soles', short: 'Encaje ▼',
        desc: 'Los bancos guardan menos soles en el BCR y pueden prestar más: más crédito sin mover la tasa.',
        cost: 'Más crédito también empuja los precios.',
        history: 'Tras la quiebra de Lehman Brothers (2008), el BCRP bajó los encajes para que no faltaran soles en los bancos; en 2017 los volvió a bajar para impulsar el crédito.',
        effect: { shock: { demand: 0.8 }, turns: 2, pressure: -2 }, cooldown: 2
    },
    {
        id: 'encaje-sube', group: 'encaje', icon: 'vault', unlock: 'crisis-2008',
        name: 'Subir el encaje en soles', short: 'Encaje ▲',
        desc: 'Los bancos inmovilizan más soles en el BCR: el crédito se frena sin subir la tasa.',
        cost: 'Los bancos y quienes piden préstamos se quejan.',
        history: 'En la primera mitad de 2008, con el crédito creciendo muy rápido, el BCRP subió los encajes en soles y en dólares.',
        effect: { shock: { demand: -0.7 }, turns: 2, pressure: 3 }, cooldown: 2
    },
    {
        id: 'encaje-dolares', group: 'encaje-me', icon: 'dollar', unlock: 'crisis-2008', needsFx: true,
        name: 'Subir el encaje en dólares', short: 'Encaje US$ ▲',
        desc: 'Encarece prestar en dólares: menos deudas en dólares y menos presión sobre el tipo de cambio.',
        cost: 'Quienes se endeudan en dólares pagan más.',
        history: 'El BCRP usa encajes más altos en dólares para reducir el riesgo de la dolarización.',
        effect: { shock: { demand: -0.3 }, fx: -1.2, turns: 1, pressure: 2 }, cooldown: 2
    },
    {
        id: 'repos', group: 'repos', icon: 'handshake', unlock: 'crisis-2008',
        name: 'Repos de liquidez', short: 'Repos',
        desc: 'El BCR presta soles a los bancos por unas semanas, con garantía: evita que el crédito se congele.',
        cost: 'Usarlo turno tras turno hace dudar al mercado (−2 de credibilidad).',
        history: 'En 2008 y en 2020 el BCRP inyectó liquidez con repos para que el crédito no se cortara.',
        effect: { shock: { demand: 0.6, supply: 0.1 }, turns: 1 }, cooldown: 1, abuse: 2
    },
    {
        id: 'desdolarizacion', group: 'desdolarizacion', icon: 'scale', unlock: 'nino-2017', needsFx: true, once: true,
        name: 'Programa de desdolarización', short: 'Desdolarizar',
        desc: 'Encajes adicionales al crédito en dólares durante varios turnos: al terminar, el dólar pesa mucho menos en los precios.',
        cost: 'Los bancos se resisten y no rinde hasta dentro de 3 turnos.',
        history: 'Desde 2013 el BCRP aplica encajes adicionales al crédito en dólares, y en 2015 amplió el programa de desdolarización.',
        effect: { turns: 3, pressure: 3, after: { fxPass: 0.6 } }, cooldown: 99
    },
    {
        id: 'swaps', group: 'swaps', icon: 'shuffle', unlock: 'inflacion-2022', needsFx: true,
        name: 'Swaps cambiarios', short: 'Swaps',
        desc: 'Contratos que cubren a los bancos del alza del dólar sin vender reservas directamente.',
        cost: 'Le cuesta al balance del BCR (−1 de credibilidad).',
        history: 'En 2021, con el dólar subiendo por la incertidumbre política, el BCRP colocó más de US$ 18 mil millones en swaps cambiarios.',
        effect: { fx: -2.0, turns: 1, credibility: -1 }, cooldown: 2
    }
];

export const TOOL_BY_ID = Object.fromEntries(TOOLBOX.map(t => [t.id, t]));

/** Herramientas ganadas según los capítulos superados (para el modo libre). */
export function unlockedTools(chapters = {}) {
    return TOOLBOX.filter(t => chapters[t.unlock]?.passed).map(t => t.id);
}
