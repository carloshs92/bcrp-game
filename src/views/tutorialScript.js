/**
 * Guion del tutorial sobre la mesa de mando. Claves = índice del turno (mes).
 * briefing: al empezar el mes · surprise: al aparecer el imprevisto · result: con el diario abierto.
 * Pocas palabras por paso: la lección sale de jugar.
 */

const pct = (v, d = 1) => `${v.toFixed(d)}%`;

export const TUTORIAL_COACH = {
    briefing: {
        0: m => [
            { target: null, text: 'Desde hoy presides el BCR. Cada turno es <strong>un mes</strong>. Te acompaño en los primeros cuatro.' },
            { target: '#hud', text: `Tus termómetros. El principal: la <strong>inflación</strong>, hoy en ${pct(m.state.inflation)}. Tu meta es entre 1% y 3%. La <strong>credibilidad</strong> y las <strong>reservas</strong> son recursos: si se acaban, pierdes.` },
            { target: '#shock', text: 'Cada mes llega una <strong>carta</strong>. Esta dice que la gente gasta mucho a crédito: eso empuja los precios.' },
            { target: '#cast', text: 'Ellos sentirán cada decisión: Doña Rosa mira los precios, Kevin su préstamo, Valeria el dólar y el Congresista Pérez… todo lo que hagas.' },
            { target: '#levers', text: `Tienes <strong>2 acciones por mes</strong>. Prueba subir la tasa (+0.25 o +0.50). Mira cómo se gasta un punto de acción.` },
            { target: '#projection', text: 'La proyección no es un número: es un <strong>rango</strong>. La tasa tarda 2 a 3 meses en hacer efecto. Cuando estés listo, presiona <strong>Anunciar</strong>.' }
        ],
        1: m => [
            { target: '#shock', text: 'El ministro te pide bajar la tasa. El BCR es <strong>autónomo</strong>: nadie le puede ordenar. Pero mira al Congresista Pérez: ignorarlo sube su enojo.' },
            { target: '#levers', text: `Usa tu segunda acción: el <strong>discurso</strong>. Uno firme mueve las expectativas al instante, más cuanto más creíble seas (hoy ${Math.round(m.state.credibility)}). Pero luego tendrás que cumplirlo.` }
        ],
        2: m => [
            ...(m.consequences.length ? [{ target: '#consequence', text: 'Una <strong>consecuencia</strong>: lo que hiciste hace unos meses te alcanza. En la vida real, la política monetaria siempre llega tarde.' }] : []),
            { target: '#shock', text: 'Doña Rosa sufre por el limón. Es un <strong>choque de oferta</strong>: la tasa no hace llover. ¿Vas a subirla de golpe o vas a mirar más allá?' }
        ],
        3: () => [
            { target: '#levers', text: 'Último mes. El dólar se dispara: puedes <strong>vender dólares</strong>, pero las reservas no se reponen solas. Tu objetivo: terminar con la inflación en 3.5% o menos.' }
        ]
    },
    surprise: {
        1: () => [
            { target: '.breaking', text: '¡Un <strong>imprevisto</strong>! Llega después de anunciar, así que la proyección no podía verlo. A veces la decisión correcta igual falla.' }
        ]
    },
    result: {
        0: rec => [
            { target: '.reveal', text: `Proyectabas ${pct(rec.projected)} y resultó ${pct(rec.state.inflation)}. La realidad nunca sale exacta.` },
            { target: '.lesson', text: 'Cada carta deja una lección. La <strong>tentación</strong> casi nunca es la mejor respuesta.' }
        ]
    }
};
