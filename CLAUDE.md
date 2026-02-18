# La Casa del Terror

Videojuego web creado como proyecto familiar para aprender HTML, CSS y JavaScript.

## Estructura del proyecto

```
la-casa-del-terror/
├── assets/
│   └── img/
│       └── personajes/      # Avatares de los personajes
│           ├── lina.png
│           ├── rose.png
│           └── pandajuro.png
├── js/
│   ├── entidades.js          # Clases base: Entidad, Personaje, Enemigo
│   ├── personajes.js         # Definición de personajes jugables (datos/stats)
│   ├── enemigos.js           # Definición de enemigos (datos/stats)
│   ├── juego.js              # Lógica principal, coordina componentes y game loop
│   ├── componentes/          # Componentes UI (crean su propio HTML desde JS)
│   │   ├── barraSuperior.js  # Barra de estado: avatar, vida, inventario
│   │   ├── modalPuerta.js    # Modal de confirmación para entrar a habitaciones
│   │   └── modalDerrota.js   # Modal de game over (reutilizable en todas las etapas)
│   └── habitaciones/         # Cada habitación crea su propia pantalla
│       └── habitacion1.js    # Habitación 1: El Laberinto (buscar la llave)
├── index.html                # Estructura de las pantallas del juego
├── estilos.css               # Estilos visuales y animaciones
└── CLAUDE.md
```

## Stack

- HTML, CSS y JavaScript puro (ES modules)
- Build de producción: esbuild (bundle + minificación)
- Deploy: GitHub Actions → GitHub Pages

## Personajes

| Nombre        | Descripción                                    | Paleta    |
| ------------- | ---------------------------------------------- | --------- |
| **Lina**      | 13 años. Valiente e inteligente                | Morado    |
| **Rosé**      | 10 años. Inteligente, valiente, nunca se rinde | Verde     |
| **PandaJuro** | Panda samurái. Furioso, leal y honorable       | Azul/Rojo |

## Pantallas implementadas

1. **Selección de personaje** - Elegir entre Lina, Rosé o PandaJuro con animaciones al seleccionar
2. **Pasillo** - Pasillo con 4 puertas, movimiento con flechas y modal de confirmación
3. **Habitación 1: El Laberinto** - Grid 15x13 donde el jugador busca una llave y vuelve a la salida

## Diseño de villanos

El juego es apto para niños desde 7 años. Los villanos deben seguir estas reglas:

- **Estilo visual**: cartoon/Halloween, sin sangre ni gore. Colores oscuros pero estilizados
- **Descripciones**: tono misterioso y divertido, nunca violento ni gráfico (nada de "asesino", "sangre", "muerte", "infierno")
- **Ataques**: nombres de magia/sombras/misterio en vez de violencia explícita (ej: "Hechizo sombrío" en vez de "Corte maldito")
- **Imagen**: generada con estilo semi-cartoon, apta para niños, circular para avatar de juego
- **Paleta CSS**: cada villano tiene su clase `.villano-nombre` con colores de borde, fondo, h3, avatar img, barra de vida y ataque-dano
- **Datos**: definidos en `js/enemigos.js` como instancias de `Enemigo(nombre, vidaMax, ataques[], descripcion)`
- **Imágenes**: van en `assets/img/enemigos/`

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

BrowserSync sirve los archivos fuente directamente (hot-reload en http://localhost:3000). No hay build, se usan los ES modules originales:

- `index.html` carga `estilos.css` y `js/juego.js`
- Los 25+ módulos JS se cargan individualmente por el navegador
- Editar cualquier archivo recarga el navegador automáticamente

### Producción (`npm run build`)

esbuild genera la carpeta `dist/` con todo optimizado:

| Paso         | Entrada                           | Salida                                                             |
| ------------ | --------------------------------- | ------------------------------------------------------------------ |
| `build:js`   | `js/juego.js` + todos sus imports | `dist/juego.min.js` (~54 KB, 1 archivo)                            |
| `build:css`  | `estilos.css`                     | `dist/estilos.min.css` (~34 KB)                                    |
| `build:html` | `index.html`, `assets/`, `sw.js`  | `dist/index.html` (rutas reescritas), `dist/assets/`, `dist/sw.js` |

El script `scripts/build-html.js` reescribe las rutas en el HTML:

- `estilos.css` → `estilos.min.css`
- `js/juego.js` → `juego.min.js`

La carpeta `dist/` está en `.gitignore` — nunca se commitea.

### Deploy (GitHub Actions → GitHub Pages)

Archivo: `.github/workflows/deploy.yml`

```
Push a main → GitHub Actions ejecuta npm run build → dist/ se despliega a GitHub Pages
```

**Configuración requerida en GitHub**: Settings → Pages → Source: **GitHub Actions**

- **URL**: https://mglasner.github.io/la-casa-del-terror/
- **Redirect**: `mglasner.github.io` redirige al juego (repo `mglasner.github.io` con meta refresh)
- **Repo público**: requerido por GitHub Pages en plan gratuito

### Service Worker (`sw.js`)

Estrategias diferenciadas de cache para segunda visita instantánea:

- **Assets estáticos** (JS, CSS, fuentes, imágenes): cache-first
- **HTML** (navegación): network-first con fallback a cache
- **`/api/**`\*\* (futuro backend): network-only, nunca cachear

Incrementar `CACHE_NAME` en `sw.js` para invalidar el cache en actualizaciones.

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#seleccion-personaje`, `#btn-jugar`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`personaje-lina`, `personaje-rose`, `personaje-pandajuro`) con colores y animaciones individuales
- Imágenes de personajes van en `assets/img/personajes/`
- Código simple y comentado para fines educativos
- **Componentes**: Módulos JS que crean su propio HTML con DOM API, exportan una función `crear*(contenedor)` que retorna un objeto con métodos (mostrar, ocultar, actualizar, etc.)
- **Habitaciones**: Módulos autocontenidos que crean/destruyen su pantalla al entrar/salir. Se comunican con juego.js mediante callbacks y eventos custom (`document.dispatchEvent`)
