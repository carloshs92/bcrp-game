/** Modal simple. Devuelve el elemento `.modal`; `data-close` lo cierra. */
export function openModal(html, { wide = false, dismissible = true, onClose } = {}) {
    closeModal();
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
    document.body.appendChild(overlay);

    const close = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKey);
        onClose?.();
    };
    const onKey = e => {
        if (e.key === 'Escape' && dismissible) close();
    };
    overlay._close = close;
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', e => {
        if (e.target.closest('[data-close]') || (dismissible && e.target === overlay)) close();
    });
    overlay.querySelector('.btn-primary')?.focus();
    return overlay.querySelector('.modal');
}

export function closeModal() {
    document.querySelector('.overlay')?._close();
}

export function modalOpen() {
    return !!document.querySelector('.overlay, .coach-shade');
}
