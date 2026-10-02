import { strongestVoice, averageMoods, averageRegions, humanBalance, sectorVoice } from '../game/people.js';
import { peruMap, bindMap, regionSummary } from './peruMap.js';
import { icon } from './icons.js';

const MOOD_LABEL = ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'];
const MOOD_COLOR = ['#b3261e', '#d9822b', '#8a94a3', '#4c9a6a', '#1d7a4c'];

/** Carita SVG: la boca y las cejas cambian con el ánimo (-2 a +2). */
export function face(mood, size = 44) {
    const m = Math.max(-2, Math.min(2, Math.round(mood)));
    const color = MOOD_COLOR[m + 2];
    const curve = m * 5;                    // boca: sonrisa o tristeza
    const brow = m < 0 ? -m * 1.6 : 0;      // cejas inclinadas cuando está triste
    const tear = m === -2 ? '<path d="M14 25 q-2 4 0 6 q2 -2 0 -6" fill="#5aa9e6"/>' : '';
    return `
    <svg class="face" width="${size}" height="${size}" viewBox="0 0 44 44" role="img" aria-label="${MOOD_LABEL[m + 2]}">
      <circle cx="22" cy="22" r="20" fill="${color}" opacity=".16"/>
      <circle cx="22" cy="22" r="20" fill="none" stroke="${color}" stroke-width="2.5"/>
      <circle cx="15" cy="18" r="2.4" fill="${color}"/><circle cx="29" cy="18" r="2.4" fill="${color}"/>
      <path d="M11 ${12 - brow} L19 ${12 + brow}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${m < 0 ? 1 : 0}"/>
      <path d="M33 ${12 - brow} L25 ${12 + brow}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="${m < 0 ? 1 : 0}"/>
      <path d="M13 ${29 - curve / 2} Q22 ${29 + curve} 31 ${29 - curve / 2}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>
      ${tear}
    </svg>`;
}

/**
 * Tarjeta "Cómo lo vive la gente" con dos pestañas: sectores y mapa del Perú.
 * Llamar a `bindPeople(root)` después de insertarla.
 */
export function peoplePanel(moods, { regions = null, title = 'Cómo lo vive la gente', empty } = {}) {
    if (!moods) {
        return `<section class="card people" id="people"><h3><span class="h-ico">${icon('people', { size: 16 })}</span>${title}</h3><p class="people-empty">${empty ?? 'Después de tu primera decisión verás cómo la vive cada sector y cada región del país.'}</p></section>`;
    }
    const v = strongestVoice(moods);
    return `
    <section class="card people" id="people">
      <h3><span class="h-ico">${icon('people', { size: 16 })}</span>${title}
        ${regions ? `<span class="tabs" role="tablist">
          <button role="tab" class="on" data-tab="sectores" aria-selected="true">Sectores</button>
          <button role="tab" data-tab="mapa" aria-selected="false">Mapa del Perú</button>
        </span>` : ''}
      </h3>
      <div class="tab-pane" data-pane="sectores">
        <div class="sectors">${moods.map(s => `
          <div class="sector" title="${s.name}: ${MOOD_LABEL[s.mood + 2]}">${face(s.mood, 38)}<small>${s.short}</small></div>`).join('')}
        </div>
        <blockquote class="voice bubble">“${sectorVoice(v)}” <cite>— ${v.who}</cite></blockquote>
      </div>
      ${regions ? `<div class="tab-pane" data-pane="mapa" hidden>${peruMap(regions, { size: 'sm' })}</div>` : ''}
    </section>`;
}

export function bindPeople(root) {
    root.querySelectorAll('.people .tabs button').forEach(b => b.addEventListener('click', () => {
        const card = b.closest('.people');
        card.querySelectorAll('.tabs button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
        card.querySelectorAll('.tab-pane').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
    }));
    bindMap(root);
}

/** Voces de cada sector, de peor a mejor (para el diario). */
export function sectorsReport(moods) {
    const sorted = [...moods].sort((a, b) => a.mood - b.mood);
    return `<div class="people-report">${sorted.map(s => `
      <div class="pr-row">${face(s.mood, 34)}<div><strong>${s.name}</strong><span>“${sectorVoice(s)}”</span></div></div>`).join('')}
    </div>`;
}

/** El país por regiones (para el diario). */
export function regionsReport(regions) {
    const sum = regionSummary(regions);
    return `
    ${sum.hurt ? `<p class="region-line"><strong>Más golpeados:</strong> ${sum.hurt}.</p>` : ''}
    ${sum.good ? `<p class="region-line"><strong>Les fue mejor:</strong> ${sum.good}.</p>` : ''}
    ${peruMap(regions, { size: 'md' })}`;
}

/** Cuántos sectores lo están pasando mal: para el aviso en la pestaña. */
export function hurtCount(moods) {
    return moods.filter(s => s.mood < 0).length;
}

/** Balance humano para el veredicto: sectores y mapa promedio. */
export function peopleBalance(history, regionHistory) {
    if (!history?.length) return '';
    const avg = averageMoods(history);
    const b = humanBalance(avg);
    const regions = regionHistory?.length ? averageRegions(regionHistory) : null;
    const sum = regions ? regionSummary(regions) : null;
    return `
    <div class="section-title">Balance humano</div>
    <div class="sectors big">${avg.map(s => `<div class="sector">${face(s.avg, 48)}<small>${s.short}</small></div>`).join('')}</div>
    <p class="balance-text">${b.text}</p>
    ${regions ? `
      ${sum.hurt ? `<p class="region-line"><strong>Las regiones que más sufrieron:</strong> ${sum.hurt}.</p>` : ''}
      ${peruMap(regions, { size: 'md', title: 'Cómo vivió cada departamento este período (promedio y peor momento)' })}` : ''}
    <p class="balance-lesson">${b.lesson}</p>`;
}
