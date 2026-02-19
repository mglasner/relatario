// Habitación 4 — El Abismo: Cámara horizontal con lerp suave

import { CFG } from './config.js';
import { obtenerColumnas } from './nivel.js';

const LERP = 0.1;
const OFFSET_X = 0.35; // Jugador al 35% desde la izquierda

let x = 0;
let anchoCanvas = CFG.canvas.anchoBase;
let anchoNivel = 0;

export function iniciarCamara(anchoC) {
    anchoCanvas = anchoC;
    anchoNivel = obtenerColumnas() * CFG.tiles.tamano;
    x = 0;
}

export function actualizarCamara(jugadorX) {
    const objetivo = jugadorX - anchoCanvas * OFFSET_X;

    // Lerp suave
    x += (objetivo - x) * LERP;

    // Clamp a los bordes del nivel
    if (x < 0) x = 0;
    const maxX = anchoNivel - anchoCanvas;
    if (x > maxX) x = maxX;
}

export function obtenerCamaraX() {
    return Math.round(x);
}
