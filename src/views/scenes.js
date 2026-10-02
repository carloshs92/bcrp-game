/**
 * Escenas ilustradas (SVG 320×200) para el slider de cada capítulo del modo historia.
 * Sin personas reales: objetos, lugares y símbolos de cada época.
 */
const NAVY = '#1b365d', RED = '#b8202f', GOLD = '#f2b705', GREEN = '#1d7a4c', SEA = '#0f7c8a', INK = '#172234';

const frame = (sky, body, ground = '#e9edf3') => `
<svg class="scene" viewBox="0 0 320 200" role="img" aria-hidden="true">
  <rect width="320" height="200" rx="16" fill="${sky}"/>
  <rect y="160" width="320" height="40" fill="${ground}"/>
  <rect width="320" height="200" rx="16" fill="none" stroke="rgba(23,34,52,.08)"/>
  ${body}
</svg>`;

/** Billete genérico (sin diseños reales). */
const bill = (x, y, r, label, color = GREEN) => `
  <g transform="translate(${x} ${y}) rotate(${r})">
    <rect x="-34" y="-17" width="68" height="34" rx="4" fill="#f4f1e4" stroke="${color}" stroke-width="2"/>
    <circle cx="-21" cy="0" r="7" fill="none" stroke="${color}" stroke-width="1.6"/>
    <text x="7" y="4" text-anchor="middle" font-size="${label.length > 6 ? 8.5 : 11}" font-weight="800" fill="${color}" font-family="system-ui">${label}</text>
  </g>`;

const coin = (x, y, r, label, fill = GOLD) => `
  <g transform="translate(${x} ${y})">
    <circle r="${r}" fill="${fill}" stroke="#c99400" stroke-width="3"/>
    <circle r="${r - 7}" fill="none" stroke="#fff6c2" stroke-width="1.5" opacity=".8"/>
    <text y="${r / 4}" text-anchor="middle" font-size="${r * 0.62}" font-weight="800" fill="#7a5600" font-family="system-ui">${label}</text>
  </g>`;

const arrowUp = (x, y, h, color = RED) => `<path d="M${x} ${y} v-${h}" stroke="${color}" stroke-width="6" stroke-linecap="round"/><path d="M${x - 11} ${y - h + 10} L${x} ${y - h - 4} L${x + 11} ${y - h + 10}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

const building = (x, y, s = 1, flag = true) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    ${flag ? `<path d="M0 -78 v-16" stroke="${INK}" stroke-width="2"/><rect x="0" y="-94" width="7" height="5" fill="${RED}"/><rect x="7" y="-94" width="7" height="5" fill="#fff" stroke="#ddd" stroke-width=".5"/><rect x="14" y="-94" width="7" height="5" fill="${RED}"/>` : ''}
    <path d="M-60 -50 L0 -78 L60 -50 Z" fill="${NAVY}"/>
    <circle cx="0" cy="-60" r="5" fill="${GOLD}"/>
    <rect x="-56" y="-50" width="112" height="7" fill="${NAVY}"/>
    ${[-44, -22, 0, 22, 44].map(c => `<rect x="${c - 6}" y="-43" width="12" height="40" fill="#fff" stroke="#c5ccd6"/>`).join('')}
    <rect x="-64" y="-4" width="128" height="8" fill="${NAVY}"/>
  </g>`;

function metaScene(hi, lo, caption) {
    return frame('#e6f4ec', `
      <rect x="40" y="40" width="240" height="110" rx="10" fill="#fff"/>
      <rect x="56" y="76" width="208" height="38" fill="rgba(29,122,76,.18)"/>
      <path d="M56 95 h208" stroke="${GREEN}" stroke-width="2" stroke-dasharray="6 5"/>
      <path d="M56 60 C100 140 130 70 170 100 S230 90 264 96" fill="none" stroke="${NAVY}" stroke-width="4" stroke-linecap="round"/>
      <text x="270" y="72" text-anchor="end" font-size="11" font-weight="800" fill="${GREEN}" font-family="system-ui">${hi}</text>
      <text x="270" y="128" text-anchor="end" font-size="11" font-weight="800" fill="${GREEN}" font-family="system-ui">${lo}</text>
      <text x="160" y="186" text-anchor="middle" font-size="15" font-weight="900" fill="${GREEN}" font-family="system-ui">${caption}</text>`, '#cfe8da');
}

export const SCENES = {
    // 1922: nace el banco emisor
    'banco-1922': frame('#f6efe1', `
      <circle cx="262" cy="46" r="20" fill="#f2c94c" opacity=".7"/>
      ${building(160, 164, 1.05)}
      <rect x="18" y="20" width="76" height="30" rx="6" fill="${NAVY}"/><text x="56" y="41" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="system-ui">1922</text>
      ${coin(270, 140, 16, 'S/')}`, '#e8dcc2'),

    // 1931: una ley crea el BCRP
    'ley-1931': frame('#eef2f8', `
      <g transform="translate(160 98) rotate(-4)">
        <rect x="-70" y="-62" width="140" height="124" rx="6" fill="#fffaf0" stroke="#d9c79c" stroke-width="2"/>
        <text x="0" y="-36" text-anchor="middle" font-size="12" font-weight="800" fill="${NAVY}" font-family="Georgia,serif">LEY</text>
        ${[-18, -6, 6, 18, 30].map(y => `<rect x="-50" y="${y}" width="${y === 30 ? 60 : 100}" height="4" rx="2" fill="#cfd6e0"/>`).join('')}
        <circle cx="42" cy="44" r="14" fill="${RED}"/><path d="M36 56 l-4 14 l10 -6 l10 6 l-4 -14" fill="${RED}"/>
      </g>
      <rect x="18" y="20" width="76" height="30" rx="6" fill="${NAVY}"/><text x="56" y="41" text-anchor="middle" font-size="17" font-weight="800" fill="#fff" font-family="system-ui">1931</text>`),

    // 1985: el inti y su caída
    'inti-1985': frame('#fdf1dd', `
      ${bill(110, 88, -12, 'I/. 10', '#7a2e8e')}
      ${bill(170, 112, 8, 'I/. 1000', '#7a2e8e')}
      ${bill(236, 80, -4, 'I/. 5 mill.', '#7a2e8e')}
      <path d="M40 60 q60 10 90 50 t130 70" fill="none" stroke="${RED}" stroke-width="4" stroke-dasharray="8 6"/>
      <text x="40" y="44" font-size="14" font-weight="800" fill="${RED}" font-family="system-ui">el inti pierde valor</text>`, '#f1dfbd'),

    // Hiperinflación: precios que cambian de un día a otro
    'hiper': frame('#fbe7e5', `
      <rect x="40" y="70" width="150" height="90" rx="6" fill="#fff" stroke="#e4b8b4" stroke-width="2"/>
      <path d="M32 72 h166 l-12 -24 h-142 z" fill="${RED}"/><path d="M48 48 h22 l-4 24 h-22z M92 48 h22 l-2 24 h-22z M136 48 h22 l0 24 h-22z" fill="#fff" opacity=".85"/>
      <g font-family="system-ui" font-weight="800">
        <rect x="54" y="88" width="56" height="22" rx="4" fill="${GOLD}"/><text x="82" y="104" text-anchor="middle" font-size="11" fill="${INK}">pan</text>
        <text x="122" y="104" font-size="13" fill="${RED}">I/. ▲▲▲</text>
        <rect x="54" y="120" width="56" height="22" rx="4" fill="${GOLD}"/><text x="82" y="136" text-anchor="middle" font-size="11" fill="${INK}">leche</text>
        <text x="122" y="136" font-size="13" fill="${RED}">I/. ▲▲▲</text>
      </g>
      ${arrowUp(250, 150, 90)}
      <text x="250" y="186" text-anchor="middle" font-size="22" font-weight="900" fill="${RED}" font-family="system-ui">7,650%</text>`, '#f3cfcb'),

    // Fujishock: la gasolina sube 3,000%
    'shock': frame('#fff4d6', `
      <g transform="translate(78 160)">
        <rect x="-36" y="-110" width="72" height="110" rx="8" fill="${RED}"/>
        <rect x="-26" y="-98" width="52" height="34" rx="4" fill="#fff"/>
        <text x="0" y="-75" text-anchor="middle" font-size="14" font-weight="900" fill="${RED}" font-family="system-ui">GAS</text>
        <path d="M36 -80 h14 v50 a8 8 0 0 0 16 0 v-40" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      </g>
      <g transform="translate(228 76) rotate(8)">
        <rect x="-62" y="-30" width="124" height="60" rx="10" fill="${GOLD}" stroke="#c99400" stroke-width="3"/>
        <text x="0" y="12" text-anchor="middle" font-size="30" font-weight="900" fill="${RED}" font-family="system-ui">+3,000%</text>
      </g>
      <text x="228" y="140" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="system-ui">8 de agosto de 1990</text>`, '#f1e2b3'),

    // La máquina de imprimir billetes
    'imprenta': frame('#e8eef8', `
      <g transform="translate(110 160)">
        <rect x="-60" y="-80" width="120" height="80" rx="10" fill="${NAVY}"/>
        <rect x="-44" y="-66" width="88" height="10" rx="4" fill="#0f2038"/>
        <circle cx="-30" cy="-30" r="12" fill="${GOLD}"/><circle cx="0" cy="-30" r="12" fill="${GOLD}"/><circle cx="30" cy="-30" r="12" fill="${GOLD}"/>
      </g>
      ${bill(150, 70, -20, 'I/.', '#7a2e8e')}${bill(205, 52, 10, 'I/.', '#7a2e8e')}${bill(255, 92, -6, 'I/.', '#7a2e8e')}${bill(225, 132, 18, 'I/.', '#7a2e8e')}
      <text x="160" y="188" text-anchor="middle" font-size="15" font-weight="900" fill="${RED}" font-family="system-ui">¿seguir imprimiendo?</text>`),

    // 1991: el Nuevo Sol
    'sol-1991': frame('#fff8e1', `
      ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<path d="M160 96 L${160 + Math.cos(a * Math.PI / 180) * 92} ${96 + Math.sin(a * Math.PI / 180) * 92}" stroke="${GOLD}" stroke-width="6" opacity=".35"/>`).join('')}
      ${coin(160, 96, 48, 'S/ 1')}
      <text x="160" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}" font-family="system-ui">1 nuevo sol = 1,000,000 de intis</text>`, '#f6e7b0'),

    // 1993: la Constitución y la autonomía
    'constitucion': frame('#eef2f8', `
      <g transform="translate(120 98)">
        <rect x="-56" y="-66" width="112" height="132" rx="8" fill="${RED}"/>
        <rect x="-46" y="-56" width="92" height="112" rx="4" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
        <text x="0" y="-12" text-anchor="middle" font-size="12" font-weight="800" fill="#fff" font-family="Georgia,serif">CONSTITUCIÓN</text>
        <text x="0" y="22" text-anchor="middle" font-size="22" font-weight="900" fill="${GOLD}" font-family="Georgia,serif">Art. 84</text>
      </g>
      <g transform="translate(240 98)">
        <path d="M0 -58 L44 -42 V0 C44 30 22 48 0 58 C-22 48 -44 30 -44 0 V-42 Z" fill="${NAVY}"/>
        <path d="M-16 0 l12 12 l24 -26" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="240" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="${NAVY}" font-family="system-ui">autonomía</text>`),

    // 2002: meta de 2.5% ±1 · 2007: meta de 2% (entre 1% y 3%)
    'meta-2002': metaScene('3.5%', '1.5%', 'meta: 2.5% (±1 punto)'),
    'meta': metaScene('3%', '1%', 'meta: 2% (entre 1% y 3%)'),

    // 2008: boom de crecimiento y precios de alimentos y petróleo
    'boom': frame('#e3f3f5', `
      ${[[40, 70], [74, 100], [104, 52], [140, 86], [176, 64]].map(([x, h]) => `<rect x="${x}" y="${160 - h}" width="30" height="${h}" fill="${NAVY}" opacity=".85"/>`).join('')}
      <path d="M210 160 v-90 h50 M240 70 v20" stroke="${GOLD}" stroke-width="5" fill="none"/><rect x="232" y="90" width="16" height="12" fill="${GOLD}"/>
      <path d="M30 130 L110 110 L170 80 L280 34" fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
      <path d="M266 30 L284 32 L276 48" fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="40" y="34" font-size="18" font-weight="900" fill="${GREEN}" font-family="system-ui">+8% al año</text>`, '#cde6ea'),

    // Setiembre 2008: la quiebra en Wall Street
    'crash': frame('#e9e6f2', `
      ${[[30, 90], [62, 120], [100, 76], [134, 104]].map(([x, h]) => `<rect x="${x}" y="${160 - h}" width="28" height="${h}" fill="#4d5a6c"/>`).join('')}
      <path d="M170 40 L210 60 L230 50 L290 150" fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round"/>
      <path d="M276 140 L292 154 L296 132" fill="none" stroke="${RED}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="160" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}" font-family="system-ui">la peor crisis desde 1929</text>`, '#d8d3e6'),

    // 2010–2016: desdolarización
    'desdolarizacion': frame('#eef2f8', `
      <path d="M160 52 v100" stroke="${INK}" stroke-width="5"/><path d="M60 70 L260 50" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M130 160 h60 l-30 -10z" fill="${INK}"/>
      ${coin(70, 98, 26, 'S/')}
      ${coin(250, 78, 20, 'US$', '#cfe8da')}
      <text x="160" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="${NAVY}" font-family="system-ui">más crédito en soles</text>`),

    // El Niño costero: mar caliente y lluvias
    'nino': frame('#cfe3f0', `
      <path d="M40 54 a22 22 0 0 1 40 -10 a18 18 0 1 1 10 34 h-48 a14 14 0 0 1 -2 -24z" fill="#8a94a3"/>
      <path d="M180 44 a24 24 0 0 1 44 -10 a20 20 0 1 1 10 36 h-52 a15 15 0 0 1 -2 -26z" fill="#6a7686"/>
      ${[[52, 92], [70, 100], [88, 92], [196, 86], [214, 96], [232, 86], [250, 96]].map(([x, y]) => `<path d="M${x} ${y} l-6 14" stroke="#28508a" stroke-width="3" stroke-linecap="round"/>`).join('')}
      <path d="M0 150 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V200 H0z" fill="${RED}" opacity=".75"/>
      <path d="M0 166 q20 -12 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V200 H0z" fill="#d9822b"/>
      <text x="300" y="140" text-anchor="end" font-size="14" font-weight="900" fill="${RED}" font-family="system-ui">mar caliente</text>`, '#d9822b'),

    // Huaicos y alimentos caros
    'mercado': frame('#fdf1dd', `
      <path d="M30 70 h260 l-16 -30 h-228z" fill="${GREEN}"/><path d="M48 40 h24 l-4 30 h-24z M108 40 h24 l-2 30 h-24z M168 40 h24 l0 30 h-24z M228 40 h24 l2 30 h-24z" fill="#fff" opacity=".85"/>
      <rect x="40" y="70" width="240" height="90" fill="#fff" stroke="#e5d3b0" stroke-width="2"/>
      <circle cx="80" cy="112" r="16" fill="#9ccc65"/><circle cx="100" cy="122" r="14" fill="#c0ca33"/>
      <path d="M150 128 c0 -26 30 -26 30 0z" fill="#e9a23b"/><circle cx="210" cy="116" r="16" fill="${RED}"/><circle cx="232" cy="124" r="13" fill="#d84315"/>
      <rect x="62" y="136" width="54" height="18" rx="4" fill="${GOLD}"/><text x="89" y="149" text-anchor="middle" font-size="11" font-weight="800" fill="${RED}" font-family="system-ui">limón ▲</text>
      <rect x="196" y="136" width="54" height="18" rx="4" fill="${GOLD}"/><text x="223" y="149" text-anchor="middle" font-size="11" font-weight="800" fill="${RED}" font-family="system-ui">tomate ▲</text>
      <text x="160" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="system-ui">los alimentos se disparan</text>`, '#f1dfbd'),

    // Cuarentena: calles vacías
    'cuarentena': frame('#dfe6ef', `
      ${[[24, 80], [100, 96], [190, 70], [252, 88]].map(([x, h], i) => `<rect x="${x}" y="${160 - h}" width="${i === 1 ? 74 : 60}" height="${h}" fill="#8a94a3"/><rect x="${x + 10}" y="${160 - 34}" width="${(i === 1 ? 74 : 60) - 20}" height="34" fill="#5d6878"/>${[0, 1, 2, 3, 4].map(k => `<path d="M${x + 10} ${160 - 34 + k * 7} h${(i === 1 ? 74 : 60) - 20}" stroke="#4d5866" stroke-width="1.5"/>`).join('')}`).join('')}
      <g transform="translate(160 56)"><rect x="-46" y="-20" width="92" height="40" rx="18" fill="#fff" stroke="#8fb6d9" stroke-width="3"/><path d="M-46 -6 h-16 M46 -6 h16" stroke="#8fb6d9" stroke-width="3"/><path d="M-30 -4 h60 M-30 6 h60" stroke="#c9dcee" stroke-width="2"/></g>
      <text x="160" y="186" text-anchor="middle" font-size="14" font-weight="800" fill="${INK}" font-family="system-ui">negocios cerrados</text>`, '#c3ccd8'),

    // Reactiva Perú y la tasa en su piso
    'reactiva': frame('#e6f4ec', `
      <g transform="translate(96 100)">
        <path d="M0 -60 L48 -42 V0 C48 32 24 52 0 62 C-24 52 -48 32 -48 0 V-42 Z" fill="${GREEN}"/>
        <path d="M-18 -2 l12 12 l26 -28" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <g transform="translate(222 120)">
        <path d="M-50 -50 h100 l8 18 h-116z" fill="${RED}"/><rect x="-46" y="-32" width="92" height="56" fill="#fff" stroke="#e4b8b4" stroke-width="2"/>
        <rect x="-12" y="-10" width="24" height="34" fill="${NAVY}"/>
      </g>
      <text x="160" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="${GREEN}" font-family="system-ui">crédito garantizado para pagar sueldos</text>`, '#cfe8da'),

    // 2021: rebote y dólar al alza
    'dolar-sube': frame('#fff8e1', `
      ${coin(84, 100, 40, 'US$', '#cfe8da')}
      ${arrowUp(160, 150, 100, GREEN)}
      <path d="M190 140 L220 120 L240 128 L290 60" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>
      <text x="292" y="50" text-anchor="end" font-size="16" font-weight="900" fill="${RED}" font-family="system-ui">US$ ▲</text>
      <text x="160" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="system-ui">la economía rebota… y el dólar también</text>`, '#f6e7b0'),

    // 2022: guerra, petróleo y trigo
    'guerra': frame('#f6ece6', `
      <g transform="translate(92 160)">
        <rect x="-30" y="-86" width="60" height="86" rx="8" fill="${INK}"/>
        <path d="M-30 -60 h60 M-30 -26 h60" stroke="#4d5a6c" stroke-width="4"/>
        <path d="M-8 -50 c-10 16 10 22 0 34 c14 -6 16 -22 0 -34z" fill="${GOLD}"/>
      </g>
      ${[176, 200, 224, 248].map((x, i) => `<g transform="translate(${x} 160)"><path d="M0 0 V-${70 + (i % 2) * 14}" stroke="#c99400" stroke-width="3"/>${[0, 1, 2, 3].map(k => `<ellipse cx="${k % 2 ? 5 : -5}" cy="${-(52 + (i % 2) * 14) - k * 8}" rx="5" ry="8" fill="${GOLD}"/>`).join('')}</g>`).join('')}
      ${arrowUp(286, 150, 80)}
      <text x="160" y="186" text-anchor="middle" font-size="13" font-weight="800" fill="${INK}" font-family="system-ui">petróleo, trigo y fertilizantes al alza</text>`, '#ead8cc')
};

export const scene = id => SCENES[id] ?? SCENES['banco-1922'];
