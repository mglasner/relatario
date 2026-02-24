// El Memorice — Juego de memoria
// El jugador voltea cartas para encontrar pares de héroes y villanos

import { CFG } from './config.js';
import { generarTablero } from './tablero.js';
import { crearCarta } from './carta.js';
import { lanzarToast } from '../../componentes/toast.js';
import { notificarVidaCambio, notificarJugadorMuerto, notificarVictoria } from '../../eventos.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearElemento, crearTimeoutTracker } from '../../utils.js';

// --- Estado del módulo ---

let jugador = null;
let callbackSalir = null;
let pantalla = null;
const timeouts = crearTimeoutTracker();
let indicador = null;
let indicadorTexto = null;
let indicadorProgreso = null;
let cartas = [];

let primeraCarta = null;
let bloqueado = false;
let intentosRestantes = CFG.intentos.max;
let paresEncontrados = 0;
let toastAdvertenciaMostrado = false;
const totalPares = CFG.tablero.numHeroes + CFG.tablero.numVillanos;

// --- Crear pantalla HTML ---

function crearPantalla() {
    ({ pantalla } = crearPantallaJuego(
        'pantalla-memorice',
        'juego-memorice',
        CFG.meta.titulo,
        huir
    ));

    // Indicador de intentos
    indicador = document.createElement('div');
    indicador.id = 'memorice-indicador';

    indicadorTexto = crearElemento('span', 'memorice-indicador-texto');

    const barra = crearElemento('div', 'memorice-indicador-barra');

    indicadorProgreso = crearElemento('div', 'memorice-indicador-progreso');
    barra.appendChild(indicadorProgreso);

    indicador.appendChild(indicadorTexto);
    indicador.appendChild(barra);
    actualizarIndicador();

    // Grilla de cartas
    const grilla = crearElemento('div', 'memorice-grilla');

    cartas.forEach(function (carta) {
        grilla.appendChild(carta.el);
    });

    // Event delegation en la grilla
    grilla.addEventListener('click', onClickGrilla);

    pantalla.appendChild(indicador);
    pantalla.appendChild(grilla);

    document.getElementById('juego').appendChild(pantalla);
}

// --- Lógica del juego ---

function actualizarIndicador() {
    indicadorTexto.textContent = CFG.textos.indicador.replace('{restantes}', intentosRestantes);
    indicadorProgreso.style.width = (intentosRestantes / CFG.intentos.max) * 100 + '%';

    if (intentosRestantes <= CFG.intentos.alerta) {
        indicador.classList.add('memorice-alerta');
    } else {
        indicador.classList.remove('memorice-alerta');
    }

    // Toast de advertencia cuando quedan pocos turnos de margen
    const margen = intentosRestantes - (totalPares - paresEncontrados);
    if (margen <= CFG.intentos.margenAdvertencia && !toastAdvertenciaMostrado) {
        toastAdvertenciaMostrado = true;
        lanzarToast(CFG.textos.toastAdvertencia, '\u26A0\uFE0F', 'dano');
    }
}

// Curar al jugador un valor aleatorio entre min y max (sin exceder vidaMax)
function curar(min, max) {
    const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
    jugador.vidaActual = Math.min(jugador.vidaActual + cantidad, jugador.vidaMax);
    notificarVidaCambio();
    const texto = CFG.textos.toastCuracion.replace('{cantidad}', cantidad);
    lanzarToast(texto, '\uD83D\uDC9A', 'exito');
}

// Derrota inminente: no alcanzan los intentos para los pares que faltan
function derrotaInminente() {
    const paresRestantes = totalPares - paresEncontrados;
    return intentosRestantes < paresRestantes;
}

function onClickGrilla(e) {
    if (bloqueado) return;

    // Buscar la carta clickeada (event delegation)
    const elCarta = e.target.closest('.memorice-carta');
    if (!elCarta) return;

    const carta = cartas.find(function (c) {
        return c.el === elCarta;
    });
    if (!carta || carta.volteada || carta.encontrada) return;

    carta.voltear();

    if (!primeraCarta) {
        // Primera carta del intento
        primeraCarta = carta;
        return;
    }

    // Segunda carta del intento
    const segunda = carta;
    bloqueado = true;

    if (primeraCarta.data.pairId === segunda.data.pairId) {
        // Match
        primeraCarta.marcarEncontrada();
        segunda.marcarEncontrada();
        paresEncontrados++;
        lanzarToast(CFG.textos.toastMatch, '\u2728', 'exito');

        // Curar al jugador al encontrar un par
        curar(CFG.curacion.parMin, CFG.curacion.parMax);

        intentosRestantes--;
        actualizarIndicador();
        primeraCarta = null;
        bloqueado = false;

        // Victoria o derrota inminente
        if (paresEncontrados >= totalPares) {
            victoria();
        } else if (derrotaInminente()) {
            derrota();
        }
    } else {
        // No match — voltear de vuelta después de un delay
        const primera = primeraCarta;
        primeraCarta = null;

        timeouts.set(function () {
            primera.deshacer();
            segunda.deshacer();

            intentosRestantes--;
            actualizarIndicador();
            bloqueado = false;

            // Derrota inminente
            if (derrotaInminente()) {
                derrota();
            }
        }, CFG.tiempos.noMatch);
    }
}

function victoria() {
    // Curación bonus por ganar la partida
    curar(CFG.curacion.victoriaMin, CFG.curacion.victoriaMax);

    notificarVictoria();
    lanzarToast(CFG.textos.toastVictoria, '\u2728', 'exito');

    timeouts.set(function () {
        limpiarMemorice();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function derrota() {
    cartas.forEach(function (c) {
        c.desactivar();
    });
    notificarJugadorMuerto();
}

function huir() {
    limpiarMemorice();
    callbackSalir();
}

// --- Handler de teclado ---

function onKeyDown(e) {
    if (e.key === 'Escape') {
        huir();
    }
}

// --- API pública ---

/**
 * Inicia El Memorice.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad (se oculta en este modo)
 */
export function iniciarMemorice(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    primeraCarta = null;
    bloqueado = false;
    intentosRestantes = CFG.intentos.max;
    paresEncontrados = 0;
    toastAdvertenciaMostrado = false;

    // Ocultar D-pad (no se necesita en el memorice)
    if (dpadRef) {
        dpadRef.ocultar();
    }

    // Generar tablero con cartas mezcladas
    const datosCartas = generarTablero(CFG.tablero.numHeroes, CFG.tablero.numVillanos);
    cartas = datosCartas.map(function (data) {
        return crearCarta(data);
    });

    // Crear pantalla
    crearPantalla();

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
}

/** Limpia y destruye El Memorice */
export function limpiarMemorice() {
    timeouts.limpiar();
    document.removeEventListener('keydown', onKeyDown);

    if (pantalla) {
        pantalla.remove();
        pantalla = null;
    }

    cartas = [];
    primeraCarta = null;
    bloqueado = false;
    indicador = null;
    indicadorTexto = null;
    indicadorProgreso = null;
}
