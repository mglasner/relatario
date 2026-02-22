// Componente: Libro de Juegos
// Usa crearLibro() para mostrar los 4 desafíos con selector de héroe en modal

import { crearElemento } from '../utils.js';
import { PERSONAJES } from '../personajes.js';
import { crearLibro, generarPortada } from './libro.js';

// Datos de los 4 juegos con descripciones completas
const JUEGOS = {
    laberinto: {
        nombre: 'El Laberinto',
        img: 'assets/img/juegos/laberinto.webp',
        accent: '#bb86fc',
        parrafos: [
            '¡Bienvenido al laberinto más enredado de todos! Sus pasillos oscuros esconden una llave mágica que necesitas para escapar.',
            'Camina con cuidado entre las paredes sombrías. Dicen que algunos aventureros se perdieron durante horas buscando la salida...',
            '¡Cuidado! Si te cruzas con enemigos podrías perder vida.',
        ],
        tip: 'Explora cada rincón. La llave podría estar donde menos lo esperas.',
    },
    laberinto3d: {
        nombre: 'El Laberinto 3D',
        img: 'assets/img/juegos/laberinto3d.webp',
        accent: '#6bfc86',
        parrafos: [
            '¡El laberinto ha cobrado vida en tres dimensiones! Las paredes se alzan a tu alrededor y el camino se vuelve aún más confuso.',
            'Esta vez no ves el mapa completo. Solo puedes ver lo que hay frente a ti. ¿Podrás encontrar la salida sin perderte?',
            'Ten cuidado con los enemigos que acechan en los pasillos, ¡pueden hacerte daño!',
        ],
        tip: 'Mantén la calma y recuerda por dónde viniste.',
    },
    memorice: {
        nombre: 'El Memorice',
        img: 'assets/img/juegos/memorice.webp',
        accent: '#e94560',
        parrafos: [
            'En esta sala encontrarás un tablero con cartas misteriosas boca abajo. Cada par de cartas esconde un secreto.',
            'Encuentra todos los pares para desbloquear el pasaje. ¡Pero cuidado! Cada intento fallido despierta la curiosidad de los villanos.',
            '¡Buenas noticias! Cada par que descubras te devuelve un poco de vida. ¡Es el momento perfecto para recuperarte!',
        ],
        tip: 'Tu mejor arma aquí es la memoria. Concéntrate y recuerda cada carta.',
    },
    abismo: {
        nombre: 'El Abismo',
        img: 'assets/img/juegos/abismo.webp',
        accent: '#5eeadb',
        parrafos: [
            'Un abismo sin fondo se extiende ante ti. Plataformas flotantes son tu único camino. ¡Un paso en falso y caerás al vacío!',
            'Esbirros patrullan las plataformas y un temible boss te espera al final. Salta sobre los enemigos para derrotarlos, pero cuidado con tocarlos de lado.',
            'Derrota al boss para abrir la salida y conseguir la llave.',
        ],
        tip: 'Salta sobre los enemigos para hacerles daño. Usa las plataformas y no mires abajo.',
    },
    ajedrez: {
        nombre: 'El Ajedrez',
        img: 'assets/img/juegos/ajedrez.webp',
        accent: '#f0a030',
        parrafos: [
            'Un tablero de ajedrez mágico donde un ejército aleatorio de villanos cobra vida como piezas enemigas.',
            'Mueve tus piezas con estrategia para dar jaque mate. Cada pieza enemiga es un villano con su propio avatar.',
            'Elige tu color, ajusta la dificultad y demuestra que tu mente es más poderosa que cualquier ejército.',
        ],
        tip: 'Piensa antes de mover. Protege a tu rey y busca debilidades en el rival.',
    },
};

// Adaptador: convierte JUEGOS a formato de entidades para crearLibro
function adaptarJuegos() {
    const entidades = {};
    Object.keys(JUEGOS).forEach(function (juegoId) {
        const j = JUEGOS[juegoId];
        entidades[j.nombre] = {
            img: j.img,
            clase: 'juego-' + juegoId,
            juegoId: juegoId,
            accent: j.accent,
        };
    });
    return entidades;
}

// Genera la página descriptiva de un juego (imagen, nombre, párrafos, tip)
function generarPaginaJuego(juego) {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-juego');

    if (juego.img) {
        const img = document.createElement('img');
        img.src = juego.img;
        img.alt = juego.nombre;
        img.className = 'libro-juego-img';
        contenido.appendChild(img);
    }

    contenido.appendChild(crearElemento('h3', 'libro-juego-nombre', juego.nombre));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const desc = crearElemento('div', 'libro-juego-desc');
    juego.parrafos.forEach(function (texto) {
        desc.appendChild(crearElemento('p', null, texto));
    });
    contenido.appendChild(desc);

    const tip = crearElemento('div', 'libro-juego-tip');
    tip.appendChild(crearElemento('span', 'libro-juego-tip-icono', '\uD83D\uDCA1'));
    tip.appendChild(document.createTextNode(juego.tip));
    contenido.appendChild(tip);

    return contenido;
}

// --- Modal de selección de héroe ---

function crearModalHeroe(onConfirmar) {
    const overlay = crearElemento('div', 'modal-heroe-overlay oculto');

    const panel = crearElemento('div', 'modal-heroe');
    panel.appendChild(crearElemento('h3', 'modal-heroe-titulo', 'Elige tu héroe'));
    panel.appendChild(crearElemento('div', 'libro-ornamento'));

    const selector = crearElemento('div', 'selector-heroe');
    let heroeElegido = null;

    const nombresPj = Object.keys(PERSONAJES);
    nombresPj.forEach(function (pjNombre) {
        const pj = PERSONAJES[pjNombre];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'selector-heroe-btn';
        btn.title = pjNombre;

        const avatar = document.createElement('img');
        avatar.src = pj.img;
        avatar.alt = pjNombre;
        avatar.className = 'selector-heroe-avatar';
        btn.appendChild(avatar);

        const label = crearElemento('span', 'selector-heroe-nombre', pjNombre);
        btn.appendChild(label);

        btn.addEventListener('click', function () {
            heroeElegido = pjNombre;
            selector.querySelectorAll('.selector-heroe-btn').forEach(function (b) {
                b.classList.remove('selector-heroe-activo');
            });
            btn.classList.add('selector-heroe-activo');
            btnConfirmar.disabled = false;
        });

        selector.appendChild(btn);
    });
    panel.appendChild(selector);

    const acciones = crearElemento('div', 'modal-heroe-acciones');

    const btnCancelar = crearElemento('button', 'modal-heroe-btn-cancelar', 'Volver');
    btnCancelar.type = 'button';
    btnCancelar.addEventListener('click', function () {
        cerrar();
    });
    acciones.appendChild(btnCancelar);

    const btnConfirmar = crearElemento('button', 'libro-juego-btn-jugar', 'Jugar');
    btnConfirmar.type = 'button';
    btnConfirmar.disabled = true;
    btnConfirmar.addEventListener('click', function () {
        if (heroeElegido && juegoIdActual) {
            onConfirmar(juegoIdActual, heroeElegido);
        }
    });
    acciones.appendChild(btnConfirmar);

    panel.appendChild(acciones);
    overlay.appendChild(panel);

    // Cerrar al hacer click en el overlay (fuera del panel)
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrar();
    });

    let juegoIdActual = null;

    function abrir(juegoId) {
        juegoIdActual = juegoId;
        // Resetear selección
        heroeElegido = null;
        selector.querySelectorAll('.selector-heroe-btn').forEach(function (b) {
            b.classList.remove('selector-heroe-activo');
        });
        btnConfirmar.disabled = true;
        overlay.classList.remove('oculto');
    }

    function cerrar() {
        overlay.classList.add('oculto');
        juegoIdActual = null;
    }

    return { overlay: overlay, abrir: abrir, cerrar: cerrar };
}

// Genera la página de detalle de un juego: descripción + botón Jugar
function generarDetalleJuego(nombre, _tabAnterior, abrirModalHeroe) {
    const entidades = adaptarJuegos();
    const datos = entidades[nombre];
    const juego = JUEGOS[datos.juegoId];

    const contenido = generarPaginaJuego(juego);

    // Botón Jugar que abre el modal de selección de héroe
    const btnJugar = crearElemento('button', 'libro-juego-btn-jugar', 'Jugar');
    btnJugar.type = 'button';
    btnJugar.addEventListener('click', function () {
        abrirModalHeroe(datos.juegoId);
    });
    contenido.appendChild(btnJugar);

    return contenido;
}

// Genera la página de prólogo del Libro de Juegos
function generarPrologoJuegos() {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-intro');

    contenido.appendChild(crearElemento('h2', 'libro-intro-game-titulo', 'Libro de Juegos'));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const texto = crearElemento('div', 'libro-intro-texto');
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'En estas páginas encontrarás los desafíos que aguardan a todo aventurero valiente. Cada juego es una prueba única que pondrá a prueba tu ingenio, memoria y reflejos.'
        )
    );
    texto.appendChild(
        crearElemento(
            'p',
            null,
            'Elige un desafío del índice, escoge a tu héroe favorito y lánzate a la aventura. No importa cuántas veces lo intentes: cada partida es una nueva oportunidad.'
        )
    );
    texto.appendChild(
        crearElemento('p', 'libro-intro-cta', '¡Abre el índice y elige tu primer desafío!')
    );
    contenido.appendChild(texto);

    return contenido;
}

/**
 * Crea el Libro de Juegos.
 * @param {HTMLElement} contenedor - Elemento donde montar
 * @param {Function} onJugar - Callback (juegoId, nombrePersonaje)
 * @returns {{ libro: HTMLElement, manejarTecladoLibro: Function, destruir: Function }}
 */
export function crearLibroJuegos(contenedor, onJugar) {
    const entidades = adaptarJuegos();

    // Modal de selección de héroe (se crea una vez, se reutiliza)
    const modalHeroe = crearModalHeroe(onJugar);

    const { libro, manejarTecladoLibro } = crearLibro({
        entidades: entidades,
        generarDetalle: function (nombre, tabAnterior) {
            return generarDetalleJuego(nombre, tabAnterior, modalHeroe.abrir);
        },
        claseRaiz: 'libro-juegos',
        titulo: 'Libro de Juegos',
        subtitulo: 'La enciclopedia de juegos',
        tituloEntidades: 'Juegos',
        paginaInicio: {
            textoIndice: 'Portada',
            textoSeccion: 'Portada',
            generarContenido: function () {
                return generarPortada(
                    'Libro de Juegos',
                    'assets/img/biblioteca/portada-juegos.webp'
                );
            },
        },
        paginasExtras: [
            {
                textoIndice: 'Prólogo',
                generarContenido: generarPrologoJuegos,
            },
        ],
        ordenar: function (nombres) {
            // Mantener orden por id de juego
            const orden = Object.keys(JUEGOS);
            return nombres.slice().sort(function (a, b) {
                return orden.indexOf(entidades[a].juegoId) - orden.indexOf(entidades[b].juegoId);
            });
        },
    });

    // Montar el modal de héroe dentro del libro
    libro.appendChild(modalHeroe.overlay);

    return {
        libro: libro,
        manejarTecladoLibro: manejarTecladoLibro,
        destruir: function () {
            libro.remove();
        },
    };
}
