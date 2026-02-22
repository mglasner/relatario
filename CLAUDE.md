# La Mansión de Aventuras

Videojuego web creado como proyecto familiar para aprender HTML, CSS y JavaScript.

## Estructura del proyecto

```text
mansion-de-aventuras/
├── assets/
│   └── img/
│       ├── personajes/       # Avatares (.webp) de los personajes jugables
│       ├── enemigos/         # Avatares (.webp) de los enemigos
│       ├── sprites-plat/     # Sprite sheets PNG para el platformer (hab4)
│       ├── habitaciones/     # Ilustraciones de habitaciones para el Heroario
│       ├── llaves/           # Imágenes de llaves por habitación
│       ├── pasillo/          # Decoraciones del pasillo (cuadros, enredaderas)
│       └── icons/            # Favicon e iconos PWA
├── datos/                    # Fuente de verdad en YAML (genera JS via build-datos)
│   ├── personajes.yaml       # Personajes jugables: stats, colores, descripciones
│   ├── enemigos.yaml         # Enemigos organizados en tiers
│   ├── habitacion1.yaml      # Config del laberinto 2D
│   ├── habitacion2.yaml      # Config del laberinto 3D
│   ├── habitacion3.yaml      # Config del memorice
│   └── habitacion4.yaml      # Config del platformer
├── js/
│   ├── entidades.js          # Clases base: Entidad, Personaje, Enemigo
│   ├── personajes.js         # ⚙️ Generado desde datos/personajes.yaml
│   ├── enemigos.js           # ⚙️ Generado desde datos/enemigos.yaml
│   ├── juego.js              # Lógica principal, coordina componentes y game loop
│   ├── laberinto.js          # Generador procedural de laberintos (hab1 y hab2)
│   ├── eventos.js            # Nombres de eventos custom centralizados
│   ├── utils.js              # Utilidades compartidas
│   ├── componentes/          # ~17 componentes UI (crean su propio HTML desde JS)
│   ├── habitaciones/         # 4 subdirectorios, uno por habitación
│   │   ├── habitacion1/      # El Laberinto (6 módulos)
│   │   ├── habitacion2/      # El Laberinto 3D (4 módulos)
│   │   ├── habitacion3/      # El Memorice (4 módulos)
│   │   └── habitacion4/      # El Abismo — platformer (15 módulos)
│   └── motor3d/              # Motor raycasting estilo Doom para hab2 (11 módulos)
├── scripts/
│   ├── build-datos.js        # YAML → JS (personajes, enemigos, configs)
│   ├── build-html.js         # Reescribe rutas para producción
│   ├── dev.js                # BrowserSync + watcher de YAML
│   ├── watch-datos.js        # Vigila cambios en datos/*.yaml
│   ├── optimizar-imagenes.js # Optimización de imágenes
│   ├── procesar-sprites.cjs  # Extrae frames de sprite sheets IA
│   └── ensamblar-sprites.cjs # Ensambla strip final de sprites
├── index.html                # Estructura de las pantallas del juego
├── estilos.css               # Estilos visuales y animaciones
├── sw.js                     # Service Worker (cache strategies)
├── manifest.webmanifest      # Manifest PWA
└── CLAUDE.md
```

## Stack

- HTML, CSS y JavaScript puro (ES modules)
- Build de producción: esbuild (bundle + minificación)
- Deploy: GitHub Actions → GitHub Pages

## Personajes y enemigos

Definidos en `datos/personajes.yaml` y `datos/enemigos.yaml` respectivamente. El script `build-datos` genera los archivos JS a partir de estos YAML.

Cada personaje tiene: nombre, edad, vida, velocidad, estatura, clase CSS (`jugador-{nombre}`), color HUD, descripción y avatar `.webp` en `assets/img/personajes/`.

Cada enemigo tiene: nombre, tier (`esbirro`/`elite`/`pesadilla`), vida, ataques, descripción y avatar `.webp` en `assets/img/enemigos/`.

## Pantallas implementadas

1. **Selección de personaje** — Elegir personaje con animaciones al seleccionar
2. **Pasillo** — Pasillo con 4 puertas, movimiento con flechas/D-pad, Heroario y Villanario como libros flotantes
3. **Habitación 1: El Laberinto** — Laberinto 2D procedural (17×17) con trampas, esbirros y villano elite
4. **Habitación 2: El Laberinto 3D** — Laberinto en primera persona (raycasting estilo Doom, 13×13) con trampas de fuego
5. **Habitación 3: El Memorice** — Juego de memoria 4×5, emparejar héroes con villanos en 30 intentos
6. **Habitación 4: El Abismo** — Platformer 2D side-scrolling en canvas 480×270, con esbirros, boss final y llaves

## Tono y contenido (apto para niños)

El juego es apto para niños desde 7 años. Todo el contenido debe seguir estas reglas:

- **Estilo visual**: cartoon/fantasía/aventura, sin sangre ni gore. Colores variados y estilizados
- **Descripciones**: tono de aventura, fantasía y misterio, divertido, nunca violento ni gráfico (nada de "asesino", "sangre", "muerte", "infierno")
- **Ataques**: nombres de magia/sombras/misterio/aventura en vez de violencia explícita (ej: "Hechizo sombrío" en vez de "Corte maldito")
- **Imágenes**: generadas con estilo semi-cartoon, aptas para niños

## Linting y formateo

El proyecto usa ESLint v9 (flat config), Prettier y Stylelint. Todas son devDependencies en `package.json`.

| Comando                | Qué hace                            |
| ---------------------- | ----------------------------------- |
| `npm run lint`         | Verificar calidad JS con ESLint     |
| `npm run lint:fix`     | Auto-corregir problemas JS          |
| `npm run lint:css`     | Verificar calidad CSS con Stylelint |
| `npm run lint:css:fix` | Auto-corregir problemas CSS         |
| `npm run format:check` | Verificar formateo con Prettier     |
| `npm run format`       | Auto-formatear JS, CSS, HTML y JSON |

**Orden recomendado para corregir todo:**

```bash
npm run lint:fix && npm run lint:css:fix && npm run format
```

Primero los linters (que pueden cambiar lógica como `let` → `const`), luego Prettier (que solo ajusta formato).

**Configuración:**

- `eslint.config.js` — reglas: `prefer-const`, `eqeqeq`, `no-var`, `no-console` (warn)
- `.prettierrc` — 4 espacios, single quotes, printWidth 100
- `.stylelintrc.json` — extiende `stylelint-config-standard`

## Entornos: desarrollo y producción

### Desarrollo (`npm run dev`)

BrowserSync sirve los archivos fuente directamente (hot-reload en http://localhost:3000). No hay build de JS/CSS, se usan los ES modules originales:

- `index.html` carga `estilos.css` y `js/juego.js`
- Los ~50 módulos JS se cargan individualmente por el navegador
- `watch-datos.js` vigila cambios en `datos/*.yaml` y regenera los JS correspondientes
- Editar cualquier archivo recarga el navegador automáticamente

### Producción (`npm run build`)

esbuild genera la carpeta `dist/` con todo optimizado:

| Paso          | Entrada                           | Salida                                                             |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| `build:datos` | `datos/*.yaml`                    | `js/personajes.js`, `js/enemigos.js`, `js/habitaciones/*/config.js` |
| `build:js`    | `js/juego.js` + todos sus imports | `dist/juego.min.js` (1 archivo)                                    |
| `build:css`   | `estilos.css`                     | `dist/estilos.min.css`                                             |
| `build:html`  | `index.html`, `assets/`, `sw.js`  | `dist/index.html` (rutas reescritas), `dist/assets/`, `dist/sw.js` |

El script `scripts/build-html.js` reescribe las rutas en el HTML:

- `estilos.css` → `estilos.min.css`
- `js/juego.js` → `juego.min.js`

La carpeta `dist/` está en `.gitignore` — nunca se commitea.

### Deploy (GitHub Actions → GitHub Pages)

Archivo: `.github/workflows/deploy.yml`

```text
Push a main → GitHub Actions ejecuta npm run build → dist/ se despliega a GitHub Pages
```

**Configuración requerida en GitHub**: Settings → Pages → Source: **GitHub Actions**

- **URL**: https://mglasner.github.io/mansion-de-aventuras/
- **Redirect**: `mglasner.github.io` redirige al juego (repo `mglasner.github.io` con meta refresh)
- **Repo público**: requerido por GitHub Pages en plan gratuito

### Service Worker (`sw.js`)

Estrategias diferenciadas de cache para segunda visita instantánea:

- **Assets estáticos** (JS, CSS, fuentes, imágenes): cache-first
- **HTML** (navegación): network-first con fallback a cache
- **`/api/**`\*\* (futuro backend): network-only, nunca cachear

Incrementar `CACHE_NAME` en `sw.js` para invalidar el cache en actualizaciones.

## Sprites del platformer (Habitación 4)

La Habitación 4 (El Abismo) es un platformer 2D en canvas 480×270. Personajes y enemigos usan sprite sheets PNG (strips horizontales de 48×60 px por frame), con fallback a sprites procedurales.

- **Sprite sheets**: `assets/img/sprites-plat/{nombre}.png`
- **Layouts**: 9 frames (sin ataques) o 15 frames (con ataques). El valor de `frames` en `SPRITE_SHEETS` de `spritesPlat.js` determina el layout automáticamente
- **Renderizado**: sprite 48×60 centrado sobre hitbox de 12×14 (pies alineados abajo)
- **Creación de nuevos sprites**: ver skill `/crear-personaje` → `references/sprites-plat.md`

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#seleccion-personaje`, `#btn-jugar`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`jugador-{nombre}`) con colores y animaciones individuales; cada enemigo tiene `.villano-{nombre}`
- Imágenes: personajes en `assets/img/personajes/`, enemigos en `assets/img/enemigos/`, sprites en `assets/img/sprites-plat/` (todas `.webp` excepto sprites que son `.png`)
- Código simple y comentado para fines educativos
- **Componentes**: Módulos JS que crean su propio HTML con DOM API, exportan una función `crear*(contenedor)` que retorna un objeto con métodos (mostrar, ocultar, actualizar, etc.)
- **Habitaciones**: Módulos autocontenidos que crean/destruyen su pantalla al entrar/salir. Se comunican con juego.js mediante callbacks y eventos custom (`document.dispatchEvent`)
- **Heroario ↔ Habitaciones**: El Heroario (`js/componentes/libroHeroes.js`) contiene descripciones de cada habitación en `HABITACIONES_HEROARIO`. Al modificar la mecánica o contenido de una habitación, verificar que las descripciones del Heroario sigan siendo consistentes
- **Revisión pre-commit**: Después de escribir o refactorizar código, ejecutar primero los linters (`npm run lint:fix && npm run lint:css:fix && npm run format`) y luego la skill `/review-code` antes de hacer commit
