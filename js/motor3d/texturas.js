// Motor 3D — Generación procedural de texturas (offscreen canvases 64x64)

import { TEX_SIZE } from './config.js';

// --- Ruido procedural ---

// Hash simple para ruido reproducible
function hash(x, y, seed) {
    let h = seed + x * 374761393 + y * 668265263;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h & 0x7fffffff) / 0x7fffffff;
}

// Ruido de valor con interpolación bilineal suavizada
function valueNoise(x, y, escala, seed) {
    const sx = x / escala;
    const sy = y / escala;
    const ix = Math.floor(sx);
    const iy = Math.floor(sy);
    const fx = sx - ix;
    const fy = sy - iy;

    // Suavizado Hermite
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);

    const a = hash(ix, iy, seed);
    const b = hash(ix + 1, iy, seed);
    const c = hash(ix, iy + 1, seed);
    const d = hash(ix + 1, iy + 1, seed);

    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Fractal Brownian Motion (ruido multicapa)
function fbm(x, y, octavas, escala, seed) {
    let valor = 0;
    let amplitud = 1;
    let frecuencia = 1;
    let max = 0;

    for (let i = 0; i < octavas; i++) {
        valor += valueNoise(x * frecuencia, y * frecuencia, escala, seed + i * 100) * amplitud;
        max += amplitud;
        amplitud *= 0.5;
        frecuencia *= 2;
    }

    return valor / max;
}

// --- Generadores de textura ---

// Piedra: grises verdosos con grietas oscuras
function generarPiedra() {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE;
    c.height = TEX_SIZE;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);

    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const idx = (y * TEX_SIZE + x) * 4;
            const n = fbm(x, y, 4, 16, 42);

            // Grietas donde el ruido secundario es bajo
            const grieta = fbm(x, y, 2, 8, 137);
            const factorGrieta = grieta < 0.3 ? 0.55 : 1.0;

            const base = 70 + n * 60;
            const val = base * factorGrieta;

            // Tinte verde bosque encantado
            img.data[idx] = Math.floor(val * 0.55);
            img.data[idx + 1] = Math.floor(val * 0.85);
            img.data[idx + 2] = Math.floor(val * 0.5);
            img.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    return c;
}

// Ladrillo: patrón regular con mortero y tinte verdoso
function generarLadrillo() {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE;
    c.height = TEX_SIZE;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);

    const anchoLadrillo = 16;
    const altoLadrillo = 8;
    const mortero = 1;

    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const idx = (y * TEX_SIZE + x) * 4;

            const fila = Math.floor(y / altoLadrillo);
            const offset = fila % 2 === 0 ? 0 : anchoLadrillo / 2;
            const bx = (x + offset) % anchoLadrillo;
            const by = y % altoLadrillo;
            const esMortero = bx < mortero || by < mortero;

            if (esMortero) {
                const n = valueNoise(x, y, 8, 200);
                const val = 40 + n * 20;
                img.data[idx] = Math.floor(val * 0.6);
                img.data[idx + 1] = Math.floor(val * 0.7);
                img.data[idx + 2] = Math.floor(val * 0.5);
            } else {
                const n = fbm(x, y, 2, 12, 99);
                const ladrilloN = hash(Math.floor((x + offset) / anchoLadrillo), fila, 77);
                const base = 70 + ladrilloN * 40;
                img.data[idx] = Math.floor((base + n * 15) * 0.6);
                img.data[idx + 1] = Math.floor((base + n * 15) * 0.75);
                img.data[idx + 2] = Math.floor((base + n * 10) * 0.45);
            }
            img.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    return c;
}

// Musgo: piedra con parches verdes brillantes
function generarMusgo() {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE;
    c.height = TEX_SIZE;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);

    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const idx = (y * TEX_SIZE + x) * 4;
            const piedra = fbm(x, y, 4, 16, 42);
            const musgo = fbm(x, y, 3, 10, 300);

            const basePiedra = 70 + piedra * 60;

            if (musgo > 0.5) {
                // Parche de musgo verde intenso
                const intensidad = (musgo - 0.5) / 0.5;
                const r = basePiedra * 0.55 * (1 - intensidad) + 20 * intensidad;
                const g = basePiedra * 0.85 * (1 - intensidad) + (70 + piedra * 50) * intensidad;
                const b = basePiedra * 0.5 * (1 - intensidad) + 15 * intensidad;
                img.data[idx] = Math.floor(r);
                img.data[idx + 1] = Math.floor(g);
                img.data[idx + 2] = Math.floor(b);
            } else {
                img.data[idx] = Math.floor(basePiedra * 0.55);
                img.data[idx + 1] = Math.floor(basePiedra * 0.85);
                img.data[idx + 2] = Math.floor(basePiedra * 0.5);
            }
            img.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    return c;
}

// Tierra: marrones oscuros con variación
function generarTierra() {
    const c = document.createElement('canvas');
    c.width = TEX_SIZE;
    c.height = TEX_SIZE;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(TEX_SIZE, TEX_SIZE);

    for (let y = 0; y < TEX_SIZE; y++) {
        for (let x = 0; x < TEX_SIZE; x++) {
            const idx = (y * TEX_SIZE + x) * 4;
            const n = fbm(x, y, 3, 12, 500);
            const detalle = valueNoise(x, y, 4, 550);

            const base = 50 + n * 45;
            img.data[idx] = Math.floor(base * 0.6 + detalle * 10);
            img.data[idx + 1] = Math.floor(base * 0.5 + detalle * 8);
            img.data[idx + 2] = Math.floor(base * 0.25 + detalle * 4);
            img.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(img, 0, 0);
    return c;
}

// --- API pública ---

// Genera todas las texturas del motor (llamar una vez al iniciar)
export function generarTexturas() {
    const piedra = generarPiedra();
    const ladrillo = generarLadrillo();
    const musgo = generarMusgo();
    const tierra = generarTierra();

    return { piedra, ladrillo, musgo, tierra };
}

// Selecciona textura determinística basada en posición de la celda
export function obtenerTextura(mapX, mapY, texturas) {
    const h = hash(mapX, mapY, 12345);
    if (h < 0.5) return texturas.piedra;
    if (h < 0.75) return texturas.ladrillo;
    if (h < 0.9) return texturas.musgo;
    return texturas.tierra;
}
