// Componente: Libro de Juegos
// Usa crearLibro() para mostrar los 4 desafíos con selector de héroe en modal

import { crearElemento } from '../utils.js';
import { PERSONAJES } from '../personajes.js';
import { ENEMIGOS } from '../enemigos.js';
import { crearLibro, generarPortada } from './libro.js';
import { CFG as CFG_MEMORICE } from '../juegos/memorice/config.js';

// Mapa de juegos que tienen selector de dificultad en el modal de héroe
const DIFICULTAD_POR_JUEGO = {
    memorice: CFG_MEMORICE.dificultad,
};

// Datos de los 4 juegos con descripciones completas
const JUEGOS = {
    laberinto: {
        nombre: 'El Laberinto',
        img: 'assets/img/juegos/laberinto.webp',
        accent: '#bb86fc',
        parrafos: [
            '¡Bienvenido al laberinto más enredado de todos! Sus pasillos oscuros esconden una llave mágica que necesitas para escapar.',
            'Al entrar despiertas a las criaturas que duermen en sus rincones. Al principio estarán aturdidas y lentas, pero con cada segundo que pasa se vuelven más feroces y rápidas. ¡No te confíes!',
            'Camina con cuidado entre las paredes sombrías. Dicen que algunas guardan secretos... y si sientes una brisa extraña, ¡empuja!',
        ],
        tip: 'Aprovecha los primeros segundos para explorar. Los enemigos recién despertados son torpes y lentos.',
    },
    laberinto3d: {
        nombre: 'El Laberinto 3D',
        img: 'assets/img/juegos/laberinto3d.webp',
        accent: '#6bfc86',
        parrafos: [
            '¡El laberinto ha cobrado vida en tres dimensiones! Las paredes se alzan a tu alrededor y el camino se vuelve aún más confuso.',
            'Un cofre del tesoro se esconde en lo más profundo del laberinto. Solo puedes ver lo que hay frente a ti. ¿Podrás encontrarlo y escapar?',
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
        modos: [
            {
                icono: '\u26A1',
                nombre: 'Fácil',
                desc: 'Los relámpagos iluminan la sala y revelan las cartas por un instante. ¡Aprovecha el destello!',
            },
            {
                icono: '\uD83C\uDFAF',
                nombre: 'Normal',
                desc: 'El desafío clásico. Solo cuentas con tu memoria y tus intentos.',
            },
            {
                icono: '\uD83C\uDF00',
                nombre: 'Difícil',
                desc: 'Después de cada par encontrado, las cartas restantes se mezclan. ¡La memoria ya no basta!',
            },
        ],
    },
    abismo: {
        nombre: 'El Abismo',
        img: 'assets/img/juegos/abismo.webp',
        accent: '#5eeadb',
        parrafos: [
            'Un abismo sin fondo se extiende ante ti. Plataformas flotantes son tu único camino. ¡Un paso en falso y caerás al vacío!',
            'Esbirros patrullan las plataformas y un temible boss te espera al final. Salta sobre los enemigos para derrotarlos, pero cuidado: el boss tiene ataques especiales que deberás esquivar.',
            'En las profundidades flotan objetos mágicos que aguardan a los valientes: el <strong>Anillo del Viento</strong> te dará un salto extra en el aire, la <strong>Pluma del Fénix</strong> te protegerá del próximo golpe, y la <strong>Brújula Estelar</strong> te hará invencible y veloz por unos instantes. ¡Encuéntralos antes de que desaparezcan!',
            'Derrota al boss para abrir la salida y conseguir la llave.',
        ],
        tip: 'Salta sobre los enemigos para hacerles daño. Recoge los objetos mágicos que flotan en el mapa para obtener poderes especiales.',
    },
    ajedrez: {
        nombre: 'El Ajedrez',
        img: 'assets/img/juegos/ajedrez.webp',
        accent: '#f0a030',
        parrafos: [
            'Un tablero de ajedrez mágico donde un ejército aleatorio de villanos cobra vida como piezas enemigas.',
            'Mueve tus piezas con estrategia para dar jaque mate. Cada pieza enemiga es un villano con su propio avatar.',
        ],
        modos: [
            {
                icono: '\uD83E\uDD16',
                nombre: 'vs IA',
                desc: 'Enfrenta al ejército de villanos controlado por la máquina. Elige dificultad y color.',
            },
            {
                icono: '\uD83E\uDD1D',
                nombre: 'vs Humano',
                desc: 'Dos jugadores en el mismo dispositivo. Uno controla a los héroes y el otro a los villanos.',
            },
        ],
        tip: 'Piensa antes de mover. Protege a tu rey y busca debilidades en el rival.',
    },
    duelo: {
        nombre: 'El Duelo',
        img: 'assets/img/juegos/duelo.webp',
        accent: '#a050dc',
        parrafos: [
            '\u00a1Un combate cara a cara! Elige tu luchador y enfrenta a un rival en una arena m\u00e1gica. Golpes r\u00e1pidos, ataques poderosos, bloqueos y esquivas: todo vale en este duelo.',
            'Puedes jugar como h\u00e9roe o como villano. Elige tu bando, escoge a tu luchador favorito y desaf\u00eda a un oponente del bando contrario.',
            'Cada luchador tiene sus propias estad\u00edsticas y ataques. Los villanos m\u00e1s temibles son m\u00e1s agresivos y peligrosos. \u00bfPodr\u00e1s derrotar a un villano pesadilla?',
        ],
        tip: 'Bloquea manteniendo la direcci\u00f3n opuesta al rival. Ag\u00e1chate para esquivar ataques altos. Alterna golpes r\u00e1pidos y fuertes.',
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
        img.loading = 'lazy';
        contenido.appendChild(img);
    }

    contenido.appendChild(crearElemento('h3', 'libro-juego-nombre', juego.nombre));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const desc = crearElemento('div', 'libro-juego-desc');
    juego.parrafos.forEach(function (texto) {
        desc.appendChild(crearElemento('p', null, texto));
    });
    contenido.appendChild(desc);

    // Sección de modos de dificultad (si el juego los define)
    if (juego.modos) {
        const modos = crearElemento('div', 'libro-juego-modos');
        juego.modos.forEach(function (modo) {
            const card = crearElemento('div', 'libro-juego-modo');
            card.appendChild(crearElemento('span', 'libro-juego-modo-icono', modo.icono));
            card.appendChild(crearElemento('strong', null, modo.nombre));
            card.appendChild(crearElemento('p', null, modo.desc));
            modos.appendChild(card);
        });
        contenido.appendChild(modos);
    }

    if (juego.tip) {
        const tip = crearElemento('div', 'libro-juego-tip');
        tip.appendChild(crearElemento('span', 'libro-juego-tip-icono', '\uD83D\uDCA1'));
        tip.appendChild(document.createTextNode(juego.tip));
        contenido.appendChild(tip);
    }

    return contenido;
}

// --- Modal de selección de héroe ---

function crearModalHeroe(onConfirmar) {
    const overlay = crearElemento('div', 'modal-heroe-overlay oculto');

    const panel = crearElemento('div', 'modal-heroe');
    const titulo = crearElemento('h3', 'modal-heroe-titulo', 'Elige tu héroe');
    panel.appendChild(titulo);
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
        avatar.loading = 'lazy';
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
            titulo.classList.add('modal-heroe-titulo-listo');
        });

        selector.appendChild(btn);
    });
    panel.appendChild(selector);

    // --- Selector de dificultad (oculto por defecto, se muestra si el juego lo requiere) ---
    const seccionDificultad = crearElemento('div', 'modal-heroe-dificultad oculto');
    seccionDificultad.appendChild(
        crearElemento('span', 'modal-heroe-dificultad-titulo', 'Dificultad')
    );
    const btnsDificultad = crearElemento('div', 'modal-heroe-dificultad-opciones');
    seccionDificultad.appendChild(btnsDificultad);
    panel.appendChild(seccionDificultad);

    let dificultadElegida = null;

    function poblarDificultad(cfg) {
        btnsDificultad.innerHTML = '';
        cfg.opciones.forEach(function (opcion, i) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'modal-heroe-dificultad-btn';
            btn.dataset.id = opcion.id;

            btn.appendChild(crearElemento('span', 'modal-heroe-dificultad-icono', opcion.icono));
            btn.appendChild(crearElemento('span', null, opcion.nombre));

            btn.addEventListener('click', function () {
                dificultadElegida = opcion.id;
                btnsDificultad
                    .querySelectorAll('.modal-heroe-dificultad-btn')
                    .forEach(function (b) {
                        b.classList.remove('modal-heroe-dificultad-activo');
                    });
                btn.classList.add('modal-heroe-dificultad-activo');
            });

            // Preseleccionar el default
            if (i === cfg.default) {
                btn.classList.add('modal-heroe-dificultad-activo');
                dificultadElegida = opcion.id;
            }

            btnsDificultad.appendChild(btn);
        });
    }

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
            onConfirmar(juegoIdActual, heroeElegido, dificultadElegida);
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
        // Resetear selección de héroe
        heroeElegido = null;
        selector.querySelectorAll('.selector-heroe-btn').forEach(function (b) {
            b.classList.remove('selector-heroe-activo');
        });
        btnConfirmar.disabled = true;
        titulo.classList.remove('modal-heroe-titulo-listo');

        // Mostrar/ocultar selector de dificultad según el juego
        const cfgDif = DIFICULTAD_POR_JUEGO[juegoId];
        if (cfgDif) {
            poblarDificultad(cfgDif);
            seccionDificultad.classList.remove('oculto');
        } else {
            seccionDificultad.classList.add('oculto');
            dificultadElegida = null;
        }

        overlay.classList.remove('oculto');
    }

    function cerrar() {
        overlay.classList.add('oculto');
        juegoIdActual = null;
    }

    return { overlay: overlay, abrir: abrir, cerrar: cerrar };
}

// Juegos que no usan el modal de selección de héroe (eligen dentro del juego)
const JUEGOS_SIN_MODAL_HEROE = { ajedrez: true, duelo: true };

// --- Modal de selección dual para El Duelo ---

function crearModalDuelo(onConfirmar) {
    const overlay = crearElemento('div', 'modal-heroe-overlay oculto');
    const panel = crearElemento('div', 'modal-heroe duelo-modal-seleccion');

    // Paso 1: Elegir bando
    const tituloBando = crearElemento('h3', 'modal-heroe-titulo', 'Elige tu bando');
    panel.appendChild(tituloBando);
    panel.appendChild(crearElemento('div', 'libro-ornamento'));

    let bandoElegido = null; // 'heroe' | 'villano'
    let luchadorElegido = null;
    let oponenteElegido = null;
    let pasoActual = 'bando'; // 'bando' | 'luchador' | 'oponente'

    // Contenedor de bandos
    const bandos = crearElemento('div', 'duelo-bandos');
    const btnHeroe = crearElemento('button', 'duelo-bando-btn', 'H\u00e9roe');
    btnHeroe.type = 'button';
    btnHeroe.addEventListener('click', function () {
        bandoElegido = 'heroe';
        mostrarPasoLuchador();
    });
    const btnVillano = crearElemento('button', 'duelo-bando-btn duelo-bando-villano', 'Villano');
    btnVillano.type = 'button';
    btnVillano.addEventListener('click', function () {
        bandoElegido = 'villano';
        mostrarPasoLuchador();
    });
    bandos.appendChild(btnHeroe);
    bandos.appendChild(btnVillano);
    panel.appendChild(bandos);

    // Contenedor selector (reutilizado para luchador y oponente)
    const selectorContenedor = crearElemento('div', 'duelo-selector oculto');
    const tituloSelector = crearElemento('h3', 'modal-heroe-titulo', '');
    const selectorGrid = crearElemento('div', 'selector-heroe');
    selectorContenedor.appendChild(tituloSelector);
    selectorContenedor.appendChild(crearElemento('div', 'libro-ornamento'));
    selectorContenedor.appendChild(selectorGrid);
    panel.appendChild(selectorContenedor);

    // Acciones
    const acciones = crearElemento('div', 'modal-heroe-acciones');
    const btnVolver = crearElemento('button', 'modal-heroe-btn-cancelar', 'Volver');
    btnVolver.type = 'button';
    btnVolver.addEventListener('click', function () {
        if (pasoActual === 'oponente') {
            mostrarPasoLuchador();
        } else if (pasoActual === 'luchador') {
            mostrarPasoBando();
        } else {
            cerrar();
        }
    });
    const btnConfirmar = crearElemento('button', 'libro-juego-btn-jugar', '\u00a1Pelear!');
    btnConfirmar.type = 'button';
    btnConfirmar.disabled = true;
    btnConfirmar.addEventListener('click', function () {
        if (!luchadorElegido || !oponenteElegido) return;
        const jugadorEsVillano = bandoElegido === 'villano';
        const oponente = (jugadorEsVillano ? PERSONAJES : ENEMIGOS)[oponenteElegido];
        onConfirmar('duelo', luchadorElegido, null, {
            oponente: oponente,
            jugadorEsVillano: jugadorEsVillano,
        });
    });
    acciones.appendChild(btnVolver);
    acciones.appendChild(btnConfirmar);
    panel.appendChild(acciones);

    overlay.appendChild(panel);

    // Cerrar al click fuera
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrar();
    });

    function poblarSelector(coleccion, onSeleccionar) {
        selectorGrid.innerHTML = '';
        Object.keys(coleccion).forEach(function (nombre) {
            const ent = coleccion[nombre];
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'selector-heroe-btn';
            btn.title = nombre;

            const avatar = document.createElement('img');
            avatar.src = ent.img;
            avatar.alt = nombre;
            avatar.className = 'selector-heroe-avatar';
            avatar.loading = 'lazy';
            btn.appendChild(avatar);
            btn.appendChild(crearElemento('span', 'selector-heroe-nombre', nombre));

            btn.addEventListener('click', function () {
                selectorGrid.querySelectorAll('.selector-heroe-btn').forEach(function (b) {
                    b.classList.remove('selector-heroe-activo');
                });
                btn.classList.add('selector-heroe-activo');
                onSeleccionar(nombre);
            });

            selectorGrid.appendChild(btn);
        });
    }

    function mostrarPasoBando() {
        pasoActual = 'bando';
        bandoElegido = null;
        luchadorElegido = null;
        oponenteElegido = null;
        bandos.classList.remove('oculto');
        selectorContenedor.classList.add('oculto');
        btnConfirmar.disabled = true;
        tituloBando.textContent = 'Elige tu bando';
    }

    function mostrarPasoLuchador() {
        pasoActual = 'luchador';
        luchadorElegido = null;
        oponenteElegido = null;
        bandos.classList.add('oculto');
        selectorContenedor.classList.remove('oculto');
        btnConfirmar.disabled = true;

        const esVillano = bandoElegido === 'villano';
        tituloSelector.textContent = esVillano ? 'Elige tu villano' : 'Elige tu h\u00e9roe';
        const coleccion = esVillano ? ENEMIGOS : PERSONAJES;

        poblarSelector(coleccion, function (nombre) {
            luchadorElegido = nombre;
            mostrarPasoOponente();
        });
    }

    function mostrarPasoOponente() {
        pasoActual = 'oponente';
        oponenteElegido = null;
        btnConfirmar.disabled = true;

        const esVillano = bandoElegido === 'villano';
        tituloSelector.textContent = esVillano
            ? 'Elige tu rival h\u00e9roe'
            : 'Elige tu rival villano';
        const oponenteColeccion = esVillano ? PERSONAJES : ENEMIGOS;

        poblarSelector(oponenteColeccion, function (nombre) {
            oponenteElegido = nombre;
            btnConfirmar.disabled = false;
        });
    }

    function abrir() {
        mostrarPasoBando();
        overlay.classList.remove('oculto');
    }

    function cerrar() {
        overlay.classList.add('oculto');
    }

    return { overlay: overlay, abrir: abrir, cerrar: cerrar };
}

// Genera la página de detalle de un juego: descripción + botón Jugar
function generarDetalleJuego(
    nombre,
    _tabAnterior,
    abrirModalHeroe,
    onJugarDirecto,
    abrirModalDuelo
) {
    const entidades = adaptarJuegos();
    const datos = entidades[nombre];
    const juego = JUEGOS[datos.juegoId];

    const contenido = generarPaginaJuego(juego);

    // Botón Jugar justo debajo del título
    const btnJugar = crearElemento('button', 'libro-juego-btn-jugar', 'Jugar');
    btnJugar.type = 'button';
    btnJugar.addEventListener('click', function () {
        if (datos.juegoId === 'duelo') {
            abrirModalDuelo();
        } else if (JUEGOS_SIN_MODAL_HEROE[datos.juegoId]) {
            // Iniciar directo sin modal de héroe (el juego maneja la selección)
            const primerHeroe = Object.keys(PERSONAJES)[0];
            onJugarDirecto(datos.juegoId, primerHeroe, null);
        } else {
            abrirModalHeroe(datos.juegoId);
        }
    });
    const ornamento = contenido.querySelector('.libro-ornamento');
    ornamento.after(btnJugar);

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
 * @param {Function} onJugar - Callback (juegoId, nombrePersonaje, dificultad)
 * @returns {{ libro: HTMLElement, manejarTecladoLibro: Function, destruir: Function }}
 */
export function crearLibroJuegos(contenedor, onJugar) {
    const entidades = adaptarJuegos();

    // Modal de selección de héroe (se crea una vez, se reutiliza)
    const modalHeroe = crearModalHeroe(onJugar);

    // Modal de selección dual para El Duelo
    const modalDuelo = crearModalDuelo(function (juegoId, nombreLuchador, dificultad, opciones) {
        onJugar(juegoId, nombreLuchador, dificultad, opciones);
    });

    const { libro, manejarTecladoLibro } = crearLibro({
        entidades: entidades,
        generarDetalle: function (nombre, tabAnterior) {
            return generarDetalleJuego(
                nombre,
                tabAnterior,
                modalHeroe.abrir,
                onJugar,
                modalDuelo.abrir
            );
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

    // Montar los modales dentro del libro
    libro.appendChild(modalHeroe.overlay);
    libro.appendChild(modalDuelo.overlay);

    return {
        libro: libro,
        manejarTecladoLibro: manejarTecladoLibro,
        destruir: function () {
            libro.remove();
        },
    };
}
