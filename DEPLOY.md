# 🚀 Guía de Despliegue en GitHub Pages

## Paso 1: Preparar el Repositorio

### 1.1 Inicializar Git (si no lo has hecho)
\`\`\`bash
git init
git add .
git commit -m "Initial commit: BCRP Inflation Game"
\`\`\`

### 1.2 Crear repositorio en GitHub
1. Ve a https://github.com/new
2. Nombre del repositorio: `bcrp-game` (o el que prefieras)
3. Descripción: "Educational game about BCRP monetary policy"
4. Público o Privado (tu elección)
5. **NO** inicialices con README (ya lo tienes)
6. Click en "Create repository"

### 1.3 Conectar y subir
\`\`\`bash
git branch -M main
git remote add origin https://github.com/TU-USUARIO/bcrp-game.git
git push -u origin main
\`\`\`

## Paso 2: Configurar GitHub Pages

### 2.1 Habilitar GitHub Pages
1. Ve a tu repositorio en GitHub
2. Click en **Settings** (⚙️)
3. En el menú lateral, click en **Pages**
4. En "Source", selecciona **GitHub Actions**

### 2.2 El workflow se ejecutará automáticamente
- El archivo `.github/workflows/deploy.yml` ya está configurado
- Cada vez que hagas `git push` a `main`, se desplegará automáticamente
- Puedes ver el progreso en la pestaña **Actions** de tu repositorio

### 2.3 Espera el despliegue
- Primera vez: 2-5 minutos
- Despliegues posteriores: 1-2 minutos
- Verás un ✅ verde cuando termine

## Paso 3: Acceder a tu Juego

Tu juego estará disponible en:
\`\`\`
https://TU-USUARIO.github.io/bcrp-game/
\`\`\`

Por ejemplo, si tu usuario es `carlos123`:
\`\`\`
https://carlos123.github.io/bcrp-game/
\`\`\`

## 🔄 Actualizar el Juego

Cada vez que quieras actualizar:

\`\`\`bash
# Hacer cambios en el código
# ...

# Commit y push
git add .
git commit -m "Descripción de los cambios"
git push
\`\`\`

El juego se actualizará automáticamente en 1-2 minutos.

## 🐛 Solución de Problemas

### El workflow falla
1. Ve a **Actions** en GitHub
2. Click en el workflow fallido
3. Revisa los logs para ver el error
4. Errores comunes:
   - Permisos: Ve a Settings → Actions → General → Workflow permissions → "Read and write permissions"
   - Build error: Verifica que `npm run build` funcione localmente

### La página muestra 404
1. Verifica que GitHub Pages esté habilitado
2. Espera 5 minutos (a veces tarda)
3. Verifica la URL (debe ser `https://TU-USUARIO.github.io/NOMBRE-REPO/`)
4. Limpia caché del navegador (Ctrl+Shift+R)

### Los assets no cargan
1. Verifica que `vite.config.js` tenga `base: './'`
2. Rebuild y redeploy:
   \`\`\`bash
   npm run build
   git add dist
   git commit -m "Rebuild"
   git push
   \`\`\`

## 📊 Verificar el Despliegue

### En GitHub
1. Ve a **Actions**
2. Deberías ver:
   - ✅ Build (compilar el juego)
   - ✅ Deploy (subir a GitHub Pages)

### En tu navegador
1. Abre `https://TU-USUARIO.github.io/bcrp-game/`
2. Deberías ver el juego funcionando
3. Abre la consola (F12) para verificar que no haya errores

## 🎯 Dominio Personalizado (Opcional)

Si tienes un dominio propio:

1. En Settings → Pages → Custom domain
2. Ingresa tu dominio: `juego.tudominio.com`
3. En tu proveedor de DNS, agrega un CNAME:
   \`\`\`
   juego.tudominio.com → TU-USUARIO.github.io
   \`\`\`
4. Espera propagación DNS (5-30 minutos)

## 📱 Compartir tu Juego

Una vez desplegado, puedes compartir:

\`\`\`
🎮 Juega mi juego de economía del BCRP:
https://TU-USUARIO.github.io/bcrp-game/

Controla la inflación, el tipo de cambio y mantén 
la economía peruana estable. ¿Puedes llegar a 1000 puntos?
\`\`\`

## 🔐 Hacer el Repositorio Privado

Si quieres que el código sea privado pero el juego público:

1. Settings → General → Danger Zone
2. "Change repository visibility" → Private
3. El juego seguirá siendo público en GitHub Pages
4. Solo el código será privado

## ✅ Checklist Final

- [ ] Código subido a GitHub
- [ ] GitHub Pages habilitado (Source: GitHub Actions)
- [ ] Workflow ejecutado exitosamente (✅ verde)
- [ ] Juego accesible en `https://TU-USUARIO.github.io/bcrp-game/`
- [ ] LocalStorage funciona (tu puntuación se guarda)
- [ ] Audio funciona (click para activar)
- [ ] Responsive (funciona en diferentes tamaños de pantalla)

## 🎉 ¡Listo!

Tu juego está en línea y accesible para todo el mundo. Comparte el link y que disfruten aprendiendo sobre política monetaria del BCRP.
