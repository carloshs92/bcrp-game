# Sol Firme

Serious game sobre la política monetaria del Banco Central de Reserva del Perú (BCRP). El jugador se sienta en el Directorio y, reunión a reunión, decide la tasa de interés de referencia para mantener la inflación dentro del rango meta sin provocar una recesión.

Lo que viene: [docs/ROADMAP.md](docs/ROADMAP.md).

## 🎯 Qué enseña

- **La meta de inflación** del BCRP: 2%, con un rango de 1% a 3%.
- **La tasa de referencia** como herramienta principal y cómo se transmite: tasa → créditos → gasto → precios.
- **Los rezagos**: una decisión tarda meses en llegar a los precios, así que hay que decidir mirando hacia adelante.
- **La tasa neutral** y la diferencia entre una política contractiva y una expansiva.
- **Expectativas, credibilidad y choques de oferta**: por qué no conviene sobrerreaccionar a un alza de alimentos.

## 🎮 Modos de juego

1. **Tutorial** (3 turnos guiados). Una asesora explica los medidores, el debate del Directorio, la proyección y los imprevistos.
2. **Modo Historia** (5 capítulos reales). Cada capítulo compara tus decisiones con las del BCRP real, y entre capítulos hay una línea de tiempo con los hitos: 1922, 1931, el inti, el Nuevo Sol, la Constitución de 1993 y las metas de inflación.

   | Capítulo | Lección |
   |---|---|
   | 1990 · La hiperinflación y el Fujishock | No financiar al fisco con emisión (Comité de Caja) |
   | 2008 · La crisis financiera global | Subir contra la inflación y luego bajar rápido |
   | 2017 · El Niño costero | No sobrerreaccionar a un choque de oferta |
   | 2020 · La pandemia | La tasa llega a su piso; entra Reactiva Perú |
   | 2021–2023 · La inflación más alta en 25 años | Anclar expectativas en medio de la tormenta |
3. **Modo Libre**. Un mandato de 12 trimestres con eventos al azar que se vuelven más intensos cada año.

**Elementos de juego:**
- **Medidores:** inflación, crecimiento, credibilidad y presión política.
- **Personajes peruanos ficticios:** la caserita de Surquillo, la confeccionista de Gamarra, el chofer de combi, el cambista de Ocoña.
- **Debate halcón/paloma** en el Directorio.
- **Proyección en vivo** de la inflación.
- **Imprevistos de "¡Última hora!"** que aparecen después de anunciar la decisión.
- **El Congreso:** su humor cambia con tus decisiones. Si se molesta, te cita y respondes con preguntas reales hechas por congresistas (anónimas) o recreaciones rotuladas de episodios reales. Una promesa te compromete el turno siguiente.
- **Dólar y reservas** (Modo Libre, 2008 y 2021–23): vendes o compras dólares junto con la tasa. El tipo de cambio se traslada a los precios, golpea a quienes deben en dólares y gasta reservas.
- **Cómo lo vive la gente:** cinco sectores con caritas y testimonios que cambian según la causa (alimentos caros, crédito caro, despidos…), más un **mapa del Perú por departamentos**. Cada región tiene su perfil económico (minería, agro, pesca, turismo, peso de los alimentos, exposición a El Niño y a las heladas) y un personaje local. El mapa se basa en [Natural Earth](https://www.naturalearthdata.com/), que es de dominio público.
- **Música adaptativa** con timbres andinos generada en el navegador, con estados distintos para decidir, anunciar, un imprevisto, un buen resultado y un mal resultado.

Los datos históricos provienen de [BCRPData](https://estadisticas.bcrp.gob.pe) (tasa de referencia PD04722MM, inflación PN01273PM y PN01271PM). La inspiración de diseño está documentada en [Referencias e inspiración](https://claude.ai/code/artifact/07e52634-4356-4ac8-abfd-cd59b8b63159).

## 🚀 Desarrollo Local

### Requisitos
- Node.js 18+
- npm

### Instalación
\`\`\`bash
# Clonar repositorio
git clone https://github.com/TU-USUARIO/bcrp-game.git
cd bcrp-game

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
\`\`\`

El juego estará disponible en `http://localhost:3000`

### Build para producción
\`\`\`bash
npm run build
\`\`\`

Los archivos compilados estarán en la carpeta `dist/`

## 📦 Publicar en GitHub Pages

### Opción 1: Automático con GitHub Actions (Recomendado)

1. **Sube tu código a GitHub**:
\`\`\`bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/bcrp-game.git
git push -u origin main
\`\`\`

2. **Habilita GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Settings → Pages
   - Source: "GitHub Actions"

3. **El workflow se ejecutará automáticamente**:
   - Cada push a `main` desplegará automáticamente
   - Espera 2-3 minutos
   - Tu juego estará en: `https://TU-USUARIO.github.io/bcrp-game/`

### Opción 2: Manual

\`\`\`bash
# Build
npm run build

# Instalar gh-pages
npm install -D gh-pages

# Desplegar
npx gh-pages -d dist
\`\`\`

Luego habilita GitHub Pages en Settings → Pages → Source: gh-pages branch

## 🛠️ Tecnologías

- **JavaScript** (módulos ES) con HTML/CSS, gráficos SVG y **Web Audio** para la música. No usa frameworks, motor de juego ni archivos de audio o imagen.
- **Vite**: servidor de desarrollo y build.
- **node --test**: pruebas del modelo y de la calibración de cada capítulo (`npm test`).
- **LocalStorage**: progreso, estrellas y récords.
- **GitHub Actions**: despliegue automático a GitHub Pages.

## 📊 Estructura del Proyecto

```
src/
├── main.js              # Menú y navegación entre modos
├── storage.js           # Progreso en localStorage
├── audio/music.js       # Música adaptativa andina (procedural)
├── model/
│   ├── economy.js       # Modelo macro mensual (puro)
│   ├── events.js        # Personajes, eventos e imprevistos
│   └── history.js       # Tutorial, capítulos históricos, interludios y datos reales
├── game/
│   ├── mandate.js       # Motor por turnos basado en escenarios
│   └── hyper.js         # Motor del capítulo 1990 (emisión)
└── views/               # Pantallas: inicio, juego, historia, 1990, veredictos
test/                    # Balance del modo libre y calibración de cada capítulo
```

## 🎨 Créditos

- **Concepto**: Simulador educativo de política monetaria del BCRP
- **Desarrollo**: [Tu Nombre]
- **Ilustraciones**: SVG propios, en línea

## 📝 Licencia

MIT License - Siéntete libre de usar este proyecto para aprender sobre economía y desarrollo de juegos.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras bugs o tienes ideas para mejorar el juego:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📧 Contacto

Si tienes preguntas o sugerencias, abre un issue en GitHub.

---

**Nota educativa**: Este juego es una simplificación con fines educativos. La política monetaria real del BCRP es mucho más compleja e involucra muchos más factores.
