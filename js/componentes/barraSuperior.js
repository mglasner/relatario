// Componente: Barra superior del jugador
// Muestra avatar, vida e inventario durante el juego

const ITEMS_INFO = {
    'llave-habitacion-2': { icono: '🔑', color: '#bb86fc', slot: 0 },
    'llave-habitacion-3': { icono: '🔑', color: '#6bfc86', slot: 1 },
    'llave-habitacion-4': { icono: '🔑', color: '#e94560', slot: 2 },
    'llave-habitacion-5': { icono: '🔑', color: '#5eeadb', slot: 3 },
};

const TOTAL_SLOTS = 4;

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

    const nombre = document.createElement('span');
    nombre.id = 'barra-nombre';

    jugadorDiv.appendChild(avatar);
    jugadorDiv.appendChild(nombre);

    // Barra de vida
    const vidaDiv = document.createElement('div');
    vidaDiv.className = 'barra-vida-jugador';

    const corazon = document.createElement('span');
    corazon.className = 'barra-vida-corazon';
    corazon.textContent = '\u2764\uFE0F';

    const barraFondo = document.createElement('div');
    barraFondo.className = 'barra-vida-fondo';

    const barraRelleno = document.createElement('div');
    barraRelleno.className = 'barra-vida-relleno';

    const vidaTexto = document.createElement('span');
    vidaTexto.className = 'barra-vida-texto';

    barraFondo.appendChild(barraRelleno);
    barraFondo.appendChild(vidaTexto);

    vidaDiv.appendChild(corazon);
    vidaDiv.appendChild(barraFondo);

    // Inventario con slots
    const invDiv = document.createElement('div');
    invDiv.className = 'barra-inventario';

    const slots = [];
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const slot = document.createElement('div');
        slot.className = 'inventario-slot';
        invDiv.appendChild(slot);
        slots.push(slot);
    }

    // Ensamblar
    el.appendChild(jugadorDiv);
    el.appendChild(vidaDiv);
    el.appendChild(invDiv);
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
            const porcentaje = Math.round((jugador.vidaActual / jugador.vidaMax) * 100);
            barraRelleno.style.transform = 'scaleX(' + porcentaje / 100 + ')';
            vidaTexto.textContent = jugador.vidaActual + '/' + jugador.vidaMax;

            // Color dinámico: verde → amarillo → rojo
            if (porcentaje > 60) {
                barraRelleno.style.background = 'linear-gradient(90deg, #2ecc71, #6bfc86)';
            } else if (porcentaje > 30) {
                barraRelleno.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
            } else {
                barraRelleno.style.background = 'linear-gradient(90deg, #e74c3c, #e94560)';
            }

            // Estado de peligro (corazón late rápido)
            vidaDiv.classList.toggle('barra-vida-peligro', porcentaje <= 25);
        },

        actualizarInventario: function (jugador) {
            // Resetear todos los slots
            slots.forEach(function (slot) {
                slot.className = 'inventario-slot';
                slot.textContent = '';
                slot.style.removeProperty('--slot-color');
            });

            // Llenar los slots que tienen items
            jugador.inventario.forEach(function (item) {
                const info = ITEMS_INFO[item];
                if (!info) return;
                const slot = slots[info.slot];
                slot.classList.add('inventario-slot-lleno');
                slot.textContent = info.icono;
                slot.style.setProperty('--slot-color', info.color);
            });
        },
    };

    return api;
}
