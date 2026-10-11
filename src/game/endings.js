import { rosaVerdict } from './cast.js';

/**
 * Finales: arquetipo del jugador, derrotas anticipadas con su propio drama, el peor turno y el
 * texto de la tarjeta compartible. Módulo puro (solo la frase de Doña Rosa usa azar).
 *
 * Perder tiene que ser entretenido: cada derrota tiene título y remate propios, no un error técnico.
 */

export const ENDINGS = {
    inflacion: { title: 'Los precios se escaparon', text: 'La inflación pasó la raya y no volvió. En el mercado ya remarcan dos veces al día y Doña Rosa escribe los precios con lápiz.', scene: 'mercado' },
    reservas: { title: 'Sin balas para defender el sol', text: 'Vendiste dólares hasta tocar el piso de las reservas. El próximo golpe te encontró con la bóveda vacía y Pepe el cambista ya no contesta el teléfono.', scene: 'dolar-sube' },
    credibilidad: { title: 'Nadie te cree: renuncias en televisión', text: 'Las expectativas se desanclaron. Cada comunicado provocaba memes y ninguna decisión movía al mercado. Anunciaste tu renuncia en señal abierta.', scene: 'crash' },
    presion: { title: 'El Congreso te censura', text: 'Con el Congreso furioso, te acusan de «falta grave», la única causa por la que la Constitución permite remover al Directorio. La autonomía no se defendió sola.', scene: 'constitucion' },
    recesion: { title: 'El país se apagó', text: 'Frenaste tanto que la economía se contrajo. La inflación bajó, pero se llevó la chamba de miles. Frenar a cualquier costo también es perder.', scene: 'cuarentena' }
};

/**
 * Arquetipos (Game Design): cómo jugaste, más allá de si ganaste.
 * El orden importa: el primero que calza define el final.
 */
export const ARCHETYPES = {
    bombero: { name: 'El Bombero', lesson: 'Apagar incendios no es lo mismo que prevenirlos.', how: 'Defendiste el sol vendiendo dólares hasta gastar la mitad de las reservas o más.', icon: 'flame' },
    halcon: { name: 'El Halcón de Hierro', lesson: 'Frenar los precios a cualquier costo también duele.', how: 'Apretaste la tasa más que tu equipo técnico casi todos los meses.', icon: 'up' },
    paloma: { name: 'La Paloma', lesson: 'El dinero fácil (y el no hacer nada) se paga después.', how: 'Dejaste la tasa más baja que lo que pedía tu equipo técnico, o esperaste cuando había que actuar.', icon: 'down' },
    guardian: { name: 'El Guardián', lesson: 'El equilibrio es posible, pero cuesta.', how: 'Seguiste un rumbo medido y la inflación quedó en la meta con la gente de tu lado.', icon: 'shield' },
    aprendiz: { name: 'El Aprendiz', lesson: 'Sin un rumbo claro, el mercado tampoco sabe a qué atenerse.', how: 'Ni halcón ni paloma, pero los resultados no acompañaron: a puro tanteo.', icon: 'cap' }
};

/**
 * El arquetipo retrata el ESTILO: `tight` = cuánto más (o menos) apretaste la tasa que tu equipo técnico,
 * en promedio por turno (pp). En simulación: seguir al halcón da ~+0.27 y a la paloma ~−0.35; esperar siempre, −0.5.
 */
export const ARCHETYPE_RULES = { reservesUsed: 0.5, hawk: 0.15, dove: -0.15, guardInBand: 0.5, guardTrust: 50 };

const avg = xs => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/** Indicadores del recorrido que usan los arquetipos. */
export function runProfile(m) {
    const qs = m.history.slice(1).map(h => h.state);
    const p = m.params;
    return {
        turns: qs.length,
        inBand: avg(qs.map(s => s.inflation >= p.bandMin && s.inflation <= p.bandMax ? 1 : 0)),
        above: avg(qs.map(s => s.inflation > p.bandMax ? 1 : 0)),
        gap: avg(qs.map(s => s.growth - p.potentialGrowth)),
        trust: avg(m.history.slice(1).map(h => h.trust ?? m.trust)),
        reservesUsed: m.fx ? 1 - m.reserveShare() : 0,
        // Estilo: cuánto más apretaste que tu equipo técnico, en promedio por turno.
        tight: m.styleLog?.length ? avg(m.styleLog.map(x => x.move - x.staff)) : 0
    };
}

/** Id del arquetipo de una partida. */
export function archetypeId(m) {
    const r = runProfile(m);
    const R = ARCHETYPE_RULES;
    if (m.fx && r.reservesUsed >= R.reservesUsed) return 'bombero';
    if (r.tight >= R.hawk) return 'halcon';
    if (r.tight <= R.dove) return 'paloma';
    if (r.inBand >= R.guardInBand && r.trust >= R.guardTrust) return 'guardian';
    return 'aprendiz';
}

export function archetype(m) {
    const id = archetypeId(m);
    return { id, ...ARCHETYPES[id] };
}

/** El peor turno: el más lejos de la meta, con la recesión sumando. */
export function worstTurn(m) {
    const p = m.params;
    let worst = null;
    m.history.slice(1).forEach((h, i) => {
        const s = h.state;
        const miss = s.inflation > p.bandMax ? s.inflation - p.bandMax : s.inflation < p.bandMin ? p.bandMin - s.inflation : 0;
        const bad = miss + Math.max(0, -s.growth) * 0.7 + Math.max(0, p.potentialGrowth - 1.5 - s.growth) * 0.3;
        if (!worst || bad > worst.bad) worst = { bad, label: h.label, inflation: s.inflation, growth: s.growth, event: m.records[i]?.event?.title ?? null };
    });
    return worst;
}

/** Final completo para la vista y la tarjeta compartible. */
export function ending(m, r) {
    const arch = archetype(m);
    const early = r.gameOver ? { id: r.gameOver, ...ENDINGS[r.gameOver] } : null;
    const worst = worstTurn(m);
    const rosa = rosaVerdict(m);
    return { archetype: arch, early, worst, rosa, stars: r.stars, score: r.score };
}

/** Texto para compartir (WhatsApp, redes): corto y con gancho. */
export function shareText(m, end, { mode = 'Modo libre', challenge = null } = {}) {
    const stars = end.stars ? '★'.repeat(end.stars) + '☆'.repeat(3 - end.stars) : 'sin estrellas';
    const lines = [
        `Sol Firme · ${mode}${challenge ? ` · Reto de la semana ${challenge}` : ''}`,
        end.early ? `Final: ${end.early.title}` : `Soy ${end.archetype.name} ${stars} · ${end.score} puntos`,
        end.worst ? `Mi peor ${m.unit}: ${end.worst.label} (inflación ${end.worst.inflation.toFixed(1)}%)` : '',
        `Doña Rosa: «${end.rosa}»`,
        '¿Lo harías mejor dirigiendo el BCR?'
    ];
    return lines.filter(Boolean).join('\n');
}
