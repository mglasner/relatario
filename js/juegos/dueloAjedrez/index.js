// El Duelo de Ajedrez — Humano vs Humano (hot-seat)
// Flujo: Ejército héroes → Ejército villanos → Partida

import { CFG } from './config.js';
import { PERSONAJES } from '../../personajes.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { lanzarToast } from '../../componentes/toast.js';
import { crearElemento } from '../../utils.js';
import { notificarVidaCambio } from '../../eventos.js';
import {
    generarEquipoEnemigo,
    generarEquipoHeroes,
    obtenerPersonajesPorTier,
} from '../ajedrez-comun/piezas.js';
import { crearModoPortrait } from '../../componentes/modoPortrait.js';
import { crearTablero } from '../ajedrez-comun/tablero.js';
import { crearPanelEjercito } from '../ajedrez-comun/ejercito.js';
import {
    nuevaPartida,
    obtenerEstado,
    moverJugador,
    movimientosValidos,
    obtenerTurno,
    hayJaque,
    hayJaqueMate,
    hayTablas,
    partidaTerminada,
} from '../ajedrez-comun/motor.js';

// --- Estado del modulo ---

let jugador = null;
let callbackSalir = null;
let pantalla = null;
let tablero = null;
let bloqueado = false;
let casillaSeleccionada = null;
let movimientosDisponibles = [];
let timeoutFin = null;
let equipoHeroes = null;
let equipoVillanos = null;
let modoPortrait = null;
let modalTablas = null;
let modalRendicion = null;

// Color fijo: J1 siempre blancas (heroes)
const COLOR_JUGADOR = 'white';

// --- Selector de ejercitos ---

function crearSelectorInicial(onElegir, onVolver) {
    const overlay = crearElemento('div', 'ajedrez-dificultad-overlay');
    const panel = crearElemento('div', 'ajedrez-dificultad-panel');

    // --- Pantalla 1: Ejercito Heroes ---
    const pantalla1 = crearElemento('div', 'ajedrez-selector-pantalla');
    panel.appendChild(pantalla1);

    // --- Pantalla 2: Ejercito Villanos ---
    const pantalla2 = crearElemento('div', 'ajedrez-selector-pantalla oculto');
    panel.appendChild(pantalla2);

    function mostrarPanelHeroes() {
        pantalla1.innerHTML = '';
        const presel = generarEquipoHeroes();
        const todosHeroes = Object.values(PERSONAJES);
        const masculinos = todosHeroes.filter(function (p) {
            return p.genero === 'masculino';
        });
        const femeninos = todosHeroes.filter(function (p) {
            return p.genero === 'femenino';
        });
        const restricciones = {
            rey: masculinos,
            reina: femeninos,
            torre: todosHeroes,
            alfil: todosHeroes,
            caballo: todosHeroes,
            peon: todosHeroes,
        };

        const { panel: panelEj, obtenerEquipo } = crearPanelEjercito(
            'Héroes, armen su ejército',
            restricciones,
            presel
        );
        pantalla1.appendChild(panelEj);

        // Acciones: Volver al libro + Siguiente
        const acciones = crearElemento('div', 'ajedrez-acciones');

        const btnVolver = crearElemento(
            'button',
            'ajedrez-btn-iniciar ajedrez-btn-volver',
            'Volver'
        );
        btnVolver.type = 'button';
        btnVolver.addEventListener('click', onVolver);
        acciones.appendChild(btnVolver);

        const btnSig = crearElemento('button', 'ajedrez-btn-iniciar', 'Siguiente \u2192');
        btnSig.type = 'button';
        btnSig.addEventListener('click', function () {
            equipoHeroes = obtenerEquipo();
            pantalla1.classList.add('oculto');
            mostrarPanelVillanos();
        });
        acciones.appendChild(btnSig);
        pantalla1.appendChild(acciones);
    }

    function mostrarPanelVillanos() {
        pantalla2.innerHTML = '';
        const tiers = obtenerPersonajesPorTier();
        const restricciones = {
            rey: tiers.pesadillasM,
            reina: tiers.pesadillasF,
            torre: tiers.elites,
            alfil: tiers.elites,
            caballo: tiers.elites,
            peon: tiers.esbirros,
        };
        const presel = generarEquipoEnemigo();

        const { panel: panelEj, obtenerEquipo } = crearPanelEjercito(
            'Villanos, armen su ejército',
            restricciones,
            presel
        );
        pantalla2.appendChild(panelEj);

        // Acciones: Volver + Jugar
        const acciones = crearElemento('div', 'ajedrez-acciones');

        const btnVolver = crearElemento(
            'button',
            'ajedrez-btn-iniciar ajedrez-btn-volver',
            'Volver'
        );
        btnVolver.type = 'button';
        btnVolver.addEventListener('click', function () {
            pantalla2.classList.add('oculto');
            pantalla1.classList.remove('oculto');
        });
        acciones.appendChild(btnVolver);

        const btnJugar = crearElemento('button', 'ajedrez-btn-iniciar', 'Jugar');
        btnJugar.type = 'button';
        btnJugar.addEventListener('click', function () {
            equipoVillanos = obtenerEquipo();
            overlay.remove();
            onElegir(equipoHeroes, equipoVillanos);
        });
        acciones.appendChild(btnJugar);
        pantalla2.appendChild(acciones);
        pantalla2.classList.remove('oculto');
    }

    mostrarPanelHeroes();
    overlay.appendChild(panel);
    return overlay;
}

// --- Logica de clics ---

function onClickCelda(casilla) {
    if (bloqueado) return;

    // Si hay una pieza seleccionada y el clic es en un movimiento valido
    if (casillaSeleccionada && movimientosDisponibles.includes(casilla)) {
        ejecutarMovimientoJugador(casillaSeleccionada, casilla);
        return;
    }

    // Si hace clic en la misma casilla, deseleccionar
    if (casillaSeleccionada === casilla) {
        deseleccionar();
        return;
    }

    // Intentar seleccionar una pieza propia
    const estado = obtenerEstado();
    const pieza = estado.pieces[casilla];
    if (!pieza) {
        deseleccionar();
        return;
    }

    // Validar que la pieza sea del turno actual
    const turnoActual = obtenerTurno();
    const esBlanca = pieza === pieza.toUpperCase();
    const esDelTurno = turnoActual === 'white' ? esBlanca : !esBlanca;
    if (!esDelTurno) {
        deseleccionar();
        return;
    }

    const movs = movimientosValidos(casilla);
    if (movs.length === 0) {
        deseleccionar();
        return;
    }

    // Seleccionar pieza y mostrar movimientos
    tablero.limpiarResaltado();
    casillaSeleccionada = casilla;
    movimientosDisponibles = movs;
    tablero.resaltarSeleccion(casilla);
    tablero.resaltarMovimientos(movs);
}

function deseleccionar() {
    casillaSeleccionada = null;
    movimientosDisponibles = [];
    if (tablero) tablero.limpiarResaltado();
}

async function ejecutarMovimientoJugador(desde, hasta) {
    bloqueado = true;
    deseleccionar();

    await tablero.animarMovimiento(desde, hasta);

    moverJugador(desde, hasta);

    const estado = obtenerEstado();
    tablero.actualizar(estado);
    tablero.marcarUltimoMovimiento(desde, hasta);

    if (verificarFinPartida()) return;

    if (hayJaque()) {
        tablero.indicarJaque(true, estado.turn);
        lanzarToast(CFG.textos.toastJaque, '\u265A', 'dano');
    } else {
        tablero.indicarJaque(false);
    }

    tablero.marcarTurno(obtenerTurno());
    bloqueado = false;
}

function verificarFinPartida() {
    if (hayJaqueMate()) {
        // En HvH, el turno queda en quien esta en mate (el que perdio)
        const turno = obtenerTurno();
        if (turno === 'black') {
            victoriaHvH('heroes');
        } else {
            victoriaHvH('villanos');
        }
        return true;
    }
    if (hayTablas() || partidaTerminada()) {
        tablas();
        return true;
    }
    return false;
}

function victoriaHvH(bando) {
    bloqueado = true;
    const texto =
        bando === 'heroes' ? CFG.textos.toastVictoriaHeroes : CFG.textos.toastVictoriaVillanos;
    lanzarToast(texto, '\u2728', 'exito');

    timeoutFin = setTimeout(function () {
        limpiarDueloAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function tablas() {
    bloqueado = true;
    lanzarToast(CFG.textos.toastTablas, '\u00BD', 'item');

    timeoutFin = setTimeout(function () {
        limpiarDueloAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function huir() {
    limpiarDueloAjedrez();
    callbackSalir();
}

// --- Grupo de botones HvH (tablas + rendirse) ---

function crearGrupoBtns(esVillanos) {
    const bando = esVillanos ? 'villanos' : 'heroes';
    const grupo = crearElemento('div', 'ajedrez-grupo-btns ajedrez-grupo-btns-' + bando);

    // Boton tablas
    const btnTablas = crearElemento('button', 'ajedrez-btn-accion-hvh');
    btnTablas.type = 'button';
    btnTablas.title = CFG.textos.ofrecerTablas;
    btnTablas.setAttribute('aria-label', CFG.textos.ofrecerTablas);
    btnTablas.textContent = '\u00BD';
    btnTablas.addEventListener('click', function () {
        ofrecerTablas(bando);
    });
    grupo.appendChild(btnTablas);

    // Boton rendirse
    const btnRendirse = crearElemento('button', 'ajedrez-btn-accion-hvh ajedrez-btn-rendirse');
    btnRendirse.type = 'button';
    btnRendirse.title = CFG.textos.rendirse;
    btnRendirse.setAttribute('aria-label', CFG.textos.rendirse);
    btnRendirse.textContent = '\u{1F3F3}';
    btnRendirse.addEventListener('click', function () {
        ofrecerRendicion(bando);
    });
    grupo.appendChild(btnRendirse);

    return grupo;
}

function ofrecerTablas(bando) {
    if (bloqueado || modalTablas) return;
    bloqueado = true;

    const texto =
        bando === 'heroes' ? CFG.textos.heroesOfrecenTablas : CFG.textos.villanosOfrecenTablas;

    modalTablas = crearElemento('div', 'ajedrez-modal-tablas-overlay');
    const caja = crearElemento('div', 'ajedrez-modal-tablas');

    caja.appendChild(crearElemento('span', 'ajedrez-modal-tablas-icono', '\u00BD'));
    caja.appendChild(crearElemento('p', 'ajedrez-modal-tablas-texto', texto));

    const acciones = crearElemento('div', 'ajedrez-modal-tablas-acciones');

    const btnAceptar = crearElemento('button', 'ajedrez-btn-iniciar', CFG.textos.aceptarTablas);
    btnAceptar.type = 'button';
    btnAceptar.addEventListener('click', function () {
        cerrarModalTablas();
        tablas();
    });

    const btnRechazar = crearElemento(
        'button',
        'ajedrez-btn-iniciar ajedrez-btn-rechazar',
        CFG.textos.rechazarTablas
    );
    btnRechazar.type = 'button';
    btnRechazar.addEventListener('click', function () {
        cerrarModalTablas();
        bloqueado = false;
    });

    acciones.appendChild(btnAceptar);
    acciones.appendChild(btnRechazar);
    caja.appendChild(acciones);
    modalTablas.appendChild(caja);
    pantalla.appendChild(modalTablas);
}

function cerrarModalTablas() {
    if (modalTablas) {
        modalTablas.remove();
        modalTablas = null;
    }
}

// --- Rendirse ---

function ofrecerRendicion(bando) {
    if (bloqueado || modalRendicion) return;
    bloqueado = true;

    const texto = bando === 'heroes' ? CFG.textos.heroesSeRinden : CFG.textos.villanosSeRinden;

    modalRendicion = crearElemento('div', 'ajedrez-modal-tablas-overlay');
    const caja = crearElemento('div', 'ajedrez-modal-tablas');

    caja.appendChild(crearElemento('span', 'ajedrez-modal-tablas-icono', '\u{1F3F3}'));
    caja.appendChild(
        crearElemento('p', 'ajedrez-modal-tablas-texto', CFG.textos.confirmarRendicion)
    );

    const acciones = crearElemento('div', 'ajedrez-modal-tablas-acciones');

    const btnConfirmar = crearElemento('button', 'ajedrez-btn-iniciar', CFG.textos.rendirse);
    btnConfirmar.type = 'button';
    btnConfirmar.addEventListener('click', function () {
        cerrarModalRendicion();
        lanzarToast(texto, '\u{1F3F3}', 'dano');
        const ganador = bando === 'heroes' ? 'villanos' : 'heroes';
        victoriaHvH(ganador);
    });

    const btnCancelar = crearElemento(
        'button',
        'ajedrez-btn-iniciar ajedrez-btn-rechazar',
        'Volver'
    );
    btnCancelar.type = 'button';
    btnCancelar.addEventListener('click', function () {
        cerrarModalRendicion();
        bloqueado = false;
    });

    acciones.appendChild(btnConfirmar);
    acciones.appendChild(btnCancelar);
    caja.appendChild(acciones);
    modalRendicion.appendChild(caja);
    pantalla.appendChild(modalRendicion);
}

function cerrarModalRendicion() {
    if (modalRendicion) {
        modalRendicion.remove();
        modalRendicion = null;
    }
}

// --- Handler de teclado ---

function onKeyDown(e) {
    if (e.key === 'Escape') {
        if (modalTablas) {
            cerrarModalTablas();
            bloqueado = false;
            return;
        }
        if (modalRendicion) {
            cerrarModalRendicion();
            bloqueado = false;
            return;
        }
        huir();
    }
}

// --- Iniciar partida tras seleccion ---

function iniciarPartida(eqHeroes, eqVillanos) {
    equipoHeroes = eqHeroes;
    equipoVillanos = eqVillanos;

    // Actualizar jugador al rey del ejercito
    const reyHeroes = eqHeroes.rey;
    jugador.nombre = reyHeroes.nombre;
    jugador.img = reyHeroes.img;
    jugador.clase = reyHeroes.clase;
    notificarVidaCambio();

    nuevaPartida(2, COLOR_JUGADOR);

    tablero = crearTablero({
        equipoVillanos,
        equipoHeroes,
        colorJugador: COLOR_JUGADOR,
        modoHvH: true,
        onClickCelda,
    });

    pantalla.appendChild(tablero.contenedor);

    // Ocultar boton huir de cabecera, agregar grupos de botones
    const btnHuir = pantalla.querySelector('.btn-huir');
    if (btnHuir) btnHuir.classList.add('oculto');
    pantalla.appendChild(crearGrupoBtns(true));
    pantalla.appendChild(crearGrupoBtns(false));

    const estado = obtenerEstado();
    tablero.actualizar(estado);
    tablero.marcarTurno(obtenerTurno());
    bloqueado = false;
}

// --- API publica ---

/**
 * Inicia El Duelo de Ajedrez.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad (se oculta)
 */
export function iniciarDueloAjedrez(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    bloqueado = true;
    casillaSeleccionada = null;
    movimientosDisponibles = [];
    equipoHeroes = null;
    equipoVillanos = null;
    modalTablas = null;
    modalRendicion = null;

    if (dpadRef) dpadRef.ocultar();

    modoPortrait = crearModoPortrait();
    modoPortrait.activar();

    ({ pantalla } = crearPantallaJuego(
        'pantalla-duelo-ajedrez',
        'juego-duelo-ajedrez',
        CFG.meta.titulo,
        huir
    ));

    document.getElementById('juego').appendChild(pantalla);

    const selector = crearSelectorInicial(iniciarPartida, huir);
    pantalla.appendChild(selector);

    document.addEventListener('keydown', onKeyDown);
}

/** Limpia y destruye El Duelo de Ajedrez */
export function limpiarDueloAjedrez() {
    clearTimeout(timeoutFin);
    timeoutFin = null;

    document.removeEventListener('keydown', onKeyDown);

    cerrarModalTablas();
    cerrarModalRendicion();

    if (pantalla) {
        pantalla.remove();
        pantalla = null;
    }

    tablero = null;
    bloqueado = false;
    casillaSeleccionada = null;
    movimientosDisponibles = [];
    equipoHeroes = null;
    equipoVillanos = null;

    if (modoPortrait) {
        modoPortrait.desactivar();
        modoPortrait = null;
    }
}
