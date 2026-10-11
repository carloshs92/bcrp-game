/**
 * Íconos SVG de trazo (24×24, usan currentColor). Propios, para que se vean igual en todos
 * los sistemas (los emojis cambian según el dispositivo).
 */
const svg = (body, { size = 22, fill = false } = {}) =>
    `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const PATHS = {
    // Medidores
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.5L22 7H6"/>',
    factory: '<path d="M2 20V9l6 4V9l6 4V5h6v15z"/><path d="M6 17h2M12 17h2M17 17h1"/>',
    handshake: '<path d="m11 17 2 2a1.4 1.4 0 0 0 2-2"/><path d="m14 14 2.5 2.5a1.4 1.4 0 0 0 2-2L15 11l-3 1-1.5-1.5a2 2 0 0 1 0-3L13 5l3 1 4-1v8"/><path d="M4 5l4 1 3.5-1M2 13l7 7a1.4 1.4 0 0 0 2-2"/><path d="M4 5v8l3.5 3.5"/>',
    congress: '<path d="M3 21h18M5 21v-7M9 21v-7M15 21v-7M19 21v-7"/><path d="M3 14h18"/><path d="M4 11a8 8 0 0 1 16 0z"/><path d="M12 3v0"/>',
    dollar: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    // Secciones
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/>',
    telescope: '<path d="m10 11 8-4 2 4-8 4z"/><path d="m4 14 6-3 2 4-6 3z"/><path d="m9 17-2 5M11 16l2 6"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 4 7"/>',
    map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3z"/><path d="M9 3v15M15 6v15"/>',
    // Tipos de evento
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 9a4 4 0 0 1 0 6M20 6a8 8 0 0 1 0 12"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    truck: '<path d="M2 6h12v10H2zM14 10h4l4 4v2h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    // Acciones
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    equal: '<path d="M5 9h14M5 15h14"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.1 2.1 0 0 1-3-3L11 10"/><path d="m16 16 6-6M8 8l6-6M9 7l8 8M21 11l-8-8"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.2 1.3 1.2 2.8 2.5 2.8z"/>',
    // Modos del inicio
    cap: '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
    // Grupos que ganan o pierden con cada decisión
    piggy: '<path d="M19 9.5c1 .8 1.7 2 2 3.5h1v3h-1.6a7 7 0 0 1-2.4 2.6V21h-3v-1.6a8 8 0 0 1-4 0V21H8v-2.4A6.5 6.5 0 0 1 5 13c0-3.9 3.6-7 8-7a9 9 0 0 1 3.3.6L19 5z"/><path d="M15.5 11.5h.01M2 11c0 1.5 1 2.5 3 2.5"/>',
    elder: '<circle cx="11" cy="4.5" r="2.5"/><path d="M11 7.5c-2 0-3 1.5-3 4v3l-1.5 7M11 7.5c2 0 3 1.5 3 4v2M9 15l2 6.5M14 13.5h3.5v8"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    store: '<path d="M3 9 4.5 3h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 11v10h14V11M10 21v-5h4v5"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    ship: '<path d="M2 20c2 1.3 4 1.3 6 0 2 1.3 4 1.3 6 0 2 1.3 4 1.3 6 0"/><path d="M4 17 3 12h18l-2 5"/><path d="M6 12V7h8v5M9 7V4"/>',
    vault: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v1.5M12 14.5V16M8 12h1.5M14.5 12H16M3 20v1.5M21 20v1.5"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    // Congreso: proyectos y respuestas
    gold: '<path d="M3 20l2.5-6h13L21 20z"/><path d="M7 14l2-5h6l2 5"/><path d="M10.5 9l1-3h1l1 3"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    mute: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M9 9l6 6M15 9l-6 6"/>',
    scroll: '<path d="M8 21h11a2 2 0 0 0 2-2v-1H10v1a2 2 0 0 1-4 0V5a2 2 0 0 0-2-2h13a2 2 0 0 1 2 2v13"/><path d="M10 8h6M10 12h6"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    pin: '<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l3 3.2H6z"/>',
    // 1990
    printer: '<path d="M6 9V2h12v7"/><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M6 14h12v8H6z"/>',
    scale: '<path d="M12 3v18M5 21h14M4 7h16"/><path d="m4 7-3 7a4 4 0 0 0 6 0zM20 7l-3 7a4 4 0 0 0 6 0z"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.4 9.3 8 11 4.6-1.7 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>'
};

export function icon(name, opts) {
    return svg(PATHS[name] ?? '', opts);
}

/** Tipo de evento → ícono. */
export const KIND_ICON = { demanda: 'cart', oferta: 'truck', politica: 'megaphone', externo: 'globe', calma: 'sun' };

/**
 * Halcón y paloma ilustrados (no son íconos de trazo: tienen color propio).
 */
export const hawk = `
<svg class="bird" viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="24" r="23" fill="#fbe7e5"/>
  <path d="M10 30c4-10 12-16 22-16 4 0 7 1 9 3l-6 2c2 2 3 5 3 8-3-2-6-2-9-1l-6 9c-4-1-9-3-13-5z" fill="#8a3b12"/>
  <path d="M29 17c3-1 6 0 8 2l-5 2z" fill="#f2b705"/>
  <circle cx="31.5" cy="19" r="1.6" fill="#fff"/><circle cx="31.8" cy="19.2" r=".8" fill="#172234"/>
  <path d="M27 17l6-2" stroke="#172234" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M14 29c3 2 7 3 10 3" stroke="#5c250b" stroke-width="1.5" fill="none"/>
</svg>`;

export const dove = `
<svg class="bird" viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="24" r="23" fill="#e6f4ec"/>
  <path d="M9 27c5 0 9-3 12-7 2-3 5-5 9-5 3 0 5 2 5 4l4 1-4 2c0 6-5 11-12 11-6 0-11-2-14-6z" fill="#fff" stroke="#9fb7a8" stroke-width="1.2"/>
  <path d="M16 26c3-6 8-9 13-9-3 4-7 8-13 9z" fill="#dfe9e3"/>
  <circle cx="31" cy="19.5" r="1.3" fill="#172234"/>
  <path d="M35 21l4 0" stroke="#e9a23b" stroke-width="2" stroke-linecap="round"/>
  <path d="M38 12c-2 2-2 4 0 5" stroke="#1d7a4c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M38 12c2 1 3 3 2 5" stroke="#1d7a4c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>`;

/**
 * Bustos ilustrados de los personajes: cara, ropa del color del personaje y un rasgo propio
 * (gorra del chofer, casco del minero, sombrero del agricultor…).
 */
const HAIR = {
    short: c => `<path d="M16 19c0-6 3.5-9 8-9s8 3 8 9c-1-3-3-4-8-4s-7 1-8 4z" fill="${c}"/>`,
    long: c => `<path d="M15 21c0-7 4-11 9-11s9 4 9 11v9h-3v-9c-1-3-3-4-6-4s-5 1-6 4v9h-3z" fill="${c}"/>`,
    braids: c => `<path d="M16 19c0-6 3.5-9 8-9s8 3 8 9c-1-3-3-4-8-4s-7 1-8 4z" fill="${c}"/><path d="M16 20v12M32 20v12" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    bun: c => `<circle cx="24" cy="9" r="3.5" fill="${c}"/><path d="M16 19c0-6 3.5-9 8-9s8 3 8 9c-1-3-3-4-8-4s-7 1-8 4z" fill="${c}"/>`
};
const EXTRA = {
    tie: '<path d="M24 33l-2 3 2 8 2-8z" fill="#b8202f"/><path d="M20 32l4 2 4-2" stroke="#fff" stroke-width="1.5" fill="none"/>',
    glasses: '<g fill="none" stroke="#172234" stroke-width="1.2"><circle cx="20.5" cy="20" r="2.6"/><circle cx="27.5" cy="20" r="2.6"/><path d="M23.1 20h1.8"/></g>',
    mustache: '<path d="M20.5 24.5q3.5-2 7 0q-3.5 1-7 0z" fill="#9aa1a8"/>',
    cap: c => `<path d="M15 17c0-5 4-8 9-8s9 3 9 8z" fill="${c}"/><path d="M15 17h22" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`,
    helmet: '<path d="M14 18c0-6 4.5-10 10-10s10 4 10 10z" fill="#f2b705"/><rect x="13" y="17" width="22" height="2.5" rx="1" fill="#d99a00"/><circle cx="24" cy="12" r="2" fill="#fff6c2" stroke="#d99a00"/>',
    sombrero: '<ellipse cx="24" cy="15" rx="15" ry="3" fill="#d9b36c"/><path d="M17 15c0-5 3-7 7-7s7 2 7 7z" fill="#e8c888"/><path d="M17 13.5h14" stroke="#8a3b12" stroke-width="1.5"/>',
    fedora: '<ellipse cx="24" cy="14" rx="12" ry="2.5" fill="#3c4859"/><path d="M17 14c0-5 3-7 7-7s7 2 7 7z" fill="#4d5a6c"/><rect x="28" y="9" width="4" height="3" fill="#fff"/>',
    tape: '<path d="M17 33q7 5 14 0" stroke="#f2b705" stroke-width="2.2" fill="none"/><path d="M18 34v6M30 34v6" stroke="#f2b705" stroke-width="2"/>',
    vest: '<path d="M16 36l4-4 4 5 4-5 4 4v12H16z" fill="#0f5a4a"/><text x="24" y="45" text-anchor="middle" font-size="7" font-weight="800" fill="#f2b705" font-family="system-ui">$</text>',
    sash: '<path d="M17 33l14 12" stroke="#b8202f" stroke-width="3"/><path d="M17 33l14 12" stroke="#fff" stroke-width="1" stroke-dasharray="2 2"/>',
    cloud: '<path d="M33 12a3 3 0 0 1 5.5-1.3 2.5 2.5 0 1 1 .5 5H34a2 2 0 0 1-1-3.7z" fill="#fff" stroke="#0f7c8a" stroke-width="1"/>'
};
const CAST = {
    ministro: { skin: '#d6a07a', hair: ['short', '#2b2118'], extra: ['tie'] },
    congreso: { skin: '#c68a5e', hair: ['long', '#1c1410'], extra: ['sash'] },
    gremio: { skin: '#e0b18d', hair: ['short', '#b9bec4'], extra: ['tie', 'mustache'] },
    gamarra: { skin: '#b97a50', hair: ['long', '#2a1a12'], extra: ['tape'] },
    caserita: { skin: '#a86c45', hair: ['braids', '#1c1410'], extra: [] },
    chofer: { skin: '#b07a52', hair: null, extra: [['cap', '#1b365d'], 'mustache'] },
    cambista: { skin: '#c9926a', hair: ['short', '#1c1410'], extra: ['vest'] },
    analista: { skin: '#e3b894', hair: ['short', '#5a3c22'], extra: ['glasses', 'tie'] },
    meteo: { skin: '#c68a5e', hair: ['bun', '#2a1a12'], extra: ['glasses', 'cloud'] },
    agricultor: { skin: '#9c6440', hair: null, extra: ['sombrero'] },
    prensa: { skin: '#d6a07a', hair: null, extra: ['fedora', 'glasses'] },
    minero: { skin: '#b07a52', hair: null, extra: ['helmet'] },
    kevin: { skin: '#b97a50', hair: null, extra: [['cap', '#c2185b']] },
    valeria: { skin: '#d6a07a', hair: ['bun', '#3a2416'], extra: ['glasses'] },
    congresista: { skin: '#c9926a', hair: ['short', '#1c1410'], extra: ['sash', 'tie'] }
};

export function bust(who, color, size = 48) {
    const c = CAST[who] ?? CAST.analista;
    const extra = c.extra.map(x => Array.isArray(x) ? EXTRA[x[0]](x[1]) : EXTRA[x]).join('');
    return `
    <svg class="bust" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="${color}" opacity=".18"/>
      <clipPath id="bc-${who}"><circle cx="24" cy="24" r="24"/></clipPath>
      <g clip-path="url(#bc-${who})">
        ${c.hair?.[0] === 'long' ? HAIR.long(c.hair[1]) : ''}
        <path d="M8 50c0-11 7-17 16-17s16 6 16 17z" fill="${color}"/>
        <path d="M21 30h6v4l-3 2-3-2z" fill="${c.skin}"/>
        <ellipse cx="24" cy="21" rx="8" ry="9" fill="${c.skin}"/>
        ${c.hair && c.hair[0] !== 'long' ? HAIR[c.hair[0]](c.hair[1]) : ''}
        ${c.hair?.[0] === 'long' ? `<path d="M16 19c0-6 3.5-9 8-9s8 3 8 9c-1-3-3-4-8-4s-7 1-8 4z" fill="${c.hair[1]}"/>` : ''}
        <circle cx="20.5" cy="20.5" r="1.2" fill="#172234"/><circle cx="27.5" cy="20.5" r="1.2" fill="#172234"/>
        <path d="M21.5 25.5q2.5 1.8 5 0" stroke="#172234" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        ${extra}
      </g>
    </svg>`;
}

/**
 * Escena del Congreso para los modales: hemiciclo con curules y, al frente, el tema en discusión.
 * `mood` colorea el fondo: más rojo cuanto más molesto.
 */
export function congressScene(topic, { angry = false } = {}) {
    const seats = [];
    [[30, 9], [22, 7], [14, 5]].forEach(([r, n], row) => {
        for (let i = 0; i < n; i++) {
            const a = Math.PI * (i + 0.5) / n;
            seats.push(`<circle cx="${(48 - Math.cos(a) * r * 1.35).toFixed(1)}" cy="${(46 - Math.sin(a) * r).toFixed(1)}" r="${3.2 - row * 0.4}" fill="${(i + row) % 3 === 0 ? '#f2b705' : '#fff'}" opacity=".9"/>`);
        }
    });
    return `
    <div class="congress-scene${angry ? ' angry' : ''}" aria-hidden="true">
      <svg viewBox="0 0 96 56" class="hemi">${seats.join('')}<rect x="40" y="46" width="16" height="7" rx="1.5" fill="#fff" opacity=".85"/></svg>
      <span class="scene-topic">${icon(topic, { size: 30 })}</span>
    </div>`;
}
