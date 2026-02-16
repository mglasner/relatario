// Código de La Casa del Terror
console.log("¡La Casa del Terror está cargando!");

// Variable para guardar el personaje elegido
let personajeElegido = null;

// Buscar todos los personajes en la página
const personajes = document.querySelectorAll(".personaje");
const btnJugar = document.getElementById("btn-jugar");

// Cuando haces clic en un personaje...
personajes.forEach(function (personaje) {
    personaje.addEventListener("click", function () {
        // Quitar selección anterior
        personajes.forEach(function (p) {
            p.classList.remove("seleccionado");
        });

        // Marcar el nuevo personaje como seleccionado
        personaje.classList.add("seleccionado");

        // Guardar el nombre del personaje
        personajeElegido = personaje.dataset.nombre;

        // Activar el botón
        btnJugar.disabled = false;
        btnJugar.textContent = "¡Jugar con " + personajeElegido + "!";
    });
});

// Cuando haces clic en el botón de jugar...
btnJugar.addEventListener("click", function () {
    if (!personajeElegido) return;

    // Ocultar selección y mostrar pantalla de juego
    document.getElementById("seleccion-personaje").classList.add("oculto");
    document.getElementById("pantalla-juego").classList.remove("oculto");

    // Mostrar mensaje de bienvenida
    document.getElementById("mensaje-bienvenida").textContent =
        "¡" + personajeElegido + " entra a la casa del terror! ¿Qué encontrará adentro...?";
});

// Cuando haces clic en "Volver"...
document.getElementById("btn-volver").addEventListener("click", function () {
    // Mostrar selección y ocultar pantalla de juego
    document.getElementById("pantalla-juego").classList.add("oculto");
    document.getElementById("seleccion-personaje").classList.remove("oculto");

    // Limpiar la selección anterior
    personajeElegido = null;
    personajes.forEach(function (p) {
        p.classList.remove("seleccionado");
    });
    btnJugar.disabled = true;
    btnJugar.textContent = "Elige un personaje para continuar";
});
