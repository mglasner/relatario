// Código de La Casa del Terror
import { PERSONAJES } from "./personajes.js";
import { ENEMIGOS } from "./enemigos.js";
import { iniciarHabitacion1 } from "./habitaciones/habitacion1.js";
import { crearBarraSuperior } from "./componentes/barraSuperior.js";
import { crearModalPuerta } from "./componentes/modalPuerta.js";

console.log("¡La Casa del Terror está cargando!");

// --- Llenar tarjetas desde el modelo ---

function crearElemento(tag, clase, texto) {
    var el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
}

// Llena la sección de stats (vida + ataques) de una tarjeta
function llenarStats(tarjeta, datos) {
    tarjeta.querySelector(".descripcion").textContent = datos.descripcion;

    var stats = tarjeta.querySelector(".stats");

    // Barra de vida (escala: 150 = 100%)
    var statVida = crearElemento("div", "stat-vida");
    statVida.appendChild(crearElemento("span", "stat-label", "Vida"));
    var barraFondo = crearElemento("div", "barra-vida-fondo");
    var barraRelleno = crearElemento("div", "barra-vida-relleno");
    barraRelleno.style.width = Math.round(datos.vidaMax / 1.5) + "%";
    barraFondo.appendChild(barraRelleno);
    statVida.appendChild(barraFondo);
    statVida.appendChild(crearElemento("span", "stat-valor", datos.vidaMax.toString()));
    stats.appendChild(statVida);

    // Ataques
    var statAtaques = crearElemento("div", "stat-ataques");
    statAtaques.appendChild(crearElemento("span", "stat-label", "Ataques"));
    datos.ataques.forEach(function (ataque) {
        var ataqueDiv = crearElemento("div", "ataque");
        ataqueDiv.appendChild(crearElemento("span", "ataque-nombre", ataque.nombre));
        ataqueDiv.appendChild(crearElemento("span", "ataque-dano", ataque.dano.toString()));
        statAtaques.appendChild(ataqueDiv);
    });
    stats.appendChild(statAtaques);
}

// Tarjetas de personajes
document.querySelectorAll(".personaje").forEach(function (tarjeta) {
    var datos = PERSONAJES[tarjeta.dataset.nombre];
    if (datos) llenarStats(tarjeta, datos);
});

// Tarjetas de villanos
document.querySelectorAll(".villano").forEach(function (tarjeta) {
    var datos = ENEMIGOS[tarjeta.dataset.nombre];
    if (datos) llenarStats(tarjeta, datos);
});

// --- Selección de personaje ---

let personajeElegido = null;   // nombre del personaje (string)
let jugadorActual = null;      // instancia de Personaje
let indiceFoco = -1;           // índice de tarjeta con foco de teclado

const personajes = document.querySelectorAll(".personaje");
const tarjetasPersonajes = Array.from(personajes);

// Selecciona un personaje y muestra el botón de empezar sobre la tarjeta
function seleccionarPersonaje(tarjeta) {
    // Quitar selección y overlay anterior
    personajes.forEach(function (p) {
        p.classList.remove("seleccionado");
        const overlay = p.querySelector(".seleccion-overlay");
        if (overlay) overlay.remove();
    });

    tarjeta.classList.add("seleccionado");
    personajeElegido = tarjeta.dataset.nombre;

    // Crear overlay con botón de empezar
    const overlay = document.createElement("div");
    overlay.className = "seleccion-overlay";
    const btn = document.createElement("button");
    btn.className = "btn-empezar";
    btn.textContent = "¡Empezar!";
    overlay.appendChild(btn);
    tarjeta.appendChild(overlay);

    // Clic en overlay inicia el juego
    overlay.addEventListener("click", function (e) {
        e.stopPropagation();
        iniciarJuego();
    });
}

// Mueve el foco del teclado a una tarjeta
function enfocarPersonaje(indice) {
    tarjetasPersonajes.forEach(function (p) {
        p.classList.remove("enfocado");
    });
    indiceFoco = indice;
    if (indice >= 0 && indice < tarjetasPersonajes.length) {
        tarjetasPersonajes[indice].classList.add("enfocado");
        tarjetasPersonajes[indice].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
}

personajes.forEach(function (personaje, i) {
    personaje.addEventListener("click", function () {
        enfocarPersonaje(i);
        seleccionarPersonaje(personaje);
    });
});

// --- Pantalla del pasillo ---

// Elementos del pasillo
const pasillo = document.getElementById("pasillo");
const personajeJugador = document.getElementById("personaje-jugador");
const imgJugador = document.getElementById("img-jugador");

// Posición y movimiento
let posX = 0;
let posY = 0;
const velocidad = 4;
const tamPersonaje = 50;

// Teclas presionadas (para movimiento continuo)
const teclasPresionadas = {};
let loopActivo = false;

// Límites del pasillo (se calculan al iniciar)
let limiteDerecho = 0;
let limiteInferior = 0;

// --- Crear componentes ---

const contenedorJuego = document.getElementById("juego");
const barra = crearBarraSuperior(contenedorJuego);
const modal = crearModalPuerta(contenedorJuego);

// Escuchar cambios de inventario desde las habitaciones
document.addEventListener("inventario-cambio", function () {
    if (jugadorActual) {
        barra.actualizarInventario(jugadorActual);
    }
});

// Escuchar cambios de vida (trampas, combate, etc.)
document.addEventListener("vida-cambio", function () {
    if (jugadorActual) {
        barra.actualizarVida(jugadorActual);
    }
});

// --- Iniciar el juego ---

function iniciarJuego() {
    if (!personajeElegido) return;

    // Cambiar pantalla
    document.getElementById("seleccion-personaje").classList.add("oculto");
    document.getElementById("pantalla-juego").classList.remove("oculto");

    // Configurar personaje actual
    jugadorActual = PERSONAJES[personajeElegido];
    imgJugador.src = jugadorActual.img;
    imgJugador.alt = personajeElegido;

    // Quitar clases de personaje anteriores y poner la nueva
    personajeJugador.classList.remove("jugador-lina", "jugador-rose", "jugador-pandajuro", "jugador-hana", "jugador-donbu");
    personajeJugador.classList.add(jugadorActual.clase);

    // Calcular límites del pasillo
    limiteDerecho = pasillo.clientWidth - tamPersonaje;
    limiteInferior = pasillo.clientHeight - tamPersonaje;

    // Posicionar personaje en la entrada (abajo-centro)
    posX = (pasillo.clientWidth - tamPersonaje) / 2;
    posY = pasillo.clientHeight - tamPersonaje - 15;
    actualizarPosicion();

    // Mostrar barra superior
    barra.mostrar(jugadorActual);

    // Activar el game loop
    if (!loopActivo) {
        loopActivo = true;
        requestAnimationFrame(gameLoop);
    }
}

// --- Volver a selección ---

document.getElementById("btn-volver").addEventListener("click", function () {
    document.getElementById("pantalla-juego").classList.add("oculto");
    document.getElementById("seleccion-personaje").classList.remove("oculto");
    barra.ocultar();

    // Detener game loop
    loopActivo = false;

    // Limpiar selección
    personajeElegido = null;
    jugadorActual = null;
    indiceFoco = -1;
    personajes.forEach(function (p) {
        p.classList.remove("seleccionado", "enfocado");
        const overlay = p.querySelector(".seleccion-overlay");
        if (overlay) overlay.remove();
    });

    // Limpiar teclas
    Object.keys(teclasPresionadas).forEach(function (k) {
        delete teclasPresionadas[k];
    });
});

// --- Controles del teclado ---

document.addEventListener("keydown", function (e) {
    // Si el modal está abierto, delegar al componente
    if (modal.estaAbierto()) {
        modal.manejarTecla(e);
        return;
    }

    // Navegación con teclado en pantalla de selección
    const pantallaSeleccion = document.getElementById("seleccion-personaje");
    if (!pantallaSeleccion.classList.contains("oculto")) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            if (indiceFoco === -1) {
                enfocarPersonaje(0);
            } else if (e.key === "ArrowLeft") {
                enfocarPersonaje(Math.max(0, indiceFoco - 1));
            } else {
                enfocarPersonaje(Math.min(tarjetasPersonajes.length - 1, indiceFoco + 1));
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (indiceFoco >= 0) {
                const tarjetaFocada = tarjetasPersonajes[indiceFoco];
                if (tarjetaFocada.classList.contains("seleccionado")) {
                    iniciarJuego();
                } else {
                    seleccionarPersonaje(tarjetaFocada);
                }
            } else if (personajeElegido) {
                iniciarJuego();
            }
        }
        return;
    }

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        teclasPresionadas[e.key] = true;
    }
});

document.addEventListener("keyup", function (e) {
    delete teclasPresionadas[e.key];
});

// --- Game loop ---

function gameLoop() {
    if (!loopActivo) return;

    let dx = 0;
    let dy = 0;

    if (teclasPresionadas["ArrowUp"])    dy -= velocidad;
    if (teclasPresionadas["ArrowDown"])  dy += velocidad;
    if (teclasPresionadas["ArrowLeft"])  dx -= velocidad;
    if (teclasPresionadas["ArrowRight"]) dx += velocidad;

    if (dx !== 0 || dy !== 0) {
        moverPersonaje(dx, dy);
    }

    // Detectar colisión con puertas
    detectarColisionPuertas();

    requestAnimationFrame(gameLoop);
}

// --- Movimiento con colisiones ---

function moverPersonaje(dx, dy) {
    let nuevaX = posX + dx;
    let nuevaY = posY + dy;

    // Limitar a los bordes del pasillo
    if (nuevaX < 0) nuevaX = 0;
    if (nuevaX > limiteDerecho) nuevaX = limiteDerecho;
    if (nuevaY < 0) nuevaY = 0;
    if (nuevaY > limiteInferior) nuevaY = limiteInferior;

    posX = nuevaX;
    posY = nuevaY;
    actualizarPosicion();
}

function actualizarPosicion() {
    personajeJugador.style.left = posX + "px";
    personajeJugador.style.top = posY + "px";
}

// --- Detección de colisión con puertas ---

let esperandoSalirDePuerta = false;

function detectarColisionPuertas() {
    const puertas = document.querySelectorAll(".puerta");
    let tocandoAlguna = false;

    puertas.forEach(function (puerta) {
        const rect = puerta.getBoundingClientRect();
        const pasilloRect = pasillo.getBoundingClientRect();

        const px = rect.left - pasilloRect.left;
        const py = rect.top - pasilloRect.top;
        const pw = rect.width;
        const ph = rect.height;

        const colisiona =
            posX < px + pw &&
            posX + tamPersonaje > px &&
            posY < py + ph &&
            posY + tamPersonaje > py;

        if (colisiona) {
            tocandoAlguna = true;
            if (!esperandoSalirDePuerta && !modal.estaAbierto()) {
                loopActivo = false;
                modal.mostrar(puerta.dataset.puerta);
            }
        }
    });

    if (!tocandoAlguna) {
        esperandoSalirDePuerta = false;
    }
}

// --- Clic en las puertas ---

document.querySelectorAll(".puerta").forEach(function (puerta) {
    puerta.addEventListener("click", function () {
        if (!modal.estaAbierto()) {
            loopActivo = false;
            modal.mostrar(puerta.dataset.puerta);
        }
    });
});

// --- Callbacks del modal ---

modal.onCancelar(function () {
    esperandoSalirDePuerta = true;
    loopActivo = true;
    requestAnimationFrame(gameLoop);
});

modal.onEntrar(function (numeroPuerta) {
    esperandoSalirDePuerta = true;

    if (numeroPuerta === "1") {
        document.getElementById("pantalla-juego").classList.add("oculto");
        iniciarHabitacion1(jugadorActual, function () {
            document.getElementById("pantalla-juego").classList.remove("oculto");
            loopActivo = true;
            requestAnimationFrame(gameLoop);
        });
    } else {
        loopActivo = true;
        requestAnimationFrame(gameLoop);
    }
});
