// Componente: Modo inmersivo para juegos landscape
// Encapsula detección mobile (pointer: coarse), pantalla completa y overlay de rotación.
// Solo solicita fullscreen en dispositivos mobile reales, no en desktop con touch.

import { crearOverlayRotar } from './overlayRotar.js';

export function crearModoInmersivo(onCambio) {
    const esMobile = window.matchMedia('(pointer: coarse)').matches;
    let overlayRotar = null;
    // AbortController agrupa listeners para limpieza segura
    let ac = null;

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
            ac = new AbortController();
            document.addEventListener('fullscreenchange', onFullscreenChange, {
                signal: ac.signal,
            });
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
            // Limpia el listener de fullscreenchange de forma segura
            if (ac) {
                ac.abort();
                ac = null;
            }
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(function () {});
            }
            if (screen.orientation && screen.orientation.unlock) {
                try {
                    screen.orientation.unlock();
                } catch {
                    // API no disponible
                }
            }
        }

        if (overlayRotar) {
            overlayRotar.desactivar();
            overlayRotar = null;
        }
    }

    return { esMobile, activar, desactivar };
}
