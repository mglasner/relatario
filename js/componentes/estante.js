// Componente: Estante de biblioteca (homepage)
// Escena inmersiva con mueble de madera, partículas flotantes y libros interactivos

import { crearElemento } from '../utils.js';

const TOTAL_PARTICULAS = 20;

/**
 * Crea el estante de la biblioteca con escena inmersiva.
 * @param {HTMLElement} contenedor - Elemento donde montar el estante
 * @param {Array<Array<{id: string, titulo: string, color: string, img?: string, onClick: Function}>>} repisas - Array de repisas (cada repisa es un array de libros)
 * @returns {{ mostrar: Function, ocultar: Function, destruir: Function }}
 */
export function crearEstante(contenedor, repisas) {
    const escena = crearElemento('div', 'escena-biblioteca oculto');

    // Partículas de polvo flotante
    const particulas = crearElemento('div', 'escena-particulas');
    for (let i = 0; i < TOTAL_PARTICULAS; i++) {
        const p = crearElemento('div', 'particula');
        p.style.setProperty('--x', Math.random() * 100 + '%');
        p.style.setProperty('--drift', (Math.random() - 0.5) * 60 + 'px');
        p.style.setProperty('--dur', 15 + Math.random() * 20 + 's');
        p.style.setProperty('--delay', -Math.random() * 20 + 's');
        p.style.setProperty('--size', 2 + Math.random() * 3 + 'px');
        p.style.setProperty('--alpha', 0.2 + Math.random() * 0.3);
        particulas.appendChild(p);
    }
    escena.appendChild(particulas);

    // Overlay de luz de ventana
    escena.appendChild(crearElemento('div', 'escena-luz'));

    // Mueble
    const mueble = crearElemento('div', 'estante');

    // Corona decorativa (moldura superior)
    mueble.appendChild(crearElemento('div', 'estante-corona'));

    // Encabezado
    const encabezado = crearElemento('header', 'estante-encabezado');
    encabezado.appendChild(crearElemento('h1', 'estante-titulo', 'El Relatario'));
    encabezado.appendChild(crearElemento('p', 'estante-subtitulo', 'un compendio de relatos'));
    mueble.appendChild(encabezado);

    // Repisas con lomos de libro
    let repisaPrimaria = null;
    const repisasSecundarias = [];

    repisas.forEach(function (libros, iRepisa) {
        // Omitir repisas vac\u00edas
        if (!libros || libros.length === 0) return;

        const repisa = crearElemento('nav', 'estante-repisa');
        if (iRepisa > 0) repisa.classList.add('estante-repisa-secundaria');
        repisa.setAttribute('aria-label', iRepisa === 0 ? 'Libros' : 'M\u00e1s libros');

        if (iRepisa === 0) {
            repisaPrimaria = repisa;
        } else {
            repisasSecundarias.push(repisa);
        }

        libros.forEach(function (libro) {
            // Contenedor: lomo + etiqueta debajo
            const columna = crearElemento('div', 'estante-libro');

            const lomo = crearElemento('button', 'estante-lomo');
            lomo.type = 'button';
            lomo.dataset.libro = libro.id;
            lomo.style.setProperty('--lomo-color', libro.color);

            if (libro.img) {
                const img = crearElemento('img', 'estante-lomo-img');
                img.src = libro.img;
                img.alt = libro.titulo;
                img.draggable = false;
                lomo.appendChild(img);
            }

            lomo.addEventListener('click', libro.onClick);

            columna.appendChild(lomo);
            columna.appendChild(crearElemento('span', 'estante-lomo-titulo', libro.titulo));
            repisa.appendChild(columna);
        });

        mueble.appendChild(repisa);

        // Tabla de la repisa (frente visible del estante)
        mueble.appendChild(crearElemento('div', 'estante-tabla'));
    });

    // Alinear el primer lomo de las repisas secundarias con el de la primaria
    function alinearRepisas() {
        if (!repisaPrimaria || repisasSecundarias.length === 0) return;
        const lomoRef = repisaPrimaria.querySelector('.estante-lomo');
        if (!lomoRef) return;

        const xLomo = lomoRef.getBoundingClientRect().left;

        repisasSecundarias.forEach(function (r) {
            // Resetear para medir posici\u00f3n natural
            r.style.paddingLeft = '';
            const lomoSec = r.querySelector('.estante-lomo');
            if (!lomoSec) return;
            const xSec = lomoSec.getBoundingClientRect().left;
            const correccion = xLomo - xSec;
            if (Math.abs(correccion) > 0.5) {
                r.style.paddingLeft =
                    parseFloat(getComputedStyle(r).paddingLeft) + correccion + 'px';
            }
        });
    }

    // Base del mueble
    mueble.appendChild(crearElemento('div', 'estante-base'));

    escena.appendChild(mueble);

    // Sombra proyectada en el piso
    escena.appendChild(crearElemento('div', 'estante-sombra-piso'));

    contenedor.appendChild(escena);

    let visible = false;

    return {
        mostrar: function () {
            if (visible) return;
            visible = true;
            escena.classList.remove('oculto');
            escena.classList.remove('escena-entrada');
            requestAnimationFrame(function () {
                alinearRepisas();
                escena.classList.add('escena-entrada');
            });
        },
        ocultar: function () {
            visible = false;
            escena.classList.add('oculto');
            escena.classList.remove('escena-entrada');
        },
        destruir: function () {
            escena.remove();
        },
    };
}
