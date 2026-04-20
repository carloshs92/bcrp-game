# 🎮 Guardián de la Estabilidad - BCRP Inflation Game

Un juego educativo sobre política monetaria del Banco Central de Reserva del Perú (BCRP). Controla la inflación, el tipo de cambio y mantén la economía estable.

![Game Screenshot](screenshot.png)

## 🎯 Características

- **Simulación económica realista** con inflación, tipo de cambio, reservas internacionales y PBI
- **Sistema de niveles progresivos** con dificultad creciente
- **Eventos externos e internos** que impactan la economía
- **Asesor económico inteligente** que te da hints cuando estás en problemas
- **Música adaptativa** que cambia según el estado económico
- **Sistema de guardado** con LocalStorage para tu mejor puntuación
- **Pixel art cyberpunk andino** con estética única

## 🎮 Cómo Jugar

### Controles
- **← →** (Flechas): Ajustar tasa de interés
- **Q**: Comprar dólares (aumenta reservas, debilita sol)
- **E**: Vender dólares (reduce reservas, fortalece sol)
- **M**: Toggle música

### Objetivos
Mantén estos 5 indicadores en rango:
- ✓ Inflación: 1% - 3%
- ✓ Tipo de cambio: S/ 3.60 - 3.90
- ✓ Reservas: > $60,000M
- ✓ Credibilidad: > 80%
- ✓ PBI: Crecimiento positivo

### Sistema de Puntuación
- **+10 puntos/mes**: Todos los indicadores en rango
- **+3 puntos/mes**: 4/5 indicadores en rango
- **0 puntos/mes**: 3/5 indicadores en rango
- **-3 puntos/mes**: 2/5 indicadores en rango
- **-10 puntos/mes**: Crisis (≤1/5 indicadores)

**Penalizaciones adicionales**:
- Hiperinflación (>8%): -15 pts
- Deflación (<0.5%): -10 pts
- Reservas críticas (<$40B): -10 pts
- Credibilidad perdida (<50%): -10 pts

**Meta**: Acumula 1000 puntos para pasar al siguiente nivel

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

## 🎓 Conceptos Económicos

### Tasa de Interés
- **Sube la tasa** → Reduce inflación, atrae capital, fortalece sol, frena economía
- **Baja la tasa** → Estimula economía, aumenta inflación, debilita sol

### Intervención Cambiaria
- **Comprar USD** → Aumenta reservas, debilita sol (tipo de cambio sube)
- **Vender USD** → Reduce reservas, fortalece sol (tipo de cambio baja)

### Relaciones Clave
- Inflación alta → Sol se debilita
- Tasa alta → Sol se fortalece
- Sol débil → Inflación sube (pass-through)
- Tasa alta → PBI baja

## 🛠️ Tecnologías

- **Phaser 3**: Motor de juego
- **Vite**: Build tool
- **Web Audio API**: Música procedural
- **LocalStorage**: Guardado de progreso
- **GitHub Actions**: CI/CD automático

## 📊 Estructura del Proyecto

\`\`\`
bcrp-game/
├── src/
│   ├── main.js              # Entry point
│   ├── scenes/
│   │   ├── BootScene.js     # Carga inicial
│   │   └── GameScene.js     # Escena principal
│   ├── models/
│   │   └── EconomicModel.js # Simulación económica
│   ├── ui/
│   │   ├── NewsFeed.js      # Feed de noticias
│   │   ├── AdvisorPanel.js  # Asesor económico
│   │   ├── InterestRateSlider.js
│   │   └── InflationMeter.js
│   ├── managers/
│   │   └── AudioManager.js  # Sistema de audio
│   └── utils/
│       ├── PixelArtGenerator.js
│       └── SaveManager.js   # LocalStorage
├── index.html
├── vite.config.js
└── package.json
\`\`\`

## 🎨 Créditos

- **Concepto**: Simulador educativo de política monetaria del BCRP
- **Desarrollo**: [Tu Nombre]
- **Arte**: Pixel art procedural generado con Canvas API
- **Música**: Síntesis procedural con Web Audio API

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
