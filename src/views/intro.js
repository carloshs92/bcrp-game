import { building, transmission, cycle, money, shield } from './art.js';

export function renderTitle(root, { story, record, settings, onTutorial, onStory, onFree, onIntro, onSettings }) {
    root.innerHTML = `
    <main class="title-screen">
      <div class="title-card">
        ${building}
        <div class="eyebrow">Un juego sobre el Banco Central de Reserva del Perú</div>
        <h1>Guardián de la Estabilidad</h1>
        <p>Siéntate en el Directorio del BCR. Enfrenta la hiperinflación de 1990, la crisis de 2008, El Niño costero, la pandemia y la inflación de 2022. ¿Harías lo mismo que el BCRP?</p>
        <div class="modes">
          <button class="mode ${story.tutorialDone ? '' : 'primary'}" data-tutorial>
            <strong>Tutorial</strong><small>3 turnos guiados · 5 minutos</small>${story.tutorialDone ? '<span class="pill good">Completado</span>' : '<span class="pill info">Empieza aquí</span>'}
          </button>
          <button class="mode ${story.tutorialDone ? 'primary' : ''}" data-story>
            <strong>Modo Historia</strong><small>5 capítulos de la historia monetaria del Perú</small>
          </button>
          <button class="mode" data-free>
            <strong>Modo Libre</strong><small>Un mandato de 3 años con eventos al azar</small>
          </button>
        </div>
        ${record.played ? `<p class="record">Modo libre: ${record.played} mandatos · ratificado ${record.reappointed} · mejor puntaje ${record.bestScore}</p>` : ''}
        <div class="title-links">
          <button class="btn btn-ghost" data-settings>Configuración · Dificultad: ${settings.name}</button>
          <button class="btn btn-ghost" data-intro>¿Qué es el BCR?</button>
        </div>
        <p class="disclaimer">Juego educativo independiente, no oficial. Es una simplificación: la política monetaria real considera muchos más factores. Los personajes son ficticios; los datos históricos provienen de BCRPData.</p>
      </div>
    </main>`;
    root.querySelector('[data-tutorial]').addEventListener('click', onTutorial);
    root.querySelector('[data-story]').addEventListener('click', onStory);
    root.querySelector('[data-free]').addEventListener('click', onFree);
    root.querySelector('[data-intro]').addEventListener('click', onIntro);
    root.querySelector('[data-settings]').addEventListener('click', onSettings);
    root.querySelector('.mode.primary')?.focus();
}

const card = (n, title, text) => `<div class="fn-card"><span class="fn-n">${n}</span><strong>${title}</strong><small>${text}</small></div>`;
const no = (title, text) => `<li><span class="no-x">✕</span><div><strong>${title}</strong><small>${text}</small></div></li>`;

/**
 * Introducción "¿Qué es el BCR?": una idea por lámina. `art` es el visual (SVG o HTML);
 * `interactive` enlaza comportamiento después de dibujar (la calculadora de inflación).
 */
const SLIDES = [
    {
        art: building,
        eyebrow: '¿Qué es el BCR?',
        title: 'Hay un banco en el que nunca vas a abrir una cuenta',
        body: `<p>Es el <strong>Banco Central de Reserva del Perú</strong>, el BCR. No atiende a personas: es el banco de los bancos y del país entero.</p>
               <p class="fact">Existe desde 1922 y es uno de los bancos centrales más antiguos de América Latina.</p>`
    },
    {
        art: money,
        eyebrow: 'Dato',
        title: 'Cada billete y cada moneda del Perú salen de ahí',
        body: `<p>La Constitución dice que emitir billetes y monedas es tarea exclusiva del Estado, y que la hace <strong>a través del BCR</strong>.</p>
               <p class="fact">Sí: hasta la moneda de un sol que tienes en el bolsillo.</p>`
    },
    {
        art: `<div class="calc">
                <div class="calc-label">Si la inflación fuera de…</div>
                <div class="calc-rate num" data-calc-rate>2%</div>
                <input type="range" min="0" max="100" value="18" data-calc aria-label="Inflación anual">
                <div class="calc-presets">
                  <button data-preset="2">2% <small>la meta</small></button>
                  <button data-preset="8.81">8.8% <small>2022</small></button>
                  <button data-preset="7650">7,650% <small>1990</small></button>
                </div>
                <div class="calc-out">
                  <div><small>Un menú de S/ 10 costaría en un año</small><strong class="num" data-calc-menu>S/ 10.20</strong></div>
                  <div><small>Tus ahorros de S/ 1,000 alcanzarían para</small><strong class="num" data-calc-save>S/ 980</strong></div>
                </div>
              </div>`,
        eyebrow: 'Su misión',
        title: 'Que tu sol no pierda valor',
        body: `<p>Esa es la única finalidad que le da la Constitución: <strong>preservar la estabilidad monetaria</strong>.</p>
               <p>Cuando los precios suben muy rápido (eso es la <strong>inflación</strong>), tu sueldo y tus ahorros valen menos. Mueve el control y mira qué pasa.</p>`,
        interactive: bindCalc
    },
    {
        art: `<div class="fn-grid">
                ${card(1, 'Regula la moneda y el crédito', 'Mueve la tasa de interés para que el dinero no se desborde ni se congele.')}
                ${card(2, 'Cuida las reservas internacionales', 'Los dólares que protegen al país en las crisis.')}
                ${card(3, 'Emite billetes y monedas', 'Y cuida que no se falsifiquen.')}
                ${card(4, 'Informa al país', 'Publica cómo están las finanzas nacionales, con datos abiertos a todos.')}
              </div>`,
        eyebrow: 'Sus tareas',
        title: 'Cuatro trabajos, según la Constitución',
        body: `<p>El artículo 84 de la Constitución le encarga estas funciones al BCR.</p>
               <p class="fact">Cada mes, su Directorio anuncia su decisión sobre la tasa en el <strong>Programa Monetario</strong>.</p>`
    },
    {
        art: `<ul class="no-list">
                ${no('No cobra impuestos', 'Eso lo hace la SUNAT.')}
                ${no('No decide en qué gasta el Estado', 'Eso lo deciden el MEF y el Congreso.')}
                ${no('No le presta al Gobierno', 'La Constitución se lo prohíbe. Así terminó la hiperinflación.')}
                ${no('No pone el precio de las cosas', 'Solo influye en el costo del dinero.')}
              </ul>`,
        eyebrow: 'Ojo',
        title: 'Lo que el BCR NO hace',
        body: `<p>Mucha gente cree que el BCR puede arreglarlo todo. No es así: tiene una tarea y un puñado de herramientas.</p>
               <p class="fact">En 2024 unos congresistas le preguntaron qué hacía por el empleo y los salarios. No es su trabajo.</p>`
    },
    {
        art: shield,
        eyebrow: 'Autonomía',
        title: 'Nadie le da órdenes… pero todos opinan',
        body: `<p>El BCR es <strong>autónomo</strong>: ni el Presidente ni el Congreso pueden decirle qué hacer con la tasa.</p>
               <p>Pero el Congreso ratifica a su presidente, elige a 3 de sus 7 directores, puede citarlo y aprobar leyes que le cambian las reglas.</p>
               <p class="fact">Prepárate: los congresistas van a molestar. Mucho.</p>`
    },
    {
        art: transmission,
        eyebrow: 'Su herramienta',
        title: 'La tasa de interés de referencia',
        body: `<p>El BCR no fija los precios: mueve la <strong>tasa de referencia</strong>, y eso se transmite en cadena.</p>
               <ul><li><strong>Subir la tasa</strong> enfría la economía y baja la inflación.</li>
               <li><strong>Bajar la tasa</strong> la estimula y sube la inflación.</li></ul>
               <p class="fact">El efecto tarda meses en llegar. Por eso hay que decidir mirando hacia adelante.</p>`
    },
    {
        art: cycle,
        eyebrow: 'Tu papel',
        title: 'Y ahora… tú diriges el BCR',
        body: `<p>Cada turno te reúnes con el Directorio y decides: <strong>subir, bajar o mantener la tasa</strong>.</p>
               <p><strong>Tu objetivo:</strong> que la inflación quede entre 1% y 3%, sin hundir la economía, sin perder la confianza de la gente… y aguantando al Congreso.</p>
               <p class="fact">Si lo logras, el Directorio es ratificado. Si no, te reemplazan.</p>`
    }
];

/** Calculadora de inflación: escala logarítmica de 0% a 7,650% anual. */
function bindCalc(root) {
    const input = root.querySelector('[data-calc]');
    if (!input) return;
    const MAX = 7650;
    const fromSlider = v => v <= 0 ? 0 : Math.round(10 ** (Math.log10(MAX + 1) * v / 100) - 1 + 0) ;
    const toSlider = r => Math.round(100 * Math.log10(r + 1) / Math.log10(MAX + 1));
    const fmt = v => v >= 1000 ? Math.round(v).toLocaleString('es-PE') : v.toFixed(2);
    const show = rate => {
        root.querySelector('[data-calc-rate]').textContent = `${rate >= 100 ? Math.round(rate).toLocaleString('es-PE') : rate.toFixed(rate < 10 ? 1 : 0)}%`;
        root.querySelector('[data-calc-menu]').textContent = `S/ ${fmt(10 * (1 + rate / 100))}`;
        root.querySelector('[data-calc-save]').textContent = `S/ ${fmt(1000 / (1 + rate / 100))}`;
        root.querySelector('.calc').dataset.level = rate <= 3 ? 'ok' : rate <= 10 ? 'warn' : 'bad';
    };
    input.addEventListener('input', () => show(fromSlider(Number(input.value))));
    root.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => {
        const r = Number(b.dataset.preset);
        input.value = toSlider(r);
        show(r);
    }));
    show(2);
    input.value = toSlider(2);
}

export function renderIntro(root, { onDone }) {
    let i = 0;
    const draw = () => {
        const s = SLIDES[i];
        const last = i === SLIDES.length - 1;
        root.innerHTML = `
        <main class="intro">
          <section class="intro-card">
            <div class="intro-art">${s.art}</div>
            <div class="intro-body">
              <div class="eyebrow">${s.eyebrow} · ${i + 1}/${SLIDES.length}</div>
              <h2>${s.title}</h2>
              ${s.body}
              <div class="intro-nav">
                <div class="dots">${SLIDES.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div>
                <div>
                  ${i > 0 ? '<button class="btn btn-ghost" data-back>Atrás</button>' : '<button class="btn btn-ghost" data-skip>Saltar</button>'}
                  <button class="btn btn-primary" data-next>${last ? '¡A jugar!' : 'Siguiente'}</button>
                </div>
              </div>
            </div>
          </section>
        </main>`;
        root.querySelector('[data-next]').addEventListener('click', next);
        root.querySelector('[data-back]')?.addEventListener('click', () => { i -= 1; draw(); });
        root.querySelector('[data-skip]')?.addEventListener('click', finish);
        s.interactive?.(root);
        root.querySelector('[data-next]').focus();
    };
    const next = () => {
        if (i === SLIDES.length - 1) return finish();
        i += 1;
        draw();
    };
    const onKey = e => {
        if (e.target.matches?.('input')) return; // el control de la calculadora usa las flechas
        if (e.key === 'ArrowRight' || (e.key === 'Enter' && !e.target.closest('button'))) next();
        if (e.key === 'ArrowLeft' && i > 0) { i -= 1; draw(); }
    };
    const finish = () => {
        document.removeEventListener('keydown', onKey);
        onDone();
    };
    document.addEventListener('keydown', onKey);
    draw();
}
