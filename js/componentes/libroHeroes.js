// Heroario — libro de héroes como vista principal (inline, no modal)

import { crearElemento } from '../utils.js';
import { PERSONAJES } from '../personajes.js';
import { llenarStats } from './stats.js';
import { crearLibro, crearCabecera } from './libro.js';

// Genera el contenido de detalle para un héroe (2 paneles + tabs)
export function generarDetalleHeroe(nombre, tabInicial) {
    const datos = PERSONAJES[nombre];
    const clasePersonaje = datos.clase.replace('jugador-', 'personaje-');
    const mostrarStats = tabInicial === 'stats';
    const contenido = crearElemento('div', 'libro-detalle-contenido');
    contenido.className = 'libro-detalle-contenido ' + clasePersonaje;
    contenido._tabActivo = mostrarStats ? 'stats' : 'perfil';

    // --- Tabs ---
    const tabs = crearElemento('div', 'libro-tabs');
    const tabPerfil = crearElemento(
        'button',
        'libro-tab' + (mostrarStats ? '' : ' libro-tab-activo'),
        'Perfil'
    );
    tabPerfil.type = 'button';
    const tabStats = crearElemento(
        'button',
        'libro-tab' + (mostrarStats ? ' libro-tab-activo' : ''),
        'Habilidades'
    );
    tabStats.type = 'button';
    tabs.appendChild(tabPerfil);
    tabs.appendChild(tabStats);
    contenido.appendChild(tabs);

    // --- Panel Perfil ---
    const panelPerfil = crearElemento(
        'div',
        'libro-panel' + (mostrarStats ? '' : ' libro-panel-activo')
    );
    panelPerfil.appendChild(crearCabecera(nombre, datos));
    panelPerfil.appendChild(crearElemento('div', 'libro-ornamento'));
    panelPerfil.appendChild(
        crearElemento('p', 'descripcion libro-descripcion-grande', datos.descripcion)
    );
    contenido.appendChild(panelPerfil);

    // --- Panel Habilidades ---
    const panelStats = crearElemento(
        'div',
        'libro-panel' + (mostrarStats ? ' libro-panel-activo' : '')
    );
    panelStats.appendChild(crearCabecera(nombre, datos, 'libro-avatar-mini'));

    // Contenedores para llenarStats
    panelStats.appendChild(crearElemento('p', 'descripcion', ''));
    panelStats.appendChild(crearElemento('div', 'stats'));

    // llenarStats busca .descripcion y .stats dentro del contenedor
    llenarStats(panelStats, datos);

    // Ocultar la descripción duplicada del panel stats (llenarStats la llena pero no la necesitamos)
    const descOculta = panelStats.querySelector('.descripcion');
    if (descOculta) descOculta.style.display = 'none';

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

// Genera la página de bienvenida del Heroario
function generarIntro() {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-intro');

    contenido.appendChild(
        crearElemento('h2', 'libro-intro-game-titulo', 'La Mansi\u00f3n de Aventuras')
    );
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const texto = crearElemento('div', 'libro-intro-texto');
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Un juego de aventuras donde eliges a tu h\u00e9roe y exploras una mansi\u00f3n llena de misterios, trampas y villanos.'
        )
    );
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'En el Heroario encontrar\u00e1s a todos los h\u00e9roes disponibles. Cada uno tiene habilidades \u00fanicas para superar los desaf\u00edos que te esperan.'
        )
    );
    const pVillanos = crearElemento('p', null);
    const linkVillanos = crearElemento(
        'a',
        'libro-intro-link',
        '\u00bfQuieres conocer a los villanos?'
    );
    linkVillanos.href = '#';
    linkVillanos.addEventListener('click', function (e) {
        e.preventDefault();
        const btn = document.querySelector('.libro-boton');
        if (btn) btn.click();
    });
    pVillanos.appendChild(linkVillanos);
    pVillanos.appendChild(
        document.createTextNode(
            ' Abre el Villanario con el bot\u00f3n m\u00e1gico de abajo a la derecha.'
        )
    );
    texto.appendChild(pVillanos);
    texto.appendChild(
        crearElemento(
            'p',
            'libro-intro-cta',
            '\u00a1Elige un h\u00e9roe del \u00edndice y comienza la aventura!'
        )
    );
    contenido.appendChild(texto);

    return contenido;
}

// Entidades adaptadas para el libro: clase debe ser personaje-X (no jugador-X)
export function adaptarEntidades() {
    const adaptado = {};
    Object.keys(PERSONAJES).forEach(function (nombre) {
        const datos = PERSONAJES[nombre];
        adaptado[nombre] = Object.create(datos);
        adaptado[nombre].clase = datos.clase.replace('jugador-', 'personaje-');
    });
    return adaptado;
}

export function crearLibroHeroes(contenedor) {
    const entidades = adaptarEntidades();

    const { libro, manejarTecladoLibro, getNombreActual } = crearLibro({
        entidades: entidades,
        generarDetalle: generarDetalleHeroe,
        claseRaiz: 'libro-heroes',
        titulo: 'Heroario',
        subtitulo: 'Elige tu personaje',
        paginaInicio: {
            textoIndice: '\u2726 Bienvenida',
            generarContenido: generarIntro,
        },
        pieContenido: function (paginaDer, obtenerNombreActual) {
            const btnEmpezar = crearElemento(
                'button',
                'btn-empezar libro-heroes-empezar',
                '¡Empezar!'
            );
            btnEmpezar.type = 'button';
            btnEmpezar.addEventListener('click', function () {
                document.dispatchEvent(
                    new CustomEvent('heroe-seleccionado', {
                        detail: { nombre: obtenerNombreActual() },
                    })
                );
            });
            paginaDer.appendChild(btnEmpezar);
        },
    });

    contenedor.appendChild(libro);

    // Activar teclado
    document.addEventListener('keydown', manejarTecladoLibro);

    return {
        getNombreActual: getNombreActual,
        destruir: function () {
            document.removeEventListener('keydown', manejarTecladoLibro);
            libro.remove();
        },
    };
}
