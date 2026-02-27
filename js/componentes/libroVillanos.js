// Villanario — bestiario con índice y detalle (botón flotante + modal)

import { crearElemento } from '../utils.js';
import { TIERS } from './stats.js';
import { ENEMIGOS } from '../enemigos.js';
import { crearCabecera } from './libro.js';

// Orden fijo por tier (esbirro → élite → pesadilla → leyenda)
export const ORDEN_TIER = ['esbirro', 'elite', 'pesadilla', 'leyenda'];

export function ordenarPorTier(nombres) {
    return nombres.slice().sort(function (a, b) {
        const tierA = ORDEN_TIER.indexOf(ENEMIGOS[a].tier);
        const tierB = ORDEN_TIER.indexOf(ENEMIGOS[b].tier);
        return tierA - tierB;
    });
}

// Genera el contenido de detalle para un villano (2 paneles + tabs)
export function generarDetalleVillano(nombre, tabInicial) {
    const datos = ENEMIGOS[nombre];
    const mostrarStats = tabInicial === 'stats';
    const contenido = crearElemento('div', 'libro-detalle-contenido');
    contenido.className = 'libro-detalle-contenido ' + datos.clase;
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

    // Insignia de rango debajo del nombre
    if (datos.tier && TIERS[datos.tier]) {
        const tier = TIERS[datos.tier];
        const insignia = crearElemento(
            'span',
            'villano-rango-insignia villano-rango-' + datos.tier,
            tier.emoji + ' ' + tier.label
        );
        panelPerfil.appendChild(insignia);
    }

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

// Separador entre tiers en el índice
export function necesitaSeparador(nombres, i) {
    if (i === 0) return false;
    const tierAnterior = ENEMIGOS[nombres[i - 1]].tier;
    const tierActual = ENEMIGOS[nombres[i]].tier;
    return tierActual && tierActual !== tierAnterior;
}

// Genera la página de prólogo del Villanario
export function generarPrologoVillanos() {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-intro');

    contenido.appendChild(crearElemento('h2', 'libro-intro-game-titulo', 'Villanario'));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const texto = crearElemento('div', 'libro-intro-texto');
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Aquí se reúnen las criaturas más astutas, traviesas y misteriosas de El Relatario. Desde pequeños esbirros hasta temibles pesadillas, cada villano tiene su propia historia.'
        )
    );
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Conocer a tus rivales es la mejor estrategia. Estudia sus habilidades, descubre sus debilidades y prepárate para enfrentarlos en los desafíos.'
        )
    );
    texto.appendChild(
        crearElemento('p', 'libro-intro-cta', '¡Explora el índice y descubre a cada villano!')
    );
    contenido.appendChild(texto);

    return contenido;
}

// Descripciones breves de cada rango
const RANGOS_DESC = {
    esbirro: 'Criaturas comunes. No son muy fuertes, pero en grupo pueden ser un problema.',
    elite: 'Guerreros temibles con habilidades especiales. ¡Prepárate bien antes de enfrentarlos!',
    pesadilla: 'Seres de las sombras que provocan escalofríos. Solo los valientes se atreven.',
    leyenda: 'Los más poderosos de todos. Muy pocos aventureros han logrado vencerlos.',
};

// Genera la página de Rangos del Villanario
export function generarPaginaRangos() {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-rangos');

    contenido.appendChild(crearElemento('h2', 'libro-intro-game-titulo', 'Rangos de Villanos'));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));
    contenido.appendChild(
        crearElemento(
            'p',
            'libro-rangos-intro',
            'Cada villano tiene un rango que indica su poder. Conócelos antes de aventurarte:'
        )
    );

    const lista = crearElemento('div', 'libro-rangos-lista');
    ORDEN_TIER.forEach(function (tier) {
        const info = TIERS[tier];
        const fila = crearElemento('div', 'libro-rango-fila');
        fila.appendChild(crearElemento('span', 'libro-rango-emoji', info.emoji));
        const textoRango = crearElemento('div', 'libro-rango-texto');
        textoRango.appendChild(crearElemento('strong', 'libro-rango-nombre', info.label));
        textoRango.appendChild(crearElemento('p', 'libro-rango-desc', RANGOS_DESC[tier]));
        fila.appendChild(textoRango);
        lista.appendChild(fila);
    });
    contenido.appendChild(lista);

    return contenido;
}
