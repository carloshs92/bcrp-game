import { ACHIEVEMENTS, earnedAchievements } from '../game/achievements.js';
import { getAchievements, unlockAchievements, getStory } from '../storage.js';
import { icon } from './icons.js';
import { openModal } from './modal.js';

/** Calcula y guarda los logros de una partida terminada. Devuelve { earned, fresh } (objetos). */
export function award(ctx) {
    const earned = earnedAchievements({ ...ctx, story: ctx.story ?? getStory().chapters });
    const freshIds = new Set(unlockAchievements(earned.map(a => a.id)));
    return { earned, fresh: earned.filter(a => freshIds.has(a.id)) };
}

/** Bloque de logros para el veredicto: primero los nuevos. */
export function achievementsBlock(earned, fresh = []) {
    if (!earned.length) return '';
    const isNew = a => fresh.some(f => f.id === a.id);
    const sorted = [...earned].sort((a, b) => isNew(b) - isNew(a));
    return `
      <div class="section-title">Logros</div>
      <div class="achievements">${sorted.map(a => `
        <div class="ach${isNew(a) ? ' new' : ''}">
          <span class="ach-ico">${icon(a.icon, { size: 20 })}</span>
          <div><strong>${a.name}</strong><small>${a.text}</small></div>
          ${isNew(a) ? '<span class="pill good">¡Nuevo!</span>' : ''}
        </div>`).join('')}
      </div>`;
}

/** Galería de la portada: los ganados se ven; los demás, con candado y su pista. */
export function openAchievements() {
    const have = new Set(getAchievements());
    openModal(`
      <div class="eyebrow">Logros · ${ACHIEVEMENTS.filter(a => have.has(a.id)).length} de ${ACHIEVEMENTS.length}</div>
      <h2>Tu vitrina</h2>
      <div class="achievements gallery">${ACHIEVEMENTS.map(a => have.has(a.id) ? `
        <div class="ach"><span class="ach-ico">${icon(a.icon, { size: 20 })}</span><div><strong>${a.name}</strong><small>${a.text}</small></div></div>` : `
        <div class="ach locked"><span class="ach-ico">${icon('lock', { size: 18 })}</span><div><strong>${a.name}</strong><small>${a.text}</small></div></div>`).join('')}
      </div>
      <div class="modal-actions"><button class="btn btn-primary" data-close>Cerrar</button></div>`, { wide: true });
}

export function achievementsCount() {
    const have = new Set(getAchievements());
    return { have: ACHIEVEMENTS.filter(a => have.has(a.id)).length, total: ACHIEVEMENTS.length };
}
