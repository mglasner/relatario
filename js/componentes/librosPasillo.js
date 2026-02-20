// Libros del pasillo — Heroario y Villanario accesibles durante la partida

import { crearElemento } from '../utils.js';
import { ENEMIGOS } from '../enemigos.js';
import { crearLibro } from './libro.js';
import {
    generarDetalleHeroe,
    generarIntro,
    adaptarEntidades,
    HABITACIONES_HEROARIO,
} from './libroHeroes.js';
import {
    generarDetalleVillano,
    ordenarPorTier,
    textoItemIndice,
    necesitaSeparador,
    ORDEN_TIER,
} from './libroVillanos.js';
import { TIERS } from './stats.js';

// Crea un botón flotante de libro con imagen, texto y chispas
function crearBotonLibro(imgSrc, texto) {
    const boton = crearElemento('button', 'libro-boton libros-pasillo-boton');
    boton.type = 'button';

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = texto;
    boton.appendChild(img);

    boton.appendChild(crearElemento('span', 'libro-boton-texto', texto));

    // Chispas mágicas
    const chispas = crearElemento('div', 'libro-chispas');
    for (let i = 0; i < 6; i++) {
        const chispa = document.createElement('span');
        chispa.className = 'libro-chispa';
        chispas.appendChild(chispa);
    }
    boton.appendChild(chispas);

    return boton;
}

// Crea un modal con overlay, fondo click-to-close, botón cerrar y libro dentro
function crearModalLibro(libro, manejarTecladoLibro) {
    const overlay = crearElemento('div', 'libro-modal oculto');

    const fondo = crearElemento('div', 'libro-modal-fondo');
    overlay.appendChild(fondo);

    const cuerpo = crearElemento('div', 'libro-modal-cuerpo');

    const btnCerrar = crearElemento('button', 'libro-modal-cerrar', '\u00D7');
    btnCerrar.type = 'button';
    cuerpo.appendChild(btnCerrar);

    cuerpo.appendChild(libro);
    overlay.appendChild(cuerpo);

    let tecladoActivo = false;

    function manejarTeclado(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            cerrar();
        }
    }

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

    function estaAbierto() {
        return !overlay.classList.contains('oculto');
    }

    fondo.addEventListener('click', cerrar);
    btnCerrar.addEventListener('click', cerrar);

    return { overlay, abrir, cerrar, estaAbierto };
}

export function crearLibrosPasillo(contenedor) {
    const pasillo = document.getElementById('pasillo');

    // --- Contenedor lateral ---
    const panel = crearElemento('div', 'libros-pasillo oculto');

    // --- Heroario ---
    const btnHeroes = crearBotonLibro('assets/img/libro-heroes.webp', 'Heroario');
    panel.appendChild(btnHeroes);

    const entidadesHeroes = adaptarEntidades();
    const heroario = crearLibro({
        entidades: entidadesHeroes,
        generarDetalle: generarDetalleHeroe,
        claseRaiz: 'libro-heroes',
        titulo: 'Heroario',
        subtitulo: 'Los héroes de la mansión',
        paginasExtras: HABITACIONES_HEROARIO,
        tituloExtras: 'Habitaciones',
        tituloEntidades: 'Héroes',
        paginaInicio: {
            textoIndice: '\u2726 Bienvenida',
            textoSeccion: 'Bienvenida',
            generarContenido: generarIntro,
        },
    });
    const modalHeroes = crearModalLibro(heroario.libro, heroario.manejarTecladoLibro);
    contenedor.appendChild(modalHeroes.overlay);

    btnHeroes.addEventListener('click', modalHeroes.abrir);

    // --- Villanario ---
    const btnVillanos = crearBotonLibro('assets/img/libro-villanos.webp', 'Villanario');
    panel.appendChild(btnVillanos);

    const villanario = crearLibro({
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
    const modalVillanos = crearModalLibro(villanario.libro, villanario.manejarTecladoLibro);
    contenedor.appendChild(modalVillanos.overlay);

    btnVillanos.addEventListener('click', modalVillanos.abrir);

    // --- Insertar panel dentro del pasillo ---
    pasillo.appendChild(panel);

    return {
        mostrar: function () {
            panel.classList.remove('oculto');
        },
        ocultar: function () {
            modalHeroes.cerrar();
            modalVillanos.cerrar();
            panel.classList.add('oculto');
        },
        estaAbierto: function () {
            return modalHeroes.estaAbierto() || modalVillanos.estaAbierto();
        },
        destruir: function () {
            modalHeroes.cerrar();
            modalVillanos.cerrar();
            modalHeroes.overlay.remove();
            modalVillanos.overlay.remove();
            panel.remove();
        },
    };
}
