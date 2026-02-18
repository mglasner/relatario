# Plan: Mejoras UX/UI y Diseño Responsivo

## Resumen

Plan consolidado de 10 mejoras visuales y de experiencia de usuario, priorizadas
por relacion impacto/esfuerzo. El diseño responsivo y los controles tactiles se
integran como una de las mejoras principales.

## Estado actual

- **Tipografia**: Arial, sans-serif en toda la interfaz — sin personalidad
- **Pasillo**: `width: 400px; height: 600px` fijo (`estilos.css:868-869`)
- **Laberinto**: 17x17 celdas x 30px = 510x510px fijo (`estado.js:7`)
- **Canvas 3D**: 640x400px fijo (`habitacion2.js:9-10`)
- **Sin media queries** en todo el CSS (~2000 lineas)
- **Sin controles touch** — solo teclado (arrows + enter)
- Tarjetas de personaje: `width: 200px` fijo (`estilos.css:60`)
- Modales: `max-width: 340px` y `280px` sin adaptacion
- Feedback de dano: solo numero flotante rojo + flash blanco breve
- Transiciones entre pantallas: instantaneas (sin animacion)
- Barra de vida: rectangulo plano de 8px, sin microinteracciones
- Modal de puerta: generico ("Habitacion X"), sin identidad por habitacion
- Inventario: lista plana de emojis con label "ITEMS:"
- Sin tutorial ni onboarding interactivo

## Tabla de prioridades

| #   | Mejora                                      | Esfuerzo | Impacto | Categoria      | Estado                                     |
| --- | ------------------------------------------- | -------- | ------- | -------------- | ------------------------------------------ |
| 1   | Tipografia con personalidad                 | Bajo     | Alto    | Visual         | Hecho (502556d)                            |
| 2   | Diseno responsivo y controles tactiles      | Alto     | Alto    | Accesibilidad  | Hecho (04359a0, ae2eb0f, 2229db7, 32f67c9) |
| 3   | Tutorial interactivo de onboarding          | Medio    | Alto    | UX             | Pendiente                                  |
| 4   | Feedback visual de dano mejorado            | Bajo     | Alto    | Game feel      | Hecho (a53c449)                            |
| 5   | Transiciones cinematicas entre pantallas    | Medio    | Medio   | Visual / UX    | Hecho (e087662)                            |
| 6   | Paleta de colores unica por habitacion      | Bajo     | Medio   | Visual         | Hecho (f6dbef9)                            |
| 7   | Barra de vida con microinteracciones        | Bajo     | Medio   | UI / Game feel | Hecho (e7348e2)                            |
| 8   | Modal de puerta con identidad de habitacion | Bajo     | Medio   | UI / UX        | Hecho (078e656)                            |
| 9   | Notificaciones toast para eventos           | Bajo     | Medio   | UX / Feedback  | Hecho (9c14825)                            |
| 10  | Inventario visual con slots                 | Medio    | Medio   | UI / Game feel | Hecho (dac6233)                            |

---

## Mejora 1: Tipografia con personalidad

**Problema:** El juego usa Arial en toda la interfaz. Es una fuente de sistema
generica que no transmite ninguna emocion ni encaja con la tematica
terror/Halloween cartoon.

**Solucion:** Implementar un sistema tipografico de dos fuentes via Google Fonts:

- **Display** (titulos): Cinzel Decorative, Creepster o Nosifer
- **Body** (texto): Quicksand, Nunito o Comfortaa

Definir variables CSS `--font-display` y `--font-body` para uso consistente.

**Archivos:** `index.html` (link a Google Fonts), `estilos.css` (variables y
aplicacion)

**Esfuerzo:** Bajo — solo CSS y un link de fuentes

---

## Mejora 2: Diseno responsivo y controles tactiles

**Problema:** El juego solo funciona en desktop con teclado. En un iPhone SE
(375px), el pasillo (400px + bordes = 436px) y el laberinto (510px) desbordan.
Sin controles touch, es inutilizable en moviles/tablets.

**Objetivo:** Que el juego funcione correctamente en celulares (desde 375px de
ancho) con controles tactiles, sin romper la experiencia desktop.

### Que juega a favor

El codigo esta bien preparado:

- El pasillo ya calcula limites con `pasillo.clientWidth` (`juego.js:292-293`)
- La colision con puertas usa `getBoundingClientRect()` (`juego.js:439-440`)
- **Todo** el laberinto depende de `CONFIG.TAM_CELDA` — hacerlo dinamico adapta
  colisiones, renderizado y pathfinding automaticamente
- El canvas 3D trabaja en unidades del mapa, no pixeles

### Estrategia: CSS + JS hibrido

- **CSS** para lo visual estatico: tarjetas, modales, barra, pasillo, tipografia
- **JS dinamico** solo donde CSS no alcanza: laberinto (`CONFIG.TAM_CELDA`
  controla colisiones + renderizado) y canvas 3D (dimensiones del canvas)

### Breakpoints

| Zona    | Viewport  | Notas                                |
| ------- | --------- | ------------------------------------ |
| Movil   | <= 480px  | 1 columna, escalar pasillo/laberinto |
| Tablet  | 481-768px | Transicion suave                     |
| Desktop | >= 769px  | Sin cambios                          |

### Paso 2.1: Seleccion de personaje responsiva (CSS only)

**Archivo:** `estilos.css`

Agregar media queries al final del archivo:

- `.personaje` (linea 60): `width: 200px` -> `width: min(200px, 42vw)`
- `h1` (linea 40): reducir a `1.6rem` en movil
- `#juego` (linea 32): reducir `padding: 40px 20px` a `20px 12px`
- `.avatar img` (linea 205): reducir a `70px` en movil
- Villanos: mismo tratamiento que personajes

### Paso 2.2: Modales responsivos (CSS only)

**Archivo:** `estilos.css`

- `.modal-contenido` (linea 1229): `max-width: min(340px, 90vw)`
- `.modal-derrota-caja` (linea 1351): `max-width: min(280px, 85vw)`
- Reducir padding en movil

### Paso 2.3: Barra superior responsiva (CSS only)

**Archivo:** `estilos.css`

- Reducir `gap` (15px -> 8px) y `padding` en movil
- Reducir font-size de labels

### Paso 2.4: Pasillo responsivo (CSS + JS menor)

**Archivos:** `estilos.css`, `js/juego.js`

CSS:

```css
#pasillo {
    width: min(400px, 90vw);
    aspect-ratio: 2 / 3;
    /* quitar height: 600px */
}
```

Puertas a porcentajes (calculados sobre 400x600):

- `.puerta`: `width: 15%; height: 15%`
- `.puerta-izquierda { left: 2.5% }`, `.puerta-derecha { right: 2.5% }`
- `.puerta-1, .puerta-2 { top: 60% }`, `.puerta-3, .puerta-4 { top: 23.3% }`

Personaje: `width: 12.5%; aspect-ratio: 1` (quitar width/height fijos)

Decoraciones: convertir a porcentajes

JS (`juego.js`):

- `tamPersonaje` (linea 200): de constante `50` a funcion
  `() => personajeJugador.offsetWidth`
- `velocidad` (linea 199): proporcional `() => pasillo.clientWidth * 0.01`
- Los limites (lineas 292-293) y colisiones (lineas 438-451) ya son dinamicos,
  solo necesitan usar el tamPersonaje actualizado

### Paso 2.5: Laberinto responsivo (el mas complejo)

**Archivos:** `js/habitaciones/habitacion1/estado.js`,
`js/habitaciones/habitacion1/index.js`, `estilos.css`

En `estado.js` — nueva funcion `calcularTamCelda()`:

```js
const VALORES_BASE = {
    TAM_CELDA: 30,
    TAM_JUGADOR: 22,
    TAM_TRASGO: 20,
    VELOCIDAD: 3,
    VELOCIDAD_TRASGO: 2,
    MARGEN_COLISION: 2,
    TOLERANCIA_ESQUINA: 8,
};

export function calcularTamCelda() {
    const contenedor = document.getElementById('juego');
    const maxAncho = Math.min(contenedor.clientWidth - 20, VALORES_BASE.TAM_CELDA * CONFIG.COLS);
    CONFIG.TAM_CELDA = Math.max(Math.floor(maxAncho / CONFIG.COLS), 16);

    const escala = CONFIG.TAM_CELDA / VALORES_BASE.TAM_CELDA;
    CONFIG.TAM_JUGADOR = Math.max(12, Math.round(VALORES_BASE.TAM_JUGADOR * escala));
    CONFIG.TAM_TRASGO = Math.max(10, Math.round(VALORES_BASE.TAM_TRASGO * escala));
    CONFIG.VELOCIDAD = Math.max(1.5, VALORES_BASE.VELOCIDAD * escala);
    CONFIG.VELOCIDAD_TRASGO = Math.max(1, VALORES_BASE.VELOCIDAD_TRASGO * escala);
    CONFIG.MARGEN_COLISION = Math.max(1, Math.round(VALORES_BASE.MARGEN_COLISION * escala));
    CONFIG.TOLERANCIA_ESQUINA = Math.max(3, Math.round(VALORES_BASE.TOLERANCIA_ESQUINA * escala));
}
```

En `index.js`:

- Llamar `calcularTamCelda()` al inicio de `iniciarHabitacion1()`, antes de
  `crearPantalla()`

En `estilos.css`:

- `.jugador-laberinto`: quitar width/height fijos, dejar que JS lo setee inline
- Escalar font-size de emojis (llave, salida, trampas) en movil

**No hay que cambiar:** `generarMapa()`, BFS del trasgo, `esPared()`,
`hayColision()` — todo usa coordenadas logicas que se convierten multiplicando
por `TAM_CELDA`.

### Paso 2.6: Canvas 3D responsivo (JS)

**Archivo:** `js/habitaciones/habitacion2.js`

- `ANCHO_CANVAS` (linea 9): `Math.min(640, window.innerWidth - 40)`
- `ALTO_CANVAS`: mantener proporcion `ancho * 0.625`
- `NUM_RAYOS`: proporcional al ancho
- Minimapa: escalar proporcionalmente

### Paso 2.7: Controles touch — D-pad virtual

**Nuevo archivo:** `js/componentes/controlesTouch.js`

Componente que crea un D-pad con 4 botones (arriba, abajo, izquierda, derecha):

- Grid CSS, `position: fixed` abajo de la pantalla
- Solo visible en dispositivos touch (`'ontouchstart' in window`)
- Usa `touchstart`/`touchend` para respuesta inmediata
- Estilo visual coherente con el tema del juego (transparente, bordes sutiles)
- Incluir boton de accion (ATQ) y boton secundario (ITEM)

Integracion con input existente (enfoque directo, sin refactor):

- Exporta funcion `setTeclasRef(obj)` para apuntar al objeto de teclas activo
- Pasillo: el D-pad escribe en `movimiento.teclas` (el objeto que lee el game
  loop en `juego.js:395-398`)
- Laberinto: escribe en `est.teclas` (el objeto que lee el loop en
  `habitacion1/index.js`)

**Archivos modificados:**

- `js/juego.js`: importar y montar D-pad al entrar al pasillo
- `js/habitaciones/habitacion1/index.js`: montar D-pad al entrar al laberinto

### Paso 2.8: Pulido mobile

- `touch-action: none` en pasillo y laberinto (prevenir scroll accidental)
- Ocultar hints de teclado en touch (`@media (hover: none)`)
- Targets minimos de 44x44px en botones
- `prefers-reduced-motion` para animaciones pesadas

### Archivos afectados (mejora 2)

| Archivo                                 | Cambios                                          | Riesgo |
| --------------------------------------- | ------------------------------------------------ | ------ |
| `estilos.css`                           | Media queries, unidades relativas, estilos D-pad | Bajo   |
| `js/juego.js`                           | tamPersonaje/velocidad dinamicos, montar D-pad   | Medio  |
| `js/habitaciones/habitacion1/estado.js` | `calcularTamCelda()`                             | Medio  |
| `js/habitaciones/habitacion1/index.js`  | Llamar calcularTamCelda, montar D-pad            | Bajo   |
| `js/habitaciones/habitacion2.js`        | Dimensiones canvas dinamicas                     | Bajo   |
| `js/componentes/controlesTouch.js`      | **Nuevo** — D-pad virtual                        | Medio  |

---

## Mejora 3: Tutorial interactivo de onboarding

**Problema:** El unico tutorial es un texto parpadeante que dice "Usa las flechas
para moverte". No explica como interactuar con puertas, recoger items, evitar
trampas ni pelear. Un nino de 7 anos puede sentirse perdido y frustrado.

**Solucion:** Sistema de tooltips contextuales que aparecen la primera vez que el
jugador llega a cada pantalla:

- Cada tooltip explica una mecanica con animacion de las teclas relevantes
- Indicador de progreso con dots (ej: "Paso 1 de 4")
- Se guardan en `localStorage` para no repetir
- Boton "Saltar tutorial" para jugadores experimentados
- En touch, mostrar los controles del D-pad en vez de teclas

**Nuevo archivo:** `js/componentes/tutorial.js`

**Archivos modificados:** `js/juego.js`, `js/habitaciones/habitacion1/index.js`

**Esfuerzo:** Medio

---

## Mejora 4: Feedback visual de dano mejorado

**Problema:** Cuando el jugador recibe dano, solo aparece un numero flotante rojo
que sube y un flash blanco breve en el sprite. Es facil de ignorar. Falta una
respuesta visceral que comunique urgencia.

**Solucion:** Tres capas de feedback simultaneo, todo CSS puro:

1. **Screen shake** — vibracion de 0.3s del contenedor con `transform:
translate()` aleatorio
2. **Vineta roja** — overlay con `box-shadow: inset` rojo que hace flash
3. **Numeros de dano mejorados** — mas grandes, fuente decorativa (la del paso 1),
   sombra de texto, escala inicial grande que se reduce al subir

**Archivos:** `estilos.css` (nuevas animaciones), archivos de habitaciones (aplicar
clases de shake/vineta al recibir dano)

**Esfuerzo:** Bajo

---

## Mejora 5: Transiciones cinematicas entre pantallas

**Problema:** Las transiciones entre pantallas (seleccion -> pasillo ->
habitacion) son instantaneas. Rompe la inmersion y se siente abrupto.

**Solucion:** Componente `transicion.js` reutilizable con tres estilos:

1. **Fade a negro** — la pantalla se oscurece 0.4s, cambia contenido, vuelve
2. **Wipe horizontal** — cortina negra barre de izquierda a derecha
3. **Iris** (estilo cartoon) — circulo negro se cierra al centro del personaje y
   se abre en la nueva pantalla

API: `await transicion.ejecutar('iris')`

**Nuevo archivo:** `js/componentes/transicion.js`

**Archivos modificados:** `js/juego.js` (envolver cambios de estado con
transiciones)

**Esfuerzo:** Medio

---

## Mejora 6: Paleta de colores unica por habitacion

**Problema:** Ambas habitaciones usan la misma paleta purpura/oscura. Las paredes
del laberinto 2D son purpura (#2a1a3e), el 3D tambien. Se sienten iguales, sin
identidad propia.

**Solucion:** Variables CSS con scope por habitacion:

```css
.habitacion-1 {
    --hab-pared: #2a1a3e;
    --hab-fondo: #1a0a2e;
    --hab-accent: #bb86fc;
}
.habitacion-2 {
    --hab-pared: #1a3e1a;
    --hab-fondo: #0a1e0a;
    --hab-accent: #6bfc86;
}
.habitacion-3 {
    --hab-pared: #3e1a1a;
    --hab-fondo: #2e0a0a;
    --hab-accent: #e94560;
}
.habitacion-4 {
    --hab-pared: #1a1a3e;
    --hab-fondo: #0a0a2e;
    --hab-accent: #5eeadb;
}
```

Identidades: Fantasmal (purpura), Toxica (verde), Infernal (rojo), Acuatica
(azul).

**Archivos:** `estilos.css`, archivos de habitaciones (aplicar clase al
contenedor)

**Esfuerzo:** Bajo

---

## Mejora 7: Barra de vida con microinteracciones

**Problema:** La barra de vida es un rectangulo plano de 8px con gradiente.
Sin animacion cuando baja, sin cambio de color segun porcentaje, sin indicador
de peligro con vida baja. El texto "65/100" es pequeno y dificil de leer.

**Solucion:**

1. **Mayor altura** (14px) con borde redondeado y brillo especular (highlight)
2. **Gradiente dinamico** que cambia segun HP: verde -> amarillo -> rojo
3. **Shimmer animado** — brillo sutil que recorre la barra
4. **Icono de corazon** pulsante al lado con beat animation
5. **Texto de HP** dentro de la barra en blanco con text-shadow
6. **Animacion de reduccion** suave con transition de width

**Archivos:** `estilos.css`, `js/componentes/barraSuperior.js`

**Esfuerzo:** Bajo

---

## Mejora 8: Modal de puerta con identidad de habitacion

**Problema:** El modal de confirmacion es generico: solo dice "Habitacion X" y
"Quieres entrar?". No da pistas de que hay detras, no genera curiosidad ni
tension.

**Solucion:** Cada puerta muestra un modal con identidad propia:

1. **Icono tematico** grande (emoji) que representa el tipo de habitacion
2. **Nombre descriptivo** con subtitulo ("El Laberinto" / "NIVEL 1")
3. **Descripcion misteriosa** de 1-2 lineas que genere curiosidad sin spoilear
4. **Diseno refinado**: gradiente sutil, linea decorativa superior con colores de
   la habitacion, botones con mas jerarquia visual
5. **Boton contextual**: "Entrar al laberinto" en vez de "Entrar"

**Archivos:** `js/componentes/modalPuerta.js`, `estilos.css`

**Esfuerzo:** Bajo

---

## Mejora 9: Notificaciones toast para eventos del juego

**Problema:** Los eventos (recoger llave, recibir dano, activar trampa) se
comunican con cambios sutiles que el jugador puede no notar. No hay un sistema
unificado de notificaciones.

**Solucion:** Componente toast que aparece en la parte superior:

- Icono + mensaje descriptivo + color tematico del evento
- Auto-desaparece a los 2-3 segundos con animacion de salida
- Tipos: **dorado** (item obtenido), **rojo** (dano recibido), **teal** (efecto
  de estado), **verde** (objetivo cumplido)
- Maximo 3 toasts apilados visibles

Ejemplos:

- `🔑 Has encontrado la llave dorada!`
- `🔥 Trampa de fuego — -10 HP`
- `🕸️ Telarana — velocidad reducida 3s`

**Nuevo archivo:** `js/componentes/toast.js`

**Esfuerzo:** Bajo

---

## Mejora 10: Inventario visual con slots

**Problema:** El inventario es una lista plana de emojis con label "ITEMS:".
No se distingue cuantos slots hay, no hay jerarquia visual, no parece un
inventario de videojuego.

**Solucion:** Sistema de slots visuales estilo RPG:

- Fila de 4-6 cuadros (slots) con borde sutil
- Slots vacios: tenues/translucidos
- Al obtener item: slot se ilumina con color del item (dorado para llave, rojo
  para pociones) y glow pulsante
- Animacion de entrada: bounce + glow
- Numero de slot en esquina inferior (1, 2, 3...)

**Archivos:** `js/componentes/barraSuperior.js`, `estilos.css`

**Esfuerzo:** Medio

---

## Verificacion general

1. Chrome DevTools -> iPhone SE (375px), iPhone 14 (390px), iPad (768px)
2. Probar cada pantalla: seleccion, pasillo, laberinto, habitacion 3D
3. Pasillo: personaje se mueve con D-pad, no se sale, colisiona con puertas
4. Laberinto: paredes sin huecos, colisiones correctas, trasgo funciona
5. Desktop: verificar que nada cambio (media queries no afectan >= 769px)
6. `npm run lint:fix && npm run lint:css:fix && npm run format`

## Archivos nuevos

| Archivo                            | Descripcion                              |
| ---------------------------------- | ---------------------------------------- |
| `js/componentes/controlesTouch.js` | D-pad virtual para dispositivos touch    |
| `js/componentes/transicion.js`     | Transiciones cinematicas entre pantallas |
| `js/componentes/tutorial.js`       | Sistema de onboarding con tooltips       |
| `js/componentes/toast.js`          | Notificaciones toast para eventos        |

## Reporte visual

Ver `reporte-mejoras-ux.html` en la raiz del proyecto para mockups interactivos
con animaciones CSS de cada mejora propuesta.
