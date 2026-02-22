# Sprite Sheets para el Platformer (Habitación 4)

Procedimiento para generar sprite sheets de personajes y enemigos que aparecen
en la Habitación 4 (El Abismo). Los sprites se renderizan a 48×60 px sobre un
hitbox de 12×14.

## Layouts

Existen dos layouts según si el personaje tiene ataques:

- **9 frames** (sin ataques): `[idle×2, run×4, jump, fall, hit]`
- **15 frames** (con ataques): `[idle×2, run×6, jump, fall, hit, atk1×2, atk2×2]`

El valor de `frames` (9 o 15) en `SPRITE_SHEETS` determina qué layout usa el
código automáticamente. Personajes sin sprite sheet usan fallback procedural.

## Paso 1: Generar sprite sheet con IA

Usar la tool `generate_image` con estos parámetros clave:

- **aspectRatio**: `3:2` (para 15 frames en 3×5) o `21:9` (para 9 frames en 2×5)
- **Fondo**: verde chroma key `#00ff00`
- **Estilo**: pixel art, chibi, 16-bit retro platformer

**Estructura del prompt (15 frames):**

```text
Pixel art sprite sheet for a 2D platformer game. Character: [DESCRIPCIÓN FÍSICA
DEL PERSONAJE - antropomorfo/humano, ropa, colores, proporciones chibi, rasgos
distintivos].

Show exactly 15 frames arranged in 3 rows of 5 frames each, on a solid bright
green background (#00ff00 chroma key). Side view facing right.

Row 1: Frame 1 = idle standing still. Frame 2 = idle with slight breathing
movement. Frame 3 = running with LEFT LEG stepping forward and RIGHT ARM forward.
Frame 4 = running with both legs under body (passing position). Frame 5 = running
with RIGHT LEG stepping forward and LEFT ARM forward.

Row 2: Frame 6 = running with LEFT LEG far forward in a stride. Frame 7 = running
with RIGHT LEG far forward in a stride. Frame 8 = running with both legs under
body again. Frame 9 = jumping upward with both arms raised and legs tucked
together. Frame 10 = falling downward with arms and legs spread wide.

Row 3: Frame 11 = hurt/recoiling in pain. Frame 12 = [ATAQUE 1 WIND-UP]. Frame
13 = [ATAQUE 1 GOLPE]. Frame 14 = [ATAQUE 2 WIND-UP]. Frame 15 = [ATAQUE 2
GOLPE].

IMPORTANT: In the running frames, alternate which leg is in front - frames 3 and
6 show LEFT leg forward, frames 5 and 7 show RIGHT leg forward.

Clean pixel art style, 16-bit retro platformer aesthetic, crisp pixels, consistent
character across all frames.
```

**Lecciones aprendidas:**

- Ser EXPLÍCITO sobre alternancia de piernas izquierda/derecha en cada frame de carrera
- Para personajes animales, especificar "anthropomorphic, bipedal, walks on two legs like a human"
- Si la IA genera frames con la misma pierna siempre adelante, regenerar con prompt más explícito
- NO usar espejo horizontal para simular alternancia: voltea todo el cuerpo, no solo las piernas

## Paso 2: Procesar — extraer frames individuales

1. Agregar entrada en `SHEETS` de `scripts/procesar-sprites.cjs`:

   ```js
   { input: 'spritesheet_{nombre}_vN.jpg', output: '{nombre}.png', name: 'Nombre' },
   ```

2. Ejecutar: `node scripts/procesar-sprites.cjs`
3. Inspeccionar frames ampliados (el script genera `{nombre}_frame{N}.png` y `{nombre}_frame{N}_4x.png`)
4. Verificar: alternancia de piernas en run, poses claras de jump/fall/hit/ataques

## Paso 3: Mapear frames y ensamblar

1. Identificar visualmente qué frame detectado corresponde a cada estado de animación
2. Agregar mapeo en `PERSONAJES` de `scripts/ensamblar-sprites.cjs`:

   ```js
   nombre: {
       // idle(2) + run(6) + jump + fall + hit + atk1(2) + atk2(2) = 15
       frames: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
   },
   ```

   - Saltar frames de ruido (ej: frame de 1×3 px)
   - El script soporta `{ idx: N, flip: true }` para espejo horizontal (usar con cautela)

3. Ejecutar: `node scripts/ensamblar-sprites.cjs`
4. Verificar preview generado en `assets/img/sprites-plat/{nombre}_preview.png`

## Paso 4: Registrar en el código

Agregar entrada en `SPRITE_SHEETS` (o `ENEMY_SPRITE_SHEETS` para enemigos) de
`js/habitaciones/habitacion4/spritesPlat.js`:

```js
const SPRITE_SHEETS = {
    nombre: { src: 'assets/img/sprites-plat/nombre.png', frames: 15 },
};
```

## Paso 5: Limpiar temporales

```bash
rm assets/img/sprites-plat/*_frame*.png assets/img/sprites-plat/*_preview.png
rm assets/img/generadas/*_preview.png
```
