/**
 * Pestañas simples. `items` = [{ key, label, html, badge? }]; la primera queda activa.
 * Llamar a `bindTabs(root)` después de insertar el HTML.
 */
export function tabs(items, { className = '' } = {}) {
    const list = items.filter(Boolean);
    return `
    <div class="ptabs ${className}">
      <div class="ptabs-nav" role="tablist">${list.map((t, i) => `
        <button role="tab" data-ptab="${t.key}" class="${i === 0 ? 'on' : ''}" aria-selected="${i === 0}">${t.label}${t.badge ? `<span class="ptab-badge">${t.badge}</span>` : ''}</button>`).join('')}
      </div>
      ${list.map((t, i) => `<div class="ptabs-pane" data-ppane="${t.key}" role="tabpanel" ${i === 0 ? '' : 'hidden'}>${t.html}</div>`).join('')}
    </div>`;
}

export function bindTabs(root) {
    root.querySelectorAll('.ptabs').forEach(box => {
        box.querySelectorAll('[data-ptab]').forEach(b => b.addEventListener('click', () => {
            box.querySelectorAll('[data-ptab]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
            box.querySelectorAll('[data-ppane]').forEach(p => { p.hidden = p.dataset.ppane !== b.dataset.ptab; });
        }));
    });
}
