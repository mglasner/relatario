# El Relatario

Plataforma narrativa interactiva — un compendio de relatos, héroes y desafíos para contar en familia. Creada como proyecto familiar para aprender HTML, CSS y JavaScript.

## Estructura del proyecto

```text
mansion-de-aventuras/
├── assets/
│   └── img/
│       ├── personajes/       # Avatares (.webp) de los personajes jugables
│       ├── enemigos/         # Avatares (.webp) de los enemigos
│       ├── sprites-plat/     # Sprite sheets PNG para el platformer
│       ├── juegos/           # Ilustraciones de juegos para el Libro de Juegos
│       ├── biblioteca/       # Fondo e imágenes de la homepage (sala-fondo, lomos)
│       └── icons/            # Favicon e iconos PWA
├── css/                      # Estilos modulares (@import desde estilos.css)
│   ├── base.css              # Variables, fuentes, reset, dark mode, .oculto
│   ├── componentes/
│   │   ├── modales.css       # Modal salir + modal derrota
│   │   ├── barra-superior.css # HUD del jugador
│   │   ├── transiciones.css  # Fade, wipe, iris
│   │   ├── dpad.css          # D-pad virtual + split
│   │   ├── overlay-rotar.css # "Gira tu dispositivo"
│   │   └── toast.css         # Notificaciones flotantes
│   ├── libros/
│   │   ├── entidades.css     # Colores personajes/villanos, stats, tiers
│   │   ├── comun.css         # Libro layout, tabs, paneles, prólogo, modal
│   │   ├── heroario.css      # Estilos específicos del heroario
│   │   ├── villanario.css    # Página de rangos
│   │   ├── libroJuegos.css   # Páginas de juegos, selector héroe, modal héroe
│   │   └── cuento.css        # Tipografía narrativa para libros de cuentos
│   ├── juegos/
│   │   ├── comun.css         # Paletas .juego-*, cabecera, btn-huir
│   │   ├── laberinto.css     # El Laberinto (laberinto 2D)
│   │   ├── laberinto3d.css   # El Laberinto 3D (raycasting)
│   │   ├── memorice.css      # El Memorice (memoria)
│   │   └── abismo.css        # El Abismo (platformer)
│   └── biblioteca/
│       └── biblioteca.css    # Estante homepage
├── cuentos/                  # Libros de cuentos (markdown + yaml)
│   └── {slug}/               # Cada cuento en su directorio
│       ├── libro.yaml        # Metadata: titulo, color, publicado, capitulos
│       ├── *.md              # Capítulos en markdown
│       └── assets/           # Lomo, portada e ilustraciones
├── datos/                    # Fuente de verdad en YAML (genera JS via build-datos)
│   ├── personajes.yaml       # Personajes jugables: stats, colores, descripciones
│   ├── enemigos.yaml         # Enemigos organizados en tiers
│   ├── laberinto.yaml        # Config del laberinto 2D
│   ├── laberinto3d.yaml      # Config del laberinto 3D
│   ├── memorice.yaml         # Config del memorice
│   └── abismo.yaml           # Config del platformer
├── js/
│   ├── entidades.js          # Clases base: Entidad, Personaje, Enemigo
│   ├── personajes.js         # ⚙️ Generado desde datos/personajes.yaml
│   ├── enemigos.js           # ⚙️ Generado desde datos/enemigos.yaml
│   ├── juego.js              # State machine central: BIBLIOTECA → LIBRO → JUEGO
│   ├── laberinto.js          # Generador procedural de laberintos
│   ├── eventos.js            # Nombres de eventos custom centralizados
│   ├── utils.js              # Utilidades compartidas
│   ├── cuentos/
│   │   └── registro.js       # ⚙️ Generado desde cuentos/ (build-cuentos)
│   ├── componentes/          # Componentes UI (crean su propio HTML desde JS)
│   │   ├── estante.js        # Homepage: mueble con lomos de libros
│   │   ├── libroJuegos.js    # Libro de Juegos con selector de héroe
│   │   ├── libroCuento.js    # Adapta cuento → crearLibro() genérico
│   │   ├── modalLibro.js     # Modal reutilizable para mostrar libros
│   │   ├── libro.js          # Motor genérico de libro (índice + detalle)
│   │   ├── libroHeroes.js    # Heroario (contenido y páginas)
│   │   ├── libroVillanos.js  # Villanario (contenido y páginas)
│   │   └── ...               # barraSuperior, modalSalir, modalDerrota, etc.
│   ├── juegos/               # 4 juegos autocontenidos
│   │   ├── laberinto/        # El Laberinto (laberinto 2D)
│   │   ├── laberinto3d/      # El Laberinto 3D (raycasting)
│   │   ├── memorice/         # El Memorice (memoria)
│   │   └── abismo/           # El Abismo (platformer 2D)
│   └── motor3d/              # Motor raycasting estilo Doom para El Laberinto 3D
├── scripts/
│   ├── build-datos.js        # YAML → JS (personajes, enemigos, configs)
│   ├── build-cuentos.js      # cuentos/ → js/cuentos/registro.js
│   ├── nuevo-cuento.js       # CLI: crea estructura de cuento nuevo
│   ├── build-html.js         # Reescribe rutas para producción
│   ├── dev.js                # BrowserSync + watcher de YAML
│   ├── watch-datos.js        # Vigila cambios en datos/*.yaml y cuentos/
│   ├── optimizar-imagenes.js # Optimización de imágenes
│   ├── procesar-sprites.cjs  # Extrae frames de sprite sheets IA
│   └── ensamblar-sprites.cjs # Ensambla strip final de sprites
├── index.html                # Estructura mínima: #juego > #biblioteca
├── estilos.css               # Estilos visuales y animaciones
├── sw.js                     # Service Worker (cache strategies)
├── manifest.webmanifest      # Manifest PWA
└── CLAUDE.md
```

## Stack

- HTML, CSS y JavaScript puro (ES modules)
- Build de producción: esbuild (bundle + minificación)
- Deploy: GitHub Actions → GitHub Pages

## Flujo de navegación

```text
Estante (homepage) → Libro abierto (modal)
                         ↓ (Libro de Juegos)
                    Elegir héroe + Jugar → Juego (fullscreen)
                         ↑ (ganar/perder/huir)
```

**Estados de la state machine** (`js/juego.js`):
- **BIBLIOTECA**: Homepage con estante de madera y lomos de libros (3 fijos + cuentos publicados)
- **LIBRO**: Libro abierto en modal (Heroario, Villanario, Libro de Juegos, o cuentos)
- **JUEGO**: Juego en pantalla completa (los 4 desafíos)

La selección de héroe ocurre dentro del Libro de Juegos (cada página de juego tiene un selector de avatares + botón "Jugar"). Los juegos son independientes, sin llaves secuenciales.

## Personajes y enemigos

Definidos en `datos/personajes.yaml` y `datos/enemigos.yaml` respectivamente. El script `build-datos` genera los archivos JS a partir de estos YAML.

Cada personaje tiene: nombre, edad, vida, velocidad, estatura, clase CSS (`jugador-{nombre}`), color HUD, descripción y avatar `.webp` en `assets/img/personajes/`.

Cada enemigo tiene: nombre, tier (`esbirro`/`elite`/`pesadilla`), vida, ataques, descripción y avatar `.webp` en `assets/img/enemigos/`.

## Los 4 juegos (desafíos)

1. **El Laberinto** — Laberinto 2D procedural (17×17) con trampas, esbirros y villano elite
2. **El Laberinto 3D** — Laberinto en primera persona (raycasting estilo Doom, 13×13) con trampas de fuego
3. **El Memorice** — Juego de memoria 4×5, emparejar héroes con villanos en 30 intentos
4. **El Abismo** — Platformer 2D side-scrolling en canvas 480×270, con esbirros y boss final

## Libros de cuentos

Sistema para agregar libros narrativos (cuentos, historias) al estante. Los cuentos se escriben en markdown y se convierten a HTML en build-time.

### Crear un cuento nuevo

```bash
npm run nuevo-cuento -- "Título del cuento" [--slug mi-slug]
```

Genera la estructura en `cuentos/{slug}/` con `libro.yaml` (publicado: false), `cap-01.md` y `assets/`.

### Estructura de un cuento

```text
cuentos/{slug}/
├── libro.yaml          # Metadata (titulo, subtitulo, color, portada, lomo, publicado, capitulos)
├── cap-01.md           # Capítulos en markdown
├── cap-02.md
└── assets/
    ├── lomo.webp       # Imagen del lomo para el estante
    └── portada.webp    # Imagen de portada del libro
```

### Flag `publicado`

- `publicado: false` (o ausente): el build lo ignora, no aparece en la app
- `publicado: true`: se incluye en el estante y es navegable

### Pipeline

`build-cuentos.js` escanea `cuentos/*/libro.yaml`, filtra por `publicado: true`, convierte cada `.md` a HTML con `marked`, y genera `js/cuentos/registro.js`. Los cuentos se registran dinámicamente en `LIBROS_ESTANTE` y `fabricaModales` de `juego.js`.

### Lomo e imágenes

Crear lomo con la skill `/disenar-libro`. Guardar en `cuentos/{slug}/assets/lomo.webp`. Referenciar en `libro.yaml` como `lomo: assets/lomo.webp`.

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
- `watch-datos.js` vigila cambios en `datos/*.yaml` y `cuentos/**/*.{md,yaml}`, regenera los JS correspondientes
- Editar cualquier archivo recarga el navegador automáticamente

### Producción (`npm run build`)

esbuild genera la carpeta `dist/` con todo optimizado:

| Paso          | Entrada                           | Salida                                                             |
| ------------- | --------------------------------- | ------------------------------------------------------------------ |
| `build:datos`   | `datos/*.yaml`                    | `js/personajes.js`, `js/enemigos.js`, `js/juegos/*/config.js`       |
| `build:cuentos` | `cuentos/*/libro.yaml` + `*.md`   | `js/cuentos/registro.js`                                            |
| `build:js`      | `js/juego.js` + todos sus imports | `dist/juego.min.js` (1 archivo)                                     |
| `build:css`     | `estilos.css`                     | `dist/estilos.min.css`                                              |
| `build:html`    | `index.html`, `assets/`, `sw.js`  | `dist/index.html` (rutas reescritas), `dist/assets/`, `dist/sw.js`  |

La carpeta `dist/` está en `.gitignore` — nunca se commitea.

### Deploy (GitHub Actions → GitHub Pages)

Archivo: `.github/workflows/deploy.yml`

```text
Push a main → GitHub Actions ejecuta npm run build → dist/ se despliega a GitHub Pages
```

- **URL**: https://relatario.cl/
- **Repo público**: requerido por GitHub Pages en plan gratuito

### Service Worker (`sw.js`)

Estrategias diferenciadas de cache para segunda visita instantánea:

- **Assets estáticos** (JS, CSS, fuentes, imágenes): cache-first
- **HTML** (navegación): network-first con fallback a cache
- **`/api/**`** (futuro backend): network-only, nunca cachear

Incrementar `CACHE_NAME` en `sw.js` para invalidar el cache en actualizaciones.

## Sprites del platformer (El Abismo)

El Abismo es un platformer 2D en canvas 480×270. Personajes y enemigos usan sprite sheets PNG (strips horizontales de 48×60 px por frame), con fallback a sprites procedurales.

- **Sprite sheets**: `assets/img/sprites-plat/{nombre}.png`
- **Layouts**: 9 frames (sin ataques) o 15 frames (con ataques). El valor de `frames` en `SPRITE_SHEETS` de `spritesPlat.js` determina el layout automáticamente
- **Renderizado**: sprite 48×60 centrado sobre hitbox de 12×14 (pies alineados abajo)
- **Creación de nuevos sprites**: ver skill `/crear-personaje` → `references/sprites-plat.md`

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#biblioteca`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`jugador-{nombre}`) con colores y animaciones individuales; cada enemigo tiene `.villano-{nombre}`
- Imágenes: personajes en `assets/img/personajes/`, enemigos en `assets/img/enemigos/`, sprites en `assets/img/sprites-plat/` (todas `.webp` excepto sprites que son `.png`)
- Código simple y comentado para fines educativos
- **Componentes**: Módulos JS que crean su propio HTML con DOM API, exportan una función `crear*(contenedor)` que retorna un objeto con métodos (mostrar, ocultar, actualizar, etc.)
- **Juegos**: Módulos autocontenidos que crean/destruyen su pantalla al entrar/salir. Se comunican con juego.js mediante callbacks y eventos custom (`document.dispatchEvent`)
- **Libro de Juegos ↔ Juegos**: El Libro de Juegos (`js/componentes/libroJuegos.js`) contiene descripciones de cada juego en `JUEGOS`. Al modificar la mecánica o contenido de un juego, verificar que las descripciones del Libro de Juegos sigan siendo consistentes
- **Revisión pre-commit**: Después de escribir o refactorizar código, ejecutar primero los linters (`npm run lint:fix && npm run lint:css:fix && npm run format`) y luego la skill `/review-code` antes de hacer commit
