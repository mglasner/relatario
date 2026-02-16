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
│           └── donbu.png
├── index.html                # Estructura de las pantallas del juego
├── estilos.css               # Estilos visuales y animaciones
├── juego.js                  # Lógica e interactividad
└── CLAUDE.md
```

## Stack

- HTML, CSS y JavaScript puro (sin frameworks ni bundlers)
- Servidor de desarrollo: `npx live-server`

## Personajes

| Nombre | Descripción | Paleta |
|--------|-------------|--------|
| **Lina** | 13 años. Valiente e inteligente | Morado |
| **Rosé** | 10 años. Inteligente, valiente, nunca se rinde | Verde |
| **DonBu** | Panda samurái. Furioso, leal y honorable | Azul/Rojo |

## Pantallas implementadas

1. **Selección de personaje** - Elegir entre Lina, Rosé o DonBu con animaciones al seleccionar
2. **Pantalla de juego** - Placeholder con mensaje de bienvenida y botón para volver

## Convenciones

- Archivos e IDs en español (ej: `estilos.css`, `#seleccion-personaje`, `#btn-jugar`)
- Comentarios en español
- Cada personaje tiene su clase CSS propia (`personaje-lina`, `personaje-rose`, `personaje-donbu`) con colores y animaciones individuales
- Imágenes de personajes van en `assets/img/personajes/`
- Código simple y comentado para fines educativos
