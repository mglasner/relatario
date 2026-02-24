#!/usr/bin/env python3
"""Post-proceso de sprites 2x: extrae frames de grillas generadas por IA
y los ensambla en tiras horizontales de 96x120px por frame.

Uso:
  # Procesar un solo sprite
  python postproceso-sprites-2x.py <imagen-entrada> <imagen-salida> [--frames N]

  # Procesar todos los sprites pendientes (modo batch)
  python postproceso-sprites-2x.py --batch

Pipeline:
  1. Remover fondo cuadricula (flood fill desde bordes de imagen)
  2. Detectar frames individuales como islas de contenido opaco
  3. Guardar cada frame como PNG individual (debug)
  4. Calcular UNA sola escala para todos los frames (el mas grande define)
  5. Redimensionar todos con la misma escala, alinear pies abajo
  6. Ensamblar en strip horizontal"""

import sys
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage


FRAME_W = 96
FRAME_H = 120
FRAMES_POR_DEFECTO = 17

# Tamaño minimo de un frame valido (en pixels de la imagen fuente)
MIN_FRAME_AREA = 20000  # ~140x140 px

HEROES = [
    ("lina-2x.png", 17, "lina.png"),
    ("rose-2x.png", 17, "rose.png"),
    ("pandajuro-2x.png", 17, "pandajuro.png"),
    ("hana-2x.png", 17, "hana.png"),
    ("kira-2x.png", 17, "kira.png"),
    ("donbu-2x.png", 17, "donbu.png"),
    ("pompom-2x.png", 17, "pompom.png"),
    ("orejas-2x.png", 17, "orejas.png"),
]

ENEMIGOS = [
    ("trasgo-2x.png", 17, "trasgo.png"),
    ("topete-2x.png", 17, "topete.png"),
    ("pototo-2x.png", 17, "pototo.png"),
    ("siniestra-2x.png", 17, "siniestra.png"),
    ("errante-2x.png", 17, "errante.png"),
    ("profano-2x.png", 17, "profano.png"),
    ("grotesca-2x.png", 17, "grotesca.png"),
    ("disonante-2x.png", 17, "disonante.png"),
    ("comelon-2x.png", 17, "comelon.png"),
    ("nebulosa-2x.png", 17, "nebulosa.png"),
]


# ─── Remocion de fondo ──────────────────────────────────────────────


def detectar_colores_cuadricula(arr):
    """Detecta los dos colores de la cuadricula de transparencia desde las esquinas."""
    h, w = arr.shape[:2]
    sz = 16
    esquinas = [
        arr[0:sz, 0:sz],
        arr[0:sz, w - sz:w],
        arr[h - sz:h, 0:sz],
        arr[h - sz:h, w - sz:w],
    ]

    brillos = []
    for esq in esquinas:
        b = esq[:, :, :3].mean(axis=2)
        brillos.append(b.flatten())
    brillos = np.concatenate(brillos)

    mediana = np.median(brillos)
    oscuros = brillos[brillos <= mediana]
    claros = brillos[brillos > mediana]

    color_oscuro = np.median(oscuros) if len(oscuros) > 0 else 77
    color_claro = np.median(claros) if len(claros) > 0 else 152

    return float(color_oscuro), float(color_claro)


def remover_fondo_global(arr):
    """Remueve el fondo de cuadricula usando flood fill desde los bordes.

    Solo hace transparentes los pixeles que son cuadricula Y estan
    conectados al exterior de la imagen."""
    h, w = arr.shape[:2]
    rgb = arr[:, :, :3]

    # Si ya tiene alpha real (ej: chromakey ya removido), usarlo directamente
    if arr.shape[2] == 4:
        ya_transparente = arr[:, :, 3] < 10
        if ya_transparente.sum() > (h * w * 0.05):
            pct = ya_transparente.sum() / (h * w) * 100
            print(f"[alpha real: {pct:.0f}% transparente, saltando remocion de fondo]", end=" ")
            return arr.copy()
    else:
        ya_transparente = np.zeros((h, w), dtype=bool)

    color_oscuro, color_claro = detectar_colores_cuadricula(arr)

    r = rgb[:, :, 0].astype(float)
    g = rgb[:, :, 1].astype(float)
    b = rgb[:, :, 2].astype(float)

    brillo = (r + g + b) / 3
    variacion = np.max(np.stack([r, g, b], axis=2), axis=2) - np.min(
        np.stack([r, g, b], axis=2), axis=2
    )

    # Paso 1: candidatos a cuadricula (tolerancia amplia para anti-aliasing)
    es_gris = variacion < 20
    cerca_oscuro = np.abs(brillo - color_oscuro) < 20
    cerca_claro = np.abs(brillo - color_claro) < 20
    candidato = (es_gris & (cerca_oscuro | cerca_claro)) | ya_transparente

    # Paso 2: dilatar para puentear bordes anti-aliasados
    candidato_dilatado = ndimage.binary_dilation(
        candidato, structure=np.ones((3, 3)), iterations=3
    )

    # Paso 3: componentes conectados → solo los que tocan el borde
    etiquetas, _ = ndimage.label(candidato_dilatado)
    etiquetas_borde = set()
    etiquetas_borde.update(etiquetas[0, :][etiquetas[0, :] > 0])
    etiquetas_borde.update(etiquetas[-1, :][etiquetas[-1, :] > 0])
    etiquetas_borde.update(etiquetas[:, 0][etiquetas[:, 0] > 0])
    etiquetas_borde.update(etiquetas[:, -1][etiquetas[:, -1] > 0])

    region_borde = np.zeros((h, w), dtype=bool)
    for et in etiquetas_borde:
        region_borde |= etiquetas == et

    # Paso 4: transparencia = candidato original ∩ region conectada al borde
    es_fondo = candidato & region_borde

    # Paso 5: limpiar cuadricula encerrada (zonas entre sprites que el flood fill
    # no alcanzo). Criterio estricto para no tocar el personaje.
    cuadricula_estricta = (variacion < 8) & (
        (np.abs(brillo - color_oscuro) < 10) | (np.abs(brillo - color_claro) < 10)
    )
    cuadricula_residual = cuadricula_estricta & ~es_fondo
    es_fondo = es_fondo | cuadricula_residual

    # Paso 6: erosion iterativa — pixels grises adyacentes al fondo ya detectado
    for _ in range(3):
        adyacente = ndimage.binary_dilation(
            es_fondo, structure=np.ones((3, 3)), iterations=1
        ) & ~es_fondo
        gris_adyacente = adyacente & (variacion < 30) & (
            brillo >= min(color_oscuro, color_claro) - 25
        ) & (brillo <= max(color_oscuro, color_claro) + 25)
        if not gris_adyacente.any():
            break
        es_fondo = es_fondo | gris_adyacente

    alpha = np.full((h, w), 255, dtype=np.uint8)
    alpha[es_fondo] = 0

    return np.dstack([rgb, alpha])


# ─── Deteccion de frames ────────────────────────────────────────────


def _subdividir_bbox(rgba_arr, bbox, n_partes):
    """Subdivide un bbox fusionado en n_partes buscando valles verticales de baja opacidad."""
    y0, x0, y1, x1, area = bbox
    alpha = rgba_arr[y0 : y1 + 1, x0 : x1 + 1, 3]

    # Perfil vertical: suma de opacidad por columna
    perfil = alpha.astype(float).sum(axis=0)

    # Buscar los n_partes-1 valles mas profundos como puntos de corte
    w = perfil.shape[0]
    if w < n_partes * 10:
        return [bbox]  # muy chico para subdividir

    # Suavizar perfil para encontrar valles estables
    kernel = np.ones(5) / 5
    perfil_suave = np.convolve(perfil, kernel, mode="same")

    # No cortar en los bordes extremos (10% de cada lado de cada potencial frame)
    margen = w // (n_partes * 3)

    # Buscar valles: puntos donde el perfil es minimo local
    cortes = []
    ancho_frame = w // n_partes
    for i in range(1, n_partes):
        centro = int(i * ancho_frame)
        inicio = max(margen, centro - ancho_frame // 3)
        fin = min(w - margen, centro + ancho_frame // 3)
        if inicio >= fin:
            continue
        segmento = perfil_suave[inicio:fin]
        min_local = inicio + int(np.argmin(segmento))
        cortes.append(min_local)

    if len(cortes) != n_partes - 1:
        return [bbox]

    # Crear sub-bboxes
    cortes = [0] + sorted(cortes) + [w]
    sub_bboxes = []
    for i in range(len(cortes) - 1):
        sx0 = x0 + cortes[i]
        sx1 = x0 + cortes[i + 1]
        # Recalcular y0/y1 dentro del sub-rango
        sub_alpha = rgba_arr[y0 : y1 + 1, sx0 : sx1 + 1, 3]
        filas_opacas = np.any(sub_alpha > 30, axis=1)
        if not np.any(filas_opacas):
            continue
        sy0 = y0 + int(np.argmax(filas_opacas))
        sy1 = y0 + int(len(filas_opacas) - np.argmax(filas_opacas[::-1]) - 1)
        sub_area = (sy1 - sy0) * (sx1 - sx0)
        sub_bboxes.append((sy0, sx0, sy1, sx1, sub_area))

    return sub_bboxes if len(sub_bboxes) == n_partes else [bbox]


def _detectar_islas(rgba_arr, estructura, iteraciones, n_esperados):
    """Detecta islas de contenido opaco con la dilatacion dada.

    Retorna lista de bounding boxes (y0, x0, y1, x1) filtradas por tamaño."""
    alpha = rgba_arr[:, :, 3]
    opaco = alpha > 30

    opaco_limpio = ndimage.binary_opening(opaco, structure=np.ones((3, 3)), iterations=1)

    if estructura is not None and iteraciones > 0:
        opaco_dilatado = ndimage.binary_dilation(
            opaco_limpio, structure=estructura, iterations=iteraciones
        )
    else:
        opaco_dilatado = opaco_limpio

    etiquetas, n_componentes = ndimage.label(opaco_dilatado)

    bboxes = []
    for i in range(1, n_componentes + 1):
        ys, xs = np.where(etiquetas == i)
        y0, y1 = ys.min(), ys.max()
        x0, x1 = xs.min(), xs.max()
        area = (y1 - y0) * (x1 - x0)
        bboxes.append((y0, x0, y1, x1, area))

    # Filtrar por tamaño — umbral adaptativo basado en las top-N areas
    if bboxes:
        areas = sorted([b[4] for b in bboxes], reverse=True)
        top_n = min(n_esperados, len(areas))
        mediana_area = areas[top_n // 2] if top_n > 0 else 0
        # Usar 25% de la mediana como umbral (los crouch son ~60-70% del area normal)
        umbral = max(MIN_FRAME_AREA * 0.15, mediana_area * 0.15)
        bboxes = [b for b in bboxes if b[4] >= umbral]

    return bboxes


def _fusionar_componentes_pequenos(bboxes, n_esperados):
    """Fusiona componentes pequeños (proyectiles/efectos) con el frame grande más cercano.

    En vez de descartar los sobrantes, los absorbe en el bbox del frame principal
    más cercano — así el frame de ataque incluye al personaje + su proyectil."""
    # Separar en grandes (frames reales) y chicos (efectos)
    por_area = sorted(bboxes, key=lambda b: b[4], reverse=True)
    grandes = list(por_area[:n_esperados])
    chicos = por_area[n_esperados:]

    for chico in chicos:
        cy = (chico[0] + chico[2]) / 2
        cx = (chico[1] + chico[3]) / 2

        # Encontrar el frame grande mas cercano (distancia entre centros)
        mejor_idx = 0
        mejor_dist = float("inf")
        for i, grande in enumerate(grandes):
            gy = (grande[0] + grande[2]) / 2
            gx = (grande[1] + grande[3]) / 2
            dist = ((cy - gy) ** 2 + (cx - gx) ** 2) ** 0.5
            if dist < mejor_dist:
                mejor_dist = dist
                mejor_idx = i

        # Expandir el bbox del grande para incluir al chico
        g = grandes[mejor_idx]
        grandes[mejor_idx] = (
            min(g[0], chico[0]),
            min(g[1], chico[1]),
            max(g[2], chico[2]),
            max(g[3], chico[3]),
            0,  # area se recalcula implicitamente
        )

    # Recalcular areas
    return [
        (y0, x0, y1, x1, (y1 - y0) * (x1 - x0))
        for y0, x0, y1, x1, _ in grandes
    ]


def detectar_frames(rgba_arr, n_esperados):
    """Detecta frames individuales como islas de contenido opaco.

    Retorna lista de bounding boxes (y0, x0, y1, x1) ordenados
    por posicion (arriba→abajo, izq→der).

    Intenta con dilatacion progresivamente menor si detecta menos
    frames de los esperados (frames cercanos se fusionan con dilatacion alta)."""

    # Intentar con dilataciones decrecientes hasta encontrar todos los frames
    configs = [
        (None, 0),             # sin dilatacion — solo opening
        (np.ones((3, 3)), 1),  # 3x3, 1 iter — minimo
        (np.ones((3, 3)), 2),  # 3x3, 2 iter
        (np.ones((5, 5)), 1),  # 5x5, 1 iter
        (np.ones((5, 5)), 2),  # 5x5, 2 iter — original (mas agresivo)
    ]

    mejor_bboxes = []
    for estructura, iteraciones in configs:
        bboxes = _detectar_islas(rgba_arr, estructura, iteraciones, n_esperados)
        # Guardar el mejor resultado (mas cercano a n_esperados sin pasarse mucho)
        if len(bboxes) == n_esperados:
            mejor_bboxes = bboxes
            break
        if len(bboxes) >= n_esperados and (
            not mejor_bboxes or len(bboxes) < len(mejor_bboxes)
        ):
            mejor_bboxes = bboxes
        if not mejor_bboxes or abs(len(bboxes) - n_esperados) < abs(
            len(mejor_bboxes) - n_esperados
        ):
            mejor_bboxes = bboxes

    bboxes = mejor_bboxes

    if not bboxes:
        return []

    # Si sobran frames, fusionar los mas chicos (efectos/proyectiles) con el
    # frame grande mas cercano — asi el ataque incluye su proyectil
    if len(bboxes) > n_esperados:
        bboxes = _fusionar_componentes_pequenos(bboxes, n_esperados)

    # Si faltan frames, intentar subdividir componentes grandes
    if len(bboxes) < n_esperados:
        faltantes = n_esperados - len(bboxes)
        bboxes_por_ancho = sorted(bboxes, key=lambda b: b[3] - b[1], reverse=True)
        ancho_mediano = sorted([b[3] - b[1] for b in bboxes])[len(bboxes) // 2]

        nuevas = []
        restantes_faltantes = faltantes
        for bbox in bboxes_por_ancho:
            ancho = bbox[3] - bbox[1]
            if restantes_faltantes > 0 and ancho > ancho_mediano * 1.6:
                n_partes = min(restantes_faltantes + 1, round(ancho / ancho_mediano))
                if n_partes >= 2:
                    sub = _subdividir_bbox(rgba_arr, bbox, n_partes)
                    if len(sub) > 1:
                        nuevas.extend(sub)
                        restantes_faltantes -= len(sub) - 1
                        continue
            nuevas.append(bbox)
        bboxes = nuevas

    # Ordenar: agrupar por filas, luego izq→der dentro de cada fila
    centros_y = [(b[0] + b[2]) / 2 for b in bboxes]
    ordenados = sorted(zip(centros_y, bboxes))

    h = rgba_arr.shape[0]
    umbral_fila = h * 0.15
    filas = []
    fila_actual = [ordenados[0]]
    for i in range(1, len(ordenados)):
        if ordenados[i][0] - fila_actual[0][0] < umbral_fila:
            fila_actual.append(ordenados[i])
        else:
            filas.append(fila_actual)
            fila_actual = [ordenados[i]]
    filas.append(fila_actual)

    resultado = []
    for fila in filas:
        fila_ordenada = sorted(fila, key=lambda item: (item[1][1] + item[1][3]) / 2)
        for _, bbox in fila_ordenada:
            resultado.append(bbox[:4])

    return resultado


# ─── Extraccion y recorte ────────────────────────────────────────────


def extraer_frame_rgba(rgba_arr, bbox):
    """Extrae un frame de la imagen RGBA ya sin fondo."""
    y0, x0, y1, x1 = bbox
    recorte = rgba_arr[y0 : y1 + 1, x0 : x1 + 1].copy()
    return Image.fromarray(recorte, "RGBA")


def recortar_a_contenido(img, padding=2):
    """Recorta imagen RGBA a su contenido no-transparente."""
    arr = np.array(img)
    if arr.shape[2] < 4:
        return img

    alpha = arr[:, :, 3]
    filas = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)

    if not np.any(filas) or not np.any(cols):
        return img

    y0 = max(0, np.argmax(filas) - padding)
    y1 = min(arr.shape[0], arr.shape[0] - np.argmax(filas[::-1]) + padding)
    x0 = max(0, np.argmax(cols) - padding)
    x1 = min(arr.shape[1], arr.shape[1] - np.argmax(cols[::-1]) + padding)

    return img.crop((x0, y0, x1, y1))


# ─── Escalado uniforme y ensamblaje ─────────────────────────────────


def calcular_escala_uniforme(frames_recortados):
    """Calcula UNA sola escala que haga que el frame mas grande quepa en FRAME_WxFRAME_H.

    Retorna el factor de escala a usar para TODOS los frames."""
    max_w = 0
    max_h = 0
    for frame in frames_recortados:
        fw, fh = frame.size
        if fw > max_w:
            max_w = fw
        if fh > max_h:
            max_h = fh

    if max_w == 0 or max_h == 0:
        return 1.0

    return min(FRAME_W / max_w, FRAME_H / max_h)


def redimensionar_frame_uniforme(frame, escala):
    """Redimensiona frame con escala fija, centrado, pies alineados abajo."""
    fw, fh = frame.size

    if fw == 0 or fh == 0:
        return Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

    nuevo_w = max(1, int(fw * escala))
    nuevo_h = max(1, int(fh * escala))

    # Clamp por seguridad
    nuevo_w = min(nuevo_w, FRAME_W)
    nuevo_h = min(nuevo_h, FRAME_H)

    frame_redim = frame.resize((nuevo_w, nuevo_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    offset_x = (FRAME_W - nuevo_w) // 2
    offset_y = FRAME_H - nuevo_h  # pies alineados abajo
    canvas.paste(frame_redim, (offset_x, offset_y), frame_redim)

    return canvas


def ensamblar_tira(frames):
    """Ensambla frames en tira horizontal."""
    n = len(frames)
    tira = Image.new("RGBA", (FRAME_W * n, FRAME_H), (0, 0, 0, 0))
    for i, frame in enumerate(frames):
        tira.paste(frame, (i * FRAME_W, 0))
    return tira


# ─── Pipeline principal ─────────────────────────────────────────────


def procesar_sprite(ruta_entrada, frames_esperados, ruta_salida, guardar_individuales=False):
    """Procesa un sprite completo con escala uniforme."""
    nombre = ruta_entrada.stem.replace("-2x", "")
    print(f"  {nombre}...", end=" ", flush=True)

    img = Image.open(ruta_entrada)

    if img.mode == "RGBA":
        arr = np.array(img)
    else:
        arr = np.array(img.convert("RGB"))

    # Paso 1: Remover fondo
    rgba = remover_fondo_global(arr)

    # Paso 2: Detectar frames
    bboxes = detectar_frames(rgba, frames_esperados)
    n = len(bboxes)

    if n == 0:
        print("ERROR: sin frames detectados")
        return False

    # Paso 3: Extraer cada frame a tamaño original y recortar a contenido
    frames_crudos = []
    for bbox in bboxes:
        frame = extraer_frame_rgba(rgba, bbox)
        frame = recortar_a_contenido(frame)
        frames_crudos.append(frame)

    # Ajustar cantidad
    if n > frames_esperados:
        frames_crudos = frames_crudos[:frames_esperados]
    elif n < frames_esperados:
        while len(frames_crudos) < frames_esperados:
            frames_crudos.append(frames_crudos[-1])

    # Guardar frames individuales para debug
    if guardar_individuales:
        dir_debug = ruta_salida.parent / "debug" / nombre
        dir_debug.mkdir(parents=True, exist_ok=True)
        for i, frame in enumerate(frames_crudos):
            frame.save(dir_debug / f"{i:02d}.png", "PNG")
        print(f"[debug: {dir_debug}]", end=" ")

    # Paso 4: Calcular UNA sola escala para todos
    escala = calcular_escala_uniforme(frames_crudos)

    # Paso 5: Redimensionar todos con la misma escala
    frames_finales = []
    for frame in frames_crudos:
        frames_finales.append(redimensionar_frame_uniforme(frame, escala))

    # Paso 6: Ensamblar y guardar
    tira = ensamblar_tira(frames_finales)
    tira.save(ruta_salida, "PNG", optimize=True)

    info_warn = ""
    if n != frames_esperados:
        info_warn = f" (WARN: {n} detectados)"

    print(f"OK → {frames_esperados} frames, escala={escala:.3f}{info_warn}")
    return True


def main():
    guardar_debug = "--debug" in sys.argv
    argv_limpio = [a for a in sys.argv if a != "--debug"]

    # Modo individual
    if len(argv_limpio) >= 3 and argv_limpio[1] != "--batch":
        entrada = Path(argv_limpio[1])
        salida = Path(argv_limpio[2])
        frames = FRAMES_POR_DEFECTO

        for i, arg in enumerate(argv_limpio[3:], 3):
            if arg == "--frames" and i + 1 < len(argv_limpio):
                frames = int(argv_limpio[i + 1])

        if not entrada.exists():
            print(f"ERROR: No existe {entrada}")
            sys.exit(1)

        salida.parent.mkdir(parents=True, exist_ok=True)
        ok = procesar_sprite(entrada, frames, salida, guardar_debug)
        sys.exit(0 if ok else 1)

    # Modo batch
    base = Path(__file__).resolve().parent.parent
    dir_generadas = base / "assets" / "img" / "generadas" / "sprites"
    dir_salida = base / "assets" / "img" / "sprites-plat"

    if not dir_generadas.exists():
        print(f"ERROR: No existe {dir_generadas}")
        sys.exit(1)

    dir_salida.mkdir(parents=True, exist_ok=True)

    todos = HEROES + ENEMIGOS
    exitosos = 0
    errores = 0

    print(f"Post-procesando {len(todos)} sprites → {FRAME_W}x{FRAME_H}px/frame")
    print(f"  Entrada: {dir_generadas}")
    print(f"  Salida:  {dir_salida}")
    print()

    for entrada, frames, salida in todos:
        ruta_entrada = dir_generadas / entrada
        ruta_salida = dir_salida / salida

        if not ruta_entrada.exists():
            continue

        ok = procesar_sprite(ruta_entrada, frames, ruta_salida, guardar_debug)
        if ok:
            exitosos += 1
        else:
            errores += 1

    print(f"\nResultado: {exitosos} OK, {errores} errores")


if __name__ == "__main__":
    main()
