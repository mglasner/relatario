// Habitacion 4 — El Abismo: Renderizado con texturas, parallax, vineta y HUD mejorado

import { CFG } from './config.js';
import { obtenerTile, obtenerFilas, obtenerColumnas } from './nivel.js';
import { obtenerTextura, hashVariante, TAM_TEX } from './texturasTiles.js';

const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;
const COL = CFG.render;

// Variantes visuales de abismo: cada grupo contiguo elige una al azar (seeded)
const TIPOS_ABISMO = ['FUEGO', 'CRISTALES', 'PANTANO'];
const GLOW_ABISMO = { FUEGO: '255,100,20', CRISTALES: '180,80,255', PANTANO: '80,200,40' };
const ANIM_ABISMO = { FUEGO: 100, CRISTALES: 250, PANTANO: 150 };
const FALLBACK_ABISMO = { FUEGO: '#c03c0a', CRISTALES: '#4a0080', PANTANO: '#0a4010' };

// Determina la variante por grupo: busca la columna izquierda del hueco
export function tipoAbismo(fila, col) {
    let g = col;
    while (g > 0 && obtenerTile(fila, g - 1) === T.ABISMO) g--;
    const n = Math.sin(g * 127.1 + 311.7) * 43758.5453;
    return TIPOS_ABISMO[Math.floor((n - Math.floor(n)) * 3)];
}

// Vineta: offscreen canvas generado una vez
let vinetaCanvas = null;

function generarVineta(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = alto;
    const ctx = c.getContext('2d');

    const grad = ctx.createRadialGradient(
        ancho / 2,
        alto / 2,
        Math.min(ancho, alto) * 0.35,
        ancho / 2,
        alto / 2,
        Math.max(ancho, alto) * 0.7
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ancho, alto);
    return c;
}

export function iniciarRenderer(ancho, alto) {
    vinetaCanvas = generarVineta(ancho, alto);
}

// --- Helpers de renderizado ---

// Dibuja un tile con textura escalada o color fallback
function dibujarTile(ctx, tipo, colorFallback, fila, col, px, py) {
    const variante = hashVariante(fila, col);
    const tex = obtenerTextura(tipo, variante);
    if (tex) {
        ctx.drawImage(tex, 0, 0, TAM_TEX, TAM_TEX, px, py, TAM, TAM);
    } else {
        ctx.fillStyle = colorFallback;
        ctx.fillRect(px, py, TAM, TAM);
    }
}

// Renderiza un tile de abismo con su variante, textura animada y glow
function renderizarTileAbismo(ctx, fila, col, px, py, tiempo) {
    const va = tipoAbismo(fila, col);
    const animFrame = Math.floor(tiempo / ANIM_ABISMO[va]) + hashVariante(fila, col);
    const tex = obtenerTextura(va, animFrame);
    if (tex) {
        ctx.drawImage(tex, 0, 0, TAM_TEX, TAM_TEX, px, py, TAM, TAM);
    } else {
        ctx.fillStyle = FALLBACK_ABISMO[va];
        ctx.fillRect(px, py, TAM, TAM);
    }

    // Resplandor hacia arriba (solo desde la primera fila de abismo)
    if (obtenerTile(fila - 1, col) !== T.ABISMO) {
        const glow = GLOW_ABISMO[va];
        const pulso = 0.2 + Math.sin(tiempo * 0.005 + col) * 0.06;
        const glowGrad = ctx.createLinearGradient(px, py, px, py - TAM * 2);
        glowGrad.addColorStop(0, 'rgba(' + glow + ',' + pulso.toFixed(2) + ')');
        glowGrad.addColorStop(0.5, 'rgba(' + glow + ',' + (pulso * 0.3).toFixed(2) + ')');
        glowGrad.addColorStop(1, 'rgba(' + glow + ',0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(px, py - TAM * 2, TAM, TAM * 2);
    }
}

// Dibuja una flecha triangular
function dibujarFlecha(ctx, x1, y1, x2, y2, x3, y3) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
}

// --- Funciones publicas ---

export function renderizarTiles(ctx, camaraX, anchoCanvas, bossVivo, tiempo) {
    const filas = obtenerFilas();
    const cols = obtenerColumnas();

    const colInicio = Math.max(0, Math.floor(camaraX / TAM));
    const colFin = Math.min(cols, Math.ceil((camaraX + anchoCanvas) / TAM));

    for (let fila = 0; fila < filas; fila++) {
        for (let col = colInicio; col < colFin; col++) {
            const tipo = obtenerTile(fila, col);
            const px = col * TAM - camaraX;
            const py = fila * TAM;

            if (tipo === T.SUELO) {
                dibujarTile(ctx, 'SUELO', COL.colorSuelo, fila, col, px, py);
            } else if (tipo === T.PLATAFORMA) {
                dibujarTile(ctx, 'PLATAFORMA', COL.colorPlataforma, fila, col, px, py);
            } else if (tipo === T.ABISMO) {
                renderizarTileAbismo(ctx, fila, col, px, py, tiempo);
            } else if (tipo === T.META && !bossVivo) {
                renderizarPortalMeta(ctx, px, py, tiempo);
            }
        }
    }
}

// Portal META animado: glow verde, vortice giratorio y cofre central
function renderizarPortalMeta(ctx, px, py, tiempo) {
    const cx = px + TAM / 2;
    const cy = py + TAM / 2;
    const t = tiempo * 0.004;

    // Glow exterior
    const glowRadius = TAM * 0.8;
    const glowAlpha = 0.15 + Math.sin(t) * 0.08;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
    grad.addColorStop(0, 'rgba(107,252,134,' + glowAlpha.toFixed(2) + ')');
    grad.addColorStop(0.6, 'rgba(107,252,134,' + (glowAlpha * 0.4).toFixed(2) + ')');
    grad.addColorStop(1, 'rgba(107,252,134,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

    // Vortice: anillos concentricos rotando
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
        const radio = 3 + i * 2;
        const angulo = t * (2 - i * 0.5) + i * 2.1;
        const alpha = 0.3 - i * 0.08;
        ctx.strokeStyle = 'rgba(107,252,134,' + alpha.toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, radio, angulo, angulo + Math.PI * 1.2);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();

    // Cofre en el centro (pixel art 10×8 centrado)
    const ox = Math.round(cx - 5);
    const oy = Math.round(cy - 4);

    ctx.fillStyle = '#8b5e3c';
    ctx.fillRect(ox, oy + 3, 10, 5);

    ctx.fillStyle = '#c08050';
    ctx.fillRect(ox + 2, oy, 6, 1);
    ctx.fillRect(ox + 1, oy + 1, 8, 3);

    ctx.fillStyle = '#ffd700';
    ctx.fillRect(ox + 4, oy + 3, 2, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(ox + 2, oy + 1, 2, 1);
}

export function renderizarVineta(ctx) {
    if (vinetaCanvas) {
        ctx.drawImage(vinetaCanvas, 0, 0);
    }
}

export function renderizarFlash(ctx, anchoCanvas, altoCanvas, flashAlpha) {
    if (flashAlpha > 0.01) {
        ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha.toFixed(2) + ')';
        ctx.fillRect(0, 0, anchoCanvas, altoCanvas);
    }
}

// Indicador de direccion del boss fuera de pantalla
export function renderizarIndicadorBoss(
    ctx,
    bossX,
    bossAncho,
    camaraX,
    anchoCanvas,
    altoCanvas,
    tiempo
) {
    const screenX = bossX - camaraX;
    const centroY = altoCanvas / 2;

    let esIzquierda;
    if (screenX + bossAncho < 0) {
        esIzquierda = true;
    } else if (screenX > anchoCanvas) {
        esIzquierda = false;
    } else {
        return;
    }

    const pulso = 0.6 + Math.sin(tiempo * 0.008) * 0.3;
    ctx.fillStyle = 'rgba(187,134,252,' + pulso.toFixed(2) + ')';

    if (esIzquierda) {
        dibujarFlecha(ctx, 8, centroY - 5, 2, centroY, 8, centroY + 5);
    } else {
        dibujarFlecha(
            ctx,
            anchoCanvas - 8,
            centroY - 5,
            anchoCanvas - 2,
            centroY,
            anchoCanvas - 8,
            centroY + 5
        );
    }
}

export function limpiarRenderer() {
    vinetaCanvas = null;
}
