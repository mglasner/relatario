// Habitación 2 — El Laberinto 3D
// Vista pseudo-3D con raycasting estilo Doom
// El jugador debe encontrar la llave y volver a la salida

import { CFG } from './config-habitacion2.js';
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
    renderizarFuegoAntorchas,
    limpiarParticulas,
} from '../motor3d/particulas.js';
import { precalcularMapaLuz } from '../motor3d/iluminacion.js';
import {
    generarTrampas3D,
    detectarTrampas3D,
    obtenerSpritesTrampas3D,
    actualizarFuegoTrampas,
    renderizarFuegoTrampas,
    limpiarTrampas3D,
} from '../motor3d/trampas3d.js';
import {
    inicializarHUD,
    actualizarHUD,
    renderizarHUD,
    limpiarHUD,
} from '../motor3d/hudPrimeraPersona.js';

// --- Constantes del laberinto (desde config YAML) ---

const FILAS = CFG.laberinto.filas;
const COLS = CFG.laberinto.columnas;
const ATAJOS = CFG.laberinto.atajos;

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
let flashDano = 0;

// Pool de sprites preallocado para el loop (llave + puerta + ~15 decoraciones + ~10 trampas inactivas)
const MAX_SPRITES_LOOP = 30;
const _sprites = Array.from({ length: MAX_SPRITES_LOOP }, () => ({
    x: 0,
    y: 0,
    z: undefined,
    emoji: '',
    color: '',
    sinBrillo: false,
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
    titulo.textContent = CFG.meta.titulo;

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
        indicador.textContent = CFG.textos.indicadorLlaveObtenida;
        indicador.classList.add('llave-obtenida');

        jugador.inventario.push(CFG.meta.itemInventario);
        document.dispatchEvent(new Event('inventario-cambio'));
        lanzarToast(CFG.textos.toastLlave, '\uD83D\uDD11', 'item');
    }
}

function detectarSalida() {
    if (!tieneLlave) return;

    const celdaX = Math.floor(estado.x);
    const celdaY = Math.floor(estado.y);

    if (celdaY === entradaFila && celdaX === entradaCol) {
        activo = false;
        mensajeExito.textContent = CFG.textos.mensajeExito;
        mensajeExito.classList.remove('oculto');
        lanzarToast(CFG.textos.mensajeExito, '\uD83D\uDEAA', 'exito');

        setTimeout(function () {
            limpiarHabitacion2();
            callbackSalir();
        }, CFG.meta.timeoutExito);
    }
}

// --- Game loop ---

function loop(ahora) {
    if (!activo) return;

    // Medición de rendimiento para fallback de texturas
    if (ultimoFrame > 0 && frameCount > CFG.rendimiento.warmupFrames) {
        const dt = ahora - ultimoFrame;
        if (dt > CFG.rendimiento.umbralFrameLento) {
            framesLentos++;
            if (framesLentos >= CFG.rendimiento.framesLentosParaFallback && usarTexturas) {
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

    // Trampas de fuego
    const danoTrampa = detectarTrampas3D(estado.x, estado.y, jugador);
    if (danoTrampa > 0) {
        flashDano = CFG.rendimiento.flashDano;
    }

    // Iluminación dinámica (recalcular cada 3 frames)
    if (decoraciones && frameCount % 3 === 0) {
        mapaLuz = precalcularMapaLuz(FILAS, COLS, decoraciones.antorchas, ahora);
    }
    frameCount++;

    // Actualizar decoraciones y partículas
    if (decoraciones) {
        actualizarDecoraciones(decoraciones, ahora, mapa, FILAS, COLS);
    }
    actualizarParticulas(ahora, decoraciones ? decoraciones.antorchas : [], estado.x, estado.y);
    actualizarFuegoTrampas(estado.x, estado.y);

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
        s.sinBrillo = false;
    }

    const sPuerta = _sprites[_spritesCount++];
    sPuerta.x = entradaCol + 0.5;
    sPuerta.y = entradaFila + 0.5;
    sPuerta.emoji = '\uD83D\uDEAA';
    sPuerta.color = tieneLlave ? '#44ff44' : '#444444';
    sPuerta.z = undefined;
    sPuerta.sinBrillo = false;

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
            dst.sinBrillo = false;
        }
    }

    // Agregar trampas como sprites
    const trap = obtenerSpritesTrampas3D(estado.x, estado.y);
    for (let i = 0; i < trap.count; i++) {
        const src = trap.sprites[i];
        const dst = _sprites[_spritesCount++];
        dst.x = src.x;
        dst.y = src.y;
        dst.z = src.z;
        dst.emoji = src.emoji;
        dst.color = src.color;
        dst.sinBrillo = src.sinBrillo;
    }

    // Crear vista del array con solo los sprites activos
    // Re-asignar refs cada frame porque .sort() y .length pueden desordenar/borrar entradas
    for (let i = 0; i < _spritesCount; i++) {
        _spritesView[i] = _sprites[i];
    }
    _spritesView.length = _spritesCount;
    renderizarSprites(ctx3D, _spritesView, zBuffer, estado.x, estado.y, estado.angulo);

    // Partículas (después de sprites, encima de todo)
    renderizarParticulas(ctx3D, zBuffer, estado.x, estado.y, estado.angulo);
    renderizarFuegoAntorchas(
        ctx3D,
        zBuffer,
        decoraciones ? decoraciones.antorchas : [],
        estado.x,
        estado.y,
        estado.angulo
    );
    renderizarFuegoTrampas(ctx3D, zBuffer, estado.x, estado.y, estado.angulo);

    // HUD de primera persona (brazos/manos)
    actualizarHUD(teclas, flashDano);
    renderizarHUD(ctx3D);

    // Flash rojo de daño por trampas
    if (flashDano > 0) {
        ctx3D.fillStyle = 'rgba(255, 0, 0, ' + flashDano / 10 + ')';
        ctx3D.fillRect(0, 0, canvas.ancho, canvas.alto);
        flashDano--;
    }

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
    flashDano = 0;

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

    // Generar trampas de fuego
    generarTrampas3D(mapa, FILAS, COLS, entradaFila, entradaCol, llaveFila, llaveCol);

    // Inicializar partículas
    inicializarEmisores(mapa, FILAS, COLS);

    // HUD de primera persona (brazos/manos del personaje)
    inicializarHUD(jugador);

    // Modo inmersivo: expandir contenedor para usar más viewport
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.add('juego-inmersivo');
    // Ancho del canvas + borde del contenedor (3px × 2) para alinear la barra superior
    juegoEl.style.setProperty('--ancho-3d', canvas.ancho + 6 + 'px');

    // Crear pantalla DOM
    crearPantalla(!!dpadRef);

    // Pre-renderizar minimapa base
    minimapBase = crearMinimapBase(mapa, FILAS, COLS, canvas.anchoMini, canvas.altoMini);

    // Resetear indicador
    indicador.textContent = CFG.textos.indicadorBusqueda;
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
    limpiarTrampas3D();
    limpiarHUD();
    texturas = null;
    decoraciones = null;
    mapaLuz = null;

    // Restaurar contenedor normal
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.remove('juego-inmersivo');
    juegoEl.style.removeProperty('--ancho-3d');

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
