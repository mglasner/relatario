# Balance de El Duelo — Poder Efectivo

Sistema de balance para calibrar los atributos de combate de personajes en El Duelo.
Todos los personajes nuevos deben pasar por esta fórmula antes de asignar valores de daño.

## Fórmula

```
Poder = DPS_ajustado × velMod × hpMod × agrMod
```

### Componentes

**DPS ajustado** — daño por segundo ponderado por mix de ataque (60% rápido, 40% fuerte):

```
DPS_ajustado = 0.6 × (DPS₁ × archMod₁) + 0.4 × (DPS₂ × archMod₂)

DPS₁ (rápido) = round((8 + daño₁) / 2) × 3      # ciclo 20 frames → 3 ataques/seg
DPS₂ (fuerte) = round((15 + daño₂) / 2) × 1.5    # ciclo 40 frames → 1.5 ataques/seg
```

- `8` y `15` son las constantes `ataqueRapidoDanoBase` y `ataqueFuerteDanoBase` de `datos/duelo.yaml`
- `daño₁` y `daño₂` son los valores `dano` del primer y segundo ataque en el YAML del personaje
- El daño efectivo por golpe es `round((base + dano_yaml) / 2)` — promedio entre base del sistema y daño propio

**velMod** — ventaja posicional por velocidad (evasión, persecución, retirada):

```
velMod = 1 + (velocidad − 6) × 0.04
```

- Referencia: vel=6 → 1.0 (neutro)
- vel=3 → 0.88 (lento, penalizado)
- vel=9 → 1.12 (rápido, bonificado)

**hpMod** — factor de supervivencia (raíz cuadrada para evitar escala extrema):

```
hpMod = √(HP / 100)
```

- HP=85 → 0.92, HP=100 → 1.0, HP=140 → 1.18, HP=240 → 1.55

**agrMod** — frecuencia real de ataque de la IA por tier:

```
esbirro:   0.6
héroe:     1.0    (controlado por jugador)
elite:     1.0
pesadilla: 1.5
leyenda:   1.5    (usar mismo que pesadilla)
```

## Multiplicadores de Arquetipo (archMod)

Cada ataque tiene un arquetipo que determina su riesgo/recompensa.
Un ataque seguro (proyectil) es más fácil de conectar, así que cada punto de
DPS "vale más" — requiere menor daño raw para el mismo Poder Efectivo.

| Arquetipo | archMod | Riesgo | Descripción |
|-----------|---------|--------|-------------|
| **carga** | 1.00 | Alto | Cuerpo a cuerpo directo. Máximo daño raw. |
| **salto** | 1.05 | Medio-alto | Gap-closer, algo más seguro por desplazamiento. |
| **aoe** | 1.10 | Medio | Cobertura de área, difícil de esquivar. |
| **proyectil** | 1.20 | Bajo | A distancia, máxima seguridad. Menor daño raw. |

**Efecto práctico**: para alcanzar Poder = 40, un ataque `carga` puede tener
~14 de DPS raw, pero un `proyectil` solo necesita ~12 de DPS raw
(porque 12 × 1.20 = 14.4 efectivo).

## Targets de Poder por Tier

| Tier | Poder objetivo | Banda | Relación con héroe |
|------|---------------|-------|-------------------|
| Esbirro | ~10 | 7–12 | Cannon fodder, fáciles de vencer |
| Héroe | **40** | 39–41 | Referencia base |
| Elite | **40** | 39–41 | hero ≈ elite (peleas equilibradas) |
| Pesadilla | **75** | 73–77 | ~1.9× héroe (duro pero viable) |
| Leyenda | **90** | 85–95 | ~2.3× héroe (necesita estrategia) |

## Procedimiento para calibrar un personaje nuevo

### 1. Elegir HP, velocidad y arquetipos

Estos definen la identidad del personaje y son restricciones fijas:
- **HP** según tier (ver tabla en campos-yaml.md)
- **Velocidad** según concepto del personaje (3-9)
- **Arquetipos** de cada ataque según temática (carga/salto/aoe/proyectil)

### 2. Calcular multiplicadores fijos

```
velMod = 1 + (vel − 6) × 0.04
hpMod = √(HP / 100)
agrMod = { esbirro: 0.6, héroe: 1.0, elite: 1.0, pesadilla: 1.5 }
```

### 3. Derivar DPS_ajustado objetivo

```
DPS_adj_target = Poder_target / (velMod × hpMod × agrMod)
```

### 4. Distribuir entre los dos ataques

Buscar valores enteros de `daño₁` y `daño₂` que satisfagan:

```
DPS_adj = 0.6 × (round((8 + d₁) / 2) × 3 × archMod₁)
        + 0.4 × (round((15 + d₂) / 2) × 1.5 × archMod₂)
        ≈ DPS_adj_target
```

**Regla de proporción**: el ataque rápido (slot 1) suele tener menor daño YAML
que el fuerte (slot 2), pero no es obligatorio. Lo que importa es que el Poder
final caiga dentro de la banda del tier.

### 5. Verificar

Calcular el Poder final y confirmar que está dentro de la banda:

```
Poder = DPS_adj × velMod × hpMod × agrMod
```

## Ejemplo: calibrar un elite nuevo

Supongamos un nuevo elite con HP=155, vel=6, ataques: carga + proyectil.

```
velMod = 1 + (6 − 6) × 0.04 = 1.0
hpMod = √(155 / 100) = 1.245
agrMod = 1.0

DPS_adj_target = 40 / (1.0 × 1.245 × 1.0) = 32.13
```

Necesitamos d₁ (carga, archMod=1.0) y d₂ (proyectil, archMod=1.20):

Probamos d₁=16, d₂=14:
```
eff₁ = round((8 + 16) / 2) = 12 → DPS₁ = 12 × 3 = 36 × 1.0 = 36
eff₂ = round((15 + 14) / 2) = 15 → DPS₂ = 15 × 1.5 = 22.5 × 1.2 = 27
DPS_adj = 0.6 × 36 + 0.4 × 27 = 21.6 + 10.8 = 32.4

Poder = 32.4 × 1.0 × 1.245 × 1.0 = 40.35 ✓ (dentro de banda 39-41)
```

## Trade-offs de diseño

| Si el personaje tiene... | Entonces debe tener... |
|--------------------------|------------------------|
| HP alto (tanque) | Menor daño raw |
| Velocidad alta | Menor daño raw |
| Solo ataques proyectil | Mayor daño raw (para compensar archMod 1.20) |
| Solo ataques carga | Menor daño raw (archMod 1.0 = valor pleno) |
| HP bajo + vel baja | Mayor daño raw (para compensar doble penalización) |

## Rangos de daño YAML resultantes por tier

Estos son los rangos que resultan de la fórmula, no valores arbitrarios:

| Tier | Ataque rápido (d₁) | Ataque fuerte (d₂) |
|------|--------------------|--------------------|
| Esbirro | 6–9 | 10–12 |
| Héroe | 15–25 | 11–28 |
| Elite | 12–22 | 13–18 |
| Pesadilla | 14–18 | 19–24 |
| Leyenda | 18–25 | 22–30 |

Los rangos de héroes son amplios porque compensan variaciones grandes de HP (85-140)
y velocidad (4-9). Un tanque lento (DonBu: HP=140, vel=4) necesita d₁=24,
mientras que una glass cannon rápida (PomPom: HP=85, vel=8) también necesita d₁=22
— ambos llegan a Poder ≈ 40.
