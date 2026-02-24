// El Ajedrez — Juego de ajedrez con villanos como piezas enemigas
// Soporta modo vs IA y vs Humano (hot-seat)

import { CFG } from './config.js';
import { PERSONAJES } from '../../personajes.js';
import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { lanzarToast } from '../../componentes/toast.js';
import { crearElemento } from '../../utils.js';
import { notificarVidaCambio, notificarVictoria } from '../../eventos.js';
import { generarEquipoEnemigo, generarEquipoHeroes, obtenerPersonajesPorTier } from './piezas.js';
import { crearModoPortrait } from '../../componentes/modoPortrait.js';
import { crearTablero } from './tablero.js';
import {
    nuevaPartida,
    obtenerEstado,
    moverJugador,
    moverIA,
    movimientosValidos,
    esTurnoJugador,
    obtenerTurno,
    hayJaque,
    hayJaqueMate,
    hayTablas,
    partidaTerminada,
} from './motor.js';

// --- Estado del modulo ---

let jugador = null;
let callbackSalir = null;
let pantalla = null;
let tablero = null;
let bloqueado = false;
let casillaSeleccionada = null;
let movimientosDisponibles = [];
let colorElegido = 'white';
let timeoutIA = null;
let timeoutFin = null;
let modoJuego = 'ia';
let equipoHeroes = null;
let equipoVillanos = null;
let modoPortrait = null;

// --- Selector de modo, dificultad, color y ejercito ---

function crearSelectorInicial(onElegir) {
    const overlay = crearElemento('div', 'ajedrez-dificultad-overlay');
    const panel = crearElemento('div', 'ajedrez-dificultad-panel');

    // Estado local del selector
    let modoSel = CFG.modo.opciones[CFG.modo.default].id;
    let colorSel = CFG.color.opciones[CFG.color.default].valor;
    let nivelSel = CFG.dificultad.opciones[CFG.dificultad.default].nivel;

    // --- Pantalla 1: Elegir modo ---
    const pantalla1 = crearElemento('div', 'ajedrez-selector-pantalla');

    pantalla1.appendChild(crearElemento('h3', 'ajedrez-dificultad-titulo', CFG.textos.eligeModo));
    const opcionesModo = crearElemento('div', 'ajedrez-dificultad-opciones');

    CFG.modo.opciones.forEach(function (opcion) {
        const btn = crearElemento(
            'button',
            'ajedrez-dificultad-btn ajedrez-modo-btn',
            opcion.icono + ' ' + opcion.nombre
        );
        btn.type = 'button';
        btn.addEventListener('click', function () {
            modoSel = opcion.id;
            pantalla1.classList.add('oculto');
            if (modoSel === 'humano') {
                // Directo al ejercito de heroes
                mostrarPanelHeroes();
            } else {
                // Mostrar pantalla de color + dificultad
                mostrarConfigIA();
            }
        });
        opcionesModo.appendChild(btn);
    });
    pantalla1.appendChild(opcionesModo);
    panel.appendChild(pantalla1);

    // --- Pantalla 1b: Config IA (color + dificultad) ---
    const pantallaIA = crearElemento('div', 'ajedrez-selector-pantalla oculto');
    panel.appendChild(pantallaIA);

    function mostrarConfigIA() {
        pantallaIA.innerHTML = '';

        // Color
        pantallaIA.appendChild(
            crearElemento('h3', 'ajedrez-dificultad-titulo', CFG.textos.eligeColor)
        );
        const opcionesColor = crearElemento('div', 'ajedrez-dificultad-opciones');
        const botonesColor = [];

        CFG.color.opciones.forEach(function (opcion, i) {
            const btn = crearElemento(
                'button',
                'ajedrez-dificultad-btn ajedrez-color-btn',
                opcion.nombre
            );
            btn.type = 'button';
            if (i === CFG.color.default) btn.classList.add('ajedrez-color-activo');
            btn.addEventListener('click', function () {
                colorSel = opcion.valor;
                botonesColor.forEach(function (b) {
                    b.classList.remove('ajedrez-color-activo');
                });
                btn.classList.add('ajedrez-color-activo');
            });
            botonesColor.push(btn);
            opcionesColor.appendChild(btn);
        });
        pantallaIA.appendChild(opcionesColor);

        // Dificultad
        pantallaIA.appendChild(
            crearElemento(
                'h3',
                'ajedrez-dificultad-titulo ajedrez-dificultad-titulo-segundo',
                'Elige la dificultad'
            )
        );
        const opcionesDif = crearElemento('div', 'ajedrez-dificultad-opciones');
        const botonesDif = [];

        CFG.dificultad.opciones.forEach(function (opcion, i) {
            const btn = crearElemento('button', 'ajedrez-dificultad-btn', opcion.nombre);
            btn.type = 'button';
            if (i === CFG.dificultad.default) btn.classList.add('ajedrez-dificultad-activo');
            btn.addEventListener('click', function () {
                nivelSel = opcion.nivel;
                botonesDif.forEach(function (b) {
                    b.classList.remove('ajedrez-dificultad-activo');
                });
                btn.classList.add('ajedrez-dificultad-activo');
            });
            botonesDif.push(btn);
            opcionesDif.appendChild(btn);
        });
        pantallaIA.appendChild(opcionesDif);

        // Boton Siguiente
        const btnSig = crearElemento('button', 'ajedrez-btn-iniciar', 'Siguiente \u2192');
        btnSig.type = 'button';
        btnSig.addEventListener('click', function () {
            pantallaIA.classList.add('oculto');
            mostrarPanelHeroes();
        });
        pantallaIA.appendChild(btnSig);

        pantallaIA.classList.remove('oculto');
    }

    // --- Pantalla 2a: Ejercito Heroes ---
    const pantalla2a = crearElemento('div', 'ajedrez-selector-pantalla oculto');
    panel.appendChild(pantalla2a);

    // --- Pantalla 2b: Ejercito Villanos (solo HvH) ---
    const pantalla2b = crearElemento('div', 'ajedrez-selector-pantalla oculto');
    panel.appendChild(pantalla2b);

    function mostrarPanelHeroes() {
        pantalla2a.innerHTML = '';
        const titulo = modoSel === 'humano' ? 'Héroes, armen su ejército' : 'Arma tu ejército';
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

        const { panel: panelEj, obtenerEquipo } = crearPanelEjercito(titulo, restricciones, presel);
        pantalla2a.appendChild(panelEj);

        const esHvH = modoSel === 'humano';
        const textoBtn = esHvH ? 'Siguiente \u2192' : 'Jugar';
        const btnAv = crearElemento('button', 'ajedrez-btn-iniciar', textoBtn);
        btnAv.type = 'button';
        btnAv.addEventListener('click', function () {
            equipoHeroes = obtenerEquipo();
            if (esHvH) {
                pantalla2a.classList.add('oculto');
                mostrarPanelVillanos();
            } else {
                equipoVillanos = generarEquipoEnemigo();
                overlay.remove();
                onElegir(nivelSel, colorSel, modoSel, equipoHeroes, equipoVillanos);
            }
        });
        pantalla2a.appendChild(btnAv);
        pantalla2a.classList.remove('oculto');
    }

    function mostrarPanelVillanos() {
        pantalla2b.innerHTML = '';
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
        pantalla2b.appendChild(panelEj);

        const btnJugar = crearElemento('button', 'ajedrez-btn-iniciar', 'Jugar');
        btnJugar.type = 'button';
        btnJugar.addEventListener('click', function () {
            equipoVillanos = obtenerEquipo();
            overlay.remove();
            onElegir(nivelSel, colorSel, modoSel, equipoHeroes, equipoVillanos);
        });
        pantalla2b.appendChild(btnJugar);
        pantalla2b.classList.remove('oculto');
    }

    overlay.appendChild(panel);
    return overlay;
}

// --- Panel de asignacion de ejercito ---

const ROLES = [
    { id: 'rey', icono: '\u265A', nombre: 'Rey' },
    { id: 'reina', icono: '\u265B', nombre: 'Reina' },
    { id: 'torre', icono: '\u265C', nombre: 'Torre' },
    { id: 'alfil', icono: '\u265D', nombre: 'Alfil' },
    { id: 'caballo', icono: '\u265E', nombre: 'Caballo' },
    { id: 'peon', icono: '\u265F', nombre: 'Peón' },
];

/**
 * Crea un panel de asignacion de ejercito con auto-swap.
 * Al elegir un personaje que ya esta en otro rol, se intercambian automaticamente.
 * @param {string} titulo - Encabezado
 * @param {Object} restricciones - { rol: [personajes disponibles] }
 * @param {Object} preseleccion - { peon, torre, caballo, alfil, rey, reina }
 * @returns {{ panel: HTMLElement, obtenerEquipo: Function }}
 */
function crearPanelEjercito(titulo, restricciones, preseleccion) {
    const contenedor = crearElemento('div', 'ajedrez-ejercito');
    contenedor.appendChild(crearElemento('h3', 'ajedrez-ejercito-titulo', titulo));

    // Estado de asignaciones: { rol: personaje }
    const asignaciones = {};
    // Mapa de botones por fila para actualizar visualmente
    const botonesPorFila = {};

    ROLES.forEach(function (rol) {
        asignaciones[rol.id] = preseleccion[rol.id] || null;
    });

    // Crear filas
    ROLES.forEach(function (rol) {
        const fila = crearElemento('div', 'ajedrez-ejercito-fila');

        const labelRol = crearElemento('div', 'ajedrez-ejercito-rol');
        labelRol.appendChild(crearElemento('span', 'ajedrez-ejercito-rol-icono', rol.icono));
        labelRol.appendChild(crearElemento('span', null, rol.nombre));
        fila.appendChild(labelRol);

        const opciones = crearElemento('div', 'ajedrez-ejercito-opciones');
        const personajesRol = restricciones[rol.id];
        const esFijo = personajesRol.length === 1;
        const botones = [];

        personajesRol.forEach(function (pj) {
            const img = document.createElement('img');
            img.src = pj.img;
            img.alt = pj.nombre;
            img.title = pj.nombre;
            img.className = 'ajedrez-ejercito-avatar';
            img.draggable = false;

            if (esFijo) {
                img.classList.add('ajedrez-ejercito-fijo', 'ajedrez-ejercito-elegido');
            } else {
                img.addEventListener('click', function () {
                    seleccionarPersonaje(rol.id, pj);
                });
            }

            botones.push(img);
            opciones.appendChild(img);
        });

        botonesPorFila[rol.id] = { botones, personajes: personajesRol };
        fila.appendChild(opciones);
        contenedor.appendChild(fila);
    });

    function seleccionarPersonaje(rolId, pj) {
        const anterior = asignaciones[rolId];

        // Si ya es el mismo, no hacer nada
        if (anterior && anterior.nombre === pj.nombre) return;

        // Buscar si este personaje esta en otro rol → auto-swap
        for (const otroRol of ROLES) {
            if (otroRol.id === rolId) continue;
            if (asignaciones[otroRol.id] && asignaciones[otroRol.id].nombre === pj.nombre) {
                // Swap: el otro rol recibe lo que tenia este
                asignaciones[otroRol.id] = anterior;
                break;
            }
        }

        asignaciones[rolId] = pj;
        refrescarVisual();
    }

    // Refresca el estado visual de todas las filas
    function refrescarVisual() {
        ROLES.forEach(function (rol) {
            const { botones, personajes } = botonesPorFila[rol.id];
            const esFijo = personajes.length === 1;
            if (esFijo) return;

            const elegido = asignaciones[rol.id];
            personajes.forEach(function (pj, i) {
                const btn = botones[i];
                btn.classList.toggle(
                    'ajedrez-ejercito-elegido',
                    elegido && elegido.nombre === pj.nombre
                );
            });
        });
    }

    // Marcar estado inicial
    refrescarVisual();

    function obtenerEquipo() {
        return { ...asignaciones };
    }

    return { panel: contenedor, obtenerEquipo };
}

// --- Logica de clics ---

function onClickCelda(casilla) {
    if (bloqueado) return;

    // En modo IA: solo mover si es turno del jugador
    if (modoJuego === 'ia' && !esTurnoJugador()) return;

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

    // En modo IA, solo piezas del color del jugador
    if (modoJuego === 'ia') {
        const esPropia = colorElegido === 'white' ? esBlanca : !esBlanca;
        if (!esPropia) {
            deseleccionar();
            return;
        }
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

    // Animar movimiento
    await tablero.animarMovimiento(desde, hasta);

    // Ejecutar en el motor
    moverJugador(desde, hasta);

    // Actualizar tablero
    const estado = obtenerEstado();
    tablero.actualizar(estado);
    tablero.marcarUltimoMovimiento(desde, hasta);

    // Verificar fin de partida
    if (verificarFinPartida()) return;

    // Verificar jaque (el turno ya cambio al rival)
    if (hayJaque()) {
        tablero.indicarJaque(true, estado.turn);
        lanzarToast(CFG.textos.toastJaque, '\u265A', 'dano');
    } else {
        tablero.indicarJaque(false);
    }

    tablero.marcarTurno(obtenerTurno());

    if (modoJuego === 'humano') {
        bloqueado = false;
    } else {
        timeoutIA = setTimeout(ejecutarMovimientoIA, CFG.ia.retardoMovimiento);
    }
}

async function ejecutarMovimientoIA() {
    // Si se limpio antes de que la IA mueva (Escape durante retardo), salir
    if (!tablero) return;

    // Guardar referencia al tablero por si se limpia durante la animacion
    const tableroRef = tablero;
    const { desde, hasta } = moverIA();

    // Animar movimiento de la IA
    await tableroRef.animarMovimiento(desde, hasta);

    // Si se limpio durante la animacion (Escape), salir
    if (!tablero) return;

    // Actualizar tablero
    const estado = obtenerEstado();
    tablero.actualizar(estado);
    tablero.marcarUltimoMovimiento(desde, hasta);

    // Verificar fin de partida
    if (verificarFinPartida()) return;

    // Verificar jaque (el turno ya cambio al jugador)
    if (hayJaque()) {
        tablero.indicarJaque(true, estado.turn);
        lanzarToast(CFG.textos.toastJaque, '\u265A', 'dano');
    } else {
        tablero.indicarJaque(false);
    }

    // Devolver turno al jugador
    tablero.marcarTurno(obtenerTurno());
    bloqueado = false;
}

function verificarFinPartida() {
    if (hayJaqueMate()) {
        if (modoJuego === 'humano') {
            // En HvH, el turno queda en quien esta en mate (el que perdio)
            const turno = obtenerTurno();
            if (turno === 'black') {
                victoriaHvH('heroes');
            } else {
                victoriaHvH('villanos');
            }
        } else {
            const ganoJugador = !esTurnoJugador();
            if (ganoJugador) {
                victoria();
            } else {
                derrota();
            }
        }
        return true;
    }
    if (hayTablas() || partidaTerminada()) {
        tablas();
        return true;
    }
    return false;
}

function victoria() {
    bloqueado = true;

    // Curacion por victoria
    const min = CFG.curacion.victoriaMin;
    const max = CFG.curacion.victoriaMax;
    const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
    jugador.vidaActual = Math.min(jugador.vidaActual + cantidad, jugador.vidaMax);
    notificarVidaCambio();
    notificarVictoria();

    lanzarToast(CFG.textos.toastVictoria, '\u2728', 'exito');

    timeoutFin = setTimeout(function () {
        limpiarAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function victoriaHvH(bando) {
    bloqueado = true;
    const texto =
        bando === 'heroes' ? CFG.textos.toastVictoriaHeroes : CFG.textos.toastVictoriaVillanos;
    lanzarToast(texto, '\u2728', 'exito');

    // Curacion por victoria (el heroe seleccionado sigue recibiendo beneficio)
    const min = CFG.curacion.victoriaMin;
    const max = CFG.curacion.victoriaMax;
    const cantidad = Math.floor(Math.random() * (max - min + 1)) + min;
    jugador.vidaActual = Math.min(jugador.vidaActual + cantidad, jugador.vidaMax);
    notificarVidaCambio();
    notificarVictoria();

    timeoutFin = setTimeout(function () {
        limpiarAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function derrota() {
    bloqueado = true;
    lanzarToast(CFG.textos.toastDerrota, '\u265A', 'dano');

    timeoutFin = setTimeout(function () {
        limpiarAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function tablas() {
    bloqueado = true;
    lanzarToast(CFG.textos.toastTablas, '\u00BD', 'item');

    timeoutFin = setTimeout(function () {
        limpiarAjedrez();
        callbackSalir();
    }, CFG.meta.tiempoVictoria);
}

function huir() {
    limpiarAjedrez();
    callbackSalir();
}

// --- Ofrecer tablas (HvH) ---

let modalTablas = null;

function crearBtnTablas(esVillanos) {
    const btn = document.createElement('button');
    btn.className = 'ajedrez-btn-tablas';
    if (esVillanos) btn.classList.add('ajedrez-btn-tablas-villanos');
    else btn.classList.add('ajedrez-btn-tablas-heroes');
    btn.type = 'button';
    btn.title = CFG.textos.ofrecerTablas;
    btn.setAttribute('aria-label', CFG.textos.ofrecerTablas);
    btn.textContent = '\u00BD';
    btn.addEventListener('click', function () {
        ofrecerTablas(esVillanos ? 'villanos' : 'heroes');
    });
    return btn;
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

// --- Handler de teclado ---

function onKeyDown(e) {
    if (e.key === 'Escape') {
        if (modalTablas) {
            cerrarModalTablas();
            bloqueado = false;
            return;
        }
        huir();
    }
}

// --- Iniciar partida tras seleccion ---

function iniciarPartida(nivel, color, modo, eqHeroes, eqVillanos) {
    modoJuego = modo || 'ia';
    colorElegido = modoJuego === 'humano' ? 'white' : color;
    equipoHeroes = eqHeroes;
    equipoVillanos = eqVillanos;

    // Actualizar jugador al rey del ejercito (para barra de vida y victoria)
    const reyHeroes = eqHeroes.rey;
    jugador.nombre = reyHeroes.nombre;
    jugador.img = reyHeroes.img;
    jugador.clase = reyHeroes.clase;
    notificarVidaCambio();

    nuevaPartida(nivel, colorElegido);

    tablero = crearTablero({
        equipoVillanos,
        equipoHeroes,
        colorJugador: colorElegido,
        modoHvH: modoJuego === 'humano',
        onClickCelda,
    });

    // Tablero
    pantalla.appendChild(tablero.contenedor);

    // En HvH: ocultar boton huir de cabecera, agregar botones de tablas
    if (modoJuego === 'humano') {
        const btnHuir = pantalla.querySelector('.btn-huir');
        if (btnHuir) btnHuir.classList.add('oculto');
        pantalla.appendChild(crearBtnTablas(true));
        pantalla.appendChild(crearBtnTablas(false));
    }

    // Render inicial
    const estado = obtenerEstado();
    tablero.actualizar(estado);
    tablero.marcarTurno(obtenerTurno());

    if (modoJuego === 'ia' && colorElegido === 'black') {
        // IA juega primero (blancas)
        bloqueado = true;
        timeoutIA = setTimeout(ejecutarMovimientoIA, CFG.ia.retardoMovimiento);
    } else {
        bloqueado = false;
    }
}

// --- API publica ---

/**
 * Inicia El Ajedrez.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad (se oculta)
 */
export function iniciarAjedrez(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    bloqueado = true;
    casillaSeleccionada = null;
    movimientosDisponibles = [];
    colorElegido = 'white';
    modoJuego = 'ia';
    equipoHeroes = null;
    equipoVillanos = null;

    // Ocultar D-pad (no se usa en ajedrez)
    if (dpadRef) dpadRef.ocultar();

    // Forzar portrait en mobile
    modoPortrait = crearModoPortrait();
    modoPortrait.activar();

    ({ pantalla } = crearPantallaJuego('pantalla-ajedrez', 'juego-ajedrez', CFG.meta.titulo, huir));

    document.getElementById('juego').appendChild(pantalla);

    // Mostrar selector de modo, dificultad y color
    const selector = crearSelectorInicial(iniciarPartida);
    pantalla.appendChild(selector);

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
}

/** Limpia y destruye El Ajedrez */
export function limpiarAjedrez() {
    clearTimeout(timeoutIA);
    clearTimeout(timeoutFin);
    timeoutIA = null;
    timeoutFin = null;

    document.removeEventListener('keydown', onKeyDown);

    if (pantalla) {
        pantalla.remove();
        pantalla = null;
    }

    cerrarModalTablas();
    tablero = null;
    bloqueado = false;
    casillaSeleccionada = null;
    movimientosDisponibles = [];
    modoJuego = 'ia';
    equipoHeroes = null;
    equipoVillanos = null;

    if (modoPortrait) {
        modoPortrait.desactivar();
        modoPortrait = null;
    }
}
