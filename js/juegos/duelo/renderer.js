// El Duelo — Renderizado del canvas
// Arena plana, luchadores con sprites, efectos de pantallas VS/countdown/resultado

import { CFG } from './config.js';
import { obtenerSprite } from './spritesDuelo.js';

const RND = CFG.render;
const ARENA = CFG.arena;

// --- Fondo y arena ---

function renderizarArena(ctx, ancho, alto) {
    // Fondo degradado
    const grad = ctx.createLinearGradient(0, 0, 0, alto);
    grad.addColorStop(0, RND.colorFondo);
    grad.addColorStop(0.7, '#1a0d2a');
    grad.addColorStop(1, RND.colorSuelo);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ancho, alto);

    // Suelo
    ctx.fillStyle = RND.colorSuelo;
    ctx.fillRect(0, ARENA.sueloY, ancho, alto - ARENA.sueloY);

    // Línea de borde superior del suelo
    ctx.fillStyle = RND.colorArenaClaro || '#3d2560';
    ctx.fillRect(0, ARENA.sueloY, ancho, 2);

    // Marcas decorativas del suelo
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = ARENA.limiteIzq; x < ARENA.limiteDer; x += 40) {
        ctx.fillRect(x, ARENA.sueloY + 8, 20, 1);
    }
}

// --- Luchador ---

function renderizarLuchador(ctx, l) {
    const sprite = obtenerSprite(l);

    // Parpadeo de invulnerabilidad
    if (l.invulFrames > 0 && Math.floor(l.invulFrames) % 4 < 2) return;

    ctx.save();

    // Centro del luchador para voltear según dirección
    const cx = l.x + l.ancho / 2;
    const cy = l.y + l.alto;

    if (sprite) {
        // Renderizar sprite sheet
        const sw = l.spriteW;
        const sh = l.spriteH;
        const dx = cx - sw / 2;
        const dy = cy - sh;

        ctx.translate(cx, 0);
        ctx.scale(l.direccion, 1);
        ctx.translate(-cx, 0);
        ctx.drawImage(sprite, dx, dy, sw, sh);
    } else {
        // Fallback procedural: rectángulo coloreado
        const color = l.colorHud || (l.esVillano ? '#e94560' : '#5eeadb');
        ctx.translate(cx, 0);
        ctx.scale(l.direccion, 1);
        ctx.translate(-cx, 0);

        // Cuerpo
        ctx.fillStyle = color;
        ctx.fillRect(l.x, l.y, l.ancho, l.alto);

        // Ojos
        const ojoY = l.y + l.alto * 0.25;
        const ojoIzq = l.x + l.ancho * 0.3;
        const ojoDer = l.x + l.ancho * 0.6;
        ctx.fillStyle = '#fff';
        ctx.fillRect(ojoIzq, ojoY, 3, 3);
        ctx.fillRect(ojoDer, ojoY, 3, 3);
        ctx.fillStyle = '#111';
        ctx.fillRect(ojoIzq + 1, ojoY + 1, 1, 1);
        ctx.fillRect(ojoDer + 1, ojoY + 1, 1, 1);

        // Indicador de estado
        if (l.estado === 'atacando') {
            // Brazo de ataque
            const brazoX = l.direccion > 0 ? l.x + l.ancho : l.x - 8;
            ctx.fillStyle = color;
            ctx.fillRect(brazoX, l.y + l.alto * 0.3, 8, 4);
        }
        if (l.estado === 'bloquear') {
            // Escudo sencillo
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 2;
            const shieldX = l.direccion > 0 ? l.x - 4 : l.x + l.ancho + 2;
            ctx.strokeRect(shieldX, l.y + 4, 4, l.alto - 8);
        }
    }

    ctx.restore();

    // Sombra en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const sombra = l.ancho * 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, ARENA.sueloY + 2, sombra / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

// --- Pantalla VS ---

function renderizarVS(ctx, ancho, alto, est) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, ancho, alto);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Nombre jugador (izquierda)
    ctx.fillStyle = est.luchador1.colorHud || '#5eeadb';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(est.luchador1.nombre, ancho * 0.25, alto * 0.45);

    // VS
    ctx.fillStyle = '#f0e6d3';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(CFG.textos.vs, ancho / 2, alto / 2);

    // Nombre enemigo (derecha)
    ctx.fillStyle = est.luchador2.colorHud || '#e94560';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(est.luchador2.nombre, ancho * 0.75, alto * 0.45);
}

// --- Countdown ---

function renderizarCountdown(ctx, ancho, alto, timer) {
    const segundos = Math.ceil(timer / 60);
    const texto = segundos > 0 ? String(segundos) : CFG.textos.pelea;

    // Pulso de escala
    const progreso = (timer % 60) / 60;
    const escala = 1 + progreso * 0.3;

    ctx.save();
    ctx.translate(ancho / 2, alto / 2);
    ctx.scale(escala, escala);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0e6d3';
    ctx.font = 'bold 48px sans-serif';
    ctx.globalAlpha = 0.5 + progreso * 0.5;
    ctx.fillText(texto, 0, 0);
    ctx.restore();
}

// --- Resultado ---

function renderizarResultado(ctx, ancho, alto, est) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, ancho, alto);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px sans-serif';

    let texto;
    let color;
    if (est.ganador === 'jugador') {
        texto = CFG.textos.victoria;
        color = est.luchador1.colorHud || '#5eeadb';
    } else if (est.ganador === 'enemigo') {
        texto = CFG.textos.derrota;
        color = '#e94560';
    } else {
        texto = CFG.textos.tiempoAgotado;
        color = '#f0e6d3';
    }

    ctx.fillStyle = color;
    ctx.fillText(texto, ancho / 2, alto / 2 - 10);

    // Subtexto con nombre del ganador
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#f0e6d3';
    ctx.globalAlpha = 0.7;
    if (est.ganador === 'jugador') {
        ctx.fillText(est.luchador1.nombre + ' gana', ancho / 2, alto / 2 + 20);
    } else if (est.ganador === 'enemigo') {
        ctx.fillText(est.luchador2.nombre + ' gana', ancho / 2, alto / 2 + 20);
    } else {
        ctx.fillText('Empate', ancho / 2, alto / 2 + 20);
    }
    ctx.restore();
}

// --- Escena completa ---

export function renderizarEscena(ctx, ancho, alto, est) {
    // Limpiar
    ctx.clearRect(0, 0, ancho, alto);

    // Arena y luchadores siempre visibles
    renderizarArena(ctx, ancho, alto);

    if (est.luchador1) renderizarLuchador(ctx, est.luchador1);
    if (est.luchador2) renderizarLuchador(ctx, est.luchador2);

    // Overlays según fase
    if (est.fase === 'vs') {
        renderizarVS(ctx, ancho, alto, est);
    } else if (est.fase === 'countdown') {
        renderizarCountdown(ctx, ancho, alto, est.faseTimer);
    } else if (est.fase === 'resultado') {
        renderizarResultado(ctx, ancho, alto, est);
    }
}
