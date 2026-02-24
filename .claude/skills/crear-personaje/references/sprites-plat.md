# Sprite Sheets para el Platformer (El Abismo)

Procedimiento para generar sprite sheets de personajes y enemigos que aparecen
en El Abismo. Los sprites se renderizan a 48x60 px sobre un hitbox de 12x14.

## Directorios

| Directorio | Contenido |
|---|---|
| `assets/img/generadas/sprites/` | Intermedios: `{nombre}-2x.png` (chromakey) y `{nombre}-rgba.png` (transparente, editable en GIMP) |
| `assets/img/sprites-plat/` | Strips finales: `{nombre}.png` (17 frames de 96x120 px) |
| `assets/img/sprites-plat/debug/` | Frames individuales para inspeccion (generados con `--debug`) |

## Prerequisito: Estudiar al personaje

**ANTES de generar cualquier sprite, SIEMPRE:**

1. **Leer el avatar** del personaje (`assets/img/personajes/{nombre}.webp` o
   `assets/img/enemigos/{nombre}.webp`) para ver su apariencia visual real
2. **Leer sus datos** en `datos/personajes.yaml` o `datos/enemigos.yaml`:
   descripcion, ataques, estatura, edad, genero
3. Usar estos datos para construir una descripcion fisica detallada en el prompt:
   ropa, colores, accesorios, proporciones, rasgos distintivos

Sin este paso el sprite sera generico y no se parecera al personaje.

## Layout unificado (17 frames)

```text
[idle x2, run x6, jump, fall, hit, atk1 x2, atk2 x2, crouch x2]
```

Distribucion en la grilla generada (4 filas):

- **Fila 1** (5 frames): idle1, idle2, run1, run2, run3
- **Fila 2** (5 frames): run4, run5, run6, jump, fall
- **Fila 3** (5 frames): hit, atk1-windup, atk1-strike, atk2-windup, atk2-strike
- **Fila 4** (2 frames): crouch1, crouch2

## Pipeline chromakey (3 pasos)

La IA (Gemini) no soporta transparencia nativa. Se genera sobre un fondo
chromakey solido y se remueve en post-proceso con analisis HSV.

### Paso 1: Generar sprite sheet con IA

Usar `mcp__image-gen__generate_image` con estos parametros:

| Parametro | Valor |
|---|---|
| `aspectRatio` | `3:2` |
| `fileName` | `{nombre}-2x.png` |
| `inputImagePath` | Ruta absoluta al avatar del personaje |
| `maintainCharacterConsistency` | `true` |

**Color de fondo chromakey:** Elegir segun la paleta del personaje:

- `#00FF00` (verde) — para personajes SIN verde en su paleta
- `#FF00FF` (magenta) — para personajes CON verde (piel, ropa, efectos)

**Tabla de asignacion actual:**

| Personaje | Chromakey | Razon |
|---|---|---|
| Lina | verde | sin verde en paleta |
| Rose | magenta | tiene verde (tela, shorts) |
| PandaJuro | magenta | tiene verde (bambu) |
| Hana | verde | sin verde; tiene magenta/rosa |
| Kira | magenta | tiene teal/turquesa |
| DonBu | verde | sin verde en paleta |
| PomPom | verde | sin verde en paleta |
| Orejas | magenta | tiene azul-verdoso (ropa) |
| Trasgo | magenta | es verde oliva |
| Topete | verde | sin verde en paleta |
| Pototo | verde | sin verde en paleta |
| Siniestra | verde | sin verde; tiene rojo-naranja |
| Errante | magenta | tiene verde enfermizo |
| Profano | verde | sin verde; tiene purpura/naranja |
| Grotesca | verde | sin verde en paleta |
| Disonante | verde | sin verde puro en paleta |
| Comelon | magenta | tiene verde (baba) |
| Nebulosa | verde | sin verde; tiene purpura/lavanda |

**Estructura del prompt:**

```text
Pixel art sprite sheet for a 2D platformer game. Character: [DESCRIPCION
FISICA DETALLADA basada en el avatar y datos YAML — ropa, colores, accesorios,
proporciones, rasgos unicos del personaje].

Show exactly 17 frames arranged in 4 rows on a PURE SOLID {GREEN #00FF00 |
MAGENTA #FF00FF} background. The background must be completely flat and
uniform, no gradients, no shadows on ground, no grid pattern, just pure solid
{#00FF00 | #FF00FF} everywhere. Side view facing right.

Row 1 (5 frames): Frame 1 = idle standing still [con accesorio/pose
caracteristica]. Frame 2 = idle with slight breathing movement. Frame 3 =
running with LEFT LEG stepping forward and RIGHT ARM forward. Frame 4 =
running with both legs under body (passing position). Frame 5 = running with
RIGHT LEG stepping forward and LEFT ARM forward.

Row 2 (5 frames): Frame 6 = running with LEFT LEG far forward in a stride.
Frame 7 = running with RIGHT LEG far forward in a stride. Frame 8 = running
with both legs under body again. Frame 9 = jumping upward with both arms
raised and legs tucked together. Frame 10 = falling downward with arms and
legs spread wide.

Row 3 (5 frames): Frame 11 = hurt/recoiling in pain. Frame 12 = [ATAQUE 1
nombre] wind-up ([descripcion especifica]). Frame 13 = [ATAQUE 1 nombre]
strike ([descripcion especifica]). Frame 14 = [ATAQUE 2 nombre] wind-up
([descripcion especifica]). Frame 15 = [ATAQUE 2 nombre] strike ([descripcion
especifica]).

Row 4 (2 frames): Frame 16 = crouching down, knees bent. Frame 17 = crouching
lower, more compressed.

IMPORTANT: In the running frames, alternate which leg is in front - frames 3
and 6 show LEFT leg forward, frames 5 and 7 show RIGHT leg forward. Keep
[RASGOS CLAVE del personaje] consistent across ALL frames.

Clean pixel art style, 16-bit retro platformer aesthetic, crisp pixels,
consistent character across all frames.
```

### Paso 2: Remover chromakey

```bash
uv run --with Pillow --with numpy --with scipy \
  scripts/remover-chromakey.py \
  assets/img/generadas/sprites/{nombre}-2x.png \
  assets/img/generadas/sprites/{nombre}-rgba.png \
  --color green|magenta
```

El script analiza por HSV, crea mascara de fondo, dilata para bordes
anti-aliasados, y aplica transicion suave. Solo remueve regiones conectadas
al borde (no toca pixels interiores).

Si no se pasa `--color`, auto-detecta analizando los bordes de la imagen.

**Revision manual:** Preguntar al usuario si quiere correr el post-proceso
de inmediato o si prefiere primero editar manualmente el archivo `-rgba.png`
en GIMP para limpiar residuos de chromakey. Casi siempre quedan pixels
residuales que requieren limpieza manual (Select by Color, threshold ~30,
Delete). Si el usuario elige editar primero, darle la ruta al archivo
`-rgba.png` y esperar a que avise que termino antes de continuar.

### Paso 3: Post-procesar (pipeline existente)

```bash
uv run --with Pillow --with numpy --with scipy \
  scripts/postproceso-sprites-2x.py \
  assets/img/generadas/sprites/{nombre}-rgba.png \
  assets/img/sprites-plat/{nombre}.png --debug
```

Este paso:
1. Detecta que ya tiene alpha real y salta la remocion de cuadricula
2. Detecta los 17 frames como islas de contenido opaco
3. Calcula una escala uniforme (el frame mas grande define)
4. Redimensiona todos a 96x120 px, pies alineados abajo
5. Ensambla en strip horizontal de 17 frames

Con `--debug` guarda frames individuales en
`assets/img/sprites-plat/debug/{nombre}-rgba/` para inspeccion.

## Registro en el codigo

Si el personaje es nuevo, agregar entrada en `SPRITE_SHEETS` o
`ENEMY_SPRITE_SHEETS` de `js/juegos/abismo/spritesPlat.js`:

```js
nombre: { src: 'assets/img/sprites-plat/nombre.png' },
```

## Lecciones aprendidas

- **SIEMPRE revisar el avatar y datos YAML** antes de generar — sin esto el
  sprite sale generico e irreconocible
- Usar `inputImagePath` apuntando al avatar y `maintainCharacterConsistency:
  true` para que la IA mantenga la apariencia
- Ser EXPLICITO sobre alternancia de piernas izq/der en cada frame de carrera
- Para personajes animales: "anthropomorphic, bipedal, walks on two legs"
- Personalizar los frames de ataque segun los ataques reales del YAML
  (ej: "Cadenazo" → "chain whip wind-up / chain whip strike")
- Si un accesorio ancho (ej: baston extendido) causa que la escala sea muy
  chica, considerar aceptarlo o ajustar la pose del frame problematico
- Residuos de chromakey en el sprite son inevitables y se limpian manualmente
  en GIMP (Select by Color → Delete)
- NO usar espejo horizontal para simular alternancia: voltea todo el cuerpo

## Limpiar temporales

```bash
rm -rf assets/img/sprites-plat/debug/
```

Los archivos en `assets/img/generadas/sprites/` se conservan como referencia
para futuras regeneraciones.
