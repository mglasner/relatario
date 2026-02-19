// Habitación 3 — El Memorice
// El jugador voltea cartas para encontrar pares de héroes y villanos

import { CONFIG } from './config.js';
import { generarTablero } from './tablero.js';
import { crearCarta } from './carta.js';
import { lanzarToast } from '../../componentes/toast.js';

// --- Estado del módulo ---

let jugador = null;
let callbackSalir = null;
let pantalla = null;
let indicador = null;
let cartas = [];

let primeraCarta = null;
let bloqueado = false;
let intentosRestantes = CONFIG.intentosMax;
let paresEncontrados = 0;
const totalPares = CONFIG.numHeroes + CONFIG.numVillanos;

// --- Crear pantalla HTML ---

function crearPantalla() {
    pantalla = document.createElement('div');
    pantalla.id = 'pantalla-habitacion3';
    pantalla.className = 'habitacion-3';

    // Cabecera: botón huir + título
    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-habitacion';

    const btnHuir = document.createElement('button');
    btnHuir.className = 'btn-huir';
    btnHuir.innerHTML = '<span class="btn-huir-flecha">\u2190</span> \uD83D\uDEAA';
    btnHuir.title = 'Huir al pasillo (Esc)';
    btnHuir.addEventListener('click', huir);

    const titulo = document.createElement('h2');
    titulo.className = 'titulo-habitacion';
    titulo.textContent = CONFIG.meta.titulo;

    cabecera.appendChild(btnHuir);
    cabecera.appendChild(titulo);

    // Indicador de intentos
    indicador = document.createElement('p');
    indicador.id = 'memorice-indicador';
    actualizarIndicador();

    // Grilla de cartas
    const grilla = document.createElement('div');
    grilla.className = 'memorice-grilla';

    cartas.forEach(function (carta) {
        grilla.appendChild(carta.el);
    });

    // Event delegation en la grilla
    grilla.addEventListener('click', onClickGrilla);

    pantalla.appendChild(cabecera);
    pantalla.appendChild(indicador);
    pantalla.appendChild(grilla);

    document.getElementById('juego').appendChild(pantalla);
}

// --- Lógica del juego ---

function actualizarIndicador() {
    indicador.textContent = CONFIG.textos.indicador(intentosRestantes);

    if (intentosRestantes <= CONFIG.intentosAlerta) {
        indicador.classList.add('memorice-alerta');
    } else {
        indicador.classList.remove('memorice-alerta');
    }
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
        lanzarToast(CONFIG.textos.toastMatch, '\u2728', 'exito');

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

        setTimeout(function () {
            primera.deshacer();
            segunda.deshacer();

            intentosRestantes--;
            actualizarIndicador();
            bloqueado = false;

            // Derrota inminente
            if (derrotaInminente()) {
                derrota();
            }
        }, CONFIG.tiempoNoMatch);
    }
}

function victoria() {
    jugador.inventario.push(CONFIG.meta.itemInventario);
    document.dispatchEvent(new Event('inventario-cambio'));
    lanzarToast(CONFIG.textos.toastVictoria, '\uD83D\uDD11', 'item');

    setTimeout(function () {
        limpiarHabitacion3();
        callbackSalir();
    }, CONFIG.tiempoVictoria);
}

function derrota() {
    cartas.forEach(function (c) {
        c.desactivar();
    });
    document.dispatchEvent(new Event('jugador-muerto'));
}

function huir() {
    limpiarHabitacion3();
    callbackSalir();
}

// --- Handler de teclado ---

function onKeyDown(e) {
    if (e.key === 'Escape') {
        huir();
    }
}

// --- API pública ---

export function iniciarHabitacion3(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    primeraCarta = null;
    bloqueado = false;
    intentosRestantes = CONFIG.intentosMax;
    paresEncontrados = 0;

    // Ocultar D-pad (no se necesita en el memorice)
    if (dpadRef) {
        dpadRef.ocultar();
    }

    // Generar tablero con cartas mezcladas
    const datosCartas = generarTablero(CONFIG.numHeroes, CONFIG.numVillanos);
    cartas = datosCartas.map(function (data) {
        return crearCarta(data);
    });

    // Crear pantalla
    crearPantalla();

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
}

export function limpiarHabitacion3() {
    document.removeEventListener('keydown', onKeyDown);

    if (pantalla && pantalla.parentNode) {
        pantalla.parentNode.removeChild(pantalla);
        pantalla = null;
    }

    cartas = [];
    primeraCarta = null;
    bloqueado = false;
    indicador = null;
}
