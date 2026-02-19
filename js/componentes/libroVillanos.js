// Villanario — bestiario con índice y detalle (botón flotante + modal)

import { crearElemento } from '../utils.js';
import { TIERS } from './stats.js';
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

// Crea cabecera reutilizable (avatar + nombre + tier)
function crearCabecera(nombre, datos, claseAvatar) {
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

// Genera el contenido de detalle para un villano (2 paneles + tabs)
function generarDetalle(nombre, tabInicial) {
    const datos = ENEMIGOS[nombre];
    const mostrarStats = tabInicial === 'stats';
    const contenido = crearElemento('div', 'libro-detalle-contenido');
    contenido.className = 'libro-detalle-contenido ' + datos.clase;
    contenido._tabActivo = mostrarStats ? 'stats' : 'perfil';

    // --- Tabs ---
    const tabs = crearElemento('div', 'libro-tabs');
    const tabPerfil = crearElemento('button', 'libro-tab' + (mostrarStats ? '' : ' libro-tab-activo'), 'Perfil');
    tabPerfil.type = 'button';
    const tabStats = crearElemento('button', 'libro-tab' + (mostrarStats ? ' libro-tab-activo' : ''), 'Habilidades');
    tabStats.type = 'button';
    tabs.appendChild(tabPerfil);
    tabs.appendChild(tabStats);
    contenido.appendChild(tabs);

    // --- Panel Perfil ---
    const panelPerfil = crearElemento('div', 'libro-panel' + (mostrarStats ? '' : ' libro-panel-activo'));
    panelPerfil.appendChild(crearCabecera(nombre, datos));
    panelPerfil.appendChild(crearElemento('div', 'libro-ornamento'));
    panelPerfil.appendChild(
        crearElemento('p', 'descripcion libro-descripcion-grande', datos.descripcion)
    );
    contenido.appendChild(panelPerfil);

    // --- Panel Habilidades ---
    const panelStats = crearElemento('div', 'libro-panel' + (mostrarStats ? ' libro-panel-activo' : ''));
    panelStats.appendChild(crearCabecera(nombre, datos, 'libro-avatar-mini'));
    panelStats.appendChild(crearElemento('div', 'stats'));

    // Llenar stats manualmente (sin descripcion)
    const statsDiv = panelStats.querySelector('.stats');

    // Barra de vida
    const statVida = crearElemento('div', 'stat-vida');
    statVida.appendChild(crearElemento('span', 'stat-label', 'Vida'));
    const barraFondo = crearElemento('div', 'barra-vida-fondo');
    const barraRelleno = crearElemento('div', 'barra-vida-relleno');
    barraRelleno.style.transform = 'scaleX(' + datos.vidaMax / 150 + ')';
    barraFondo.appendChild(barraRelleno);
    statVida.appendChild(barraFondo);
    statVida.appendChild(crearElemento('span', 'stat-valor', datos.vidaMax.toString()));
    statsDiv.appendChild(statVida);

    // Barra de velocidad
    if (datos.velocidad !== undefined) {
        const statVel = crearElemento('div', 'stat-velocidad');
        statVel.appendChild(crearElemento('span', 'stat-label', 'Velocidad'));
        const bf = crearElemento('div', 'barra-vida-fondo');
        const br = crearElemento('div', 'barra-velocidad-relleno');
        br.style.transform = 'scaleX(' + datos.velocidad / 10 + ')';
        bf.appendChild(br);
        statVel.appendChild(bf);
        statVel.appendChild(crearElemento('span', 'stat-valor', datos.velocidad.toString()));
        statsDiv.appendChild(statVel);
    }

    // Barra de vel. ataque
    if (datos.velAtaque !== undefined) {
        const statVA = crearElemento('div', 'stat-vel-ataque');
        statVA.appendChild(crearElemento('span', 'stat-label', 'Vel. Ataque'));
        const bf = crearElemento('div', 'barra-vida-fondo');
        const br = crearElemento('div', 'barra-vel-ataque-relleno');
        br.style.transform = 'scaleX(' + datos.velAtaque / 10 + ')';
        bf.appendChild(br);
        statVA.appendChild(bf);
        statVA.appendChild(crearElemento('span', 'stat-valor', datos.velAtaque.toString()));
        statsDiv.appendChild(statVA);
    }

    // Atributos
    {
        const statAtrib = crearElemento('div', 'stat-atributos');
        statAtrib.appendChild(crearElemento('span', 'stat-label', 'Atributos'));
        if (datos.tier && TIERS[datos.tier]) {
            const tier = TIERS[datos.tier];
            const fila = crearElemento('div', 'ataque');
            fila.appendChild(crearElemento('span', 'ataque-nombre', 'Rango'));
            fila.appendChild(
                crearElemento(
                    'span',
                    'tier-badge tier-' + datos.tier,
                    tier.emoji + ' ' + tier.label
                )
            );
            statAtrib.appendChild(fila);
        }
        if (datos.edad !== undefined) {
            const fila = crearElemento('div', 'ataque');
            fila.appendChild(crearElemento('span', 'ataque-nombre', 'Edad'));
            fila.appendChild(crearElemento('span', 'stat-valor', datos.edad + ' años'));
            statAtrib.appendChild(fila);
        }
        if (datos.estatura !== undefined) {
            const fila = crearElemento('div', 'ataque');
            fila.appendChild(crearElemento('span', 'ataque-nombre', 'Estatura'));
            fila.appendChild(crearElemento('span', 'stat-valor', datos.estatura + ' m'));
            statAtrib.appendChild(fila);
        }
        statsDiv.appendChild(statAtrib);
    }

    // Ataques
    const statAtaques = crearElemento('div', 'stat-ataques');
    statAtaques.appendChild(crearElemento('span', 'stat-label', 'Ataques'));
    datos.ataques.forEach(function (ataque) {
        const ataqueDiv = crearElemento('div', 'ataque');
        ataqueDiv.appendChild(crearElemento('span', 'ataque-nombre', ataque.nombre));
        ataqueDiv.appendChild(crearElemento('span', 'ataque-dano', ataque.dano.toString()));
        statAtaques.appendChild(ataqueDiv);
    });
    statsDiv.appendChild(statAtaques);

    contenido.appendChild(panelStats);

    // --- Lógica de tabs ---
    tabPerfil.addEventListener('click', function () {
        tabPerfil.classList.add('libro-tab-activo');
        tabStats.classList.remove('libro-tab-activo');
        panelPerfil.classList.add('libro-panel-activo');
        panelStats.classList.remove('libro-panel-activo');
        contenido._tabActivo = 'perfil';
    });
    tabStats.addEventListener('click', function () {
        tabStats.classList.add('libro-tab-activo');
        tabPerfil.classList.remove('libro-tab-activo');
        panelStats.classList.add('libro-panel-activo');
        panelPerfil.classList.remove('libro-panel-activo');
        contenido._tabActivo = 'stats';
    });

    return contenido;
}

// Construye el libro completo (índice + detalle + navegación)
function construirLibro() {
    const nombres = ordenarPorTier(Object.keys(ENEMIGOS));
    let indiceActual = 0;
    let transicionEnCurso = false;

    const libro = crearElemento('div', 'libro-villanos ' + ENEMIGOS[nombres[0]].clase);

    // --- Página izquierda: índice ---
    const paginaIzq = crearElemento('div', 'libro-pagina libro-pagina-izq');

    const titulo = crearElemento('h3', 'libro-titulo', 'Villanario');
    paginaIzq.appendChild(titulo);

    const subtitulo = crearElemento('p', 'libro-subtitulo', 'La enciclopedia de villanos');
    paginaIzq.appendChild(subtitulo);

    const ornamentoSup = crearElemento('div', 'libro-ornamento');
    paginaIzq.appendChild(ornamentoSup);

    const listaIndice = crearElemento('ul', 'libro-indice');
    let tierAnterior = null;
    nombres.forEach(function (nombre, i) {
        const datos = ENEMIGOS[nombre];

        // Separador entre tiers
        if (datos.tier && datos.tier !== tierAnterior) {
            if (tierAnterior !== null) {
                const sep = crearElemento('li', 'libro-indice-sep');
                sep.setAttribute('aria-hidden', 'true');
                listaIndice.appendChild(sep);
            }
            tierAnterior = datos.tier;
        }

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
            const tabAnterior = contenidoActual && contenidoActual._tabActivo || 'perfil';
            detalleWrap.replaceChildren();
            const nuevoContenido = generarDetalle(nombres[nuevoIndice], tabAnterior);
            nuevoContenido.classList.add('libro-fade-in');
            detalleWrap.appendChild(nuevoContenido);

            // Propagar clase villano al libro
            libro.className = 'libro-villanos ' + ENEMIGOS[nombres[nuevoIndice]].clase;

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
    imgBoton.alt = 'Villanario';
    boton.appendChild(imgBoton);

    const textoBoton = crearElemento('span', 'libro-boton-texto', 'Villanario');
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
