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
