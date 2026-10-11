/**
 * Tarjeta "Mi mandato" para compartir por WhatsApp o redes: arquetipo, estrellas, el peor turno y
 * la frase de Doña Rosa. Se dibuja en un canvas (1080×1350, formato vertical) para poder
 * compartirla como imagen; si el navegador no comparte archivos, se descarga y se copia el texto.
 */

const NAVY = '#1b365d', RED = '#b8202f', GOLD = '#f2b705', GREEN = '#1d7a4c', INK = '#172234', CREAM = '#fbf7ef';

function wrap(ctx, text, x, y, maxW, lineH, maxLines = 4) {
    const words = text.split(' ');
    let line = '', lines = 0;
    for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (ctx.measureText(test).width > maxW && line) {
            ctx.fillText(line, x, y);
            y += lineH;
            line = w;
            if (++lines >= maxLines - 1) { line = words.slice(words.indexOf(w)).join(' '); break; }
        } else line = test;
    }
    if (ctx.measureText(line).width > maxW) {
        while (line.length > 3 && ctx.measureText(`${line}…`).width > maxW) line = line.slice(0, -1);
        line += '…';
    }
    ctx.fillText(line, x, y);
    return y + lineH;
}

/** Franja de textil andino (rombos) como en la interfaz. */
function band(ctx, y, w) {
    const colors = [RED, GOLD, GREEN, NAVY];
    ctx.fillStyle = RED;
    ctx.fillRect(0, y, w, 28);
    for (let i = 0, x = 0; x < w; i++, x += 40) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(x + 20, y + 3);
        ctx.lineTo(x + 34, y + 14);
        ctx.lineTo(x + 20, y + 25);
        ctx.lineTo(x + 6, y + 14);
        ctx.closePath();
        ctx.fill();
    }
}

function star(ctx, cx, cy, r, filled) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5;
        const rr = i % 2 ? r * 0.45 : r;
        ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fillStyle = filled ? GOLD : 'rgba(255,255,255,.18)';
    ctx.fill();
}

/** Dibuja la tarjeta y devuelve el canvas. */
export function drawShareCard({ mode, headline, sub, stars = 0, score = null, worst = null, rosa = '', unit = 'mes' }) {
    const W = 1080, H = 1350;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const font = (w, s) => `${w} ${s}px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif`;

    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);
    band(ctx, 0, W);
    band(ctx, H - 28, W);

    // Sol
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(W - 150, 190, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 10;
    for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(W - 150 + Math.cos(a) * 92, 190 + Math.sin(a) * 92);
        ctx.lineTo(W - 150 + Math.cos(a) * 118, 190 + Math.sin(a) * 118);
        ctx.stroke();
    }

    ctx.fillStyle = '#dfe7f3';
    ctx.font = font(700, 34);
    ctx.fillText('SOL FIRME', 80, 120);
    ctx.font = font(500, 30);
    ctx.fillText(mode, 80, 168);

    ctx.fillStyle = '#fff';
    ctx.font = font(800, 84);
    let y = wrap(ctx, headline, 80, 360, W - 160, 96, 3);
    ctx.fillStyle = '#c9d6ea';
    ctx.font = font(500, 36);
    y = wrap(ctx, sub, 80, y + 6, W - 160, 48, 3);

    for (let i = 0; i < 3; i++) star(ctx, 120 + i * 120, y + 70, 48, i < stars);
    if (score != null) {
        ctx.fillStyle = '#fff';
        ctx.font = font(800, 56);
        ctx.fillText(`${score} pts`, 470, y + 92);
    }
    y += 170;

    // Recuadro del peor turno
    if (worst) {
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        ctx.fillRect(80, y, W - 160, 150);
        ctx.fillStyle = GOLD;
        ctx.font = font(700, 28);
        ctx.fillText(`MI PEOR ${unit.toUpperCase()}`, 110, y + 50);
        ctx.fillStyle = '#fff';
        ctx.font = font(600, 36);
        wrap(ctx, `${worst.label}: inflación ${worst.inflation.toFixed(1)}%, PBI ${worst.growth.toFixed(1)}%`, 110, y + 104, W - 220, 44, 1);
        y += 190;
    }

    // Doña Rosa
    ctx.fillStyle = CREAM;
    ctx.fillRect(80, y, W - 160, 300);
    ctx.fillStyle = GREEN;
    ctx.font = font(700, 28);
    ctx.fillText('DOÑA ROSA, CASERA DEL MERCADO', 110, y + 52);
    ctx.fillStyle = INK;
    ctx.font = `italic ${font(500, 40)}`;
    wrap(ctx, `«${rosa}»`, 110, y + 112, W - 220, 52, 4);

    ctx.fillStyle = '#dfe7f3';
    ctx.font = font(600, 32);
    ctx.fillText('¿Lo harías mejor dirigiendo el BCR?', 80, H - 70);
    return c;
}

/** Comparte la imagen y el texto; si no se puede, descarga la imagen y copia el texto. */
export async function shareCard(canvas, text) {
    const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
    const file = blob ? new File([blob], 'sol-firme.png', { type: 'image/png' }) : null;
    try {
        if (file && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], text });
            return 'shared';
        }
        if (navigator.share) {
            await navigator.share({ text });
            return 'shared';
        }
    } catch (e) {
        if (e?.name === 'AbortError') return 'cancelled';
    }
    if (blob) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sol-firme.png';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
    try { await navigator.clipboard.writeText(text); } catch { /* sin portapapeles */ }
    return 'downloaded';
}
