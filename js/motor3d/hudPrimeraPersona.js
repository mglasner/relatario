// HUD de primera persona — Brazos/manos del personaje estilo Doom
// Dibuja proceduralmente sobre el canvas 3D

import { canvas } from './config.js';

// --- Estado interno ---

let _config = null;
let _fase = 0;
let _faseBob = 0;
let _flinchIntensidad = 0;

// --- Funciones internas de dibujo ---

function dibujarMano(ctx, x, y, espejo, config, escala) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(espejo, 1);

    // Brazo: trapecio redondeado con gradiente
    const anchoBrazo = 35 * escala;
    const altoBrazo = 60 * escala;
    const grad = ctx.createLinearGradient(0, 0, 0, altoBrazo);
    grad.addColorStop(0, config.colorHudClaro);
    grad.addColorStop(1, config.colorHud);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-anchoBrazo * 0.6, 0);
    ctx.lineTo(anchoBrazo * 0.6, 0);
    ctx.lineTo(anchoBrazo * 0.4, altoBrazo);
    ctx.lineTo(-anchoBrazo * 0.4, altoBrazo);
    ctx.closePath();
    ctx.fill();

    // Borde sutil del brazo
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1.5 * escala;
    ctx.stroke();

    // Mano: círculo con color piel
    const radioMano = 14 * escala;
    ctx.fillStyle = config.colorPiel;
    ctx.beginPath();
    ctx.arc(0, altoBrazo + radioMano * 0.3, radioMano, 0, Math.PI * 2);
    ctx.fill();

    // Borde de la mano
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1 * escala;
    ctx.stroke();

    ctx.restore();
}

function dibujarArma(ctx, x, y, config, escala) {
    const tamano = Math.min(canvas.alto * 0.08, 40) * escala;
    ctx.font = tamano + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emojiHud, x, y);
}

// --- API pública ---

export function inicializarHUD(jugador) {
    _config = jugador.colorHud ? jugador : null;
    _fase = 0;
    _faseBob = 0;
    _flinchIntensidad = 0;
}

export function actualizarHUD(teclas, flashDano) {
    if (!_config) return;

    // deltaTime aproximado (~16ms a 60fps)
    const dt = 0.016;

    // Idle sway (siempre activo)
    _fase += dt;

    // Walk bobbing
    const camina = teclas.ArrowUp || teclas.ArrowDown;
    if (camina) {
        _faseBob += dt * 8;
    } else {
        _faseBob *= 0.9;
    }

    // Flinch de daño
    _flinchIntensidad = flashDano > 0 ? flashDano / 6 : 0;
}

export function renderizarHUD(ctx) {
    if (!_config) return;

    const escala = canvas.alto / 400;
    const centroX = canvas.ancho / 2;
    const baseY = canvas.alto;

    // Offsets de animación
    const idleY = Math.sin(_fase * 1.5) * 3 * escala;

    const bobY = Math.sin(_faseBob) * 8 * escala;
    const bobX = Math.cos(_faseBob * 0.5) * 3 * escala;

    const flinchX = _flinchIntensidad * (Math.random() - 0.5) * 20 * escala;
    const flinchY = _flinchIntensidad * 15 * escala;

    const offsetX = bobX + flinchX;
    const offsetY = idleY + bobY + flinchY;

    // Posiciones de las manos (±18% del centro)
    const separacion = canvas.ancho * 0.18;
    const manoIzqX = centroX - separacion + offsetX;
    const manoDerX = centroX + separacion + offsetX;
    const manoY = baseY - 50 * escala + offsetY;

    // Dibujar brazos y manos
    dibujarMano(ctx, manoIzqX, manoY, 1, _config, escala);
    dibujarMano(ctx, manoDerX, manoY, -1, _config, escala);

    // Arma/objeto entre las manos
    const armaY = baseY - 35 * escala + offsetY;
    dibujarArma(ctx, centroX + offsetX, armaY, _config, escala);
}

export function limpiarHUD() {
    _config = null;
    _fase = 0;
    _faseBob = 0;
    _flinchIntensidad = 0;
}
