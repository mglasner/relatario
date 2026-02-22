---
name: Crear Personaje o Villano
description: >
    Esta skill debe usarse cuando el usuario pide "crear villano", "crear héroe",
    "nuevo personaje", "nuevo enemigo", "agregar villano", "agregar personaje",
    "crear esbirro", "crear pesadilla", o menciona crear/agregar un personaje
    jugable o enemigo para La Mansión de Aventuras.
---

# Crear Personaje o Villano

Guía el proceso completo de creación de héroes (personajes jugables) y villanos
(enemigos) para La Mansión de Aventuras, asegurando que los datos se definan en la
fuente de verdad correcta y que todos los assets se generen y optimicen.

## Regla Fundamental

**NUNCA editar `js/personajes.js` ni `js/enemigos.js` directamente.**
Estos archivos son generados automáticamente desde `datos/*.yaml` por
`scripts/build-datos.js`. Cualquier edición manual será sobreescrita.

## Flujo de Creación

### Paso 1: Definir el personaje

Acordar con el usuario los datos del personaje. Consultar `references/campos-yaml.md`
para los campos requeridos según el tipo (héroe o villano).

**Convenciones del juego (CLAUDE.md):**
- Apto para niños desde 7 años
- Estilo visual: cartoon/fantasía/aventura, sin sangre ni gore
- Descripciones: tono de aventura, fantasía y misterio, nunca violento
- Ataques: nombres de magia/aventura/misterio (no violencia explícita)
- Descripciones en dos párrafos separados por `\n\n`

**Tiers de villanos** (de menor a mayor poder):

| Tier | Emoji | Vida típica | Uso |
|------|-------|------------|-----|
| esbirro | 👹 | 35-50 | Villanos menores, cómicos |
| elite | ⚔️ | 140-180 | Villanos principales |
| pesadilla | 👁️ | 200+ | Jefes de zona |
| leyenda | 🔥 | 250+ | Jefe final |

### Paso 2: Generar avatar

Generar la imagen con `mcp__image-gen__generate_image`:
- Aspecto circular (1:1), estilo semi-cartoon
- Paleta variada según temática del personaje
- Sin texto/labels en la imagen
- Apto para niños

Mostrar la imagen al usuario para aprobación antes de continuar.

### Paso 3: Optimizar imagen

Convertir PNG a webp y mover al directorio correcto:

```bash
# Villanos
npx cwebp-bin -q 80 <origen>.png -o assets/img/enemigos/<nombre>.webp

# Héroes
npx cwebp-bin -q 80 <origen>.png -o assets/img/personajes/<nombre>.webp
```

Eliminar el PNG original de `assets/img/generadas/` después de convertir.

### Paso 4: Agregar datos al YAML

Editar el archivo YAML correspondiente (fuente de verdad):
- **Villanos**: `datos/enemigos.yaml`
- **Héroes**: `datos/personajes.yaml`

Consultar `references/campos-yaml.md` para la estructura exacta de campos.

### Paso 5: Agregar paleta CSS

Agregar la clase CSS en `estilos.css`, antes del comentario
`/* --- Overlay de empezar */`. Consultar `references/paleta-css.md` para la
estructura exacta según tipo (villano o héroe).

Elegir colores que no repitan paletas existentes. Verificar con:
```bash
grep "^/\* .* — " estilos.css
```

### Paso 6: Regenerar JS

Ejecutar el build para generar los archivos JS desde YAML:

```bash
node scripts/build-datos.js
```

Verificar que el personaje aparezca en el JS generado:
```bash
grep "new Enemigo\|new Personaje" js/enemigos.js js/personajes.js
```

### Paso 7: Validar

```bash
npm run lint
```

### Paso 8 (opcional): Sprite sheet para platformer

Si el personaje aparecerá en la Habitación 4 (El Abismo), generar su sprite sheet
siguiendo el procedimiento en `references/sprites-plat.md`. Incluye generación con
IA, procesamiento de frames, ensamblaje y registro en `spritesPlat.js`.

Personajes sin sprite sheet usan fallback procedural automáticamente, por lo que
este paso puede hacerse después.

## Creación Múltiple

Al crear varios personajes en una sesión, repetir los pasos 2-4 para cada uno,
luego hacer los pasos 5-6 una sola vez al final.

## Referencias

- **`references/campos-yaml.md`** — Esquemas YAML completos para héroes y villanos
- **`references/paleta-css.md`** — Estructura CSS de paletas con ejemplo
- **`references/sprites-plat.md`** — Procedimiento completo para sprite sheets del platformer
