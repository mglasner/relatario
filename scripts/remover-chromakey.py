#!/usr/bin/env python3
"""Remueve fondo chromakey (verde #00FF00 o magenta #FF00FF) de sprites generados por IA.

Usa analisis en espacio HSV para crear mascara de fondo con transicion
suave en bordes anti-aliasados.

Uso:
  # Individual (auto-detecta color)
  uv run --with Pillow --with numpy --with scipy \
    scripts/remover-chromakey.py <entrada.png> <salida.png>

  # Individual con color explicito
  uv run --with Pillow --with numpy --with scipy \
    scripts/remover-chromakey.py <entrada.png> <salida.png> --color green

  # Batch (usa tabla de asignacion interna)
  uv run --with Pillow --with numpy --with scipy \
    scripts/remover-chromakey.py --batch
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

# ─── Asignacion de chromakey por personaje ──────────────────────────

CHROMAKEY = {
    # Heroes
    "lina": "green",
    "rose": "magenta",
    "pandajuro": "magenta",
    "hana": "green",
    "kira": "magenta",
    "donbu": "green",
    "pompom": "green",
    "orejas": "magenta",
    # Enemigos
    "trasgo": "magenta",
    "topete": "green",
    "pototo": "green",
    "siniestra": "green",
    "errante": "magenta",
    "profano": "green",
    "grotesca": "green",
    "disonante": "green",
    "comelon": "magenta",
    "nebulosa": "green",
}

# ─── Parametros HSV ─────────────────────────────────────────────────

# OpenCV usa H:0-180, S:0-255, V:0-255
# Nosotros trabajamos con H:0-360 (grados), S/V: 0-1 (fracciones)

PARAMS = {
    "green": {
        "hue_center": 120,  # grados (verde puro)
        "hue_range": 25,    # ±25 grados
        "sat_min": 0.75,    # saturacion minima
        "val_min": 0.70,    # value minimo
    },
    "magenta": {
        "hue_center": 300,  # grados (magenta puro)
        "hue_range": 25,    # ±25 grados
        "sat_min": 0.75,
        "val_min": 0.70,
    },
}


# ─── Conversion RGB → HSV ──────────────────────────────────────────


def rgb_a_hsv(arr):
    """Convierte array RGB (uint8) a HSV con H en grados [0,360], S y V en [0,1]."""
    rgb = arr[:, :, :3].astype(np.float32) / 255.0
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    cmax = np.maximum(np.maximum(r, g), b)
    cmin = np.minimum(np.minimum(r, g), b)
    delta = cmax - cmin

    # Hue
    hue = np.zeros_like(delta)
    mask_r = (cmax == r) & (delta > 0)
    mask_g = (cmax == g) & (delta > 0)
    mask_b = (cmax == b) & (delta > 0)
    hue[mask_r] = 60 * (((g[mask_r] - b[mask_r]) / delta[mask_r]) % 6)
    hue[mask_g] = 60 * (((b[mask_g] - r[mask_g]) / delta[mask_g]) + 2)
    hue[mask_b] = 60 * (((r[mask_b] - g[mask_b]) / delta[mask_b]) + 4)

    # Saturacion
    sat = np.zeros_like(delta)
    mask_s = cmax > 0
    sat[mask_s] = delta[mask_s] / cmax[mask_s]

    return hue, sat, cmax  # cmax = value


# ─── Deteccion automatica del color ────────────────────────────────


def detectar_color_chromakey(arr):
    """Detecta si el fondo es verde o magenta analizando los bordes de la imagen."""
    h, w = arr.shape[:2]
    borde = 20  # pixels del borde a analizar

    # Recolectar pixels de los 4 bordes
    top = arr[:borde, :, :3]
    bottom = arr[h - borde :, :, :3]
    left = arr[:, :borde, :3]
    right = arr[:, w - borde :, :3]
    pixels = np.concatenate(
        [top.reshape(-1, 3), bottom.reshape(-1, 3), left.reshape(-1, 3), right.reshape(-1, 3)]
    )

    # Promedios por canal
    r_avg = pixels[:, 0].mean()
    g_avg = pixels[:, 1].mean()
    b_avg = pixels[:, 2].mean()

    # Verde puro: G alto, R y B bajos
    score_verde = g_avg - (r_avg + b_avg) / 2
    # Magenta puro: R y B altos, G bajo
    score_magenta = (r_avg + b_avg) / 2 - g_avg

    if score_verde > score_magenta:
        return "green"
    return "magenta"


# ─── Remocion de chromakey ──────────────────────────────────────────


def remover_chromakey(arr, color):
    """Remueve fondo chromakey de una imagen usando analisis HSV.

    Args:
        arr: numpy array de la imagen (RGB o RGBA)
        color: "green" o "magenta"

    Returns:
        numpy array RGBA con fondo transparente
    """
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]
    params = PARAMS[color]

    # Paso 1: Convertir a HSV
    hue, sat, val = rgb_a_hsv(arr)

    # Paso 2: Crear mascara de fondo
    hue_center = params["hue_center"]
    hue_range = params["hue_range"]

    # Distancia angular del hue (maneja wrap-around 360→0)
    hue_diff = np.abs(hue - hue_center)
    hue_diff = np.minimum(hue_diff, 360 - hue_diff)

    es_fondo_hue = hue_diff <= hue_range
    es_fondo_sat = sat >= params["sat_min"]
    es_fondo_val = val >= params["val_min"]

    mascara_fondo = es_fondo_hue & es_fondo_sat & es_fondo_val

    # Paso 3: Dilatar mascara para atrapar bordes anti-aliasados
    mascara_dilatada = ndimage.binary_dilation(
        mascara_fondo, structure=np.ones((3, 3)), iterations=2
    )

    # Paso 4: Solo regiones conectadas al borde (evitar tocar pixels interiores)
    etiquetas, _ = ndimage.label(mascara_dilatada)
    etiquetas_borde = set()
    etiquetas_borde.update(etiquetas[0, :][etiquetas[0, :] > 0])
    etiquetas_borde.update(etiquetas[-1, :][etiquetas[-1, :] > 0])
    etiquetas_borde.update(etiquetas[:, 0][etiquetas[:, 0] > 0])
    etiquetas_borde.update(etiquetas[:, -1][etiquetas[:, -1] > 0])

    region_borde = np.zeros((h, w), dtype=bool)
    for et in etiquetas_borde:
        region_borde |= etiquetas == et

    # Mascara final: fondo original intersecado con region conectada al borde
    fondo_conectado = mascara_fondo & region_borde

    # Paso 5: Transicion suave en bordes
    # Usar la distancia al hue del chromakey para suavizar
    # Pixels con hue muy cercano → mas transparentes
    # Pixels con hue lejano → opacos

    # Expandir zona de transicion: pixels en la dilatacion pero no en fondo estricto
    zona_transicion = mascara_dilatada & region_borde & ~fondo_conectado

    # Alpha base: fondo=0, foreground=255
    alpha = np.full((h, w), 255, dtype=np.uint8)
    alpha[fondo_conectado] = 0

    # Suavizar zona de transicion basado en cercania al chromakey
    if zona_transicion.any():
        # Factor basado en distancia de hue (0=chromakey exacto, 1=lejos)
        factor_hue = np.clip(hue_diff / (hue_range * 1.5), 0, 1)
        # Factor basado en saturacion (alta sat del color → mas transparente)
        factor_sat = np.clip(1 - (sat - params["sat_min"] * 0.5) / (1 - params["sat_min"] * 0.5), 0, 1)
        # Combinar: alpha bajo si es cercano al chromakey
        alpha_transicion = np.clip(factor_hue * 0.7 + factor_sat * 0.3, 0, 1)
        alpha_transicion = (alpha_transicion * 255).astype(np.uint8)
        alpha[zona_transicion] = alpha_transicion[zona_transicion]

    return np.dstack([rgb, alpha])


# ─── Pipeline ───────────────────────────────────────────────────────


def procesar_imagen(ruta_entrada, ruta_salida, color=None):
    """Procesa una imagen: detecta color si no se especifica, remueve chromakey."""
    nombre = ruta_entrada.stem.replace("-2x", "")
    print(f"  {nombre}...", end=" ", flush=True)

    img = Image.open(ruta_entrada)
    if img.mode != "RGB":
        img = img.convert("RGB")
    arr = np.array(img)

    # Auto-detectar color si no se especifica
    if color is None:
        color = detectar_color_chromakey(arr)
        print(f"[auto: {color}]", end=" ", flush=True)
    else:
        print(f"[{color}]", end=" ", flush=True)

    # Remover chromakey
    rgba = remover_chromakey(arr, color)

    # Guardar
    ruta_salida.parent.mkdir(parents=True, exist_ok=True)
    img_salida = Image.fromarray(rgba, "RGBA")
    img_salida.save(ruta_salida, "PNG")

    # Stats
    total_px = rgba.shape[0] * rgba.shape[1]
    transparentes = (rgba[:, :, 3] == 0).sum()
    pct = transparentes / total_px * 100
    print(f"OK ({pct:.1f}% transparente)")
    return True


def main():
    argv = sys.argv[1:]

    # Modo batch
    if "--batch" in argv:
        base = Path(__file__).resolve().parent.parent
        dir_generadas = base / "assets" / "img" / "generadas" / "sprites"
        dir_salida = dir_generadas  # guardar junto a las generadas como *-rgba.png

        if not dir_generadas.exists():
            print(f"ERROR: No existe {dir_generadas}")
            sys.exit(1)

        print(f"Removiendo chromakey en batch")
        print(f"  Directorio: {dir_generadas}")
        print()

        exitosos = 0
        omitidos = 0
        errores = 0

        for nombre, color in CHROMAKEY.items():
            ruta_entrada = dir_generadas / f"{nombre}-2x.png"
            ruta_salida = dir_generadas / f"{nombre}-rgba.png"

            if not ruta_entrada.exists():
                omitidos += 1
                continue

            try:
                ok = procesar_imagen(ruta_entrada, ruta_salida, color)
                if ok:
                    exitosos += 1
                else:
                    errores += 1
            except Exception as e:
                print(f"ERROR: {e}")
                errores += 1

        print(f"\nResultado: {exitosos} OK, {omitidos} omitidos, {errores} errores")
        sys.exit(0 if errores == 0 else 1)

    # Modo individual
    if len(argv) < 2:
        print("Uso:")
        print("  remover-chromakey.py <entrada.png> <salida.png> [--color green|magenta]")
        print("  remover-chromakey.py --batch")
        sys.exit(1)

    ruta_entrada = Path(argv[0])
    ruta_salida = Path(argv[1])

    color = None
    if "--color" in argv:
        idx = argv.index("--color")
        if idx + 1 < len(argv):
            color = argv[idx + 1]
            if color not in ("green", "magenta"):
                print(f"ERROR: Color invalido '{color}'. Usar 'green' o 'magenta'.")
                sys.exit(1)

    if not ruta_entrada.exists():
        print(f"ERROR: No existe {ruta_entrada}")
        sys.exit(1)

    try:
        ok = procesar_imagen(ruta_entrada, ruta_salida, color)
        sys.exit(0 if ok else 1)
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
