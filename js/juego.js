// Código de La Casa del Terror
import { PERSONAJES } from "./personajes.js";
import { ENEMIGOS } from "./enemigos.js";

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

const personajes = document.querySelectorAll(".personaje");
const btnJugar = document.getElementById("btn-jugar");

personajes.forEach(function (personaje) {
    personaje.addEventListener("click", function () {
        personajes.forEach(function (p) {
            p.classList.remove("seleccionado");
        });
        personaje.classList.add("seleccionado");
        personajeElegido = personaje.dataset.nombre;
        btnJugar.disabled = false;
        btnJugar.textContent = "¡Jugar con " + personajeElegido + "!";
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

// --- Iniciar el juego ---

btnJugar.addEventListener("click", function () {
    if (!personajeElegido) return;

    // Cambiar pantalla
    document.getElementById("seleccion-personaje").classList.add("oculto");
    document.getElementById("pantalla-juego").classList.remove("oculto");

    // Configurar personaje actual
    jugadorActual = PERSONAJES[personajeElegido];
    imgJugador.src = jugadorActual.img;
    imgJugador.alt = personajeElegido;

    // Quitar clases de personaje anteriores y poner la nueva
    personajeJugador.classList.remove("jugador-lina", "jugador-rose", "jugador-donbu");
    personajeJugador.classList.add(jugadorActual.clase);

    // Calcular límites del pasillo
    limiteDerecho = pasillo.clientWidth - tamPersonaje;
    limiteInferior = pasillo.clientHeight - tamPersonaje;

    // Posicionar personaje en la entrada (abajo-centro)
    posX = (pasillo.clientWidth - tamPersonaje) / 2;
    posY = pasillo.clientHeight - tamPersonaje - 15;
    actualizarPosicion();

    // Activar el game loop
    if (!loopActivo) {
        loopActivo = true;
        requestAnimationFrame(gameLoop);
    }
});

// --- Volver a selección ---

document.getElementById("btn-volver").addEventListener("click", function () {
    document.getElementById("pantalla-juego").classList.add("oculto");
    document.getElementById("seleccion-personaje").classList.remove("oculto");

    // Detener game loop
    loopActivo = false;

    // Limpiar selección
    personajeElegido = null;
    jugadorActual = null;
    personajes.forEach(function (p) {
        p.classList.remove("seleccionado");
    });
    btnJugar.disabled = true;
    btnJugar.textContent = "Elige un personaje para continuar";

    // Limpiar teclas
    Object.keys(teclasPresionadas).forEach(function (k) {
        delete teclasPresionadas[k];
    });
});

// --- Controles del teclado ---

document.addEventListener("keydown", function (e) {
    // Si el modal está abierto, manejar navegación del modal
    if (!modalPuerta.classList.contains("oculto")) {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            botonModalSeleccionado = botonModalSeleccionado === 0 ? 1 : 0;
            actualizarFocoModal();
        } else if (e.key === "Enter") {
            e.preventDefault();
            botonesModal[botonModalSeleccionado].click();
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

let esperandoSalirDePuerta = false; // Evita reabrir el modal al cerrar si sigue tocando la puerta

function detectarColisionPuertas() {
    const puertas = document.querySelectorAll(".puerta");
    let tocandoAlguna = false;

    puertas.forEach(function (puerta) {
        const rect = puerta.getBoundingClientRect();
        const pasilloRect = pasillo.getBoundingClientRect();

        // Posición de la puerta relativa al pasillo
        const px = rect.left - pasilloRect.left;
        const py = rect.top - pasilloRect.top;
        const pw = rect.width;
        const ph = rect.height;

        // Verificar si el jugador se superpone con la puerta
        const colisiona =
            posX < px + pw &&
            posX + tamPersonaje > px &&
            posY < py + ph &&
            posY + tamPersonaje > py;

        if (colisiona) {
            tocandoAlguna = true;
            if (!esperandoSalirDePuerta && modalPuerta.classList.contains("oculto")) {
                mostrarModalPuerta(puerta.dataset.puerta);
            }
        }
    });

    // Si ya no toca ninguna puerta, desbloquear
    if (!tocandoAlguna) {
        esperandoSalirDePuerta = false;
    }
}

// --- Modal de confirmación para puertas ---

const modalPuerta = document.getElementById("modal-puerta");
const modalTitulo = document.getElementById("modal-titulo");
const modalMensaje = document.getElementById("modal-mensaje");
const btnEntrar = document.getElementById("btn-entrar");
const btnCancelar = document.getElementById("btn-cancelar");

let puertaActiva = null; // número de la puerta seleccionada

let botonModalSeleccionado = 0; // 0 = Entrar, 1 = Cancelar
const botonesModal = [btnEntrar, btnCancelar];

function actualizarFocoModal() {
    botonesModal.forEach(function (btn, i) {
        if (i === botonModalSeleccionado) {
            btn.classList.add("modal-btn-foco");
        } else {
            btn.classList.remove("modal-btn-foco");
        }
    });
}

function mostrarModalPuerta(numeroPuerta) {
    puertaActiva = numeroPuerta;
    modalTitulo.textContent = "Habitación " + numeroPuerta;
    modalMensaje.textContent = "¿Quieres entrar a esta habitación?";
    modalPuerta.classList.remove("oculto");
    loopActivo = false; // Pausar movimiento mientras el modal está abierto
    botonModalSeleccionado = 0;
    actualizarFocoModal();
}

function cerrarModalPuerta() {
    modalPuerta.classList.add("oculto");
    puertaActiva = null;
    esperandoSalirDePuerta = true; // No reabrir hasta que se aleje de la puerta
    loopActivo = true;
    requestAnimationFrame(gameLoop);
}

// Clic en las puertas
document.querySelectorAll(".puerta").forEach(function (puerta) {
    puerta.addEventListener("click", function () {
        if (modalPuerta.classList.contains("oculto")) {
            mostrarModalPuerta(puerta.dataset.puerta);
        }
    });
});

// Botones del modal
btnCancelar.addEventListener("click", cerrarModalPuerta);

btnEntrar.addEventListener("click", function () {
    cerrarModalPuerta();
    // TODO: Cargar la habitación correspondiente
    console.log("Entrando a la habitación " + puertaActiva);
});

// Cerrar modal con el fondo
document.querySelector(".modal-fondo").addEventListener("click", cerrarModalPuerta);
