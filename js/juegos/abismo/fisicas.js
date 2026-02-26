// Habitación 4 — El Abismo: Motor de físicas y colisiones
// Resolución AABB contra tile map: primero X, luego Y

import { CFG } from './config.js';
import { obtenerTile, obtenerFilas, obtenerColumnas } from './nivel.js';

const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;

// Un tile sólido bloquea en todas las direcciones (suelo, paredes, techo)
function tileEsSolido(tipo) {
    return tipo === T.SUELO;
}

// Plataformas one-way: solo bloquean al caer desde arriba
function tileEsPlataforma(tipo) {
    return tipo === T.PLATAFORMA;
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

// Detecta si un pixel está en tile META
export function esMeta(px, py) {
    const col = Math.floor(px / TAM);
    const fila = Math.floor(py / TAM);
    if (fila < 0 || fila >= obtenerFilas() || col < 0 || col >= obtenerColumnas()) {
        return false;
    }
    return obtenerTile(fila, col) === T.META;
}

// Verifica si la entidad esta parada sobre una plataforma one-way
// Solo es true si los pies estan en el borde superior del tile (dentro de 2px)
function enPlataforma(px, py) {
    const col = Math.floor(px / TAM);
    const fila = Math.floor(py / TAM);
    if (fila < 0 || fila >= obtenerFilas() || col < 0 || col >= obtenerColumnas()) {
        return false;
    }
    if (!tileEsPlataforma(obtenerTile(fila, col))) return false;
    // Solo contar si los pies estan en el borde superior (no atravesando)
    const topePlataforma = fila * TAM;
    return py - topePlataforma <= 2;
}

// Verifica si hay suelo o plataforma debajo de los pies
export function enSuelo(x, y, ancho, alto) {
    const py = y + alto;
    const margen = 2;
    return (
        esSolido(x + margen, py) ||
        esSolido(x + ancho - margen, py) ||
        enPlataforma(x + margen, py) ||
        enPlataforma(x + ancho - margen, py)
    );
}

// Resolver colisión horizontal
// estaEnSuelo: si true, plataformas también bloquean lateralmente
export function resolverColisionX(x, y, ancho, alto, dx, estaEnSuelo) {
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
        // Semi-sólido: plataformas bloquean X solo si la entidad está en el suelo
        // y sus pies están al nivel de la superficie de la plataforma (no debajo)
        if (estaEnSuelo) {
            const fila = Math.floor(puntos[i] / TAM);
            const col = Math.floor(borde / TAM);
            if (fila >= 0 && fila < obtenerFilas() && col >= 0 && col < obtenerColumnas()) {
                if (tileEsPlataforma(obtenerTile(fila, col))) {
                    const pieY = y + alto;
                    const topePlat = fila * TAM;
                    // Solo bloquear si los pies están al nivel de la plataforma
                    if (pieY <= topePlat + 2) {
                        if (dx > 0) return col * TAM - ancho;
                        return (col + 1) * TAM;
                    }
                }
            }
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
        // Cayendo: revisar suelo sólido
        const pie = nuevaY + alto;
        const puntos = [x + margenX, x + ancho / 2, x + ancho - margenX];
        for (let i = 0; i < puntos.length; i++) {
            if (esSolido(puntos[i], pie)) {
                const fila = Math.floor(pie / TAM);
                return { y: fila * TAM - alto, vy: 0, enSuelo: true };
            }
        }

        // Cayendo: revisar plataformas one-way (solo aterrizar si venia de arriba)
        const pieAnterior = y + alto;
        for (let i = 0; i < puntos.length; i++) {
            const col = Math.floor(puntos[i] / TAM);
            const fila = Math.floor(pie / TAM);
            if (fila >= 0 && fila < obtenerFilas() && col >= 0 && col < obtenerColumnas()) {
                if (tileEsPlataforma(obtenerTile(fila, col))) {
                    const topePlataforma = fila * TAM;
                    // Solo aterrizar si los pies estaban arriba del borde de la plataforma
                    if (pieAnterior <= topePlataforma + 1) {
                        return { y: topePlataforma - alto, vy: 0, enSuelo: true };
                    }
                }
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
