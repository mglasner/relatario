// El Laberinto 3D — Vista pseudo-3D con raycasting estilo Doom
// El jugador debe encontrar el cofre del tesoro y volver a la salida

import { CFG } from './config.js';
import { est, FILAS, COLS, ATAJOS, actualizarHUDInventarioLocal } from './estado.js';
import { detectarLlave, detectarSalida } from './deteccion.js';
import { generarMapa, encontrarPuntoLejano } from '../../laberinto.js';
import { FOV, canvas, calcularDimensiones, COLORES, COLORES_ZONA } from '../../motor3d/config.js';
import { moverJugador } from '../../motor3d/colisiones.js';
import { crearMinimapBase, renderizarMinimapa } from '../../motor3d/minimapa.js';
import { renderizarSprites } from '../../motor3d/sprites.js';
import { generarTexturas, calcularZonas } from '../../motor3d/texturas.js';
import { renderizar3D } from '../../motor3d/raycaster.js';
import {
    generarDecoraciones,
    actualizarDecoraciones,
    obtenerSpritesDecoraciones,
} from '../../motor3d/decoraciones.js';
import {
    inicializarEmisores,
    actualizarParticulas,
    renderizarParticulas,
    renderizarFuegoAntorchas,
    limpiarParticulas,
} from '../../motor3d/particulas.js';
import { precalcularMapaLuz } from '../../motor3d/iluminacion.js';
import {
    generarTrampas3D,
    detectarTrampas3D,
    obtenerSpritesTrampas3D,
    actualizarFuegoTrampas,
    renderizarFuegoTrampas,
    limpiarTrampas3D,
} from '../../motor3d/trampas3d.js';
import {
    inicializarHUD,
    actualizarHUD,
    renderizarHUD,
    limpiarHUD,
} from '../../motor3d/hudPrimeraPersona.js';
import { crearModoInmersivo } from '../../componentes/modoInmersivo.js';
import { crearBarraVida } from '../../componentes/barraVida.js';
import { crearInventario } from '../../componentes/inventario.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearElemento, crearGameLoop } from '../../utils.js';

// Pool de sprites preallocado para el loop (cofre + puerta + ~15 decoraciones + ~10 trampas inactivas)
const MAX_SPRITES_LOOP = 30;
const _sprites = Array.from({ length: MAX_SPRITES_LOOP }, () => ({
    x: 0,
    y: 0,
    z: undefined,
    emoji: '',
    color: '',
    sinBrillo: false,
    imagen: null,
    escala: undefined,
}));
let _spritesCount = 0;
// Vista mutable: array cuyas entries apuntan a _sprites (se ajusta .length cada frame)
const _spritesView = _sprites.slice();

// Copia sprites desde un resultado { sprites, count } al pool preallocado
function copiarSprites(resultado, offset) {
    for (let i = 0; i < resultado.count; i++) {
        const src = resultado.sprites[i];
        const dst = _sprites[offset++];
        dst.x = src.x;
        dst.y = src.y;
        dst.z = src.z;
        dst.emoji = src.emoji;
        dst.color = src.color;
        dst.sinBrillo = src.sinBrillo || false;
        dst.imagen = src.imagen || null;
        dst.escala = src.escala || undefined;
    }
    return offset;
}

// --- Landscape mobile: escalado y fullscreen ---

function calcularEscala3D() {
    if (!est.canvas3D) return 1;
    const rect = est.canvas3D.getBoundingClientRect();
    const esFullscreen = !!document.fullscreenElement;
    const margenAncho = esFullscreen ? 14 : 26;
    const margenAbajo = esFullscreen ? 4 : 16;

    const disponibleAncho = window.innerWidth - margenAncho;
    const disponibleAlto = window.innerHeight - rect.top - margenAbajo;

    const escalaX = disponibleAncho / canvas.ancho;
    const escalaY = disponibleAlto / canvas.alto;

    return Math.max(1, Math.min(escalaX, escalaY));
}

function reescalarCanvas3D() {
    if (!est.canvas3D) return;
    const escala = calcularEscala3D();
    est.canvas3D.style.width = Math.floor(canvas.ancho * escala) + 'px';
    est.canvas3D.style.height = Math.floor(canvas.alto * escala) + 'px';
}

function crearGradientes(zona) {
    const paleta = zona !== undefined ? COLORES_ZONA[zona] : COLORES;

    est.gradCielo = est.ctx3D.createLinearGradient(0, 0, 0, canvas.alto / 2);
    est.gradCielo.addColorStop(0, paleta.cieloArriba);
    est.gradCielo.addColorStop(1, paleta.cieloAbajo);

    est.gradSuelo = est.ctx3D.createLinearGradient(0, canvas.alto / 2, 0, canvas.alto);
    est.gradSuelo.addColorStop(0, paleta.sueloArriba);
    est.gradSuelo.addColorStop(1, paleta.sueloAbajo);
}

// Recalcula resolución interna del canvas para landscape (llena todo el ancho)
function redimensionarLandscape() {
    if (!est.activo || !est.canvas3D) return;

    const enLandscape =
        est.modoInmersivo && est.modoInmersivo.esMobile && window.innerWidth > window.innerHeight;
    calcularDimensiones(enLandscape ? { landscape: true } : undefined);

    // Solo redimensionar si las dimensiones cambiaron
    if (est.canvas3D.width === canvas.ancho && est.canvas3D.height === canvas.alto) {
        reescalarCanvas3D();
        return;
    }

    // Aplicar nueva resolución interna
    est.canvas3D.width = canvas.ancho;
    est.canvas3D.height = canvas.alto;

    est.canvasMini.width = canvas.anchoMini;
    est.canvasMini.height = canvas.altoMini;
    est.minimapBase = crearMinimapBase(est.mapa, FILAS, COLS, canvas.anchoMini, canvas.altoMini);

    // Recrear gradientes (dependen de canvas.alto)
    crearGradientes(est.zonaActual);

    // Actualizar variable CSS
    const juegoEl = document.getElementById('juego');
    juegoEl.style.setProperty('--ancho-3d', canvas.ancho + 6 + 'px');

    reescalarCanvas3D();
}

function actualizarHUDVida() {
    if (!est.hudJugadorVida) return;
    if (est.jugador.vidaActual === est.hudJugadorVidaAnterior) return;
    est.hudJugadorVidaAnterior = est.jugador.vidaActual;
    est.hudJugadorVida.actualizar(est.jugador.vidaActual, est.jugador.vidaMax);
}

// --- Crear pantalla HTML ---

function crearPantalla(esTouch) {
    function huir() {
        limpiarLaberinto3d();
        est.callbackSalir();
    }

    const { pantalla } = crearPantallaJuego(
        'pantalla-laberinto3d',
        'juego-laberinto3d',
        CFG.meta.titulo,
        huir
    );
    est.pantalla = pantalla;

    est.indicador = document.createElement('p');
    est.indicador.id = 'laberinto3d-indicador';

    // Contenedor para canvas 3D + minimapa
    const contenedor = document.createElement('div');
    contenedor.id = 'contenedor-3d';

    est.canvas3D = document.createElement('canvas');
    est.canvas3D.id = 'canvas-3d';
    est.canvas3D.setAttribute('role', 'img');
    est.canvas3D.setAttribute('aria-label', 'El Laberinto 3D — Vista en primera persona');
    est.canvas3D.width = canvas.ancho;
    est.canvas3D.height = canvas.alto;
    est.ctx3D = est.canvas3D.getContext('2d');

    est.canvasMini = document.createElement('canvas');
    est.canvasMini.id = 'canvas-minimapa';
    est.canvasMini.width = canvas.anchoMini;
    est.canvasMini.height = canvas.altoMini;
    est.ctxMini = est.canvasMini.getContext('2d');

    contenedor.appendChild(est.canvas3D);
    contenedor.appendChild(est.canvasMini);

    // HUD superpuesto: vida + inventario + botón huir (landscape mobile)
    est.hudJugadorContenedor = document.createElement('div');
    est.hudJugadorContenedor.className = 'plat-hud-jugador';

    const btnHuirCanvas = document.createElement('button');
    btnHuirCanvas.className = 'plat-hud-huir';
    btnHuirCanvas.title = 'Volver al libro';
    btnHuirCanvas.setAttribute('aria-label', 'Volver al libro');
    const imgHuirCanvas = document.createElement('img');
    imgHuirCanvas.src = 'assets/img/icons/btn-salir.webp';
    imgHuirCanvas.alt = '';
    imgHuirCanvas.className = 'plat-hud-huir-icono';
    btnHuirCanvas.appendChild(imgHuirCanvas);
    btnHuirCanvas.addEventListener('click', huir);

    est.hudJugadorVida = crearBarraVida({ mostrarTexto: true, claseExtra: 'barra-vida-compacta' });
    est.hudJugadorInventario = crearInventario({ claseExtra: 'inventario-compacto' });

    est.hudJugadorContenedor.appendChild(btnHuirCanvas);
    est.hudJugadorContenedor.appendChild(est.hudJugadorVida.el);
    est.hudJugadorContenedor.appendChild(est.hudJugadorInventario.el);
    contenedor.appendChild(est.hudJugadorContenedor);

    // Pre-crear gradientes para zona inicial
    crearGradientes(0);

    est.mensajeExito = document.createElement('p');
    est.mensajeExito.id = 'laberinto3d-mensaje';
    est.mensajeExito.classList.add('oculto');

    est.pantalla.appendChild(est.indicador);
    est.pantalla.appendChild(contenedor);
    est.pantalla.appendChild(est.mensajeExito);

    if (!esTouch) {
        const hint = crearElemento(
            'p',
            'laberinto-hint',
            '\u2191\u2193 avanzar/retroceder — \u2190\u2192 girar \u00B7 Esc para huir'
        );
        est.pantalla.appendChild(hint);
    }

    document.getElementById('juego').appendChild(est.pantalla);
}

// --- Game loop ---

const gameLoop2 = crearGameLoop(loop);

function loop(ahora, _dt) {
    if (!est.activo || !est.jugador.estaVivo()) {
        gameLoop2.detener();
        return;
    }

    // Medición de rendimiento para fallback de texturas
    if (est.ultimoFrame > 0 && est.frameCount > CFG.rendimiento.warmupFrames) {
        const dt = ahora - est.ultimoFrame;
        if (dt > CFG.rendimiento.umbralFrameLento) {
            est.framesLentos++;
            if (est.framesLentos >= CFG.rendimiento.framesLentosParaFallback && est.usarTexturas) {
                est.usarTexturas = false;
            }
        } else {
            est.framesLentos = 0;
        }
    }
    est.ultimoFrame = ahora;

    // Movimiento
    moverJugador(est.teclas, est.posicion, est.mapa, FILAS, COLS);
    detectarLlave();
    detectarSalida(limpiarLaberinto3d);

    // Trampas de fuego
    const danoTrampa = detectarTrampas3D(est.posicion.x, est.posicion.y, est.jugador);
    if (danoTrampa > 0) {
        est.flashDano = CFG.rendimiento.flashDano;
    }
    actualizarHUDVida();

    // Iluminación dinámica (recalcular cada 3 frames, con luz ambiental por zona)
    if (est.decoraciones && est.frameCount % 3 === 0) {
        est.mapaLuz = precalcularMapaLuz(
            FILAS,
            COLS,
            est.decoraciones.antorchas,
            ahora,
            est.mapaZonas
        );
    }
    est.frameCount++;

    // Detectar cambio de zona y actualizar gradientes (antes de partículas y render)
    if (est.mapaZonas) {
        const celdaIdx = Math.floor(est.posicion.y) * COLS + Math.floor(est.posicion.x);
        const nuevaZona = est.mapaZonas[celdaIdx] || 0;
        if (nuevaZona !== est.zonaActual) {
            est.zonaActual = nuevaZona;
            crearGradientes(nuevaZona);
        }
    }

    // Actualizar decoraciones y partículas
    if (est.decoraciones) {
        actualizarDecoraciones(est.decoraciones, ahora, est.mapa, FILAS, COLS);
    }
    actualizarParticulas(
        ahora,
        est.decoraciones ? est.decoraciones.antorchas : [],
        est.posicion.x,
        est.posicion.y,
        est.zonaActual
    );
    actualizarFuegoTrampas(est.posicion.x, est.posicion.y);

    // Tinte ambiental de la zona actual
    const tinteZona = est.mapaZonas ? COLORES_ZONA[est.zonaActual].tinte : null;

    // Renderizar vista 3D
    const zBuffer = renderizar3D(
        est.ctx3D,
        est.posicion,
        est.mapa,
        FILAS,
        COLS,
        { cielo: est.gradCielo, suelo: est.gradSuelo },
        est.usarTexturas ? est.texturas : null,
        est.mapaLuz,
        { zonas: est.mapaZonas, tinte: tinteZona }
    );

    // Sprites: objetos del juego + decoraciones (reutilizar array preallocado)
    _spritesCount = 0;

    if (!est.tieneLlave) {
        const s = _sprites[_spritesCount++];
        s.x = est.llaveCol + 0.5;
        s.y = est.llaveFila + 0.5;
        s.emoji = '\uD83D\uDCE6';
        s.color = '#ffd700';
        s.z = 0.15;
        s.sinBrillo = false;
        s.imagen = est.cofreImg;
        s.escala = 1.2;
    }

    const sPuerta = _sprites[_spritesCount++];
    sPuerta.x = est.entradaCol + 0.5;
    sPuerta.y = est.entradaFila + 0.5;
    sPuerta.emoji = '\uD83D\uDEAA';
    sPuerta.color = est.tieneLlave ? '#44ff44' : '#444444';
    sPuerta.z = undefined;
    sPuerta.sinBrillo = false;
    sPuerta.imagen = null;
    sPuerta.escala = undefined;

    // Agregar decoraciones como sprites
    if (est.decoraciones) {
        const deco = obtenerSpritesDecoraciones(est.decoraciones, est.posicion.x, est.posicion.y);
        _spritesCount = copiarSprites(deco, _spritesCount);
    }

    // Agregar trampas como sprites
    const trap = obtenerSpritesTrampas3D(est.posicion.x, est.posicion.y);
    _spritesCount = copiarSprites(trap, _spritesCount);

    // Crear vista del array con solo los sprites activos
    // Re-asignar refs cada frame porque .sort() y .length pueden desordenar/borrar entradas
    for (let i = 0; i < _spritesCount; i++) {
        _spritesView[i] = _sprites[i];
    }
    _spritesView.length = _spritesCount;
    renderizarSprites(
        est.ctx3D,
        _spritesView,
        zBuffer,
        est.posicion.x,
        est.posicion.y,
        est.posicion.angulo
    );

    // Partículas (después de sprites, encima de todo)
    renderizarParticulas(est.ctx3D, zBuffer, est.posicion.x, est.posicion.y, est.posicion.angulo);
    renderizarFuegoAntorchas(
        est.ctx3D,
        zBuffer,
        est.decoraciones ? est.decoraciones.antorchas : [],
        est.posicion.x,
        est.posicion.y,
        est.posicion.angulo
    );
    renderizarFuegoTrampas(est.ctx3D, zBuffer, est.posicion.x, est.posicion.y, est.posicion.angulo);

    // HUD de primera persona (brazos/manos)
    actualizarHUD(est.teclas, est.flashDano);
    renderizarHUD(est.ctx3D);

    // Flash rojo de daño por trampas
    if (est.flashDano > 0) {
        est.ctx3D.fillStyle = 'rgba(255, 0, 0, ' + est.flashDano / 10 + ')';
        est.ctx3D.fillRect(0, 0, canvas.ancho, canvas.alto);
        est.flashDano--;
    }

    // Minimapa
    renderizarMinimapa(est.ctxMini, est.minimapBase, {
        jugadorX: est.posicion.x,
        jugadorY: est.posicion.y,
        angulo: est.posicion.angulo,
        tieneLlave: est.tieneLlave,
        llaveCol: est.llaveCol,
        llaveFila: est.llaveFila,
        entradaCol: est.entradaCol,
        entradaFila: est.entradaFila,
        avatarImg: est.avatarImg,
        fov: FOV,
        cols: COLS,
    });
}

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        est.teclas[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarLaberinto3d();
        est.callbackSalir();
    }
}

function onKeyUp(e) {
    delete est.teclas[e.key];
}

// --- API pública ---

/**
 * Inicia El Laberinto 3D.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadArgumento] - Controles touch D-pad
 */
export function iniciarLaberinto3d(jugadorRef, callback, dpadArgumento) {
    est.jugador = jugadorRef;
    est.callbackSalir = callback;
    est.modoInmersivo = crearModoInmersivo(redimensionarLandscape);
    est.dpadRef = dpadArgumento;
    est.hudJugadorVidaAnterior = -1;
    est.tieneLlave = false;
    est.activo = true;
    est.frameCount = 0;
    est.usarTexturas = true;
    est.ultimoFrame = 0;
    est.framesLentos = 0;
    est.flashDano = 0;

    // Escalar canvas al viewport
    calcularDimensiones();

    // Generar laberinto aleatorio
    est.mapa = generarMapa(FILAS, COLS, ATAJOS);

    // Entrada en la esquina inferior izquierda
    est.entradaFila = FILAS - 2;
    est.entradaCol = 1;

    // Colocar cofre en el punto más lejano
    const puntoLlave = encontrarPuntoLejano(est.mapa, FILAS, COLS, est.entradaFila, est.entradaCol);
    est.llaveFila = puntoLlave[0];
    est.llaveCol = puntoLlave[1];

    // Posición inicial del jugador
    est.posicion.x = est.entradaCol + 0.5;
    est.posicion.y = est.entradaFila + 0.5;
    est.posicion.angulo = -Math.PI / 2;

    // Avatar para minimapa
    est.avatarImg = new Image();
    est.avatarImg.src = est.jugador.img;

    // Imagen del cofre para sprite 3D
    est.cofreImg = new Image();
    est.cofreImg.src = 'assets/img/llaves/cofre-laberinto3d.webp';

    // Generar texturas procedurales (una vez)
    est.texturas = generarTexturas();

    // Calcular zonas temáticas (BFS desde la entrada)
    est.mapaZonas = calcularZonas(est.mapa, FILAS, COLS, est.entradaFila, est.entradaCol);
    est.zonaActual = 0;

    // Generar decoraciones ambientales (con densidad de antorchas por zona)
    est.decoraciones = generarDecoraciones(est.mapa, FILAS, COLS, est.mapaZonas);

    // Generar trampas de fuego
    generarTrampas3D(
        est.mapa,
        FILAS,
        COLS,
        est.entradaFila,
        est.entradaCol,
        est.llaveFila,
        est.llaveCol
    );

    // Inicializar partículas
    inicializarEmisores(est.mapa, FILAS, COLS);

    // HUD de primera persona (brazos/manos del personaje)
    inicializarHUD(est.jugador);

    // Modo inmersivo: expandir contenedor para usar más viewport
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.add('juego-inmersivo');
    // Ancho del canvas + borde del contenedor (3px × 2) para alinear la barra superior
    juegoEl.style.setProperty('--ancho-3d', canvas.ancho + 6 + 'px');

    // Crear pantalla DOM
    crearPantalla(est.modoInmersivo.esMobile);

    // Pre-renderizar minimapa base
    est.minimapBase = crearMinimapBase(est.mapa, FILAS, COLS, canvas.anchoMini, canvas.altoMini);

    // Resetear indicador
    est.indicador.replaceChildren();
    const imgIndicador = document.createElement('img');
    imgIndicador.src = 'assets/img/llaves/cofre-laberinto3d-icono.webp';
    imgIndicador.alt = '';
    imgIndicador.className = 'indicador-llave-img';
    est.indicador.appendChild(imgIndicador);
    est.indicador.appendChild(document.createTextNode(' ' + CFG.textos.indicadorBusqueda));
    est.indicador.classList.remove('llave-obtenida');
    est.mensajeExito.classList.add('oculto');

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // D-pad touch: cruz completa a la izquierda + A/B a la derecha
    if (est.dpadRef) {
        est.dpadRef.setTeclasRef(est.teclas);
        est.dpadRef.setModoCruzSplit();
        est.dpadRef.mostrar();
    }

    // Overlay de rotación y pantalla completa (solo mobile)
    est.modoInmersivo.activar();

    // Inicializar HUD landscape
    actualizarHUDVida();
    actualizarHUDInventarioLocal();

    // Iniciar game loop
    gameLoop2.iniciar();
}

/** Limpia y destruye El Laberinto 3D */
export function limpiarLaberinto3d() {
    est.activo = false;
    gameLoop2.detener();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    Object.keys(est.teclas).forEach(function (k) {
        delete est.teclas[k];
    });

    // Salir de pantalla completa y desactivar overlay
    if (est.modoInmersivo) {
        est.modoInmersivo.desactivar();
        est.modoInmersivo = null;
    }
    if (est.dpadRef) {
        est.dpadRef.setModoCentrado();
        est.dpadRef = null;
    }

    // Limpiar motor 3D
    limpiarParticulas();
    limpiarTrampas3D();
    limpiarHUD();
    est.texturas = null;
    est.decoraciones = null;
    est.mapaLuz = null;
    est.mapaZonas = null;
    est.zonaActual = 0;

    // Limpiar HUD landscape
    est.hudJugadorContenedor = null;
    est.hudJugadorVida = null;
    est.hudJugadorVidaAnterior = -1;
    est.hudJugadorInventario = null;

    // Restaurar contenedor normal
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.remove('juego-inmersivo');
    juegoEl.style.removeProperty('--ancho-3d');

    if (est.pantalla) {
        est.pantalla.remove();
        est.pantalla = null;
    }

    est.canvas3D = null;
    est.ctx3D = null;
    est.canvasMini = null;
    est.ctxMini = null;
    est.minimapBase = null;
    est.gradCielo = null;
    est.gradSuelo = null;
    est.avatarImg = null;
    est.cofreImg = null;
}
