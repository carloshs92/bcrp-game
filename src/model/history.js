/**
 * Modo Historia: tutorial + capítulos basados en episodios reales del BCRP.
 *
 * Los datos reales (tasa de referencia e inflación a 12 meses, fin de cada trimestre)
 * vienen de BCRPData: series PD04722MM (tasa) y PN01273PM (inflación Lima Metropolitana).
 * La inflación mensual de 1990–1991 viene de la serie PN01271PM.
 * Los choques de cada capítulo están calibrados para que la trayectoria real del BCRP
 * produzca un resultado parecido al histórico (ver test/history.test.js).
 *
 * Los personajes son ficticios; los hechos narrados en `context` y `reality` son reales.
 */

const ev = (id, who, title, quote, shock = {}, extra = {}) => ({ id, who, title, quote, shock, kind: extra.kind ?? 'externo', asks: extra.asks ?? null, pressure: extra.pressure ?? 0 });

export const TUTORIAL = {
    id: 'tutorial',
    kind: 'rate',
    title: 'Tutorial: tu primer Programa Monetario',
    year: 'Hoy',
    turns: 3,
    labels: ['T1', 'T2', 'T3'],
    initial: { rate: 4.25, outputGap: 0.8, core: 2.8, supply: 0.2, expectations: 2.5, credibility: 80 },
    pressure: 15,
    script: [
        ev('t1', 'gamarra', 'Gamarra no para de vender', '¡Estamos vendiendo como en campaña navideña! La gente saca préstamos para todo, caserito.', { demand: 0.9 }, { kind: 'demanda' }),
        ev('t2', 'ministro', 'El MEF quiere reactivar', 'Una tasa más baja ayudaría a que la inversión despegue. ¿Qué dice el BCR?', { demand: 0.3 }, { kind: 'politica', asks: 'bajar', pressure: 8 }),
        ev('t3', 'analista', 'Un trimestre tranquilo', 'Sin mayores sobresaltos. Mira si tus decisiones anteriores están funcionando.', {}, { kind: 'calma' })
    ],
    // El segundo turno siempre trae un imprevisto: así el jugador lo conoce en el tutorial.
    surprises: { 1: 'huaico-central' },
    goals: [{ type: 'finalInflationMax', value: 3.3, label: 'Terminar con la inflación en 3.3% o menos' }]
};

export const CHAPTERS = [
    {
        id: 'hiper-1990',
        kind: 'hyper',
        number: 1,
        year: '1990',
        title: 'La hiperinflación y el Fujishock',
        concept: 'No financiar al fisco con emisión',
        context: [
            'En 1990 la inflación anual del Perú llegó a 7,650%. Los precios cambiaban de un día para otro y el inti ya no valía casi nada.',
            'El 8 de agosto de 1990, el ministro Juan Carlos Hurtado Miller anunció el "Fujishock": se liberaron los precios y se eliminaron subsidios. La gasolina subió más de 3,000%. Ese mes la inflación fue de 397%.',
            'Ahora te toca a ti. La causa de fondo de la hiperinflación era que el banco central imprimía dinero para pagar los gastos del Estado. ¿Vas a seguir haciéndolo?'
        ],
        reality: 'El gobierno creó un Comité de Caja: el Estado solo gastaría lo que recaudara, sin pedir emisión al banco central. La inflación mensual bajó de 397% en agosto de 1990 a 9.6% en octubre, aunque tuvo repuntes. El costo social fue muy alto: el ajuste se aplicó sin activar antes programas sociales de emergencia, la pobreza aumentó y el consumo en Lima cayó alrededor de 25%. Los comedores populares, los clubes de madres y el Vaso de Leche fueron la primera línea contra el hambre, mientras el Programa de Compensación Social tardaba en llegar. En 1991 la inflación anual fue de 139%, y el 1 de julio de 1991 empezó a circular el Nuevo Sol, equivalente a un millón de intis.',
        labels: ['Set 1990', 'Oct 1990', 'Nov 1990', 'Dic 1990', 'Ene 1991', 'Feb 1991'],
        realMonthly: [13.77, 9.62, 5.93, 23.73, 17.83, 9.42],
        sources: [
            { label: 'BCRPData – IPC Lima, variación mensual (PN01271PM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01271PM/html' },
            { label: 'Wikipedia – Fujishock', url: 'https://es.wikipedia.org/wiki/Fujishock' },
            { label: 'LUM – 1990 (Anexo 1 del Informe Final de la CVR)', url: 'https://lum.cultura.pe/cdi/contexto-nacional/1990-fuente-anexo-1-del-informe-final-de-la-comision-de-la-verdad-y' }
        ]
    },
    {
        id: 'crisis-2008',
        kind: 'rate',
        number: 2,
        year: '2008',
        title: 'La crisis financiera global',
        concept: 'Subir contra la inflación y luego bajar rápido',
        context: [
            'Enero de 2008. El Perú crece a más de 8% al año y el mundo vive un boom de alimentos y petróleo. La inflación ya supera la meta de 2%.',
            'Lo que nadie sabe todavía: en setiembre quebrará Lehman Brothers en Nueva York y el mundo entrará en la peor crisis financiera desde 1929.'
        ],
        reality: 'El BCRP subió la tasa de 5.25% a 6.50% entre enero y setiembre de 2008 para frenar la inflación, que llegó a 6.65% en diciembre. Cuando la crisis golpeó, la mantuvo y luego la recortó de 6.50% a 1.25% entre febrero y agosto de 2009. La inflación cayó a 0.25% a fines de 2009 y el Perú evitó la recesión.',
        turns: 8,
        labels: ['T1 2008', 'T2 2008', 'T3 2008', 'T4 2008', 'T1 2009', 'T2 2009', 'T3 2009', 'T4 2009'],
        params: { potentialGrowth: 6.5, credPenalty: 0.25, bigMove: 1 },
        hikePressure: 2,
        monthlyMeetings: true,
        moves: [-3, -2, -1.75, -1, -0.5, -0.25, 0, 0.25, 0.5, 0.75],
        initial: { rate: 5.0, outputGap: 2.5, core: 3.0, supply: 0.9, expectations: 2.8, credibility: 80 },
        pressure: 15,
        limits: { inflation: 9, growth: -6 },
        // Tipo de cambio promedio de dic. 2007 (BCRPData PN01234PM) y RIN aprox. en US$ (PN00026MM ÷ tipo de cambio).
        fx: { rate: 2.981, reserves: 27.9 },
        script: [
            ev('08a', 'caserita', 'El precio del pan y el aceite se dispara', 'El trigo y el aceite están carísimos en el mundo, hijito. Todo sube en el mercado.', { supply: 1.1, demand: 1.4 }, { kind: 'oferta', asks: 'subir' }),
            ev('08b', 'chofer', 'El petróleo llega a récords', 'El barril está por encima de 100 dólares. Los pasajes suben otra vez.', { supply: 0.9, demand: 1.2 }, { kind: 'oferta' }),
            ev('08c', 'gremio', 'La economía crece a todo vapor', 'Estamos creciendo como nunca. Hay inversión por todos lados, no hay que frenar.', { supply: 1.0, demand: 1.0 }, { kind: 'demanda', asks: 'bajar', pressure: 8 }),
            ev('08d', 'analista', 'Quiebra Lehman Brothers', 'Pánico en Wall Street. Los créditos internacionales se congelan y el cobre se desploma.', { demand: -3.8, supply: 1.2, credibility: -3 }, { kind: 'externo' }),
            ev('09a', 'minero', 'Caen las exportaciones', 'Nuestros compradores en el mundo cancelaron pedidos. Estamos parando turnos.', { demand: -3.2, supply: -1.5 }, { kind: 'externo', asks: 'bajar', pressure: 10 }),
            ev('09b', 'gamarra', 'Las ventas se enfrían', 'La gente ya no compra como antes. Los bancos están más exigentes con el crédito.', { demand: -1.2, supply: -0.9 }, { kind: 'demanda', asks: 'bajar', pressure: 8 }),
            ev('09c', 'analista', 'Los mercados se estabilizan', 'Lo peor parece haber pasado. China vuelve a comprar metales.', { demand: 0.2, supply: -0.6 }, { kind: 'externo' }),
            ev('09d', 'gremio', 'Vuelve la confianza', 'Los pedidos regresan poco a poco. Si se mantiene el crédito barato, 2010 será un buen año.', { demand: 0.9, supply: 0.2 }, { kind: 'demanda' })
        ],
        surpriseChance: 0.25,
        goals: [
            { type: 'maxInflation', value: 7.5 },
            { type: 'minGrowth', value: 0, label: 'Evitar la recesión: que el PBI no caiga' },
            { type: 'finalInflationMax', value: 3 },
            { type: 'finalInflationMin', value: 0, label: 'Evitar la deflación: terminar con inflación sobre 0%' }
        ],
        realPath: {
            rate: [5.25, 5.75, 6.50, 6.50, 6.00, 3.00, 1.25, 1.25],
            inflation: [5.55, 5.71, 6.22, 6.65, 4.78, 3.06, 1.20, 0.25],
            // Tipo de cambio promedio del último mes de cada trimestre (PN01234PM).
            fxRate: [2.811, 2.892, 2.966, 3.114, 3.175, 2.990, 2.910, 2.877],
            // Ventas netas aproximadas en US$ miles de millones (el BCRP vendió US$ 5,695 millones desde
            // set. 2008); se usan solo para simular al BCRP real en el puntaje, no se muestran.
            fxSales: [0, 0, 1.5, 3, 1.5, 0, 0, 0]
        },
        sources: [
            { label: 'BCRPData – Tasa de referencia (PD04722MM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD04722MM/html' },
            { label: 'BCRPData – Inflación 12 meses (PN01273PM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01273PM/html' }
        ]
    },
    {
        id: 'nino-2017',
        kind: 'rate',
        number: 3,
        year: '2017',
        title: 'El Niño costero',
        concept: 'No sobrerreaccionar a un choque de oferta',
        context: [
            'Enero de 2017. El mar frente a la costa norte se calienta de golpe. Entre enero y abril, lluvias torrenciales y huaicos golpean Piura, Lambayeque, La Libertad y Lima.',
            'Los alimentos se disparan: en marzo el IPC de Lima subió 1.30% en un solo mes, algo que no pasaba desde El Niño de 1998. ¿Subirías la tasa para frenarlo?'
        ],
        reality: 'El BCRP entendió que era un choque de oferta pasajero: la inflación llegó a 3.97% en marzo, pero no subió la tasa. Al contrario, con la economía debilitada la bajó de 4.25% a 3.25% durante el año. La inflación terminó 2017 en 1.36%.',
        turns: 4,
        labels: ['T1 2017', 'T2 2017', 'T3 2017', 'T4 2017'],
        params: { potentialGrowth: 3.5 },
        monthlyMeetings: true,
        initial: { rate: 4.25, outputGap: -0.6, core: 2.9, supply: 0.3, expectations: 2.6, credibility: 82 },
        pressure: 20,
        script: [
            ev('17a', 'caserita', 'El limón y la cebolla por las nubes', 'Los huaicos cortaron las carreteras del norte. El limón está a quince soles el kilo, hijito.', { supply: 2.1, demand: -0.8 }, { kind: 'oferta', asks: 'subir' }),
            ev('17b', 'agricultor', 'Las carreteras se reabren', 'Ya estamos sacando la cosecha otra vez. Los precios empiezan a bajar.', { supply: -1.5, demand: -0.6 }, { kind: 'oferta' }),
            ev('17c', 'ministro', 'Arranca la Reconstrucción con Cambios', 'El Estado invertirá en reconstruir el norte, pero las obras tardan en arrancar.', { supply: -0.2, demand: -0.3 }, { kind: 'politica', asks: 'bajar', pressure: 8 }),
            ev('17d', 'analista', 'La economía busca recuperarse', 'El consumo sigue débil y la inversión privada no despega.', { supply: -0.5, demand: -0.2 }, { kind: 'demanda' })
        ],
        surpriseChance: 0.2,
        goals: [
            { type: 'finalInBand' },
            { type: 'finalGrowthMin', value: 1.5, label: 'No ahogar la economía: terminar con el PBI creciendo sobre 1.5%' }
        ],
        realPath: {
            rate: [4.25, 4.00, 3.50, 3.25],
            inflation: [3.97, 2.73, 2.94, 1.36]
        },
        sources: [
            { label: 'INEI – Precios al consumidor en Lima subieron 1.30% (marzo 2017)', url: 'https://m.inei.gob.pe/prensa/noticias/precios-al-consumidor-en-lima-metropolitana-se-incrementaron-en-130-9655/' },
            { label: 'BCRPData – Tasa de referencia (PD04722MM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD04722MM/html' },
            { label: 'BCRPData – Inflación 12 meses (PN01273PM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01273PM/html' }
        ]
    },
    {
        id: 'pandemia-2020',
        kind: 'rate',
        number: 4,
        year: '2020',
        title: 'La pandemia',
        concept: 'Cuando la tasa llega a su piso',
        context: [
            'Marzo de 2020. El Perú declara el estado de emergencia y una de las cuarentenas más estrictas del mundo. Las calles se vacían, los negocios cierran.',
            'La tasa está en 2.25%. Puedes bajarla, pero no por debajo de 0.25%. Y tienes una herramienta nueva: Reactiva Perú, créditos a empresas con garantía del Estado financiados por el BCRP.'
        ],
        reality: 'El BCRP bajó la tasa de 2.25% a 1.25% en marzo y a 0.25%, su mínimo histórico, en abril de 2020. Con Reactiva Perú inyectó liquidez con garantía del Estado por hasta S/ 60 mil millones. La economía cayó alrededor de 11% en 2020, pero la inflación se mantuvo dentro del rango meta todo el año.',
        turns: 4,
        labels: ['T1 2020', 'T2 2020', 'T3 2020', 'T4 2020'],
        params: { potentialGrowth: 2.5, gapToCore: 0.015, gapPersistence: 0.45, bigMove: 1 },
        monthlyMeetings: true,
        moves: [-1, -0.5, -0.25, 0, 0.25, 0.5],
        initial: { rate: 2.25, outputGap: -0.3, core: 2.1, supply: -0.2, expectations: 2.1, credibility: 85 },
        pressure: 15,
        limits: { growth: -40, credibility: 15 },
        tools: [{
            id: 'reactiva', name: 'Reactiva Perú', uses: 1,
            desc: 'Créditos para que las empresas paguen sueldos y proveedores, con garantía del Estado. Sostiene la demanda durante 2 trimestres.',
            effect: { shock: { demand: 4.5 }, turns: 2, pressure: -10 }
        }],
        script: [
            ev('20a', 'prensa', 'Estado de emergencia y cuarentena', 'Se cierran fronteras, colegios y negocios. Solo se puede salir a comprar alimentos.', { demand: -6.0, supply: 0.2 }, { kind: 'demanda', asks: 'bajar', pressure: 10 }),
            ev('20b', 'gamarra', 'Gamarra con las persianas abajo', 'Llevamos semanas sin vender nada y hay que pagar a los trabajadores. ¡Necesitamos crédito ya!', { demand: -24.0, supply: 0.3 }, { kind: 'demanda', asks: 'bajar', pressure: 15 }),
            ev('20c', 'ministro', 'Reapertura por fases', 'Los negocios vuelven de a pocos, con aforos reducidos.', { demand: 4.0, supply: 0.2 }, { kind: 'demanda' }),
            ev('20d', 'gremio', 'La economía se recupera', 'Las ventas vuelven, aunque todavía por debajo de antes de la pandemia.', { demand: 3.0, supply: 0.1 }, { kind: 'demanda' })
        ],
        surpriseChance: 0.15,
        goals: [
            { type: 'finalInBand' },
            { type: 'minGrowth', value: -8.5, label: 'Amortiguar la caída: que el PBI no caiga más de 8.5% en ningún trimestre' }
        ],
        realPath: {
            rate: [1.25, 0.25, 0.25, 0.25],
            inflation: [1.82, 1.60, 1.82, 1.97]
        },
        sources: [
            { label: 'Gestión – BCR bajó tasa de interés de referencia a 0.25%', url: 'https://gestion.pe/economia/covid-19-tasa-de-interes-de-referencia-bcr-bcr-redujo-su-tasa-de-interes-de-referencia-a-025-ante-debilitamiento-de-la-demanda-interna-noticia/' },
            { label: 'BCRP – Recuadro: El programa Reactiva Perú (RI setiembre 2020)', url: 'https://www.bcrp.gob.pe/docs/Publicaciones/Reporte-Inflacion/2020/setiembre/ri-setiembre-2020-recuadro-5.pdf' },
            { label: 'BCRPData – Tasa de referencia (PD04722MM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD04722MM/html' }
        ]
    },
    {
        id: 'inflacion-2022',
        kind: 'rate',
        number: 5,
        year: '2021–2023',
        title: 'La inflación más alta en 25 años',
        concept: 'Anclar expectativas en medio de la tormenta',
        context: [
            'Julio de 2021. La economía rebota tras la pandemia y la tasa sigue en 0.25%. Pero el dólar sube con la incertidumbre política y el mundo entra en una ola inflacionaria.',
            'En 2022 llegará la guerra en Ucrania: petróleo, trigo y fertilizantes se dispararán. Tu reto es que la inflación no se quede alta para siempre.'
        ],
        reality: 'El BCRP subió la tasa desde agosto de 2021, de 0.25% hasta 7.75% en enero de 2023: dieciocho alzas seguidas. La inflación llegó a 8.81% en junio de 2022, la más alta en 25 años, pero las expectativas no se desbordaron. El BCRP empezó a bajar la tasa en setiembre de 2023 y la inflación cerró ese año en 3.24%.',
        turns: 10,
        labels: ['T3 2021', 'T4 2021', 'T1 2022', 'T2 2022', 'T3 2022', 'T4 2022', 'T1 2023', 'T2 2023', 'T3 2023', 'T4 2023'],
        params: { potentialGrowth: 3.0, credPenalty: 0.08, realNeutral: 1.5, rateToGap: 0.25 },
        hikePressure: 1.2,
        monthlyMeetings: true,
        moves: [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5],
        initial: { rate: 0.25, outputGap: 0.5, core: 2.2, supply: 1.0, expectations: 2.5, credibility: 80 },
        pressure: 20,
        limits: { inflation: 12, credibility: 10 },
        // Tipo de cambio promedio de jun. 2021 y RIN aprox. en US$ (BCRPData).
        fx: { rate: 3.910, reserves: 71 },
        script: [
            ev('21c', 'cambista', 'El dólar supera los cuatro soles', '¡Nunca había visto el dólar tan alto! Con la incertidumbre política todos quieren dólares.', { supply: 1.2, demand: 0.4, credibility: -3 }, { kind: 'externo' }),
            ev('21d', 'chofer', 'Sube todo: pasajes, gas, alimentos', 'El combustible y los repuestos están carísimos. Los pasajes ya subieron un sol.', { supply: 0.9, demand: 0.2 }, { kind: 'oferta', asks: 'subir' }),
            ev('22a', 'agricultor', 'Guerra en Ucrania: fertilizantes y trigo se disparan', 'La úrea cuesta el doble. Muchos no vamos a poder abonar y la cosecha va a salir cara.', { supply: 2.1 }, { kind: 'oferta' }),
            ev('22b', 'caserita', 'El menú ya cuesta quince soles', 'El pollo, el aceite, el pan… todo sube. La gente come menos, hijito.', { supply: 1.0, credibility: -3 }, { kind: 'oferta', asks: 'subir' }),
            ev('22c', 'ministro', 'El MEF pide no frenar más la economía', 'Ya subieron bastante la tasa. Si siguen, vamos a una recesión.', { supply: 0.2, demand: -0.4 }, { kind: 'politica', asks: 'bajar', pressure: 12 }),
            ev('22d', 'prensa', 'Crisis política: vacancia presidencial', 'El Congreso declara la vacancia del presidente tras su intento de disolver el Congreso. Protestas en el sur.', { supply: 0.3, demand: -0.6, credibility: -4 }, { kind: 'politica' }),
            ev('23a', 'meteo', 'Lluvias y el ciclón Yaku en el norte', 'Lluvias intensas golpean Piura, Tumbes y Lambayeque. Se pierden cultivos.', { supply: 0.4, demand: -0.5 }, { kind: 'oferta' }),
            ev('23b', 'analista', 'Los precios internacionales ceden', 'El petróleo y los granos bajan. La inflación importada empieza a retroceder.', { supply: -1.8, demand: -0.4 }, { kind: 'externo' }),
            ev('23c', 'gremio', 'La economía está estancada', 'Las ventas no levantan. Con esta tasa, nadie se anima a invertir.', { supply: -1.2, demand: -0.3 }, { kind: 'demanda', asks: 'bajar', pressure: 10 }),
            ev('23d', 'analista', 'La inflación va camino a la meta', 'Los precios se moderan. El mercado espera recortes de tasa.', { supply: -1.0 }, { kind: 'demanda' })
        ],
        surpriseChance: 0.2,
        goals: [
            { type: 'maxInflation', value: 10, label: 'Que la inflación nunca pase de 10%' },
            { type: 'finalInflationMax', value: 4, label: 'Terminar 2023 con la inflación en 4% o menos' },
            { type: 'minCredibility', value: 30, label: 'Que las expectativas no se desanclen (credibilidad sobre 30)' }
        ],
        realPath: {
            rate: [1.00, 2.50, 4.00, 5.50, 6.75, 7.50, 7.75, 7.75, 7.50, 6.75],
            inflation: [5.23, 6.43, 6.82, 8.81, 8.53, 8.46, 8.40, 6.46, 5.04, 3.24],
            fxRate: [4.107, 4.037, 3.739, 3.747, 3.898, 3.829, 3.780, 3.651, 3.730, 3.734],
            // Aproximado: tras el récord de ventas del primer semestre de 2021, el BCRP siguió vendiendo en 2021.
            fxSales: [3, 1.5, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        sources: [
            { label: 'Infobae – Inflación anual alcanzó 8.81% en junio de 2022', url: 'https://www.infobae.com/america/peru/2022/07/02/inflacion-anual-alcanzo-el-881-en-junio-el-nivel-mas-alto-en-25-anos/' },
            { label: 'BCRP – Nota informativa del Programa Monetario de enero 2023 (7.75%)', url: 'https://www.bcrp.gob.pe/docs/Transparencia/Notas-Informativas/2023/nota-informativa-2023-01-12-1.pdf' },
            { label: 'BCRPData – Tasa de referencia (PD04722MM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD04722MM/html' },
            { label: 'BCRPData – Inflación 12 meses (PN01273PM)', url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01273PM/html' }
        ]
    }
];

/** Interludios: hitos que se cuentan entre capítulos (antes del capítulo indicado). */
export const INTERLUDES = {
    'hiper-1990': [
        { year: '1922', text: 'Se crea el Banco de Reserva del Perú (Ley 4500), uno de los bancos emisores más antiguos de América Latina.' },
        { year: '1931', text: 'Tras las recomendaciones de la misión Kemmerer, nace el Banco Central de Reserva del Perú, con la función de mantener el valor de la moneda.' },
        { year: '1985', text: 'Nace el inti, que reemplaza al sol de oro a razón de mil por uno. En pocos años perderá casi todo su valor.' }
    ],
    'crisis-2008': [
        { year: '1991', text: 'El 1 de julio empieza a circular el Nuevo Sol: un nuevo sol equivale a un millón de intis.' },
        { year: '1993', text: 'La Constitución (artículo 84) consagra la autonomía del BCRP, fija su finalidad de preservar la estabilidad monetaria y le prohíbe financiar al Tesoro Público.' },
        { year: '2002', text: 'El BCRP adopta el esquema de metas explícitas de inflación: 2.5% con un margen de ±1 punto. Poco después, la tasa de interés de referencia pasa a ser su principal herramienta.' },
        { year: '2007', text: 'La meta se reduce a 2%, con un rango de tolerancia de 1% a 3%. Es la meta que se mantiene hasta hoy.' }
    ],
    'nino-2017': [
        { year: '2010–2016', text: 'El Perú crece y el BCRP impulsa la desdolarización del crédito. La inflación se mantiene cerca de la meta la mayor parte del tiempo.' }
    ],
    'pandemia-2020': [],
    'inflacion-2022': [
        { year: '2021', text: 'La economía rebota con fuerza tras la cuarentena. Pero el mundo entero empieza a ver precios en alza.' }
    ]
};

export const INTERLUDE_SOURCES = [
    { label: 'BCRP – Origen del Banco Central de Reserva del Perú', url: 'https://www.bcrp.gob.pe/docs/sobre-el-bcrp/folleto/folleto-institucional-1.pdf' },
    { label: 'BCRP – Ley 25295: unidad monetaria Nuevo Sol', url: 'https://www.bcrp.gob.pe/billetes-y-monedas/ley-25295-unidad-monetaria-nuevo-sol.html' },
    { label: 'BCRP – Capítulo V de la Constitución', url: 'https://www.bcrp.gob.pe/transparencia/datos-generales/marco-legal/capitulo-v-de-la-constitucion.html' },
    { label: 'BCRP – Historia del BCRP, cap. 14: metas de inflación', url: 'https://www.bcrp.gob.pe/docs/Publicaciones/libros/2022/historia-del-banco-central/historia-bcrp-v2-14.pdf' }
];

// Etiquetas regionales de los eventos guionados (ver model/regions.js).
const SCRIPT_TAGS = {
    t1: ['consumo+'], t2: ['fiscal+'],
    '08b': ['combustible'], '08c': ['consumo+'], '08d': ['exportaciones-', 'cobre-'], '09a': ['exportaciones-'], '09c': ['cobre+'], '09d': ['consumo+'],
    '17a': ['nino'], '17b': ['agro+'], '17c': ['fiscal+'],
    '20a': ['cuarentena'], '20b': ['cuarentena'], '20c': ['reapertura'], '20d': ['reapertura'],
    '21c': ['dolar', 'politica'], '21d': ['combustible'], '22a': ['agro-', 'combustible'], '22d': ['politica'], '23a': ['lluvias']
};
// Presión sobre el dólar de los eventos guionados (% de depreciación en el trimestre sin intervención).
const SCRIPT_FX = {
    // Calibradas para que, replicando la tasa y las ventas de dólares del BCRP, el modelo
    // reproduzca la variación trimestral real del tipo de cambio (BCRPData PN01234PM):
    // presión = depreciación real + 1.2 × cambio de tasa + ventas (US$ miles de millones).
    '08a': -5.4, '08b': 3.5, '08c': 5, '08d': 8, '09a': 2.9, '09b': -9.4, '09c': -4.8, '09d': -1.1,
    '21c': 8.9, '21d': 1.6, '22a': -5.6, '22b': 2, '22c': 5.5, '22d': -0.9, '23a': -1, '23b': -3.4, '23c': 1.9, '23d': -0.8
};
[TUTORIAL, ...CHAPTERS].forEach(c => c.script?.forEach(e => { e.tags = SCRIPT_TAGS[e.id] ?? []; e.fx = SCRIPT_FX[e.id] ?? 0; }));

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map(c => [c.id, c]));
