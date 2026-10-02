/**
 * Perfil económico simplificado de cada departamento (pesos 0–1) para mostrar que una misma
 * decisión o un mismo choque no golpea igual a todo el Perú. Es una simplificación cualitativa
 * con fines educativos (qué pesa más en cada región), no una estimación estadística.
 *
 * Canales:
 *  alimentos   peso de la canasta de alimentos en el gasto de los hogares (más alto donde hay más pobreza)
 *  credito     sensibilidad al costo del crédito (mypes, hipotecas, consumo urbano)
 *  demanda     peso del mercado interno y los servicios urbanos
 *  mineria, agro, pesca, turismo   actividades principales
 *  combustible dependencia del transporte y del combustible (fletes fluviales, largas distancias)
 *  nino        exposición a El Niño costero y a las lluvias del norte
 *  heladas     exposición a heladas y friaje
 *  central     dependencia de la Carretera Central (abastecimiento entre Lima y la sierra/selva central)
 */

const P = (o) => ({ alimentos: 0.4, credito: 0.3, demanda: 0.3, mineria: 0, agro: 0.3, pesca: 0, turismo: 0.1, combustible: 0.4, nino: 0, heladas: 0, central: 0, ...o });

export const REGIONS = {
    amazonas: { profile: P({ alimentos: 0.8, agro: 0.7, turismo: 0.3, combustible: 0.6, nino: 0.1 }), who: 'Doña Zoila, cafetalera de Rodríguez de Mendoza', product: 'el café' },
    ancash: { profile: P({ alimentos: 0.5, mineria: 0.8, pesca: 0.8, agro: 0.4, nino: 0.5, heladas: 0.3 }), who: 'Don Braulio, pescador de Chimbote', product: 'el pescado', mineral: 'el cobre y el zinc' },
    apurimac: { profile: P({ alimentos: 0.9, mineria: 0.9, agro: 0.5, heladas: 0.6 }), who: 'Rosa, comunera de Challhuahuacho', product: 'la papa', mineral: 'el cobre' },
    arequipa: { profile: P({ alimentos: 0.3, credito: 0.7, demanda: 0.7, mineria: 0.8, agro: 0.5, pesca: 0.3, turismo: 0.5, heladas: 0.5 }), who: 'Don Alfredo, comerciante del centro de Arequipa', product: 'la mercadería', mineral: 'el cobre' },
    ayacucho: { profile: P({ alimentos: 0.8, mineria: 0.3, agro: 0.6, turismo: 0.2, heladas: 0.6 }), who: 'Señora Teodora, artesana de Quinua', product: 'la artesanía' },
    cajamarca: { profile: P({ alimentos: 0.9, mineria: 0.6, agro: 0.6, nino: 0.3, heladas: 0.3 }), who: 'Don Segundo, ganadero lechero de Cajamarca', product: 'la leche', mineral: 'el oro' },
    cusco: { profile: P({ alimentos: 0.6, credito: 0.5, demanda: 0.5, mineria: 0.6, agro: 0.5, turismo: 1, heladas: 0.7 }), who: 'Nilda, guía de turismo en Cusco', product: 'los paquetes turísticos', mineral: 'el cobre' },
    huancavelica: { profile: P({ alimentos: 1, mineria: 0.3, agro: 0.6, heladas: 0.8, central: 0.4 }), who: 'Don Fortunato, alpaquero de Huancavelica', product: 'la fibra de alpaca' },
    huanuco: { profile: P({ alimentos: 0.8, agro: 0.6, central: 0.5 }), who: 'Doña Elvira, agricultora de papa en Huánuco', product: 'la papa' },
    ica: { profile: P({ alimentos: 0.3, credito: 0.6, demanda: 0.5, mineria: 0.3, agro: 0.9, pesca: 0.5, turismo: 0.4, nino: 0.4 }), who: 'Kevin, trabajador de una agroexportadora en Ica', product: 'la uva y el espárrago' },
    junin: { profile: P({ alimentos: 0.6, credito: 0.5, demanda: 0.5, mineria: 0.6, agro: 0.7, heladas: 0.6, central: 1 }), who: 'Don Máximo, productor de papa del valle del Mantaro', product: 'la papa', mineral: 'el zinc' },
    'la-libertad': { profile: P({ alimentos: 0.5, credito: 0.7, demanda: 0.7, mineria: 0.5, agro: 0.8, pesca: 0.3, nino: 0.7 }), who: 'Doña Carmen, trabajadora agroexportadora de Virú', product: 'la palta y el arándano', mineral: 'el oro' },
    lambayeque: { profile: P({ alimentos: 0.5, credito: 0.6, demanda: 0.6, agro: 0.8, pesca: 0.3, nino: 0.9 }), who: 'Don Wilmer, arrocero de Lambayeque', product: 'el arroz' },
    lima: { profile: P({ alimentos: 0.3, credito: 1, demanda: 1, mineria: 0.2, agro: 0.3, pesca: 0.4, turismo: 0.5, combustible: 0.5, nino: 0.4, central: 0.6 }), who: 'Luis, taxista en Lima', product: 'la mercadería' },
    loreto: { profile: P({ alimentos: 0.8, agro: 0.4, turismo: 0.3, combustible: 0.9 }), who: 'Rocío, vendedora del mercado de Belén en Iquitos', product: 'el pescado de río' },
    'madre-de-dios': { profile: P({ alimentos: 0.4, mineria: 0.6, agro: 0.3, turismo: 0.5, combustible: 0.8 }), who: 'Don Hernán, castañero de Madre de Dios', product: 'la castaña', mineral: 'el oro' },
    moquegua: { profile: P({ alimentos: 0.3, credito: 0.4, mineria: 0.9, agro: 0.3, pesca: 0.3, heladas: 0.4 }), who: 'Doña Nelly, vendedora del mercado de Moquegua', product: 'la palta', mineral: 'el cobre' },
    pasco: { profile: P({ alimentos: 0.8, mineria: 0.9, agro: 0.3, heladas: 0.8, central: 0.6 }), who: 'Doña Lidia, productora de maca en Pasco', product: 'la maca', mineral: 'el zinc' },
    piura: { profile: P({ alimentos: 0.6, credito: 0.6, demanda: 0.6, agro: 0.8, pesca: 0.8, nino: 1 }), who: 'Doña Mercedes, limonera de Chulucanas', product: 'el limón' },
    puno: { profile: P({ alimentos: 0.9, mineria: 0.4, agro: 0.6, turismo: 0.5, combustible: 0.6, heladas: 1 }), who: 'Doña Justina, productora de quinua en Puno', product: 'la quinua', mineral: 'el oro' },
    'san-martin': { profile: P({ alimentos: 0.6, agro: 0.7, combustible: 0.6 }), who: 'Don Eusebio, cacaotero de San Martín', product: 'el cacao' },
    tacna: { profile: P({ alimentos: 0.3, credito: 0.5, demanda: 0.5, mineria: 0.5, agro: 0.4, pesca: 0.2, heladas: 0.4 }), who: 'Milagros, comerciante de Tacna', product: 'la mercadería', mineral: 'el cobre' },
    tumbes: { profile: P({ alimentos: 0.4, agro: 0.5, pesca: 0.5, nino: 1 }), who: 'Don Pedro, langostinero de Tumbes', product: 'el langostino' },
    ucayali: { profile: P({ alimentos: 0.6, agro: 0.5, combustible: 0.8, central: 0.4 }), who: 'Doña Zulema, vendedora del puerto de Pucallpa', product: 'el plátano' }
};

/**
 * Efecto de cada etiqueta de evento sobre los canales regionales: [canal, magnitud].
 * Una región recibe magnitud × peso del canal. Negativo = la golpea; positivo = la beneficia.
 */
export const TAG_EFFECTS = {
    nino: [['nino', -2.2]],
    lluvias: [['nino', -1.4]],
    'cobre+': [['mineria', 1.3]],
    'cobre-': [['mineria', -1.6]],
    'conflicto-minero': [['mineria', -1.5]],
    combustible: [['combustible', -1.2]],
    transporte: [['combustible', -1], ['central', -0.6]],
    central: [['central', -1.8]],
    heladas: [['heladas', -1.6]],
    'pesca-': [['pesca', -1.8]],
    'turismo+': [['turismo', 1.3]],
    'agro-': [['agro', -1.1]],
    'agro+': [['agro', 0.8]],
    cuarentena: [['demanda', -1.6], ['turismo', -2], ['credito', -0.6]],
    reapertura: [['demanda', 0.9], ['turismo', 0.6]],
    'credito+': [['credito', 1.1]],
    'consumo+': [['demanda', 0.9], ['credito', 0.4]],
    'exportaciones-': [['mineria', -1.1], ['agro', -0.6], ['pesca', -0.4]],
    politica: [['credito', -0.4], ['demanda', -0.3]],
    'fiscal+': [['demanda', 0.6], ['alimentos', 0.3]],
    dolar: [['combustible', -0.6], ['credito', -0.3]],
    'sol-fuerte': [['mineria', -0.3], ['agro', -0.5], ['turismo', -0.3]],
    // 1990
    'sueldos-': [['demanda', -0.8]],
    colera: [['pesca', -1.8], ['alimentos', -0.6]]
};

/** Frases regionales por causa; {p} = producto que se vende en la región, {m} = su mineral principal. */
export const REGION_VOICES = {
    nino: [
        'El río se desbordó y se llevó la chacra. {P} se perdió casi todo.',
        'Llevamos semanas con el agua hasta la rodilla. No hay cómo sacar {p} al mercado.',
        'Los huaicos cortaron la carretera. Aquí todo está el doble de caro.'
    ],
    lluvias: [
        'Las lluvias no paran. {P} se está pudriendo en el campo.',
        'Con tanta lluvia no llegan los camiones. Todo sube.'
    ],
    'cobre+': [
        'Con {m} a buen precio, en la mina hay turnos extra y el pueblo se mueve.',
        'Están contratando otra vez. Hasta los restaurantes de la zona venden más.'
    ],
    'cobre-': [
        'Cayó el precio de {m} y ya empezaron los despidos en la mina.',
        'La mina paró una ampliación. Los contratistas nos quedamos sin chamba.'
    ],
    'conflicto-minero': [
        'Con el bloqueo no entra ni sale nada. Los negocios del pueblo están cerrados.',
        'Llevamos semanas de paro. Nadie gana: ni la mina ni la comunidad.'
    ],
    combustible: [
        'El flete subió otra vez. Aquí todo llega por río o por carretera, y se nota en cada precio.',
        'Con el combustible así, el pasaje y la carga se fueron a las nubes.'
    ],
    transporte: [
        'Con el paro no llegan los camiones. {P} se queda sin comprador.',
        'No hay transporte. Los precios en el mercado subieron de un día para otro.'
    ],
    central: [
        'La Carretera Central está bloqueada. {P} se queda en la chacra y en Lima la pagan carísima.',
        'Sin carretera no hay venta. Estamos perdiendo la cosecha.'
    ],
    heladas: [
        'La helada quemó los cultivos y se murieron varias alpacas. Va a ser un año duro.',
        'El friaje llegó fuerte. Los niños se enferman y la cosecha se perdió.'
    ],
    'pesca-': [
        'Sin anchoveta no hay trabajo en el puerto. Las plantas están paradas.',
        'El mar está raro, no hay pesca. Estamos viviendo de lo ahorrado.'
    ],
    'turismo+': [
        'Los hoteles están llenos. Hasta las artesanas de la plaza venden todo.',
        '¡Temporada buena! Los turistas llegan y hay trabajo para todos.'
    ],
    'agro-': [
        'Los fertilizantes cuestan el doble. Este año voy a sembrar la mitad.',
        'Con lo caro que está todo, sembrar ya no sale a cuenta.'
    ],
    'agro+': ['{P} se vende bien este año. Por fin la chacra rinde.'],
    cuarentena: [
        'Todo cerrado. No entra un solo turista y no sabemos cómo pagar el alquiler.',
        'Con la cuarentena no podemos salir a vender. Vivimos del día y el día no llega.'
    ],
    reapertura: ['Poco a poco volvemos a abrir. Todavía vendemos la mitad, pero algo es algo.'],
    'credito+': ['Los bancos están dando préstamos. La gente está comprando depa y carro.'],
    'consumo+': ['La gente está comprando. En el mercado y en las tiendas se nota el movimiento.'],
    'exportaciones-': ['Los compradores de afuera cancelaron pedidos. {P} no tiene salida.'],
    politica: ['Con tanta pelea en Lima, nadie se anima a invertir por aquí.'],
    'fiscal+': ['Llegó el bono y la gente salió a comprar. Pero todo está subiendo de precio.'],
    dolar: [
        'Con el dólar así, todo lo que viene de afuera está más caro.',
        'Saqué un préstamo en dólares para la camioneta y ahora la cuota me sale más soles.',
        'Los repuestos y los fertilizantes son importados: con el dólar arriba, todo sube.'
    ],
    'sol-fuerte': [
        'Con el dólar tan barato, lo que exportamos nos rinde menos soles.',
        'Nos pagan {p} en dólares y cada vez nos alcanza para menos en soles.'
    ],
    'sueldos-': ['Los sueldos del Estado no alcanzan y el mercado está vacío.'],
    colera: ['Con el cólera nadie quiere comprar pescado. Nos estamos quedando sin nada.'],
    // Causas "de fondo" (sin evento local): vienen del contexto nacional.
    inflacion: [
        'Aquí el sueldo no alcanza: lo poco que ganamos se va en comida.',
        'Cada semana el mercado está más caro. Ya compramos por medio kilo.',
        'La inflación la sentimos primero los que menos tenemos.',
        'Lo que me pagan por {p} sigue igual, pero el arroz y el aceite no paran de subir.',
        'Vendo {p} al mismo precio de siempre y todo lo que compro está más caro. Así no se sale a cuenta.',
        'En la feria del domingo ya nadie compra como antes. La plata no rinde.',
        'Aquí todo llega de lejos y llega caro. Con estos precios hay que escoger qué comer.',
        'El pasaje, la comida, el gas… todo subió. Y en el campo no hay más ingresos.'
    ],
    tasa: [
        'La caja municipal subió la tasa. El préstamo para la campaña me sale más caro.',
        'Con los intereses así, los negocios de la ciudad están ajustándose.',
        'Quería un crédito para ampliar la producción de {p}, pero con estas tasas mejor espero.',
        'El banco ya no presta tan fácil. Los que tenemos deudas lo sentimos cada mes.'
    ],
    recesion: [
        'No hay trabajo. Los jóvenes se están yendo a buscar suerte a otra parte.',
        'Las ventas están por los suelos. Varios negocios de la plaza cerraron.',
        'Nadie está comprando {p}. Se nos está quedando la producción.',
        'Mi hijo se fue a Lima a buscar chamba, pero allá tampoco hay.',
        'Los restaurantes y las tiendas de la zona están vacíos. Da pena caminar por el centro.'
    ],
    auge: [
        'Hay movimiento: se abren negocios y se construye por todos lados.',
        'Hay chamba. Este año sí pudimos mejorar la casa.',
        '{P} se vende bien y hay trabajo en la zona. Hacía tiempo que no estábamos así.',
        'Los comercios del centro están llenos. Se nota que hay plata circulando.'
    ],
    estable: [
        'Por aquí la cosa está tranquila. Ni muy bien ni muy mal.',
        'Se trabaja normal. Mientras los precios no se disparen, estamos bien.',
        'Vamos avanzando de a poquito.',
        '{P} se vende como siempre. Sin sorpresas, que ya es bastante.',
        'Tranquilo por ahora. Ojalá siga así hasta la próxima cosecha.',
        'Ni para quejarse ni para celebrar. Seguimos chambeando.'
    ]
};
