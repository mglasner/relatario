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

- HTML, CSS y JavaScript puro (ES modules, sin frameworks ni bundlers)
- Servidor de desarrollo: `npx live-server`

## Personajes

| Nombre | Descripción | Paleta |
|--------|-------------|--------|
| **Lina** | 13 años. Valiente e inteligente | Morado |
| **Rosé** | 10 años. Inteligente, valiente, nunca se rinde | Verde |
| **PandaJuro** | Panda samurái. Furioso, leal y honorable | Azul/Rojo |

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

| Comando | Qué hace |
|---|---|
| `npm run lint` | Verificar calidad JS con ESLint |
| `npm run lint:fix` | Auto-corregir problemas JS |
| `npm run lint:css` | Verificar calidad CSS con Stylelint |
| `npm run lint:css:fix` | Auto-corregir problemas CSS |
| `npm run format:check` | Verificar formateo con Prettier |
| `npm run format` | Auto-formatear JS, CSS, HTML y JSON |

**Orden recomendado para corregir todo:**

```bash
npm run lint:fix && npm run lint:css:fix && npm run format
```

Primero los linters (que pueden cambiar lógica como `let` → `const`), luego Prettier (que solo ajusta formato).

**Configuración:**

- `eslint.config.js` — reglas: `prefer-const`, `eqeqeq`, `no-var`, `no-console` (warn)
- `.prettierrc` — 4 espacios, single quotes, printWidth 100
- `.stylelintrc.json` — extiende `stylelint-config-standard`

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#seleccion-personaje`, `#btn-jugar`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`personaje-lina`, `personaje-rose`, `personaje-pandajuro`) con colores y animaciones individuales
- Imágenes de personajes van en `assets/img/personajes/`
- Código simple y comentado para fines educativos
- **Componentes**: Módulos JS que crean su propio HTML con DOM API, exportan una función `crear*(contenedor)` que retorna un objeto con métodos (mostrar, ocultar, actualizar, etc.)
- **Habitaciones**: Módulos autocontenidos que crean/destruyen su pantalla al entrar/salir. Se comunican con juego.js mediante callbacks y eventos custom (`document.dispatchEvent`)
