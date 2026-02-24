// Modal reutilizable para mostrar un libro con overlay, fondo click-to-close y botón cerrar

import { crearElemento } from '../utils.js';

// Crea un modal con overlay, fondo click-to-close, botón cerrar y libro dentro
export function crearModalLibro(libro, manejarTecladoLibro) {
    const overlay = crearElemento('div', 'libro-modal oculto');

    const fondo = crearElemento('div', 'libro-modal-fondo');
    overlay.appendChild(fondo);

    const cuerpo = crearElemento('div', 'libro-modal-cuerpo');

    const btnCerrar = crearElemento('button', 'libro-modal-cerrar', '\u00D7');
    btnCerrar.type = 'button';
    btnCerrar.setAttribute('aria-label', 'Cerrar libro');
    cuerpo.appendChild(btnCerrar);

    cuerpo.appendChild(libro);
    overlay.appendChild(cuerpo);

    // AbortController agrupa todos los listeners del modal para limpieza segura
    let ac = null;
    let callbackCerrar = null;

    function manejarTeclado(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            cerrar();
        }
    }

    // Focus trap: mantener foco dentro del modal mientras está abierto
    function manejarFocusTrap(e) {
        if (e.key !== 'Tab') return;
        const focusables = cuerpo.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"]), a[href], input, select, textarea'
        );
        if (focusables.length === 0) return;
        const primero = focusables[0];
        const ultimo = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
            e.preventDefault();
            ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
            e.preventDefault();
            primero.focus();
        }
    }

    function abrir() {
        // Limpiar listeners previos si el modal se reabre sin cerrar
        if (ac) ac.abort();
        ac = new AbortController();
        const signal = ac.signal;

        overlay.classList.remove('oculto');
        document.addEventListener('keydown', manejarTeclado, { signal });
        document.addEventListener('keydown', manejarTecladoLibro, { signal });
        document.addEventListener('keydown', manejarFocusTrap, { signal });

        // Mover foco al botón de cerrar al abrir
        btnCerrar.focus();
    }

    function cerrar() {
        overlay.classList.add('oculto');
        if (ac) {
            ac.abort();
            ac = null;
        }
        if (callbackCerrar) callbackCerrar();
    }

    function estaAbierto() {
        return !overlay.classList.contains('oculto');
    }

    function onCerrar(cb) {
        callbackCerrar = cb;
    }

    fondo.addEventListener('click', cerrar);
    btnCerrar.addEventListener('click', cerrar);

    return { overlay, abrir, cerrar, estaAbierto, onCerrar };
}
