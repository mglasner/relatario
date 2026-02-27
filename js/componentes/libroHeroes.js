// Heroario — datos y generadores de contenido para el libro de héroes

import { crearElemento } from '../utils.js';
import { PERSONAJES } from '../personajes.js';
import { llenarStats } from './stats.js';
import { crearCabecera } from './libro.js';

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
        crearElemento('p', 'descripcion libro-descripcion-grande scroll-dorado', datos.descripcion)
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

// Genera la página de prólogo del Heroario
export function generarIntro() {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-intro');

    contenido.appendChild(crearElemento('h2', 'libro-intro-game-titulo', 'Heroario'));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const texto = crearElemento('div', 'libro-intro-texto');
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Aqu\u00ed se re\u00fanen los h\u00e9roes m\u00e1s valientes de El Relatario. Cada uno tiene una historia \u00fanica y habilidades especiales que lo hacen diferente.'
        )
    );
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Conoce a cada h\u00e9roe, estudia sus fortalezas y elige al mejor compa\u00f1ero para enfrentar los desaf\u00edos que te esperan.'
        )
    );
    texto.appendChild(
        crearElemento(
            'p',
            'libro-intro-cta',
            '\u00a1Explora el \u00edndice y descubre a cada h\u00e9roe!'
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
