# Plan: Optimización de performance para deploy público

## Contexto

La Casa del Terror será desplegada como app web pública. El análisis completo de la
base de código reveló problemas de rendimiento en tres categorías: **assets pesados**,
**game loops ineficientes** y **ausencia de pipeline de producción**.

## Diagnóstico actual

### Inventario de assets (problema principal)

| Asset | Tamaño | Formato |
|-------|--------|---------|
| pandajuro.png | 1,899 KB | PNG |
| rose.png | 1,680 KB | PNG |
| lina.png | 1,470 KB | PNG |
| siniestra.png | 1,019 KB | PNG |
| trasgo.png | 1,013 KB | PNG |
| cuadro-castillo.png | 985 KB | PNG |
| errante.png | 964 KB | PNG |
| profano.png | 757 KB | PNG |
| hana.png | 637 KB | PNG |
| kira.png | 623 KB | PNG |
| donbu.png | 608 KB | PNG |
| cuadro-retrato.png | 464 KB | PNG |
| **Total imágenes** | **~10.6 MB** | **Todo PNG** |
| Total JS (25 archivos) | ~150 KB | Sin minificar |
| estilos.css | 51.4 KB | Sin minificar |
| Fuentes (2 woff2) | 55 KB | Correcto |

**El 98% del peso de la app son imágenes PNG sin optimizar.**

### Game loops con reflows forzados

```
Pasillo (juego.js) — 60fps:
├── detectarColisionPuertas()
│   ├── document.querySelectorAll('.puerta')     → DOM query cada frame
│   ├── puerta.getBoundingClientRect() × 4       → 4 reflows forzados
│   └── pasillo.getBoundingClientRect()          → 1 reflow más
├── getVelocidad() → pasillo.clientWidth         → layout query cada frame
├── getTamPersonaje() → offsetWidth              → layout query cada frame
└── actualizarPosicion() → style.left/top        → reflow en movimiento

Laberinto (habitacion1) — 60fps:
├── actualizarPosicion() → style.left/top        → reflow en movimiento
├── actualizarTrasgo() → style.left/top          → reflow en movimiento
└── renderizarLaberinto() → 150+ appendChild     → sin DocumentFragment

Raycasting (habitacion2 + motor3d/) — 60fps:
├── new Array(NUM_RAYOS) cada frame              → presión GC (raycaster.js:18)
├── string concat RGB × 320 columnas             → basura temporal (raycaster.js:121,132,143)
├── ctx.shadowBlur en sprites × cada visible     → costoso en canvas (sprites.js:42)
├── ctx.shadowBlur en minimapa × 2               → costoso en canvas (minimapa.js:53,74)
├── array sprites[] + objetos nuevos cada frame  → presión GC (habitacion2.js:236-259)
├── array decoSprites[] nuevo cada frame          → presión GC (decoraciones.js:162-210)
├── array cercanas[] + objetos cada frame         → presión GC (particulas.js:159-166)
├── string concat fillStyle en partículas         → basura temporal (particulas.js:247)
└── Float32Array mapaLuz cada 3 frames            → allocación periódica (iluminacion.js:10)

Motor 3D — patrones BUENOS ya implementados:
├── Object pool de 200 partículas preallocado    ✓ (particulas.js)
├── Texturas generadas una vez como offscreen     ✓ (texturas.js)
├── Minimapa base pre-renderizado                 ✓ (minimapa.js)
├── Gradientes pre-creados fuera del loop         ✓ (habitacion2.js)
├── Culling por distancia en sprites/partículas   ✓
├── Fallback adaptativo: desactiva texturas       ✓ (habitacion2.js:192-203)
└── Cleanup completo al salir con cancelAnimationFrame ✓
```

### Lo que falta para producción

- Sin bundler ni minificación (25 requests HTTP para JS)
- Sin compresión gzip/brotli
- Sin service worker ni cache offline
- Sin lazy loading de imágenes
- Sin `<link rel="preload">` para assets críticos
- Sin meta tags SEO/OG para compartir
- Sin favicon

---

## Plan de optimización

### Fase 1: Imágenes (impacto ~95% del peso total)

**Objetivo**: Reducir de ~10.6 MB a ~500 KB-1 MB total.

#### 1.1 Convertir a WebP con fallback

Generar versiones WebP de todas las imágenes. WebP logra 80-90% de reducción vs PNG
en imágenes con transparencia.

```bash
# Instalar sharp-cli o usar squoosh-cli como devDependency
npx @squoosh/cli --webp '{quality:80}' assets/img/**/*.png
```

Estructura resultante:
```
assets/img/personajes/
├── lina.webp          (~150-200 KB vs 1,470 KB)
├── lina.png           (fallback)
├── rose.webp
├── rose.png
...
```

#### 1.2 Redimensionar imágenes al tamaño real de uso

Las imágenes de personajes se muestran a ~100-150px pero pesan 1-2 MB porque son
mucho más grandes. Generar versiones al tamaño máximo real de display:

| Uso | Tamaño máximo display | Resolución óptima (@2x retina) |
|-----|----------------------|-------------------------------|
| Avatar en tarjeta selección | ~120px | 240px |
| Avatar en barra superior | ~40px | 80px |
| Avatar en combate | ~100px | 200px |
| Enemigos | ~100px | 200px |
| Cuadros del pasillo | ~150px | 300px |

#### 1.3 Lazy loading para imágenes no visibles

Las imágenes de enemigos y cuadros del pasillo no se ven en la pantalla inicial.
Agregar `loading="lazy"` donde se creen con JS, o cargar bajo demanda al entrar
a cada pantalla.

**Archivos a modificar**: `js/juego.js` (donde se crean las tarjetas de villanos
y elementos del pasillo).

---

### Fase 2: Game loops sin reflows (impacto en FPS en dispositivos lentos)

#### 2.1 Reemplazar `style.left/top` por `transform: translate()`

En todos los elementos que se mueven cada frame, cambiar:

```js
// ANTES (causa reflow)
elemento.style.left = x + 'px';
elemento.style.top = y + 'px';

// DESPUÉS (compositor GPU, sin reflow)
elemento.style.transform = `translate(${x}px, ${y}px)`;
```

**Archivos a modificar**:
- `js/juego.js` — `actualizarPosicion()` del pasillo
- `js/habitaciones/habitacion1/index.js` — `actualizarPosicion()` del jugador
- `js/habitaciones/habitacion1/trasgo.js` — `actualizarTrasgo()`

**Ajustes CSS necesarios**: Los elementos móviles necesitan `position: absolute`
con `left: 0; top: 0` fijos, y todo el movimiento via transform. Verificar que
las colisiones sigan funcionando (getBoundingClientRect reporta la posición
visual incluyendo transforms).

#### 2.2 Cachear DOM queries y layout reads fuera del loop

```js
// ANTES — en juego.js, ejecutado cada frame
function detectarColisionPuertas() {
    const puertas = document.querySelectorAll('.puerta');  // query cada frame
    puertas.forEach(puerta => {
        const rect = puerta.getBoundingClientRect();       // reflow cada frame
    });
}

// DESPUÉS — cachear una vez, actualizar en resize
let puertasCache = [];
function cachearPuertas() {
    puertasCache = [...document.querySelectorAll('.puerta')].map(p => ({
        elemento: p,
        rect: p.getBoundingClientRect()
    }));
}
window.addEventListener('resize', cachearPuertas);
// Llamar cachearPuertas() al iniciar el pasillo

function detectarColisionPuertas() {
    puertasCache.forEach(({ elemento, rect }) => { ... });
}
```

**Lo mismo aplica para**:
- `getVelocidad()` → cachear `pasillo.clientWidth`
- `getTamPersonaje()` → cachear `personajeJugador.offsetWidth`

**Archivos a modificar**: `js/juego.js`

#### 2.3 DocumentFragment para renderizado del laberinto

```js
// ANTES — 150+ appendChild individuales
for (...) {
    est.contenedorLaberinto.appendChild(pared);
}

// DESPUÉS — un solo append
const fragment = document.createDocumentFragment();
for (...) {
    fragment.appendChild(pared);
}
est.contenedorLaberinto.appendChild(fragment);
```

**Archivo a modificar**: `js/habitaciones/habitacion1/index.js` — `renderizarLaberinto()`

#### 2.4 Optimizar motor 3D (motor3d/ + habitacion2)

El commit `d334ab7` descompuso habitacion2.js en 8 módulos en `js/motor3d/`.
El refactor trajo buenos patrones (object pool, texturas cacheadas, fallback
adaptativo), pero introdujo nuevas allocaciones por frame que necesitan corregirse:

**a) Preallocar zBuffer como typed array** (`raycaster.js:18`):

```js
// ANTES — aloca array genérico cada frame
const zBuffer = new Array(numRayos);

// DESPUÉS — preallocar fuera del loop como typed array
let _zBuffer = new Float64Array(320);  // se inicializa con numRayos real en init
export function renderizar3D(...) {
    _zBuffer.fill(0);  // resetear sin allocar
    // usar _zBuffer en vez de crear uno nuevo
}
```

**b) Eliminar `ctx.shadowBlur` en sprites y minimapa** (`sprites.js:42`, `minimapa.js:53,74`):

`shadowBlur` en Canvas 2D ejecuta un desenfoque gaussiano por cada operación de dibujo.
En sprites se ejecuta por cada sprite visible cada frame. Alternativas:
- Pre-renderizar el glow en un canvas offscreen por sprite
- Usar un pseudo-glow con `globalAlpha` + fillRect más grande detrás del emoji
- Simplemente eliminar el glow (mínimo impacto visual)

**c) Reutilizar arrays de sprites y decoraciones** (`habitacion2.js:236-259`, `decoraciones.js:162-210`):

```js
// ANTES — arrays nuevos cada frame
const sprites = [];
sprites.push({ x, y, emoji, color });

// DESPUÉS — preallocar y reutilizar con contador
const _sprites = new Array(MAX_SPRITES);  // preallocar objetos
let _spriteCount = 0;
function resetSprites() { _spriteCount = 0; }
function pushSprite(x, y, emoji, color) {
    const s = _sprites[_spriteCount];
    s.x = x; s.y = y; s.emoji = emoji; s.color = color;
    _spriteCount++;
}
```

Mismo patrón para `cercanas[]` en `particulas.js:159-166`.

**d) Cachear strings de fillStyle** (`raycaster.js:121,132`, `particulas.js:247`):

```js
// ANTES — string nuevo por cada rayo/partícula
ctx.fillStyle = 'rgba(0,0,0,' + oscuridad.toFixed(2) + ')';

// DESPUÉS — LUT de strings pre-generados
const SOMBRAS = Array.from({ length: 101 }, (_, i) =>
    'rgba(0,0,0,' + (i / 100).toFixed(2) + ')'
);
ctx.fillStyle = SOMBRAS[Math.round(oscuridad * 100)];
```

**e) Preallocar Float32Array del mapa de luz** (`iluminacion.js:10`):

Reutilizar el mismo buffer entre llamadas (cada 3 frames) en vez de crear
un `Float32Array` nuevo.

**f) Mejorar el fallback adaptativo** (`habitacion2.js:192-203`):

Actualmente solo tiene 2 modos (texturas on/off). Agregar un nivel intermedio
que reduzca `numRayos` a la mitad (duplicando `anchoFranja`), lo que reduce
las llamadas al canvas API de ~320 a ~160 por frame.

**Archivos a modificar**:
- `js/motor3d/raycaster.js` — zBuffer, LUT de colores
- `js/motor3d/sprites.js` — eliminar shadowBlur
- `js/motor3d/minimapa.js` — eliminar shadowBlur
- `js/motor3d/particulas.js` — reutilizar arrays, cachear fillStyle
- `js/motor3d/decoraciones.js` — reutilizar array de sprites
- `js/motor3d/iluminacion.js` — reutilizar Float32Array
- `js/habitaciones/habitacion2.js` — reutilizar array sprites, mejorar fallback

---

### Fase 3: CSS — animaciones eficientes

#### 3.1 Reemplazar animaciones `box-shadow` por alternativas GPU

```css
/* ANTES — box-shadow no va al compositor */
@keyframes pulso {
    0%, 100% { box-shadow: 0 0 15px rgba(...); }
    50% { box-shadow: 0 0 30px rgba(...); }
}

/* DESPUÉS — pseudo-elemento con opacity */
.personaje.seleccionado::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: 0 0 30px rgba(...);
    animation: pulso-opacity 1.5s infinite;
}
@keyframes pulso-opacity {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
}
```

Aplicar el mismo patrón a `trasgo-respirar`.

#### 3.2 Barra de vida: `scaleX` en vez de `width`

```css
/* ANTES */
.barra-vida-relleno { transition: width 0.3s; }

/* DESPUÉS */
.barra-vida-relleno {
    transform-origin: left;
    transition: transform 0.3s;
    /* En JS: elemento.style.transform = `scaleX(${porcentaje})` */
}
```

#### 3.3 Agregar `contain` a pantallas autocontenidas

```css
#laberinto { contain: layout paint; }
#pasillo { contain: layout paint; }
.habitacion-2-contenedor { contain: layout paint; }
```

Esto le dice al navegador que los cambios dentro del contenedor no afectan el
layout exterior, permitiendo optimizaciones de rendering.

**Archivo a modificar**: `estilos.css`

---

### Fase 4: Build pipeline con GitHub Actions

> **Contexto**: El proyecto se despliega en GitHub Pages desde `main` hoy,
> pero a futuro tendrá un backend real. El build pipeline debe ser portable
> y no atarse a las limitaciones de GitHub Pages.

#### 4.1 Build con esbuild + deploy con GitHub Actions

GitHub Actions es la opción correcta: automatiza el build en cada push,
no contamina el repo con archivos generados, y el workflow se adapta
fácilmente cuando el proyecto migre a otro hosting con backend.

```bash
npm install -D esbuild
```

```json
{
    "scripts": {
        "build": "npm run build:js && npm run build:css && npm run build:html",
        "build:js": "esbuild js/juego.js --bundle --minify --outfile=dist/juego.min.js --format=esm",
        "build:css": "esbuild estilos.css --minify --outfile=dist/estilos.min.css",
        "build:html": "node scripts/build-html.js"
    }
}
```

Workflow `.github/workflows/deploy.yml`:
- Trigger: push a `main`
- Steps: `npm ci` → `npm run build` → `actions/deploy-pages` sobre `dist/`
- Agregar `dist/` al `.gitignore` (no commitear archivos generados)

Resultado del build:
- Bundlea 25 archivos JS en 1 (elimina 24 requests HTTP)
- Minifica JS (~150 KB → ~60-70 KB)
- Minifica CSS (~51 KB → ~30-35 KB)

#### 4.2 Agregar meta tags para web pública

```html
<meta name="description" content="La Casa del Terror - Un juego web de aventura y misterio para toda la familia">
<meta name="theme-color" content="#1a0a2e">
<meta property="og:title" content="La Casa del Terror">
<meta property="og:description" content="Juego web de aventura y misterio">
<meta property="og:image" content="https://mglasner.github.io/la-casa-del-terror/assets/img/og-preview.png">
<meta property="og:url" content="https://mglasner.github.io/la-casa-del-terror/">
<link rel="icon" type="image/png" href="assets/img/favicon.png">
```

**Nota**: La URL de `og:image` debe ser absoluta. Actualizar cuando el
dominio cambie al migrar de hosting.

#### 4.3 Preload de assets críticos

```html
<link rel="preload" href="assets/fonts/creepster-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/quicksand-variable-latin.woff2" as="font" type="font/woff2" crossorigin>
```

**Archivo a modificar**: `index.html`

---

### Fase 5: Entrega y caching

> **Contexto**: Hoy el hosting es GitHub Pages (gzip automático, cache fijo
> de 10 min, sin configuración de headers). A futuro habrá un backend donde
> los cache headers serán configurables. El service worker debe diseñarse
> con ambos escenarios en mente.

#### 5.1 Compresión

GitHub Pages ya sirve con gzip. Cuando se migre a un hosting con backend,
verificar que gzip o brotli estén habilitados en el servidor.

Impacto esperado con el build de Fase 4:
- JS minificado: ~65 KB → ~20 KB gzip
- CSS minificado: ~35 KB → ~10 KB gzip
- Total código: ~30 KB gzip (vs ~200 KB sin minificar sin comprimir)

#### 5.2 Cache headers

**Hoy (GitHub Pages)**: `max-age=600` fijo, no configurable. Los archivos
que no cambian se resuelven con `304 Not Modified`.

**Futuro (hosting con backend)**: Configurar cache diferenciado:
```
assets/**/*  → Cache-Control: public, max-age=31536000, immutable
dist/*.min.* → Cache-Control: public, max-age=31536000, immutable
index.html   → Cache-Control: no-cache
/api/**      → Cache-Control: no-store
```

#### 5.3 Service Worker

El service worker debe usar estrategias diferenciadas desde el inicio,
preparándose para cuando haya llamadas a un backend:

```js
// sw.js — estrategias por tipo de recurso
const CACHE_NAME = 'casa-terror-v1';

// Assets estáticos: cache-first (JS, CSS, fuentes, imágenes)
// Se actualizan solo cuando cambia CACHE_NAME
const STATIC_ASSETS = [
    '/la-casa-del-terror/dist/juego.min.js',
    '/la-casa-del-terror/dist/estilos.min.css',
    // ... fonts e imágenes
];

// HTML: network-first con fallback a cache
// Garantiza que el usuario siempre vea la versión más reciente

// API (futuro): network-only, nunca cachear
// Las rutas /api/** van directo al servidor
```

Beneficios:
- Carga instantánea en segunda visita (cache local, no depende del servidor)
- Compensar el cache de 10 min de GitHub Pages mientras se use
- Preparado para backend: las rutas `/api/**` nunca se cachean
- Actualización en background cuando hay nueva versión

**Archivos a crear**: `sw.js` (en la raíz), registro en `index.html`.

**Nota sobre rutas**: GitHub Pages sirve bajo `/la-casa-del-terror/`. Este
prefijo deberá actualizarse si el dominio/path cambia al migrar de hosting.

---

## Resumen de impacto esperado

| Métrica | Actual | Después | Mejora |
|---------|--------|---------|--------|
| **Peso total imágenes** | ~10.6 MB | ~500 KB-1 MB | **90-95%** |
| **Peso JS** | ~150 KB (25 requests) | ~65 KB (1 request) | **57% peso, 96% requests** |
| **Allocaciones GC/frame** (hab2) | ~350+ objetos/strings | ~0 (preallocado) | **~100%** |
| **Peso CSS** | ~51 KB | ~35 KB | **30%** |
| **Total descarga** (con gzip) | ~11 MB+ | ~600 KB-1.1 MB | **~90%** |
| **Reflows por frame** (pasillo) | 7+ | 0 | **100%** |
| **Reflows por frame** (laberinto) | 2+ | 0 | **100%** |
| **First Contentful Paint** | Lento (imágenes bloquean) | Rápido (preload fuentes, lazy imgs) | Significativo |

## Orden de implementación recomendado

1. **Fase 1** (imágenes) — Mayor impacto absoluto, afecta a todos los usuarios
2. **Fase 2** (game loops) — Crítico para dispositivos móviles/lentos
3. **Fase 4** (build pipeline) — Necesario para reducir requests HTTP
4. **Fase 3** (CSS) — Mejoras incrementales
5. **Fase 5** (entrega y caching) — Service worker con estrategias diferenciadas

## Notas

- **Deploy actual**: GitHub Pages desde `main` (`mglasner.github.io/la-casa-del-terror/`)
- **Deploy futuro**: Se prevé migración a hosting con backend. El build pipeline
  (GitHub Actions) y el service worker están diseñados para ser portables
- Todas las optimizaciones son retrocompatibles con `npm run dev`
- El build pipeline es solo para producción; en desarrollo se usan los fuentes
- Las optimizaciones de game loop no cambian la lógica del juego
- Las URLs de Open Graph (`og:image`) deben actualizarse al cambiar de dominio
