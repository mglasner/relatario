// Habitacion 4 — El Abismo: Texturas procedurales de tiles (48×48 alta resolución)
// Genera offscreen canvases de 48×48 con aspecto de piedra, plataforma, fuego, cristales, pantano

import { CFG } from './config.js';

const TAM = CFG.tiles.tamano;
export const TAM_TEX = 48;
const ESCALA = TAM_TEX / TAM;
const VARIANTES = 8;

// Cache de texturas
let texturas = null;

// Ruido simple para textura
function ruido(x, y, seed) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

// Hash para elegir variante por posicion en el mapa
export function hashVariante(fila, col) {
    return ((fila * 37 + col * 71) & 0x7fffffff) % VARIANTES;
}

// --- Helpers ---

// Crea un canvas offscreen de 48×48 para textura
function crearCanvasTex() {
    const canvas = document.createElement('canvas');
    canvas.width = TAM_TEX;
    canvas.height = TAM_TEX;
    return { canvas, ctx: canvas.getContext('2d') };
}

// Aplica ruido de brillo sobre el contenido existente via ImageData
function aplicarRuido(ctx, seed, intensidad) {
    const imgData = ctx.getImageData(0, 0, TAM_TEX, TAM_TEX);
    const data = imgData.data;
    const mitad = intensidad / 2;
    for (let py = 0; py < TAM_TEX; py++) {
        for (let px = 0; px < TAM_TEX; px++) {
            const idx = (py * TAM_TEX + px) * 4;
            const n = ruido(px, py, seed) * intensidad - mitad;
            if (n > 0) {
                data[idx] += (255 - data[idx]) * n;
                data[idx + 1] += (255 - data[idx + 1]) * n;
                data[idx + 2] += (255 - data[idx + 2]) * n;
            } else {
                const m = -n;
                data[idx] -= data[idx] * m;
                data[idx + 1] -= data[idx + 1] * m;
                data[idx + 2] -= data[idx + 2] * m;
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

// Genera columnas ascendentes per-pixel (patron compartido fuego/cristales)
function generarColumnas(ctx, seed, config) {
    const alturaBase = Math.round(config.alturaBase * ESCALA);
    const tope = TAM_TEX - Math.round(config.margenSuperior * ESCALA);
    for (let px = 0; px < TAM_TEX; px++) {
        const h = alturaBase + Math.floor(ruido(px, 0, seed) * (tope - alturaBase));
        for (let py = TAM_TEX - 1; py >= TAM_TEX - h; py--) {
            const t = (TAM_TEX - py) / h;
            const n = ruido(px, py, seed);
            if (n < config.umbral) continue;
            const color = config.colorear(t, n);
            const alpha = config.alphaFn(t, n);
            ctx.fillStyle =
                'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + alpha.toFixed(2) + ')';
            ctx.fillRect(px, py, 1, 1);
        }
    }
}

// --- Funciones de color por tipo ---

function colorearFuego(t, n) {
    if (t < 0.4) {
        return { r: 180 + Math.floor(n * 60), g: 25 + Math.floor(t * 90), b: 5 };
    }
    if (t < 0.7) {
        return { r: 220 + Math.floor(n * 35), g: 90 + Math.floor((t - 0.4) * 340), b: 10 };
    }
    return { r: 255, g: 200 + Math.floor(n * 55), b: 40 + Math.floor((t - 0.7) * 160) };
}

function colorearCristales(t, n) {
    if (t < 0.3) {
        return {
            r: 50 + Math.floor(n * 30),
            g: 10 + Math.floor(n * 15),
            b: 90 + Math.floor(n * 50),
        };
    }
    if (t < 0.7) {
        return {
            r: 100 + Math.floor(n * 50),
            g: 40 + Math.floor((t - 0.3) * 100),
            b: 160 + Math.floor(n * 40),
        };
    }
    return {
        r: 180 + Math.floor(n * 60),
        g: 120 + Math.floor(n * 80),
        b: 220 + Math.floor(n * 35),
    };
}

// --- Generadores (48×48) ---

function generarSuelo(variante) {
    const { canvas, ctx } = crearCanvasTex();
    const seed = variante * 17.3;

    // Base: piedra oscura con gradiente vertical
    const grad = ctx.createLinearGradient(0, 0, 0, TAM_TEX);
    grad.addColorStop(0, '#2e2e62');
    grad.addColorStop(1, '#222250');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    // Ruido para textura de piedra (via ImageData)
    aplicarRuido(ctx, seed, 0.12);

    // Grietas (lineas oscuras aleatorias, escaladas)
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const gx =
        Math.floor(ruido(variante, 0, 3.3) * (TAM_TEX - 4 * ESCALA)) + Math.round(2 * ESCALA);
    const gy =
        Math.floor(ruido(variante, 1, 5.5) * (TAM_TEX - 6 * ESCALA)) + Math.round(3 * ESCALA);
    const largo = Math.round((3 + Math.floor(ruido(variante, 2, 7.7) * 5)) * ESCALA);
    for (let i = 0; i < largo; i++) {
        ctx.fillRect(gx + i, gy + Math.floor(ruido(i, variante, 1.1) * 2 * ESCALA), 1, 1);
    }

    // Highlight superior (borde iluminado)
    const bh = Math.round(2 * ESCALA);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, 0, TAM_TEX, bh);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, bh, TAM_TEX, Math.round(ESCALA));

    return canvas;
}

function generarPlataforma(variante) {
    const { canvas, ctx } = crearCanvasTex();
    const seed = variante * 13.7 + 50;
    const grosor = Math.round(5 * ESCALA);

    // Superficie de roca
    ctx.fillStyle = '#4a4a8e';
    ctx.fillRect(0, 0, TAM_TEX, grosor);

    // Ruido en la superficie (via ImageData)
    aplicarRuido(ctx, seed, 0.12);

    // Highlight superior brillante
    ctx.fillStyle = 'rgba(180,180,255,0.25)';
    ctx.fillRect(0, 0, TAM_TEX, Math.round(ESCALA));
    ctx.fillStyle = 'rgba(140,140,220,0.15)';
    ctx.fillRect(0, Math.round(ESCALA), TAM_TEX, Math.round(ESCALA));

    // Borde inferior difuminado
    ctx.fillStyle = 'rgba(60,60,120,0.3)';
    ctx.fillRect(0, grosor - Math.round(ESCALA), TAM_TEX, Math.round(ESCALA));

    return canvas;
}

function generarFuego(frame) {
    const { canvas, ctx } = crearCanvasTex();
    const seed = frame * 17.1;

    ctx.fillStyle = '#120005';
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    const grad = ctx.createLinearGradient(0, TAM_TEX, 0, 0);
    grad.addColorStop(0, 'rgba(200,60,10,0.7)');
    grad.addColorStop(0.5, 'rgba(160,30,5,0.3)');
    grad.addColorStop(1, 'rgba(60,5,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    generarColumnas(ctx, seed, {
        alturaBase: 3,
        margenSuperior: 4,
        umbral: 0.3,
        colorear: colorearFuego,
        alphaFn: function (t, n) {
            return (0.5 + n * 0.4) * (1 - t * 0.3);
        },
    });

    // Brasas brillantes
    for (let i = 0; i < 6; i++) {
        const bx = Math.floor(ruido(i, frame, 99.1) * TAM_TEX);
        const by =
            TAM_TEX - Math.round(2 * ESCALA) - Math.floor(ruido(i, frame, 77.3) * TAM_TEX * 0.6);
        const br = Math.round(ESCALA * (0.5 + ruido(i, frame, 55.5) * 0.5));
        ctx.fillStyle = 'rgba(255,240,100,0.6)';
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

function generarCristales(frame) {
    const { canvas, ctx } = crearCanvasTex();
    const seed = frame * 23.7;

    ctx.fillStyle = '#08001a';
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    const grad = ctx.createLinearGradient(0, TAM_TEX, 0, 0);
    grad.addColorStop(0, 'rgba(100,30,160,0.5)');
    grad.addColorStop(0.5, 'rgba(60,15,100,0.2)');
    grad.addColorStop(1, 'rgba(20,5,40,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    generarColumnas(ctx, seed, {
        alturaBase: 2,
        margenSuperior: 3,
        umbral: 0.25,
        colorear: colorearCristales,
        alphaFn: function (t, n) {
            return (0.4 + n * 0.4) * (1 - t * 0.2);
        },
    });

    // Destellos en las puntas
    for (let i = 0; i < 5; i++) {
        const dx = Math.floor(ruido(i, frame, 33.3) * TAM_TEX);
        const dy = Math.floor(ruido(i, frame, 44.4) * TAM_TEX * 0.5);
        const dr = Math.round(ESCALA * (0.3 + ruido(i, frame, 66.6) * 0.4));
        ctx.fillStyle = 'rgba(220,180,255,0.5)';
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
    }

    return canvas;
}

function generarPantano(frame) {
    const { canvas, ctx } = crearCanvasTex();
    const seed = frame * 19.3;

    ctx.fillStyle = '#020a02';
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    const grad = ctx.createLinearGradient(0, 0, 0, TAM_TEX);
    grad.addColorStop(0, 'rgba(20,80,10,0.5)');
    grad.addColorStop(0.5, 'rgba(30,60,10,0.35)');
    grad.addColorStop(1, 'rgba(10,40,5,0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TAM_TEX, TAM_TEX);

    // Textura ondulante del limo
    for (let py = 0; py < TAM_TEX; py++) {
        for (let px = 0; px < TAM_TEX; px++) {
            const n = ruido(px, py, seed);
            if (n < 0.35) continue;
            const r = 10 + Math.floor(n * 25);
            const g = 50 + Math.floor(n * 90);
            const b = 5 + Math.floor(n * 15);
            const alpha = 0.25 + n * 0.3;
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(2) + ')';
            ctx.fillRect(px, py, 1, 1);
        }
    }

    // Burbujas toxicas
    const numBurbujas = Math.round(4 * ESCALA);
    for (let i = 0; i < numBurbujas; i++) {
        const bx =
            Math.floor(ruido(i, 0, seed) * (TAM_TEX - Math.round(2 * ESCALA))) + Math.round(ESCALA);
        const by =
            Math.floor(ruido(i, 1, seed) * (TAM_TEX - Math.round(3 * ESCALA))) + Math.round(ESCALA);
        const br = Math.round(ESCALA * (0.5 + (ruido(i, 2, seed) > 0.5 ? 0.5 : 0)));
        ctx.fillStyle = 'rgba(60,180,30,0.5)';
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,255,60,0.6)';
        ctx.fillRect(bx, by, 1, 1);
    }

    return canvas;
}

// --- API publica ---

export function iniciarTexturas() {
    texturas = {
        SUELO: [],
        PLATAFORMA: [],
        FUEGO: [],
        CRISTALES: [],
        PANTANO: [],
    };

    for (let v = 0; v < VARIANTES; v++) {
        texturas.SUELO.push(generarSuelo(v));
        texturas.PLATAFORMA.push(generarPlataforma(v));
        texturas.FUEGO.push(generarFuego(v));
        texturas.CRISTALES.push(generarCristales(v));
        texturas.PANTANO.push(generarPantano(v));
    }
}

export function obtenerTextura(tipo, variante) {
    if (!texturas) return null;
    const lista = texturas[tipo];
    if (!lista) return null;
    return lista[variante % VARIANTES];
}

export function limpiarTexturas() {
    texturas = null;
}
