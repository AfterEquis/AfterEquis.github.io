# AfterX — Web Personal

Sitio web personal y portfolio de **AfterX** («After»), estudiante de informática y creador de contenido en español.

Diseñado con una estética retro-futurista estilo **VHS / CRT / Cyberpunk / Glitch**, con efectos de aberración cromática, refracción de lente translúcida (*glassmorphism*), scanlines, grano analógico y controles interactivos tipo OSD.

---

## ⚡ Características principales

* **Arquitectura moderna y ligera**: Desarrollado con **Vite** y **Vanilla JavaScript**, sin frameworks ni librerías pesadas.
* **Diseño visual inmersivo**:
  * Filtros SVG procedurales para desgarro de señal (*tear*), aberración cromática y refracción de lente en escritorio.
  * Scanlines, líneas de ruido y partículas dinámicas de fondo.
  * Transición con efecto glitch al conmutar entre canales.
  * **Modo Gaming con múltiples estilos de fondo interactivos**:
    * **Marathon**: Estética de Runner táctico de alta visibilidad (amarillo/rojo, glifos tácticos, barrido láser y telemetría).
    * **DedSec**: Estética cyber-hacker inspirada en Watch Dogs (lluvia de código ASCII/hexadecimal, calavera procedural animada, crosshair ctOS y verde ácido/cian neón).
    * **Arcane**: Estética inspirada en la serie de Netflix (núcleo Hextech celestial y anillos Art Deco, partículas y ascuas de Shimmer violeta/esmeralda de Zaun, rayos arcanos y relámpagos inestables).
* **Integración con GitHub API**:
  * Carga dinámica de repositorios públicos de [@AfterEquis](https://github.com/AfterEquis).
  * Exclusión automática de forks y ordenación por actividad reciente.
  * Sistema de caché en `localStorage` (1 hora) y tolerancia a fallos/límites de cuota.
* **Integración con YouTube**:
  * Consulta en tiempo de build del feed RSS de [@afterxesp](https://youtube.com/@afterxesp) mediante `scripts/fetch-youtube.js`.
  * Generación estática de `videos.json` sin exponer API keys en el cliente.
  * Flujo de actualización automática diaria con GitHub Actions.
* **Compartir y SEO**:
  * Metadatos completos Open Graph y Twitter Cards.
  * Imagen de portada personalizada de 1200×630 px generada con la estética de la página.
  * Favicons adaptados para navegadores y dispositivos móviles.
* **Accesibilidad y Rendimiento**:
  * Adaptación responsive optimizada para dispositivos móviles (390px).
  * Soporte estricto para `prefers-reduced-motion` (desactiva sacudidas, aberraciones y animaciones continuas).
  * Navegación por pestañas accesible mediante teclado (WAI-ARIA con teclas de flecha, Home y End).

---

## 🚀 Desarrollo local

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre en tu navegador la URL indicada (habitualmente `http://localhost:5173`).

3. **Compilar para producción**:
   ```bash
   npm run build
   ```
   Este comando actualizará primero `videos.json` con el último vídeo de YouTube y compilará la aplicación optimizada en la carpeta `dist/`.

4. **Previsualizar la compilación**:
   ```bash
   npm run preview
   ```

---

## 🌐 Despliegue en GitHub Pages

El proyecto incluye dos flujos de trabajo de **GitHub Actions** en `.github/workflows/`:

1. **`deploy.yml`**: Compila y publica automáticamente la web en GitHub Pages ante cada `push` a la rama `main` o `master`.
2. **`update-videos.yml`**: Se ejecuta diariamente a las 06:00 UTC para revisar y actualizar el último vídeo del canal de YouTube.

### Pasos para activar GitHub Pages en tu repositorio:
1. Sube este repositorio a tu cuenta de GitHub (por ejemplo en `https://github.com/AfterEquis/afterx` o como tu repositorio de usuario `AfterEquis.github.io`).
2. En GitHub, ve a **Settings** → **Pages**.
3. En la sección **Build and deployment**, en el desplegable **Source**, selecciona:
   **GitHub Actions**.
4. ¡Listo! El workflow se encargará de compilar y desplegar tu web automáticamente.
