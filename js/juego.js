// Código principal — El Relatario
import { PERSONAJES } from './personajes.js';
import { ENEMIGOS } from './enemigos.js';
import { iniciarLaberinto, limpiarLaberinto } from './juegos/laberinto/index.js';
import { iniciarLaberinto3d, limpiarLaberinto3d } from './juegos/laberinto3d/index.js';
import { iniciarMemorice, limpiarMemorice } from './juegos/memorice/index.js';
import { iniciarAbismo, limpiarAbismo } from './juegos/abismo/index.js';
import { iniciarAjedrez, limpiarAjedrez } from './juegos/ajedrez/index.js';
import { crearBarraSuperior } from './componentes/barraSuperior.js';
import { crearModalDerrota } from './componentes/modalDerrota.js';
import { crearModalSalir } from './componentes/modalSalir.js';
import { crearTransicion } from './componentes/transicion.js';
import { crearControlesTouch } from './componentes/controlesTouch.js';
import { crearToast } from './componentes/toast.js';
import { crearEstante } from './componentes/estante.js';
import { crearLibroJuegos } from './componentes/libroJuegos.js';
import { crearModalLibro } from './componentes/modalLibro.js';
import { crearLibro, generarPortada } from './componentes/libro.js';
import { generarDetalleHeroe, generarIntro, adaptarEntidades } from './componentes/libroHeroes.js';
import {
    generarDetalleVillano,
    generarPrologoVillanos,
    generarPaginaRangos,
    ordenarPorTier,
    necesitaSeparador,
} from './componentes/libroVillanos.js';
import { CUENTOS_ESTANTE, CUENTOS_DATOS } from './cuentos/registro.js';
import { crearLibroCuento } from './componentes/libroCuento.js';
import { crearModalTesoro, sortearTesoro } from './componentes/modalTesoro.js';
import { crearLibroTesorario, NOMBRES_JUEGOS } from './componentes/libroTesorario.js';
import { CHANGELOG_ESTANTE, CHANGELOG_DATOS } from './changelog/registro.js';
import { crearLibroNovedades } from './componentes/libroNovedades.js';

// --- Estados del juego (máquina de estados) ---

const ESTADOS = {
    BIBLIOTECA: 'BIBLIOTECA',
    LIBRO: 'LIBRO',
    JUEGO: 'JUEGO',
};

// Registro de juegos: { "laberinto": { iniciar, limpiar }, ... }
const juegos = {
    laberinto: { iniciar: iniciarLaberinto, limpiar: limpiarLaberinto },
    laberinto3d: { iniciar: iniciarLaberinto3d, limpiar: limpiarLaberinto3d },
    memorice: { iniciar: iniciarMemorice, limpiar: limpiarMemorice },
    abismo: { iniciar: iniciarAbismo, limpiar: limpiarAbismo },
    ajedrez: { iniciar: iniciarAjedrez, limpiar: limpiarAjedrez },
};

// --- Estado del juego ---

const estado = {
    estadoActual: ESTADOS.BIBLIOTECA,
    jugadorActual: null, // instancia de Personaje
    juegoActual: null, // id del juego activo ('laberinto', 'laberinto3d', etc.)
    libroActivo: null, // id del libro abierto ('heroario', 'villanario', 'juegos')
    tesorosEncontrados: new Set(),
    pendienteVictoria: false,
};

// --- Crear componentes base ---

const contenedorJuego = document.getElementById('juego');
const contenedorBiblioteca = document.getElementById('biblioteca');
const barra = crearBarraSuperior(contenedorJuego);
const modalDerrota = crearModalDerrota();
const modalSalir = crearModalSalir(contenedorJuego);
const transicion = crearTransicion();
const dpad = crearControlesTouch();
const toast = crearToast();
const modalTesoro = crearModalTesoro();

// --- Configuraci\u00f3n de libros del estante (dos repisas) ---

const LIBROS_REPISA_SUPERIOR = [
    {
        id: 'juegos',
        titulo: 'Libro de Juegos',
        color: '#4a7c59',
        img: 'assets/img/biblioteca/lomo-juegos.webp',
    },
    {
        id: 'heroario',
        titulo: 'Heroario',
        color: '#c8a050',
        img: 'assets/img/biblioteca/lomo-heroario.webp',
    },
    {
        id: 'villanario',
        titulo: 'Villanario',
        color: '#8b3a62',
        img: 'assets/img/biblioteca/lomo-villanario.webp',
    },
    {
        id: 'tesorario',
        titulo: 'El Tesorario',
        color: '#b8860b',
        img: 'assets/img/biblioteca/lomo-tesorario.webp',
    },
];

const LIBROS_REPISA_INFERIOR = [CHANGELOG_ESTANTE, ...CUENTOS_ESTANTE];

// --- Estante (homepage) ---

function prepararRepisa(libros) {
    return libros.map(function (cfg) {
        return {
            id: cfg.id,
            titulo: cfg.titulo,
            color: cfg.color,
            img: cfg.img,
            onClick: function () {
                cambiarEstado(ESTADOS.LIBRO, { libroId: cfg.id });
            },
        };
    });
}

const estante = crearEstante(contenedorBiblioteca, [
    prepararRepisa(LIBROS_REPISA_SUPERIOR),
    prepararRepisa(LIBROS_REPISA_INFERIOR),
]);

// --- Cache de modales de libros (se crean on-demand, una vez) ---

const librosCache = {};

function crearHeroarioModal() {
    const heroario = crearLibro({
        entidades: adaptarEntidades(),
        generarDetalle: generarDetalleHeroe,
        claseRaiz: 'libro-heroes',
        titulo: 'Heroario',
        subtitulo: 'La enciclopedia de los héroes',
        tituloEntidades: 'Héroes',
        paginaInicio: {
            textoIndice: 'Portada',
            textoSeccion: 'Portada',
            generarContenido: function () {
                return generarPortada('Heroario', 'assets/img/biblioteca/portada-heroario.webp');
            },
        },
        paginasExtras: [
            {
                textoIndice: 'Prólogo',
                generarContenido: generarIntro,
            },
        ],
    });
    const modal = crearModalLibro(heroario.libro, heroario.manejarTecladoLibro);
    contenedorJuego.appendChild(modal.overlay);
    return modal;
}

function crearVillanarioModal() {
    const villanario = crearLibro({
        entidades: ENEMIGOS,
        generarDetalle: generarDetalleVillano,
        claseRaiz: 'libro-villanos',
        ordenar: ordenarPorTier,
        crearSeparador: necesitaSeparador,
        titulo: 'Villanario',
        subtitulo: 'La enciclopedia de villanos',
        tituloEntidades: 'Villanos',
        paginaInicio: {
            textoIndice: 'Portada',
            textoSeccion: 'Portada',
            generarContenido: function () {
                return generarPortada(
                    'Villanario',
                    'assets/img/biblioteca/portada-villanario.webp'
                );
            },
        },
        paginasExtras: [
            {
                textoIndice: 'Prólogo',
                generarContenido: generarPrologoVillanos,
            },
            {
                textoIndice: 'Rangos',
                generarContenido: generarPaginaRangos,
            },
        ],
    });
    const modal = crearModalLibro(villanario.libro, villanario.manejarTecladoLibro);
    contenedorJuego.appendChild(modal.overlay);
    return modal;
}

function crearJuegosModal() {
    const libJuegos = crearLibroJuegos(contenedorJuego, function (juegoId, nombrePersonaje) {
        // Desactivar onCerrar antes de cerrar para que no corrompa el estado
        const modalJuegos = librosCache['juegos'];
        if (modalJuegos) {
            modalJuegos.onCerrar(null);
            modalJuegos.cerrar();
        }
        cambiarEstado(ESTADOS.JUEGO, { juegoId, personaje: nombrePersonaje });
    });
    const modal = crearModalLibro(libJuegos.libro, libJuegos.manejarTecladoLibro);
    contenedorJuego.appendChild(modal.overlay);
    return modal;
}

function crearTesorarioModal() {
    const tesorario = crearLibroTesorario(estado.tesorosEncontrados);
    const modal = crearModalLibro(tesorario.libro, tesorario.manejarTecladoLibro);
    contenedorJuego.appendChild(modal.overlay);
    return modal;
}

function crearNovedadesModal() {
    const { libro, manejarTecladoLibro } = crearLibroNovedades(CHANGELOG_DATOS);
    const modal = crearModalLibro(libro, manejarTecladoLibro);
    contenedorJuego.appendChild(modal.overlay);
    return modal;
}

const fabricaModales = {
    heroario: crearHeroarioModal,
    villanario: crearVillanarioModal,
    juegos: crearJuegosModal,
    tesorario: crearTesorarioModal,
    novedades: crearNovedadesModal,
};

// Registrar factories de cuentos dinámicamente
CUENTOS_ESTANTE.forEach(function (info) {
    const slug = info.id.replace('cuento-', '');
    fabricaModales[info.id] = function () {
        const datos = CUENTOS_DATOS[slug];
        if (!datos) return undefined;
        const { libro, manejarTecladoLibro } = crearLibroCuento(datos);
        const modal = crearModalLibro(libro, manejarTecladoLibro);
        contenedorJuego.appendChild(modal.overlay);
        return modal;
    };
});

function obtenerModalLibro(libroId) {
    // El tesorario se recrea siempre (depende del estado actual de tesoros)
    if (libroId === 'tesorario') {
        if (librosCache.tesorario) {
            librosCache.tesorario.overlay.remove();
            delete librosCache.tesorario;
        }
    }

    if (librosCache[libroId]) return librosCache[libroId];

    const crear = fabricaModales[libroId];
    if (!crear) return undefined;

    const modal = crear();
    librosCache[libroId] = modal;
    return modal;
}

// --- Escuchar cambios de vida (trampas, combate, etc.) ---

document.addEventListener('vida-cambio', function () {
    if (estado.jugadorActual) {
        barra.actualizarVida(estado.jugadorActual);
    }
});

// Escuchar muerte del jugador
document.addEventListener('jugador-muerto', function () {
    if (!estado.jugadorActual) return;

    const pantallaJuego = estado.juegoActual
        ? document.getElementById('pantalla-' + estado.juegoActual)
        : null;
    const contenedorModal = pantallaJuego || contenedorJuego;
    modalDerrota.mostrar(estado.jugadorActual.nombre, contenedorModal);
});

// --- Escuchar victoria del jugador ---

document.addEventListener('juego-victoria', function () {
    estado.pendienteVictoria = true;
});

// --- Navegar del Tesorario a una página del Libro de Juegos ---

document.addEventListener('navegar-juego', function (e) {
    if (estado.estadoActual !== ESTADOS.LIBRO) return;

    const slug = e.detail.slug;
    const nombreJuego = NOMBRES_JUEGOS[slug];
    if (!nombreJuego) return;

    // Desactivar onCerrar antes de cerrar para que no corrompa el estado
    const modalActivo = estado.libroActivo ? librosCache[estado.libroActivo] : null;
    if (modalActivo) {
        modalActivo.onCerrar(null);
        modalActivo.cerrar();
    }

    // Abrir el Libro de Juegos y navegar a la página del juego
    cambiarEstado(ESTADOS.LIBRO, { libroId: 'juegos' });
    const juegosModal = librosCache.juegos;
    if (juegosModal) {
        const item = juegosModal.overlay.querySelector('[data-nombre="' + nombreJuego + '"]');
        if (item) item.click();
    }
});

// --- Máquina de estados: transiciones centralizadas ---

function ejecutarCambioEstado(anterior, nuevo, datos) {
    // Salir del estado anterior
    if (anterior === ESTADOS.JUEGO) {
        document.body.classList.remove('modo-juego');
        const juegoRegistrado = juegos[estado.juegoActual];
        if (juegoRegistrado) juegoRegistrado.limpiar();
        dpad.ocultar();
        estado.juegoActual = null;
        estado.jugadorActual = null;
        estado.pendienteVictoria = false;
        barra.ocultar();
    }

    estado.estadoActual = nuevo;

    // Entrar al nuevo estado
    if (nuevo === ESTADOS.BIBLIOTECA) {
        estante.mostrar();
        estado.libroActivo = null;
    } else if (nuevo === ESTADOS.LIBRO) {
        estante.mostrar(); // El estante permanece visible detrás del modal
        estado.libroActivo = datos.libroId;

        const modal = obtenerModalLibro(datos.libroId);
        if (!modal) {
            // libroId desconocido: volver a BIBLIOTECA
            estado.estadoActual = ESTADOS.BIBLIOTECA;
            estado.libroActivo = null;
            return;
        }
        modal.onCerrar(function () {
            if (estado.estadoActual === ESTADOS.LIBRO) {
                estado.estadoActual = ESTADOS.BIBLIOTECA;
                estado.libroActivo = null;
            }
        });
        modal.abrir();
    } else if (nuevo === ESTADOS.JUEGO) {
        document.body.classList.add('modo-juego');
        estante.ocultar();

        const juegoRegistrado = juegos[datos.juegoId];
        if (!juegoRegistrado) return;

        estado.juegoActual = datos.juegoId;
        // Copia que preserva métodos del prototipo (recibirDano, estaVivo, curar)
        const original = PERSONAJES[datos.personaje];
        estado.jugadorActual = Object.assign(
            Object.create(Object.getPrototypeOf(original)),
            original
        );
        estado.jugadorActual.vidaActual = estado.jugadorActual.vidaMax;
        estado.jugadorActual.inventario = [];

        barra.mostrar(estado.jugadorActual);

        juegoRegistrado.iniciar(
            estado.jugadorActual,
            function () {
                // Si hubo victoria, sortear tesoro y mostrar modal tras la transición
                let tesoroSorteado = null;
                if (estado.pendienteVictoria) {
                    estado.pendienteVictoria = false;
                    const nombre = sortearTesoro(estado.tesorosEncontrados);
                    if (nombre) {
                        estado.tesorosEncontrados.add(nombre);
                        tesoroSorteado = nombre;
                    }
                }
                cambiarEstado(ESTADOS.LIBRO, { libroId: 'juegos' });
                if (tesoroSorteado) {
                    modalTesoro.mostrar(tesoroSorteado, contenedorJuego);
                }
            },
            dpad
        );
    }
}

// Guard para prevenir transiciones concurrentes durante animación iris
let transicionEnCurso = false;

function cambiarEstado(nuevo, datos) {
    if (transicionEnCurso) return;
    const anterior = estado.estadoActual;

    // Transiciones solo entre juego y otros estados (iris)
    if (nuevo === ESTADOS.JUEGO || anterior === ESTADOS.JUEGO) {
        transicionEnCurso = true;
        toast.limpiar();
        transicion.ejecutar('iris', function () {
            ejecutarCambioEstado(anterior, nuevo, datos);
            transicionEnCurso = false;
        });
    } else {
        // Cambios entre BIBLIOTECA y LIBRO son instantáneos (modal)
        ejecutarCambioEstado(anterior, nuevo, datos);
    }
}

// --- Modal de salir (desde dentro de un juego) ---

modalSalir.onConfirmar(function () {
    cambiarEstado(ESTADOS.LIBRO, { libroId: 'juegos' });
});

// Callback del modal de derrota
modalDerrota.onAceptar(function () {
    cambiarEstado(ESTADOS.LIBRO, { libroId: 'juegos' });
});

// Callback del modal de tesoro
modalTesoro.onAceptar(function () {
    cambiarEstado(ESTADOS.LIBRO, { libroId: 'juegos' });
});

// --- Controles del teclado ---

document.addEventListener('keydown', function (e) {
    if (modalTesoro.estaAbierto()) {
        modalTesoro.manejarTecla(e);
        return;
    }
    if (modalDerrota.estaAbierto()) {
        modalDerrota.manejarTecla(e);
        return;
    }
    if (modalSalir.estaAbierto()) {
        modalSalir.manejarTecla(e);
        return;
    }
});

// --- Inicializar: mostrar biblioteca ---

estante.mostrar();
