// Libro de Villanos — bestiario con índice y detalle (botón flotante + modal)

import { crearElemento } from '../utils.js';
import { TIERS, llenarStats } from './stats.js';
import { ENEMIGOS } from '../enemigos.js';

// Orden fijo por tier (esbirro → terror → pesadilla → leyenda)
const ORDEN_TIER = ['esbirro', 'terror', 'pesadilla', 'leyenda'];

function ordenarPorTier(nombres) {
    return nombres.slice().sort(function (a, b) {
        const tierA = ORDEN_TIER.indexOf(ENEMIGOS[a].tier);
        const tierB = ORDEN_TIER.indexOf(ENEMIGOS[b].tier);
        return tierA - tierB;
    });
}

// Genera el contenido de detalle para un villano
function generarDetalle(nombre) {
    const datos = ENEMIGOS[nombre];
    const contenido = crearElemento('div', 'libro-detalle-contenido');
    contenido.className = 'libro-detalle-contenido ' + datos.clase;

    // Avatar circular
    const avatarDiv = crearElemento('div', 'avatar');
    const img = document.createElement('img');
    img.src = datos.img;
    img.alt = nombre;
    avatarDiv.appendChild(img);
    contenido.appendChild(avatarDiv);

    // Nombre + badge de tier
    const cabecera = crearElemento('div', 'libro-detalle-cabecera');
    cabecera.appendChild(crearElemento('h3', null, nombre));

    if (datos.tier && TIERS[datos.tier]) {
        const tier = TIERS[datos.tier];
        const badge = crearElemento(
            'span',
            'tier-badge tier-' + datos.tier,
            tier.emoji + ' ' + tier.label
        );
        cabecera.appendChild(badge);
    }
    contenido.appendChild(cabecera);

    // Descripción y stats
    contenido.appendChild(crearElemento('p', 'descripcion', datos.descripcion));
    contenido.appendChild(crearElemento('div', 'stats'));
    llenarStats(contenido, datos);

    return contenido;
}

// Construye el libro completo (índice + detalle + navegación)
function construirLibro() {
    const nombres = ordenarPorTier(Object.keys(ENEMIGOS));
    let indiceActual = 0;
    let transicionEnCurso = false;

    const libro = crearElemento('div', 'libro-villanos');

    // --- Página izquierda: índice ---
    const paginaIzq = crearElemento('div', 'libro-pagina libro-pagina-izq');

    const titulo = crearElemento('h3', 'libro-titulo', 'Libro de Villanos');
    paginaIzq.appendChild(titulo);

    const ornamentoSup = crearElemento('div', 'libro-ornamento');
    paginaIzq.appendChild(ornamentoSup);

    const listaIndice = crearElemento('ul', 'libro-indice');
    nombres.forEach(function (nombre, i) {
        const datos = ENEMIGOS[nombre];
        const item = crearElemento('li', 'libro-indice-item');
        item.dataset.villano = nombre;
        item.dataset.indice = i;
        item.tabIndex = 0;

        if (datos.tier && TIERS[datos.tier]) {
            item.textContent = TIERS[datos.tier].emoji + ' ' + nombre;
        } else {
            item.textContent = nombre;
        }

        if (i === 0) item.classList.add('libro-indice-activo');

        item.addEventListener('click', function () {
            navegarA(i);
        });
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                navegarA(i);
            }
        });

        listaIndice.appendChild(item);
    });
    paginaIzq.appendChild(listaIndice);

    const ornamentoInf = crearElemento('div', 'libro-ornamento');
    paginaIzq.appendChild(ornamentoInf);

    // --- Lomo ---
    const lomo = crearElemento('div', 'libro-lomo');

    // --- Página derecha: detalle ---
    const paginaDer = crearElemento('div', 'libro-pagina libro-pagina-der');

    const detalleWrap = crearElemento('div', 'libro-detalle-wrap');
    detalleWrap.appendChild(generarDetalle(nombres[0]));
    paginaDer.appendChild(detalleWrap);

    // Navegación inferior
    const nav = crearElemento('div', 'libro-navegacion');

    const btnAnterior = crearElemento('button', 'libro-nav-btn', '\u2039');
    btnAnterior.type = 'button';
    btnAnterior.disabled = true;
    btnAnterior.addEventListener('click', function () {
        navegarA(indiceActual - 1);
    });

    const contador = crearElemento('span', 'libro-nav-contador', '1 / ' + nombres.length);

    const btnSiguiente = crearElemento('button', 'libro-nav-btn', '\u203A');
    btnSiguiente.type = 'button';
    btnSiguiente.disabled = nombres.length <= 1;
    btnSiguiente.addEventListener('click', function () {
        navegarA(indiceActual + 1);
    });

    nav.appendChild(btnAnterior);
    nav.appendChild(contador);
    nav.appendChild(btnSiguiente);
    paginaDer.appendChild(nav);

    // Ensamblar libro
    libro.appendChild(paginaIzq);
    libro.appendChild(lomo);
    libro.appendChild(paginaDer);

    // --- Navegación con crossfade ---
    function navegarA(nuevoIndice) {
        if (transicionEnCurso) return;
        if (nuevoIndice < 0 || nuevoIndice >= nombres.length) return;
        if (nuevoIndice === indiceActual) return;

        transicionEnCurso = true;
        const contenidoActual = detalleWrap.querySelector('.libro-detalle-contenido');

        if (contenidoActual) {
            contenidoActual.classList.add('libro-fade-out');
        }

        setTimeout(function () {
            detalleWrap.replaceChildren();
            const nuevoContenido = generarDetalle(nombres[nuevoIndice]);
            nuevoContenido.classList.add('libro-fade-in');
            detalleWrap.appendChild(nuevoContenido);

            indiceActual = nuevoIndice;
            actualizarIndice();

            setTimeout(function () {
                nuevoContenido.classList.remove('libro-fade-in');
                transicionEnCurso = false;
            }, 300);
        }, 150);
    }

    function actualizarIndice() {
        const items = listaIndice.querySelectorAll('.libro-indice-item');
        items.forEach(function (item, i) {
            item.classList.toggle('libro-indice-activo', i === indiceActual);
        });

        btnAnterior.disabled = indiceActual === 0;
        btnSiguiente.disabled = indiceActual === nombres.length - 1;
        contador.textContent = indiceActual + 1 + ' / ' + nombres.length;
    }

    // Navegación por teclado (flechas dentro del libro)
    function manejarTecladoLibro(e) {
        if (!libro.contains(document.activeElement) && document.activeElement !== document.body) {
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navegarA(indiceActual - 1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navegarA(indiceActual + 1);
        }
    }

    return { libro, manejarTecladoLibro };
}

export function crearLibroVillanos(contenedor) {
    // --- Botón flotante ---
    const boton = crearElemento('button', 'libro-boton');
    boton.type = 'button';

    const imgBoton = document.createElement('img');
    imgBoton.src = 'assets/img/libro-villanos.webp';
    imgBoton.alt = 'Libro de Villanos';
    boton.appendChild(imgBoton);

    const textoBoton = crearElemento('span', 'libro-boton-texto', 'Libro de Villanos');
    boton.appendChild(textoBoton);

    // Chispas mágicas
    const chispas = crearElemento('div', 'libro-chispas');
    for (let i = 0; i < 6; i++) {
        const chispa = document.createElement('span');
        chispa.className = 'libro-chispa';
        chispas.appendChild(chispa);
    }
    boton.appendChild(chispas);

    contenedor.appendChild(boton);

    // --- Modal ---
    const overlay = crearElemento('div', 'libro-modal oculto');

    const fondo = crearElemento('div', 'libro-modal-fondo');
    overlay.appendChild(fondo);

    const cuerpo = crearElemento('div', 'libro-modal-cuerpo');

    // Botón cerrar
    const btnCerrar = crearElemento('button', 'libro-modal-cerrar', '\u00D7');
    btnCerrar.type = 'button';
    cuerpo.appendChild(btnCerrar);

    // Construir el libro e insertarlo
    const { libro, manejarTecladoLibro } = construirLibro();
    cuerpo.appendChild(libro);
    overlay.appendChild(cuerpo);

    document.getElementById('juego').appendChild(overlay);

    // --- Abrir / cerrar ---
    let tecladoActivo = false;

    function abrir() {
        overlay.classList.remove('oculto');
        document.addEventListener('keydown', manejarTeclado);
        document.addEventListener('keydown', manejarTecladoLibro);
        tecladoActivo = true;
    }

    function cerrar() {
        overlay.classList.add('oculto');
        if (tecladoActivo) {
            document.removeEventListener('keydown', manejarTeclado);
            document.removeEventListener('keydown', manejarTecladoLibro);
            tecladoActivo = false;
        }
    }

    function manejarTeclado(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            cerrar();
        }
    }

    boton.addEventListener('click', abrir);
    fondo.addEventListener('click', cerrar);
    btnCerrar.addEventListener('click', cerrar);

    return {
        destruir: function () {
            cerrar();
            overlay.remove();
            boton.remove();
        },
    };
}
