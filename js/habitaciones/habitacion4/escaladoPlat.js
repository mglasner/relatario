// Habitacion 4 — El Abismo: Escalado proporcional de personajes
// Calcula tamaño visual, hitbox y velocidad segun estatura y velocidad del personaje

import { CFG } from './config.js';

const ESC = CFG.escalado;

// Estatura → escala visual (referencia: Lina 1.55m = 1.0)
export function calcularEscala(estatura) {
    if (!estatura || estatura <= 0) return 1;
    const escala = estatura / ESC.estaturaRef;
    return Math.max(ESC.escalaMin, Math.min(ESC.escalaMax, escala));
}

// Escala → dimensiones de hitbox
export function calcularHitbox(escala) {
    return {
        ancho: Math.round(ESC.hitboxBaseW * escala),
        alto: Math.round(ESC.hitboxBaseH * escala),
    };
}

// Escala → dimensiones de sprite para drawImage
export function calcularSpriteDrawSize(escala) {
    return {
        ancho: Math.round(ESC.spriteBaseW * escala),
        alto: Math.round(ESC.spriteBaseH * escala),
    };
}

// Atributo velocidad (3-9) → velocidad de movimiento en px/frame
export function calcularVelocidadPlat(velocidad) {
    if (!velocidad || velocidad <= 0) return ESC.velPlatMin;
    const t = (velocidad - ESC.velAttrMin) / (ESC.velAttrMax - ESC.velAttrMin);
    const clamped = Math.max(0, Math.min(1, t));
    return ESC.velPlatMin + clamped * (ESC.velPlatMax - ESC.velPlatMin);
}

// Escala → fuerza de salto (ajuste suave para que todos completen el nivel)
export function calcularFuerzaSalto(escala) {
    return ESC.fuerzaSaltoBase * (1 + (escala - 1) * ESC.fuerzaSaltoFactor);
}
