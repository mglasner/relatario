# El Relatario

Plataforma narrativa interactiva — un compendio de relatos, héroes y desafíos para contar en familia. Creada como proyecto familiar para aprender HTML, CSS y JavaScript.

## Estructura del proyecto

```text
relatario/
├── assets/img/
│   ├── personajes/        # Avatares (.webp) de personajes jugables
│   ├── enemigos/          # Avatares (.webp) de enemigos
│   ├── sprites-plat/      # Sprite sheets PNG para juegos en canvas
│   ├── juegos/            # Ilustraciones para el Libro de Juegos
│   ├── tesoros/            # Imágenes de tesoros coleccionables
│   ├── biblioteca/        # Fondo e imágenes de la homepage
│   └── icons/             # Favicon e iconos PWA
├── css/                   # Estilos modulares (@import desde estilos.css)
│   ├── base.css           # Variables, fuentes, reset, dark mode
│   ├── componentes/       # Modales, HUD, d-pad, transiciones, toast, etc.
│   ├── libros/            # Estilos de cada tipo de libro
│   ├── juegos/            # Estilos por juego + comun.css (paletas)
│   └── biblioteca/        # Estante homepage
├── cuentos/               # Libros de cuentos (markdown + yaml)
│   └── {slug}/            # Cada cuento en su directorio
├── datos/                 # Fuente de verdad en YAML (genera JS via build-datos)
│   ├── personajes.yaml    # Personajes jugables
│   ├── enemigos.yaml      # Enemigos organizados en tiers
│   ├── tesoros.yaml       # Tesoros coleccionables
│   └── {juego}.yaml       # Config de cada juego (uno por juego)
├── js/
│   ├── juego.js           # State machine central
│   ├── entidades.js       # Clases base: Entidad, Personaje, Enemigo
│   ├── personajes.js      # ⚙️ Generado desde datos/personajes.yaml
│   ├── enemigos.js        # ⚙️ Generado desde datos/enemigos.yaml
│   ├── tesoros.js         # ⚙️ Generado desde datos/tesoros.yaml
│   ├── audio.js           # Sonidos sintetizados con Web Audio API
│   ├── laberinto.js       # Generador procedural de laberintos
│   ├── eventos.js         # Nombres de eventos custom centralizados
│   ├── utils.js           # Utilidades compartidas
│   ├── componentes/       # Componentes UI (libros, modales, HUD, etc.)
│   ├── juegos/            # Juegos autocontenidos, uno por directorio
│   │   ├── clima.js       # Módulo compartido: clima estacional
│   │   └── {juego}/       # Cada juego en su directorio
│   ├── motor3d/           # Motor raycasting estilo Doom
│   ├── cuentos/           # ⚙️ Generado desde cuentos/ (build-cuentos)
│   ├── changelog/         # ⚙️ Generado desde git log (build-changelog)
│   └── dev/               # Herramientas de desarrollo (showcases, sync)
├── scripts/               # Build scripts (YAML→JS, cuentos, changelog, etc.)
├── index.html             # Estructura mínima: #juego > #biblioteca
├── vitrina.html           # Página de desarrollo (showcases visuales)
├── estilos.css            # Punto de entrada CSS (@import de todo)
├── sw.js                  # Service Worker (cache strategies)
└── manifest.webmanifest   # Manifest PWA
```

## Stack

- HTML, CSS y JavaScript puro (ES modules)
- Build de producción: esbuild (bundle + minificación)
- Deploy: GitHub Actions → GitHub Pages → https://relatario.cl/

## Flujo de navegación

```text
Estante (homepage) → Libro abierto (modal)
                         ↓ (Libro de Juegos)
                    Elegir héroe/config + Jugar → Juego (fullscreen)
                         ↑ (ganar/perder/huir)
```

**Estados de la state machine** (`js/juego.js`):
- **BIBLIOTECA**: Homepage con estante de madera (dos repisas: libros fijos arriba, novedades + cuentos abajo)
- **LIBRO**: Libro abierto en modal (Heroario, Villanario, Libro de Juegos, Tesorario, Novedades, o cuentos)
- **JUEGO**: Juego en pantalla completa

La selección de héroe/configuración ocurre dentro del Libro de Juegos (cada página de juego tiene su propio modal de selección). Los juegos son independientes, sin llaves secuenciales.

## Personajes y enemigos

Definidos en `datos/personajes.yaml` y `datos/enemigos.yaml`. El script `build-datos` genera los archivos JS correspondientes.

Cada personaje tiene: nombre, edad, vida, velocidad, estatura, clase CSS (`jugador-{nombre}`), color HUD, descripción y avatar `.webp` en `assets/img/personajes/`.

Cada enemigo tiene: nombre, tier (`esbirro`/`elite`/`pesadilla`), vida, ataques, descripción y avatar `.webp` en `assets/img/enemigos/`.

## Juegos (desafíos)

Cada juego vive en `js/juegos/{nombre}/` como módulo autocontenido. Se registra en el mapa `juegos` de `js/juego.js` y tiene su descripción en `JUEGOS` de `js/componentes/libroJuegos.js`. Su configuración se define en `datos/{nombre}.yaml` y se genera a `config.js` en build-time.

Para ver la lista completa de juegos disponibles, consultar `js/juego.js` (mapa `juegos`) o `js/componentes/libroJuegos.js` (objeto `JUEGOS`).

Algunos juegos comparten módulos (ej: `ajedrez-comun/` entre variantes de ajedrez, `clima.js` para clima estacional entre varios juegos).

**Agregar un nuevo juego**: usar la skill `/crear-juego` que sigue todos los patrones arquitectónicos existentes.

## Sistema de tesoros

Los jugadores ganan tesoros al completar juegos. Definidos en `datos/tesoros.yaml` con tiers (común, raro, épico, legendario). El Tesorario (`js/componentes/libroTesorario.js`) muestra la colección. Los tesoros se persisten en `localStorage`.

## Libros de cuentos

Sistema para agregar libros narrativos al estante. Los cuentos se escriben en markdown y se convierten a HTML en build-time.

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
└── assets/
    ├── lomo.webp       # Imagen del lomo para el estante
    └── portada.webp    # Imagen de portada del libro
```

### Flag `publicado`

- `publicado: false` (o ausente): el build lo ignora, no aparece en la app
- `publicado: true`: se incluye en el estante y es navegable

### Pipeline

`build-cuentos.js` escanea `cuentos/*/libro.yaml`, filtra por `publicado: true`, convierte `.md` a HTML con `marked`, y genera `js/cuentos/registro.js`.

### Lomo e imágenes

Crear lomo con la skill `/disenar-libro`. Guardar en `cuentos/{slug}/assets/lomo.webp`. Referenciar en `libro.yaml` como `lomo: assets/lomo.webp`.

## Libro de Novedades (changelog)

`build-changelog.js` genera `js/changelog/registro.js` desde `git log`. Solo muestra commits `feat` y `fix` (los que son relevantes para el jugador). Se visualiza como el "Libro de Novedades" en el estante.

## Sprites

Personajes y enemigos usan sprite sheets PNG (strips horizontales), con fallback a sprites procedurales si no existe la imagen.

- **Sprite sheets**: `assets/img/sprites-plat/{nombre}.png`
- **Creación de nuevos sprites**: ver skill `/crear-personaje` → `references/sprites-plat.md`

## Tono y contenido (apto para niños)

El juego es apto para niños desde 7 años. Todo el contenido debe seguir estas reglas:

- **Estilo visual**: cartoon/fantasía/aventura, sin sangre ni gore. Colores variados y estilizados
- **Descripciones**: tono de aventura, fantasía y misterio, divertido, nunca violento ni gráfico (nada de "asesino", "sangre", "muerte", "infierno")
- **Ataques**: nombres de magia/sombras/misterio/aventura en vez de violencia explícita (ej: "Hechizo sombrío" en vez de "Corte maldito")
- **Imágenes**: generadas con estilo semi-cartoon, aptas para niños

## Linting y formateo

El proyecto usa ESLint v9 (flat config), Prettier y Stylelint. Todas son devDependencies.

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
- Los módulos JS se cargan individualmente por el navegador
- `watch-datos.js` vigila cambios en `datos/*.yaml` y `cuentos/**/*.{md,yaml}`, regenera los JS correspondientes
- Editar cualquier archivo recarga el navegador automáticamente

### Producción (`npm run build`)

esbuild genera la carpeta `dist/` con todo optimizado:

| Paso               | Entrada                           | Salida                            |
| ------------------ | --------------------------------- | --------------------------------- |
| `build:datos`      | `datos/*.yaml`                    | `js/personajes.js`, `js/enemigos.js`, `js/tesoros.js`, `js/juegos/*/config.js` |
| `build:cuentos`    | `cuentos/*/libro.yaml` + `*.md`   | `js/cuentos/registro.js`          |
| `build:changelog`  | `git log`                         | `js/changelog/registro.js`        |
| `build:js`         | `js/juego.js` + todos sus imports | `dist/juego.min.js`               |
| `build:css`        | `estilos.css`                     | `dist/estilos.min.css`            |
| `build:html`       | `index.html`, `assets/`, `sw.js`  | `dist/` (rutas reescritas)        |

La carpeta `dist/` está en `.gitignore` — nunca se commitea.

### Deploy (GitHub Actions → GitHub Pages)

```text
Push a main → GitHub Actions ejecuta npm run build → dist/ se despliega a GitHub Pages
```

- **URL**: https://relatario.cl/

### Service Worker (`sw.js`)

Estrategias diferenciadas de cache:

- **Assets estáticos** (JS, CSS, fuentes, imágenes): cache-first
- **HTML** (navegación): network-first con fallback a cache

Incrementar `CACHE_NAME` en `sw.js` para invalidar el cache en actualizaciones.

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#biblioteca`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`jugador-{nombre}`); cada enemigo tiene `.villano-{nombre}`
- Imágenes `.webp` excepto sprites que son `.png`
- Código simple y comentado para fines educativos
- **Componentes**: Módulos JS que crean su propio HTML con DOM API, exportan una función `crear*(contenedor)` que retorna un objeto con métodos (mostrar, ocultar, actualizar, etc.)
- **Juegos**: Módulos autocontenidos en `js/juegos/{nombre}/` que crean/destruyen su pantalla al entrar/salir. Se comunican con `juego.js` mediante callbacks y eventos custom. Config parametrizada desde `datos/{nombre}.yaml`
- **Libro de Juegos ↔ Juegos**: `libroJuegos.js` contiene descripciones de cada juego en `JUEGOS`. Al modificar la mecánica o contenido de un juego, verificar que las descripciones sigan siendo consistentes
- **Revisión pre-commit**: Ejecutar primero `npm run lint:fix && npm run lint:css:fix && npm run format` y luego `/review-code` antes de hacer commit

## Convención de commits

El proyecto usa conventional commits. El texto de `feat` y `fix` se muestra
automáticamente en el **Libro de Novedades** (changelog visible para los jugadores),
así que las descripciones deben ser claras y comprensibles para un público general.

### Formato

    tipo(scope): descripción en imperativo

### Tipos

| Tipo       | Uso                                      | Visible en Novedades |
|------------|------------------------------------------|----------------------|
| `feat`     | Nueva funcionalidad                      | Si                   |
| `fix`      | Corrección de bug                        | Si                   |
| `refactor` | Reestructuración interna sin cambio visible | No                |
| `art`      | Cambios visuales/assets                  | No                   |
| `docs`     | Documentación                            | No                   |
| `chore`    | Mantenimiento, deps, CI                  | No                   |
| `style`    | Formato de código                        | No                   |
| `rename`   | Renombrado de archivos/variables         | No                   |

### Scope

Nombre del componente o subsistema: `tesorario`, `abismo`, `laberinto3d`,
`biblioteca`, `build`, `cuentos`, `pwa`, `dpad`, etc. Opcional si el cambio
es transversal.

### Idioma y tono

- Español, imperativo: "agregar", "corregir", "mejorar"
  (no "agregado", "corregí", "se mejoró")
- En `feat` y `fix`: escribir como si le contaras a un jugador qué cambió.
  Bien: "agregar sistema de tesoros con premios por ganar juegos"
  Mal: "implementar lógica de dispatch para tesoros en store"
