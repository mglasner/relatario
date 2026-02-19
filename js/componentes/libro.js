// Libro generalizado — núcleo reutilizable para Heroario y Villanario

import { crearElemento } from '../utils.js';

// Crea cabecera reutilizable (avatar + nombre)
export function crearCabecera(nombre, datos, claseAvatar) {
    const frag = document.createDocumentFragment();

    const avatarDiv = crearElemento('div', 'avatar ' + (claseAvatar || ''));
    const img = document.createElement('img');
    img.src = datos.img;
    img.alt = nombre;
    avatarDiv.appendChild(img);
    frag.appendChild(avatarDiv);

    const cabecera = crearElemento('div', 'libro-detalle-cabecera');
    cabecera.appendChild(crearElemento('h3', null, nombre));
    frag.appendChild(cabecera);

    return frag;
}

// Construye un libro completo (índice + detalle + navegación)
// opciones: { entidades, generarDetalle, claseRaiz, ordenar, crearItemIndice, crearSeparador, titulo, subtitulo, pieContenido, paginaInicio }
export function crearLibro(opciones) {
    const entidades = opciones.entidades;
    const generarDetalle = opciones.generarDetalle;
    const claseRaiz = opciones.claseRaiz;
    const ordenar =
        opciones.ordenar ||
        function (nombres) {
            return nombres.slice().sort();
        };
    const crearItemIndice =
        opciones.crearItemIndice ||
        function (nombre) {
            return nombre;
        };
    const crearSeparador =
        opciones.crearSeparador ||
        function () {
            return false;
        };
    const titulo = opciones.titulo || '';
    const subtitulo = opciones.subtitulo || '';
    const pieContenido = opciones.pieContenido || null;
    const paginaInicio = opciones.paginaInicio || null;

    const nombres = ordenar(Object.keys(entidades));
    // Si hay página de inicio, el índice 0 es la intro y las entidades empiezan en 1
    const offset = paginaInicio ? 1 : 0;
    const totalPaginas = offset + nombres.length;
    let indiceActual = 0;
    let transicionEnCurso = false;

    // Helpers para mapear índice global → entidad
    function esIntro(i) {
        return paginaInicio && i === 0;
    }

    function getNombrePorIndice(i) {
        return nombres[i - offset];
    }

    function getClasePorIndice(i) {
        if (esIntro(i)) return '';
        return entidades[getNombrePorIndice(i)].clase;
    }

    function getDetallePorIndice(i, tabAnterior) {
        if (esIntro(i)) return paginaInicio.generarContenido();
        return generarDetalle(getNombrePorIndice(i), tabAnterior);
    }

    const claseInicial = getClasePorIndice(0);
    const libro = crearElemento(
        'div',
        claseRaiz +
            (claseInicial ? ' ' + claseInicial : '') +
            (esIntro(0) ? ' libro-en-inicio' : '')
    );

    // --- Página izquierda: índice ---
    const paginaIzq = crearElemento('div', 'libro-pagina libro-pagina-izq');

    if (titulo) {
        paginaIzq.appendChild(crearElemento('h3', 'libro-titulo', titulo));
    }
    if (subtitulo) {
        paginaIzq.appendChild(crearElemento('p', 'libro-subtitulo', subtitulo));
    }

    paginaIzq.appendChild(crearElemento('div', 'libro-ornamento'));

    const listaIndice = crearElemento('ul', 'libro-indice');

    // Item de página de inicio (si existe)
    if (paginaInicio) {
        const itemInicio = crearElemento('li', 'libro-indice-item libro-indice-inicio');
        itemInicio.dataset.indice = '0';
        itemInicio.tabIndex = 0;
        itemInicio.textContent = paginaInicio.textoIndice;
        itemInicio.classList.add('libro-indice-activo');

        itemInicio.addEventListener('click', function () {
            navegarA(0);
        });
        itemInicio.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                navegarA(0);
            }
        });
        listaIndice.appendChild(itemInicio);

        // Separador después de la intro
        const sep = crearElemento('li', 'libro-indice-sep');
        sep.setAttribute('aria-hidden', 'true');
        listaIndice.appendChild(sep);
    }

    nombres.forEach(function (nombre, i) {
        const datos = entidades[nombre];
        const indiceGlobal = i + offset;

        // Separador opcional entre grupos
        if (crearSeparador(nombres, i)) {
            const sep = crearElemento('li', 'libro-indice-sep');
            sep.setAttribute('aria-hidden', 'true');
            listaIndice.appendChild(sep);
        }

        const item = crearElemento('li', 'libro-indice-item');
        item.dataset.nombre = nombre;
        item.dataset.indice = indiceGlobal;
        item.tabIndex = 0;
        item.textContent = crearItemIndice(nombre, datos);

        if (!paginaInicio && i === 0) item.classList.add('libro-indice-activo');

        item.addEventListener('click', function () {
            navegarA(indiceGlobal);
        });
        item.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                navegarA(indiceGlobal);
            }
        });

        listaIndice.appendChild(item);
    });
    paginaIzq.appendChild(listaIndice);

    // Pie de contenido opcional (ej: botón Empezar del Heroario)
    if (pieContenido) {
        pieContenido(paginaIzq, function () {
            if (esIntro(indiceActual)) return nombres[0];
            return getNombrePorIndice(indiceActual);
        });
    }

    paginaIzq.appendChild(crearElemento('div', 'libro-ornamento'));

    // --- Lomo con costuras ---
    const lomo = crearElemento('div', 'libro-lomo');
    for (let i = 0; i < 3; i++) {
        lomo.appendChild(crearElemento('div', 'libro-lomo-costura'));
    }

    // --- Página derecha: detalle ---
    const paginaDer = crearElemento('div', 'libro-pagina libro-pagina-der');

    // Esquinas ornamentales
    ['tl', 'tr', 'bl', 'br'].forEach(function (pos) {
        paginaDer.appendChild(crearElemento('div', 'libro-esquina libro-esquina-' + pos));
    });

    // Page curl — puntita inferior derecha
    paginaDer.appendChild(crearElemento('div', 'libro-page-curl'));

    const detalleWrap = crearElemento('div', 'libro-detalle-wrap');
    detalleWrap.appendChild(getDetallePorIndice(0));
    paginaDer.appendChild(detalleWrap);

    // Navegación inferior
    const nav = crearElemento('div', 'libro-navegacion');

    const btnAnterior = crearElemento('button', 'libro-nav-btn', '\u2039');
    btnAnterior.type = 'button';
    btnAnterior.disabled = true;
    btnAnterior.addEventListener('click', function () {
        navegarA(indiceActual - 1);
    });

    const contador = crearElemento('span', 'libro-nav-contador', '1 / ' + totalPaginas);

    const btnSiguiente = crearElemento('button', 'libro-nav-btn', '\u203A');
    btnSiguiente.type = 'button';
    btnSiguiente.disabled = totalPaginas <= 1;
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
        if (nuevoIndice < 0 || nuevoIndice >= totalPaginas) return;
        if (nuevoIndice === indiceActual) return;

        transicionEnCurso = true;
        const contenidoActual = detalleWrap.querySelector('.libro-detalle-contenido');

        if (contenidoActual) {
            contenidoActual.classList.add('libro-fade-out');
        }

        setTimeout(function () {
            const tabAnterior = (contenidoActual && contenidoActual._tabActivo) || 'perfil';
            detalleWrap.replaceChildren();
            detalleWrap.scrollTop = 0;
            const nuevoContenido = getDetallePorIndice(nuevoIndice, tabAnterior);
            nuevoContenido.classList.add('libro-fade-in');
            detalleWrap.appendChild(nuevoContenido);

            // Propagar clase de la entidad al libro
            const claseEntidad = getClasePorIndice(nuevoIndice);
            const claseInicio = esIntro(nuevoIndice) ? ' libro-en-inicio' : '';
            libro.className = claseRaiz + (claseEntidad ? ' ' + claseEntidad : '') + claseInicio;

            indiceActual = nuevoIndice;
            actualizarIndice();

            setTimeout(function () {
                nuevoContenido.classList.remove('libro-fade-in');
                transicionEnCurso = false;
            }, 350);
        }, 300);
    }

    function actualizarIndice() {
        const items = listaIndice.querySelectorAll('.libro-indice-item');
        items.forEach(function (item) {
            const idx = parseInt(item.dataset.indice, 10);
            item.classList.toggle('libro-indice-activo', idx === indiceActual);
        });

        btnAnterior.disabled = indiceActual === 0;
        btnSiguiente.disabled = indiceActual === totalPaginas - 1;
        contador.textContent = indiceActual + 1 + ' / ' + totalPaginas;
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

    return {
        libro: libro,
        manejarTecladoLibro: manejarTecladoLibro,
        getNombreActual: function () {
            if (esIntro(indiceActual)) return nombres[0];
            return getNombrePorIndice(indiceActual);
        },
    };
}
