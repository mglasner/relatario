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

// Genera una página de habitación para el Heroario
function generarPaginaHabitacion(hab) {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-habitacion');

    if (hab.img) {
        const img = document.createElement('img');
        img.src = hab.img;
        img.alt = hab.nombre;
        img.className = 'libro-habitacion-img';
        contenido.appendChild(img);
    } else {
        const icono = crearElemento('div', 'libro-habitacion-icono', hab.icono);
        contenido.appendChild(icono);
    }

    contenido.appendChild(crearElemento('h3', 'libro-habitacion-nombre', hab.nombre));
    contenido.appendChild(crearElemento('span', 'libro-habitacion-nivel', 'Nivel ' + hab.nivel));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const desc = crearElemento('div', 'libro-habitacion-desc');
    hab.parrafos.forEach(function (texto) {
        desc.appendChild(crearElemento('p', null, texto));
    });
    contenido.appendChild(desc);

    const tip = crearElemento('div', 'libro-habitacion-tip');
    tip.appendChild(crearElemento('span', 'libro-habitacion-tip-icono', '\uD83D\uDCA1'));
    tip.appendChild(document.createTextNode(hab.tip));
    contenido.appendChild(tip);

    return contenido;
}

// Páginas de habitaciones para el Heroario
export const HABITACIONES_HEROARIO = [
    {
        textoIndice: '\uD83D\uDDDD\uFE0F El Laberinto',
        generarContenido: function () {
            return generarPaginaHabitacion({
                nombre: 'El Laberinto',
                nivel: 1,
                img: 'assets/img/habitaciones/habitacion1.webp',
                parrafos: [
                    '\u00A1Bienvenido al laberinto m\u00E1s enredado de toda la mansi\u00F3n! Sus pasillos oscuros esconden una llave m\u00E1gica que necesitas para escapar.',
                    'Camina con cuidado entre las paredes sombr\u00EDas. Dicen que algunos aventureros se perdieron durante horas buscando la salida...',
                    '\u00A1Cuidado! Si te cruzas con enemigos podr\u00EDas perder vida.',
                ],
                tip: 'Explora cada rinc\u00F3n. La llave podr\u00EDa estar donde menos lo esperas.',
            });
        },
    },
    {
        textoIndice: '\uD83C\uDF00 Laberinto 3D',
        generarContenido: function () {
            return generarPaginaHabitacion({
                nombre: 'El Laberinto 3D',
                nivel: 2,
                img: 'assets/img/habitaciones/habitacion2.webp',
                parrafos: [
                    '\u00A1El laberinto ha cobrado vida en tres dimensiones! Las paredes se alzan a tu alrededor y el camino se vuelve a\u00FAn m\u00E1s confuso.',
                    'Esta vez no ves el mapa completo. Solo puedes ver lo que hay frente a ti. \u00BFPodr\u00E1s encontrar la salida sin perderte?',
                    'Ten cuidado con los enemigos que acechan en los pasillos, \u00A1pueden hacerte da\u00F1o!',
                ],
                tip: 'Mant\u00E9n la calma y recuerda por d\u00F3nde viniste.',
            });
        },
    },
    {
        textoIndice: '\uD83C\uDCCF El Memorice',
        generarContenido: function () {
            return generarPaginaHabitacion({
                nombre: 'El Memorice',
                nivel: 3,
                img: 'assets/img/habitaciones/habitacion3.webp',
                parrafos: [
                    'En esta habitaci\u00F3n encontrar\u00E1s un tablero con cartas misteriosas boca abajo. Cada par de cartas esconde un secreto.',
                    'Encuentra todos los pares para desbloquear el pasaje. \u00A1Pero cuidado! Cada intento fallido despierta la curiosidad de los villanos.',
                    '\u00A1Buenas noticias! Cada par que descubras te devuelve un poco de vida. \u00A1Es el momento perfecto para recuperarte!',
                ],
                tip: 'Tu mejor arma aqu\u00ED es la memoria. Conc\u00E9ntrate y recuerda cada carta.',
            });
        },
    },
    {
        textoIndice: '\uD83C\uDF0A El Abismo',
        generarContenido: function () {
            return generarPaginaHabitacion({
                nombre: 'El Abismo',
                nivel: 4,
                icono: '\uD83C\uDF0A',
                parrafos: [
                    'Un abismo sin fondo se extiende ante ti. Plataformas flotantes son tu \u00FAnico camino. \u00A1Un paso en falso y caer\u00E1s al vac\u00EDo!',
                    'Esbirros patrullan las plataformas y un temible boss te espera al final. Salta sobre los enemigos para derrotarlos, pero cuidado con tocarlos de lado.',
                    'Derrota al boss para abrir la salida y conseguir la llave.',
                ],
                tip: 'Salta sobre los enemigos para hacerles da\u00F1o. Usa las plataformas y no mires abajo.',
            });
        },
    },
];

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
        subtitulo: 'La enciclopedia de los h\u00e9roes',
        paginasExtras: HABITACIONES_HEROARIO,
        tituloExtras: 'Habitaciones',
        tituloEntidades: 'Héroes',
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
