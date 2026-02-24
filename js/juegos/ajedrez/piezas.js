// Mapeo de piezas: asigna villanos por tier al equipo enemigo
// y heroes a las piezas del jugador
// Cada partida genera un equipo distinto al azar

import { ENEMIGOS } from '../../enemigos.js';
import { PERSONAJES } from '../../personajes.js';

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
    const { esbirros, elites, pesadillasM, pesadillasF } = obtenerPersonajesPorTier();

    // Peones: 1 esbirro al azar
    const peon = barajar(esbirros)[0];

    // Torres, caballos, alfiles: 3 elite distintos al azar
    const [torre, caballo, alfil] = barajar(elites);

    // Rey y Reina: pesadilla por genero
    const rey = barajar(pesadillasM)[0];
    const reina = barajar(pesadillasF)[0];

    return { peon, torre, caballo, alfil, rey, reina };
}

/**
 * Genera un equipo aleatorio de heroes como pre-seleccion.
 * Rey siempre masculino, reina siempre femenina.
 * @returns {{ peon, torre, caballo, alfil, rey, reina }} heroes asignados
 */
export function generarEquipoHeroes() {
    const todos = Object.values(PERSONAJES);
    const masculinos = barajar(
        todos.filter(function (p) {
            return p.genero === 'masculino';
        })
    );
    const femeninos = barajar(
        todos.filter(function (p) {
            return p.genero === 'femenino';
        })
    );

    const rey = masculinos[0];
    const reina = femeninos[0];

    // Resto: todos los que no son rey ni reina, barajados
    const usados = [rey.nombre, reina.nombre];
    const resto = barajar(
        todos.filter(function (p) {
            return !usados.includes(p.nombre);
        })
    );
    const [h1, h2, h3, h4] = resto;

    return { rey, reina, torre: h1, alfil: h2, caballo: h3, peon: h4 };
}

/**
 * Devuelve los enemigos agrupados por tier para el panel de ejercito.
 * @returns {{ esbirros, elites, pesadillasM, pesadillasF }}
 */
export function obtenerPersonajesPorTier() {
    const lista = Object.values(ENEMIGOS);
    return {
        esbirros: lista.filter(function (e) {
            return e.tier === 'esbirro';
        }),
        elites: lista.filter(function (e) {
            return e.tier === 'elite';
        }),
        pesadillasM: lista.filter(function (e) {
            return e.tier === 'pesadilla' && e.genero === 'masculino';
        }),
        pesadillasF: lista.filter(function (e) {
            return e.tier === 'pesadilla' && e.genero === 'femenino';
        }),
    };
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

// Mapa de letra de pieza → rol en el equipo
const MAPA_ROL = {
    P: 'peon',
    R: 'torre',
    N: 'caballo',
    B: 'alfil',
    K: 'rey',
    Q: 'reina',
};

/**
 * Devuelve la imagen para una pieza. Todas las piezas tienen avatar.
 * @param {string} codigo - Letra de la pieza (K, Q, R, B, N, P mayusc o minusc)
 * @param {Object} equipoVillanos - Equipo enemigo { peon, torre, caballo, alfil, rey, reina }
 * @param {Object} equipoHeroes - Equipo heroe { peon, torre, caballo, alfil, rey, reina }
 * @param {string} [colorJugador='white'] - Color del jugador ('white' o 'black')
 * @returns {{ tipo: 'img', valor: string, nombre: string, badge: string }}
 */
export function resolverPieza(codigo, equipoVillanos, equipoHeroes, colorJugador = 'white') {
    const esNegra = codigo === codigo.toLowerCase();
    const letra = codigo.toUpperCase();
    const esEnemigo = colorJugador === 'white' ? esNegra : !esNegra;
    const rol = MAPA_ROL[letra];
    const badge = SIMBOLOS[letra];

    if (esEnemigo) {
        const villano = equipoVillanos[rol];
        return { tipo: 'img', valor: villano.img, nombre: villano.nombre, badge };
    }

    // Piezas del jugador: TODAS tienen avatar ahora
    const heroe = equipoHeroes[rol];
    return { tipo: 'img', valor: heroe.img, nombre: heroe.nombre, badge };
}
