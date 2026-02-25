// Habitacion 4 — El Abismo: Sistema de particulas 2D
// Pool preallocado de 150 particulas con culling horizontal
// Optimizado: puntero circular para busqueda O(1) amortizada y conteo de activas

import { esSolido } from './fisicas.js';

const POOL_SIZE = 150;
const GRAVEDAD_PART = 0.15;

// Pool preasignado
const pool = [];
for (let i = 0; i < POOL_SIZE; i++) {
    pool.push({
        activa: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        vida: 0,
        vidaMax: 0,
        tamano: 1,
        r: 255,
        g: 255,
        b: 255,
        alpha: 1,
        gravedad: false,
        tipo: '',
    });
}

// Contador de frames para emision periodica
let frameCount = 0;
// Puntero circular para busqueda rapida de slot libre
let nextFree = 0;
// Conteo de particulas activas (para early-exit en actualizar/renderizar)
let activeCount = 0;

function obtenerLibre() {
    if (activeCount >= POOL_SIZE) return null;
    // Buscar desde el puntero circular
    for (let i = 0; i < POOL_SIZE; i++) {
        const idx = (nextFree + i) % POOL_SIZE;
        if (!pool[idx].activa) {
            nextFree = (idx + 1) % POOL_SIZE;
            return pool[idx];
        }
    }
    return null;
}

function emitir(config) {
    const p = obtenerLibre();
    if (!p) return;
    p.activa = true;
    activeCount++;
    p.x = config.x;
    p.y = config.y;
    p.vx = config.vx || 0;
    p.vy = config.vy || 0;
    p.vida = config.vida || 20;
    p.vidaMax = config.vida || 20;
    p.tamano = config.tamano || 2;
    p.r = config.r || 255;
    p.g = config.g || 255;
    p.b = config.b || 255;
    p.alpha = config.alpha || 1;
    p.gravedad = config.gravedad || false;
    p.tipo = config.tipo || '';
}

// --- Emisores por tipo ---

// Polvo al aterrizar
export function emitirPolvoAterrizaje(x, y) {
    const cantidad = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cantidad; i++) {
        emitir({
            x: x + (Math.random() - 0.5) * 10,
            y: y,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.5,
            vida: 12 + Math.floor(Math.random() * 8),
            tamano: 2 + Math.random(),
            r: 160,
            g: 150,
            b: 170,
            alpha: 0.5,
            tipo: 'polvo',
        });
    }
}

// Estela al correr
export function emitirEstela(x, y, direccion) {
    if (Math.random() > 0.4) return;
    emitir({
        x: x - direccion * 4 + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 2,
        vx: -direccion * (0.3 + Math.random() * 0.3),
        vy: -Math.random() * 0.3,
        vida: 8 + Math.floor(Math.random() * 5),
        tamano: 1 + Math.random(),
        r: 140,
        g: 130,
        b: 150,
        alpha: 0.3,
        tipo: 'polvo',
    });
}

// Explosion al stomper enemigo
export function emitirStompExplosion(x, y, colorR, colorG, colorB) {
    const cantidad = 8 + Math.floor(Math.random() * 5);
    for (let i = 0; i < cantidad; i++) {
        const ang = (i / cantidad) * Math.PI * 2 + Math.random() * 0.5;
        const vel = 1.5 + Math.random() * 2;
        emitir({
            x: x,
            y: y,
            vx: Math.cos(ang) * vel,
            vy: Math.sin(ang) * vel,
            vida: 15 + Math.floor(Math.random() * 10),
            tamano: 2 + Math.random() * 2,
            r: colorR,
            g: colorG,
            b: colorB,
            alpha: 0.9,
            gravedad: true,
            tipo: 'chispa',
        });
    }
}

// Fragmentos al morir un enemigo
export function emitirMuerteEnemigo(x, y, colorR, colorG, colorB) {
    const cantidad = 6 + Math.floor(Math.random() * 5);
    for (let i = 0; i < cantidad; i++) {
        emitir({
            x: x + (Math.random() - 0.5) * 8,
            y: y + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 2,
            vy: -1 - Math.random() * 2,
            vida: 20 + Math.floor(Math.random() * 15),
            tamano: 2 + Math.random() * 2,
            r: colorR,
            g: colorG,
            b: colorB,
            alpha: 0.8,
            gravedad: true,
            tipo: 'fragmento',
        });
    }
}

// Niebla ascendente en tiles de abismo
export function emitirNieblaAbismo(abismoX, abismoY) {
    emitir({
        x: abismoX + Math.random() * 16,
        y: abismoY,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.3 - Math.random() * 0.3,
        vida: 40 + Math.floor(Math.random() * 20),
        tamano: 3 + Math.random() * 2,
        r: 80,
        g: 50,
        b: 140,
        alpha: 0.15,
        tipo: 'niebla',
    });
}

// Ojos parpadeantes en la oscuridad del abismo
export function emitirOjosAbismo(abismoX, abismoY) {
    const ojoX = abismoX + 2 + Math.random() * 12;
    const ojoY = abismoY + 4 + Math.random() * 8;
    // Ojo izquierdo
    emitir({
        x: ojoX,
        y: ojoY,
        vx: 0,
        vy: 0,
        vida: 30 + Math.floor(Math.random() * 30),
        tamano: 2,
        r: 200,
        g: 50,
        b: 50,
        alpha: 0.7,
        tipo: 'ojo',
    });
    // Ojo derecho
    emitir({
        x: ojoX + 4,
        y: ojoY,
        vx: 0,
        vy: 0,
        vida: 30 + Math.floor(Math.random() * 30),
        tamano: 2,
        r: 200,
        g: 50,
        b: 50,
        alpha: 0.7,
        tipo: 'ojo',
    });
}

// Aura alrededor del boss
export function emitirAuraBoss(bossX, bossY, bossAncho, bossAlto) {
    if (Math.random() > 0.5) return;
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.max(bossAncho, bossAlto) * 0.7;
    emitir({
        x: bossX + bossAncho / 2 + Math.cos(ang) * dist,
        y: bossY + bossAlto / 2 + Math.sin(ang) * dist,
        vx: Math.cos(ang + 1.5) * 0.3,
        vy: Math.sin(ang + 1.5) * 0.3 - 0.2,
        vida: 20 + Math.floor(Math.random() * 10),
        tamano: 2 + Math.random(),
        r: 187,
        g: 134,
        b: 252,
        alpha: 0.5,
        tipo: 'aura',
    });
}

// Explosion al cambiar fase del boss
export function emitirBossFase(bossX, bossY, bossAncho, bossAlto) {
    const cx = bossX + bossAncho / 2;
    const cy = bossY + bossAlto / 2;
    const cantidad = 12 + Math.floor(Math.random() * 5);
    for (let i = 0; i < cantidad; i++) {
        const ang = (i / cantidad) * Math.PI * 2;
        const vel = 2 + Math.random() * 1.5;
        emitir({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * vel,
            vy: Math.sin(ang) * vel,
            vida: 20 + Math.floor(Math.random() * 10),
            tamano: 3 + Math.random() * 2,
            r: 255,
            g: 100,
            b: 50,
            alpha: 0.9,
            gravedad: true,
            tipo: 'chispa',
        });
    }
}

// Estela del boss en fase critica (< 33% HP)
export function emitirEstelaBoss(bossX, bossY, bossAncho, bossAlto) {
    emitir({
        x: bossX + Math.random() * bossAncho,
        y: bossY + Math.random() * bossAlto,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vida: 12,
        tamano: bossAncho * 0.6 + Math.random() * 4,
        r: 187,
        g: 134,
        b: 252,
        alpha: 0.2,
        tipo: 'afterimage',
    });
}

// --- Actualizar y renderizar ---

export function actualizarParticulas() {
    frameCount++;

    // Early-exit: nada que actualizar
    if (activeCount === 0) return;

    let vivas = 0;
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        p.x += p.vx;
        p.y += p.vy;

        if (p.gravedad) {
            p.vy += GRAVEDAD_PART;
        }

        // Colision con suelo para chispas y fragmentos
        if ((p.tipo === 'chispa' || p.tipo === 'fragmento') && p.vy > 0) {
            if (esSolido(p.x, p.y + p.tamano / 2)) {
                p.vy *= -0.3;
                p.vx *= 0.5;
                p.y -= p.vy;
                if (Math.abs(p.vy) < 0.3) {
                    p.vy = 0;
                    p.vx *= 0.8;
                }
            }
        }

        // Friccion leve en particulas de polvo
        if (p.tipo === 'polvo') {
            p.vx *= 0.95;
            p.vy *= 0.95;
        }

        p.vida--;

        // Fade out
        const ratio = p.vida / p.vidaMax;
        if (p.tipo === 'ojo') {
            // Parpadeo
            p.alpha = ratio > 0.3 ? 0.7 * Math.abs(Math.sin(frameCount * 0.15)) : ratio * 0.7;
        } else if (p.tipo === 'niebla' || p.tipo === 'aura') {
            // Fade in/out suave
            const fadeIn = Math.min(1, (1 - ratio) * 4);
            p.alpha = fadeIn * ratio * 0.2;
        } else if (p.tipo === 'afterimage') {
            p.alpha = ratio * 0.2;
        } else {
            p.alpha = ratio;
        }

        if (p.vida <= 0) {
            p.activa = false;
        } else {
            vivas++;
        }
    }
    activeCount = vivas;
}

export function renderizarParticulas(ctx, camaraX, anchoCanvas) {
    // Early-exit: nada que renderizar
    if (activeCount === 0) return;

    const TAU = Math.PI * 2;
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        // Culling horizontal
        const px = p.x - camaraX;
        if (px < -p.tamano || px > anchoCanvas + p.tamano) continue;

        const py = p.y;

        if (p.alpha <= 0.01) continue;

        // Alpha cuantizado a 2 decimales para reducir string interning
        const a = ((p.alpha * 100 + 0.5) | 0) * 0.01;
        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + a + ')';

        if (p.tipo === 'niebla' || p.tipo === 'aura' || p.tipo === 'afterimage') {
            // Circulos para efecto suave
            ctx.beginPath();
            ctx.arc(px, py, p.tamano, 0, TAU);
            ctx.fill();
        } else {
            // Cuadrados pixelados
            const mitad = p.tamano / 2;
            ctx.fillRect(px - mitad, py - mitad, p.tamano, p.tamano);
        }
    }
}

export function obtenerFrameCount() {
    return frameCount;
}

export function limpiarParticulas() {
    for (let i = 0; i < POOL_SIZE; i++) {
        pool[i].activa = false;
    }
    frameCount = 0;
    nextFree = 0;
    activeCount = 0;
}
