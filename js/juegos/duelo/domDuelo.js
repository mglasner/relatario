// El Duelo: Creación del DOM (pantalla, canvas, HUD dual, botones ataque móvil)

import { CFG } from './config.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearElemento } from '../../utils.js';

// Referencias DOM
let canvasRef = null;
let canvasDPR = 1;
let hudJugadorBarra = null;
let hudEnemigoBarra = null;
let hudJugadorNombre = null;
let hudEnemigoNombre = null;
let hudTimer = null;
let botonesAtaque = null;

function calcularEscala(canvas) {
    const rect = canvas.getBoundingClientRect();
    const esFullscreen = !!document.fullscreenElement;
    const margenAncho = esFullscreen ? 14 : 26;
    const margenAbajo = esFullscreen ? 4 : 16;

    const disponibleAncho = window.innerWidth - margenAncho;
    const disponibleAlto = window.innerHeight - rect.top - margenAbajo;

    const escalaX = disponibleAncho / CFG.canvas.anchoBase;
    const escalaY = disponibleAlto / CFG.canvas.altoBase;

    return Math.max(1, Math.min(escalaX, escalaY));
}

function calcularDPR(escala) {
    const escalaFisica = escala * (window.devicePixelRatio || 1);
    return Math.min(4, Math.max(2, Math.ceil(escalaFisica)));
}

export function crearPantalla(esTouch, onHuir) {
    const anchoCanvas = CFG.canvas.anchoBase;
    const altoCanvas = CFG.canvas.altoBase;

    const { pantalla } = crearPantallaJuego(
        'pantalla-duelo',
        'juego-duelo',
        CFG.meta.titulo,
        onHuir
    );

    // Wrapper para canvas + HUD
    const wrapper = document.createElement('div');
    wrapper.className = 'duelo-wrapper';

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-duelo';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'El Duelo — Juego de peleas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        pantalla.appendChild(crearElemento('p', null, 'Tu navegador no soporta canvas 2D.'));
        return { pantalla, canvas, ctx: null };
    }
    ctx.imageSmoothingEnabled = false;

    // HUD dual: barras de vida + timer
    const hud = document.createElement('div');
    hud.className = 'duelo-hud';

    // Barra jugador (izquierda)
    const hudIzq = document.createElement('div');
    hudIzq.className = 'duelo-hud-lado duelo-hud-izq';
    hudJugadorNombre = crearElemento('span', 'duelo-hud-nombre', '');
    const barraFondoJ = crearElemento('div', 'duelo-barra-fondo');
    hudJugadorBarra = crearElemento('div', 'duelo-barra-vida duelo-barra-jugador');
    barraFondoJ.appendChild(hudJugadorBarra);
    hudIzq.appendChild(hudJugadorNombre);
    hudIzq.appendChild(barraFondoJ);

    // Timer (centro)
    hudTimer = crearElemento('span', 'duelo-hud-timer', String(CFG.combate.tiempoRonda));

    // Barra enemigo (derecha)
    const hudDer = document.createElement('div');
    hudDer.className = 'duelo-hud-lado duelo-hud-der';
    hudEnemigoNombre = crearElemento('span', 'duelo-hud-nombre', '');
    const barraFondoE = crearElemento('div', 'duelo-barra-fondo');
    hudEnemigoBarra = crearElemento('div', 'duelo-barra-vida duelo-barra-enemigo');
    barraFondoE.appendChild(hudEnemigoBarra);
    hudDer.appendChild(hudEnemigoNombre);
    hudDer.appendChild(barraFondoE);

    hud.appendChild(hudIzq);
    hud.appendChild(hudTimer);
    hud.appendChild(hudDer);

    wrapper.appendChild(canvas);
    wrapper.appendChild(hud);

    // Botones de ataque (solo mobile)
    if (esTouch) {
        botonesAtaque = document.createElement('div');
        botonesAtaque.className = 'duelo-btns-ataque';

        const btnRapido = crearElemento('button', 'duelo-btn-ataque duelo-btn-rapido', 'A');
        btnRapido.type = 'button';
        btnRapido.dataset.ataque = 'rapido';

        const btnFuerte = crearElemento('button', 'duelo-btn-ataque duelo-btn-fuerte', 'B');
        btnFuerte.type = 'button';
        btnFuerte.dataset.ataque = 'fuerte';

        botonesAtaque.appendChild(btnRapido);
        botonesAtaque.appendChild(btnFuerte);
        wrapper.appendChild(botonesAtaque);
    }

    pantalla.appendChild(wrapper);

    // Hint de controles (solo desktop)
    if (!esTouch) {
        pantalla.appendChild(
            crearElemento(
                'p',
                'laberinto-hint',
                'Flechas para mover \u00b7 A ataque rápido \u00b7 S ataque fuerte \u00b7 Esc para huir'
            )
        );
    }

    // Modo inmersivo
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.add('juego-inmersivo');
    juegoEl.appendChild(pantalla);

    canvasRef = canvas;

    const escala = calcularEscala(canvas);
    canvas.style.width = Math.floor(anchoCanvas * escala) + 'px';
    canvas.style.height = Math.floor(altoCanvas * escala) + 'px';

    canvasDPR = calcularDPR(escala);
    canvas.width = anchoCanvas * canvasDPR;
    canvas.height = altoCanvas * canvasDPR;
    ctx.imageSmoothingEnabled = false;

    return { pantalla, canvas, ctx };
}

// --- API HUD ---

export function actualizarHUDVida(jugadorVida, jugadorMax, enemigoVida, enemigoMax) {
    if (hudJugadorBarra) {
        hudJugadorBarra.style.width = Math.round((jugadorVida / jugadorMax) * 100) + '%';
    }
    if (hudEnemigoBarra) {
        hudEnemigoBarra.style.width = Math.round((enemigoVida / enemigoMax) * 100) + '%';
    }
}

export function actualizarHUDNombres(nombreJugador, nombreEnemigo) {
    if (hudJugadorNombre) hudJugadorNombre.textContent = nombreJugador;
    if (hudEnemigoNombre) hudEnemigoNombre.textContent = nombreEnemigo;
}

export function actualizarHUDTimer(segundos) {
    if (hudTimer) hudTimer.textContent = String(Math.max(0, Math.ceil(segundos)));
}

export function reescalarCanvas() {
    if (!canvasRef) return;
    const escala = calcularEscala(canvasRef);
    canvasRef.style.width = Math.floor(CFG.canvas.anchoBase * escala) + 'px';
    canvasRef.style.height = Math.floor(CFG.canvas.altoBase * escala) + 'px';

    const nuevoDPR = calcularDPR(escala);
    if (nuevoDPR !== canvasDPR) {
        canvasDPR = nuevoDPR;
        canvasRef.width = CFG.canvas.anchoBase * canvasDPR;
        canvasRef.height = CFG.canvas.altoBase * canvasDPR;
        canvasRef.getContext('2d').imageSmoothingEnabled = false;
    }
}

export function obtenerDPR() {
    return canvasDPR;
}

export function obtenerBotonesAtaque() {
    return botonesAtaque;
}

export function limpiarDOM() {
    canvasRef = null;
    canvasDPR = 1;
    hudJugadorBarra = null;
    hudEnemigoBarra = null;
    hudJugadorNombre = null;
    hudEnemigoNombre = null;
    hudTimer = null;
    botonesAtaque = null;
}
