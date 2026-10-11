# Sol Firme · Roadmap


> **Octubre 2026: se rehace la experiencia de juego.** Ver [`docs/PLAN-REHACER.md`](PLAN-REHACER.md). Lo que sigue en este roadmap describe fases anteriores; sus piezas de interfaz (tablero, palancas, diario con pestañas) se reemplazan.

_Actualizado: 30 de septiembre de 2026 · versión compartible en Claude Docs_

Sol Firme ya es fiel a la realidad peruana (**8.5/10**), pero todavía no es divertido (**4/10**). Este roadmap busca subir la diversión sin sacrificar realismo. La idea central es pasar de "elegir un número" a "armar una estrategia".

## Dónde estamos

- **Modos:** tutorial, modo historia (1990, 2008, 2017, 2020, 2021–23) y modo libre, con 3 dificultades.
- **Realismo:** series de BCRPData, Congreso con frases reales y anónimas, proyectos de ley recreados a partir de casos reales, mercado cambiario con reservas, gente por sector y mapa por departamento.
- **Presentación:** íconos, personajes ilustrados, música adaptativa andina e introducción "¿Qué es el BCR?".

## Diagnóstico: por qué no es divertido todavía

Por dentro, el juego es **una sola decisión repetida doce veces**: elegir entre 7 botones de tasa, leer y esperar. El Congreso, la gente, el mapa y el dólar suman contexto y consecuencias, pero no le dan al jugador más cosas que *hacer*.

| Problema | Por qué mata la diversión |
|---|---|
| Una sola palanca | No hay estrategia ni estilo propio: casi siempre existe "la respuesta correcta" (la regla del staff). |
| Respuesta lenta | La tasa tarda 2–3 trimestres en hacer efecto. Es realista, pero el cerebro no conecta la decisión con el resultado. |
| Mucho texto por turno | Se lee más de lo que se juega. |
| Nada se acumula | Terminar un mandato no deja herramientas, logros ni algo que presumir. |
| Cero social | No hay nada que compartir ni con qué competir. |

## Octalysis (los 8 impulsos de Yu-kai Chou)

| # | Impulso | Nota | Estado |
|---|---|---|---|
| 1 | Sentido épico ("salvar al país") | 7 | Bien: el lema, la historia y la gente. |
| 2 | Logro y progreso | 4 | Solo puntaje y rachas; no hay logros ni maestría visible. |
| 3 | Creatividad y feedback | **2** | Una palanca y feedback lento: **el hueco más grande**. |
| 4 | Posesión | **1** | No construyes nada que sea tuyo. |
| 5 | Social | **1** | Nada compartible. |
| 6 | Escasez e impaciencia | 5 | Reservas, promesas, el reloj en difícil. |
| 7 | Imprevisibilidad | 7 | Imprevistos, Congreso, eventos al azar. |
| 8 | Miedo a perder | 7 | Varias formas de perder y el Congreso encima. |

**Lectura:** el juego se apoya en los impulsos de *presión* (6, 7, 8). Eso genera tensión, pero cansa y no engancha. Faltan los impulsos que *enganchan*, del lado creativo y social: **3, 4 y 5**. La meta es llevar cada uno a 6 o más.

## Realismo peruano: brechas

1. **El encaje.** Es el instrumento más peruano (2008, la desdolarización de 2013–15) y hoy no existe en el juego.
2. **El comunicado.** El BCRP no solo mueve la tasa, también *dice* cosas, y eso mueve las expectativas desde el primer día.
3. **Ruido político.** Seis presidentes entre 2016 y 2023, vacancias y crisis de gabinete mueven el dólar; casi no aparecen.
4. **Informalidad.** Siete de cada diez trabajadores son informales (ver abajo).

## Informalidad: verificada

- **La cifra es cierta:** el empleo informal fue **70.2% en 2025** (12.3 de 17.6 millones de ocupados): 94.8% en zonas rurales y 64.5% en las urbanas; 72.7% en mujeres y 68.2% en hombres. Fuente: EPEN del INEI, reportada por [Infobae (abril 2026)](https://www.infobae.com/peru/2026/04/01/inei-confirma-que-7-de-cada-10-trabajadores-en-peru-son-informales-pierden-acceso-a-cts-seguro-y-pension/).
- **No es una ventaja, es un colchón.** El BCRP ([Carrera y Razzo, DT 2026-001](https://ideas.repec.org/p/rbp/wpaper/dt-2026-001.html)) encuentra que el empleo informal absorbe los desequilibrios del mercado laboral y atenúa la transmisión de presiones inflacionarias. Ignorarlo sobrestima los riesgos de inflación y el poder de la política monetaria.
- **En el juego (Fase C):**
  - transmisión más débil en las regiones más informales;
  - un indicador de **precariedad** que sube en las recesiones aunque el desempleo no suba;
  - voces nuevas: el ambulante, la mototaxista, el minero artesanal;
  - una entrada en el glosario: "¿Por qué la tasa no llega a todos?".

## Diseño: el comunicado

Segunda decisión de cada turno: el tono del anuncio. Mueve las expectativas ese mismo turno.

| Tono | Efecto inmediato | Compromiso |
|---|---|---|
| Halcón | Bajan las expectativas (más cuanto mayor la credibilidad); el dólar se calma; el Congreso se molesta un poco. | No bajar la tasa el próximo turno. |
| Neutral | Ninguno. | Ninguno. |
| Paloma | Mejora el ánimo de mypes y deudores; las expectativas suben un poco. | No subir la tasa el próximo turno. |

- Cumplir lo anunciado: +2 de credibilidad. Romperlo: −5 a −8.
- El efecto escala con la credibilidad: con 80 puntos, un comunicado halcón vale casi un alza de 25 pb.
- El titular del diario cita el comunicado.

## Diseño: la caja de herramientas histórica

Cada capítulo desbloquea el instrumento que el BCRP creó en esa época; lo desbloqueado queda disponible en el modo libre. Por turno se usan tres espacios: tasa, comunicado y una herramienta.

| Herramienta | Se gana en | Qué hace | Costo | Recarga |
|---|---|---|---|---|
| Comité de Caja | 1990 | Prohíbe emitir para financiar al Tesoro. | Golpe a los estatales | Permanente |
| Metas de inflación | Interludio 2002 | Activa el comunicado y ancla expectativas. | Exige cumplir la meta | Permanente |
| Encaje en soles | 2008 | Inyecta o retira liquidez sin mover la tasa. | Efecto en 1–2 turnos | 2 turnos |
| Encaje en dólares | 2008 | Frena el crédito en dólares. | Enojo de los deudores en US$ | 2 turnos |
| Repos de liquidez | 2008 | Presta soles a los bancos en una crisis. | Si se abusa, sube la inflación esperada | 1 turno |
| Desdolarización | Interludio 2015 | Baja para siempre el traspaso del dólar a los precios. | Rinde recién a los 3 turnos | Una vez |
| Swaps cambiarios | 2021–23 | Defiende el sol sin vender reservas. | Costo en el balance del BCR | 2 turnos |
| Reactiva Perú | 2020 | Garantiza créditos para pagar sueldos. | Riesgo de impago | Una vez |

Las fechas de cada instrumento se verifican contra las memorias del BCRP antes de escribir el texto de cada carta.

## Hecho (Fase A, octubre 2026)

- **Comunicado:** tono halcón, neutral o paloma; mueve expectativas según la credibilidad y compromete el turno siguiente. Con criterio, la reelección en simulación sube de 49% a 57%; hablar siempre como paloma la baja a 20%.
- **Caja de herramientas:** encaje en soles (subir/bajar), encaje en dólares, repos, desdolarización y swaps cambiarios, cada una con efecto, costo, recarga y su historia real verificada ([Memoria BCRP 2008](https://www.bcrp.gob.pe/docs/Publicaciones/Memoria/2008/Memoria-BCRP-2008-5.pdf), [Memoria 2015](https://www.bcrp.gob.pe/docs/Publicaciones/Memoria/2015/memoria-bcrp-2015-5.pdf), [La República 2022 sobre 2021](https://larepublica.pe/economia/2022/01/07/bcrp-tuvo-la-mayor-intervencion-cambiaria-de-su-historia-us-175-millones), [Gestión 2017](https://gestion.pe/economia/mercados/bcr-reduce-encaje-soles-6-5-partir-abril-131584-noticia/)). Se ganan superando capítulos; usarlas con criterio sube la reelección ~8 puntos, usarlas todas sin criterio la baja.

## Hecho (Fase C, octubre 2026)

- **Directorio con votos** (modo libre y exprés), fiel al art. 86 de la Constitución: necesitas 4 de 7; puedes convencer a un director por turno; perder la votación cuesta credibilidad.
- **Logros con humor peruano** en todos los modos, con vitrina en la portada: «Perú es clave», «Chamba es chamba», «A la firme», «Palabra de candidato», «Con yapa», «Ni un solo jalado»…
- **Mandato exprés** de 6 turnos para jugar en el celular.
- **Informalidad** (70.2%, INEI 2025): sube cuando la economía crece bajo su potencial; nuevas voces de chamba precaria. Por ahora es indicador y narrativa: no cambia el modelo macro.
- Humor de fondo: dichos peruanos en la portada y frases mientras el país espera el anuncio.

## Hecho (Fase B, octubre 2026)

- **Reacción en vivo:** tras anunciar, el país reacciona en segundos (Pepe y el dólar, un analista, la gente, el Congreso) antes del diario.
- **Ruido político:** cambio de gabinete, elecciones polarizadas, paro regional y moción de vacancia en el modo libre.
- **Momento decisivo** en cada capítulo (Lehman 2008, El Niño 2017, cuarentena 2020, inflación de 8.81% en 2022): te comparas con el BCRP real, ±6 de credibilidad.
- **El éxito también molesta:** con la inflación en meta y prestigio, el Congreso se enoja por envidia o protagonismo, hasta la zona de citaciones (nunca te saca solo).

## Hecho: pantalla del turno por secciones

El turno se recorre en cuatro secciones con un clic (o las teclas 1–4): **Noticias y gente**, **El Estado** (Congreso y MEF), **El Directorio** (debate y proyección) y **El anuncio** (tasa, dólares, ganadores y perdedores, con la proyección al lado). Cada pestaña muestra una línea de resumen y un punto rojo si aún no se vio.

## Roadmap por fases

### Iteración siguiente (ya acordada)

- [ ] **Imágenes del slider de capítulos.** Ilustraciones SVG en el estilo de los personajes, sin personas reales reconocibles.
- [ ] **Publicar.** Push de `rediseno-serious-game`, PR y merge a `main`; se despliega en GitHub Pages.
- [ ] **Prueba con 3–5 personas** reales, incluida la música. Anotar dónde se aburren y dónde se confunden.

### Fase A · Más cosas que hacer (impulsos 3 y 4)

La apuesta principal. Convierte "elegir un número" en "armar una estrategia".

| Iniciativa | Qué es | Impulso | Esfuerzo | Criterio de éxito |
|---|---|---|---|---|
| **Caja de herramientas histórica** | Cada capítulo desbloquea el instrumento que el BCRP creó en esa época: Comité de Caja (1990), metas de inflación (2002), encaje y repos (2008), desdolarización (2015), Reactiva (2020). Cada uno con su costo y su tiempo de espera. | 3, 4, 2 | Alto | En modo libre, al menos 3 estrategias distintas ganan más del 40% de las veces (hoy casi solo gana copiar al staff). |
| **El comunicado** | Segunda decisión: el tono del anuncio (halcón, neutral o paloma). Mueve las expectativas *de inmediato*. Si dices "subiremos" y no subes, pierdes credibilidad. | 3, 7 | Medio | En las pruebas, los jugadores cambian el tono al menos una vez por partida. |
| **Encaje** | Herramienta propia: el encaje en dólares frena el crédito dolarizado sin tocar la tasa. | 3 | Medio | Reproduce el efecto de 2008 en el capítulo correspondiente. |

### Fase B · Reacción inmediata y emoción (impulsos 3 y 7)

| Iniciativa | Qué es | Impulso | Esfuerzo | Criterio de éxito |
|---|---|---|---|---|
| **Reacción en vivo tras anunciar** | En 3 segundos: Pepe el cambista grita el dólar, titulares, memes de la gente y tuits del Congreso. La lógica del modelo no cambia. | 3, 7 | Medio | El tiempo entre anunciar y ver una consecuencia baja a menos de 3 segundos. |
| **Jefe final por capítulo** | El pico de cada crisis es un turno especial, con música, pantalla distinta y decisión a todo o nada. | 7, 8 | Medio | Los jugadores recuerdan ese turno al terminar (pregunta en el playtest). |
| **Ruido político** | Eventos de vacancia, cambio de gabinete y crisis de gobierno que mueven el dólar y el ánimo del Congreso. | 7 | Bajo | Aparecen en modo libre y en el capítulo 2021–23. |

### Fase C · Progreso y posesión (impulsos 2 y 4)

| Iniciativa | Qué es | Impulso | Esfuerzo | Criterio de éxito |
|---|---|---|---|---|
| **Directorio con votos** | Siete miembros ficticios con personalidad; se necesitan 4 votos. Hay que convencer y negociar, y a veces sale un 4–3. | 5, 3 | Alto | Hay votaciones divididas en al menos 1 de cada 4 turnos. |
| **Logros con humor peruano** | "Ni el Fujishock te asustó", "Pepe el cambista te quiere", "El Congreso te citó 5 veces y sigues aquí". | 2 | Bajo | 15 o más logros, que se ven en la portada. |
| **Mandatos cortos** | Una modalidad de 6 turnos (≈5 minutos) pensada para el celular. | 6 | Bajo | Se completa en menos de 6 minutos. |
| **Informalidad** | Parte de la economía no reacciona a la tasa; se ve en el mapa y en las voces de la gente. | Realismo | Medio | La transmisión es más débil en las regiones más informales. |

### Fase D · Social (impulso 5)

| Iniciativa | Qué es | Impulso | Esfuerzo | Criterio de éxito |
|---|---|---|---|---|
| **Tarjeta "Mi mandato"** | Imagen para compartir por WhatsApp con el puntaje, la frase de la gente y el mapa. | 5 | Bajo | Botón "Compartir" en el veredicto. |
| **Reto semanal** | La misma semilla para todos durante una semana, con ranking entre amigos, colegios o universidades. | 5, 6 | Medio | Un aula puede competir con el mismo escenario. |

## Orden recomendado

1. Iteración siguiente: imágenes, publicación y playtest.
2. **Fase A**: comunicado primero (esfuerzo medio, impacto alto); luego la caja de herramientas.
3. **Fase B**: reacción en vivo, porque aprovecha lo que ya existe.
4. **Fase D**: tarjeta para compartir (barata y le da alcance al juego).
5. **Fase C**: Directorio con votos y logros.

Si solo se pudieran hacer dos cosas: **la caja de herramientas y el comunicado**.
