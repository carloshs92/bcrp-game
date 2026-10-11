import { openModal } from './modal.js';

/**
 * Tarjeta "Mi mandato" para compartir (PNG 1080×1350, dibujada con Canvas, sin librerías).
 * data = { mode, title, score, scoreLabel, won, stats: [[valor, etiqueta]×4], achievements: [nombres], text }
 */
const NAVY = '#1b365d', RED = '#b8202f', GOLD = '#f2b705', INK = '#172234', MUTED = '#6a7686', CREAM = '#f7f3ea';
const DICHOS = ['Perú es clave.', 'Chamba es chamba.', 'A la firme.', 'Del inti al sol, y que no se repita.', 'La inflación no perdona, causa.'];

const gameUrl = () => `${location.origin}${location.pathname}`.replace(/\/index\.html$/, '/');

function wrap(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
}

function andean(ctx, y, w) {
    ctx.fillStyle = RED;
    ctx.fillRect(0, y, w, 14);
    for (let x = 18; x < w; x += 54) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x + 7, y + 2); ctx.lineTo(x + 14, y + 7); ctx.lineTo(x + 7, y + 12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.fillRect(x + 24, y + 6, 18, 2);
    }
}

function building(ctx, cx, y, s) {
    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(s, s);
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(-60, -50); ctx.lineTo(0, -78); ctx.lineTo(60, -50); ctx.closePath(); ctx.fill();
    ctx.fillRect(-56, -48, 112, 6);
    for (const c of [-44, -22, 0, 22, 44]) ctx.fillRect(c - 5, -40, 10, 36);
    ctx.fillRect(-64, -4, 128, 8);
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(0, -60, 5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

export async function renderCard(data) {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    try { await document.fonts?.ready; } catch { /* sin fuentes web: usa las del sistema */ }
    const F = (w, size) => `${w} ${size}px Inter, system-ui, -apple-system, sans-serif`;

    // Fondo y cabecera
    ctx.fillStyle = CREAM; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, 300);
    building(ctx, 160, 205, 1.3);
    ctx.fillStyle = '#fff'; ctx.font = F(800, 96); ctx.fillText('Sol Firme', 290, 160);
    ctx.font = F(600, 34); ctx.fillStyle = '#dfe7f3'; ctx.fillText('Yo dirigí el BCR del Perú', 294, 215);
    andean(ctx, 300, W);

    // Modo y titular
    let y = 400;
    ctx.fillStyle = RED; ctx.font = F(800, 30);
    ctx.fillText(data.mode.toUpperCase(), 80, y);
    y += 70;
    ctx.fillStyle = INK; ctx.font = F(800, 60);
    for (const line of wrap(ctx, data.title, W - 160).slice(0, 3)) { ctx.fillText(line, 80, y); y += 72; }

    // Puntaje en una medalla
    y += 30;
    const cx = W / 2, cy = y + 120;
    ctx.fillStyle = data.won ? GOLD : '#d5dbe4';
    ctx.beginPath(); ctx.arc(cx, cy, 130, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = data.won ? '#c99400' : '#aab3c0';
    ctx.beginPath(); ctx.arc(cx, cy, 108, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = F(900, 92); ctx.fillText(String(data.score), cx, cy + 22);
    ctx.font = F(700, 26); ctx.fillText(data.scoreLabel ?? 'puntos', cx, cy + 66);
    ctx.textAlign = 'left';
    y = cy + 180;

    // Cuatro datos
    const colW = (W - 160) / 4;
    data.stats.slice(0, 4).forEach(([v, l], i) => {
        const x = 80 + i * colW + colW / 2;
        ctx.textAlign = 'center';
        ctx.fillStyle = NAVY; ctx.font = F(800, 52); ctx.fillText(String(v), x, y);
        ctx.fillStyle = MUTED; ctx.font = F(600, 24);
        wrap(ctx, l, colW - 20).slice(0, 2).forEach((ln, k) => ctx.fillText(ln, x, y + 40 + k * 28));
    });
    ctx.textAlign = 'left';
    y += 130;

    // Logros
    if (data.achievements?.length) {
        ctx.fillStyle = MUTED; ctx.font = F(800, 24); ctx.fillText('LOGROS', 80, y); y += 20;
        let x = 80;
        ctx.font = F(700, 28);
        for (const a of data.achievements.slice(0, 4)) {
            const w = ctx.measureText(a).width + 44;
            if (x + w > W - 80) { x = 80; y += 64; }
            ctx.fillStyle = '#fff3c4';
            roundRect(ctx, x, y, w, 50, 25); ctx.fill();
            ctx.fillStyle = '#7a5600'; ctx.fillText(a, x + 22, y + 34);
            x += w + 14;
        }
        y += 90;
    }

    // Dicho y llamado
    ctx.fillStyle = INK; ctx.font = `italic 600 34px Georgia, serif`;
    ctx.fillText(`«${data.dicho ?? DICHOS[Math.floor(Math.random() * DICHOS.length)]}»`, 80, Math.max(y, H - 190));
    ctx.fillStyle = NAVY; ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = '#fff'; ctx.font = F(800, 34); ctx.fillText('¿Lo harías mejor?', 80, H - 50);
    ctx.fillStyle = GOLD; ctx.font = F(700, 28); ctx.textAlign = 'right';
    ctx.fillText(gameUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W - 80, H - 50);
    ctx.textAlign = 'left';

    return new Promise(res => c.toBlob(res, 'image/png'));
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/** Muestra la tarjeta con sus botones: compartir (celular), descargar y WhatsApp. */
export async function openShare(data) {
    const blob = await renderCard(data);
    const url = URL.createObjectURL(blob);
    const file = new File([blob], 'mi-mandato-sol-firme.png', { type: 'image/png' });
    const text = `${data.text} ¿Lo harías mejor? ${gameUrl()}`;
    const canShare = !!navigator.canShare?.({ files: [file] });
    const modal = openModal(`
      <div class="share">
        <img class="share-card" src="${url}" alt="Tarjeta de tu resultado en Sol Firme">
        <p class="share-text">${text}</p>
      </div>
      <div class="modal-actions">
        <button class="btn" data-close>Cerrar</button>
        <a class="btn" href="${url}" download="mi-mandato-sol-firme.png">Descargar imagen</a>
        <a class="btn" href="https://wa.me/?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">WhatsApp</a>
        ${canShare ? '<button class="btn btn-primary" data-share>Compartir</button>' : ''}
      </div>`, { wide: true, onClose: () => URL.revokeObjectURL(url) });
    modal.querySelector('[data-share]')?.addEventListener('click', async () => {
        try { await navigator.share({ files: [file], text }); } catch { /* el usuario canceló */ }
    });
}
