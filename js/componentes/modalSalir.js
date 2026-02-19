// Componente: Modal de confirmación para salir del pasillo
// Advierte al jugador que perderá su avance si vuelve al menú

export function crearModalSalir(contenedor) {
    let botonSeleccionado = 1; // Foco inicial en "Seguir jugando"
    let callbackConfirmar = null;
    let callbackCancelar = null;

    // --- Crear estructura DOM ---

    const el = document.createElement('div');
    el.id = 'modal-salir';
    el.classList.add('oculto');

    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';

    const contenido = document.createElement('div');
    contenido.className = 'modal-contenido';

    const lineaDecorativa = document.createElement('div');
    lineaDecorativa.className = 'modal-salir-linea';

    const iconoDiv = document.createElement('div');
    iconoDiv.className = 'modal-salir-icono';
    iconoDiv.textContent = '\u26A0\uFE0F';

    const titulo = document.createElement('h2');
    titulo.textContent = '\u00BFVolver al men\u00FA?';

    const mensaje = document.createElement('p');
    mensaje.textContent =
        'Perder\u00E1s todo tu avance: items e inventario. Tendr\u00E1s que empezar de nuevo.';

    const botonesDiv = document.createElement('div');
    botonesDiv.className = 'modal-botones';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.className = 'modal-salir-btn-confirmar';
    btnConfirmar.textContent = 'S\u00ED, volver';

    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'modal-salir-btn-cancelar';
    btnCancelar.textContent = 'Seguir jugando';

    botonesDiv.appendChild(btnConfirmar);
    botonesDiv.appendChild(btnCancelar);
    contenido.appendChild(lineaDecorativa);
    contenido.appendChild(iconoDiv);
    contenido.appendChild(titulo);
    contenido.appendChild(mensaje);
    contenido.appendChild(botonesDiv);
    el.appendChild(fondo);
    el.appendChild(contenido);
    contenedor.appendChild(el);

    const botones = [btnConfirmar, btnCancelar];

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
        api.cerrar();
        if (callback) callback();
    }

    // --- Eventos ---

    btnConfirmar.addEventListener('click', function () {
        cerrarYEjecutar(callbackConfirmar);
    });

    btnCancelar.addEventListener('click', function () {
        cerrarYEjecutar(callbackCancelar);
    });

    fondo.addEventListener('click', function () {
        cerrarYEjecutar(callbackCancelar);
    });

    // --- API del componente ---

    const api = {
        mostrar: function () {
            el.classList.remove('oculto');
            botonSeleccionado = 1; // Foco en "Seguir jugando"
            actualizarFoco();
        },

        cerrar: function () {
            el.classList.add('oculto');
        },

        estaAbierto: function () {
            return !el.classList.contains('oculto');
        },

        manejarTecla: function (e) {
            if (e.key === 'Escape') {
                e.preventDefault();
                cerrarYEjecutar(callbackCancelar);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                botonSeleccionado = botonSeleccionado === 0 ? 1 : 0;
                actualizarFoco();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                botones[botonSeleccionado].click();
            }
        },

        onConfirmar: function (callback) {
            callbackConfirmar = callback;
        },

        onCancelar: function (callback) {
            callbackCancelar = callback;
        },
    };

    return api;
}
