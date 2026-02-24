// Componente: Barra superior del jugador
// Muestra avatar, vida e inventario durante el juego

import { crearBarraVida } from './barraVida.js';
import { crearInventario } from './inventario.js';

export function crearBarraSuperior(contenedor) {
    // --- Crear estructura DOM ---

    const el = document.createElement('div');
    el.id = 'barra-superior';
    el.classList.add('oculto');

    // Jugador (avatar + nombre)
    const jugadorDiv = document.createElement('div');
    jugadorDiv.className = 'barra-jugador';

    const avatar = document.createElement('img');
    avatar.id = 'barra-avatar';
    avatar.width = 40;
    avatar.height = 40;

    const nombre = document.createElement('span');
    nombre.id = 'barra-nombre';

    jugadorDiv.appendChild(avatar);
    jugadorDiv.appendChild(nombre);

    // Barra de vida (componente reutilizable)
    const barraVida = crearBarraVida({ mostrarTexto: true });

    // Inventario (componente reutilizable)
    const inventario = crearInventario();

    // Ensamblar
    el.appendChild(jugadorDiv);
    el.appendChild(barraVida.el);
    el.appendChild(inventario.el);
    contenedor.prepend(el);

    // --- API del componente ---

    const api = {
        mostrar: function (jugador) {
            avatar.src = jugador.img;
            avatar.alt = jugador.nombre;
            nombre.textContent = jugador.nombre;

            // Clase de color según personaje
            el.className = 'barra-superior';
            el.classList.add(jugador.clase.replace('jugador-', 'barra-'));

            api.actualizarVida(jugador);
            api.actualizarInventario(jugador);
        },

        ocultar: function () {
            el.classList.add('oculto');
        },

        actualizarVida: function (jugador) {
            barraVida.actualizar(jugador.vidaActual, jugador.vidaMax);
        },

        actualizarInventario: function (jugador) {
            inventario.actualizar(jugador.inventario);
        },
    };

    return api;
}
