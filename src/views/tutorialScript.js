/**
 * Guion del tutorial sobre la pantalla de juego. Claves = índice del turno.
 * briefing: al mostrar el turno · surprise: al aparecer el imprevisto · result: con el diario abierto.
 */

const pct = (v, d = 1) => `${v.toFixed(d)}%`;

export const TUTORIAL_COACH = {
    briefing: {
        0: m => [
            { target: null, text: 'Te damos la bienvenida al Directorio del BCR. Cada turno es un trimestre: tres Programas Monetarios. Te acompaño en tus primeros tres.' },
            { target: '.meters', text: `Estos son tus cuatro medidores. El principal es la <strong>inflación</strong>: hoy está en ${pct(m.state.inflation)} y la meta es entre 1% y 3%. Pero ojo con los otros tres: si alguno se va al extremo, pierdes.` },
            { target: '.turn-nav', text: 'Cada turno tiene <strong>cuatro secciones</strong>, en el orden en que piensa el Directorio: qué pasó, qué te piden, qué opinan tus asesores y qué decides. Puedes saltar entre ellas con un clic o con las teclas 1 a 4.' },
            { target: '#event', text: 'Cada turno alguien te trae una noticia. Aquí, Jessica de Gamarra cuenta que la gente gasta mucho a crédito: eso empuja los precios hacia arriba.' },
            { target: '#debate', text: 'Tus dos asesores opinan distinto: el <strong>halcón</strong> teme a la inflación y la <strong>paloma</strong> al desempleo. Ninguno acierta siempre.' },
            { target: '#projection', text: 'Este es tu mejor aliado: la <strong>proyección</strong>. Cuando elijas una tasa, el abanico te muestra hacia dónde iría la inflación en un año.' },
            { target: '#decision', text: 'Prueba subiendo la tasa (+0.25 o +0.50) y mira cómo baja el abanico. Luego presiona <strong>Anunciar decisión</strong>.' }
        ],
        1: m => [
            { target: '#event', text: 'Ahora el ministro te pide bajar la tasa. El BCR es <strong>autónomo</strong>: nadie le puede ordenar qué hacer. Pero ignorar el pedido sube la presión política.' },
            { target: '#congress-card', text: `La presión está en ${Math.round(m.pressure)}. Las alzas de tasa la suben; si llega a 100, el Congreso pide tu salida. Decide pensando en la inflación, no en quedar bien.` }
        ],
        2: () => [
            { target: '#projection', text: 'Último turno del tutorial. Tu objetivo: terminar con la inflación en 3.3% o menos. Usa la proyección para decidir.' }
        ]
    },
    surprise: {
        1: () => [
            { target: '.breaking', text: '¡Un <strong>imprevisto</strong>! Aparecen después de anunciar tu decisión, así que la proyección no podía verlos. En el juego, como en la realidad, siempre decides con información incompleta.' }
        ]
    },
    result: {
        0: rec => [
            { target: '.reveal', text: `Proyectabas ${pct(rec.projected)} y resultó ${pct(rec.state.inflation)}. La realidad casi nunca sale exacta: hay factores que nadie ve venir.` },
            { target: '.ptabs-nav', text: 'El diario tiene pestañas: <strong>La gente</strong> te cuenta cómo lo vivió cada sector, <strong>Regiones</strong> muestra el mapa del Perú y <strong>¿Por qué?</strong> explica qué movió la inflación. Recuerda: la tasa tarda en hacer efecto.' }
        ]
    }
};
