/** Ilustraciones SVG en línea. Genéricas: no reproducen logos reales. */

export const logo = `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <rect x="1" y="1" width="30" height="30" rx="7" fill="#fff"/>
  <path d="M16 6 L27 11 H5 Z" fill="#b8202f"/>
  <rect x="7" y="13" width="3" height="10" fill="#1b365d"/>
  <rect x="12.3" y="13" width="3" height="10" fill="#1b365d"/>
  <rect x="16.7" y="13" width="3" height="10" fill="#1b365d"/>
  <rect x="22" y="13" width="3" height="10" fill="#1b365d"/>
  <rect x="5" y="24" width="22" height="3" fill="#1b365d"/>
</svg>`;

export const building = `
<svg viewBox="0 0 240 170" aria-hidden="true">
  <ellipse cx="120" cy="160" rx="110" ry="8" fill="#dde2e9"/>
  <path d="M120 12 L222 52 H18 Z" fill="#1b365d"/>
  <path d="M120 26 L190 50 H50 Z" fill="#28508a"/>
  <circle cx="120" cy="40" r="6" fill="#f2b705"/>
  <rect x="24" y="52" width="192" height="10" fill="#1b365d"/>
  ${[36, 70, 104, 138, 172].map(x => `<rect x="${x}" y="66" width="18" height="72" rx="2" fill="#fff" stroke="#c5ccd6"/>`).join('')}
  <rect x="16" y="138" width="208" height="10" fill="#1b365d"/>
  <rect x="8" y="148" width="224" height="8" fill="#28508a"/>
  <rect x="100" y="0" width="3" height="16" fill="#6a7686"/>
  <rect x="103" y="0" width="10" height="7" fill="#b8202f"/>
  <rect x="113" y="0" width="10" height="7" fill="#fff" stroke="#dde2e9" stroke-width=".5"/>
  <rect x="123" y="0" width="10" height="7" fill="#b8202f"/>
</svg>`;

export const targetBand = `
<svg viewBox="0 0 300 220" aria-hidden="true">
  <rect x="20" y="20" width="270" height="180" rx="12" fill="#fff"/>
  <rect x="40" y="90" width="230" height="60" fill="rgba(29,122,76,.14)"/>
  <line x1="40" y1="120" x2="270" y2="120" stroke="#1d7a4c" stroke-dasharray="6 5" stroke-width="2"/>
  <text x="46" y="84" font-size="12" fill="#1d7a4c" font-weight="700" font-family="Inter, sans-serif">3%</text>
  <text x="46" y="166" font-size="12" fill="#1d7a4c" font-weight="700" font-family="Inter, sans-serif">1%</text>
  <text x="228" y="114" font-size="12" fill="#1d7a4c" font-weight="700" font-family="Inter, sans-serif">Meta 2%</text>
  <polyline points="40,48 80,56 120,78 160,104 200,118 240,124 270,120" fill="none" stroke="#1b365d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="40" cy="48" r="6" fill="#b3261e"/>
  <circle cx="270" cy="120" r="6" fill="#1d7a4c"/>
</svg>`;

const chainStep = (y, title, sub, color) => `
  <rect x="30" y="${y}" width="240" height="44" rx="10" fill="#fff" stroke="${color}" stroke-width="2"/>
  <text x="150" y="${y + 20}" text-anchor="middle" font-size="14" font-weight="700" fill="#172234" font-family="Inter, sans-serif">${title}</text>
  <text x="150" y="${y + 36}" text-anchor="middle" font-size="11" fill="#6a7686" font-family="Inter, sans-serif">${sub}</text>`;
const chainArrow = y => `<path d="M150 ${y} v14 m-6 -6 l6 6 l6 -6" fill="none" stroke="#6a7686" stroke-width="2"/>`;

export const transmission = `
<svg viewBox="0 0 300 270" aria-hidden="true">
  ${chainStep(4, '↑ Sube la tasa de referencia', 'Decisión del Directorio', '#1b365d')}
  ${chainArrow(50)}
  ${chainStep(68, '↑ Créditos más caros', 'Bancos suben sus tasas', '#28508a')}
  ${chainArrow(114)}
  ${chainStep(132, '↓ Menos consumo e inversión', 'Familias y empresas gastan menos', '#a15c00')}
  ${chainArrow(178)}
  ${chainStep(196, '↓ Menos presión sobre precios', 'La inflación baja… meses después', '#1d7a4c')}
  <text x="150" y="264" text-anchor="middle" font-size="11" fill="#b8202f" font-weight="700" font-family="Inter, sans-serif">Al bajar la tasa, la cadena funciona al revés</text>
</svg>`;

export const cycle = `
<svg viewBox="0 0 300 240" aria-hidden="true">
  <circle cx="150" cy="120" r="78" fill="none" stroke="#c5ccd6" stroke-width="3" stroke-dasharray="4 7"/>
  <g font-family="Inter, sans-serif" text-anchor="middle">
    <circle cx="150" cy="42" r="34" fill="#1b365d"/>
    <text x="150" y="38" fill="#fff" font-size="20" font-weight="800">1</text>
    <text x="150" y="56" fill="#fff" font-size="11" font-weight="600">Informe</text>
    <circle cx="232" cy="170" r="34" fill="#b8202f"/>
    <text x="232" y="166" fill="#fff" font-size="20" font-weight="800">2</text>
    <text x="232" y="184" fill="#fff" font-size="11" font-weight="600">Decisión</text>
    <circle cx="68" cy="170" r="34" fill="#1d7a4c"/>
    <text x="68" y="166" fill="#fff" font-size="20" font-weight="800">3</text>
    <text x="68" y="184" fill="#fff" font-size="11" font-weight="600">Resultado</text>
    <text x="150" y="116" fill="#172234" font-size="13" font-weight="700">Cada mes</text>
    <text x="150" y="134" fill="#6a7686" font-size="11">una reunión</text>
  </g>
</svg>`;

export const advisor = `
<svg viewBox="0 0 32 32" aria-hidden="true">
  <circle cx="16" cy="16" r="16" fill="#e8eef8"/>
  <circle cx="16" cy="13" r="6" fill="#1b365d"/>
  <path d="M6 28 a10 9 0 0 1 20 0 Z" fill="#1b365d"/>
  <path d="M14 20 l2 5 l2 -5 Z" fill="#b8202f"/>
</svg>`;

/** Franja con motivo textil andino (rombos escalonados), para la barra y el diario. */
export const andeanBand = `
<svg class="andean" viewBox="0 0 480 12" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <pattern id="tocapu" width="24" height="12" patternUnits="userSpaceOnUse">
      <rect width="24" height="12" fill="#b8202f"/>
      <path d="M12 1 L16 6 L12 11 L8 6 Z" fill="#f4f0e6"/>
      <path d="M12 3.5 L14 6 L12 8.5 L10 6 Z" fill="#1b365d"/>
      <rect x="0" y="5" width="4" height="2" fill="#f2b705"/>
      <rect x="20" y="5" width="4" height="2" fill="#f2b705"/>
    </pattern>
  </defs>
  <rect width="480" height="12" fill="url(#tocapu)"/>
</svg>`;
