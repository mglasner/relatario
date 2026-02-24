// Componente: Modo portrait para libros y juegos verticales
// Lock de orientacion a portrait + overlay "gira tu dispositivo" en landscape.
// No solicita fullscreen (a diferencia de modoInmersivo que es para juegos landscape).

import { crearOverlayRotar } from './overlayRotar.js';

export function crearModoPortrait(onCambio) {
    const esMobile = window.matchMedia('(pointer: coarse)').matches;
    let overlayRotar = null;

    function activar() {
        if (overlayRotar) return; // ya activo

        overlayRotar = crearOverlayRotar('portrait');
        overlayRotar.activar(function () {
            if (onCambio) requestAnimationFrame(onCambio);
        });

        if (esMobile && screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('portrait').catch(function () {});
        }
    }

    function desactivar() {
        if (esMobile && screen.orientation && screen.orientation.unlock) {
            try {
                screen.orientation.unlock();
            } catch {
                // API no disponible
            }
        }

        if (overlayRotar) {
            overlayRotar.desactivar();
            overlayRotar = null;
        }
    }

    return { esMobile, activar, desactivar };
}
