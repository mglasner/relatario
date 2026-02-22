// Tablero de ajedrez — renderizado DOM con CSS Grid
// Grilla 8x8, piezas como img/span, indicadores visuales

import { crearElemento } from '../../utils.js';
import { resolverPieza } from './piezas.js';

const COLUMNAS_BASE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const FILAS_BASE = [8, 7, 6, 5, 4, 3, 2, 1];

/**
 * Crea el tablero DOM.
 * @param {Object} opciones
 * @param {Object} opciones.equipo - Equipo enemigo (de generarEquipoEnemigo)
 * @param {Object} opciones.jugador - Personaje del jugador
 * @param {string} [opciones.colorJugador='white'] - Color del jugador
 * @param {Function} opciones.onClickCelda - Callback (casilla: string)
 * @returns {{ contenedor: HTMLElement, actualizar: Function, resaltarMovimientos: Function, limpiarResaltado: Function, marcarUltimoMovimiento: Function, animarMovimiento: Function, indicarJaque: Function }}
 */
export function crearTablero({ equipo, jugador, colorJugador = 'white', onClickCelda }) {
    // Orientacion del tablero segun color del jugador
    const esNegro = colorJugador === 'black';
    const COLUMNAS = esNegro ? [...COLUMNAS_BASE].reverse() : COLUMNAS_BASE;
    const FILAS = esNegro ? [...FILAS_BASE].reverse() : FILAS_BASE;

    const contenedor = crearElemento('div', 'ajedrez-tablero-wrap');

    // Grilla del tablero
    const grilla = crearElemento('div', 'ajedrez-grilla');
    const celdas = {};

    for (const fila of FILAS) {
        for (const col of COLUMNAS) {
            const casilla = col + fila;
            const esClara = (COLUMNAS_BASE.indexOf(col) + fila) % 2 === 1;
            const celda = crearElemento('div', 'ajedrez-celda');
            celda.classList.add(esClara ? 'ajedrez-clara' : 'ajedrez-oscura');
            celda.dataset.casilla = casilla;
            celda.addEventListener('click', function () {
                onClickCelda(casilla);
            });
            grilla.appendChild(celda);
            celdas[casilla] = celda;
        }
    }

    // Coordenadas
    const coordsAbajo = crearElemento('div', 'ajedrez-coords ajedrez-coords-col');
    COLUMNAS.forEach(function (col) {
        coordsAbajo.appendChild(crearElemento('span', null, col.toLowerCase()));
    });

    const coordsIzq = crearElemento('div', 'ajedrez-coords ajedrez-coords-fila');
    FILAS.forEach(function (fila) {
        coordsIzq.appendChild(crearElemento('span', null, String(fila)));
    });

    contenedor.appendChild(coordsIzq);
    contenedor.appendChild(grilla);
    contenedor.appendChild(coordsAbajo);

    // --- Piezas capturadas ---
    const capturasEnemigo = crearElemento('div', 'ajedrez-capturas');
    const capturasJugador = crearElemento('div', 'ajedrez-capturas');

    const panelCapturas = crearElemento('div', 'ajedrez-panel-capturas');
    panelCapturas.appendChild(capturasEnemigo);
    panelCapturas.appendChild(capturasJugador);
    contenedor.appendChild(panelCapturas);

    // Seguimiento de capturas
    let piezasAnterior = {};

    function esEnemigo(codigo) {
        const esNegra = codigo === codigo.toLowerCase();
        return colorJugador === 'white' ? esNegra : !esNegra;
    }

    /** Renderiza las piezas en el tablero segun el estado del motor */
    function actualizar(estado) {
        // Detectar capturas comparando con estado anterior
        detectarCapturas(estado.pieces);
        piezasAnterior = { ...estado.pieces };

        for (const casilla of Object.keys(celdas)) {
            const celda = celdas[casilla];
            // Limpiar pieza anterior
            const piezaAnterior = celda.querySelector('.ajedrez-pieza');
            if (piezaAnterior) piezaAnterior.remove();

            const codigo = estado.pieces[casilla];
            if (!codigo) continue;

            const info = resolverPieza(codigo, equipo, jugador, colorJugador);
            const el = crearElementoPieza(info, codigo);
            celda.appendChild(el);
        }
    }

    function crearElementoPieza(info, codigo) {
        if (info.tipo === 'img') {
            const wrap = crearElemento('div', 'ajedrez-pieza ajedrez-pieza-wrap');
            const img = document.createElement('img');
            img.src = info.valor;
            img.alt = info.nombre;
            img.className = 'ajedrez-pieza-img';
            img.draggable = false;
            if (esEnemigo(codigo)) img.classList.add('ajedrez-pieza-enemiga');
            wrap.appendChild(img);

            if (info.badge) {
                const badge = crearElemento('span', 'ajedrez-pieza-badge', info.badge);
                if (esEnemigo(codigo)) {
                    badge.classList.add('ajedrez-badge-enemigo');
                } else if (codigo === codigo.toLowerCase()) {
                    badge.classList.add('ajedrez-badge-negro');
                }
                wrap.appendChild(badge);
            }
            return wrap;
        }
        const span = crearElemento('span', 'ajedrez-pieza ajedrez-pieza-simbolo', info.valor);
        if (codigo === codigo.toLowerCase()) {
            span.classList.add('ajedrez-pieza-negra');
        }
        return span;
    }

    function detectarCapturas(piezasNuevas) {
        // Comparar piezas anteriores con nuevas para detectar capturas
        if (Object.keys(piezasAnterior).length === 0) return;

        const anteriores = {};
        for (const [, codigo] of Object.entries(piezasAnterior)) {
            anteriores[codigo] = (anteriores[codigo] || 0) + 1;
        }
        const nuevas = {};
        for (const [, codigo] of Object.entries(piezasNuevas)) {
            nuevas[codigo] = (nuevas[codigo] || 0) + 1;
        }

        // Piezas que desaparecieron
        for (const [codigo, cantidad] of Object.entries(anteriores)) {
            const cantNueva = nuevas[codigo] || 0;
            for (let i = 0; i < cantidad - cantNueva; i++) {
                agregarCaptura(codigo);
            }
        }
    }

    function agregarCaptura(codigo) {
        const info = resolverPieza(codigo, equipo, jugador, colorJugador);
        const el = crearElementoPieza(info, codigo);
        el.classList.add('ajedrez-captura-miniatura');

        if (esEnemigo(codigo)) {
            capturasEnemigo.appendChild(el);
        } else {
            capturasJugador.appendChild(el);
        }
    }

    function resaltarMovimientos(casillas) {
        casillas.forEach(function (casilla) {
            if (celdas[casilla]) {
                celdas[casilla].classList.add('ajedrez-movimiento-valido');
            }
        });
    }

    function resaltarSeleccion(casilla) {
        if (celdas[casilla]) {
            celdas[casilla].classList.add('ajedrez-seleccionada');
        }
    }

    function limpiarResaltado() {
        Object.values(celdas).forEach(function (celda) {
            celda.classList.remove('ajedrez-movimiento-valido', 'ajedrez-seleccionada');
        });
    }

    function marcarUltimoMovimiento(desde, hasta) {
        // Limpiar marcas anteriores de ultimo movimiento
        Object.values(celdas).forEach(function (celda) {
            celda.classList.remove('ajedrez-ultimo-desde', 'ajedrez-ultimo-hasta');
        });
        if (celdas[desde]) celdas[desde].classList.add('ajedrez-ultimo-desde');
        if (celdas[hasta]) celdas[hasta].classList.add('ajedrez-ultimo-hasta');
    }

    function indicarJaque(esJaque, turno) {
        Object.values(celdas).forEach(function (celda) {
            celda.classList.remove('ajedrez-jaque');
        });
        if (!esJaque) return;

        // Buscar el rey del turno actual (es quien esta en jaque)
        // turno = 'white' o 'black', rey blanco = 'K', negro = 'k'
        const reyBuscado = turno === 'white' ? 'K' : 'k';
        for (const [casilla, codigo] of Object.entries(piezasAnterior)) {
            if (codigo === reyBuscado && celdas[casilla]) {
                celdas[casilla].classList.add('ajedrez-jaque');
                break;
            }
        }
    }

    /**
     * Anima el movimiento de una pieza de una celda a otra.
     * @returns {Promise} se resuelve cuando termina la animacion
     */
    function animarMovimiento(desde, hasta) {
        return new Promise(function (resolve) {
            const celdaDesde = celdas[desde];
            const celdaHasta = celdas[hasta];
            if (!celdaDesde || !celdaHasta) {
                resolve();
                return;
            }

            const pieza = celdaDesde.querySelector('.ajedrez-pieza');
            if (!pieza) {
                resolve();
                return;
            }

            // Calcular desplazamiento
            const rectDesde = celdaDesde.getBoundingClientRect();
            const rectHasta = celdaHasta.getBoundingClientRect();
            const dx = rectHasta.left - rectDesde.left;
            const dy = rectHasta.top - rectDesde.top;

            pieza.style.transition = 'transform 0.25s ease';
            pieza.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
            pieza.style.zIndex = '10';

            pieza.addEventListener(
                'transitionend',
                function () {
                    pieza.style.transition = '';
                    pieza.style.transform = '';
                    pieza.style.zIndex = '';
                    resolve();
                },
                { once: true }
            );
        });
    }

    return {
        contenedor,
        actualizar,
        resaltarMovimientos,
        resaltarSeleccion,
        limpiarResaltado,
        marcarUltimoMovimiento,
        animarMovimiento,
        indicarJaque,
    };
}
