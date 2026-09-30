import { advisor } from './art.js';

/**
 * Tutorial guiado: resalta un elemento y muestra un mensaje del asesor.
 * steps = [{ target: selector | null, text }]. Resuelve al terminar.
 */
// Los mensajes se encolan: nunca se muestran dos a la vez.
let queue = Promise.resolve();

export function coach(steps) {
    queue = queue.then(() => runCoach(steps));
    return queue;
}

function runCoach(steps) {
    return new Promise(resolve => {
        const shade = document.createElement('div');
        shade.className = 'coach-shade';
        const spot = document.createElement('div');
        spot.className = 'coach-spot';
        const tip = document.createElement('div');
        tip.className = 'coach-tip';
        tip.setAttribute('role', 'dialog');
        document.body.append(shade, spot, tip);

        let i = 0;
        const place = () => {
            const step = steps[i];
            const el = step.target ? document.querySelector(step.target) : null;
            const vw = window.innerWidth, vh = window.innerHeight;
            if (el) {
                const r = el.getBoundingClientRect();
                const m = 6;
                Object.assign(spot.style, { display: 'block', left: `${r.left - m}px`, top: `${r.top - m}px`, width: `${r.width + 2 * m}px`, height: `${r.height + 2 * m}px` });
                const tw = tip.offsetWidth, th = tip.offsetHeight;
                // Debajo si cabe; si no, encima; si no, al costado.
                let top = r.bottom + 16;
                if (top + th > vh - 16) top = r.top - th - 16;
                if (top < 16) top = Math.min(vh - th - 16, Math.max(16, r.top));
                let left = Math.min(vw - tw - 16, Math.max(16, r.left));
                if (top === r.top && r.right + tw + 32 < vw) left = r.right + 16;
                Object.assign(tip.style, { top: `${top}px`, left: `${left}px`, transform: 'none' });
            } else {
                Object.assign(spot.style, { display: 'block', left: '50%', top: '50%', width: '0px', height: '0px' });
                Object.assign(tip.style, { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
            }
        };
        const render = () => {
            const step = steps[i];
            const last = i === steps.length - 1;
            tip.innerHTML = `
                <div class="who">${advisor} Asesora del equipo técnico</div>
                <p>${step.text}</p>
                <div class="row">
                    <span>${i + 1} de ${steps.length}</span>
                    <button class="btn btn-primary" data-next>${last ? 'Entendido' : 'Siguiente'}</button>
                </div>`;
            const el = step.target ? document.querySelector(step.target) : null;
            el?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
            place();
            tip.querySelector('[data-next]').focus();
        };
        const next = () => {
            i += 1;
            if (i >= steps.length) return done();
            render();
        };
        const onKey = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                next();
            }
        };
        const done = () => {
            shade.remove(); spot.remove(); tip.remove();
            window.removeEventListener('resize', place);
            document.removeEventListener('keydown', onKey, true);
            resolve();
        };
        tip.addEventListener('click', e => { if (e.target.closest('[data-next]')) next(); });
        window.addEventListener('resize', place);
        document.addEventListener('keydown', onKey, true);
        render();
    });
}
