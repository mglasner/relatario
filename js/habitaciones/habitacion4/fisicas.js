// Habitación 4 — El Abismo: Motor de físicas y colisiones
// Resolución AABB contra tile map: primero X, luego Y

import { CFG } from './config.js';
import { obtenerTile, obtenerFilas, obtenerColumnas } from './nivel.js';

const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;

// Un tile es sólido si es suelo o plataforma
function tileEsSolido(tipo) {
    return tipo === T.SUELO || tipo === T.PLATAFORMA;
}

// Verifica si un pixel cae en tile sólido
export function esSolido(px, py) {
    const col = Math.floor(px / TAM);
    const fila = Math.floor(py / TAM);
    if (fila < 0 || fila >= obtenerFilas() || col < 0 || col >= obtenerColumnas()) {
        return true; // fuera del mapa = sólido
    }
    return tileEsSolido(obtenerTile(fila, col));
}

// Detecta si un pixel está en tile de abismo
export function esAbismo(px, py) {
    const col = Math.floor(px / TAM);
    const fila = Math.floor(py / TAM);
    if (fila < 0 || fila >= obtenerFilas() || col < 0 || col >= obtenerColumnas()) {
        return false;
    }
    return obtenerTile(fila, col) === T.ABISMO;
}

// Detecta si un pixel está en tile META
export function esMeta(px, py) {
    const col = Math.floor(px / TAM);
    const fila = Math.floor(py / TAM);
    if (fila < 0 || fila >= obtenerFilas() || col < 0 || col >= obtenerColumnas()) {
        return false;
    }
    return obtenerTile(fila, col) === T.META;
}

// Verifica si hay suelo 1px debajo de los pies
export function enSuelo(x, y, ancho, alto) {
    const py = y + alto;
    // Revisar 2 puntos en la base (esquinas inferiores con margen)
    const margen = 2;
    return esSolido(x + margen, py) || esSolido(x + ancho - margen, py);
}

// Resolver colisión horizontal
export function resolverColisionX(x, y, ancho, alto, dx) {
    if (dx === 0) return x;

    const nuevaX = x + dx;
    const margenY = 2;

    // Verificar esquinas en la dirección del movimiento
    const borde = dx > 0 ? nuevaX + ancho - 1 : nuevaX;

    // Revisar en 3 puntos verticales (arriba, medio, abajo)
    const puntos = [y + margenY, y + alto / 2, y + alto - margenY];
    for (let i = 0; i < puntos.length; i++) {
        if (esSolido(borde, puntos[i])) {
            // Snap al borde del tile
            if (dx > 0) {
                const col = Math.floor(borde / TAM);
                return col * TAM - ancho;
            }
            const col = Math.floor(borde / TAM);
            return (col + 1) * TAM;
        }
    }

    return nuevaX;
}

// Resolver colisión vertical
export function resolverColisionY(x, y, ancho, alto, vy) {
    if (vy === 0) return { y, vy, enSuelo: enSuelo(x, y, ancho, alto) };

    const nuevaY = y + vy;
    const margenX = 2;

    if (vy > 0) {
        // Cayendo: revisar suelo
        const pie = nuevaY + alto;
        const puntos = [x + margenX, x + ancho / 2, x + ancho - margenX];
        for (let i = 0; i < puntos.length; i++) {
            if (esSolido(puntos[i], pie)) {
                const fila = Math.floor(pie / TAM);
                return { y: fila * TAM - alto, vy: 0, enSuelo: true };
            }
        }
        return { y: nuevaY, vy, enSuelo: false };
    }

    // Subiendo: revisar techo
    const cabeza = nuevaY;
    const puntos = [x + margenX, x + ancho / 2, x + ancho - margenX];
    for (let i = 0; i < puntos.length; i++) {
        if (esSolido(puntos[i], cabeza)) {
            const fila = Math.floor(cabeza / TAM);
            return { y: (fila + 1) * TAM, vy: 0, enSuelo: false };
        }
    }

    return { y: nuevaY, vy, enSuelo: false };
}

// Colisión AABB entre dos rectángulos
export function aabbColision(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}
