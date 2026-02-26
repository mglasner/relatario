// Motor 3D — Sistema de partículas con pool de objetos

import { FOV, canvas } from './config.js';

const POOL_SIZE = 250;
const RADIO_CULLING = 6;

// Probabilidad de emitir niebla por zona (mazmorra → cueva → profundidades)
const PROB_NIEBLA = [0.25, 0.35, 0.5];

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

    // Buscar ~10 celdas libres aleatorias para gotas
    const candidatas = [];
    for (let f = 1; f < filas - 1; f++) {
        for (let c = 1; c < cols - 1; c++) {
            if (mapa[f][c] === 0) {
                candidatas.push({ f, c });
            }
        }
    }

    // Seleccionar 10 posiciones distribuidas usando hash
    const paso = Math.max(1, Math.floor(candidatas.length / 10));
    for (let i = 0; i < candidatas.length && emisoresGotas.length < 10; i += paso) {
        const { f, c } = candidatas[i];
        emisoresGotas.push({
            x: c + 0.3 + Math.sin(i * 7.3) * 0.4,
            y: f + 0.3 + Math.cos(i * 5.1) * 0.4,
            cooldown: 0,
            intervalo: 500 + ((i * 337) % 600), // 500-1100ms entre gotas
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
    p.r = 130;
    p.g = 180;
    p.b = 240;
    p.alpha = 0.6;
    p.tamano = 2.5;
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
        p.r = 140;
        p.g = 190;
        p.b = 245;
        p.alpha = 0.5;
        p.tamano = 2;
    }
}

// Emite una partícula de fuego desde una antorcha
function emitirLlamaAntorcha(antorcha) {
    const p = obtenerLibre();
    if (!p) return;

    const ang = Math.random() * Math.PI * 2;
    const radio = Math.random() * 0.08;

    p.activa = true;
    p.x = antorcha.x + Math.cos(ang) * radio;
    p.y = antorcha.y + Math.sin(ang) * radio;
    p.z = 0.5; // Altura de antorcha en pared
    p.vx = (Math.random() - 0.5) * 0.002;
    p.vy = (Math.random() - 0.5) * 0.002;
    p.vz = 0.005 + Math.random() * 0.006; // Sube
    p.vida = 25 + Math.floor(Math.random() * 15);
    p.vidaMax = p.vida;
    p.tipo = 'fuego';
    // Color se calcula dinámicamente en render (amarillo → naranja → rojo)
    p.r = 255;
    p.g = 200;
    p.b = 50;
    p.alpha = 0.9;
    p.tamano = 2 + Math.random() * 1;
}

// Emite humo sutil encima de antorcha
function emitirHumoAntorcha(antorcha) {
    const p = obtenerLibre();
    if (!p) return;

    p.activa = true;
    p.x = antorcha.x + (Math.random() - 0.5) * 0.06;
    p.y = antorcha.y + (Math.random() - 0.5) * 0.06;
    p.z = 0.65;
    p.vx = (Math.random() - 0.5) * 0.001;
    p.vy = (Math.random() - 0.5) * 0.001;
    p.vz = 0.003 + Math.random() * 0.002;
    p.vida = 30 + Math.floor(Math.random() * 15);
    p.vidaMax = p.vida;
    p.tipo = 'humo';
    p.r = 80;
    p.g = 75;
    p.b = 70;
    p.alpha = 0.15;
    p.tamano = 2.5 + Math.random() * 1;
}

// Emite destello de cristal (zona 2 — Profundidades)
function emitirDestello(jugadorX, jugadorY) {
    const p = obtenerLibre();
    if (!p) return;

    // Posición aleatoria cercana al jugador (radio 0.3-2.8 celdas)
    const ang = Math.random() * Math.PI * 2;
    const dist = 0.3 + Math.random() * 2.5;

    p.activa = true;
    p.x = jugadorX + Math.cos(ang) * dist;
    p.y = jugadorY + Math.sin(ang) * dist;
    p.z = 0.15 + Math.random() * 0.7; // Altura variada
    p.vx = (Math.random() - 0.5) * 0.0005;
    p.vy = (Math.random() - 0.5) * 0.0005;
    p.vz = 0.001 + Math.random() * 0.002; // Flota suavemente
    p.vida = 40 + Math.floor(Math.random() * 30);
    p.vidaMax = p.vida;
    p.tipo = 'destello';

    // Color cyan o violeta aleatorio
    if (Math.random() > 0.5) {
        p.r = 80;
        p.g = 200;
        p.b = 220;
    } else {
        p.r = 140;
        p.g = 80;
        p.b = 200;
    }
    p.alpha = 0.5 + Math.random() * 0.3;
    p.tamano = 1.5 + Math.random() * 1;
}

// Emite partícula de niebla baja
function emitirNiebla(jugadorX, jugadorY) {
    const p = obtenerLibre();
    if (!p) return;

    // Posición aleatoria cercana al jugador (radio ~3 celdas)
    const ang = Math.random() * Math.PI * 2;
    const dist = 0.5 + Math.random() * 3;

    p.activa = true;
    p.x = jugadorX + Math.cos(ang) * dist;
    p.y = jugadorY + Math.sin(ang) * dist;
    p.z = 0.03 + Math.random() * 0.05; // Pegada al suelo
    p.vx = (Math.random() - 0.5) * 0.001; // Deriva horizontal lenta
    p.vy = (Math.random() - 0.5) * 0.001;
    p.vz = 0; // Sin movimiento vertical
    p.vida = 150 + Math.floor(Math.random() * 100);
    p.vidaMax = p.vida;
    p.tipo = 'niebla';
    p.r = 60;
    p.g = 60;
    p.b = 70;
    p.alpha = 0.08 + Math.random() * 0.04;
    p.tamano = 4 + Math.random() * 2;
}

// --- Emisores de clima para el motor 3D ---

// Paletas de colores para hojas 3D [r, g, b]
const COLORES_HOJAS_3D = [
    [210, 80, 30],
    [230, 150, 40],
    [140, 50, 20],
];

let climaFrame3D = 0;

/**
 * Emite partículas climáticas en el espacio 3D alrededor del jugador.
 * @param {string} estacion - Clave de estación
 * @param {number} jugadorX - Posición X del jugador
 * @param {number} jugadorY - Posición Y del jugador
 */
function emitirClima3D(estacion, jugadorX, jugadorY) {
    climaFrame3D++;

    if (estacion === 'invierno') {
        // Lluvia: gotas que caen desde el techo (z=1 → 0), tintadas azul-violeta
        if (climaFrame3D % 2 === 0) {
            const p = obtenerLibre();
            if (p) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 0.5 + Math.random() * 2.5;
                p.activa = true;
                p.x = jugadorX + Math.cos(ang) * dist;
                p.y = jugadorY + Math.sin(ang) * dist;
                p.z = 0.95 + Math.random() * 0.05;
                p.vx = -0.003;
                p.vy = 0;
                p.vz = -0.025; // Cae rápido
                p.vida = 40;
                p.vidaMax = 40;
                p.tipo = 'lluvia-3d';
                p.r = 170;
                p.g = 200;
                p.b = 255;
                p.alpha = 0.55;
                p.tamano = 1.5;
            }
        }
    } else if (estacion === 'primavera') {
        // Pétalos: caen suavemente, oscilan
        if (climaFrame3D % 4 === 0) {
            const p = obtenerLibre();
            if (p) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 0.5 + Math.random() * 2;
                p.activa = true;
                p.x = jugadorX + Math.cos(ang) * dist;
                p.y = jugadorY + Math.sin(ang) * dist;
                p.z = 0.8 + Math.random() * 0.2;
                p.vx = (Math.random() - 0.5) * 0.002;
                p.vy = (Math.random() - 0.5) * 0.002;
                p.vz = -0.004; // Cae lentamente
                p.vida = 120 + Math.floor(Math.random() * 60);
                p.vidaMax = p.vida;
                p.tipo = 'petalo-3d';
                // Colores rosados saturados (no blancos)
                const pIdx = Math.floor(Math.random() * 4);
                p.r = [230, 220, 200, 245][pIdx];
                p.g = [80, 60, 80, 110][pIdx];
                p.b = [130, 110, 160, 150][pIdx];
                p.alpha = 0.85;
                p.tamano = 3 + Math.random() * 1.5;
            }
        }
    } else if (estacion === 'verano') {
        // Motas de polvo: flotan a media altura
        if (climaFrame3D % 5 === 0) {
            const p = obtenerLibre();
            if (p) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 0.3 + Math.random() * 3;
                p.activa = true;
                p.x = jugadorX + Math.cos(ang) * dist;
                p.y = jugadorY + Math.sin(ang) * dist;
                p.z = 0.2 + Math.random() * 0.5;
                p.vx = (Math.random() - 0.5) * 0.001;
                p.vy = (Math.random() - 0.5) * 0.001;
                p.vz = 0.0005; // Flota levemente
                p.vida = 200 + Math.floor(Math.random() * 100);
                p.vidaMax = p.vida;
                p.tipo = 'mota-3d';
                p.r = 220;
                p.g = 190;
                p.b = 100;
                p.alpha = 0.3;
                p.tamano = 1.5 + Math.random();
            }
        }
    } else if (estacion === 'otono') {
        // Hojas: caen con oscilación
        if (climaFrame3D % 3 === 0) {
            const c = COLORES_HOJAS_3D[Math.floor(Math.random() * 3)];
            const p = obtenerLibre();
            if (p) {
                const ang = Math.random() * Math.PI * 2;
                const dist = 0.4 + Math.random() * 2.5;
                p.activa = true;
                p.x = jugadorX + Math.cos(ang) * dist;
                p.y = jugadorY + Math.sin(ang) * dist;
                p.z = 0.7 + Math.random() * 0.3;
                p.vx = (Math.random() - 0.5) * 0.004;
                p.vy = (Math.random() - 0.5) * 0.004;
                p.vz = -0.006 - Math.random() * 0.003;
                p.vida = 80 + Math.floor(Math.random() * 50);
                p.vidaMax = p.vida;
                p.tipo = 'hoja-3d';
                p.r = c[0];
                p.g = c[1];
                p.b = c[2];
                p.alpha = 0.75;
                p.tamano = 2 + Math.random();
            }
        }
    }
}

// Actualiza todas las partículas y emite nuevas
// zona: zona actual del jugador (0/1/2) para efectos diferenciados
// estacion: estación climática activa (null si no hay)
export function actualizarParticulas(ahora, antorchas, jugadorX, jugadorY, zona, estacion) {
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

    // Emitir fuego desde antorchas cercanas
    if (antorchas) {
        const radioSqCull = RADIO_CULLING * RADIO_CULLING;

        for (let ai = 0; ai < antorchas.length; ai++) {
            const a = antorchas[ai];
            const dx = a.x - jugadorX;
            const dy = a.y - jugadorY;
            if (dx * dx + dy * dy < radioSqCull) {
                // ~35% chance por frame por antorcha — fuego constante
                if (Math.random() < 0.35) {
                    emitirLlamaAntorcha(a);
                }
                // Segundo intento para llamas densas
                if (Math.random() < 0.2) {
                    emitirLlamaAntorcha(a);
                }
                // Humo sutil ~10%
                if (Math.random() < 0.1) {
                    emitirHumoAntorcha(a);
                }
            }
        }
    }

    // Emitir niebla baja (más densa en zona 2)
    const probNiebla = PROB_NIEBLA[zona] ?? 0.25;
    if (Math.random() < probNiebla) {
        emitirNiebla(jugadorX, jugadorY);
    }

    // Destellos de cristal solo en zona 2 (Profundidades)
    if (zona === 2 && Math.random() < 0.15) {
        emitirDestello(jugadorX, jugadorY);
    }

    // Partículas climáticas 3D
    if (estacion) {
        emitirClima3D(estacion, jugadorX, jugadorY);
    }

    // Actualizar partículas activas
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;

        // Oscilación horizontal para pétalos y hojas 3D
        if (p.tipo === 'petalo-3d') {
            // Fase única por partícula usando vidaMax como semilla
            p.vx = Math.sin(climaFrame3D * 0.04 + p.vidaMax * 0.27) * 0.002;
        } else if (p.tipo === 'hoja-3d') {
            p.vx = Math.sin(climaFrame3D * 0.04 + p.y) * 0.003;
        } else if (p.tipo === 'mota-3d') {
            p.vz = Math.sin(climaFrame3D * 0.02 + p.x * 0.5) * 0.0008;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vida--;

        // Fade out según tipo
        const vidaRatio = p.vida / p.vidaMax;
        if (p.tipo === 'fuego') {
            p.alpha = vidaRatio * 0.9;
        } else if (p.tipo === 'humo') {
            // Humo: fade in rápido, fade out lento
            const fadeIn = Math.min(1, (1 - vidaRatio) * 5);
            p.alpha = fadeIn * vidaRatio * 0.15;
        } else if (p.tipo === 'niebla') {
            // Niebla: fade in/out suave
            const fadeIn = Math.min(1, (1 - vidaRatio) * 3);
            p.alpha = fadeIn * vidaRatio * 0.12;
        } else if (p.tipo === 'destello') {
            // Destello: pulso brillante que se desvanece
            const pulso = Math.sin(vidaRatio * Math.PI);
            p.alpha = pulso * 0.7;
        } else if (p.tipo === 'lluvia-3d' || p.tipo === 'petalo-3d' || p.tipo === 'hoja-3d') {
            p.alpha = vidaRatio > 0.15 ? p.alpha : (vidaRatio / 0.15) * p.alpha;
        } else if (p.tipo === 'mota-3d') {
            // Motas de verano: alpha estable, fade al final
            p.alpha = vidaRatio > 0.3 ? 0.3 : (vidaRatio / 0.3) * 0.3;
        } else {
            p.alpha = vidaRatio * 0.6;
        }

        // Gota toca el suelo → salpicadura
        if (p.tipo === 'gota' && p.z <= 0) {
            emitirSalpicadura(p.x, p.y);
            p.activa = false;
            continue;
        }

        // Partícula expirada
        if (p.vida <= 0 || p.z > 1.1 || p.z < -0.05) {
            p.activa = false;
        }
    }
}

// Cache para fillStyle de partículas (evita string concat repetida)
let _lastColorKey = -1;
let _lastAlphaIdx = -1;
let _lastFillStyle = '';

// Renderiza partículas en la vista 3D (con z-buffer check)
export function renderizarParticulas(ctx, zBuffer, jugadorX, jugadorY, angulo) {
    _lastColorKey = -1; // Reset cache cada frame
    const { ancho, alto, numRayos, anchoFranja } = canvas;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;
        // Fuego y humo de antorchas se renderizan en renderizarFuegoAntorchas
        if (p.tipo === 'fuego' || p.tipo === 'humo') continue;

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

        // Reutilizar fillStyle solo si color cambió
        const alphaIdx = Math.min(100, Math.round(p.alpha * 100));
        const key = (p.r << 16) | (p.g << 8) | p.b;
        if (key !== _lastColorKey || alphaIdx !== _lastAlphaIdx) {
            _lastColorKey = key;
            _lastAlphaIdx = alphaIdx;
            _lastFillStyle =
                'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (alphaIdx / 100).toFixed(2) + ')';
        }
        ctx.fillStyle = _lastFillStyle;

        // Niebla: círculos borrosos en vez de cuadrados
        if (p.tipo === 'niebla') {
            ctx.beginPath();
            ctx.arc(screenX, screenY, tamano, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.tipo === 'destello') {
            // Destellos de cristal: glow aditivo
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.beginPath();
            ctx.arc(screenX, screenY, tamano, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillRect(screenX - tamano / 2, screenY - tamano / 2, tamano, tamano);
        }
    }
}

// Renderiza fuego de antorchas con glow y blending aditivo
export function renderizarFuegoAntorchas(ctx, zBuffer, antorchas, jugadorX, jugadorY, angulo) {
    if (!antorchas || antorchas.length === 0) return;

    const { ancho, alto, numRayos, anchoFranja } = canvas;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    // Primero: glow cálido en posición de cada antorcha visible
    for (const a of antorchas) {
        const dx = a.x - jugadorX;
        const dy = a.y - jugadorY;
        const distSq = dx * dx + dy * dy;
        if (distSq > radioSq) continue;

        const dist = Math.sqrt(distSq);
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
        const screenY = alto / 2 - (0.5 - 0.5) * alturaPared; // z=0.5

        // Glow cálido: círculo aditivo grande
        const glowRadius = Math.max(8, 40 / distPerp);
        const glowAlpha = Math.min(0.15, 0.4 / distPerp);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowRadius);
        grad.addColorStop(0, 'rgba(255,180,60,' + glowAlpha.toFixed(3) + ')');
        grad.addColorStop(0.5, 'rgba(255,120,20,' + (glowAlpha * 0.4).toFixed(3) + ')');
        grad.addColorStop(1, 'rgba(255,60,10,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(screenX - glowRadius, screenY - glowRadius, glowRadius * 2, glowRadius * 2);
        ctx.restore();
    }

    // Segundo: partículas de fuego y humo con blending aditivo
    ctx.save();

    for (let i = 0; i < POOL_SIZE; i++) {
        const p = pool[i];
        if (!p.activa) continue;
        if (p.tipo !== 'fuego' && p.tipo !== 'humo') continue;

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
        const tamano = Math.max(1, p.tamano * (3 / distPerp));

        if (p.tipo === 'fuego') {
            // Color dinámico: amarillo brillante → naranja → rojo oscuro
            ctx.globalCompositeOperation = 'lighter';
            const t = p.vida / p.vidaMax;
            const r = Math.floor(100 + 155 * Math.min(1, t * 1.5));
            const g = Math.floor(220 * t * t);
            const b = Math.floor(50 * t * t * t);
            const alphaIdx = Math.min(100, Math.round(p.alpha * 100));
            ctx.fillStyle =
                'rgba(' + r + ',' + g + ',' + b + ',' + (alphaIdx / 100).toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(screenX, screenY, tamano, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Humo: blending normal, gris sutil
            ctx.globalCompositeOperation = 'source-over';
            const alphaIdx = Math.min(100, Math.round(p.alpha * 100));
            ctx.fillStyle =
                'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + (alphaIdx / 100).toFixed(2) + ')';
            ctx.beginPath();
            ctx.arc(screenX, screenY, tamano * 1.3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    ctx.restore();
}

// Limpia todas las partículas activas
export function limpiarParticulas() {
    for (let i = 0; i < POOL_SIZE; i++) {
        pool[i].activa = false;
    }
    emisoresGotas = [];
    climaFrame3D = 0;
}
