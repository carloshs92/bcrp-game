import { PARAMS } from '../model/economy.js';

/**
 * Gráfico del mandato: inflación trimestral observada + abanico de proyección
 * para la tasa elegida. La banda del abanico se abre con el horizonte:
 * cuanto más lejos, más incierto.
 */
export function fanChart({ history, projection, total, labels }) {
    const W = 640, H = 205;
    const pad = { l: 40, r: 26, t: 14, b: 28 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const now = history.length - 1;

    const vals = [...history.map(h => h.state.inflation), ...projection.map(p => p.inflation)];
    const yMax = Math.max(7, Math.ceil(Math.max(...vals) + 1));
    const yMin = Math.min(0, Math.floor(Math.min(...vals) - 0.5));
    const x = i => pad.l + (i / total) * iw;
    const y = v => pad.t + (1 - (v - yMin) / (yMax - yMin)) * ih;

    const grid = [];
    // Con rangos amplios se etiqueta cada 2 o más puntos para que no se amontonen.
    const gridStep = Math.max(1, Math.ceil((yMax - yMin) / 8));
    for (let v = yMin; v <= yMax; v += gridStep) {
        grid.push(`<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>`);
        grid.push(`<text x="${pad.l - 7}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}%</text>`);
    }
    const xl = labels.map((t, i) => (i % 2 === 0 || total <= 8) && t
        ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${t}</text>` : '').join('');

    // Abanico: mediana + bandas de 1 y 2 "desvíos" que crecen con el horizonte.
    const steps = projection.slice(0, Math.max(0, total - now));
    const origin = history[now].state.inflation;
    const pts = [{ i: now, v: origin, u: 0 }, ...steps.map((p, k) => ({ i: now + k + 1, v: p.inflation, u: 0.2 * (k + 1) }))];
    const area = mult => {
        const up = pts.map(p => `${x(p.i)},${y(p.v + p.u * mult)}`);
        const down = pts.slice().reverse().map(p => `${x(p.i)},${y(p.v - p.u * mult)}`);
        return `M${up.join(' L')} L${down.join(' L')} Z`;
    };
    const fan = pts.length > 1 ? `
        <path d="${area(2)}" fill="var(--fan-2)"/>
        <path d="${area(1)}" fill="var(--fan-1)"/>
        <polyline points="${pts.map(p => `${x(p.i)},${y(p.v)}`).join(' ')}" fill="none" stroke="var(--navy-2)" stroke-width="2.5" stroke-dasharray="5 5"/>
        <text x="${x(pts.at(-1).i) - 4}" y="${y(pts.at(-1).v) - 10}" text-anchor="end" font-size="12" font-weight="700" fill="var(--navy-2)">Proyección ${pts.at(-1).v.toFixed(1)}%</text>` : '';

    const line = history.map((h, i) => `${x(i)},${y(h.state.inflation)}`).join(' ');
    const dots = history.map((h, i) => {
        const v = h.state.inflation;
        const ok = v >= PARAMS.bandMin && v <= PARAMS.bandMax;
        return `<circle cx="${x(i)}" cy="${y(v)}" r="${i === now ? 5.5 : 3.5}" fill="${ok ? 'var(--navy)' : 'var(--bad)'}" stroke="var(--surface)" stroke-width="1.5"><title>${labels[i]}: ${v.toFixed(1)}%</title></circle>`;
    }).join('');

    return `
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Inflación observada y proyección según la tasa elegida">
      ${grid.join('')}
      <rect x="${pad.l}" y="${y(PARAMS.bandMax)}" width="${iw}" height="${y(PARAMS.bandMin) - y(PARAMS.bandMax)}" fill="var(--band)"/>
      <line x1="${pad.l}" x2="${W - pad.r}" y1="${y(PARAMS.target)}" y2="${y(PARAMS.target)}" stroke="var(--good)" stroke-dasharray="6 5" stroke-width="1.5"/>
      <text x="${pad.l + 6}" y="${y(PARAMS.bandMin) - 6}" font-size="11" font-weight="700" fill="var(--good)">Meta 1%–3%</text>
      ${fan}
      <polyline points="${line}" fill="none" stroke="var(--navy)" stroke-width="3" stroke-linejoin="round"/>
      ${dots}
      ${xl}
    </svg>`;
}

/**
 * Gráfico de comparación: varias series sobre las mismas etiquetas (p. ej. tu inflación
 * vs. la del BCRP real). `series` = [{ values, color, label, dash? }]; `band` dibuja la meta.
 */
export function compareChart({ labels, series, band = true, unit = '%', title, zero = unit === '%' }) {
    const W = 640, H = 220;
    const pad = { l: 44, r: 26, t: 14, b: 28 };
    const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    const n = labels.length - 1;
    const all = series.flatMap(s => s.values.filter(v => v != null));
    // Series en niveles (como el tipo de cambio) no parten de cero: se hace zoom a su rango.
    const lo = Math.min(...all), hi = Math.max(...all), padY = Math.max(0.05, (hi - lo) * 0.15);
    const yMax = zero ? Math.max(band ? 4 : 1, Math.ceil(hi + 0.5)) : hi + padY;
    const yMin = zero ? Math.min(0, Math.floor(lo - 0.5)) : lo - padY;
    const x = i => pad.l + (i / Math.max(1, n)) * iw;
    const y = v => pad.t + (1 - (v - yMin) / (yMax - yMin)) * ih;
    const stepV = zero ? ((yMax - yMin) > 12 ? Math.ceil((yMax - yMin) / 6) : 1) : niceStep((yMax - yMin) / 5);
    const first = zero ? yMin : Math.ceil(yMin / stepV) * stepV;
    const dec = zero ? 0 : Math.max(0, -Math.floor(Math.log10(stepV)));

    const grid = [];
    for (let v = first; v <= yMax + 1e-9; v += stepV) {
        grid.push(`<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--grid)"/>`);
        grid.push(`<text x="${pad.l - 7}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v.toFixed(dec)}${unit}</text>`);
    }
    const xl = labels.map((t, i) => (n <= 10 || i % 2 === 0)
        ? `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10.5" fill="var(--muted)">${t}</text>` : '').join('');
    const lines = series.map(s => {
        const pts = s.values.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(' ');
        return `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="3" ${s.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>`
            + s.values.map((v, i) => v == null ? '' : `<circle cx="${x(i)}" cy="${y(v)}" r="3" fill="${s.color}"><title>${labels[i]}: ${v.toFixed(2)}${unit}</title></circle>`).join('');
    }).join('');
    const bandSvg = band && 1 >= yMin && 3 <= yMax
        ? `<rect x="${pad.l}" y="${y(3)}" width="${iw}" height="${y(1) - y(3)}" fill="var(--band)"/>` : '';

    return `
    <figure class="compare">
      ${title ? `<figcaption>${title}</figcaption>` : ''}
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title ?? 'Comparación'}">${grid.join('')}${bandSvg}${lines}${xl}</svg>
      <div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.label}</span>`).join('')}</div>
    </figure>`;
}

function niceStep(raw) {
    const p = 10 ** Math.floor(Math.log10(raw));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}
