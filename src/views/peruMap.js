import { MAP_VIEWBOX, DEPARTMENT_SHAPES } from '../model/peruMap.js';
import { regionVoice } from '../game/people.js';
import { face } from './people.js';

export const CAUSE_LABEL = {
    nino: 'El Niño costero', lluvias: 'Lluvias intensas', 'cobre+': 'Buen precio de los minerales',
    'cobre-': 'Caen los precios de los minerales', 'conflicto-minero': 'Conflicto minero', combustible: 'Combustible caro',
    transporte: 'Paro de transporte', central: 'Carretera Central bloqueada', heladas: 'Heladas y friaje',
    'pesca-': 'No hay pesca', 'turismo+': 'Temporada de turismo', 'agro-': 'Insumos agrícolas caros',
    'agro+': 'Buena cosecha', cuarentena: 'Cuarentena', reapertura: 'Reapertura', 'credito+': 'Crédito barato',
    'consumo+': 'Más consumo', 'exportaciones-': 'Caen las exportaciones', politica: 'Incertidumbre política',
    'fiscal+': 'Más gasto público', dolar: 'Dólar caro', 'sueldos-': 'Sueldos del Estado atrasados',
    colera: 'Epidemia de cólera', inflacion: 'Precios altos', tasa: 'Crédito más caro', recesion: 'Recesión y desempleo',
    auge: 'Buen momento económico', estable: 'Sin grandes cambios'
};

const NAME = Object.fromEntries(DEPARTMENT_SHAPES.map(d => [d.id, d.name]));

/** Color divergente por puntaje: rojo (mal) → gris (neutro) → verde (bien). */
function color(score) {
    const stops = [[-2.5, [179, 38, 30]], [-1, [233, 162, 59]], [0.5, [207, 214, 223]], [1.5, [120, 184, 141]], [2.5, [29, 122, 76]]];
    const v = Math.max(-2.5, Math.min(2.5, score));
    for (let i = 0; i < stops.length - 1; i++) {
        const [a, ca] = stops[i], [b, cb] = stops[i + 1];
        if (v <= b) {
            const t = (v - a) / (b - a);
            return `rgb(${ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(',')})`;
        }
    }
    return 'rgb(29,122,76)';
}

/**
 * Mapa del Perú coloreado por el ánimo de cada departamento.
 * `regions` = salida de regionMoods/averageRegions. Devuelve HTML; luego llamar a `bindMap`.
 */
export function peruMap(regions, { size = 'md', title } = {}) {
    if (!regions) return '';
    // La frase de cada región se elige una vez por render, para que no cambie al pasar el cursor.
    const voices = Object.fromEntries(Object.values(regions).map(r => [r.id, regionVoice(r)]));
    const worst = Object.values(regions).sort((a, b) => a.score - b.score)[0];
    const paths = DEPARTMENT_SHAPES.map(d => {
        const r = regions[d.id];
        return `<path d="${d.d}" fill="${color(r.score)}" data-region="${d.id}" tabindex="0"><title>${d.name}: ${CAUSE_LABEL[r.cause]}</title></path>`;
    }).join('');
    const data = encodeURIComponent(JSON.stringify(Object.fromEntries(Object.values(regions).map(r => [r.id, { mood: r.mood, cause: r.cause, who: r.who, voice: voices[r.id] }]))));
    return `
    <div class="peru-map ${size}" data-regions="${data}">
      ${title ? `<div class="map-title">${title}</div>` : ''}
      <div class="map-body">
        <svg viewBox="${MAP_VIEWBOX}" role="img" aria-label="Mapa del Perú por departamentos">${paths}</svg>
        <div class="map-detail">${detail(worst.id, regions[worst.id], voices[worst.id])}</div>
      </div>
      <div class="map-legend"><span>Muy mal</span><i></i><span>Muy bien</span></div>
    </div>`;
}

function detail(id, r, voice) {
    return `
      <div class="md-head">${face(r.mood, 36)}<div><strong>${NAME[id]}</strong><small>${CAUSE_LABEL[r.cause]}</small></div></div>
      <blockquote>“${voice}”<cite>— ${r.who}</cite></blockquote>
      <p class="md-hint">Toca un departamento para ver cómo lo vive.</p>`;
}

/** Activa el hover/clic de todos los mapas dentro de `root`. */
export function bindMap(root) {
    root.querySelectorAll('.peru-map').forEach(map => {
        const data = JSON.parse(decodeURIComponent(map.dataset.regions));
        const box = map.querySelector('.map-detail');
        const show = id => {
            map.querySelectorAll('path.on').forEach(p => p.classList.remove('on'));
            map.querySelector(`path[data-region="${id}"]`)?.classList.add('on');
            box.innerHTML = detail(id, data[id], data[id].voice);
        };
        map.querySelectorAll('path[data-region]').forEach(p => {
            p.addEventListener('mouseenter', () => show(p.dataset.region));
            p.addEventListener('click', () => show(p.dataset.region));
            p.addEventListener('focus', () => show(p.dataset.region));
        });
    });
}

/** Resumen en una línea: los departamentos más golpeados y los que mejor la pasaron. */
export function regionSummary(regions) {
    const list = Object.values(regions).sort((a, b) => a.score - b.score);
    const names = xs => xs.map(r => NAME[r.id]).join(', ');
    const hurt = list.filter(r => r.mood <= -1).slice(0, 3);
    const good = list.filter(r => r.mood >= 1).slice(-3).reverse();
    return {
        hurt: hurt.length ? `${names(hurt)} (${CAUSE_LABEL[hurt[0].cause]})` : null,
        good: good.length ? names(good) : null
    };
}
