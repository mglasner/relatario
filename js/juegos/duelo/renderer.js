// El Duelo — Renderizado del canvas
// Arena plana, luchadores con sprites, efectos de pantallas VS/countdown/resultado

import { CFG } from './config.js';
import { obtenerSprite } from './spritesDuelo.js';
import { ESTACIONES } from '../clima.js';
import { renderizarGradas } from './gradas.js';
import { hexARgb } from './utilsDuelo.js';

const RND = CFG.render;
const ARENA = CFG.arena;
const MEC = CFG.mecanicas;

// --- Paletas de fondo por estación (día vs noche) ---

const PALETA_NOCHE = {
    cieloTop: RND.colorFondo,
    cieloMid: '#1a0d2a',
    cieloBot: RND.colorSuelo,
    suelo: RND.colorSuelo,
    borde: RND.colorArenaClaro || '#3d2560',
};

const PALETA_PRIMAVERA = {
    cieloTop: '#4a9ed4',
    cieloMid: '#7ec8e8',
    cieloBot: '#c8b890',
    suelo: '#8b7355',
    borde: '#a08060',
};

const PALETA_VERANO = {
    cieloTop: '#1a5fa8',
    cieloMid: '#3a8fd4',
    cieloBot: '#c8a040',
    suelo: '#9a7a40',
    borde: '#b89050',
};

function obtenerPaleta(estacion) {
    if (estacion === 'primavera') return PALETA_PRIMAVERA;
    if (estacion === 'verano') return PALETA_VERANO;
    return PALETA_NOCHE;
}

// --- Estado de clima del renderer ---

let relampagueoFrames = 0;
let contadorRelampago = 280 + Math.floor(Math.random() * 140);
let frameClimaRenderer = 0;

/**
 * Resetea contadores internos de clima del renderer
 */
export function reiniciarClimaRenderer() {
    relampagueoFrames = 0;
    contadorRelampago = 280 + Math.floor(Math.random() * 140);
    frameClimaRenderer = 0;
}

// --- Aura radial detrás de cada luchador ---

function renderizarAura(ctx, l) {
    const cx = l.x + l.ancho / 2;
    const cy = l.y + l.alto * 0.5;
    const pulso = 1 + 0.15 * Math.sin(Date.now() * 0.004);
    const radio = l.alto * 0.6 * pulso;
    const { r, g, b } = hexARgb(l.colorHud);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
    grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.15)');
    grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.fill();
}

// --- Efecto visual del arco de ataque ---

function renderizarAtaque(ctx, l) {
    if (l.estado !== 'atacando' || !l.tipoAtaque) return;
    const duracion =
        l.tipoAtaque === 'rapido'
            ? CFG.combate.ataqueRapidoDuracion
            : CFG.combate.ataqueFuerteDuracion;
    const progreso = 1 - l.ataqueTimer / duracion;
    if (progreso < 0.2 || progreso > 0.8) return;

    const radio = l.tipoAtaque === 'rapido' ? 20 : 28;
    const alpha = 0.25 * (1 - progreso);
    const { r, g, b } = hexARgb(l.colorHud);

    // Centro del arco: frente al luchador (ya está flippeado por el ctx)
    const ax = l.x + l.ancho;
    const ay = l.y + l.alto * 0.4;

    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    ctx.beginPath();
    ctx.arc(ax, ay, radio, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
}

// --- Flash de pantalla al golpear ---

function renderizarFlash(ctx, ancho, alto, flashAlpha) {
    if (flashAlpha <= 0.01) return;
    ctx.fillStyle = 'rgba(255,255,255,' + flashAlpha + ')';
    ctx.fillRect(0, 0, ancho, alto);
}

// --- Fondo y arena ---

function renderizarArena(ctx, ancho, alto, estacion) {
    const pal = obtenerPaleta(estacion);

    // Fondo degradado (cielo)
    const grad = ctx.createLinearGradient(0, 0, 0, alto);
    grad.addColorStop(0, pal.cieloTop);
    grad.addColorStop(0.7, pal.cieloMid);
    grad.addColorStop(1, pal.cieloBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ancho, alto);

    // Gradas con espectadores (detrás del suelo)
    renderizarGradas(ctx, ancho, estacion);

    // Suelo
    ctx.fillStyle = pal.suelo;
    ctx.fillRect(0, ARENA.sueloY, ancho, alto - ARENA.sueloY);

    // Tinte sutil de estación sobre el suelo
    if (estacion) {
        const [r, g, b] = ESTACIONES[estacion].tinte;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.12)';
        ctx.fillRect(0, ARENA.sueloY, ancho, alto - ARENA.sueloY);
    }

    // Línea de borde superior del suelo
    ctx.fillStyle = pal.borde;
    ctx.fillRect(0, ARENA.sueloY, ancho, 2);

    // Marcas decorativas del suelo
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = ARENA.limiteIzq; x < ARENA.limiteDer; x += 40) {
        ctx.fillRect(x, ARENA.sueloY + 8, 20, 1);
    }
}

// --- Escudo de bloqueo ---

function renderizarEscudo(ctx, l) {
    const rx = l.alto * 0.22; // estrecho: pasa cerca del cuerpo
    const ry = l.alto * 0.5; // alto: cubre bien verticalmente
    // Frente del luchador (tras el flip del ctx, siempre queda hacia el rival)
    const ex = l.x + l.ancho;
    const ey = l.y + l.alto * 0.5;
    const pulso = 0.7 + 0.3 * Math.sin(Date.now() * 0.008);
    const color = l.colorHud || '#5eeadb';

    ctx.save();
    ctx.globalAlpha = pulso;

    // Relleno con gradiente radial (elíptico via escala)
    const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, ry);
    grad.addColorStop(0, color + '2E'); // alpha ~0.18
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Borde
    ctx.strokeStyle = color + '66'; // alpha ~0.4
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(ex, ey, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    ctx.restore();
}

// --- Indicadores de mecánicas de habilidad ---

function renderizarComboCounter(ctx, l) {
    if (l.comboCount < 2) return;
    const cx = l.x + l.ancho / 2;
    const tamFuente = Math.min(10 + l.comboCount, 18);
    ctx.save();
    ctx.font = 'bold ' + tamFuente + 'px sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.9;
    ctx.fillText('x' + l.comboCount, cx, l.y - 8);
    ctx.restore();
}

function renderizarBarraGuardia(ctx, l) {
    if (l.guardiaHP >= MEC.guardiaMax) return;
    const ancho = l.ancho + 4;
    const alto = 2;
    const x = l.x - 2;
    const y = l.y - 5;
    const ratio = l.guardiaHP / MEC.guardiaMax;

    // Fondo oscuro
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x, y, ancho, alto);

    // Barra de guardia (verde → rojo)
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(200 * ratio);
    ctx.fillStyle = 'rgb(' + r + ',' + g + ',40)';
    ctx.fillRect(x, y, ancho * ratio, alto);
}

function renderizarBoostGlow(ctx, l) {
    if (l.boostTimer <= 0) return;
    const cx = l.x + l.ancho / 2;
    const cy = l.y + l.alto * 0.5;
    const pulso = 1 + 0.2 * Math.sin(Date.now() * 0.008);
    const radio = l.alto * 0.55 * pulso;
    const alpha = 0.18 * Math.min(1, l.boostTimer / 30);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
    grad.addColorStop(0, 'rgba(255,215,0,' + alpha + ')');
    grad.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radio, 0, Math.PI * 2);
    ctx.fill();
}

// --- Luchador ---

function renderizarLuchador(ctx, l) {
    const sprite = obtenerSprite(l);

    // Aura radial siempre visible (detrás del sprite)
    renderizarAura(ctx, l);

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
        if (l.bloqueando) renderizarEscudo(ctx, l);
        renderizarAtaque(ctx, l);
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
        if (l.bloqueando) renderizarEscudo(ctx, l);
        renderizarAtaque(ctx, l);
    }

    ctx.restore();

    // Sombra en el suelo
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    const sombra = l.ancho * 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, ARENA.sueloY + 2, sombra / 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Indicadores de mecánicas (sin flip, posición absoluta)
    renderizarBoostGlow(ctx, l);
    renderizarComboCounter(ctx, l);
    renderizarBarraGuardia(ctx, l);
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

// --- Efecto clima overlay ---

/**
 * Renderiza tinte ambiental y efecto especial de la estación activa.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string|null} estacion
 * @param {number} ancho
 * @param {number} alto
 */
export function renderizarEfectoClima(ctx, estacion, ancho, alto) {
    if (!estacion) return;
    frameClimaRenderer++;

    const [r, g, b, a] = ESTACIONES[estacion].tinte;

    // Tinte ambiental sutil
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
    ctx.fillRect(0, 0, ancho, alto);

    if (estacion === 'invierno') {
        // Relámpago púrpura-blanco cada 280-420 frames
        contadorRelampago--;
        if (contadorRelampago <= 0) {
            relampagueoFrames = 12;
            contadorRelampago = 280 + Math.floor(Math.random() * 140);
        }
        if (relampagueoFrames > 0) {
            const flashAlpha = relampagueoFrames > 9 ? 0.7 : (relampagueoFrames / 9) * 0.7;
            ctx.fillStyle = 'rgba(200,170,255,' + flashAlpha.toFixed(2) + ')';
            ctx.fillRect(0, 0, ancho, alto);
            relampagueoFrames--;
        }
    } else if (estacion === 'primavera') {
        // Sol suave esquina superior derecha
        const cx = ancho * 0.88;
        const radSol = 55 + Math.sin(frameClimaRenderer * 0.02) * 5;
        const gradSol = ctx.createRadialGradient(cx, 0, 0, cx, 0, radSol);
        gradSol.addColorStop(0, 'rgba(255,240,150,0.18)');
        gradSol.addColorStop(0.6, 'rgba(255,240,150,0.05)');
        gradSol.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = gradSol;
        ctx.fillRect(cx - radSol, 0, radSol * 2, radSol);
    } else if (estacion === 'verano') {
        // Sol intenso esquina superior izquierda (ciclo 4s)
        const ciclo = (Math.sin(frameClimaRenderer * (Math.PI / 120)) + 1) / 2;
        const radioSol = 70 + ciclo * 40;
        const cx = ancho * 0.15;
        const gradSol = ctx.createRadialGradient(cx, 0, 0, cx, 0, radioSol);
        gradSol.addColorStop(0, 'rgba(255,200,50,0.22)');
        gradSol.addColorStop(0.5, 'rgba(220,140,20,0.08)');
        gradSol.addColorStop(1, 'rgba(220,100,10,0)');
        ctx.fillStyle = gradSol;
        ctx.fillRect(0, 0, radioSol * 2, radioSol * 1.5);
    } else if (estacion === 'otono') {
        // Líneas horizontales de viento ocasionales
        if (Math.random() < 0.04) {
            ctx.strokeStyle = 'rgba(200,160,80,0.08)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const wy = Math.random() * alto;
                const wx = Math.random() * ancho * 0.6;
                const ww = 20 + Math.random() * 35;
                ctx.beginPath();
                ctx.moveTo(wx, wy);
                ctx.lineTo(wx + ww, wy);
                ctx.stroke();
            }
        }
    }
}

// --- Escena completa ---

export function renderizarEscena(ctx, ancho, alto, est) {
    // Limpiar
    ctx.clearRect(0, 0, ancho, alto);

    // Arena (con tinte de estación)
    renderizarArena(ctx, ancho, alto, est.estacion);

    // Luchadores
    if (est.luchador1) renderizarLuchador(ctx, est.luchador1);
    if (est.luchador2) renderizarLuchador(ctx, est.luchador2);

    // Flash de impacto
    if (est.flashAlpha > 0) {
        renderizarFlash(ctx, ancho, alto, est.flashAlpha);
    }

    // Overlay de clima (después de flash, antes de overlays de fase)
    renderizarEfectoClima(ctx, est.estacion, ancho, alto);

    // Overlays según fase
    if (est.fase === 'countdown') {
        renderizarCountdown(ctx, ancho, alto, est.faseTimer);
    } else if (est.fase === 'resultado') {
        renderizarResultado(ctx, ancho, alto, est);
    }
}
