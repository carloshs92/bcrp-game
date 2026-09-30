import { building, targetBand, transmission, cycle } from './art.js';

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
          <button class="btn btn-ghost" data-intro>¿Qué es el BCR? Ver introducción</button>
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

const SLIDES = [
    {
        art: building,
        eyebrow: 'Tu rol',
        title: 'Eres parte del Directorio del BCRP',
        body: `<p>El Banco Central de Reserva del Perú es una institución autónoma. La Constitución le encarga una sola finalidad: <strong>preservar la estabilidad monetaria</strong>.</p>
               <p>En la práctica, eso significa cuidar que los precios no suban demasiado rápido, para que tu sueldo y tus ahorros en soles no pierdan valor.</p>`
    },
    {
        art: targetBand,
        eyebrow: 'Tu misión',
        title: 'Mantén la inflación entre 1% y 3%',
        body: `<p>La <strong>inflación</strong> mide cuánto suben los precios en un año. El BCRP tiene una <strong>meta de 2%</strong>, con un rango de tolerancia de 1% a 3%.</p>
               <p>Si la inflación se sale del rango, la gente deja de confiar en el sol y el BCRP pierde <strong>credibilidad</strong>.</p>`
    },
    {
        art: transmission,
        eyebrow: 'Tu herramienta',
        title: 'La tasa de interés de referencia',
        body: `<p>Tú no fijas los precios. Mueves la <strong>tasa de referencia</strong>, y eso se transmite por una cadena de efectos.</p>
               <ul><li><strong>Subir la tasa</strong> enfría la economía y baja la inflación.</li>
               <li><strong>Bajar la tasa</strong> estimula la economía y sube la inflación.</li></ul>
               <p>Ojo: el efecto tarda <strong>varios meses</strong> en llegar a los precios, y si subes demasiado la economía puede caer en recesión.</p>`
    },
    {
        art: cycle,
        eyebrow: 'Cómo se juega',
        title: 'El Programa Monetario',
        body: `<p>El Directorio del BCRP se reúne cada mes y anuncia su decisión en el <strong>Programa Monetario</strong>. En el juego, cada turno resume un trimestre:</p>
               <ul><li><strong>Informe:</strong> una noticia, el debate de tus asesores y la proyección.</li>
               <li><strong>Anuncio:</strong> sube, baja o mantén la tasa.</li>
               <li><strong>Resultado:</strong> el diario te cuenta qué pasó… y a veces llega un imprevisto.</li></ul>`
    }
];

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
              <div class="eyebrow">${s.eyebrow}</div>
              <h2>${s.title}</h2>
              ${s.body}
              <div class="intro-nav">
                <div class="dots">${SLIDES.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div>
                <div>
                  ${i > 0 ? '<button class="btn btn-ghost" data-back>Atrás</button>' : '<button class="btn btn-ghost" data-skip>Saltar</button>'}
                  <button class="btn btn-primary" data-next>${last ? 'Empezar' : 'Siguiente'}</button>
                </div>
              </div>
            </div>
          </section>
        </main>`;
        root.querySelector('[data-next]').addEventListener('click', next);
        root.querySelector('[data-back]')?.addEventListener('click', () => { i -= 1; draw(); });
        root.querySelector('[data-skip]')?.addEventListener('click', finish);
        root.querySelector('[data-next]').focus();
    };
    const next = () => {
        if (i === SLIDES.length - 1) return finish();
        i += 1;
        draw();
    };
    const onKey = e => {
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
