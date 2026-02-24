// Componente: Overlay "gira tu dispositivo"
// Muestra un overlay fullscreen pidiendo rotar a la orientacion deseada.
// Solo activo en dispositivos touch. Usa matchMedia para detectar orientacion.
// @param {string} orientacionDeseada — 'landscape' (por defecto) o 'portrait'

export function crearOverlayRotar(orientacionDeseada = 'landscape') {
    const esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!esTouch) {
        return {
            activar() {},
            desactivar() {},
            estaVisible() {
                return false;
            },
        };
    }

    // Crear overlay
    const overlay = document.createElement('div');
    overlay.className = 'overlay-rotar oculto';
    if (orientacionDeseada === 'portrait') {
        overlay.classList.add('overlay-rotar-portrait');
    }

    const icono = document.createElement('div');
    icono.className = 'overlay-rotar-icono';
    icono.textContent = '📱';

    const mensaje = document.createElement('p');
    mensaje.className = 'overlay-rotar-mensaje';
    mensaje.textContent = 'Gira tu dispositivo';

    overlay.appendChild(icono);
    overlay.appendChild(mensaje);
    document.body.appendChild(overlay);

    // Detectar la orientacion opuesta a la deseada
    const consultaOpuesta =
        orientacionDeseada === 'landscape' ? '(orientation: portrait)' : '(orientation: landscape)';

    let mediaQuery = null;
    let onChangeCallback = null;

    function alCambiarOrientacion(e) {
        // e.matches = true cuando estamos en la orientacion NO deseada → mostrar overlay
        if (e.matches) {
            overlay.classList.remove('oculto');
        } else {
            overlay.classList.add('oculto');
        }
        if (onChangeCallback) onChangeCallback(!e.matches);
    }

    function activar(onChange) {
        onChangeCallback = onChange || null;
        mediaQuery = window.matchMedia(consultaOpuesta);
        mediaQuery.addEventListener('change', alCambiarOrientacion);

        // Estado inicial
        if (mediaQuery.matches) {
            overlay.classList.remove('oculto');
        } else {
            overlay.classList.add('oculto');
        }
    }

    function desactivar() {
        if (mediaQuery) {
            mediaQuery.removeEventListener('change', alCambiarOrientacion);
            mediaQuery = null;
        }
        onChangeCallback = null;
        overlay.classList.add('oculto');

        try {
            screen.orientation.unlock();
        } catch {
            // API no disponible
        }

        // Remover del DOM
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }

    function estaVisible() {
        return !overlay.classList.contains('oculto');
    }

    return { activar, desactivar, estaVisible };
}
