// Habitacion 4 — El Abismo: Creacion del DOM (pantalla, canvas, cabecera, HUD boss)

import { CFG } from './config.js';

// Referencias a overlay del boss
let hudBossContenedor = null;
let hudBossNombre = null;
let hudBossVida = null;

function calcularEscala(canvas) {
    const rect = canvas.getBoundingClientRect();
    // Descontar padding (10px x 2) + borde del canvas (3px x 2)
    const disponibleAncho = window.innerWidth - 26;
    const disponibleAlto = window.innerHeight - rect.top - 16;

    const escalaX = disponibleAncho / CFG.canvas.anchoBase;
    const escalaY = disponibleAlto / CFG.canvas.altoBase;

    return Math.max(1, Math.min(escalaX, escalaY));
}

export function crearPantalla(esTouch, onHuir) {
    const anchoCanvas = CFG.canvas.anchoBase;
    const altoCanvas = CFG.canvas.altoBase;

    const pantalla = document.createElement('div');
    pantalla.id = 'pantalla-habitacion4';
    pantalla.className = 'habitacion-4';

    // Cabecera: boton huir + titulo
    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-habitacion';

    const btnHuir = document.createElement('button');
    btnHuir.className = 'btn-huir';
    btnHuir.title = 'Huir al pasillo (Esc)';
    btnHuir.setAttribute('aria-label', 'Huir al pasillo');
    const imgHuir = document.createElement('img');
    imgHuir.src = 'assets/img/icons/btn-salir.webp';
    imgHuir.alt = '';
    imgHuir.className = 'btn-huir-icono';
    btnHuir.appendChild(imgHuir);
    btnHuir.addEventListener('click', onHuir);

    const titulo = document.createElement('h2');
    titulo.className = 'titulo-habitacion';
    titulo.textContent = CFG.meta.titulo;

    cabecera.appendChild(btnHuir);
    cabecera.appendChild(titulo);

    // Wrapper para canvas + HUD boss overlay
    const wrapper = document.createElement('div');
    wrapper.className = 'plat-wrapper';

    // Canvas (dimensiones logicas fijas)
    const canvas = document.createElement('canvas');
    canvas.id = 'canvas-platformer';
    canvas.width = anchoCanvas;
    canvas.height = altoCanvas;
    const ctx = canvas.getContext('2d');

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
    wrapper.appendChild(hudBossContenedor);

    // Hint de controles (solo desktop)
    let hint = null;
    if (!esTouch) {
        hint = document.createElement('p');
        hint.className = 'laberinto-hint';
        hint.textContent =
            'Flechas \u2190 \u2192 para mover \u00b7 \u2191 para saltar \u00b7 Esc para huir';
    }

    pantalla.appendChild(cabecera);
    pantalla.appendChild(wrapper);
    if (hint) pantalla.appendChild(hint);

    // Modo inmersivo: quitar max-width del contenedor para usar todo el viewport
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.add('juego-inmersivo');
    juegoEl.appendChild(pantalla);

    const escala = calcularEscala(canvas);
    canvas.style.width = Math.floor(anchoCanvas * escala) + 'px';
    canvas.style.height = Math.floor(altoCanvas * escala) + 'px';

    return { pantalla, canvas, ctx, escala };
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

export function limpiarDOM() {
    hudBossContenedor = null;
    hudBossNombre = null;
    hudBossVida = null;
}
