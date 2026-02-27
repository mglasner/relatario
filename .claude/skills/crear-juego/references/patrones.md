# Catálogo de patrones — Los 5 juegos de El Relatario

Referencia extraída del código real de laberinto, laberinto3d, memorice, abismo y ajedrez.

---

## Patrón 1 — Firma de API pública (universal)

Todos los juegos exponen exactamente estas dos funciones y nada más:

```js
export function iniciarXxx(jugadorRef, callback, dpadRef, opciones) { ... }
export function limpiarXxx() { ... }
```

- `jugadorRef` — instancia de Personaje (tiene `.nombre`, `.img`, `.clase`, `.vidaActual`, `.vidaMax`, `.ataques`, `.inventario`)
- `callback` — función a llamar para volver al Libro de Juegos (= `callbackSalir`)
- `dpadRef` — el D-pad compartido de `juego.js`; puede ignorarse o configurarse
- `opciones` — objeto libre para parámetros extra (`{ dificultad: 'facil' }`, etc.)

---

## Patrón 2 — Registro en `juego.js`

```js
// js/juego.js — objeto juegos
const juegos = {
    laberinto:   { iniciar: iniciarLaberinto,   limpiar: limpiarLaberinto },
    laberinto3d: { iniciar: iniciarLaberinto3d, limpiar: limpiarLaberinto3d },
    memorice:    { iniciar: iniciarMemorice,    limpiar: limpiarMemorice },
    abismo:      { iniciar: iniciarAbismo,      limpiar: limpiarAbismo },
    ajedrez:     { iniciar: iniciarAjedrez,     limpiar: limpiarAjedrez, sinBarra: true },
    duelo:       { iniciar: iniciarDuelo,       limpiar: limpiarDuelo,   sinBarra: true },
};
```

`sinBarra: true` suprime la `barraSuperior` HTML global. Usar cuando:
- El juego no tiene concepto de vida del héroe
- El juego gestiona su propio HUD completamente
- La barra de héroe no encaja en la UI (ajedrez, duelo)

`juego.js` llama automáticamente al iniciar:
```js
juegoRegistrado.iniciar(jugadorActual, callbackVolver, dpad, { dificultad, ...opciones });
```

---

## Patrón 3 — `crearPantallaJuego` (componente base)

```js
// js/componentes/pantallaJuego.js
export function crearPantallaJuego(id, clase, titulo, onHuir)
// Retorna: { pantalla: HTMLElement }
```

Genera esta estructura:
```html
<div id="pantalla-{slug}" class="juego-{slug}">
  <div class="cabecera-juego">
    <button class="btn-huir">...</button>
    <h2 class="titulo-juego">{titulo}</h2>
  </div>
  <!-- aquí van los elementos del juego -->
</div>
```

La clase `juego-{slug}` activa la paleta CSS del juego (variables `--juego-*`).

**Importante**: el `btn-huir` ya llama `onHuir`. Si el juego tiene Escape, manejarlo en el `onKeyDown` propio.

---

## Patrón 4 — Paleta CSS en `comun.css`

Agregar al final de `css/juegos/comun.css`:

```css
/* Paletas existentes como referencia:
   laberinto: púrpura #3d2560, accent #bb86fc
   laberinto3d: verde bosque #1a3e1a, accent #6bfc86
   memorice: rojo oscuro #3e1a1a, accent #e94560
   abismo: azul noche #1a1a3e, accent #5eeadb
   ajedrez: dorado oscuro #3e2e0a, accent #f0a030
*/

.juego-miJuego {
    --juego-pared: #...;        /* color de fondo/paredes */
    --juego-pared-medio: #...;  /* variante media */
    --juego-pared-oscuro: #...; /* variante más oscura */
    --juego-borde: rgb(r g b / 20%); /* borde sutil */
    --juego-accent: #...;       /* color de acento (brillo, títulos) */
}
```

Estas variables se usan en el CSS específico del juego (`css/juegos/{slug}.css`):
```css
/* css/juegos/{slug}.css */
@import './comun.css';  /* NO — comun.css se importa desde estilos.css */

.clase-elemento {
    background: var(--juego-pared);
    border-color: var(--juego-accent);
}
```

**Nota**: `css/juegos/comun.css` se importa desde `estilos.css`, no desde el CSS del juego. El CSS específico del juego también se importa desde `estilos.css`.

---

## Patrón 5 — Orientación de pantalla

### Portrait (laberinto 2D, memorice, ajedrez)

```js
import { crearModoPortrait } from '../../componentes/modoPortrait.js';

// Al iniciar:
est.modoPortrait = crearModoPortrait();
est.modoPortrait.activar();

// Al limpiar:
if (est.modoPortrait) {
    est.modoPortrait.desactivar();
    est.modoPortrait = null;
}
```

### Landscape (laberinto 3D, abismo)

```js
import { crearModoLandscape } from '../../componentes/modoLandscape.js';

// Al iniciar (recibe callback para reescalar canvas):
est.modoLandscape = crearModoLandscape(reescalarCanvas);
// ... crear pantalla y canvas primero ...
est.modoLandscape.activar();

// Al limpiar:
if (est.modoLandscape) {
    est.modoLandscape.desactivar();
    est.modoLandscape = null;
}
```

`crearModoOrientacion` internamente:
- Detecta mobile: `window.matchMedia('(pointer: coarse)').matches`
- En mobile: `requestFullscreen()` + `screen.orientation.lock(orientacion)`
- Muestra overlay "Gira tu dispositivo" si el usuario tiene la orientación incorrecta
- Expone `.esMobile` para condicionar el modo del D-pad

---

## Patrón 6 — D-pad touch

El D-pad es un singleton creado en `juego.js` y pasado como `dpadRef` a cada juego.

```js
// Modos disponibles y cuándo usarlos:

// Cruz ▲◀▶▼ centrada — laberinto 2D (movimiento en grilla)
dpadRef.setModoCentrado();
dpadRef.setTeclasRef(est.teclas);
dpadRef.mostrar();

// Cruz izq + A/B der — laberinto 3D (avanzar/girar + acciones)
dpadRef.setModoCruzSplit();
dpadRef.setTeclasRef(est.teclas);
dpadRef.mostrar();

// ◀▶ izquierda + A/B derecha — platformer (correr + saltar/agacharse)
dpadRef.setModoDividido();
dpadRef.setTeclasRef(est.teclas);
dpadRef.mostrar();

// Oculto — memorice, ajedrez (juegos por clic)
dpadRef.ocultar();
```

Al limpiar, **siempre** restaurar al modo default:
```js
if (est.dpadRef) {
    est.dpadRef.setModoCentrado();  // restaurar
    est.dpadRef = null;
}
```

El D-pad inyecta teclas en `est.teclas` igual que el teclado físico: `est.teclas['ArrowUp'] = true`.

---

## Patrón 7 — Eventos custom (juego → juego.js)

```js
// js/eventos.js — las únicas 3 funciones de comunicación
import { notificarVidaCambio, notificarJugadorMuerto, notificarVictoria } from '../../eventos.js';

// → Actualiza barra de vida en tiempo real
notificarVidaCambio();

// → juego.js muestra modalDerrota sobre la pantalla del juego
//   El modal llama callbackSalir cuando el usuario acepta
notificarJugadorMuerto();

// → juego.js marca pendienteVictoria = true
//   Al volver (callbackSalir), sortea y muestra modalTesoro
notificarVictoria();
```

**Flujo de derrota estándar** (laberinto, abismo, memorice):
```js
// En el juego, cuando vida llega a 0:
notificarJugadorMuerto();
// juego.js escucha y muestra modal — el juego NO hace nada más
```

**Flujo de derrota directa** (ajedrez — sin modalDerrota):
```js
// El juego maneja su propia derrota con toast + timeout
lanzarToast(CFG.textos.toastDerrota, '♚', 'dano');
timeoutFin = setTimeout(function () {
    limpiarAjedrez();
    callbackSalir();
}, CFG.meta.tiempoVictoria);
```

**Flujo de victoria** (todos los juegos):
```js
notificarVictoria();
lanzarToast(CFG.textos.toastVictoria, '✨', 'exito');
timeouts.set(function () {
    limpiarMiJuego();
    callbackSalir();
}, CFG.meta.timeoutExito);
```

---

## Patrón 8 — Derrota y victoria: modales en juego.js

`juego.js` maneja centralizadamente:

```js
// Modal de derrota — se monta en pantalla-{juego} si existe
document.addEventListener('jugador-muerto', function () {
    const pantallaJuego = document.getElementById('pantalla-' + estado.juegoActual);
    const contenedor = pantallaJuego || contenedorJuego;
    modalDerrota.mostrar(estado.jugadorActual.nombre, contenedor);
});

// Modal de tesoro — se muestra al volver del juego si hubo victoria
document.addEventListener('juego-victoria', function () {
    estado.pendienteVictoria = true;
});
// Al volver: sortearTesoro() → modalTesoro.mostrar()
```

Los juegos **no crean** sus propios modales de derrota o victoria.

---

## Patrón 9 — Curación del jugador

```js
// Patrón estándar en memorice y ajedrez:
function curar(min, max) {
    const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
    jugador.vidaActual = Math.min(jugador.vidaActual + cantidad, jugador.vidaMax);
    notificarVidaCambio();
    lanzarToast('¡+' + cantidad + ' HP!', '💚', 'exito');
}
```

Curar en victorias crea retroalimentación positiva sin romper el balance de vida entre juegos.

---

## Patrón 10 — Game Loop

```js
import { crearGameLoop } from '../../utils.js';

// Al nivel de módulo (no dentro de iniciar):
const loop = crearGameLoop(function (tiempo, dt) {
    if (!est.activo) {
        loop.detener();
        return;
    }
    // actualizar...
    // renderizar...
});

// Al iniciar:
loop.iniciar();

// Al limpiar:
loop.detener();
```

`crearGameLoop` usa `requestAnimationFrame` internamente. `tiempo` es el timestamp del rAF, `dt` es el delta time (ms desde el frame anterior).

**Freeze frame** (patrón del Abismo):
```js
// Durante congelado (flash de impacto): solo renderizar, no actualizar física
if (estaCongelada()) {
    renderFrame();
    return;
}
```

---

## Patrón 11 — Estaciones climáticas

```js
import { sortearEstacion, ESTACIONES, PALETAS_PETALO, PALETAS_HOJA } from '../clima.js';

// sortearEstacion() retorna: null | 'primavera' | 'verano' | 'otono' | 'invierno'
// Probabilidad: 20% cada estación, 20% null (sin clima)
const estacion = sortearEstacion();

// Toast de inicio (patrón universal — delay para no solapar con otros toasts):
if (estacion) {
    setTimeout(function () {
        if (est.activo) {
            lanzarToast('✨ ' + ESTACIONES[estacion].nombre, '🌬️', 'estado');
        }
    }, 800);
}
```

### Implementaciones por juego:

**Laberinto 2D** — Canvas overlay propio:
```js
// Canvas posicionado como clima-overlay sobre el laberinto
climaCanvas = document.createElement('canvas');
climaCanvas.className = 'clima-overlay';  // position: absolute, pointer-events: none
// RAF independiente del game loop del juego
climaRafId = requestAnimationFrame(loopClimaLab);
```

**Laberinto 3D** — Paleta de cielo/suelo:
```js
est.climaPaleta = estacion ? ESTACIONES[estacion].cielo3d : null;
est.estacionClima = estacion;
// En el loop: pasa est.estacionClima a actualizarParticulas() del motor3d
```

**Abismo** — Partículas en canvas del juego:
```js
estacionActiva = sortearEstacion();
reiniciarEstadoClima(); // en renderer.js
iniciarParallax(estacionActiva); // parallax cambia según estación
// En el loop: emitirClima(estacionActiva, anchoCanvas, camaraX, camaraY)
//             renderizarEfectoClima(ctx, estacionActiva, ...)
```

**Memorice y Ajedrez** — No implementado (DOM puro, sin canvas de partículas).

---

## Patrón 12 — Teclas de teclado

```js
// Objeto de teclas activas (se comparte con el D-pad)
const teclas = {};  // o est.teclas = {};

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        teclas[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarMiJuego();
        callbackSalir();
    }
}

function onKeyUp(e) {
    delete teclas[e.key];
}

// Al iniciar:
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// Al limpiar (SIEMPRE — fuga de memoria si se olvida):
document.removeEventListener('keydown', onKeyDown);
document.removeEventListener('keyup', onKeyUp);
teclas = {};  // limpiar estado
```

---

## Patrón 13 — Estado del módulo

Dos enfoques usados en el proyecto:

**Variables de módulo sueltas** (memorice, ajedrez — juegos más simples):
```js
let jugador = null;
let callbackSalir = null;
let pantalla = null;
// ...
```

**Objeto est centralizado** (laberinto, abismo — juegos complejos con muchos submódulos):
```js
// estado.js
export const est = {
    jugador: null,
    callbackSalir: null,
    activo: false,
    pantalla: null,
    // ...
};

export function resetearEstado() {
    est.jugador = null;
    est.activo = false;
    // ...
}
```

El objeto `est` se importa en todos los submódulos. Nunca se pasa como parámetro entre funciones internas — siempre se lee directamente de `est.*`.

---

## Patrón 14 — Entrada en el Libro de Juegos

```js
// js/componentes/libroJuegos.js — objeto JUEGOS
const JUEGOS = {
    miJuego: {
        nombre: 'El Mi Juego',          // nombre de pantalla
        img: 'assets/img/juegos/miJuego.webp',  // imagen 16:9 aprox
        accent: '#rrggbb',              // = --juego-accent del CSS
        parrafos: [                     // descripción del juego (tono aventura, apto niños)
            'Párrafo introductorio...',
            'Descripción de mecánica...',
        ],
        tip: 'Consejo breve para el jugador.',
        // Opcional: selector de modo/dificultad
        modos: [
            { icono: '⚡', nombre: 'Fácil', desc: 'Descripción del modo fácil.' },
            { icono: '🎯', nombre: 'Normal', desc: 'El desafío clásico.' },
            { icono: '🌀', nombre: 'Difícil', desc: 'Descripción del modo difícil.' },
        ],
    },
};
```

Si el juego tiene `modos`, el Libro de Juegos mostrará el selector de modo antes de "Jugar", y pasará `{ dificultad: 'facil' }` como `opciones` al juego.

---

## Patrón 15 — YAML de configuración

```yaml
# datos/{slug}.yaml
meta:
  titulo: "El Mi Juego"
  timeoutExito: 2000    # ms de espera tras ganar antes de volver al libro

textos:
  toastVictoria: "¡Misión cumplida!"
  toastDerrota: "Inténtalo de nuevo"
  # textos específicos del juego...

# Parámetros de juego (cualquier estructura):
jugador:
  vidaMax: 100
  velocidad: 3

enemigos:
  cantidad: 5
  danoPorContacto: 10

dificultad:
  opciones:
    - { id: facil, nombre: "Fácil", multiplicador: 0.7 }
    - { id: normal, nombre: "Normal", multiplicador: 1.0 }
    - { id: dificil, nombre: "Difícil", multiplicador: 1.5 }

curacion:
  victoriaMin: 20
  victoriaMax: 40
```

Ejecutar `npm run build:datos` para regenerar `js/juegos/{slug}/config.js`. El script en `scripts/build-datos.js` procesa todos los YAML en `datos/`.

---

## Patrón 16 — `crearTimeoutTracker`

```js
import { crearTimeoutTracker } from '../../utils.js';

// Al nivel de módulo:
const timeouts = crearTimeoutTracker();

// Usar en vez de setTimeout:
timeouts.set(function () {
    if (!est.activo) return;  // guard si el juego se cerró
    // ...
}, 1500);

// Al limpiar — cancela TODOS los timeouts pendientes de una vez:
timeouts.limpiar();
```

Ventaja vs `clearTimeout` manual: no hay que trackear cada ID individualmente.

---

## Patrón 17 — Toasts

```js
import { lanzarToast } from '../../componentes/toast.js';

// Signatura: lanzarToast(mensaje, icono, tipo)
// tipo determina el color:
lanzarToast('¡Llave encontrada!', '🔑', 'item');   // dorado
lanzarToast('-10 HP', '💔', 'dano');               // rojo
lanzarToast('¡Victoria!', '✨', 'exito');           // verde
lanzarToast('✨ Otoño mágico', '🌬️', 'estado');    // neutro/gris
lanzarToast('Consejo: salta sobre ellos', '💡', 'info'); // azul
```

Usar toasts para:
- Objetos recogidos (llave, power-up)
- Daño recibido
- Victoria / derrota
- Clima al inicio
- Advertencias de peligro
- Eventos especiales del juego

---

## Patrón 18 — `juego-inmersivo`

Para juegos con canvas que necesitan todo el viewport:

```js
// Al iniciar (después de crear la pantalla):
const juegoEl = document.getElementById('juego');
juegoEl.classList.add('juego-inmersivo');
juegoEl.style.setProperty('--ancho-3d', canvas.ancho + 6 + 'px'); // opcional

// Al limpiar (siempre):
juegoEl.classList.remove('juego-inmersivo');
juegoEl.style.removeProperty('--ancho-3d');
```

Laberinto 3D y Abismo lo usan. El resto no.

---

## Tabla resumen — decisiones por juego existente

| Patrón | Laberinto | Lab3D | Memorice | Abismo | Ajedrez |
|---|---|---|---|---|---|
| Orientación | Portrait | Landscape | Portrait | Landscape | Portrait |
| D-pad | Centrado | CruzSplit | Oculto | Dividido | Oculto |
| Canvas | DOM+canvas estático | Canvas 3D animado | DOM puro | Canvas animado | DOM puro |
| sinBarra | No | No | No | No | **Sí** |
| Clima | ✓ canvas overlay | ✓ paleta cielo | ✗ | ✓ partículas | ✗ |
| GameLoop | ✓ | ✓ | ✗ | ✓ | ✗ |
| notificarJugadorMuerto | ✓ | ✓ | ✓ | ✓ | No (directo) |
| notificarVictoria | ✓ | ✓ | ✓ | ✓ | ✓ |
| juego-inmersivo | ✗ | ✓ | ✗ | ✓ | ✗ |
| crearTimeoutTracker | No | No | ✓ | ✓ | No |
| Estado | est (submódulo) | est (submódulo) | vars locales | est (submódulo) | vars locales |

---

## Archivos que siempre se tocan al agregar un juego

1. `datos/{slug}.yaml` — nueva config
2. `js/juegos/{slug}/index.js` — API pública
3. `js/juegos/{slug}/estado.js` — estado del módulo
4. `js/juegos/{slug}/config.js` — generado por build-datos
5. `css/juegos/comun.css` — paleta del juego (bloque `.juego-{slug}`)
6. `css/juegos/{slug}.css` — CSS específico del juego
7. `estilos.css` — agregar `@import './css/juegos/{slug}.css';`
8. `js/juego.js` — import + registro en objeto `juegos`
9. `js/componentes/libroJuegos.js` — entrada en `JUEGOS`
10. `assets/img/juegos/{slug}.webp` — imagen para el Libro de Juegos
