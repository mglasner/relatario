---
name: Crear Juego
description: Esta skill debe usarse cuando el usuario pide "crear juego", "nuevo juego", "agregar juego", "implementar juego", "añadir desafío", "programar juego nuevo", "nuevo desafío para El Relatario", o necesita crear un quinto o sexto juego para El Relatario respetando todos los patrones arquitectónicos existentes.
version: 0.1.0
---

# Crear un nuevo juego para El Relatario

El Relatario tiene 5 juegos completos (laberinto, laberinto3d, memorice, abismo, ajedrez) y una arquitectura de patrones muy definida. Todo juego nuevo debe seguir esos patrones para integrarse correctamente.

Antes de escribir una sola línea de código, tomar las **7 decisiones de diseño** que definen cómo se implementará el juego.

---

## 7 Decisiones de diseño iniciales

Preguntar al usuario o inferir del contexto:

### 1. Orientación de pantalla
- **Portrait** → `crearModoPortrait()` — laberinto 2D, memorice, ajedrez
- **Landscape** → `crearModoLandscape(onResize)` — laberinto 3D, abismo (canvas que necesita ancho)

### 2. Modo del D-pad touch
- **Centrado** (`setModoCentrado`) — cruz ▲◀▶▼ centrada, para movimiento en grilla
- **CruzSplit** (`setModoCruzSplit`) — cruz izquierda + A/B derecha, para 3D con acciones
- **Dividido** (`setModoDividido`) — ◀▶ izquierda + A/B derecha, para platformers
- **Oculto** (`dpadRef.ocultar()`) — sin controles físicos (memorice, ajedrez, juegos por clic)

### 3. ¿Tiene barra superior de vida?
- **Con barra** (default) — `juego.js` muestra `barraSuperior` automáticamente
- **Sin barra** (`sinBarra: true`) — el juego gestiona su propio HUD; usar cuando la barra de héroe no tiene sentido en la mecánica

### 4. Renderizado
- **DOM puro** — para juegos de tablero, cartas, turnos (memorice, ajedrez)
- **Canvas animado** — para juegos en tiempo real con RAF (abismo, laberinto 3D)
- **DOM + canvas estático** — laberinto 2D (mapa dibujado una vez, jugador en DOM)

### 5. ¿Usa Game Loop?
- **Sí** → `crearGameLoop(fn)` de `utils.js` — para tiempo real
- **No** → event-driven puro — para juegos por turnos o clic

### 6. ¿Implementa estaciones climáticas?
- **Sí** → `sortearEstacion()` de `../clima.js` + partículas/efectos visuales
- **No** → omitir completamente (memorice, ajedrez no lo tienen)

### 7. Paleta de color del juego
Elegir un color accent y derivar la paleta:
```
accent:        #rrggbb  (color principal, brillo)
pared:         oscuro    (fondo/paredes)
pared-medio:   más oscuro
pared-oscuro:  el más oscuro
borde:         accent con 20% opacidad
```

---

## Estructura de archivos a crear

```
js/juegos/{slug}/
├── index.js      ← API pública: iniciarXxx / limpiarXxx
├── estado.js     ← est, resetearEstado, timeouts
├── config.js     ← ⚙️ generado desde datos/{slug}.yaml
└── ...           ← módulos adicionales según necesidad

datos/{slug}.yaml ← fuente de verdad (genera config.js)
css/juegos/{slug}.css
assets/img/juegos/{slug}.webp   ← ilustración para el Libro de Juegos
```

---

## Flujo de implementación

### Paso 1 — YAML de configuración

Crear `datos/{slug}.yaml` con al menos:

```yaml
meta:
  titulo: "El Mi Juego"
  timeoutExito: 2000      # ms de espera tras ganar antes de volver

textos:
  toastVictoria: "¡Lo lograste!"
  toastDerrota: "Mejor suerte la próxima"
  # ... textos de UI específicos del juego
```

Ejecutar `npm run build:datos` para generar `js/juegos/{slug}/config.js`.

### Paso 2 — `index.js` con la API obligatoria

Todo juego expone exactamente estas dos funciones:

```js
/**
 * Inicia El Mi Juego.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad
 * @param {Object} [opciones] - Opciones extra ({ dificultad, ... })
 */
export function iniciarMiJuego(jugadorRef, callback, dpadRef, opciones) {
    // 1. Guardar refs
    // 2. Crear modo orientación (.activar())
    // 3. Crear pantalla (crearPantallaJuego)
    // 4. Configurar dpad
    // 5. Iniciar clima si aplica
    // 6. Registrar eventos de teclado
    // 7. Iniciar game loop (si aplica)
}

export function limpiarMiJuego() {
    // 1. est.activo = false
    // 2. Detener game loop
    // 3. Remover listeners de teclado (removeEventListener)
    // 4. Desactivar modo orientación
    // 5. Restaurar dpad a modo centrado
    // 6. pantalla.remove()
    // 7. Limpiar estado
}
```

### Paso 3 — `crearPantallaJuego`

```js
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';

const { pantalla } = crearPantallaJuego(
    'pantalla-miJuego',   // ID — debe ser 'pantalla-{slug}'
    'juego-miJuego',      // clase CSS — activa la paleta de color
    CFG.meta.titulo,
    function () { limpiarMiJuego(); callbackSalir(); }
);
document.getElementById('juego').appendChild(pantalla);
```

### Paso 4 — Comunicación con juego.js (eventos)

```js
import { notificarVidaCambio, notificarJugadorMuerto, notificarVictoria } from '../../eventos.js';

// Cuando cambia la vida:
notificarVidaCambio();

// Cuando el jugador muere (muestra modalDerrota automáticamente):
notificarJugadorMuerto();

// Cuando el jugador gana (sortea tesoro al volver):
notificarVictoria();
// ... luego llamar callbackSalir() con delay (CFG.meta.timeoutExito)
```

**Nunca** crear modales de derrota/victoria propios — `juego.js` los gestiona.

### Paso 5 — CSS de paleta

Agregar al final de `css/juegos/comun.css`:

```css
.juego-miJuego {
    --juego-pared: #...;
    --juego-pared-medio: #...;
    --juego-pared-oscuro: #...;
    --juego-borde: rgb(... / 20%);
    --juego-accent: #...;
}
```

### Paso 6 — Registrar en `js/juego.js`

```js
// Imports al inicio:
import { iniciarMiJuego, limpiarMiJuego } from './juegos/miJuego/index.js';

// En el objeto juegos:
const juegos = {
    // ... juegos existentes ...
    miJuego: { iniciar: iniciarMiJuego, limpiar: limpiarMiJuego },
    // con sinBarra: true si corresponde
};
```

### Paso 7 — Agregar al Libro de Juegos (`js/componentes/libroJuegos.js`)

```js
const JUEGOS = {
    // ... juegos existentes ...
    miJuego: {
        nombre: 'El Mi Juego',
        img: 'assets/img/juegos/miJuego.webp',
        accent: '#rrggbb',   // = --juego-accent
        parrafos: [
            'Descripción párrafo 1...',
            'Párrafo 2...',
        ],
        tip: 'Consejo para el jugador.',
        // modos: [...] — opcional, solo si tiene selector de modo/dificultad
    },
};
```

---

## Toasts: uso obligatorio para feedback

```js
import { lanzarToast } from '../../componentes/toast.js';

// tipos disponibles:
lanzarToast('Mensaje', '⚠️', 'dano');    // daño/peligro — rojo
lanzarToast('Mensaje', '✨', 'exito');   // victoria/logro — verde
lanzarToast('Mensaje', '🔑', 'item');   // objeto recogido — dorado
lanzarToast('Mensaje', '🌬️', 'estado'); // información de estado
lanzarToast('Mensaje', '💡', 'info');   // consejo/aviso
```

---

## Timeouts: usar `crearTimeoutTracker`

En vez de `setTimeout` suelto, usar el tracker para cancelar todos al limpiar:

```js
import { crearTimeoutTracker } from '../../utils.js';
const timeouts = crearTimeoutTracker();

timeouts.set(function () { ... }, 1000);  // en vez de setTimeout

// Al limpiar:
timeouts.limpiar();  // cancela todos de una vez
```

---

## Checklist de integración completa

Antes de dar el juego por terminado, verificar:

- [ ] `datos/{slug}.yaml` creado y `npm run build:datos` ejecutado
- [ ] `js/juegos/{slug}/index.js` exporta `iniciarXxx` y `limpiarXxx`
- [ ] `limpiarXxx` remueve todos los `addEventListener` agregados
- [ ] `limpiarXxx` llama `.desactivar()` en el modo de orientación
- [ ] `limpiarXxx` restaura dpad con `setModoCentrado()` si lo usó
- [ ] `limpiarXxx` llama `pantalla.remove()`
- [ ] CSS de paleta agregado en `css/juegos/comun.css`
- [ ] Registrado en el objeto `juegos` de `js/juego.js`
- [ ] Entrada agregada en `JUEGOS` de `js/componentes/libroJuegos.js`
- [ ] Imagen `assets/img/juegos/{slug}.webp` creada
- [ ] `npm run lint:fix && npm run lint:css:fix && npm run format` sin errores

---

## Recursos de referencia

Para ver los 20 patrones en detalle con ejemplos de código de todos los juegos existentes:

- **`references/patrones.md`** — Catálogo completo de patrones con código real
