// Habitación 4 — El Abismo
// Platformer 2D side-scrolling: saltar plataformas, evitar abismos,
// stomper esbirros, derrotar al boss y conseguir la llave

import { CFG } from './config.js';
import { obtenerSpawns, resetearMapa } from './nivel.js';
import { iniciarCamara, actualizarCamara, obtenerCamaraX } from './camara.js';
import { renderizarFondo, renderizarTiles, renderizarHUD } from './renderer.js';
import { aabbColision } from './fisicas.js';
import {
    iniciarJugador,
    actualizarJugador,
    renderizarJugador,
    obtenerPosicion,
    esInvulnerable,
    caerAlAbismo,
    recibirDano,
    aplicarStompRebote,
    detectarMetaTile,
} from './jugadorPlat.js';
import {
    iniciarEnemigos,
    actualizarEnemigos,
    renderizarEnemigos,
    obtenerEnemigosVivos,
    stomperEnemigo,
    esBossVivo,
    obtenerDanoEnemigo,
    limpiarEnemigos,
} from './enemigoPlat.js';
import { lanzarToast } from '../../componentes/toast.js';

// --- Estado del módulo ---

let pantalla = null;
let canvas = null;
let ctx = null;
let animacionId = null;
let activo = false;
let callbackSalir = null;
let jugador = null;
let teclasRef = {};
let anchoCanvas = CFG.canvas.anchoBase;
let altoCanvas = CFG.canvas.altoBase;
let escala = 1;
let muerto = false;
let timeoutIds = [];

// --- Calcular escala del canvas según viewport ---

function calcularEscala() {
    if (!pantalla) return 1;

    const rect = pantalla.getBoundingClientRect();
    // Reservar espacio para cabecera (40px) y padding
    const disponibleAncho = rect.width - 16;
    const disponibleAlto = rect.height - 60;

    const escalaX = Math.floor(disponibleAncho / CFG.canvas.anchoBase) || 1;
    const escalaY = Math.floor(disponibleAlto / CFG.canvas.altoBase) || 1;

    return Math.max(1, Math.min(escalaX, escalaY));
}

// --- Crear DOM ---

function crearPantalla(esTouch) {
    pantalla = document.createElement('div');
    pantalla.id = 'pantalla-habitacion4';
    pantalla.className = 'habitacion-4';

    // Cabecera: botón huir + título
    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-habitacion';

    const btnHuir = document.createElement('button');
    btnHuir.className = 'btn-huir';
    btnHuir.title = 'Huir al pasillo (Esc)';
    btnHuir.setAttribute('aria-label', 'Huir al pasillo');
    const imgHuir = document.createElement('img');
    imgHuir.src = 'assets/img/icons/btn-salir.webp';
    imgHuir.alt = '';
    imgHuir.className = 'btn-huir-icono';
    btnHuir.appendChild(imgHuir);
    btnHuir.addEventListener('click', function () {
        limpiarHabitacion4();
        callbackSalir();
    });

    const titulo = document.createElement('h2');
    titulo.className = 'titulo-habitacion';
    titulo.textContent = CFG.meta.titulo;

    cabecera.appendChild(btnHuir);
    cabecera.appendChild(titulo);

    // Canvas (dimensiones lógicas fijas)
    anchoCanvas = CFG.canvas.anchoBase;
    altoCanvas = CFG.canvas.altoBase;

    canvas = document.createElement('canvas');
    canvas.id = 'canvas-platformer';
    canvas.width = anchoCanvas;
    canvas.height = altoCanvas;
    ctx = canvas.getContext('2d');

    // Hint
    let hint = null;
    if (!esTouch) {
        hint = document.createElement('p');
        hint.className = 'laberinto-hint';
        hint.textContent = 'Flechas ← → para mover · ↑ para saltar · Esc para huir';
    }

    pantalla.appendChild(cabecera);
    pantalla.appendChild(canvas);
    if (hint) pantalla.appendChild(hint);

    // Agregar al DOM antes de calcular escala (getBoundingClientRect necesita layout)
    document.getElementById('juego').appendChild(pantalla);

    escala = calcularEscala();
    canvas.style.width = anchoCanvas * escala + 'px';
    canvas.style.height = altoCanvas * escala + 'px';
}

// --- Colisiones jugador-enemigo ---

function verificarColisionesEnemigos() {
    const jug = obtenerPosicion();
    const vivos = obtenerEnemigosVivos();

    for (let i = 0; i < vivos.length; i++) {
        const e = vivos[i];

        const jugRect = { x: jug.x, y: jug.y, ancho: jug.ancho, alto: jug.alto };
        const eneRect = { x: e.x, y: e.y, ancho: e.ancho, alto: e.alto };

        if (!aabbColision(jugRect, eneRect)) continue;

        // Stomp: pie del jugador sobre mitad superior del enemigo + cayendo
        const pieJugador = jug.y + jug.alto;
        const mitadEnemigo = e.y + e.alto / 2;

        if (jug.vy > 0 && pieJugador <= mitadEnemigo + CFG.enemigos.stompMargen) {
            // Stomp exitoso
            const dano = jugador.ataques[0] ? jugador.ataques[0].dano : 10;
            const bossDestruido = stomperEnemigo(e, dano);
            aplicarStompRebote();

            if (bossDestruido) {
                lanzarToast('¡' + e.nombre + ' derrotado!', '⭐', 'exito');
            } else if (!e.esBoss && !e.vivo) {
                lanzarToast(e.nombre + ' eliminado', '💥', 'dano');
            } else if (e.esBoss) {
                // Boss dañado pero no muerto
                const porcentaje = Math.round((e.vidaActual / e.vidaMax) * 100);
                lanzarToast(e.nombre + ': ' + porcentaje + '%', '⚔️', 'estado');
            }
        } else if (!esInvulnerable() && e.cooldownAtaque <= 0) {
            // Colisión lateral: daño al jugador
            const dano = obtenerDanoEnemigo(e);
            const murio = recibirDano(dano, e.x + e.ancho / 2);
            e.cooldownAtaque = CFG.enemigos.cooldownAtaque;

            if (murio) {
                muerto = true;
            } else {
                lanzarToast('-' + dano + ' HP', '💔', 'dano');
            }
        }
    }
}

// --- Verificar caída al abismo ---

function verificarAbismo() {
    const jug = obtenerPosicion();
    const limiteY = 17 * CFG.tiles.tamano;

    if (jug.y > limiteY) {
        const murio = caerAlAbismo();
        if (murio) {
            muerto = true;
        } else {
            lanzarToast('-' + CFG.fisicas.danoAbismo + ' HP (abismo)', '🕳️', 'dano');
        }
    }
}

// --- Verificar victoria ---

function verificarVictoria() {
    if (esBossVivo()) return;

    if (detectarMetaTile()) {
        activo = false;
        jugador.inventario.push(CFG.meta.itemInventario);
        document.dispatchEvent(new Event('inventario-cambio'));
        lanzarToast('¡Llave obtenida! Escapando...', '🔑', 'exito');

        timeoutIds.push(
            setTimeout(function () {
                limpiarHabitacion4();
                callbackSalir();
            }, CFG.meta.timeoutExito)
        );
    }
}

// --- Game loop ---

function gameLoop() {
    if (!activo) return;

    // Actualizar
    actualizarJugador();
    actualizarEnemigos();

    // Colisiones
    if (!muerto) {
        verificarColisionesEnemigos();
        verificarAbismo();
        verificarVictoria();
    }

    // Cámara
    const jug = obtenerPosicion();
    actualizarCamara(jug.x);
    const camX = obtenerCamaraX();

    // Render
    renderizarFondo(ctx, anchoCanvas, altoCanvas);
    renderizarTiles(ctx, camX, anchoCanvas, altoCanvas, esBossVivo());
    renderizarEnemigos(ctx, camX);
    renderizarJugador(ctx, camX);

    renderizarHUD(ctx, anchoCanvas, esBossVivo());

    animacionId = requestAnimationFrame(gameLoop);
}

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        teclasRef[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarHabitacion4();
        callbackSalir();
    }
}

function onKeyUp(e) {
    delete teclasRef[e.key];
}

// --- API pública ---

export function iniciarHabitacion4(jugadorRef, callback, dpadRef) {
    jugador = jugadorRef;
    callbackSalir = callback;
    activo = true;
    muerto = false;
    teclasRef = {};

    // Resetear mapa (restaurar spawns)
    resetearMapa();

    // Obtener spawns
    const spawns = obtenerSpawns();

    // Crear pantalla
    crearPantalla(!!dpadRef);

    // Iniciar sistemas
    iniciarCamara(anchoCanvas);
    iniciarJugador(jugadorRef, teclasRef);
    iniciarEnemigos(spawns.enemigos, spawns.boss);

    // Toast de inicio
    lanzarToast('El Abismo: ¡Cuidado con las caídas!', '🌊', 'estado');

    // Mostrar toast del boss
    const bossActual = obtenerEnemigosVivos().find(function (e) {
        return e.esBoss;
    });
    if (bossActual) {
        timeoutIds.push(
            setTimeout(function () {
                if (activo) {
                    lanzarToast('¡' + bossActual.nombre + ' te espera!', '👹', 'dano');
                }
            }, 1500)
        );
    }

    // Controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // D-pad touch
    if (dpadRef) {
        dpadRef.setTeclasRef(teclasRef);
        dpadRef.mostrar();
    }

    // Iniciar loop
    animacionId = requestAnimationFrame(gameLoop);
}

export function limpiarHabitacion4() {
    activo = false;
    muerto = false;

    // Cancelar timeouts pendientes (toast boss, victoria)
    for (let i = 0; i < timeoutIds.length; i++) {
        clearTimeout(timeoutIds[i]);
    }
    timeoutIds = [];

    if (animacionId) {
        cancelAnimationFrame(animacionId);
        animacionId = null;
    }

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // Limpiar teclas sin reasignar referencia (compartida con jugadorPlat)
    Object.keys(teclasRef).forEach(function (k) {
        delete teclasRef[k];
    });

    limpiarEnemigos();

    if (pantalla && pantalla.parentNode) {
        pantalla.parentNode.removeChild(pantalla);
        pantalla = null;
    }

    canvas = null;
    ctx = null;
}
