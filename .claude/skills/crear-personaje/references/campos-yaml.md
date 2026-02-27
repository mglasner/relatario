# Esquemas YAML

## Villano (`datos/enemigos.yaml`)

```yaml
Nombre del Villano:
    tier: esbirro|elite|pesadilla|leyenda      # Requerido
    vida: 50                                   # Requerido (int)
    img: assets/img/enemigos/nombre.webp       # Requerido
    clase: villano-nombre                      # Requerido (sin espacios, kebab-case)
    descripcion: "Párrafo 1.\n\nPárrafo 2."   # Requerido (comillas dobles para \n)
    edad: 120                                  # Requerido (int)
    velocidad: 6                               # Requerido (1-10)
    velAtaque: 7                               # Requerido (1-10)
    estatura: 0.6                              # Requerido (metros, float)
    ataques:                                   # Mínimo 1 ataque
        - nombre: Nombre del Ataque
          dano: 10                             # int
          descripcion: Descripción corta
        - nombre: Segundo Ataque
          dano: 15
          descripcion: Descripción corta
```

**Notas villanos:**
- Si el nombre tiene espacios (ej: "El Profano"), usar tal cual — el generador
  agrega comillas automáticamente en la clave JS.
- `clase` debe ser `villano-` + nombre en kebab-case sin artículos
  (ej: "La Grotesca" → `villano-grotesca`).
- Descripciones con `\n` requieren comillas dobles `"..."` en YAML.
- Descripciones sin `\n` pueden usar comillas simples `'...'`.
- Escapar comillas internas con `\"` dentro de comillas dobles.

## Héroe (`datos/personajes.yaml`)

```yaml
Nombre:
    vida: 90                                   # Requerido (int)
    img: assets/img/personajes/nombre.webp     # Requerido
    clase: jugador-nombre                      # Requerido (kebab-case)
    descripcion: |                             # Requerido (bloque YAML multilínea)
        Párrafo 1 de la descripción del personaje. Tono divertido
        y cercano, describiendo personalidad y habilidades.

        Párrafo 2 con más detalles sobre el personaje en acción
        dentro del juego.
    edad: 10                                   # Requerido (int)
    velocidad: 8                               # Requerido (1-10)
    velAtaque: 7                               # Requerido (1-10)
    estatura: 1.4                              # Requerido (metros, float)
    colorHud: '#2ecc71'                        # Requerido (color principal HUD)
    colorHudClaro: '#6bfc86'                   # Requerido (color claro HUD)
    colorPiel: '#f5d0a9'                       # Requerido (color piel avatar)
    emojiHud: "\u2728"                         # Requerido (emoji unicode)
    ataques:                                   # Mínimo 1 ataque
        - nombre: Nombre del Ataque
          dano: 20
          descripcion: Descripción corta
        - nombre: Segundo Ataque
          dano: 10
          descripcion: Descripción corta
```

**Notas héroes:**
- `clase` debe ser `jugador-` + nombre en kebab-case.
- Descripciones usan bloque literal `|` de YAML (saltos de línea naturales).
- Colores HUD en formato hex con comillas simples.
- Emojis en formato unicode escapado `"\uXXXX"` o `"\U000XXXXX"`.

## Rangos de stats por tier

| Stat | Esbirro | Élite | Pesadilla | Leyenda |
|------|---------|--------|-----------|---------|
| Vida | 35-60 | 130-180 | 200-250 | 250+ |
| Velocidad | 5-8 | 3-6 | 3-5 | 4-7 |
| Vel. Ataque | 5-8 | 3-5 | 4-6 | 5-7 |

## Ataques

Cada personaje tiene exactamente **2 ataques**: uno asignado al slot rápido (botón A)
y otro al slot fuerte (botón B). Cada ataque requiere:

```yaml
ataques:
    - nombre: Nombre del Ataque
      dano: 20                    # int — calibrado por fórmula de Poder Efectivo
      descripcion: Descripción corta
      arquetipo: carga            # carga | salto | aoe | proyectil
      color: '#rrggbb'           # color principal del efecto visual
      colorSecundario: '#rrggbb' # color secundario del efecto visual
      radio: 3                   # solo para aoe — radio del área
```

### Arquetipos de ataque

| Arquetipo | Uso visual | Riesgo | Efecto en balance |
|-----------|-----------|--------|-------------------|
| **carga** | Golpe cuerpo a cuerpo | Alto | Permite mayor daño raw |
| **salto** | Gap-closer con desplazamiento | Medio-alto | Ligeramente menor daño |
| **aoe** | Área de efecto | Medio | Menor daño (difícil de esquivar) |
| **proyectil** | Orbe a distancia | Bajo | Requiere menor daño raw |

### Calibración de daño — Poder Efectivo

**No asignar valores de daño arbitrariamente.** Usar la fórmula de Poder Efectivo
documentada en `references/balance-duelo.md` para derivar los valores de `dano`
que equilibren al personaje con su tier.

Resumen rápido del procedimiento:
1. Fijar HP, velocidad y arquetipos (identidad del personaje)
2. Calcular `velMod`, `hpMod`, `agrMod`
3. Derivar `DPS_adj_target = Poder_target / (velMod × hpMod × agrMod)`
4. Buscar valores enteros de d₁ y d₂ que satisfagan el target
5. Verificar que el Poder final caiga en la banda del tier

### Rangos de daño resultantes por tier

| Tier | d₁ (rápido) | d₂ (fuerte) | Poder objetivo |
|------|-------------|-------------|----------------|
| Esbirro | 6–9 | 10–12 | ~10 |
| Héroe | 15–25 | 11–28 | 40 |
| Élite | 12–22 | 13–18 | 40 |
| Pesadilla | 14–18 | 19–24 | 75 |
| Leyenda | 18–25 | 22–30 | 90 |

Los rangos de héroes/élites son amplios porque compensan variaciones de HP y velocidad.

### Antes de crear un personaje

1. Leer `references/balance-duelo.md` para la fórmula completa y ejemplos
2. Revisar `datos/enemigos.yaml` y `datos/personajes.yaml` para contexto
3. Calcular los valores de daño con la fórmula — no copiar de personajes existentes
