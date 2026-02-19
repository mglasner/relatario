// Código de La Mansión de Aventuras
import { PERSONAJES } from './personajes.js';
import { iniciarHabitacion1, limpiarHabitacion1 } from './habitaciones/habitacion1/index.js';
import { iniciarHabitacion2, limpiarHabitacion2 } from './habitaciones/habitacion2.js';
import { iniciarHabitacion3, limpiarHabitacion3 } from './habitaciones/habitacion3/index.js';
import { crearBarraSuperior } from './componentes/barraSuperior.js';
import { crearModalPuerta } from './componentes/modalPuerta.js';
import { crearModalDerrota } from './componentes/modalDerrota.js';
import { crearModalSalir } from './componentes/modalSalir.js';
import { crearTransicion } from './componentes/transicion.js';
import { crearControlesTouch } from './componentes/controlesTouch.js';
import { crearToast } from './componentes/toast.js';
import { crearLibroVillanos } from './componentes/libroVillanos.js';
import { crearLibroHeroes } from './componentes/libroHeroes.js';
import { crearLibrosPasillo } from './componentes/librosPasillo.js';

// --- Estados del juego (máquina de estados) ---

const ESTADOS = {
    SELECCION: 'SELECCION',
    PASILLO: 'PASILLO',
    HABITACION: 'HABITACION',
};

// Registro dinámico de habitaciones: { "1": { iniciar, limpiar }, ... }
const habitaciones = {};

function registrarHabitacion(numero, modulo) {
    habitaciones[numero] = modulo;
}

registrarHabitacion('1', { iniciar: iniciarHabitacion1, limpiar: limpiarHabitacion1 });
registrarHabitacion('2', { iniciar: iniciarHabitacion2, limpiar: limpiarHabitacion2 });
registrarHabitacion('3', { iniciar: iniciarHabitacion3, limpiar: limpiarHabitacion3 });

// --- Heroario y Villanario ---

const pantallaSeleccion = document.getElementById('seleccion-personaje');
crearLibroHeroes(pantallaSeleccion);
crearLibroVillanos(pantallaSeleccion);

// --- Estado del juego ---

const estado = {
    estadoActual: ESTADOS.SELECCION, // estado de la máquina de estados
    personajeElegido: null, // nombre del personaje (string)
    jugadorActual: null, // instancia de Personaje
    habitacionActual: null, // nombre de la habitación activa
    loopActivo: false, // si el game loop está corriendo
    esperandoSalirDePuerta: false, // flag de espera post-modal puerta
};

const movimiento = {
    x: 0, // posición X del jugador en píxeles
    y: 0, // posición Y del jugador en píxeles
    limiteDerecho: 0, // límite derecho del pasillo
    limiteInferior: 0, // límite inferior del pasillo
    teclas: {}, // teclas presionadas actualmente
};

// --- Pantalla del pasillo ---

// Elementos del pasillo
const pasillo = document.getElementById('pasillo');
const personajeJugador = document.getElementById('personaje-jugador');
const imgJugador = document.getElementById('img-jugador');
const jugadorSombra = document.querySelector('.jugador-sombra');

// Distancia (en unidades de tamaño del personaje) para activar proximidad
const DISTANCIA_PROXIMIDAD = 1.5;

// Cache de dimensiones (se recalculan solo en resize)
let velocidadCache = 0;
let tamPersonajeCache = 0;
let puertasCache = [];

function recalcularDimensiones() {
    velocidadCache = pasillo.clientWidth * 0.01;
    tamPersonajeCache = personajeJugador.offsetWidth;
    puertasCache = Array.from(document.querySelectorAll('.puerta')).map(function (puerta) {
        const rect = puerta.getBoundingClientRect();
        const pasilloRect = pasillo.getBoundingClientRect();
        return {
            elemento: puerta,
            px: rect.left - pasilloRect.left,
            py: rect.top - pasilloRect.top,
            pw: rect.width,
            ph: rect.height,
        };
    });
}

window.addEventListener('resize', function () {
    if (estado.estadoActual === ESTADOS.PASILLO) {
        recalcularDimensiones();
        movimiento.limiteDerecho = pasillo.clientWidth - tamPersonajeCache;
        movimiento.limiteInferior = pasillo.clientHeight - tamPersonajeCache;
    }
});

function getVelocidad() {
    return velocidadCache;
}

// --- Crear componentes ---

const contenedorJuego = document.getElementById('juego');
const barra = crearBarraSuperior(contenedorJuego);
const modal = crearModalPuerta(contenedorJuego);
const modalDerrota = crearModalDerrota();
const modalSalir = crearModalSalir(contenedorJuego);
const transicion = crearTransicion();
const dpad = crearControlesTouch();
const toast = crearToast();
const librosPasillo = crearLibrosPasillo(contenedorJuego);

// Ocultar hint de teclado en dispositivos touch
const esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (esTouch) {
    const hint = document.getElementById('controles-hint');
    if (hint) hint.style.display = 'none';
}

// Escuchar selección de héroe desde el Heroario
document.addEventListener('heroe-seleccionado', function (e) {
    estado.personajeElegido = e.detail.nombre;
    iniciarJuego();
});

// Escuchar cambios de inventario desde las habitaciones
document.addEventListener('inventario-cambio', function () {
    if (estado.jugadorActual) {
        barra.actualizarInventario(estado.jugadorActual);
    }
});

// Escuchar cambios de vida (trampas, combate, etc.)
document.addEventListener('vida-cambio', function () {
    if (estado.jugadorActual) {
        barra.actualizarVida(estado.jugadorActual);
    }
});

// Escuchar muerte del jugador
document.addEventListener('jugador-muerto', function () {
    if (!estado.jugadorActual) return;

    // Buscar la pantalla de habitación activa como contenedor del modal
    const pantallaHabitacion = estado.habitacionActual
        ? document.getElementById('pantalla-habitacion' + estado.habitacionActual)
        : null;
    const contenedorModal = pantallaHabitacion || contenedorJuego;
    modalDerrota.mostrar(estado.jugadorActual.nombre, contenedorModal);
});

// --- Máquina de estados: transiciones centralizadas ---

// Elegir estilo de transición según el cambio de pantalla
function elegirTransicion(anterior, nuevo) {
    if (nuevo === ESTADOS.HABITACION) return 'iris';
    if (anterior === ESTADOS.HABITACION) return 'iris';
    if (anterior === ESTADOS.SELECCION && nuevo === ESTADOS.PASILLO) return 'wipe';
    return 'fade';
}

// Lógica interna del cambio de estado (se ejecuta con pantalla cubierta)
function ejecutarCambioEstado(anterior, nuevo, datos) {
    // Salir del estado anterior
    if (anterior === ESTADOS.PASILLO) {
        estado.loopActivo = false;
        limpiarProximidadPuertas();
        dpad.ocultar();
        librosPasillo.ocultar();
    } else if (anterior === ESTADOS.HABITACION) {
        const hab = habitaciones[estado.habitacionActual];
        if (hab) hab.limpiar();
        estado.habitacionActual = null;
    }

    estado.estadoActual = nuevo;

    // Entrar al nuevo estado
    if (nuevo === ESTADOS.SELECCION) {
        document.getElementById('pantalla-juego').classList.add('oculto');
        document.getElementById('seleccion-personaje').classList.remove('oculto');
        barra.ocultar();

        if (estado.jugadorActual) {
            estado.jugadorActual.vidaActual = estado.jugadorActual.vidaMax;
            estado.jugadorActual.inventario = [];
        }

        estado.personajeElegido = null;
        estado.jugadorActual = null;
        Object.keys(movimiento.teclas).forEach(function (k) {
            delete movimiento.teclas[k];
        });
    } else if (nuevo === ESTADOS.PASILLO) {
        if (anterior === ESTADOS.SELECCION) {
            // Primera entrada: configurar personaje
            document.getElementById('seleccion-personaje').classList.add('oculto');

            estado.jugadorActual = PERSONAJES[estado.personajeElegido];
            imgJugador.src = estado.jugadorActual.img;
            imgJugador.alt = estado.personajeElegido;

            personajeJugador.classList.remove(
                'jugador-lina',
                'jugador-rose',
                'jugador-pandajuro',
                'jugador-hana',
                'jugador-kira',
                'jugador-donbu'
            );
            personajeJugador.classList.add(estado.jugadorActual.clase);
        }

        // Hacer visible ANTES de calcular dimensiones (clientWidth es 0 si está oculto)
        document.getElementById('pantalla-juego').classList.remove('oculto');

        // Recalcular dimensiones cacheadas (el pasillo ya es visible)
        recalcularDimensiones();

        if (anterior === ESTADOS.SELECCION) {
            movimiento.limiteDerecho = pasillo.clientWidth - tamPersonajeCache;
            movimiento.limiteInferior = pasillo.clientHeight - tamPersonajeCache;
            movimiento.x = (pasillo.clientWidth - tamPersonajeCache) / 2;
            movimiento.y = pasillo.clientHeight - tamPersonajeCache - 15;
            actualizarPosicion();

            barra.mostrar(estado.jugadorActual);
        }

        // Activar D-pad touch apuntando a las teclas del pasillo
        dpad.setTeclasRef(movimiento.teclas);
        dpad.mostrar();

        librosPasillo.mostrar();

        estado.loopActivo = true;
        requestAnimationFrame(gameLoop);
    } else if (nuevo === ESTADOS.HABITACION) {
        const hab = habitaciones[datos.numero];
        if (!hab) return;

        document.getElementById('pantalla-juego').classList.add('oculto');
        estado.habitacionActual = datos.numero;

        hab.iniciar(
            estado.jugadorActual,
            function () {
                cambiarEstado(ESTADOS.PASILLO);
            },
            dpad
        );
    }
}

function cambiarEstado(nuevo, datos) {
    const anterior = estado.estadoActual;
    const estilo = elegirTransicion(anterior, nuevo);

    toast.limpiar();
    transicion.ejecutar(estilo, function () {
        ejecutarCambioEstado(anterior, nuevo, datos);
    });
}

// --- Iniciar el juego ---

function iniciarJuego() {
    if (!estado.personajeElegido) return;
    cambiarEstado(ESTADOS.PASILLO);
}

// --- Volver a selección ---

function volverASeleccion() {
    cambiarEstado(ESTADOS.SELECCION);
}

document.getElementById('btn-volver').addEventListener('click', function () {
    if (!modalSalir.estaAbierto()) {
        modalSalir.mostrar();
    }
});

// Callbacks del modal de salir
modalSalir.onConfirmar(function () {
    volverASeleccion();
});

// Callback del modal de derrota: limpiar habitación y volver a selección
modalDerrota.onAceptar(function () {
    cambiarEstado(ESTADOS.SELECCION);
});

// --- Controles del teclado ---

document.addEventListener('keydown', function (e) {
    // Si algún modal está abierto, delegar al componente
    if (modalDerrota.estaAbierto()) {
        modalDerrota.manejarTecla(e);
        return;
    }
    if (modalSalir.estaAbierto()) {
        modalSalir.manejarTecla(e);
        return;
    }
    if (modal.estaAbierto()) {
        modal.manejarTecla(e);
        return;
    }

    // En pantalla de selección, el Heroario y Villanario manejan sus propias teclas
    if (estado.estadoActual === ESTADOS.SELECCION) return;

    if (e.key === 'Escape' && estado.estadoActual === ESTADOS.PASILLO) {
        // Si hay un libro abierto, dejar que el libro lo maneje
        if (librosPasillo.estaAbierto()) return;
        modalSalir.mostrar();
        return;
    }

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        movimiento.teclas[e.key] = true;
    }
});

document.addEventListener('keyup', function (e) {
    delete movimiento.teclas[e.key];
});

// --- Game loop ---

function gameLoop() {
    if (!estado.loopActivo) return;

    let dx = 0;
    let dy = 0;

    const vel = getVelocidad();

    if (movimiento.teclas['ArrowUp']) dy -= vel;
    if (movimiento.teclas['ArrowDown']) dy += vel;
    if (movimiento.teclas['ArrowLeft']) dx -= vel;
    if (movimiento.teclas['ArrowRight']) dx += vel;

    const seMueve = dx !== 0 || dy !== 0;

    if (seMueve) {
        moverPersonaje(dx, dy);
    }

    // Clase de movimiento para animación de caminar
    personajeJugador.classList.toggle('moviendo', seMueve);

    // Detectar colisión y proximidad con puertas
    detectarColisionPuertas();
    actualizarProximidadPuertas();

    requestAnimationFrame(gameLoop);
}

// --- Movimiento con colisiones ---

function moverPersonaje(dx, dy) {
    let nuevaX = movimiento.x + dx;
    let nuevaY = movimiento.y + dy;

    // Limitar a los bordes del pasillo
    if (nuevaX < 0) nuevaX = 0;
    if (nuevaX > movimiento.limiteDerecho) nuevaX = movimiento.limiteDerecho;
    if (nuevaY < 0) nuevaY = 0;
    if (nuevaY > movimiento.limiteInferior) nuevaY = movimiento.limiteInferior;

    movimiento.x = nuevaX;
    movimiento.y = nuevaY;
    actualizarPosicion();
}

function actualizarPosicion() {
    personajeJugador.style.transform = `translate(${movimiento.x}px, ${movimiento.y}px)`;

    // Escalar sombra según posición Y (más grande abajo, más chica arriba)
    if (jugadorSombra && movimiento.limiteInferior > 0) {
        const progreso = movimiento.y / movimiento.limiteInferior;
        const escala = 0.6 + progreso * 0.5;
        jugadorSombra.style.transform = `scaleX(${escala}) scaleY(${escala * 0.6})`;
    }
}

// --- Proximidad de puertas ---

function actualizarProximidadPuertas() {
    const tam = tamPersonajeCache;
    const centroX = movimiento.x + tam / 2;
    const centroY = movimiento.y + tam / 2;

    for (let i = 0; i < puertasCache.length; i++) {
        const p = puertasCache[i];
        const puertaCX = p.px + p.pw / 2;
        const puertaCY = p.py + p.ph / 2;
        const distX = (centroX - puertaCX) / tam;
        const distY = (centroY - puertaCY) / tam;
        const dist = Math.sqrt(distX * distX + distY * distY);

        p.elemento.classList.toggle('puerta-cerca', dist < DISTANCIA_PROXIMIDAD);
    }
}

function limpiarProximidadPuertas() {
    document.querySelectorAll('.puerta-cerca').forEach(function (p) {
        p.classList.remove('puerta-cerca');
    });
    personajeJugador.classList.remove('moviendo');
}

// --- Detección de colisión con puertas ---

function detectarColisionPuertas() {
    let tocandoAlguna = false;
    const tam = tamPersonajeCache;

    for (let i = 0; i < puertasCache.length; i++) {
        const p = puertasCache[i];

        const colisiona =
            movimiento.x < p.px + p.pw &&
            movimiento.x + tam > p.px &&
            movimiento.y < p.py + p.ph &&
            movimiento.y + tam > p.py;

        if (colisiona) {
            tocandoAlguna = true;
            if (!estado.esperandoSalirDePuerta && !modal.estaAbierto()) {
                estado.loopActivo = false;
                modal.mostrar(p.elemento.dataset.puerta);
            }
        }
    }

    if (!tocandoAlguna) {
        estado.esperandoSalirDePuerta = false;
    }
}

// --- Clic en las puertas ---

document.querySelectorAll('.puerta').forEach(function (puerta) {
    puerta.addEventListener('click', function () {
        if (!modal.estaAbierto()) {
            estado.loopActivo = false;
            modal.mostrar(puerta.dataset.puerta);
        }
    });
});

// --- Callbacks del modal ---

modal.onCancelar(function () {
    estado.esperandoSalirDePuerta = true;
    estado.loopActivo = true;
    requestAnimationFrame(gameLoop);
});

modal.onEntrar(function (numeroPuerta) {
    estado.esperandoSalirDePuerta = true;

    if (habitaciones[numeroPuerta]) {
        cambiarEstado(ESTADOS.HABITACION, { numero: numeroPuerta });
    } else {
        // Habitación no implementada
        estado.loopActivo = true;
        requestAnimationFrame(gameLoop);
    }
});
