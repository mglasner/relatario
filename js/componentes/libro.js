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
// opciones: { entidades, generarDetalle, claseRaiz, ordenar, crearItemIndice, crearSeparador, titulo, subtitulo, pieContenido, paginaInicio, gruposEntidades, getGrupoEntidad }
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
    const paginasExtras = opciones.paginasExtras || [];
    const tituloExtras = opciones.tituloExtras || '';
    const tituloEntidades = opciones.tituloEntidades || '';
    const gruposEntidades = opciones.gruposEntidades || null;
    const getGrupoEntidad = opciones.getGrupoEntidad || null;

    const nombres = ordenar(Object.keys(entidades));
    // Offset: intro (si existe) + páginas extras
    const offset = (paginaInicio ? 1 : 0) + paginasExtras.length;
    const totalPaginas = offset + nombres.length;
    let indiceActual = 0;
    let transicionEnCurso = false;

    // Helpers para mapear índice global → entidad
    function esIntro(i) {
        return paginaInicio && i === 0;
    }

    function esExtra(i) {
        const inicio = paginaInicio ? 1 : 0;
        return i >= inicio && i < inicio + paginasExtras.length;
    }

    function getNombrePorIndice(i) {
        return nombres[i - offset];
    }

    function getClasePorIndice(i) {
        if (esIntro(i) || esExtra(i)) return '';
        return entidades[getNombrePorIndice(i)].clase;
    }

    function getDetallePorIndice(i, tabAnterior) {
        if (esIntro(i)) return paginaInicio.generarContenido();
        if (esExtra(i)) {
            const inicio = paginaInicio ? 1 : 0;
            return paginasExtras[i - inicio].generarContenido();
        }
        return generarDetalle(getNombrePorIndice(i), tabAnterior);
    }

    function clasePagina(i) {
        if (esIntro(i)) return ' libro-en-inicio';
        if (esExtra(i)) return ' libro-en-extra';
        return '';
    }

    const claseInicial = getClasePorIndice(0);
    const libro = crearElemento(
        'div',
        claseRaiz + (claseInicial ? ' ' + claseInicial : '') + clasePagina(0)
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

    // --- Section tabs (navegación en dos niveles para mobile) ---
    const secciones = [];
    if (paginaInicio) {
        secciones.push({ id: 'inicio', texto: paginaInicio.textoSeccion || '\u2726' });
    }
    if (paginasExtras.length) {
        secciones.push({ id: 'extras', texto: tituloExtras || 'Extras' });
    }
    if (gruposEntidades && gruposEntidades.length) {
        gruposEntidades.forEach(function (g) {
            secciones.push({ id: 'grupo-' + g.id, texto: g.texto });
        });
    } else if (nombres.length) {
        secciones.push({ id: 'entidades', texto: tituloEntidades || 'Personajes' });
    }

    let seccionActiva = secciones.length > 0 ? secciones[0].id : null;
    let divSecciones = null;

    if (secciones.length >= 2) {
        divSecciones = crearElemento('div', 'libro-indice-secciones');
        secciones.forEach(function (sec, i) {
            const tab = crearElemento(
                'button',
                'libro-seccion-tab' + (i === 0 ? ' libro-seccion-tab-activo' : ''),
                sec.texto
            );
            tab.type = 'button';
            tab.dataset.seccion = sec.id;
            tab.addEventListener('click', function () {
                filtrarSeccion(sec.id);
            });
            divSecciones.appendChild(tab);
        });
        paginaIzq.appendChild(divSecciones);
    }

    const listaIndice = crearElemento('ul', 'libro-indice');

    // Item de página de inicio (si existe)
    if (paginaInicio) {
        const itemInicio = crearElemento('li', 'libro-indice-item libro-indice-inicio');
        itemInicio.dataset.indice = '0';
        itemInicio.dataset.seccion = 'inicio';
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

    // Items de páginas extras (habitaciones, etc.)
    if (paginasExtras.length > 0) {
        if (tituloExtras) {
            const labelExtras = crearElemento('li', 'libro-indice-seccion');
            labelExtras.textContent = tituloExtras;
            labelExtras.setAttribute('aria-hidden', 'true');
            listaIndice.appendChild(labelExtras);
        }

        const extraInicio = paginaInicio ? 1 : 0;
        paginasExtras.forEach(function (extra, j) {
            const indiceGlobal = extraInicio + j;
            const item = crearElemento('li', 'libro-indice-item libro-indice-extra');
            item.dataset.indice = String(indiceGlobal);
            item.dataset.seccion = 'extras';
            item.tabIndex = 0;
            item.textContent = extra.textoIndice;

            if (!paginaInicio && j === 0) item.classList.add('libro-indice-activo');

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

        // Separador después de los extras
        const sepExtras = crearElemento('li', 'libro-indice-sep');
        sepExtras.setAttribute('aria-hidden', 'true');
        listaIndice.appendChild(sepExtras);
    }

    if (tituloEntidades) {
        const labelEntidades = crearElemento('li', 'libro-indice-seccion');
        labelEntidades.textContent = tituloEntidades;
        labelEntidades.setAttribute('aria-hidden', 'true');
        listaIndice.appendChild(labelEntidades);
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
        if (gruposEntidades && getGrupoEntidad) {
            item.dataset.seccion = 'grupo-' + getGrupoEntidad(nombre, datos);
        } else {
            item.dataset.seccion = 'entidades';
        }
        item.tabIndex = 0;
        item.textContent = crearItemIndice(nombre, datos);

        if (!paginaInicio && paginasExtras.length === 0 && i === 0)
            item.classList.add('libro-indice-activo');

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
    // Wrapper para el índice + indicadores de scroll horizontal
    const indiceWrap = crearElemento('div', 'libro-indice-wrap');
    const hintIzq = crearElemento('span', 'libro-scroll-hint libro-scroll-hint-izq', '\u2039');
    const hintDer = crearElemento('span', 'libro-scroll-hint libro-scroll-hint-der', '\u203A');
    hintIzq.setAttribute('aria-hidden', 'true');
    hintDer.setAttribute('aria-hidden', 'true');
    indiceWrap.appendChild(hintIzq);
    indiceWrap.appendChild(listaIndice);
    indiceWrap.appendChild(hintDer);
    paginaIzq.appendChild(indiceWrap);

    // Actualizar hints según posición de scroll
    listaIndice.addEventListener('scroll', function () {
        actualizarScrollHints();
    });

    // Pie de contenido opcional (ej: botón Empezar del Heroario)
    if (pieContenido) {
        pieContenido(paginaIzq, function () {
            if (esIntro(indiceActual) || esExtra(indiceActual)) return nombres[0];
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

    // --- Filtrado de secciones (mobile) ---
    const mqMobile = window.matchMedia('(max-width: 480px)');

    // Mostrar/ocultar hints de scroll según posición
    let hintsActivos = false;

    function actualizarScrollHints() {
        if (!hintsActivos || !mqMobile.matches) {
            hintIzq.classList.add('libro-scroll-hint-oculto');
            hintDer.classList.add('libro-scroll-hint-oculto');
            return;
        }
        const sl = listaIndice.scrollLeft;
        const maxScroll = listaIndice.scrollWidth - listaIndice.clientWidth;
        hintIzq.classList.toggle('libro-scroll-hint-oculto', sl < 4);
        hintDer.classList.toggle('libro-scroll-hint-oculto', maxScroll - sl < 4);
    }

    function filtrarSeccion(seccionId) {
        if (!divSecciones) return;
        seccionActiva = seccionId;

        // Actualizar tab activo
        divSecciones.querySelectorAll('.libro-seccion-tab').forEach(function (tab) {
            tab.classList.toggle('libro-seccion-tab-activo', tab.dataset.seccion === seccionId);
        });

        // En mobile: ocultar items que no coinciden
        if (mqMobile.matches) {
            const itemsVisibles = [];
            listaIndice.querySelectorAll('.libro-indice-item').forEach(function (item) {
                const visible = item.dataset.seccion === seccionId;
                item.style.display = visible ? '' : 'none';
                if (visible) itemsVisibles.push(item);
            });
            listaIndice
                .querySelectorAll('.libro-indice-sep, .libro-indice-seccion')
                .forEach(function (el) {
                    el.style.display = 'none';
                });

            // Si la sección tiene un solo item, ocultar visualmente (conservar espacio)
            if (itemsVisibles.length <= 1) {
                listaIndice.style.visibility = 'hidden';
                hintsActivos = false;
                actualizarScrollHints();
                if (itemsVisibles.length === 1) {
                    const idx = parseInt(itemsVisibles[0].dataset.indice, 10);
                    if (idx !== indiceActual) navegarA(idx);
                }
            } else {
                listaIndice.style.visibility = '';
                listaIndice.scrollLeft = 0;
                hintsActivos = true;
                actualizarScrollHints();
            }
        }
    }

    function mostrarTodos() {
        listaIndice.style.visibility = '';
        listaIndice.querySelectorAll('.libro-indice-item').forEach(function (item) {
            item.style.display = '';
        });
        listaIndice
            .querySelectorAll('.libro-indice-sep, .libro-indice-seccion')
            .forEach(function (el) {
                el.style.display = '';
            });
        hintsActivos = false;
        actualizarScrollHints();
    }

    // Listener para cambio responsive
    mqMobile.addEventListener('change', function (e) {
        if (e.matches) {
            filtrarSeccion(seccionActiva);
        } else {
            mostrarTodos();
        }
    });

    // Aplicar filtro inicial si ya estamos en mobile
    if (mqMobile.matches && divSecciones) {
        filtrarSeccion(seccionActiva);
    }

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
            libro.className =
                claseRaiz + (claseEntidad ? ' ' + claseEntidad : '') + clasePagina(nuevoIndice);

            indiceActual = nuevoIndice;
            actualizarIndice();

            setTimeout(function () {
                nuevoContenido.classList.remove('libro-fade-in');
                transicionEnCurso = false;
            }, 350);
        }, 300);
    }

    function actualizarIndice() {
        let itemActivo = null;
        const items = listaIndice.querySelectorAll('.libro-indice-item');
        items.forEach(function (item) {
            const idx = parseInt(item.dataset.indice, 10);
            const activo = idx === indiceActual;
            item.classList.toggle('libro-indice-activo', activo);
            if (activo) itemActivo = item;
        });

        // Auto-cambiar sección si el item activo pertenece a otra
        if (itemActivo && divSecciones) {
            const seccionItem = itemActivo.dataset.seccion;
            if (seccionItem && seccionItem !== seccionActiva) {
                filtrarSeccion(seccionItem);
            }
        }

        // Auto-scroll al item activo en mobile
        if (itemActivo && mqMobile.matches) {
            itemActivo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

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
            if (esIntro(indiceActual) || esExtra(indiceActual)) return nombres[0];
            return getNombrePorIndice(indiceActual);
        },
    };
}
