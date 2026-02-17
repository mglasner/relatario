// Habitación 2 — El Laberinto 3D
// Vista pseudo-3D con raycasting estilo Doom
// El jugador debe encontrar la llave y volver a la salida

import { generarMapa, encontrarPuntoLejano } from '../laberinto.js';
import { lanzarToast } from '../componentes/toast.js';
import { FOV, canvas, calcularDimensiones, COLORES } from '../motor3d/config.js';
import { moverJugador } from '../motor3d/colisiones.js';
import { crearMinimapBase, renderizarMinimapa } from '../motor3d/minimapa.js';
import { renderizarSprites } from '../motor3d/sprites.js';
import { generarTexturas } from '../motor3d/texturas.js';
import { renderizar3D } from '../motor3d/raycaster.js';
import {
    generarDecoraciones,
    actualizarDecoraciones,
    obtenerSpritesDecoraciones,
} from '../motor3d/decoraciones.js';
import {
    inicializarEmisores,
    actualizarParticulas,
    renderizarParticulas,
    limpiarParticulas,
} from '../motor3d/particulas.js';
import { precalcularMapaLuz } from '../motor3d/iluminacion.js';

// --- Constantes del laberinto ---

const FILAS = 13;
const COLS = 13;
const ATAJOS = 6;

// --- Estado del módulo ---

let mapa = null;
let llaveFila = 0;
let llaveCol = 0;
let entradaFila = 0;
let entradaCol = 0;

let jugador = null;
let callbackSalir = null;
const estado = { x: 0, y: 0, angulo: 0 };
let tieneLlave = false;
let animacionId = null;
let activo = false;
const teclas = {};

// Referencias DOM
let pantalla = null;
let canvas3D = null;
let ctx3D = null;
let canvasMini = null;
let ctxMini = null;
let minimapBase = null;
let gradCielo = null;
let gradSuelo = null;
let avatarImg = null;
let indicador = null;
let mensajeExito = null;

// Motor 3D
let texturas = null;
let decoraciones = null;
let mapaLuz = null;
let frameCount = 0;
let usarTexturas = true;
let ultimoFrame = 0;
let framesLentos = 0;

// Pool de sprites preallocado para el loop (llave + puerta + ~30 decoraciones)
const MAX_SPRITES_LOOP = 35;
const _sprites = Array.from({ length: MAX_SPRITES_LOOP }, () => ({
    x: 0,
    y: 0,
    z: undefined,
    emoji: '',
    color: '',
}));
let _spritesCount = 0;
// Vista mutable: array cuyas entries apuntan a _sprites (se ajusta .length cada frame)
const _spritesView = _sprites.slice();

// --- Crear pantalla HTML ---

function crearPantalla(esTouch) {
    pantalla = document.createElement('div');
    pantalla.id = 'pantalla-habitacion2';
    pantalla.className = 'habitacion-2';

    // Cabecera
    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-habitacion';

    const btnHuir = document.createElement('button');
    btnHuir.className = 'btn-huir';
    btnHuir.innerHTML = '<span class="btn-huir-flecha">\u2190</span> \uD83D\uDEAA';
    btnHuir.title = 'Huir al pasillo (Esc)';
    btnHuir.addEventListener('click', function () {
        limpiarHabitacion2();
        callbackSalir();
    });

    const titulo = document.createElement('h2');
    titulo.className = 'titulo-habitacion';
    titulo.textContent = 'Habitación 2 — El Laberinto 3D';

    cabecera.appendChild(btnHuir);
    cabecera.appendChild(titulo);

    indicador = document.createElement('p');
    indicador.id = 'laberinto3d-indicador';

    // Contenedor para canvas 3D + minimapa
    const contenedor = document.createElement('div');
    contenedor.id = 'contenedor-3d';

    canvas3D = document.createElement('canvas');
    canvas3D.id = 'canvas-3d';
    canvas3D.width = canvas.ancho;
    canvas3D.height = canvas.alto;
    ctx3D = canvas3D.getContext('2d');

    canvasMini = document.createElement('canvas');
    canvasMini.id = 'canvas-minimapa';
    canvasMini.width = canvas.anchoMini;
    canvasMini.height = canvas.altoMini;
    ctxMini = canvasMini.getContext('2d');

    contenedor.appendChild(canvas3D);
    contenedor.appendChild(canvasMini);

    // Pre-crear gradientes (no cambian entre frames)
    gradCielo = ctx3D.createLinearGradient(0, 0, 0, canvas.alto / 2);
    gradCielo.addColorStop(0, COLORES.cieloArriba);
    gradCielo.addColorStop(1, COLORES.cieloAbajo);

    gradSuelo = ctx3D.createLinearGradient(0, canvas.alto / 2, 0, canvas.alto);
    gradSuelo.addColorStop(0, COLORES.sueloArriba);
    gradSuelo.addColorStop(1, COLORES.sueloAbajo);

    mensajeExito = document.createElement('p');
    mensajeExito.id = 'laberinto3d-mensaje';
    mensajeExito.classList.add('oculto');

    pantalla.appendChild(cabecera);
    pantalla.appendChild(indicador);
    pantalla.appendChild(contenedor);
    pantalla.appendChild(mensajeExito);

    if (!esTouch) {
        const hint = document.createElement('p');
        hint.className = 'laberinto-hint';
        hint.textContent =
            '\u2191\u2193 avanzar/retroceder — \u2190\u2192 girar \u00B7 Esc para huir';
        pantalla.appendChild(hint);
    }

    document.getElementById('juego').appendChild(pantalla);
}

// --- Detección de llave y salida ---

function detectarLlave() {
    if (tieneLlave) return;

    const celdaX = Math.floor(estado.x);
    const celdaY = Math.floor(estado.y);

    if (celdaY === llaveFila && celdaX === llaveCol) {
        tieneLlave = true;
        indicador.textContent = '\uD83D\uDD11 \u00A1Llave obtenida! Vuelve a la salida';
        indicador.classList.add('llave-obtenida');

        jugador.inventario.push('llave-habitacion-3');
        document.dispatchEvent(new Event('inventario-cambio'));
        lanzarToast('\u00A1Llave encontrada!', '\uD83D\uDD11', 'item');
    }
}

function detectarSalida() {
    if (!tieneLlave) return;

    const celdaX = Math.floor(estado.x);
    const celdaY = Math.floor(estado.y);

    if (celdaY === entradaFila && celdaX === entradaCol) {
        activo = false;
        mensajeExito.textContent = '\u00A1Escapaste con la llave!';
        mensajeExito.classList.remove('oculto');
        lanzarToast('\u00A1Escapaste con la llave!', '\uD83D\uDEAA', 'exito');

        setTimeout(function () {
            limpiarHabitacion2();
            callbackSalir();
        }, 1500);
    }
}

// --- Game loop ---

function loop(ahora) {
    if (!activo) return;

    // Medición de rendimiento para fallback de texturas
    // Ignorar los primeros 30 frames (warmup) y requerir 10 frames lentos consecutivos
    if (ultimoFrame > 0 && frameCount > 30) {
        const dt = ahora - ultimoFrame;
        if (dt > 33) {
            framesLentos++;
            if (framesLentos >= 10 && usarTexturas) {
                usarTexturas = false;
            }
        } else {
            framesLentos = 0;
        }
    }
    ultimoFrame = ahora;

    // Movimiento
    moverJugador(teclas, estado, mapa, FILAS, COLS);
    detectarLlave();
    detectarSalida();

    // Iluminación dinámica (recalcular cada 3 frames)
    if (decoraciones && frameCount % 3 === 0) {
        mapaLuz = precalcularMapaLuz(FILAS, COLS, decoraciones.antorchas, ahora);
    }
    frameCount++;

    // Actualizar decoraciones y partículas
    if (decoraciones) {
        actualizarDecoraciones(decoraciones, ahora);
    }
    actualizarParticulas(ahora, decoraciones ? decoraciones.antorchas : [], estado.x, estado.y);

    // Renderizar vista 3D
    const zBuffer = renderizar3D(
        ctx3D,
        estado,
        mapa,
        FILAS,
        COLS,
        { cielo: gradCielo, suelo: gradSuelo },
        usarTexturas ? texturas : null,
        mapaLuz
    );

    // Sprites: objetos del juego + decoraciones (reutilizar array preallocado)
    _spritesCount = 0;

    if (!tieneLlave) {
        const s = _sprites[_spritesCount++];
        s.x = llaveCol + 0.5;
        s.y = llaveFila + 0.5;
        s.emoji = '\uD83D\uDD11';
        s.color = '#ffd700';
        s.z = undefined;
    }

    const sPuerta = _sprites[_spritesCount++];
    sPuerta.x = entradaCol + 0.5;
    sPuerta.y = entradaFila + 0.5;
    sPuerta.emoji = '\uD83D\uDEAA';
    sPuerta.color = tieneLlave ? '#44ff44' : '#444444';
    sPuerta.z = undefined;

    // Agregar decoraciones como sprites
    if (decoraciones) {
        const deco = obtenerSpritesDecoraciones(decoraciones, estado.x, estado.y);
        for (let i = 0; i < deco.count; i++) {
            const src = deco.sprites[i];
            const dst = _sprites[_spritesCount++];
            dst.x = src.x;
            dst.y = src.y;
            dst.z = src.z;
            dst.emoji = src.emoji;
            dst.color = src.color;
        }
    }

    // Crear vista del array con solo los sprites activos
    _spritesView.length = _spritesCount;
    renderizarSprites(ctx3D, _spritesView, zBuffer, estado.x, estado.y, estado.angulo);

    // Partículas (después de sprites, encima de todo)
    renderizarParticulas(ctx3D, zBuffer, estado.x, estado.y, estado.angulo);

    // Minimapa
    renderizarMinimapa(ctxMini, minimapBase, {
        jugadorX: estado.x,
        jugadorY: estado.y,
        angulo: estado.angulo,
        tieneLlave,
        llaveCol,
        llaveFila,
        entradaCol,
        entradaFila,
        avatarImg,
        fov: FOV,
        cols: COLS,
    });

    animacionId = requestAnimationFrame(loop);
}

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        teclas[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarHabitacion2();
        callbackSalir();
    }
}

function onKeyUp(e) {
    delete teclas[e.key];
}

// --- API pública ---

export function iniciarHabitacion2(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    tieneLlave = false;
    activo = true;
    frameCount = 0;
    usarTexturas = true;
    ultimoFrame = 0;
    framesLentos = 0;

    // Escalar canvas al viewport
    calcularDimensiones();

    // Generar laberinto aleatorio
    mapa = generarMapa(FILAS, COLS, ATAJOS);

    // Entrada en la esquina inferior izquierda
    entradaFila = FILAS - 2;
    entradaCol = 1;

    // Colocar llave en el punto más lejano
    const puntoLlave = encontrarPuntoLejano(mapa, FILAS, COLS, entradaFila, entradaCol);
    llaveFila = puntoLlave[0];
    llaveCol = puntoLlave[1];

    // Posición inicial del jugador
    estado.x = entradaCol + 0.5;
    estado.y = entradaFila + 0.5;
    estado.angulo = -Math.PI / 2;

    // Avatar para minimapa
    avatarImg = new Image();
    avatarImg.src = jugador.img;

    // Generar texturas procedurales (una vez)
    texturas = generarTexturas();

    // Generar decoraciones ambientales
    decoraciones = generarDecoraciones(mapa, FILAS, COLS);

    // Inicializar partículas
    inicializarEmisores(mapa, FILAS, COLS);

    // Crear pantalla DOM
    crearPantalla(!!dpadRef);

    // Pre-renderizar minimapa base
    minimapBase = crearMinimapBase(mapa, FILAS, COLS, canvas.anchoMini, canvas.altoMini);

    // Resetear indicador
    indicador.textContent = '\uD83D\uDD11 Encuentra la llave';
    indicador.classList.remove('llave-obtenida');
    mensajeExito.classList.add('oculto');

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // D-pad touch
    if (dpadRef) {
        dpadRef.setTeclasRef(teclas);
        dpadRef.mostrar();
    }

    // Iniciar game loop
    animacionId = requestAnimationFrame(loop);
}

export function limpiarHabitacion2() {
    activo = false;

    if (animacionId) {
        cancelAnimationFrame(animacionId);
        animacionId = null;
    }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    Object.keys(teclas).forEach(function (k) {
        delete teclas[k];
    });

    // Limpiar motor 3D
    limpiarParticulas();
    texturas = null;
    decoraciones = null;
    mapaLuz = null;

    if (pantalla && pantalla.parentNode) {
        pantalla.parentNode.removeChild(pantalla);
        pantalla = null;
    }

    canvas3D = null;
    ctx3D = null;
    canvasMini = null;
    ctxMini = null;
    minimapBase = null;
    gradCielo = null;
    gradSuelo = null;
    avatarImg = null;
}
