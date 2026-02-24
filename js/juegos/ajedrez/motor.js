// Motor de ajedrez — wrapper sobre js-chess-engine
// Maneja turnos, IA, estado del juego

import engine from './lib/chess-engine.js';

const { Game } = engine;

let game = null;
let nivelIA = 2;
let colorJugador = 'white';

/** Inicia una nueva partida */
export function nuevaPartida(nivel, color = 'white') {
    nivelIA = nivel;
    colorJugador = color;
    game = new Game();
}

/** Devuelve el estado actual del tablero */
export function obtenerEstado() {
    return game.exportJson();
}

/**
 * Mueve una pieza del jugador.
 * @param {string} desde - Casilla origen (ej: 'E2')
 * @param {string} hasta - Casilla destino (ej: 'E4')
 */
export function moverJugador(desde, hasta) {
    game.move(desde, hasta);
}

/**
 * La IA mueve.
 * @returns {{ desde: string, hasta: string }} el movimiento realizado
 */
export function moverIA() {
    const resultado = game.aiMove(nivelIA);
    const desde = Object.keys(resultado)[0];
    const hasta = resultado[desde];
    return { desde, hasta };
}

/**
 * Devuelve los movimientos validos para una casilla.
 * @param {string} casilla - Ej: 'E2'
 * @returns {string[]} casillas destino validas
 */
export function movimientosValidos(casilla) {
    const estado = game.exportJson();
    // El motor solo devuelve movimientos de la pieza en turno
    if (!estado.pieces[casilla]) return [];
    // Verificar que la pieza sea del color en turno
    const pieza = estado.pieces[casilla];
    const esBlanca = pieza === pieza.toUpperCase();
    if (estado.turn === 'white' && !esBlanca) return [];
    if (estado.turn === 'black' && esBlanca) return [];

    // game.moves(casilla) devuelve { "E2": ["E3","E4"] }
    try {
        const resultado = game.moves(casilla);
        return resultado[casilla.toUpperCase()] || [];
    } catch {
        return [];
    }
}

/** @returns {boolean} true si es turno del jugador */
export function esTurnoJugador() {
    return game.exportJson().turn === colorJugador;
}

/** @returns {'white'|'black'} el color del turno actual */
export function obtenerTurno() {
    return game.exportJson().turn;
}

/** @returns {boolean} true si hay jaque */
export function hayJaque() {
    return game.exportJson().check;
}

/** @returns {boolean} true si hay jaque mate */
export function hayJaqueMate() {
    return game.exportJson().checkMate;
}

/** @returns {boolean} true si hay tablas (ahogado) */
export function hayTablas() {
    return game.exportJson().staleMate;
}

/** @returns {boolean} true si la partida termino */
export function partidaTerminada() {
    return game.exportJson().isFinished;
}

/**
 * Promocion de peon: el motor maneja automaticamente.
 * Para el jugador se necesita elegir pieza.
 * Por ahora js-chess-engine promociona automaticamente a reina.
 * TODO: modal de seleccion si el motor lo permite.
 */
