// Motor 3D — Movimiento y detección de colisiones

import { VELOCIDAD_MOV, VELOCIDAD_GIRO, RADIO_COLISION } from './config.js';

// Verifica si una posición del mundo es pared
export function esPared(x, y, mapa, filas, cols) {
    const col = Math.floor(x);
    const fila = Math.floor(y);
    if (fila < 0 || fila >= filas || col < 0 || col >= cols) return true;
    return mapa[fila][col] === 1;
}

// Verifica colisión usando las 4 esquinas del radio de colisión
function hayColision(x, y, mapa, filas, cols) {
    return (
        esPared(x - RADIO_COLISION, y - RADIO_COLISION, mapa, filas, cols) ||
        esPared(x + RADIO_COLISION, y - RADIO_COLISION, mapa, filas, cols) ||
        esPared(x - RADIO_COLISION, y + RADIO_COLISION, mapa, filas, cols) ||
        esPared(x + RADIO_COLISION, y + RADIO_COLISION, mapa, filas, cols)
    );
}

// Mueve al jugador según teclas presionadas (modifica estado in-place)
// estado = { x, y, angulo }
export function moverJugador(teclas, estado, mapa, filas, cols) {
    if (teclas['ArrowLeft']) estado.angulo -= VELOCIDAD_GIRO;
    if (teclas['ArrowRight']) estado.angulo += VELOCIDAD_GIRO;

    let dx = 0;
    let dy = 0;

    if (teclas['ArrowUp']) {
        dx += Math.cos(estado.angulo) * VELOCIDAD_MOV;
        dy += Math.sin(estado.angulo) * VELOCIDAD_MOV;
    }
    if (teclas['ArrowDown']) {
        dx -= Math.cos(estado.angulo) * VELOCIDAD_MOV;
        dy -= Math.sin(estado.angulo) * VELOCIDAD_MOV;
    }

    // Colisión por eje separado (permite deslizarse contra paredes)
    if (dx !== 0) {
        const nuevaX = estado.x + dx;
        if (!hayColision(nuevaX, estado.y, mapa, filas, cols)) {
            estado.x = nuevaX;
        }
    }

    if (dy !== 0) {
        const nuevaY = estado.y + dy;
        if (!hayColision(estado.x, nuevaY, mapa, filas, cols)) {
            estado.y = nuevaY;
        }
    }
}
