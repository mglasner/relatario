// El Laberinto — Laberinto 2D procedural
// El jugador debe encontrar la llave y volver a la salida
// El laberinto se genera aleatoriamente cada vez

import { generarMapa, encontrarPuntoLejano } from '../../laberinto.js';
import {
    colocarCuartosSecretos,
    renderizarCuartosSecretos,
    detectarProximidad,
    detectarEmpuje,
    detectarRecompensa,
} from './cuartosSecretos.js';
import { CONFIG, CFG, est, calcularTamCelda, getCeldaJugador } from './estado.js';
import {
    colocarTrampas,
    actualizarTrampas,
    detectarTrampas,
    renderizarTrampas,
    colocarTrampasLentas,
    actualizarTrampasLentas,
    detectarTrampasLentas,
    renderizarTrampasLentas,
} from './trampas.js';
import { iniciarTrasgo, actualizarTrasgo, renderizarTrasgo } from './trasgo.js';
import { iniciarCountdown, actualizarVillanoElite, limpiarVillanoElite } from './villanoElite.js';
import { lanzarToast } from '../../componentes/toast.js';

import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearElemento, crearGameLoop } from '../../utils.js';
import { notificarVictoria } from '../../eventos.js';

// --- Crear pantalla HTML ---

function crearPantalla(esTouch) {
    const { pantalla } = crearPantallaJuego(
        'pantalla-laberinto',
        'juego-laberinto',
        CFG.meta.titulo,
        function () {
            limpiarLaberinto();
            est.callbackSalir();
        }
    );
    est.pantalla = pantalla;

    est.indicador = document.createElement('p');
    est.indicador.id = 'laberinto-indicador';

    est.contenedorLaberinto = document.createElement('div');
    est.contenedorLaberinto.id = 'laberinto';
    est.contenedorLaberinto.style.width = CONFIG.COLS * CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.style.height = CONFIG.FILAS * CONFIG.TAM_CELDA + 'px';

    // Jugador dentro del laberinto
    est.elementoJugador = document.createElement('div');
    est.elementoJugador.className = 'jugador-laberinto';
    est.elementoJugador.style.width = CONFIG.TAM_JUGADOR + 'px';
    est.elementoJugador.style.height = CONFIG.TAM_JUGADOR + 'px';
    const img = document.createElement('img');
    img.src = est.jugador.img;
    img.alt = est.jugador.nombre;
    est.elementoJugador.appendChild(img);
    est.elementoJugador.classList.add(est.jugador.clase);

    est.mensajeExito = document.createElement('p');
    est.mensajeExito.id = 'laberinto-mensaje';
    est.mensajeExito.classList.add('oculto');

    pantalla.appendChild(est.indicador);
    pantalla.appendChild(est.contenedorLaberinto);
    pantalla.appendChild(est.mensajeExito);

    if (!esTouch) {
        const hint = crearElemento(
            'p',
            'laberinto-hint',
            'Usa las flechas ← ↑ ↓ → para moverte · Esc para huir'
        );
        pantalla.appendChild(hint);
    }

    document.getElementById('juego').appendChild(pantalla);
}

// --- Funciones principales ---

/**
 * Inicia El Laberinto.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad
 */
export function iniciarLaberinto(jugadorRef, callback, dpadRef) {
    est.jugador = jugadorRef;
    est.callbackSalir = callback;
    est.tieneLlave = false;
    est.activo = true;

    // Escalar tamaño de celda al viewport
    calcularTamCelda();

    // Generar laberinto aleatorio
    est.mapa = generarMapa(CONFIG.FILAS, CONFIG.COLS, CONFIG.ATAJOS);

    // Entrada en la esquina inferior izquierda
    est.entradaFila = CONFIG.FILAS - 2;
    est.entradaCol = 1;

    // Colocar la llave en el punto más lejano de la entrada
    const puntoLlave = encontrarPuntoLejano(
        est.mapa,
        CONFIG.FILAS,
        CONFIG.COLS,
        est.entradaFila,
        est.entradaCol
    );
    est.llaveFila = puntoLlave[0];
    est.llaveCol = puntoLlave[1];

    // Colocar cuartos secretos (antes de trampas para reservar dead-ends)
    colocarCuartosSecretos();

    // Colocar trampas aleatorias
    colocarTrampas();
    colocarTrampasLentas();

    // Velocidad según atributo del personaje
    est.velocidadBase =
        CONFIG.VELOCIDAD * (est.jugador.velocidad / CFG.jugador.velocidadReferencia);
    est.velocidadActual = est.velocidadBase;
    if (est.timerLentitud) {
        clearTimeout(est.timerLentitud);
        est.timerLentitud = null;
    }

    // Escala visual según estatura (no afecta colisiones)
    est.escalaVisual =
        CFG.jugador.escalaVisualBase * (est.jugador.estatura / CFG.jugador.estaturaReferencia);

    // Crear e insertar la pantalla
    crearPantalla(!!dpadRef);

    // Renderizar el laberinto (sin enemigos aún)
    renderizarLaberinto();

    // Posicionar jugador en la entrada
    est.posX = est.entradaCol * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_JUGADOR) / 2;
    est.posY = est.entradaFila * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_JUGADOR) / 2;
    actualizarPosicion();

    // Resetear indicador
    est.indicador.replaceChildren();
    const imgIndicador = document.createElement('img');
    imgIndicador.src = 'assets/img/llaves/llave-laberinto.webp';
    imgIndicador.alt = '';
    imgIndicador.className = 'indicador-llave-img';
    est.indicador.appendChild(imgIndicador);
    est.indicador.appendChild(document.createTextNode(' ' + CFG.textos.indicadorBusqueda));
    est.indicador.classList.remove('llave-obtenida');
    est.mensajeExito.classList.add('oculto');

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Activar D-pad touch apuntando a las teclas del laberinto
    if (dpadRef) {
        dpadRef.setTeclasRef(est.teclas);
        dpadRef.mostrar();
    }

    // Exploración libre: enemigos aparecen tras el delay configurado
    est.timerAparicion = setTimeout(function () {
        if (!est.activo) return;
        iniciarTrasgo();
        renderizarTrasgo();
        iniciarCountdown();
    }, CFG.trasgo.delay * 1000);

    // Iniciar game loop
    gameLoop.iniciar();
}

// --- Renderizado ---

function renderizarLaberinto() {
    // Paredes: canvas estático (reemplaza ~280 divs por 1 canvas dibujado una sola vez)
    const tam = CONFIG.TAM_CELDA;
    const ancho = CONFIG.COLS * tam;
    const alto = CONFIG.FILAS * tam;
    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    canvas.className = 'laberinto-canvas';
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    canvas.style.width = ancho + 'px';
    canvas.style.height = alto + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Colores de pared desde CSS variables
    const styles = getComputedStyle(est.contenedorLaberinto);
    const colorPared = styles.getPropertyValue('--juego-pared').trim() || '#3d2560';
    const colorOscuro = styles.getPropertyValue('--juego-pared-oscuro').trim() || '#201035';
    const colorBorde = styles.getPropertyValue('--juego-borde').trim() || 'rgba(100,60,150,0.25)';

    // Gradiente global diagonal (simula iluminación)
    const grad = ctx.createLinearGradient(0, 0, ancho, alto);
    grad.addColorStop(0, colorPared);
    grad.addColorStop(1, colorOscuro);

    // Dibujar todas las paredes (valor >= 1: paredes normales y falsas)
    ctx.fillStyle = grad;
    for (let fila = 0; fila < CONFIG.FILAS; fila++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (est.mapa[fila][col] >= 1) {
                ctx.fillRect(col * tam, fila * tam, tam, tam);
            }
        }
    }

    // Bordes sutiles entre celdas
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 0.5;
    for (let fila = 0; fila < CONFIG.FILAS; fila++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (est.mapa[fila][col] >= 1) {
                ctx.strokeRect(col * tam + 0.5, fila * tam + 0.5, tam - 1, tam - 1);
            }
        }
    }

    est.contenedorLaberinto.appendChild(canvas);
    est.canvasMapa = canvas;
    est.ctxMapa = ctx;

    // Trampas (delegadas a submódulos, appenden al contenedor directamente)
    renderizarTrampas();
    renderizarTrampasLentas();
    renderizarCuartosSecretos();

    // Llave
    est.elementoLlave = document.createElement('div');
    est.elementoLlave.className = 'laberinto-llave';
    const imgLlave = document.createElement('img');
    imgLlave.src = 'assets/img/llaves/llave-laberinto.webp';
    imgLlave.alt = 'Llave';
    est.elementoLlave.appendChild(imgLlave);
    est.elementoLlave.style.left = est.llaveCol * CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.top = est.llaveFila * CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.width = CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.height = CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.appendChild(est.elementoLlave);

    // Salida
    const salida = document.createElement('div');
    salida.className = 'laberinto-salida';
    salida.textContent = '🚪';
    salida.style.left = est.entradaCol * CONFIG.TAM_CELDA + 'px';
    salida.style.top = est.entradaFila * CONFIG.TAM_CELDA + 'px';
    salida.style.width = CONFIG.TAM_CELDA + 'px';
    salida.style.height = CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.appendChild(salida);

    // Jugador (siempre al final para que quede encima)
    est.contenedorLaberinto.appendChild(est.elementoJugador);
}

// --- Movimiento con colisiones y corner sliding ---

function esPared(pixelX, pixelY) {
    const col = Math.floor(pixelX / CONFIG.TAM_CELDA);
    const fila = Math.floor(pixelY / CONFIG.TAM_CELDA);

    if (fila < 0 || fila >= CONFIG.FILAS || col < 0 || col >= CONFIG.COLS) {
        return true;
    }
    return est.mapa[fila][col] !== 0;
}

function hayColision(x, y) {
    return (
        esPared(x + CONFIG.MARGEN_COLISION, y + CONFIG.MARGEN_COLISION) ||
        esPared(x + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION, y + CONFIG.MARGEN_COLISION) ||
        esPared(x + CONFIG.MARGEN_COLISION, y + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION) ||
        esPared(
            x + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION,
            y + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION
        )
    );
}

function moverEnLaberinto(dx, dy) {
    // Mover por eje X
    if (dx !== 0) {
        const nuevaX = est.posX + dx;
        if (!hayColision(nuevaX, est.posY)) {
            est.posX = nuevaX;
        } else {
            for (let i = 1; i <= CONFIG.TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(nuevaX, est.posY - i)) {
                    est.posY -= i;
                    est.posX = nuevaX;
                    break;
                }
                if (!hayColision(nuevaX, est.posY + i)) {
                    est.posY += i;
                    est.posX = nuevaX;
                    break;
                }
            }
        }
    }

    // Mover por eje Y
    if (dy !== 0) {
        const nuevaY = est.posY + dy;
        if (!hayColision(est.posX, nuevaY)) {
            est.posY = nuevaY;
        } else {
            for (let i = 1; i <= CONFIG.TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(est.posX - i, nuevaY)) {
                    est.posX -= i;
                    est.posY = nuevaY;
                    break;
                }
                if (!hayColision(est.posX + i, nuevaY)) {
                    est.posX += i;
                    est.posY = nuevaY;
                    break;
                }
            }
        }
    }

    actualizarPosicion();
}

function actualizarPosicion() {
    est.elementoJugador.style.transform = `translate(${est.posX}px, ${est.posY}px) scale(${est.escalaVisual})`;
}

// --- Detección de llave y salida ---

function detectarLlave() {
    if (est.tieneLlave) return;

    const celda = getCeldaJugador();

    if (celda.fila === est.llaveFila && celda.col === est.llaveCol) {
        est.tieneLlave = true;

        est.elementoLlave.classList.add('llave-recogida');

        est.indicador.replaceChildren();
        const imgObtenida = document.createElement('img');
        imgObtenida.src = 'assets/img/llaves/llave-laberinto.webp';
        imgObtenida.alt = '';
        imgObtenida.className = 'indicador-llave-img';
        est.indicador.appendChild(imgObtenida);
        est.indicador.appendChild(document.createTextNode(' ' + CFG.textos.indicadorLlaveObtenida));
        est.indicador.classList.add('llave-obtenida');

        lanzarToast(CFG.textos.toastLlave, '\uD83D\uDD11', 'item');
    }
}

function detectarSalida() {
    if (!est.tieneLlave) return;

    const celda = getCeldaJugador();

    if (celda.fila === est.entradaFila && celda.col === est.entradaCol) {
        est.activo = false;
        est.mensajeExito.textContent = CFG.textos.mensajeExito;
        est.mensajeExito.classList.remove('oculto');
        lanzarToast(CFG.textos.mensajeExito, '🚪', 'exito');

        notificarVictoria();
        setTimeout(function () {
            limpiarLaberinto();
            est.callbackSalir();
        }, CFG.meta.timeoutExito);
    }
}

// --- Game loop ---

const gameLoop = crearGameLoop(function (_tiempo, _dt) {
    if (!est.activo) {
        gameLoop.detener();
        return;
    }

    let dx = 0;
    let dy = 0;

    if (est.teclas['ArrowUp']) dy -= est.velocidadActual;
    if (est.teclas['ArrowDown']) dy += est.velocidadActual;
    if (est.teclas['ArrowLeft']) dx -= est.velocidadActual;
    if (est.teclas['ArrowRight']) dx += est.velocidadActual;

    if (dx !== 0 || dy !== 0) {
        moverEnLaberinto(dx, dy);
    }

    actualizarTrampas();
    detectarTrampas();
    actualizarTrampasLentas();
    detectarTrampasLentas();
    actualizarTrasgo();
    actualizarVillanoElite();
    detectarLlave();
    detectarSalida();
    detectarProximidad();
    detectarEmpuje(dx, dy);
    detectarRecompensa();
});

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        est.teclas[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarLaberinto();
        est.callbackSalir();
    }
}

function onKeyUp(e) {
    delete est.teclas[e.key];
}

// --- Limpieza ---

/** Limpia y destruye El Laberinto */
export function limpiarLaberinto() {
    est.activo = false;
    if (est.timerAparicion) {
        clearTimeout(est.timerAparicion);
        est.timerAparicion = null;
    }
    est.trampas = [];
    est.trampasLentas = [];
    est.cuartosSecretos = [];
    est.trasgo = null;
    limpiarVillanoElite();
    est.velocidadActual = CONFIG.VELOCIDAD;
    if (est.timerLentitud) {
        clearTimeout(est.timerLentitud);
        est.timerLentitud = null;
    }

    gameLoop.detener();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    est.teclas = {};

    if (est.pantalla) {
        est.pantalla.remove();
        est.pantalla = null;
    }
}
