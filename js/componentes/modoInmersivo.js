// Componente: Modo inmersivo para habitaciones landscape
// Encapsula detección mobile (pointer: coarse), pantalla completa y overlay de rotación.
// Solo solicita fullscreen en dispositivos mobile reales, no en desktop con touch.

import { crearOverlayRotar } from './overlayRotar.js';

export function crearModoInmersivo(onCambio) {
    const esMobile = window.matchMedia('(pointer: coarse)').matches;
    let overlayRotar = null;

    function onFullscreenChange() {
        // Doble rAF: el layout no se actualiza en el mismo frame que fullscreenchange
        requestAnimationFrame(function () {
            requestAnimationFrame(onCambio);
        });
    }

    function activar() {
        if (overlayRotar) return; // ya activo

        overlayRotar = crearOverlayRotar();
        overlayRotar.activar(function () {
            requestAnimationFrame(onCambio);
        });

        if (esMobile) {
            document.addEventListener('fullscreenchange', onFullscreenChange);
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen()
                    .then(function () {
                        if (screen.orientation && screen.orientation.lock) {
                            screen.orientation.lock('landscape').catch(function () {});
                        }
                    })
                    .catch(function () {
                        // Fullscreen no disponible o denegado
                    });
            }
        }
    }

    function desactivar() {
        if (esMobile) {
            document.removeEventListener('fullscreenchange', onFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(function () {});
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        }

        if (overlayRotar) {
            overlayRotar.desactivar();
            overlayRotar = null;
        }
    }

    return { esMobile, activar, desactivar };
}
