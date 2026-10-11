# Plan: rehacer la experiencia de juego de Sol Firme

_Escrito el 10 de octubre de 2026. Punto de respaldo: commit `57bef8b` en la rama `rediseno-serious-game`._

Este documento es una orden de trabajo. Quien lo ejecute debe seguirlo **en orden, fase por fase**, sin saltarse los criterios de aceptación. Las fuentes de diseño son el documento "BCRP-Game — Game Design" de Claude Docs y su pestaña "Auditoría (8 oct)" (https://claude.ai/code/artifact/d8014134-dac2-44ea-b612-8aa52b0a8e85).

---

## 0. Qué significa "rehacer" (léelo dos veces)

**Rehacer no es retocar.** La pantalla de turno actual (`src/views/play.js`, 947 líneas, y sus estilos) se **descarta entera**. No se adapta, no se reordena, no se le cambian colores: se escribe de nuevo, en archivos nuevos, con otra estructura. El código viejo solo sirve para consultar cómo se llama al motor.

Por qué: tres rediseños seguidos cambiaron las reglas pero no la forma de jugar. El jugador sigue viendo un tablero de control (288 palabras, 47 números y 22 botones antes de decidir) y elige un número entre siete. Cualquier intento de "mejorar" esa pantalla repetirá el problema.

**Reglas para quien ejecute el plan:**

1. **No te enamores de lo que existe.** Si una pieza de UI no aparece en este plan, no se porta. Si dudas, no la portes y anótalo en "Preguntas abiertas" al final de tu informe.
2. **No copies HTML ni CSS de `play.js` ni de las secciones viejas de `styles.css`.** Escribe estructura y estilos nuevos.
3. **El motor se conserva** (`model/`, `game/`, datos reales, Congreso, personajes). Se le agregan módulos puros nuevos; no se reescribe ni se recalibra salvo donde este plan lo dice.
4. **Una fase = un commit**, con los tests en verde y la verificación en el navegador hecha. No se hace push a `main`.
5. Todo texto para el jugador va **en español**, corto y concreto, con el tono peruano que ya tiene el juego.

---

## 1. La experiencia objetivo

Un turno es **una carta, una elección y un mes que pasa**.

1. **La carta** ocupa el centro de la pantalla: personaje ilustrado, titular, una frase y qué golpea. Es lo primero y lo más grande que se ve.
2. **Tres o cuatro respuestas** debajo de la carta, como cartas más chicas con nombre humano ("Apretar fuerte", "Paso medido", "Dar aire", "Esperar"). Cada una muestra **quién gana y quién pierde** con las caritas del elenco y **qué cuesta** en una línea. Elegir una respuesta es la decisión del mes.
3. **Ajuste fino** (escondido, se abre con un botón): la tasa exacta, los dólares, el discurso y las herramientas, con el límite de 2 acciones. Por defecto no se usa.
4. **El reloj** rodea la carta y se vacía. Si se acaba, el BCR queda mudo (el motor ya cobra ese silencio).
5. **El mes pasa** en una sola animación de 3 a 5 segundos, sin modales: el sello de tu respuesta, el imprevisto si lo hubo, los termómetros que se mueven, dos personajes que reaccionan y un titular. El diario completo es opcional.
6. **La cuenta llega**: las cartas de consecuencia, las citaciones y los proyectos de ley del Congreso aparecen **como cartas** en el mismo escenario, antes de la carta del mes.
7. **Arco de 12 meses**: una crisis grande en el mes 6 y un final ilustrado con arquetipo, estrellas y tarjeta para compartir.

Arriba solo quedan **4 termómetros como íconos** (inflación, dólar, empleo, confianza) y **2 recursos como barras** (reservas, credibilidad). El número exacto aparece al tocar un ícono.

---

## 2. Inventario: qué se borra, qué se conserva, qué se crea

### 2.1 Se conserva sin cambios de fondo

| Archivo | Por qué |
| --- | --- |
| `src/model/economy.js` | Modelo macro calibrado. **No tocar `PARAMS`.** |
| `src/model/history.js`, `events.js`, `congress.js`, `regions.js`, `peruMap.js` | Datos reales, mazos y frases con fuente. Solo se agregan campos (ver Fase 1). |
| `src/game/mandate.js` | Motor de turnos. Solo se agregan cosas puntuales (ver Fase 1). `decide(rate, sell, tone, toolId, { convinced, timeout })` sigue siendo la única forma de jugar un turno. |
| `src/game/hyper.js`, `people.js`, `cast.js`, `consequences.js`, `endings.js`, `actions.js`, `toolbox.js`, `achievements.js`, `challenge.js` | Reglas puras que el diseño nuevo usa. |
| `src/storage.js`, `src/audio/music.js` | Progreso y música. |
| `src/views/modal.js`, `coach.js`, `glossary.js`, `icons.js`, `art.js`, `scenes.js` | Utilidades visuales que el diseño nuevo reutiliza. |
| `src/views/intro.js` (portada e introducción), `story.js` (línea de tiempo y slider de capítulos) | Funcionan bien. Solo cambian sus imports en la Fase 5. |
| `src/views/shareCard.js`, `share.js`, `achievementsView.js` | El final los reutiliza. |
| `src/views/fanChart.js`, `peruMap.js`, `people.js` | Se usan **solo en el final** (sección "Ver detalles"), nunca en el turno. |
| Todos los tests de `test/` | Prueban el motor y deben seguir en verde. |

### 2.2 Se borra (al final de la Fase 5, cuando ya nada lo importe)

| Qué | Reemplazo |
| --- | --- |
| `src/views/play.js` entero | `src/views/turn/*` (Fases 2 a 4) |
| `src/views/tutorialScript.js` | Guion nuevo `src/views/turn/tutorial.js` (Fase 5) |
| En `styles.css`, todos los bloques de la pantalla de turno vieja: medidores (`.meter*`), HUD viejo, `.mission`, `.turn-nav`, `.turn-panel`, `.mandate-grid`, `.announce-grid`, `.decision*`, `.steps`, `.tones`/`.tone`, `.guidance*`, `.toolbox`/`.tcard*`, `.board*`/`.seat*`, `.fx-block`, `.tradeoff*`/`.tt-*`, `.reaction`/`.feed*`, el diario por pestañas (`.paper` del turno, `.ptabs*`), `.informal-card`, `.envy`, `.climax-banner`, `.cite-*` y `.bill*` de los modales | `src/turn.css` nuevo (Fase 2) |
| Los modales del turno: reacción en vivo, diario con 4 pestañas, "última hora", citación, proyecto de ley, momento decisivo | Escenas del turno nuevo (Fases 3 y 4) |

Antes de borrar `play.js`, **mueve a `src/views/common.js`** lo que otros archivos importan de él (`avatar`, `shortLabel`, `animateNumber`, `createTimer`, `announceSuspense`, `showBreaking`) y la constante `BILL_ICON`. Hoy `views/hyper.js` importa esas funciones; `main.js` y `story.js` importan `playScenario`, `renderVerdict` y `GAME_OVER`. Haz el traslado en la Fase 1 para que nada se rompa.

### 2.3 Se crea

| Archivo nuevo | Contenido |
| --- | --- |
| `src/game/cards.js` | Cola de cartas del turno (puro). Fase 1. |
| `src/game/responses.js` | Respuestas con nombre, su plan para el motor y su vista previa (puro). Fase 1. |
| `src/views/common.js` | Utilidades trasladadas desde `play.js`. Fase 1. |
| `src/views/turn/stage.js` | `playMandate(root, scenario, opts)`: la pantalla del turno nueva. Reemplaza a `playScenario`. Fase 2. |
| `src/views/turn/hud.js` | 4 íconos de termómetro y 2 barras de recurso, con detalle al tocar. Fase 2. |
| `src/views/turn/card.js` | La carta del escenario (shock, consecuencia, citación, proyecto, crisis). Fases 2 y 3. |
| `src/views/turn/responses.js` | Las cartas de respuesta y su vista previa. Fase 2. |
| `src/views/turn/finetune.js` | El cajón "Ajuste fino". Fase 2. |
| `src/views/turn/monthPasses.js` | La animación "el mes pasa" y el diario opcional. Fase 3. |
| `src/views/turn/ending.js` | El final: `renderEnding` reemplaza a `renderVerdict`. Fase 4. |
| `src/views/turn/tutorial.js` | Guion del tutorial sobre el DOM nuevo. Fase 5. |
| `src/turn.css` | Estilos del turno nuevo, importado desde `main.js`. Fase 2. |
| `test/cards.test.js`, `test/responses.test.js` | Tests de los módulos puros nuevos. Fase 1. |

---

## 3. Fases

Cada fase termina con: `npm test` en verde, `npm run build` sin errores, la verificación en el navegador de la sección 5 y un commit. Mensajes de commit en español, con el formato que ya usa el repo (`feat: …`, `refactor: …`).

### Fase 0. Preparación

1. Desde `rediseno-serious-game` (commit `57bef8b` o posterior), crea la rama `rehacer-juego`.
2. Lee: este plan completo, `CLAUDE.md`, el documento de Game Design y su Auditoría.
3. Corre `npm test` y anota cuántos tests pasan (hoy son 84). Ese número no puede bajar en ninguna fase, salvo los tests que este plan manda borrar explícitamente (ninguno por ahora).

### Fase 1. Núcleo puro, sin pantalla

**1.a `src/views/common.js`.** Mueve allí, sin cambiar su comportamiento, `avatar`, `shortLabel`, `animateNumber`, `createTimer`, `announceSuspense`, `showBreaking` y la constante `BILL_ICON` (hoy privada en `play.js`; expórtala). Haz que `play.js` las reexporte desde `common.js` y que `hyper.js` las importe de `common.js`. El juego debe seguir igual.

**1.b `src/game/responses.js`.** Exporta:

```js
// Una respuesta es la decisión del mes en una sola elección.
// { id, label, sub, plan: { move, sell, tone, tool }, preview }
export function buildResponses(m) { /* … */ }
export function previewResponse(m, plan) { /* … */ }
export function applyResponse(m, response, { timeout = false } = {}) {
    // Llama a m.decide(m.state.rate + plan.move, plan.sell, plan.tone, plan.tool, { timeout }) y devuelve el registro.
}
```

Reglas de `buildResponses(m)` (deterministas, sin azar):

| id | Etiqueta por defecto | Plan | Notas |
| --- | --- | --- | --- |
| `apretar` | "Apretar fuerte" | `move` = movimiento del halcón (`m.advisors().hawk.rate − m.state.rate`), `tone: 'halcon'` | |
| `medido` | "Paso medido" | `move` = movimiento del staff (`staffRecommendation(m.state) − m.state.rate`, ajustado a `m.moves` y al piso `m.minRate`), `tone: 'neutral'` | En cartas `kind: 'oferta'` con `move ≤ 0.25`, la etiqueta es "Mirar más allá del choque". |
| `aire` | "Dar aire" | `move` = movimiento de la paloma, `tone: 'paloma'` | Si la carta tiene presión cambiaria (`m.eventFx(m.event) ≥ 2`), hay dólares (`m.fx`) y `m.maxSale() ≥ 1.5`, esta respuesta se reemplaza por `defender`. |
| `defender` | "Defender el sol" | `move` = el del staff, `sell: 1.5`, `tone: 'neutral'` | Solo con la condición de la fila anterior. |
| `esperar` | "Esperar" | `move: 0`, `sell: 0`, `tone: 'neutral'` | **Siempre presente**: la inacción es una opción visible y deliberada (no es lo mismo que el silencio del reloj). |

- Si dos respuestas quedan con el mismo `move`, `sell` y `tone`, se queda la primera de la tabla y se descarta la otra. Mínimo 2 respuestas y máximo 4.
- Si el escenario no tiene comunicado (`m.guidanceOn === false`, por ejemplo el tutorial), todos los `tone` son `'neutral'`.
- Ninguna respuesta puede violar el límite de 2 acciones: valida con `planIsValid` de `game/actions.js`.
- En el modo libre, calcula `m.boardVote(move)` para las respuestas con `move ≠ 0`. Si `passes` es falso, la respuesta lleva `preview.noMajority = true`; se puede elegir igual, y el motor ya cobra perder la votación.

Reglas de `previewResponse(m, plan)`. Devuelve `{ inflation: { lo, hi }, faces, costs, noMajority }`:

- `inflation`: el rango del último punto de `m.projection(m.state.rate + plan.move, plan.sell, plan.tone, plan.tool)` (usa `lo` y `hi`).
- `faces`: un objeto `{ rosa, kevin, valeria, congresista }` con valores −2 a +2. Fórmulas exactas (simples a propósito; son una señal, no un cálculo):
  - `rosa`: si el `hi` proyectado es mayor que 3, `−1` (y `−2` si es mayor que 4); si no, `+1` cuando el centro proyectado es menor que la inflación actual y la actual es mayor que 2.5; si no, `0`.
  - `kevin`: `move > 0` da `−1` (y `−2` si `move ≥ 0.5`); `move < 0` da `+1`; si no, `0`.
  - `valeria` (solo si hay `m.fx`): `sell > 0` da `−1`; `sell < 0` da `+1`; si no, `0`.
  - `congresista`: `move > 0` da `−1` (y `−2` si la carta pide bajar, `m.event.asks === 'bajar'`); `move < 0` da `+1`; si no, `0`.
- `costs`: hasta 2 frases cortas, en este orden de prioridad:
  - enojo del Congreso si `move > 0` (el mismo cálculo del aviso actual: `move / 0.25 × hikePressure`, más `event.pressure × CONGRESS.askWeight` si se ignora un pedido de bajar);
  - "Reservas −US$ 1.5 mil M" si `sell > 0`;
  - "Te compromete a no bajar el próximo mes" si `tone === 'halcon'` y "… a no subir …" si `tone === 'paloma'`;
  - "La carta sigue golpeando" si es `esperar`.

**1.c `src/game/cards.js`.** Exporta `nextCard(m)`: la carta que toca mostrar **ahora**, en este orden de prioridad:

1. Consecuencia pendiente (`m.consequences`), con `type: 'consequence'` y una sola respuesta, "Seguir", que no llama al motor.
2. Citación pendiente (`m.congress.pending`): `type: 'citation'`, con las respuestas de la pregunta; elegir llama a `m.answerCitation(i)`.
3. Proyecto de ley pendiente (`m.congress.pendingBill`): `type: 'bill'`, con `BILL_RESPONSES`; elegir llama a `m.answerBill(i)`.
4. La carta del mes (`m.event`): `type: 'shock'` (o `'crisis'` si es la crisis de mitad de mandato, o `'climax'` si es el momento decisivo de un capítulo), con `buildResponses(m)`.

La UI consume las cartas una por una: después de una consecuencia, citación o proyecto, vuelve a pedir `nextCard(m)` hasta llegar a la carta del mes. La consecuencia debe dejar de estar pendiente al pulsar "Seguir"; agrega para eso un método `m.ackConsequence()` en el motor que la quite de `m.consequences`.

**1.d Crisis de mitad de mandato (motor).** En `FREE_SCENARIO` agrega `midterm: { turn: 5 }` (el mes 6). En `drawEvent()`, cuando `this.quarter === scenario.midterm.turn`, elige una carta de `tier: 3` todavía no usada (con el mismo `rng`) y márcala con `midterm: true` en una copia del evento. No cambies nada más de `drawEvent`. El exprés y el reto **no** tienen crisis de mitad de mandato (son de 6 meses); quítala en sus escenarios.

**1.e Tests nuevos.**

- `test/responses.test.js`:
  - siempre hay entre 2 y 4 respuestas y una es `esperar`;
  - ningún plan viola `planIsValid`;
  - `apretar` tiene un `move` mayor o igual que `medido`, y `medido` mayor o igual que `aire`;
  - con presión cambiaria y reservas, aparece `defender` en lugar de `aire`;
  - jugar 300 mandatos eligiendo siempre la misma respuesta: **ninguna** gana más de 50% (usa la misma ayuda de simulación que `test/audit.test.js`), y `esperar` gana menos de 10%.
- `test/cards.test.js`:
  - el orden es consecuencia → citación → proyecto → carta del mes;
  - "Seguir" en una consecuencia no cambia el estado macro;
  - en el modo libre, la carta del mes 6 trae `midterm: true`.

**Aceptación de la Fase 1:** tests en verde (84 + los nuevos); el juego se ve y se juega **igual que antes** (esta fase no toca la pantalla).

### Fase 2. La pantalla del turno nueva (solo modo libre)

Crea `src/views/turn/stage.js` con `playMandate(root, scenario, opts)`, con las mismas opciones que hoy recibe `playScenario` (`title`, `seed`, `difficulty`, `noTimer`, `intro`, `coachSteps`, `onExit`, `onFinish`). En `main.js`, **solo el modo libre** pasa a usar `playMandate`; el tutorial, el exprés, el reto y los capítulos siguen con `playScenario` hasta la Fase 5.

**Estructura del DOM** (ids fijos: el tutorial y los tests visuales dependen de ellos):

```html
<header class="t-top">…marca, mes "Ene 2027 · Mes 1 de 12", música, glosario, salir…</header>
<section id="hud" class="t-hud">…4 íconos de termómetro + 2 barras de recurso…</section>
<main id="stage" class="t-stage">
  <div id="timer" class="t-timer">…anillo o barra que rodea la carta…</div>
  <article id="card" class="t-card">…la carta…</article>
  <div id="responses" class="t-responses">…2 a 4 cartas de respuesta…</div>
  <button id="finetune-open">Ajuste fino</button>
</main>
<aside id="finetune" class="t-finetune" hidden>…</aside>
```

**El HUD** (`turn/hud.js`):

- 4 termómetros: inflación (con su número), dólar (con su número), empleo (palabra: "Contratan", "Estable", "Despidos"…) y confianza (carita). Cada uno es un ícono de 40 px con una línea de texto como máximo.
- 2 recursos: reservas y credibilidad, como barras finas **sin número**.
- Tocar o hacer clic en cualquiera abre un popover con el número exacto, la meta o el límite, y una frase de qué significa. Usa `glossary.js` para el "¿qué es?".
- Los colores de juicio (verde, ámbar, rojo) solo en dificultad Fácil (`hints`). En Normal y Difícil el HUD es neutro.
- La misión va en una sola línea dentro del HUD: "Inflación entre 1% y 3% al menos 8 de 12 meses, sin apagar el país".

**La carta** (`turn/card.js`):

- Ancho de 560 a 640 px en escritorio y de toda la pantalla en celular. Arriba, el número de carta ("Carta 3 de 12"), el tipo con ícono (`KIND_ICON`) y el personaje con su busto (`bust()` de `icons.js`).
- Un titular grande (serif), la frase del personaje en un globo de diálogo y una línea "Golpea: …".
- La crisis de mitad de mandato (`midterm`) y el momento decisivo de los capítulos (`climax`) tienen marco rojo, la etiqueta "MOMENTO DECISIVO" y una escena de `scenes.js` dentro de la carta.
- Máximo 45 palabras en la carta.

**Las respuestas** (`turn/responses.js`):

- Una fila de 2 a 4 cartas chicas (en celular, en columna). Cada una muestra: el nombre (por ejemplo, "Apretar fuerte"), una línea `sub` con lo que hace ("Sube 50 pb y discurso firme"), las caritas de `preview.faces` que no sean 0 (solo esas, con ↑ o ↓), y como máximo 2 líneas de `preview.costs`.
- Al pasar el mouse (o mantener presionado en celular) sobre una respuesta, el rango de inflación proyectado aparece en la carta como una frase: "Si haces esto, la inflación iría a 2.1%–2.9% en 6 meses". No hay gráfico en el turno.
- `preview.noMajority` se muestra como una etiqueta "Sin mayoría en el Directorio".
- Elegir una respuesta la marca; un botón "Anunciar" (o Enter) la confirma. **Dos toques como máximo** para pasar el mes.
- Teclado: flechas para moverse entre respuestas, Enter para anunciar.

**El ajuste fino** (`turn/finetune.js`): un cajón lateral (en celular, desde abajo) con los controles de hoy pero rediseñados en forma compacta. Usa `game/actions.js` para el límite de 2 acciones:

- tasa (7 pasos);
- dólares (`FX_MOVES`);
- discurso (3 tonos);
- herramientas de la caja (si hay).

Si el jugador usa el ajuste fino, ese plan reemplaza a la respuesta elegida y la UI muestra "Plan propio". Mientras está abierto, el reloj sigue corriendo.

**El reloj:** usa `createTimer` de `common.js`. Se dibuja como una barra que se vacía alrededor de la carta (o arriba en celular). En los últimos 10 segundos cambia de color y suena `music.click()` una vez por segundo. Al agotarse, llama a `applyResponse(m, esperar, { timeout: true })`. El silencio ya lo cobra el motor: −3 de credibilidad, el dólar se agita y el titular dice que el BCR quedó mudo.

**Estilos** (`src/turn.css`): de cero. Paleta y tipografías existentes (variables de `:root` en `styles.css`). La carta tiene sombra profunda y se siente física; las respuestas se elevan al pasar el mouse. Animación de entrada de la carta (deslizar y voltear, 300 ms). `prefers-reduced-motion` desactiva todas las animaciones.

**Aceptación de la Fase 2** (medir en el navegador, sección 5):

- En el mes 1 del modo libre, antes de decidir, dentro de `#hud` + `#stage`: **menos de 80 palabras**, **10 números o menos** y **8 botones o menos** (sin contar los del encabezado).
- La carta es el elemento más grande del viewport en escritorio (1440×900) y en celular (390×844), y en ambos se ve completa sin hacer scroll.
- Un jugador puede pasar el mes 1 con 2 clics.
- Sin errores en la consola. Tests en verde.

### Fase 3. El mes pasa, y la cuenta llega como carta

**`turn/monthPasses.js`**: después de anunciar, una secuencia **dentro del escenario**, no en un modal:

1. La respuesta elegida se estampa sobre la carta y la carta sale (600 ms).
2. Si hubo imprevisto (`rec.surprise`), aparece un banner "¡IMPREVISTO!" con su título y suena `music.sting()` (1,200 ms).
3. Los termómetros del HUD se animan hasta sus valores nuevos (1,000 ms).
4. Los dos personajes con mayor cambio de ánimo aparecen con su frase (`castLines`), con un pequeño salto (1,500 ms).
5. Cae el titular (`rec.headline`) con la lección de la carta (`cardLesson`) en una línea (1,000 ms).

- Total: **menos de 6 segundos**. Un clic, un toque o Enter salta al final.
- Al terminar queda un botón "Siguiente mes" (que también se activa con Enter) y un enlace "Ver el diario".
- "Ver el diario" abre un modal simple con 3 cifras (inflación, PBI, dólar) y su cambio, el "¿por qué?" (`rec.drivers`) y las notas del motor (`rec.notes`). Nada de pestañas.
- Si el capítulo tiene historia real (`rec.real`), agrega en el paso 5 una etiqueta: "El BCRP real: subió 50 pb".
- Las frases reales de congresistas (`rec.declaration`) aparecen en el paso 4 con el **ícono del Congreso**, nunca con un busto, y con la etiqueta "Frase real de un congresista (año)". Esto es obligatorio por anonimato (ver `CLAUDE.md`).

**Cartas especiales** (usa `nextCard(m)` de la Fase 1):

- **Consecuencia**: la carta muestra al personaje de `c.who` y el texto, que ya dice qué decisión pasada la causó. Una sola respuesta: "Seguir".
- **Citación**: la carta es el Congreso (ícono y escena `congressScene` de `icons.js`) con la pregunta (`q.text`) y la etiqueta "Pregunta real (año)" o "Recreación de un hecho real (año)". Las respuestas son las 3 de la pregunta, con su estilo y su costo en una línea.
- **Proyecto de ley**: la carta usa la escena del hemiciclo con el ícono del tema (`BILL_ICON`). Las respuestas son las 3 de `BILL_RESPONSES`.
- Después de una carta especial, el resultado se muestra en la misma carta durante 2 segundos (enojo y credibilidad, antes y después) y se pasa a la siguiente carta. No se abre ningún modal.

**Aceptación de la Fase 3:**

- Entre "Anunciar" y la carta siguiente: **1 clic** y menos de 6 segundos (o 0 clics si el jugador espera a que termine la secuencia y pulsa Enter).
- No se abre ningún modal durante un mes normal.
- Las citaciones, proyectos y consecuencias aparecen como cartas.

### Fase 4. El arco y el final

**Crisis de mitad de mandato:** la carta del mes 6 (`midterm`) tiene la presentación de "momento decisivo" (marco rojo, escena, música `surprise`). Después de resolverla, en el paso 5 de "el mes pasa" se dice si se superó: inflación en meta y PBI sobre 1 al cierre del mes. Esto es **solo narrativo**: no cambies el balance.

**`turn/ending.js`, con `renderEnding(root, m, r, opts)`**, que reemplaza a `renderVerdict`:

1. Pantalla completa con una escena grande de `scenes.js`, elegida por el final:
   - derrota anticipada por inflación: `mercado`;
   - por reservas: `dolar-sube`;
   - por credibilidad: `crash`;
   - por el Congreso: `constitucion`;
   - por recesión: `cuarentena`;
   - El Guardián: `meta`;
   - El Halcón de Hierro: `crash`;
   - La Paloma: `mercado`;
   - El Bombero: `dolar-sube`;
   - El Aprendiz: `boom`.
2. El arquetipo (`archetype(m)` de `endings.js`) o el final anticipado (`ENDINGS`), con su lección.
3. Las estrellas, el puntaje y como máximo 3 cifras: meses en meta, crecimiento promedio y confianza promedio.
4. El peor mes (`worstTurn`) y la frase de Doña Rosa (`rosaVerdict`).
5. Los botones: "Compartir" (`shareCard.js`), "Jugar otra vez" y "Volver al inicio".
6. Los logros de la partida (`achievementsBlock`).
7. Un desplegable "Ver detalles" con el gráfico de tu recorrido (`compareChart`), el balance humano (`peopleBalance`) y el mapa (`peruMap`). Cerrado por defecto.

Si el jugador no fue ratificado, el texto dice por qué en una frase: le faltaron meses en meta o frenó de más ("necesitabas un crecimiento promedio de 1.8%").

**Aceptación de la Fase 4:**

- El final se lee en una pantalla sin hacer scroll hasta los botones, en escritorio y en celular.
- La crisis del mes 6 se distingue a simple vista de los demás meses.

### Fase 5. Migrar todos los modos y borrar lo viejo

1. **Tutorial**: usa `playMandate` con el escenario `TUTORIAL` (`noTimer`, dificultad Fácil). Escribe un guion nuevo en `turn/tutorial.js` con `coach()`. Pasos del mes 1, como máximo una frase cada uno:
   - `#card`: "Cada mes llega una carta";
   - `#responses`: "Elige una respuesta: mira quién gana y quién pierde";
   - `#hud`: "Tus termómetros";
   - `#finetune-open`: "Si quieres más control, ajuste fino".

   En los meses siguientes, un paso por mes, solo cuando aparezca algo nuevo (consecuencia, imprevisto, dólar). El objetivo del tutorial se mantiene ("terminar con la inflación en 3.5% o menos").
2. **Exprés y reto de la semana**: usan `playMandate`, sin crisis de mitad de mandato.
3. **Capítulos con tasa** (2008, 2017, 2020, 2021–23): usan `playMandate`.
   - Los capítulos son **trimestrales**: el HUD y la carta dicen "Trimestre", con `m.unit` y `m.unitWord`.
   - El "momento decisivo" (`scenario.climax`) usa la misma presentación que la crisis de mitad de mandato. La comparación con el BCRP real ya la hace el motor.
   - Reactiva Perú (`scenario.tools`) aparece en el ajuste fino como herramienta del capítulo.
   - El final de los capítulos usa `renderEnding` con un bloque extra "Tú vs. el BCRP real" (`compareChart` con las dos series, el puntaje relativo y las fuentes del capítulo).
   - Los tests de `history.test.js` deben seguir en verde **sin cambios**.
4. **1990 se queda con su vista propia** (`views/hyper.js`) en esta fase. Solo cambia sus imports a `common.js`.
5. **Borra**:
   - `src/views/play.js` y `src/views/tutorialScript.js`;
   - los bloques de `styles.css` de la sección 2.2;
   - cualquier export que ya nadie importe.

   Comprueba con `grep -rn "views/play.js\|from './play.js'" src` que no queda ninguna referencia.

**Aceptación de la Fase 5:**

- Todos los modos se juegan de principio a fin en el navegador (tutorial, libre, exprés, reto, los 4 capítulos con tasa y 1990).
- `play.js` no existe. Tests en verde. Build sin errores.

### Fase 6 (opcional). 1990 en formato carta

Solo si las fases 0 a 5 están cerradas. Lleva el capítulo 1990 a `playMandate` con un adaptador:

- las 3 opciones de `HYPER_CHOICES` son las respuestas;
- el Programa de Compensación Social es una herramienta del ajuste fino.

Si no cabe limpio, déjalo como está y anótalo.

### Fase 7. Cierre

1. **Balance:** vuelve a correr la tabla de estrategias, ahora por respuesta fija (`apretar`, `medido`, `aire`, `esperar`, `defender`) y con "mezcla con criterio". Ninguna respuesta fija debe ganar más de 50%; `esperar`, menos de 10%. Si algo se sale, ajusta **solo** las reglas de `buildResponses`, nunca `PARAMS`.
2. **Documentación:** actualiza `CLAUDE.md` (secciones de vistas), `README.md` y `docs/ROADMAP.md`.
3. **Informe final** en el chat, con:
   - las métricas de la sección 5 antes y después;
   - capturas de escritorio y celular;
   - lo que quedó fuera;
   - las preguntas abiertas.
4. No hagas merge a `main`: eso lo decide Carlos.

---

## 4. Lo que NO se hace

- No se cambian `PARAMS` de `economy.js`, la calibración de los capítulos ni los datos reales.
- No se agregan librerías, frameworks ni archivos de imagen: todo sigue siendo SVG en línea, CSS y JS.
- No se inventan cifras ni frases de personas reales. Las frases del Congreso siguen siendo reales, anónimas y con el ícono del Congreso.
- No se vuelve a poner un gráfico, un mapa ni un tablero en la pantalla del turno: viven en el final.
- No se agregan pantallas de texto explicativo. Si algo necesita explicación, va en una línea dentro de la carta o en el glosario.
- No se porta la votación del Directorio como bloque visual: queda solo como la etiqueta "Sin mayoría" en una respuesta.

---

## 5. Cómo verificar en el navegador (cada fase)

1. Corre `npm run dev` y abre http://localhost:3000 en escritorio (1440×900) y en un iframe o ventana de 390×844.
2. Entra al modo libre, cierra el modal de inicio y, **antes de decidir**, corre en la consola:

```js
const zone = [document.querySelector('#hud'), document.querySelector('#stage')].filter(Boolean);
const text = zone.map(el => el.innerText).join(' ');
({
  palabras: text.split(/\s+/).filter(Boolean).length,          // objetivo: < 80
  numeros: (text.match(/\d+[.,]?\d*%?/g) || []).length,        // objetivo: ≤ 10
  botones: zone.reduce((n, el) => n + el.querySelectorAll('button').length, 0), // objetivo: ≤ 8
  cartaVisible: (() => { const r = document.querySelector('#card').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })()
})
```

3. Juega 3 meses completos y cuenta los clics y los segundos entre "Anunciar" y la carta siguiente.
4. Revisa la consola: cero errores.
5. Toma capturas de escritorio y celular para el informe.

---

## 6. Preguntas abiertas (para Carlos; no bloquean el plan)

- ¿La plataforma principal es el celular? Si es así, en la Fase 2 se diseña primero para 390 px.
- ¿El BCRP validará los textos educativos de cada carta y arquetipo?
- ¿Se mantiene el reto semanal sin servidor, o más adelante se quiere un ranking real?
