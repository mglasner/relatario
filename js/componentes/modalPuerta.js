// Componente: Modal de confirmación para entrar a una habitación
// Muestra diálogo temático con icono, nivel y descripción de cada habitación

const HABITACIONES = {
    1: {
        icono: '🏰',
        nombre: 'El Laberinto',
        nivel: 'Nivel 1',
        descripcion: 'Un oscuro laberinto de piedra te espera... ¿encontrarás la salida?',
        boton: 'Entrar al laberinto',
        accent: '#bb86fc',
        fondo: '#2a1a3e',
    },
    2: {
        icono: '👁️',
        nombre: 'El Laberinto 3D',
        nivel: 'Nivel 2',
        descripcion: 'Las paredes se mueven y los pasillos no tienen fin...',
        boton: 'Entrar al laberinto 3D',
        accent: '#6bfc86',
        fondo: '#1a3e1a',
    },
    3: {
        iconoImg: 'assets/img/habitaciones/memorice-icon.webp',
        nombre: 'El Memorice',
        nivel: 'Nivel 3',
        descripcion: 'Cartas boca abajo cubren la mesa... ¿podrás recordar dónde está cada par?',
        boton: 'Voltear cartas',
        accent: '#e94560',
        fondo: '#3e1a1a',
    },
    4: {
        icono: '🌊',
        nombre: 'El Abismo',
        nivel: 'Nivel 4',
        descripcion: 'Se escuchan ecos desde las profundidades...',
        boton: 'Entrar',
        accent: '#5eeadb',
        fondo: '#1a1a3e',
    },
};

const HAB_DEFAULT = {
    icono: '🚪',
    nombre: 'Habitación desconocida',
    nivel: '???',
    descripcion: 'Nadie sabe qué hay detrás de esta puerta...',
    boton: 'Entrar',
    accent: '#e94560',
    fondo: '#16213e',
};

export function crearModalPuerta(contenedor) {
    let puertaActiva = null;
    let botonSeleccionado = 0;
    let callbackEntrar = null;
    let callbackCancelar = null;

    // --- Crear estructura DOM ---

    const el = document.createElement('div');
    el.id = 'modal-puerta';
    el.classList.add('oculto');

    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';

    const contenido = document.createElement('div');
    contenido.className = 'modal-contenido';

    const lineaDecorativa = document.createElement('div');
    lineaDecorativa.className = 'modal-puerta-linea';

    const iconoDiv = document.createElement('div');
    iconoDiv.className = 'modal-puerta-icono';

    const nivelSpan = document.createElement('span');
    nivelSpan.className = 'modal-puerta-nivel';

    const titulo = document.createElement('h2');
    titulo.id = 'modal-titulo';

    const mensaje = document.createElement('p');
    mensaje.id = 'modal-mensaje';

    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'modal-botones';

    const btnEntrar = document.createElement('button');
    btnEntrar.id = 'btn-entrar';
    btnEntrar.textContent = 'Entrar';

    const btnCancelar = document.createElement('button');
    btnCancelar.id = 'btn-cancelar';
    btnCancelar.textContent = 'No, mejor no';

    botonesDiv.appendChild(btnEntrar);
    botonesDiv.appendChild(btnCancelar);
    contenido.appendChild(lineaDecorativa);
    contenido.appendChild(iconoDiv);
    contenido.appendChild(nivelSpan);
    contenido.appendChild(titulo);
    contenido.appendChild(mensaje);
    contenido.appendChild(botonesDiv);
    el.appendChild(fondo);
    el.appendChild(contenido);
    contenedor.appendChild(el);

    const botones = [btnEntrar, btnCancelar];

    // --- Funciones internas ---

    function actualizarFoco() {
        botones.forEach(function (btn, i) {
            if (i === botonSeleccionado) {
                btn.classList.add('modal-btn-foco');
            } else {
                btn.classList.remove('modal-btn-foco');
            }
        });
    }

    function cerrarYEjecutar(callback) {
        const puerta = puertaActiva;
        api.cerrar();
        if (callback) callback(puerta);
    }

    // --- Eventos ---

    btnEntrar.addEventListener('click', function () {
        cerrarYEjecutar(callbackEntrar);
    });

    btnCancelar.addEventListener('click', function () {
        cerrarYEjecutar(callbackCancelar);
    });

    fondo.addEventListener('click', function () {
        cerrarYEjecutar(callbackCancelar);
    });

    // --- API del componente ---

    const api = {
        mostrar: function (numeroPuerta) {
            puertaActiva = numeroPuerta;
            const hab = HABITACIONES[numeroPuerta] || HAB_DEFAULT;

            // Ícono: imagen o emoji
            iconoDiv.textContent = '';
            if (hab.iconoImg) {
                const img = document.createElement('img');
                img.src = hab.iconoImg;
                img.alt = hab.nombre;
                img.className = 'modal-puerta-icono-img';
                iconoDiv.appendChild(img);
            } else {
                iconoDiv.textContent = hab.icono;
            }
            nivelSpan.textContent = hab.nivel;
            titulo.textContent = hab.nombre;
            mensaje.textContent = hab.descripcion;
            btnEntrar.textContent = hab.boton;

            // Aplicar colores de la habitación
            contenido.style.setProperty('--modal-accent', hab.accent);
            contenido.style.setProperty('--modal-fondo', hab.fondo);

            el.classList.remove('oculto');
            botonSeleccionado = 0;
            actualizarFoco();
        },

        cerrar: function () {
            el.classList.add('oculto');
            puertaActiva = null;
        },

        estaAbierto: function () {
            return !el.classList.contains('oculto');
        },

        // Maneja navegación con flechas y Enter dentro del modal
        manejarTecla: function (e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                botonSeleccionado = botonSeleccionado === 0 ? 1 : 0;
                actualizarFoco();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                botones[botonSeleccionado].click();
            }
        },

        onEntrar: function (callback) {
            callbackEntrar = callback;
        },

        onCancelar: function (callback) {
            callbackCancelar = callback;
        },
    };

    return api;
}
