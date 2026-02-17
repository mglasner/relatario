// Motor 3D — Sistema de partículas con pool de objetos

import { FOV, canvas } from './config.js';

const POOL_SIZE = 200;
const RADIO_CULLING = 6;
const MAX_EMISORES_CHISPA = 5;

// Pool preasignado (evita GC)
const pool = [];
for (let i = 0; i < POOL_SIZE; i++) {
    pool.push({
        activa: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        vida: 0,
        vidaMax: 0,
        tipo: 'gota',
        r: 0,
        g: 0,
        b: 0,
        alpha: 0,
        tamano: 0,
    });
}

// Obtiene una partícula libre del pool (o null si lleno)
function obtenerLibre() {
    for (let i = 0; i < POOL_SIZE; i++) {
        if (!pool[i].activa) return pool[i];
    }
    return null; // Pool lleno — graceful degradation
}

// Emisores de gotas de agua
let emisoresGotas = [];

// Inicializa emisores basados en el mapa
export function inicializarEmisores(mapa, filas, cols) {
    emisoresGotas = [];

    // Buscar ~5 celdas libres aleatorias para gotas
    const candidatas = [];
    for (let f = 1; f < filas - 1; f++) {
        for (let c = 1; c < cols - 1; c++) {
            if (mapa[f][c] === 0) {
                candidatas.push({ f, c });
            }
        }
    }

    // Seleccionar 5 posiciones distribuidas usando hash
    const paso = Math.max(1, Math.floor(candidatas.length / 5));
    for (let i = 0; i < candidatas.length && emisoresGotas.length < 5; i += paso) {
        const { f, c } = candidatas[i];
        emisoresGotas.push({
            x: c + 0.3 + Math.sin(i * 7.3) * 0.4,
            y: f + 0.3 + Math.cos(i * 5.1) * 0.4,
            cooldown: 0,
            intervalo: 800 + ((i * 337) % 600), // 800-1400ms entre gotas
        });
    }
}

// Emite una gota de agua desde un emisor
function emitirGota(emisor) {
    const p = obtenerLibre();
    if (!p) return;

    p.activa = true;
    p.x = emisor.x + (Math.random() - 0.5) * 0.1;
    p.y = emisor.y + (Math.random() - 0.5) * 0.1;
    p.z = 1.0; // Techo
    p.vx = 0;
    p.vy = 0;
    p.vz = -0.008; // Cae hacia abajo
    p.vida = 120; // ~2 segundos a 60fps
    p.vidaMax = 120;
    p.tipo = 'gota';
    p.r = 100;
    p.g = 150;
    p.b = 220;
    p.alpha = 0.6;
    p.tamano = 2;
}

// Emite salpicadura al impactar el suelo
function emitirSalpicadura(x, y) {
    for (let i = 0; i < 3; i++) {
        const p = obtenerLibre();
        if (!p) return;

        const ang = Math.random() * Math.PI * 2;
        const vel = 0.002 + Math.random() * 0.003;

        p.activa = true;
        p.x = x;
        p.y = y;
        p.z = 0.02;
        p.vx = Math.cos(ang) * vel;
        p.vy = Math.sin(ang) * vel;
        p.vz = 0.003 + Math.random() * 0.002;
        p.vida = 20;
        p.vidaMax = 20;
        p.tipo = 'salpicadura';
        p.r = 120;
        p.g = 170;
        p.b = 230;
        p.alpha = 0.5;
        p.tamano = 1.5;
    }
}

// Emite chispa desde una antorcha
function emitirChispa(antorcha) {
    const p = obtenerLibre();
    if (!p) return;

    p.activa = true;
    p.x = antorcha.x + (Math.random() - 0.5) * 0.1;
    p.y = antorcha.y + (Math.random() - 0.5) * 0.1;
    p.z = 0.5;
    p.vx = (Math.random() - 0.5) * 0.003;
    p.vy = (Math.random() - 0.5) * 0.003;
    p.vz = 0.005 + Math.random() * 0.004; // Sube
    p.vida = 40 + Math.floor(Math.random() * 20);
    p.vidaMax = p.vida;
    p.tipo = 'chispa';
    // Naranja a amarillo
    p.r = 255;
    p.g = 150 + Math.floor(Math.random() * 80);
    p.b = 20 + Math.floor(Math.random() * 30);
    p.alpha = 0.8;
    p.tamano = 1.5;
}

// Actualiza todas las partículas y emite nuevas
export function actualizarParticulas(ahora, antorchas, jugadorX, jugadorY) {
    // Emitir gotas
    for (const emisor of emisoresGotas) {
        if (ahora - emisor.cooldown > emisor.intervalo) {
            // Solo emitir si el emisor está cerca del jugador
            const dx = emisor.x - jugadorX;
            const dy = emisor.y - jugadorY;
            if (dx * dx + dy * dy < RADIO_CULLING * RADIO_CULLING) {
                emitirGota(emisor);
            }
            emisor.cooldown = ahora;
        }
    }

    // Emitir chispas desde antorchas cercanas (sin allocar arrays/objetos)
    if (antorchas) {
        const radioSqCull = RADIO_CULLING * RADIO_CULLING;
        let emitidas = 0;

        for (let ai = 0; ai < antorchas.length && emitidas < MAX_EMISORES_CHISPA; ai++) {
            const a = antorchas[ai];
            const dx = a.x - jugadorX;
            const dy = a.y - jugadorY;
            if (dx * dx + dy * dy < radioSqCull) {
                if (Math.random() < 0.08) {
                    emitirChispa(a);
                    emitidas++;
                }
            }
        }
    }

    // Actualizar partículas activas
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vida--;

        // Fade out
        const vidaRatio = p.vida / p.vidaMax;
        p.alpha = vidaRatio * (p.tipo === 'chispa' ? 0.8 : 0.6);

        // Gota toca el suelo → salpicadura
        if (p.tipo === 'gota' && p.z <= 0) {
            emitirSalpicadura(p.x, p.y);
            p.activa = false;
            continue;
        }

        // Partícula expirada
        if (p.vida <= 0 || p.z > 1.1) {
            p.activa = false;
        }
    }
}

// Renderiza partículas en la vista 3D (con z-buffer check)
export function renderizarParticulas(ctx, zBuffer, jugadorX, jugadorY, angulo) {
    const { ancho, alto, numRayos, anchoFranja } = canvas;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        // Culling por distancia
        const dx = p.x - jugadorX;
        const dy = p.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.2) continue;

        // Proyección (misma lógica que sprites)
        const anguloSprite = Math.atan2(dy, dx);
        let anguloRel = anguloSprite - angulo;

        while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
        while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;

        if (Math.abs(anguloRel) > FOV / 2 + 0.1) continue;

        const screenX = (0.5 + anguloRel / FOV) * ancho;
        const distPerp = dist * Math.cos(anguloRel);
        if (distPerp < 0.1) continue;

        // Z-buffer check
        const col = Math.floor(screenX / anchoFranja);
        if (col >= 0 && col < numRayos && distPerp >= zBuffer[col]) continue;

        // Posición vertical según z (0=suelo, 1=techo)
        const alturaPared = alto / distPerp;
        const screenY = alto / 2 - (p.z - 0.5) * alturaPared;

        // Tamaño según distancia
        const tamano = Math.max(1, p.tamano * (3 / distPerp));

        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + p.alpha.toFixed(2) + ')';
        ctx.fillRect(screenX - tamano / 2, screenY - tamano / 2, tamano, tamano);
    }
}

// Limpia todas las partículas activas
export function limpiarParticulas() {
    for (let i = 0; i < POOL_SIZE; i++) {
        pool[i].activa = false;
    }
    emisoresGotas = [];
}
