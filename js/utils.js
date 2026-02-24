// Utilidades compartidas

/**
 * Crea un elemento DOM con clase y texto opcionales.
 * @param {string} tag - Tipo de elemento (ej: 'div', 'p', 'span')
 * @param {string} [clase] - Clase CSS a asignar
 * @param {string} [texto] - Contenido de texto
 * @returns {HTMLElement}
 */
export function crearElemento(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto) el.textContent = texto;
    return el;
}

/**
 * Crea un game loop con manejo seguro de requestAnimationFrame.
 * Calcula delta-time normalizado a 60 fps (dt ≈ 1.0 a 60 fps).
 * @param {Function} fn - Funcion a ejecutar cada frame (recibe timestamp y dt)
 * @returns {{ iniciar: Function, detener: Function }}
 */
export function crearGameLoop(fn) {
    let id = null;
    let lastTime = 0;
    return {
        iniciar() {
            if (id !== null) return;
            lastTime = 0;
            const loop = function (tiempo) {
                // Primer frame: inicializar sin delta (dt = 1)
                const dt = lastTime === 0 ? 1 : Math.min((tiempo - lastTime) / 16.667, 3);
                lastTime = tiempo;
                fn(tiempo, dt);
                // Solo programar siguiente frame si fn() no llamo a detener()
                if (id !== null) {
                    id = requestAnimationFrame(loop);
                }
            };
            id = requestAnimationFrame(loop);
        },
        detener() {
            if (id !== null) {
                cancelAnimationFrame(id);
                id = null;
            }
        },
    };
}

/**
 * Crea un tracker de timeouts que permite limpiarlos todos de una vez.
 * Evita callbacks huérfanos al destruir componentes.
 * @returns {{ set: Function, limpiar: Function }}
 */
export function crearTimeoutTracker() {
    const ids = new Set();
    return {
        /** Registra un setTimeout y lo rastrea. Retorna el id. */
        set(fn, ms) {
            const id = setTimeout(function () {
                ids.delete(id);
                fn();
            }, ms);
            ids.add(id);
            return id;
        },
        /** Cancela todos los timeouts pendientes. */
        limpiar() {
            ids.forEach(clearTimeout);
            ids.clear();
        },
    };
}
