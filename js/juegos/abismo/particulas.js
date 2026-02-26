// Habitacion 4 — El Abismo: Sistema de particulas 2D
// Pool preallocado de 250 particulas con culling horizontal y vertical
// Optimizado: puntero circular para busqueda O(1) amortizada y conteo de activas

import { esSolido } from './fisicas.js';

const POOL_SIZE = 250;
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
    p.vx = config.vx ?? 0;
    p.vy = config.vy ?? 0;
    p.vida = config.vida ?? 20;
    p.vidaMax = config.vida ?? 20;
    p.tamano = config.tamano ?? 2;
    p.r = config.r ?? 255;
    p.g = config.g ?? 255;
    p.b = config.b ?? 255;
    p.alpha = config.alpha ?? 1;
    p.gravedad = config.gravedad ?? false;
    p.tipo = config.tipo ?? '';
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

// Chispas de fuego ascendentes desde el abismo
export function emitirChispaFuego(x, y) {
    if (Math.random() > 0.3) return;
    emitir({
        x: x + Math.random() * 16,
        y: y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.8 - Math.random() * 1.2,
        vida: 20 + Math.floor(Math.random() * 15),
        tamano: 1 + Math.random() * 1.5,
        r: 255,
        g: 150 + Math.floor(Math.random() * 100),
        b: 20 + Math.floor(Math.random() * 30),
        alpha: 0.8,
        tipo: 'brasa',
    });
}

// Destellos de cristales parpadeantes
export function emitirDestellosCristal(x, y) {
    if (Math.random() > 0.15) return;
    emitir({
        x: x + Math.random() * 16,
        y: y - Math.random() * 8,
        vx: 0,
        vy: -0.1 - Math.random() * 0.2,
        vida: 10 + Math.floor(Math.random() * 10),
        tamano: 1 + Math.random(),
        r: 200 + Math.floor(Math.random() * 55),
        g: 150 + Math.floor(Math.random() * 60),
        b: 255,
        alpha: 0.9,
        tipo: 'destello',
    });
}

// Burbujas toxicas ascendentes del pantano
export function emitirBurbujaPantano(x, y) {
    if (Math.random() > 0.2) return;
    emitir({
        x: x + Math.random() * 16,
        y: y,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.3 - Math.random() * 0.5,
        vida: 30 + Math.floor(Math.random() * 20),
        tamano: 1.5 + Math.random() * 2,
        r: 80 + Math.floor(Math.random() * 40),
        g: 200 + Math.floor(Math.random() * 55),
        b: 30 + Math.floor(Math.random() * 30),
        alpha: 0.5,
        tipo: 'burbuja',
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

// Partículas de telégrafo del boss (chispas en color del ataque)
export function emitirTelegrafo(x, y, ancho, alto, r, g, b) {
    if (Math.random() > 0.6) return;
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.max(ancho, alto) * 0.6 + Math.random() * 4;
    emitir({
        x: x + ancho / 2 + Math.cos(ang) * dist,
        y: y + alto / 2 + Math.sin(ang) * dist,
        vx: Math.cos(ang) * 0.5,
        vy: Math.sin(ang) * 0.5 - 0.3,
        vida: 10 + Math.floor(Math.random() * 8),
        tamano: 1.5 + Math.random(),
        r,
        g,
        b,
        alpha: 0.8,
        tipo: 'chispa',
    });
}

// Estela detrás de un proyectil
export function emitirProyectilEstela(x, y, r, g, b) {
    if (Math.random() > 0.5) return;
    emitir({
        x: x + (Math.random() - 0.5) * 3,
        y: y + (Math.random() - 0.5) * 3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        vida: 8 + Math.floor(Math.random() * 5),
        tamano: 1.5 + Math.random(),
        r,
        g,
        b,
        alpha: 0.5,
        tipo: 'aura',
    });
}

// Impacto en el suelo (salto del boss o zona de daño)
export function emitirImpactoSuelo(cx, cy, r, g, b) {
    const cantidad = 8 + Math.floor(Math.random() * 4);
    for (let i = 0; i < cantidad; i++) {
        const ang = (i / cantidad) * Math.PI * 2;
        const vel = 1 + Math.random() * 1.5;
        emitir({
            x: cx,
            y: cy,
            vx: Math.cos(ang) * vel,
            vy: Math.sin(ang) * vel * 0.3 - 0.5,
            vida: 12 + Math.floor(Math.random() * 8),
            tamano: 1.5 + Math.random() * 1.5,
            r,
            g,
            b,
            alpha: 0.7,
            gravedad: true,
            tipo: 'chispa',
        });
    }
}

// --- Estado de clima (ráfaga de otoño) ---

let rafagaCounter = 0;
let rafagaProxFrame = 180 + Math.floor(Math.random() * 120);
let rafagaActiva = false;
let rafagaFramesRestantes = 0;

function manejarRafagaOtono() {
    rafagaCounter++;
    if (rafagaCounter >= rafagaProxFrame) {
        rafagaCounter = 0;
        rafagaProxFrame = 180 + Math.floor(Math.random() * 120);
        rafagaActiva = true;
        rafagaFramesRestantes = 30;
    }
    if (rafagaActiva) {
        rafagaFramesRestantes--;
        if (rafagaFramesRestantes <= 0) rafagaActiva = false;
    }
}

// Paletas de colores para hojas de otoño [r, g, b]
const COLORES_HOJAS = [
    [210, 80, 30],
    [230, 150, 40],
    [140, 50, 20],
];

/**
 * Emite partículas climáticas para la estación activa.
 * Llamar cada frame desde emitirParticulasAmbientales.
 * @param {string} estacion - Clave de estación ('invierno'|'primavera'|'verano'|'otono')
 * @param {number} anchoCanvas - Ancho del canvas en píxeles de juego
 * @param {number} camaraX - Posición X de la cámara en coordenadas de mundo
 * @param {number} camaraY - Posición Y de la cámara en coordenadas de mundo
 */
export function emitirClima(estacion, anchoCanvas, camaraX, camaraY) {
    if (!estacion) return;

    if (estacion === 'invierno') {
        // Lluvia: 2-3 gotas por frame desde la parte superior visible
        const n = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY - 4,
                vx: -1.2,
                vy: 5.5 + Math.random() * 2,
                vida: 20 + Math.floor(Math.random() * 8),
                tamano: 2,
                r: 170,
                g: 200,
                b: 255,
                alpha: 0.6,
                tipo: 'lluvia-clima',
            });
        }
    } else if (estacion === 'primavera') {
        // Pétalos: cada 4 frames — colores saturados rosados/fucsia, tamaño mayor
        if (frameCount % 4 === 0) {
            const paletas = [
                [230, 80, 130], // rosa fucsia
                [220, 60, 110], // cerezo
                [200, 80, 200], // violeta
                [245, 160, 60], // naranja durazno
                [80, 180, 220], // celeste
                [255, 220, 60], // amarillo pollito
                [160, 220, 80], // verde lima
                [240, 130, 180], // rosa claro
            ];
            const c = paletas[Math.floor(Math.random() * paletas.length)];
            // vidaMax variable sirve como semilla de fase para la oscilación
            const vidaMax = 140 + Math.floor(Math.random() * 80);
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY - 4,
                // Deriva lateral inicial variada: algunos van a la izquierda, otros a la derecha
                vx: (Math.random() - 0.5) * 1.2,
                vy: 0.5 + Math.random() * 0.5,
                vida: vidaMax,
                tamano: 3.5 + Math.random() * 2.5,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.85,
                tipo: 'petalo',
            });
        }
        // Destellos de luz flotantes: cada 7 frames
        if (frameCount % 7 === 0) {
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY + Math.random() * 120,
                vx: 0,
                vy: 0,
                vida: 60 + Math.floor(Math.random() * 30),
                tamano: 1.2,
                r: 255,
                g: 255,
                b: 200,
                alpha: 0.85,
                tipo: 'destello-clima',
            });
        }
    } else if (estacion === 'verano') {
        // Motas de polvo flotante: cada 4 frames
        if (frameCount % 4 === 0) {
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY + Math.random() * 90,
                vx: 0.1 + Math.random() * 0.15,
                vy: 0,
                vida: 250 + Math.floor(Math.random() * 100),
                tamano: 1 + Math.random(),
                r: 220,
                g: 190,
                b: 100,
                alpha: 0.25 + Math.random() * 0.2,
                tipo: 'polvo-clima',
            });
        }
    } else if (estacion === 'otono') {
        manejarRafagaOtono();

        // Hojas: cada 4 frames (vx aumentado durante ráfaga)
        if (frameCount % 4 === 0) {
            const c = COLORES_HOJAS[Math.floor(Math.random() * 3)];
            const baseVx = rafagaActiva ? -2.5 - Math.random() * 0.5 : -0.8 - Math.random() * 1.4;
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY - 4,
                vx: baseVx,
                vy: 0.4 + Math.random() * 0.8,
                vida: 90 + Math.floor(Math.random() * 50),
                tamano: 2 + Math.random(),
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.8,
                tipo: 'hoja',
            });
        }
        // Lluvia suave de otoño: cada 2 frames
        if (frameCount % 2 === 0) {
            emitir({
                x: camaraX + Math.random() * anchoCanvas,
                y: camaraY - 4,
                vx: -0.6,
                vy: 2.5 + Math.random() * 1,
                vida: 35 + Math.floor(Math.random() * 10),
                tamano: 1.5,
                r: 200,
                g: 160,
                b: 80,
                alpha: 0.28,
                tipo: 'lluvia-suave',
            });
        }
    }
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

        // Oscilacion horizontal para pétalos y polvo de clima
        if (p.tipo === 'petalo') {
            // Fase única por partícula usando vidaMax como semilla → cada pétalo oscila distinto
            p.vx = Math.sin(frameCount * 0.04 + p.vidaMax * 0.27) * 1.1;
        } else if (p.tipo === 'polvo-clima') {
            p.vy = Math.sin(frameCount * 0.02 + p.x * 0.05) * 0.15;
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
        } else if (p.tipo === 'brasa') {
            p.alpha = ratio * 0.8;
            p.tamano *= 0.98;
            if (ratio < 0.3) p.g = Math.max(50, p.g - 3);
        } else if (p.tipo === 'destello') {
            p.alpha = ratio * 0.9 * (0.5 + 0.5 * Math.abs(Math.sin(frameCount * 0.3 + p.x)));
        } else if (p.tipo === 'burbuja') {
            p.vx = Math.sin(frameCount * 0.1 + p.y * 0.2) * 0.1;
            p.alpha = ratio > 0.1 ? ratio * 0.5 : 0;
        } else if (p.tipo === 'destello-clima') {
            // Pulso brillante oscilante
            p.alpha = 0.85 * Math.abs(Math.sin(frameCount * 0.15 + p.x * 0.1));
        } else if (p.tipo === 'lluvia-clima' || p.tipo === 'lluvia-suave') {
            // Alfa constante, fade rápido al final
            p.alpha =
                ratio > 0.2
                    ? p.vidaMax > 30
                        ? 0.6
                        : 0.28
                    : (ratio * (p.vidaMax > 30 ? 0.6 : 0.28)) / 0.2;
        } else if (p.tipo === 'petalo' || p.tipo === 'hoja') {
            // Fade suave al final
            p.alpha = ratio > 0.15 ? 0.8 : (ratio / 0.15) * 0.8;
        } else if (p.tipo === 'polvo-clima') {
            // Sin fade visible — la alpha base es baja
            p.alpha = ratio > 0.3 ? p.alpha : (ratio / 0.3) * p.alpha;
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

export function renderizarParticulas(ctx, camaraX, camaraY, anchoCanvas, altoCanvas) {
    // Early-exit: nada que renderizar
    if (activeCount === 0) return;

    const TAU = Math.PI * 2;
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        // Culling horizontal
        const px = p.x - camaraX;
        if (px < -p.tamano || px > anchoCanvas + p.tamano) continue;

        // Culling vertical
        const py = p.y - camaraY;
        if (py < -p.tamano || py > altoCanvas + p.tamano) continue;

        if (p.alpha <= 0.01) continue;

        // Alpha cuantizado a 2 decimales para reducir string interning
        const a = ((p.alpha * 100 + 0.5) | 0) * 0.01;
        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + a + ')';

        if (
            p.tipo === 'niebla' ||
            p.tipo === 'aura' ||
            p.tipo === 'afterimage' ||
            p.tipo === 'burbuja' ||
            p.tipo === 'destello-clima'
        ) {
            // Circulos para efecto suave
            ctx.beginPath();
            ctx.arc(px, py, p.tamano, 0, TAU);
            ctx.fill();
        } else if (p.tipo === 'petalo') {
            // Pétalo: elipse alargada rotada según dirección de movimiento
            const angPetalo = Math.atan2(p.vy, p.vx);
            const escalaP = 1 + 0.28 * Math.sin(p.vida * 0.12 + p.vidaMax * 0.43);
            const tamP = p.tamano * escalaP;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angPetalo);
            ctx.beginPath();
            ctx.ellipse(0, 0, tamP * 1.4, tamP * 0.55, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
        } else if (p.tipo === 'hoja') {
            // Hoja: óvalo puntiagudo con bezier, orientado según movimiento
            const angHoja = Math.atan2(p.vy, p.vx) + Math.PI * 0.5;
            const escalaH = 1 + 0.28 * Math.sin(p.vida * 0.12 + p.vidaMax * 0.43);
            const rh = p.tamano * escalaH;
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angHoja);
            ctx.beginPath();
            ctx.moveTo(0, -rh * 1.6);
            ctx.bezierCurveTo(rh * 0.85, -rh * 0.6, rh * 0.85, rh * 0.6, 0, rh * 1.6);
            ctx.bezierCurveTo(-rh * 0.85, rh * 0.6, -rh * 0.85, -rh * 0.6, 0, -rh * 1.6);
            ctx.fill();
            ctx.restore();
        } else if (p.tipo === 'lluvia-clima') {
            // Gota de lluvia: línea vertical delgada
            ctx.fillRect(px, py, 1, 5);
        } else if (p.tipo === 'lluvia-suave') {
            // Llovizna de otoño: línea muy delgada
            ctx.fillRect(px, py, 0.5, 3);
        } else {
            // Cuadrados pixelados (polvo-clima y resto)
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
    rafagaCounter = 0;
    rafagaActiva = false;
    rafagaFramesRestantes = 0;
}
