// Motor 3D — Trampas de fuego
// Trampas en el suelo que ciclan on/off y dañan al jugador al pisarlas
// Activa: partículas de fuego con brillo en el suelo. Inactiva: chispas tenues.

import { mezclar } from '../laberinto.js';
import { lanzarToast } from '../componentes/toast.js';
import { FOV, canvas } from './config.js';
import { CFG } from '../habitaciones/config-habitacion2.js';

// --- Estado del módulo ---

let trampas = [];
const RADIO_CULLING = 6;

// --- Generación ---

// Coloca trampas en corredores del laberinto según config YAML
export function generarTrampas3D(mapa, filas, cols, entradaFila, entradaCol, llaveFila, llaveCol) {
    const cfg = CFG.trampasFuego;
    const numTrampas =
        cfg.cantidadMin + Math.floor(Math.random() * (cfg.cantidadMax - cfg.cantidadMin + 1));
    const celdasLibres = [];

    for (let f = 1; f < filas - 1; f++) {
        for (let c = 1; c < cols - 1; c++) {
            if (mapa[f][c] !== 0) continue;
            if (f === entradaFila && c === entradaCol) continue;
            if (f === llaveFila && c === llaveCol) continue;
            if (Math.abs(f - entradaFila) + Math.abs(c - entradaCol) <= cfg.distanciaMinEntrada)
                continue;
            celdasLibres.push([f, c]);
        }
    }

    mezclar(celdasLibres);
    trampas = [];

    for (let i = 0; i < Math.min(numTrampas, celdasLibres.length); i++) {
        trampas.push({
            fila: celdasLibres[i][0],
            col: celdasLibres[i][1],
            periodo: cfg.periodoMin + Math.floor(Math.random() * (cfg.periodoMax - cfg.periodoMin)),
            desfase: Math.floor(Math.random() * cfg.desfaseMax),
            ultimoGolpe: 0,
        });
    }
}

// --- Lógica de ciclo on/off ---

function esTrampaActiva(trampa) {
    return Math.floor((Date.now() + trampa.desfase) / trampa.periodo) % 2 === 0;
}

// --- Detección y daño ---

// Detecta si el jugador pisa una trampa activa y aplica daño
// Retorna el daño aplicado (0 si no hubo)
export function detectarTrampas3D(jugadorX, jugadorY, jugador) {
    const celdaX = Math.floor(jugadorX);
    const celdaY = Math.floor(jugadorY);
    const ahora = Date.now();

    const cfg = CFG.trampasFuego;
    for (let i = 0; i < trampas.length; i++) {
        const t = trampas[i];
        if (celdaY === t.fila && celdaX === t.col && esTrampaActiva(t)) {
            if (ahora - t.ultimoGolpe >= cfg.cooldown) {
                const dano =
                    cfg.danoMin + Math.floor(Math.random() * (cfg.danoMax - cfg.danoMin + 1));
                t.ultimoGolpe = ahora;
                jugador.recibirDano(dano);
                document.dispatchEvent(new Event('vida-cambio'));

                if (!jugador.estaVivo()) {
                    document.dispatchEvent(new Event('jugador-muerto'));
                }

                lanzarToast('Trampa de fuego (-' + dano + ')', '\uD83D\uDD25', 'dano');
                return dano;
            }
        }
    }

    return 0;
}

// --- Sprites para trampas inactivas ---

// Pool reducido: solo trampas inactivas (1 sprite cada una)
const MAX_TRAMPAS_SPRITES = 10;
const _spritesPool = Array.from({ length: MAX_TRAMPAS_SPRITES }, () => ({
    x: 0,
    y: 0,
    z: 0,
    emoji: '',
    color: '',
    sinBrillo: false,
}));
const _spritesResult = { sprites: _spritesPool, count: 0 };

// Retorna sprites solo para trampas INACTIVAS (chispas tenues en el suelo)
// Las trampas activas se renderizan con el sistema de partículas de fuego
export function obtenerSpritesTrampas3D(jugadorX, jugadorY) {
    let idx = 0;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    for (let i = 0; i < trampas.length; i++) {
        const t = trampas[i];
        const cx = t.col + 0.5;
        const cy = t.fila + 0.5;
        const dx = cx - jugadorX;
        const dy = cy - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        if (!esTrampaActiva(t)) {
            const s = _spritesPool[idx++];
            s.x = cx;
            s.y = cy;
            s.z = 0.05;
            s.emoji = '\u2728';
            s.color = '#664400';
            s.sinBrillo = false;
        }
    }

    _spritesResult.count = idx;
    return _spritesResult;
}

// =============================================================
// Sistema de partículas de fuego
// =============================================================

const POOL_FUEGO = 120;
const poolFuego = [];
for (let i = 0; i < POOL_FUEGO; i++) {
    poolFuego.push({
        activa: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        vida: 0,
        vidaMax: 0,
        tamano: 0,
        esHumo: false,
    });
}

function obtenerParticulaLibre() {
    for (let i = 0; i < POOL_FUEGO; i++) {
        if (!poolFuego[i].activa) return poolFuego[i];
    }
    return null;
}

// Emite una partícula de fuego desde el centro de la trampa
function emitirLlama(cx, cy) {
    const p = obtenerParticulaLibre();
    if (!p) return;

    const ang = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.15;

    p.activa = true;
    p.x = cx + Math.cos(ang) * radio;
    p.y = cy + Math.sin(ang) * radio;
    p.z = 0.02 + Math.random() * 0.03;
    p.vx = (Math.random() - 0.5) * 0.0015;
    p.vy = (Math.random() - 0.5) * 0.0015;
    p.vz = 0.006 + Math.random() * 0.007;
    p.vida = 25 + Math.floor(Math.random() * 18);
    p.vidaMax = p.vida;
    p.tamano = 2.2 + Math.random() * 1.3;
    p.esHumo = false;
}

// Emite una partícula de humo (más oscura, sube más, dura más)
function emitirHumo(cx, cy) {
    const p = obtenerParticulaLibre();
    if (!p) return;

    const ang = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.1;

    p.activa = true;
    p.x = cx + Math.cos(ang) * radio;
    p.y = cy + Math.sin(ang) * radio;
    p.z = 0.2 + Math.random() * 0.1;
    p.vx = (Math.random() - 0.5) * 0.001;
    p.vy = (Math.random() - 0.5) * 0.001;
    p.vz = 0.003 + Math.random() * 0.003;
    p.vida = 35 + Math.floor(Math.random() * 20);
    p.vidaMax = p.vida;
    p.tamano = 2.5 + Math.random() * 1.5;
    p.esHumo = true;
}

// Actualiza emisión y física de partículas de fuego
export function actualizarFuegoTrampas(jugadorX, jugadorY) {
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    // Emitir partículas desde trampas activas cercanas
    for (let i = 0; i < trampas.length; i++) {
        const t = trampas[i];
        const cx = t.col + 0.5;
        const cy = t.fila + 0.5;
        const dx = cx - jugadorX;
        const dy = cy - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        if (esTrampaActiva(t)) {
            // ~2 llamas por frame por trampa visible
            if (Math.random() < 0.55) emitirLlama(cx, cy);
            if (Math.random() < 0.35) emitirLlama(cx, cy);
            // ~1 humo cada ~5 frames
            if (Math.random() < 0.18) emitirHumo(cx, cy);
        }
    }

    // Actualizar partículas existentes
    for (let i = 0; i < POOL_FUEGO; i++) {
        const p = poolFuego[i];
        if (!p.activa) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vida--;

        // Deriva aleatoria sutil
        p.vx += (Math.random() - 0.5) * 0.0004;
        p.vy += (Math.random() - 0.5) * 0.0004;

        if (!p.esHumo) {
            // Las llamas aceleran ligeramente hacia arriba
            p.vz += 0.0002;
        }

        if (p.vida <= 0 || p.z > 0.85) {
            p.activa = false;
        }
    }
}

// --- Renderizado de partículas de fuego ---

// Cache para fillStyle (evita string concat repetida)
let _lastFireKey = -1;
let _lastFireAlpha = -1;
let _lastFireStyle = '';

// Renderiza partículas de fuego + brillo en el suelo
export function renderizarFuegoTrampas(ctx, zBuffer, jugadorX, jugadorY, angulo) {
    const { ancho, alto, numRayos, anchoFranja } = canvas;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    // --- 1. Brillo cálido en el suelo para trampas activas ---
    for (let i = 0; i < trampas.length; i++) {
        const t = trampas[i];
        if (!esTrampaActiva(t)) continue;

        const cx = t.col + 0.5;
        const cy = t.fila + 0.5;
        const dx = cx - jugadorX;
        const dy = cy - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.3) continue;

        const anguloSprite = Math.atan2(dy, dx);
        let anguloRel = anguloSprite - angulo;
        while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
        while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;
        if (Math.abs(anguloRel) > FOV / 2 + 0.15) continue;

        const screenX = (0.5 + anguloRel / FOV) * ancho;
        const distPerp = dist * Math.cos(anguloRel);
        if (distPerp < 0.1) continue;

        const col = Math.floor(screenX / anchoFranja);
        if (col >= 0 && col < numRayos && distPerp >= zBuffer[col]) continue;

        // Nivel del suelo (z=0 → screenY = centro + mitad de pared)
        const alturaPared = alto / distPerp;
        const screenY = alto / 2 + 0.5 * alturaPared;
        const glowRadius = Math.min(alturaPared * 0.35, ancho * 0.15);

        // Pulso sutil de brillo
        const pulso = 0.8 + 0.2 * Math.sin(Date.now() * 0.004 + t.desfase);

        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.12 * pulso;
        ctx.fillStyle = '#ff4400';
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        // Segunda capa más pequeña y brillante
        ctx.globalAlpha = 0.08 * pulso;
        ctx.fillStyle = '#ffaa20';
        ctx.beginPath();
        ctx.arc(screenX, screenY, glowRadius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    // --- 2. Partículas de fuego y humo ---
    _lastFireKey = -1;
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < POOL_FUEGO; i++) {
        const p = poolFuego[i];
        if (!p.activa) continue;

        // Humo se renderiza con blending normal (no aditivo)
        if (p.esHumo) continue;

        const dx = p.x - jugadorX;
        const dy = p.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) continue;

        const anguloSprite = Math.atan2(dy, dx);
        let anguloRel = anguloSprite - angulo;
        while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
        while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;
        if (Math.abs(anguloRel) > FOV / 2 + 0.1) continue;

        const screenX = (0.5 + anguloRel / FOV) * ancho;
        const distPerp = dist * Math.cos(anguloRel);
        if (distPerp < 0.1) continue;

        const col = Math.floor(screenX / anchoFranja);
        if (col >= 0 && col < numRayos && distPerp >= zBuffer[col]) continue;

        const alturaPared = alto / distPerp;
        const screenY = alto / 2 - (p.z - 0.5) * alturaPared;

        // Color según vida: amarillo brillante → naranja → rojo oscuro
        const t = p.vida / p.vidaMax;
        const r = Math.floor(100 + 155 * Math.min(1, t * 1.5));
        const g = Math.floor(220 * t * t);
        const b = Math.floor(50 * t * t * t);

        // Alpha: sube rápido, se mantiene, baja al final
        let alpha;
        if (t > 0.85) alpha = (1 - t) / 0.15;
        else if (t < 0.25) alpha = t / 0.25;
        else alpha = 1;
        alpha *= 0.65;

        const tamano = Math.max(1, p.tamano * (0.3 + 0.7 * t) * (3 / distPerp));

        // Cache de fillStyle
        const alphaIdx = Math.min(100, Math.round(alpha * 100));
        const key = (r << 16) | (g << 8) | b;
        if (key !== _lastFireKey || alphaIdx !== _lastFireAlpha) {
            _lastFireKey = key;
            _lastFireAlpha = alphaIdx;
            _lastFireStyle =
                'rgba(' + r + ',' + g + ',' + b + ',' + (alphaIdx / 100).toFixed(2) + ')';
        }
        ctx.fillStyle = _lastFireStyle;
        ctx.fillRect(screenX - tamano / 2, screenY - tamano / 2, tamano, tamano);
    }

    ctx.globalCompositeOperation = 'source-over';

    // --- 3. Humo (blending normal, encima del fuego) ---
    for (let i = 0; i < POOL_FUEGO; i++) {
        const p = poolFuego[i];
        if (!p.activa || !p.esHumo) continue;

        const dx = p.x - jugadorX;
        const dy = p.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) continue;

        const anguloSprite = Math.atan2(dy, dx);
        let anguloRel = anguloSprite - angulo;
        while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
        while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;
        if (Math.abs(anguloRel) > FOV / 2 + 0.1) continue;

        const screenX = (0.5 + anguloRel / FOV) * ancho;
        const distPerp = dist * Math.cos(anguloRel);
        if (distPerp < 0.1) continue;

        const col = Math.floor(screenX / anchoFranja);
        if (col >= 0 && col < numRayos && distPerp >= zBuffer[col]) continue;

        const alturaPared = alto / distPerp;
        const screenY = alto / 2 - (p.z - 0.5) * alturaPared;

        // Humo: gris oscuro, transparente, más grande
        const t = p.vida / p.vidaMax;
        const gris = Math.floor(40 + 30 * t);
        let alpha = t < 0.3 ? t / 0.3 : 1;
        alpha *= 0.15;

        const tamano = Math.max(1, p.tamano * 1.3 * (3 / distPerp));

        const alphaIdx = Math.min(100, Math.round(alpha * 100));
        const key = (gris << 16) | (gris << 8) | gris;
        if (key !== _lastFireKey || alphaIdx !== _lastFireAlpha) {
            _lastFireKey = key;
            _lastFireAlpha = alphaIdx;
            _lastFireStyle =
                'rgba(' + gris + ',' + gris + ',' + gris + ',' + (alphaIdx / 100).toFixed(2) + ')';
        }
        ctx.fillStyle = _lastFireStyle;
        ctx.fillRect(screenX - tamano / 2, screenY - tamano / 2, tamano, tamano);
    }
}

// --- Limpieza ---

export function limpiarTrampas3D() {
    trampas = [];
    for (let i = 0; i < POOL_FUEGO; i++) {
        poolFuego[i].activa = false;
    }
}
