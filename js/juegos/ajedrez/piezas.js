// Mapeo de piezas: asigna villanos por tier al equipo enemigo
// Cada partida genera un equipo distinto al azar

import { ENEMIGOS } from '../../enemigos.js';

function barajar(arr) {
    const copia = [...arr];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

/**
 * Genera el equipo enemigo al azar por tier/genero.
 * @returns {{ peon, torre, caballo, alfil, rey, reina }} villanos asignados
 */
export function generarEquipoEnemigo() {
    const lista = Object.values(ENEMIGOS);
    const esbirros = lista.filter(function (e) {
        return e.tier === 'esbirro';
    });
    const elites = lista.filter(function (e) {
        return e.tier === 'elite';
    });
    const pesadillasM = lista.filter(function (e) {
        return e.tier === 'pesadilla' && e.genero === 'masculino';
    });
    const pesadillasF = lista.filter(function (e) {
        return e.tier === 'pesadilla' && e.genero === 'femenino';
    });

    // Peones: 1 esbirro al azar
    const peon = barajar(esbirros)[0];

    // Torres, caballos, alfiles: 3 elite distintos al azar
    const [torre, caballo, alfil] = barajar(elites);

    // Rey y Reina: pesadilla por genero
    const rey = barajar(pesadillasM)[0];
    const reina = barajar(pesadillasF)[0];

    return { peon, torre, caballo, alfil, rey, reina };
}

// Letras de piezas en js-chess-engine: mayusc = blancas, minusc = negras
// K/k = king, Q/q = queen, R/r = rook, N/n = knight, B/b = bishop, P/p = pawn

// Simbolos Unicode de piezas rellenas
const SIMBOLOS = {
    K: '\u265A',
    Q: '\u265B',
    R: '\u265C',
    B: '\u265D',
    N: '\u265E',
    P: '\u265F',
};

/**
 * Devuelve la imagen o simbolo para una pieza.
 * @param {string} codigo - Letra de la pieza (K, Q, R, B, N, P mayusc o minusc)
 * @param {Object} equipo - Resultado de generarEquipoEnemigo()
 * @param {Object} jugador - Personaje del jugador
 * @param {string} [colorJugador='white'] - Color del jugador ('white' o 'black')
 * @returns {{ tipo: 'img'|'simbolo', valor: string, nombre: string, badge?: string }}
 */
export function resolverPieza(codigo, equipo, jugador, colorJugador = 'white') {
    const esNegra = codigo === codigo.toLowerCase();
    const letra = codigo.toUpperCase();
    const esEnemigo = colorJugador === 'white' ? esNegra : !esNegra;

    if (esEnemigo) {
        // Piezas enemigas: usar avatar del villano
        const mapa = {
            P: equipo.peon,
            R: equipo.torre,
            N: equipo.caballo,
            B: equipo.alfil,
            K: equipo.rey,
            Q: equipo.reina,
        };
        const villano = mapa[letra];
        const badge = SIMBOLOS[letra];
        return { tipo: 'img', valor: villano.img, nombre: villano.nombre, badge };
    }

    // Piezas del jugador: el jugador es Rey o Reina segun genero
    const esReyJugador = jugador.genero === 'masculino' ? letra === 'K' : letra === 'Q';
    if (esReyJugador) {
        const badge = SIMBOLOS[letra];
        return { tipo: 'img', valor: jugador.img, nombre: jugador.nombre, badge };
    }

    return { tipo: 'simbolo', valor: SIMBOLOS[letra], nombre: letra };
}
