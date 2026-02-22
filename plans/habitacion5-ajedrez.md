# Plan: Habitación 5 — El Ajedrez

## Resumen

Nueva habitación con un juego de ajedrez completo donde el equipo rival está
formado por los villanos del juego y el personaje seleccionado ocupa el rol
central (Rey o Reina según género).

---

## 1. Nuevos villanos pesadilla

Crear dos villanos nuevos para los roles de Rey y Reina del equipo enemigo.

### 1.1 El Monstruo Comelón (Rey enemigo)

| Stat | Valor |
|------|-------|
| Tier | pesadilla |
| Vida | 240 |
| Edad | 5.000.000 |
| Estatura | 99.999,9 m |
| Velocidad | 3 |
| Vel. Ataque | 4 |

**Ataques:**

- Bocado estelar (24 dmg) — Mordisco cósmico que hace temblar el espacio
- Gran Mascada (30 dmg) — Abre sus fauces y tritura todo a su paso

**Descripción:**

> El Monstruo Comelón es la criatura más grande y hambrienta que jamás ha flotado
> por el espacio. Su boca es tan descomunal que podría tragarse la Luna de un solo
> mordisco... y repetir con la Tierra de postre. Lleva eones vagando entre las
> estrellas, devorando todo lo que encuentra: planetas, asteroides, cometas e
> incluso alguna que otra estrella despistada. Los científicos del universo lo
> llaman "Evento Gastronómico de Nivel Cósmico". Él se llama a sí mismo "un
> poquito antojadizo".
>
> Lo curioso es que El Comelón no es malvado... solo tiene un hambre infinita y
> cero autocontrol. Cuando La Nebulosa le señala un nuevo mundo, sus ojitos
> brillan como supernovas y empieza a salivar asteroides. Su estómago retumba con
> tal fuerza que los planetas cercanos tiemblan en sus órbitas. Dicen que en algún
> lugar de su panza gigante hay un planeta entero que se salvó porque El Comelón
> se distrajo con otro más sabroso.

### 1.2 La Nebulosa (Reina enemiga)

| Stat | Valor |
|------|-------|
| Tier | pesadilla |
| Vida | 230 |
| Edad | 3.000.000 |
| Estatura | 500,0 m |
| Velocidad | 5 |
| Vel. Ataque | 5 |

**Ataques:**

- Niebla cósmica (20 dmg) — Envuelve al rival en oscuridad helada
- Vórtice de sombra (26 dmg) — Remolino de sombras que arrastra todo

**Descripción:**

> La Nebulosa es una nube viviente de gas y polvo estelar que flota por el cosmos
> con una curiosidad insaciable. Sus ojos — dos luces brillantes que parpadean
> entre la bruma — son lo único constante en su forma siempre cambiante: a veces
> parece un remolino de colores, otras veces una cortina de humo con garras, y
> cuando está contenta se expande hasta cubrir lunas enteras.
>
> Es la compañera perfecta del Monstruo Comelón: mientras él devora, ella prepara
> el terreno envolviendo planetas en una oscuridad tan espesa que nadie ve venir
> lo que se acerca. Lo hace por diversión, no por maldad: para La Nebulosa,
> envolver un mundo en sombras es como jugar a las escondidas a escala cósmica.
> Su risa es un eco lejano que resuena entre las estrellas, y cuando se aburre,
> crea vórtices de sombra solo para ver cómo giran.

### 1.3 Pasos de creación (skill crear-personaje)

Para cada villano, seguir el flujo estándar:

1. Generar avatar con `mcp__image-gen__generate_image` (1:1, semi-cartoon)
2. Convertir a webp: `npx cwebp-bin -q 80 <png> -o assets/img/enemigos/<nombre>.webp`
3. Agregar entrada en `datos/enemigos.yaml`
4. Agregar paleta CSS en `estilos.css` (antes de `/* --- Overlay de empezar */`)
5. Ejecutar `node scripts/build-datos.js`
6. Verificar con `npm run lint`

**Paletas sugeridas (no repetir existentes):**

| Villano | Color propuesto | Descripción |
|---------|----------------|-------------|
| El Monstruo Comelón | `#f0a030` | naranja/dorado cósmico |
| La Nebulosa | `#7b68ee` | azul-violeta nebuloso |

---

## 2. Motor de ajedrez

### 2.1 Librería elegida: js-chess-engine

| Aspecto | Detalle |
|---------|---------|
| Repo | [github.com/josefjadrny/js-chess-engine](https://github.com/josefjadrny/js-chess-engine) |
| Licencia | MIT |
| Tamaño | ~pocos KB |
| Dependencias | Zero |
| Incluye | Validación de movimientos + IA con 5 niveles |

**Instalación:**

```bash
npm install js-chess-engine
```

Se importa como ES module y esbuild lo incluirá en el bundle de producción.

### 2.2 Niveles de dificultad

| Etiqueta en juego | Nivel engine | Comportamiento |
|-------------------|-------------|----------------|
| Fácil | 1 | Comete errores obvios, ideal para principiantes |
| Normal | 2 | Juega como un principiante casual |
| Difícil | 3 | Reto real, requiere pensar |

Se presenta un selector de dificultad al entrar a la habitación, antes de que
empiece la partida.

### 2.3 API principal

```javascript
import { Game } from 'js-chess-engine';

const game = new Game();
game.move('E2', 'E4');           // jugador mueve
const aiMove = game.aiMove(2);   // IA juega (nivel 2)
game.exportJson();               // estado actual del tablero
```

---

## 3. Mapeo de piezas

### 3.1 Equipo enemigo (piezas negras) — configurable desde YAML

El mapeo villano → pieza de ajedrez se define en `datos/habitacion5.yaml`
(sección `piezas.enemigo`), no hardcodeado en JS. Esto permite cambiar la
composición del equipo enemigo sin tocar código.

Cada rol referencia un villano por nombre (debe existir en `datos/enemigos.yaml`).
El módulo `piezas.js` lee la config y resuelve las imágenes/datos del villano
en runtime.

**Configuración inicial:**

| Pieza | Villano | Razonamiento |
|-------|---------|-------------|
| Rey | El Monstruo Comelón | El más poderoso, líder del bando |
| Reina | La Nebulosa | Ágil y versátil, compañera del Comelón |
| Torres | El Profano | Guardián sólido e imponente |
| Alfiles | Siniestra | Hechicera, se mueve en diagonal como magia |
| Caballos | El Errante | Errante = movimiento impredecible |
| Peones | Trasgo | Soldado raso del ejército villano |

Cada pieza usa el **avatar webp** del villano correspondiente como imagen.

### 3.2 Equipo del jugador (piezas blancas)

| Pieza | Imagen |
|-------|--------|
| Rey/Reina (según género) | Avatar del personaje seleccionado |
| Resto de piezas | Diseño clásico de ajedrez (iconos/SVG) |

**Lógica de asignación:**

- Personajes femeninos (Lina, Rosé, Hana, Kira, PomPom) → **Reina**
- Personajes masculinos (PandaJuro, DonBu, Orejas) → **Rey**
- La pieza complementaria (Rey si jugador es Reina, y viceversa) usa diseño clásico

---

## 4. Diseño de UI

### 4.1 Enfoque: DOM con CSS Grid

El tablero se renderiza como una grilla CSS 8x8 de `<div>`, consistente con el
patrón del memorice (habitación 3). Las piezas son `<img>` dentro de cada celda.

**Razones:**

- Un tablero de ajedrez es una grilla estática — no necesita canvas
- CSS Grid resuelve el layout naturalmente
- Permite hover, selección, drag-and-drop con CSS y eventos DOM
- Consistente con la arquitectura del proyecto (componentes DOM)

### 4.2 Layout de pantalla

```text
┌──────────────────────────────────────────┐
│ [Huir]    El Ajedrez                     │
├──────────────────────────────────────────┤
│                                          │
│    Turno: Jugador  |  Dificultad: Normal │
│                                          │
│   ┌──┬──┬──┬──┬──┬──┬──┬──┐             │
│   │♜ │♞ │♝ │♛ │♚ │♝ │♞ │♜ │  8         │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │♟ │♟ │♟ │♟ │♟ │♟ │♟ │♟ │  7         │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │  │  │  │  │  │  │  │  │  6          │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │  │  │  │  │  │  │  │  │  5          │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │  │  │  │  │  │  │  │  │  4          │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │  │  │  │  │  │  │  │  │  3          │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │♙ │♙ │♙ │♙ │♙ │♙ │♙ │♙ │  2         │
│   ├──┼──┼──┼──┼──┼──┼──┼──┤             │
│   │♖ │♘ │♗ │♕ │♔ │♗ │♘ │♖ │  1         │
│   └──┴──┴──┴──┴──┴──┴──┴──┘             │
│    a   b   c   d   e   f   g   h        │
│                                          │
│  Piezas capturadas: ♟♟♞                  │
│                                          │
└──────────────────────────────────────────┘
```

### 4.3 Interacción

1. Jugador hace clic en una pieza propia → se resalta y se muestran movimientos
   válidos (celdas con borde/color)
2. Clic en celda válida → mueve la pieza, animación CSS de traslado
3. Turno de la IA → breve pausa (~500ms), luego la IA mueve con animación
4. Indicadores visuales para: jaque (rey parpadea), último movimiento (celdas
   marcadas), piezas capturadas

**Flag `bloqueado`:** Un único flag booleano a nivel de módulo que deshabilita
toda interacción del usuario (clics, hover) durante el turno de la IA y durante
animaciones de movimiento. Previene doble jugada y clicks accidentales.

### 4.4 Responsividad

- Desktop: tablero centrado con tamaño fijo (~480px)
- Mobile: tablero ocupa el ancho disponible, celdas se escalan proporcionalmente
- Touch: tap para seleccionar/mover (no drag-and-drop en mobile)
- Zona táctil: celdas de mínimo 48px en mobile (recomendación Material Design)

---

## 5. Mecánicas de juego

### 5.1 Reglas

Ajedrez completo estándar:

- Todos los movimientos legales (incluido enroque, captura al paso, promoción)
- Jaque, jaque mate y tablas (ahogado, repetición, 50 movimientos)
- El jugador siempre juega con blancas (mueve primero)

### 5.2 Promoción de peón

Cuando un peón del jugador llega a la fila 8, se muestra un modal para elegir
la pieza de promoción (Reina, Torre, Alfil, Caballo). La IA siempre promociona
a Reina.

### 5.3 Condiciones de victoria/derrota

| Resultado | Condición | Acción |
|-----------|-----------|--------|
| Victoria | Jaque mate al rey enemigo (Comelón) | Otorgar llave + toast + volver al pasillo |
| Derrota | Jaque mate al jugador | `notificarJugadorMuerto()` |
| Tablas | Ahogado, repetición, 50 mov, material insuficiente | Modal informativo + volver al pasillo (sin llave) |

### 5.4 Victoria — llave

Al ganar, el jugador recibe una llave nueva en el inventario. Como actualmente
no hay habitación 6, esta llave podría ser una "llave final" o "llave del
tesoro". Por definir: su función narrativa.

Acciones al ganar:

```javascript
jugador.inventario.push(CFG.meta.itemInventario);
notificarInventarioCambio();
lanzarToast('¡Jaque mate!', '<img src="...">', 'item');
setTimeout(() => { limpiarHabitacion5(); callbackSalir(); }, 2000);
```

---

## 6. Arquitectura de archivos

### 6.1 Archivos nuevos

```text
js/habitaciones/habitacion5/
├── index.js          # Punto de entrada: iniciarHabitacion5 / limpiarHabitacion5
├── config.js         # ⚙️ Generado desde datos/habitacion5.yaml
├── tablero.js        # Renderizado del tablero DOM, manejo de clics, animaciones
├── motor.js          # Wrapper sobre js-chess-engine: turnos, IA, estado
└── piezas.js         # Lee CFG.piezas.enemigo, resuelve villanos desde enemigos.js

datos/habitacion5.yaml              # Configuración de la habitación
assets/img/llaves/llave-ajedrez.webp  # Imagen de la llave (por crear)
assets/img/enemigos/comelon.webp    # Avatar del Monstruo Comelón
assets/img/enemigos/nebulosa.webp   # Avatar de La Nebulosa
```

### 6.2 Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `js/juego.js` | Import + `registrarHabitacion('5', ...)` |
| `js/componentes/inventario.js` | Agregar llave hab5, `TOTAL_SLOTS = 5` |
| `datos/enemigos.yaml` | Agregar El Monstruo Comelón y La Nebulosa |
| `estilos.css` | Paletas de villanos + estilos de habitación 5 |
| `index.html` | Agregar 5ta puerta en el pasillo |

### 6.3 Estructura de módulos

```text
index.js
  ├── importa config.js (CFG)
  ├── importa motor.js (lógica de juego)
  ├── importa tablero.js (UI del tablero)
  ├── importa piezas.js (mapeo de piezas)
  ├── importa pantallaHabitacion.js (componente compartido)
  ├── importa toast.js (notificaciones)
  └── importa eventos.js (comunicación con juego.js)

motor.js
  └── importa js-chess-engine (Game)

tablero.js
  └── importa piezas.js (para renderizar imágenes)
```

---

## 7. Configuración YAML

```yaml
# Habitación 5 — El Ajedrez
meta:
    titulo: "El Ajedrez"
    itemInventario: llave-final   # Por definir nombre exacto
    tiempoVictoria: 2500

# Mapeo villano → pieza de ajedrez (equipo enemigo)
# Cada valor es el nombre exacto del villano en datos/enemigos.yaml
piezas:
    enemigo:
        rey: "El Monstruo Comelón"
        reina: "La Nebulosa"
        torre: "El Profano"        # Se usa para ambas torres
        alfil: "Siniestra"         # Se usa para ambos alfiles
        caballo: "El Errante"      # Se usa para ambos caballos
        peon: "Trasgo"             # Se usa para los 8 peones

dificultad:
    opciones:
        - nombre: Fácil
          nivel: 1
        - nombre: Normal
          nivel: 2
        - nombre: Difícil
          nivel: 3
    default: 1                    # índice (Normal)

ia:
    retardoMovimiento: 500        # ms de pausa antes de que la IA mueva
    retardoJaque: 300             # ms de flash en jaque

tablero:
    tamCelda: 60                  # px por celda (desktop)
    tamCeldaMobile: 48            # px por celda (mobile, mínimo recomendado)

textos:
    turnoJugador: "Tu turno"
    turnoIA: "Turno del rival..."
    toastJaque: "¡Jaque!"
    toastMate: "¡Jaque mate!"
    toastTablas: "Tablas"
    toastVictoria: "¡Has derrotado al ejército de villanos!"
    toastDerrota: "El Monstruo Comelón ha ganado..."
    promocion: "Elige una pieza"

curacion:
    victoriaMin: 10
    victoriaMax: 15
```

**Cómo funciona `piezas.enemigo` en runtime:**

El módulo `piezas.js` lee `CFG.piezas.enemigo` y busca cada villano en la
lista de enemigos importada desde `js/enemigos.js` (generada por build-datos).
De ahí obtiene el avatar (`img`), la clase CSS y el nombre para mostrar.

```javascript
// piezas.js (pseudocódigo)
import { ENEMIGOS } from '../../enemigos.js';
import { CFG } from './config.js';

function obtenerPiezaEnemiga(rol) {
    const nombre = CFG.piezas.enemigo[rol];
    const villano = ENEMIGOS.find(e => e.nombre === nombre);
    return { nombre: villano.nombre, img: villano.img, clase: villano.clase };
}
```

Esto permite cambiar la composición del equipo rival editando solo el YAML,
sin tocar JS. Por ejemplo, para poner a La Grotesca como torre en vez de
El Profano, basta con cambiar `torre: "La Grotesca"` en el YAML y regenerar.

---

## 8. Modificaciones al pasillo

### 8.1 Quinta puerta

Actualmente el pasillo tiene 4 puertas (2 izquierda, 2 derecha). Opciones
para la 5ta puerta:

**Opción A — Puerta al fondo del pasillo:**
Una puerta especial/más grande al final del corredor, visible solo cuando se
tienen las 4 llaves anteriores (o siempre visible pero con candado).

**Opción B — Puerta extra a un lado:**
Agregar una 3ra puerta en el lado izquierdo o derecho.

**Decisión pendiente con el usuario.**

### 8.2 Inventario

- Cambiar `TOTAL_SLOTS` de 4 a 5 en `js/componentes/inventario.js`
- Agregar entrada para la llave de la habitación 5:

```javascript
'llave-final': {
    img: 'assets/img/llaves/llave-ajedrez.webp',
    color: '#f0a030',
    slot: 4,
},
```

- Ajustar CSS del inventario si 5 slots no caben bien en el layout actual

---

## 9. Heroario

Agregar descripción de la Habitación 5 en `HABITACIONES_HEROARIO`
(`js/componentes/libroHeroes.js`). Ejemplo:

> **Habitación 5: El Ajedrez** — Un tablero de ajedrez mágico donde los villanos
> de la mansión cobran vida como piezas. El Monstruo Comelón lidera el ejército
> oscuro como Rey, mientras La Nebulosa maniobra como Reina. Mueve tus piezas
> con estrategia para dar jaque mate y conseguir la llave.

---

## 10. Fases de implementación

### Fase 1: Villanos nuevos

- [ ] Generar avatares (El Monstruo Comelón + La Nebulosa)
- [ ] Agregar datos a `datos/enemigos.yaml`
- [ ] Agregar paletas CSS
- [ ] Ejecutar build-datos + lint

### Fase 2: Infraestructura de la habitación

- [ ] Crear `datos/habitacion5.yaml`
- [ ] Crear `js/habitaciones/habitacion5/index.js` (esqueleto)
- [ ] Crear `js/habitaciones/habitacion5/config.js` (build-datos)
- [ ] Registrar habitación en `juego.js`
- [ ] Agregar puerta al pasillo (`index.html` + CSS)
- [ ] Expandir inventario a 5 slots
- [ ] Crear imagen de llave

### Fase 3: Motor de ajedrez

- [ ] Instalar `js-chess-engine` (`npm install js-chess-engine`)
- [ ] Crear `motor.js` — wrapper con manejo de turnos, IA, y estado
- [ ] Implementar selector de dificultad
- [ ] Conectar victoria/derrota con eventos del juego

### Fase 4: Tablero y UI

- [ ] Crear `tablero.js` — grilla CSS 8x8, renderizado de piezas
- [ ] Crear `piezas.js` — lee mapeo villanos desde CFG, resuelve avatares
- [ ] Implementar selección de pieza + movimientos válidos resaltados
- [ ] Animaciones de movimiento (CSS transitions)
- [ ] Indicadores de jaque, último movimiento
- [ ] Panel de piezas capturadas
- [ ] Modal de promoción de peón

### Fase 5: Integración y pulido

- [ ] Conectar turno del jugador → motor → turno IA → tablero
- [ ] Implementar flujo completo: entrada → selector dificultad → partida → resultado
- [ ] Responsividad mobile
- [ ] Actualizar Heroario
- [ ] Actualizar Villanario (nuevos villanos aparecen automáticamente)
- [ ] Linting + review

---

## 11. Decisiones pendientes

| # | Decisión | Opciones |
|---|----------|----------|
| 1 | Ubicación de la 5ta puerta | Al fondo del pasillo vs. lateral |
| 2 | Nombre de la llave final | "llave-final", "llave-tesoro", "llave-ajedrez" |
| 3 | Función narrativa de la llave | ¿Abre algo? ¿Desbloquea un final? |
| 4 | Sonidos/música | ¿Agregar efectos de sonido al mover piezas? |
| 5 | Piezas clásicas del jugador | Iconos SVG, Unicode chess symbols, o sprites propios |
