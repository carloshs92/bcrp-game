import { openModal } from './modal.js';

export const TERMS = {
    informalidad: ['Informalidad', 'En 2025, el 70.2% de los trabajadores del Perú tenía un empleo informal: sin contrato, seguro ni pensión (INEI). Funciona como un colchón: cuando la economía se frena, mucha gente no queda desempleada, sino que pasa a trabajar en la informalidad. Un estudio del BCRP (2026) encuentra que eso también hace que la tasa de interés llegue con menos fuerza a una parte de la economía.'],
    comunicado: ['Comunicado (guía futura)', 'Junto con la tasa, el BCRP publica un comunicado que da pistas de sus próximos pasos. Si la gente le cree, las expectativas se mueven de inmediato, sin esperar a que la tasa haga efecto. Por eso el comunicado vale más cuanto más credibilidad tiene el BCR, y por eso contradecirlo después cuesta caro.'],
    bcrp: ['BCRP', 'Banco Central de Reserva del Perú. Es autónomo y la Constitución le da una finalidad: preservar la estabilidad monetaria, es decir, que el valor del sol no se erosione con la inflación.'],
    inflacion: ['Inflación', 'Aumento generalizado de los precios. Se mide como la variación del índice de precios al consumidor en los últimos 12 meses. Si es 3%, lo que costaba S/ 100 hace un año hoy cuesta S/ 103.'],
    meta: ['Rango meta', 'El BCRP busca una inflación de 2%, con una tolerancia de ±1 punto: entre 1% y 3%. A esto se le llama esquema de metas explícitas de inflación.'],
    tasa: ['Tasa de interés de referencia', 'La principal herramienta del BCRP. Es la tasa a la que se prestan dinero los bancos entre sí por un día. Cuando sube, los bancos encarecen sus créditos; cuando baja, los abaratan.'],
    pb: ['Punto básico', 'Una centésima de punto porcentual. Subir 25 puntos básicos es subir la tasa de 4.00% a 4.25%. El BCRP suele moverse de 25 en 25.'],
    neutral: ['Tasa neutral', 'Nivel de tasa que ni estimula ni enfría la economía. Depende de la inflación esperada: tasa neutral ≈ tasa real neutral (~2%) + expectativas de inflación.'],
    postura: ['Política contractiva / expansiva', 'Si la tasa está sobre la neutral, la política es contractiva: enfría la demanda y baja la inflación. Si está debajo, es expansiva: estimula la demanda y sube la inflación.'],
    rezago: ['Rezago', 'Una decisión de tasa tarda meses en afectar los créditos, el gasto y finalmente los precios. Por eso el BCRP decide mirando hacia adelante.'],
    pbi: ['Crecimiento del PBI', 'Cuánto crece la producción de la economía en un año. El Perú puede crecer de forma sostenible alrededor de 3% (su PBI potencial).'],
    brecha: ['Brecha del producto', 'Diferencia entre lo que la economía produce y lo que podría producir sin generar inflación. Si es positiva, la economía está "recalentada"; si es negativa, hay capacidad ociosa.'],
    expectativas: ['Expectativas de inflación', 'La inflación que la gente y las empresas esperan para los próximos 12 meses. Si esperan inflación alta, suben precios y piden más salario, y la inflación se cumple sola.'],
    credibilidad: ['Credibilidad', 'Qué tanto confía la gente en que el BCRP cumplirá su meta. Con alta credibilidad, las expectativas se quedan cerca del 2% aunque haya choques. Se pierde al quedar fuera de la meta o al actuar de forma errática.'],
    oferta: ['Choque de oferta', 'Subida de precios por causas ajenas a la demanda: una sequía, heladas, El Niño o el precio del petróleo. La tasa de interés tiene poco efecto sobre ellos.'],
    subyacente: ['Inflación subyacente (sin alimentos y energía)', 'La inflación sin los precios más volátiles. Muestra la tendencia de fondo y ayuda a distinguir choques pasajeros de presiones persistentes.'],
    autonomia: ['Autonomía y Congreso', 'La Constitución garantiza la autonomía del BCR: nadie puede ordenarle qué hacer con la tasa. Pero el Congreso tiene poder real sobre él: ratifica al presidente del BCR y elige a tres de sus siete directores, puede citarlo para que explique sus decisiones, aprueba leyes que le cambian las reglas (como la ley de 2021 que obligó a fijar topes a las tasas de interés) y puede removerlos, pero solo por falta grave.'],
    intervencion: ['Intervención cambiaria', 'Cuando el BCR vende o compra dólares para suavizar los movimientos del tipo de cambio. No busca fijar un precio, sino evitar saltos bruscos. Por ejemplo, desde setiembre de 2008 vendió US$ 5,695 millones y en el primer semestre de 2021 ofreció un récord de US$ 10,300 millones.'],
    reservas: ['Reservas Internacionales Netas (RIN)', 'Los dólares y otros activos que el BCR tiene para respaldar al sol y responder a crisis externas. No son una caja para gasto público: contra ellas hay depósitos en dólares de bancos y personas.'],
    dolarizacion: ['Dolarización', 'Cuando parte de los préstamos y ahorros están en dólares. Si una familia gana en soles pero debe en dólares, una subida del dólar le aumenta la deuda. Por eso el BCR cuida que el tipo de cambio no se mueva bruscamente.'],
    programa: ['Programa Monetario', 'El anuncio mensual en el que el Directorio del BCRP comunica su decisión sobre la tasa de referencia, mediante una Nota Informativa. Se publica según un calendario conocido de antemano.'],
    hiperinflacion: ['Hiperinflación', 'Inflación descontrolada, de más de 50% al mes. El Perú la vivió entre 1988 y 1990: en 1990 los precios subieron 7,650% en el año.'],
    emision: ['Emisión para financiar al Estado', 'Cuando el banco central imprime dinero para pagar los gastos del Gobierno. Hay más soles persiguiendo los mismos bienes, y los precios suben. Desde 1993 la Constitución le prohíbe al BCRP financiar al Tesoro Público.'],
    reactiva: ['Reactiva Perú', 'Programa de 2020: los bancos dieron créditos a empresas con garantía del Estado y el BCRP les dio la liquidez para hacerlo. Buscaba que las empresas pudieran pagar sueldos y proveedores durante la cuarentena.'],
    confianza: ['Confianza ciudadana', 'Lo que la gente piensa del BCR: sube cuando los precios están tranquilos y hay chamba, y baja con la inflación alta, los despidos o un dólar que salta. En el juego no mueve la economía, pero cuenta en tu puntaje y en lo que dicen las redes.'],
    niebla: ['La niebla de la proyección', 'Nadie sabe con exactitud qué pasará: la proyección es un rango, no un número. Con más credibilidad el rango se estrecha, porque la gente reacciona como el BCR espera. Y siempre puede aparecer un imprevisto que nadie veía venir.'],
    acciones: ['Dos acciones por turno', 'Cada turno puedes usar hasta dos palancas: la tasa, los dólares, el discurso o el encaje. No hacer nada también es una decisión: ahorras reservas y no te comprometes, pero la economía sigue moviéndose sin ti.'],
    encaje: ['Encaje bancario', 'La parte de los depósitos que los bancos deben guardar en el BCR. Si sube, los bancos prestan menos; si baja, prestan más. Es la herramienta más peruana del BCR: la usó con fuerza en 2008 y para desdolarizar el crédito desde 2013.'],
    directorio: ['Directorio', 'Órgano que dirige el BCRP. Se reúne una vez al mes, según un calendario publicado, para decidir la tasa de referencia y la anuncia en un comunicado.']
};

export function openGlossary(focus) {
    const items = Object.entries(TERMS).map(([key, [term, def]]) =>
        `<dt id="term-${key}" class="${key === focus ? 'focus' : ''}">${term}</dt><dd>${def}</dd>`
    ).join('');
    const modal = openModal(`
        <h2>Glosario</h2>
        <p class="lead">Conceptos que usa el BCRP, explicados en simple.</p>
        <dl class="glossary">${items}</dl>
        <div class="modal-actions"><button class="btn btn-primary" data-close>Cerrar</button></div>
    `);
    if (focus) modal.querySelector(`#term-${focus}`)?.scrollIntoView({ block: 'center' });
}
