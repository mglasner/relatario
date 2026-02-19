// Habitación 4 — El Abismo: Renderizado de tiles, fondo y HUD

import { CFG } from './config.js';
import { obtenerTile, obtenerFilas, obtenerColumnas } from './nivel.js';

const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;
const COL = CFG.render;

export function renderizarFondo(ctx, anchoCanvas, altoCanvas) {
    ctx.fillStyle = COL.colorCielo;
    ctx.fillRect(0, 0, anchoCanvas, altoCanvas);
}

export function renderizarTiles(ctx, camaraX, anchoCanvas, altoCanvas, bossVivo) {
    const filas = obtenerFilas();
    const cols = obtenerColumnas();

    // Culling: solo dibujar columnas visibles
    const colInicio = Math.max(0, Math.floor(camaraX / TAM));
    const colFin = Math.min(cols, Math.ceil((camaraX + anchoCanvas) / TAM));

    for (let fila = 0; fila < filas; fila++) {
        for (let col = colInicio; col < colFin; col++) {
            const tipo = obtenerTile(fila, col);
            const px = col * TAM - camaraX;
            const py = fila * TAM;

            if (tipo === T.SUELO) {
                ctx.fillStyle = COL.colorSuelo;
                ctx.fillRect(px, py, TAM, TAM);
                // Highlight superior para profundidad
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.fillRect(px, py, TAM, 1);
            } else if (tipo === T.PLATAFORMA) {
                ctx.fillStyle = COL.colorPlataforma;
                ctx.fillRect(px, py, TAM, TAM);
                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(px, py, TAM, 1);
            } else if (tipo === T.ABISMO) {
                ctx.fillStyle = COL.colorAbismo;
                ctx.fillRect(px, py, TAM, TAM);
            } else if (tipo === T.META) {
                // META solo visible si boss derrotado
                if (!bossVivo) {
                    ctx.fillStyle = COL.colorMeta;
                    ctx.fillRect(px, py, TAM, TAM);
                    // Brillo pulsante
                    const brillo = 0.3 + Math.sin(Date.now() / 200) * 0.2;
                    ctx.fillStyle = 'rgba(107,252,134,' + brillo + ')';
                    ctx.fillRect(px, py, TAM, TAM);
                }
            }
        }
    }
}

export function renderizarHUD(ctx, anchoCanvas, bossVivo) {
    // Barra semitransparente superior
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, anchoCanvas, 16);

    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    const texto = bossVivo
        ? 'Derrota al boss y encuentra la salida'
        : '¡Boss derrotado! Busca la salida';
    ctx.fillText(texto, 4, 11);
    ctx.textAlign = 'start';
}
