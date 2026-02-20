// Villanario — bestiario con índice y detalle (botón flotante + modal)

import { crearElemento } from '../utils.js';
import { TIERS } from './stats.js';
import { ENEMIGOS } from '../enemigos.js';
import { crearLibro, crearCabecera } from './libro.js';

// Orden fijo por tier (esbirro → élite → pesadilla → leyenda)
const ORDEN_TIER = ['esbirro', 'elite', 'pesadilla', 'leyenda'];

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

// Separador entre tiers en el índice
export function necesitaSeparador(nombres, i) {
    if (i === 0) return false;
    const tierAnterior = ENEMIGOS[nombres[i - 1]].tier;
    const tierActual = ENEMIGOS[nombres[i]].tier;
    return tierActual && tierActual !== tierAnterior;
}

// Texto del item del índice con emoji de tier
export function textoItemIndice(nombre, datos) {
    if (datos.tier && TIERS[datos.tier]) {
        return TIERS[datos.tier].emoji + ' ' + nombre;
    }
    return nombre;
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
    const { libro, manejarTecladoLibro } = crearLibro({
        entidades: ENEMIGOS,
        generarDetalle: generarDetalleVillano,
        claseRaiz: 'libro-villanos',
        ordenar: ordenarPorTier,
        crearItemIndice: textoItemIndice,
        crearSeparador: necesitaSeparador,
        titulo: 'Villanario',
        subtitulo: 'La enciclopedia de villanos',
        gruposEntidades: ORDEN_TIER.map(function (tier) {
            return { id: tier, texto: TIERS[tier].emoji + ' ' + TIERS[tier].label };
        }),
        getGrupoEntidad: function (nombre, datos) {
            return datos.tier || 'esbirro';
        },
    });
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
