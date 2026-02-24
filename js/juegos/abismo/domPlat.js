// El Abismo: Creacion del DOM (pantalla, canvas, cabecera, HUD jugador, HUD boss)

import { CFG } from './config.js';
import { crearBarraVida } from '../../componentes/barraVida.js';
import { crearInventario } from '../../componentes/inventario.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearElemento } from '../../utils.js';

// Referencias a overlay del boss
let hudBossContenedor = null;
let hudBossNombre = null;
let hudBossVida = null;
let canvasRef = null;
let canvasDPR = 1;

// Referencias al HUD in-canvas (vida jugador + inventario + boton huir)
let hudJugadorContenedor = null;
let hudJugadorVida = null;
let hudJugadorVidaAnterior = -1;
let hudJugadorInventario = null;

function calcularEscala(canvas) {
    const rect = canvas.getBoundingClientRect();
    // En fullscreen landscape el padding es minimo (4px x 2 + borde 3px x 2 = 14)
    // En modo normal es mayor (10px x 2 + borde 3px x 2 = 26)
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
    // DPR basado en escala real de display: min 2 (sprites 2x), max 4 (performance)
    const escalaFisica = escala * (window.devicePixelRatio || 1);
    return Math.min(4, Math.max(2, Math.ceil(escalaFisica)));
}

export function crearPantalla(esTouch, onHuir) {
    const anchoCanvas = CFG.canvas.anchoBase;
    const altoCanvas = CFG.canvas.altoBase;

    const { pantalla } = crearPantallaJuego(
        'pantalla-abismo',
        'juego-abismo',
        CFG.meta.titulo,
        onHuir
    );

    // Wrapper para canvas + HUD overlays
    const wrapper = document.createElement('div');
    wrapper.className = 'plat-wrapper';

    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-platformer';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'El Abismo — Juego de plataformas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        pantalla.appendChild(crearElemento('p', null, 'Tu navegador no soporta canvas 2D.'));
        return { pantalla, canvas, ctx: null, escala: 1 };
    }
    ctx.imageSmoothingEnabled = false;

    // --- HUD in-canvas: vida del jugador + boton huir (landscape mobile) ---
    hudJugadorContenedor = document.createElement('div');
    hudJugadorContenedor.className = 'plat-hud-jugador';

    // Boton huir dentro del canvas
    const btnHuirCanvas = document.createElement('button');
    btnHuirCanvas.className = 'plat-hud-huir';
    btnHuirCanvas.title = 'Volver al libro';
    btnHuirCanvas.setAttribute('aria-label', 'Volver al libro');
    const imgHuirCanvas = document.createElement('img');
    imgHuirCanvas.src = 'assets/img/icons/btn-salir.webp';
    imgHuirCanvas.alt = '';
    imgHuirCanvas.className = 'plat-hud-huir-icono';
    btnHuirCanvas.appendChild(imgHuirCanvas);
    btnHuirCanvas.addEventListener('click', onHuir);

    // Barra de vida (componente reutilizable, variante compacta)
    hudJugadorVida = crearBarraVida({ mostrarTexto: true, claseExtra: 'barra-vida-compacta' });

    // Inventario (componente reutilizable, variante compacta)
    hudJugadorInventario = crearInventario({ claseExtra: 'inventario-compacto' });

    hudJugadorContenedor.appendChild(btnHuirCanvas);
    hudJugadorContenedor.appendChild(hudJugadorVida.el);
    hudJugadorContenedor.appendChild(hudJugadorInventario.el);

    // HUD overlay: barra de boss (abajo del canvas)
    hudBossContenedor = document.createElement('div');
    hudBossContenedor.className = 'plat-hud-boss';
    hudBossContenedor.style.display = 'none';

    hudBossNombre = document.createElement('span');
    hudBossNombre.className = 'plat-boss-nombre';

    const barraFondo = document.createElement('div');
    barraFondo.className = 'plat-boss-barra-fondo';

    hudBossVida = document.createElement('div');
    hudBossVida.className = 'plat-boss-barra-vida';

    barraFondo.appendChild(hudBossVida);
    hudBossContenedor.appendChild(hudBossNombre);
    hudBossContenedor.appendChild(barraFondo);

    wrapper.appendChild(canvas);
    wrapper.appendChild(hudJugadorContenedor);
    wrapper.appendChild(hudBossContenedor);

    pantalla.appendChild(wrapper);

    // Hint de controles (solo desktop)
    if (!esTouch) {
        pantalla.appendChild(
            crearElemento(
                'p',
                'laberinto-hint',
                'Flechas \u2190 \u2192 para mover \u00b7 \u2191 para saltar \u00b7 Esc para huir'
            )
        );
    }

    // Modo inmersivo: quitar max-width del contenedor para usar todo el viewport
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
    ctx.imageSmoothingEnabled = false; // resize resetea el state del context

    return { pantalla, canvas, ctx, escala };
}

// --- API para actualizar HUD del jugador ---

export function actualizarHUDJugador(vidaActual, vidaMax) {
    if (!hudJugadorVida || vidaActual === hudJugadorVidaAnterior) return;
    hudJugadorVidaAnterior = vidaActual;
    hudJugadorVida.actualizar(vidaActual, vidaMax);
}

export function actualizarHUDInventario(inventario) {
    if (!hudJugadorInventario) return;
    hudJugadorInventario.actualizar(inventario);
}

// --- API para actualizar overlay del boss ---

export function actualizarHUDBoss(nombre, ratio) {
    if (!hudBossContenedor) return;
    hudBossContenedor.style.display = '';
    hudBossNombre.textContent = nombre;
    hudBossVida.style.width = Math.round(ratio * 100) + '%';

    if (ratio <= 0.33) {
        hudBossVida.style.backgroundColor = '#e94560';
    } else {
        hudBossVida.style.backgroundColor = '#bb86fc';
    }
}

export function ocultarHUDBoss() {
    if (hudBossContenedor) hudBossContenedor.style.display = 'none';
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

export function limpiarDOM() {
    hudBossContenedor = null;
    hudBossNombre = null;
    hudBossVida = null;
    hudJugadorContenedor = null;
    hudJugadorVida = null;
    hudJugadorVidaAnterior = -1;
    hudJugadorInventario = null;
    canvasRef = null;
    canvasDPR = 1;
}
