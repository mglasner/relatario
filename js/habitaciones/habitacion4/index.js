// Habitacion 4 — El Abismo
// Platformer 2D side-scrolling: saltar plataformas, evitar abismos,
// stomper esbirros, derrotar al boss y conseguir la llave

import { CFG } from './config.js';
import { est, resetearEstado } from './estado.js';
import { obtenerSpawns, resetearMapa, obtenerFilas, obtenerColumnas } from './nivel.js';
import {
    crearPantalla,
    actualizarHUDJugador,
    actualizarHUDInventario,
    actualizarHUDBoss,
    ocultarHUDBoss,
    reescalarCanvas,
    limpiarDOM,
} from './domPlat.js';
import { crearModoInmersivo } from '../../componentes/modoInmersivo.js';
import {
    iniciarCamara,
    actualizarCamara,
    obtenerCamaraX,
    obtenerShakeY,
    estaCongelada,
    sacudir,
    congelar,
    flashBlanco,
    obtenerFlashAlpha,
} from './camara.js';
import {
    iniciarRenderer,
    renderizarTiles,
    renderizarVineta,
    renderizarFlash,
    renderizarIndicadorBoss,
    limpiarRenderer,
} from './renderer.js';
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
    acabaDeAterrizar,
    obtenerColor,
} from './jugadorPlat.js';
import {
    iniciarEnemigos,
    actualizarEnemigos,
    renderizarEnemigos,
    obtenerEnemigosVivos,
    stomperEnemigo,
    esBossVivo,
    obtenerDanoEnemigo,
    obtenerInfoBoss,
    limpiarEnemigos,
} from './enemigoPlat.js';
import { iniciarParallax, renderizarParallax, limpiarParallax } from './parallax.js';
import { iniciarTexturas, limpiarTexturas } from './texturasTiles.js';
import {
    emitirPolvoAterrizaje,
    emitirEstela,
    emitirStompExplosion,
    emitirMuerteEnemigo,
    emitirNieblaAbismo,
    emitirOjosAbismo,
    emitirAuraBoss,
    emitirBossFase,
    emitirEstelaBoss,
    actualizarParticulas,
    renderizarParticulas,
    obtenerFrameCount,
    limpiarParticulas,
} from './particulas.js';
import { iniciarSpritesJugador, iniciarSpritesEnemigos, limpiarSprites } from './spritesPlat.js';
import { lanzarToast } from '../../componentes/toast.js';
import { notificarInventarioCambio } from '../../eventos.js';
import { crearGameLoop } from '../../utils.js';

const TAM = CFG.tiles.tamano;

// --- Crear DOM (delegado a domPlat.js) ---

function iniciarDOM(esTouch) {
    est.anchoCanvas = CFG.canvas.anchoBase;
    est.altoCanvas = CFG.canvas.altoBase;

    const dom = crearPantalla(esTouch, function () {
        const salir = est.callbackSalir;
        limpiarHabitacion4();
        salir();
    });

    est.pantalla = dom.pantalla;
    est.ctx = dom.ctx;
}

// --- Colisiones jugador-enemigo ---

function procesarStomp(e, resultado) {
    const colorJug = obtenerColor();
    const r = parseInt(colorJug.slice(1, 3), 16);
    const g = parseInt(colorJug.slice(3, 5), 16);
    const b = parseInt(colorJug.slice(5, 7), 16);
    const cx = e.x + e.ancho / 2;
    const cy = e.y + e.alto / 2;

    if (resultado.bossDestruido) {
        lanzarToast('\u00a1' + e.nombre + ' derrotado!', '\u2b50', 'exito');
        emitirMuerteEnemigo(cx, cy, 187, 134, 252);
        sacudir(8);
        congelar(12);
        flashBlanco(0.6);
    } else if (!e.esBoss && !e.vivo) {
        lanzarToast(e.nombre + ' eliminado', '\ud83d\udca5', 'dano');
        emitirStompExplosion(cx, cy, r, g, b);
        emitirMuerteEnemigo(cx, cy, 233, 69, 96);
        sacudir(2);
        flashBlanco(0.2);
    } else if (e.esBoss) {
        const porcentaje = Math.round((e.vidaActual / e.vidaMax) * 100);
        lanzarToast(e.nombre + ': ' + porcentaje + '%', '\u2694\ufe0f', 'estado');
        emitirStompExplosion(cx, cy, r, g, b);
        sacudir(3);
        flashBlanco(0.15);

        if (resultado.cambioFase) {
            emitirBossFase(e.x, e.y, e.ancho, e.alto);
            sacudir(5);
        }
    }
}

function verificarColisionesEnemigos() {
    const jug = obtenerPosicion();
    const vivos = obtenerEnemigosVivos();

    for (let i = 0; i < vivos.length; i++) {
        const e = vivos[i];

        const jugRect = { x: jug.x, y: jug.y, ancho: jug.ancho, alto: jug.alto };
        const eneRect = { x: e.x, y: e.y, ancho: e.ancho, alto: e.alto };

        if (!aabbColision(jugRect, eneRect)) continue;

        // Stomp: pie del jugador sobre mitad superior del enemigo + cayendo con fuerza
        // Se exige vy minima porque con escalado proporcional un personaje alto
        // (ej: PandaJuro 1.70m) tiene los pies a la altura de la mitad de un
        // enemigo bajo (ej: Trasgo 0.60m) estando en el mismo suelo, y la
        // gravedad residual del frame (vy > 0) gatillaba stomp al caminar.
        const pieJugador = jug.y + jug.alto;
        const mitadEnemigo = e.y + e.alto / 2;

        if (
            jug.vy >= CFG.enemigos.stompVyMin &&
            pieJugador <= mitadEnemigo + CFG.enemigos.stompMargen
        ) {
            const dano = est.jugador.ataques[0] ? est.jugador.ataques[0].dano : 10;
            const resultado = stomperEnemigo(e, dano);
            aplicarStompRebote();
            procesarStomp(e, resultado);
        } else if (!esInvulnerable() && e.cooldownAtaque <= 0) {
            // Colision lateral: dano al jugador
            const dano = obtenerDanoEnemigo(e);
            const murio = recibirDano(dano, e.x + e.ancho / 2);
            e.cooldownAtaque = CFG.enemigos.cooldownAtaque;

            sacudir(4);

            if (murio) {
                est.muerto = true;
            } else {
                lanzarToast('-' + dano + ' HP', '\ud83d\udc94', 'dano');
            }
        }
    }
}

// --- Verificar caida al abismo ---

function verificarAbismo() {
    const jug = obtenerPosicion();
    // Muerte instantanea al caer al fuego (pies pasan la zona de suelo)
    const limiteAbismo = (obtenerFilas() - 2) * TAM;
    if (jug.y + jug.alto >= limiteAbismo) {
        caerAlAbismo();
        sacudir(8);
        est.muerto = true;
    }
}

// --- Verificar victoria ---

function verificarVictoria() {
    if (esBossVivo()) return;

    if (detectarMetaTile()) {
        est.activo = false;
        if (!est.jugador.inventario.includes(CFG.meta.itemInventario)) {
            est.jugador.inventario.push(CFG.meta.itemInventario);
            notificarInventarioCambio();
        }
        actualizarHUDInventario(est.jugador.inventario);
        lanzarToast(
            '\u00a1Llave obtenida! Escapando...',
            '<img src="assets/img/llaves/llave-abismo.webp" alt="Llave" class="toast-llave-img">',
            'exito'
        );

        const salir = est.callbackSalir;
        est.timeoutIds.push(
            setTimeout(function () {
                limpiarHabitacion4();
                salir();
            }, CFG.meta.timeoutExito)
        );
    }
}

// --- Emision de particulas ambientales ---

function emitirParticulasAmbientales(camaraX) {
    const frameNum = obtenerFrameCount();
    const cols = obtenerColumnas();
    const colInicio = Math.max(1, Math.floor(camaraX / TAM));
    const colFin = Math.min(cols - 1, Math.ceil((camaraX + est.anchoCanvas) / TAM));

    // Niebla del abismo: cada 5 frames, emitir a lo largo del subsuelo
    if (frameNum % 5 === 0 && est.filaNiebla >= 0) {
        for (let col = colInicio; col < colFin; col += 3) {
            emitirNieblaAbismo(col * TAM, est.filaNiebla * TAM);
        }
    }

    // Ojos en la oscuridad: cada ~120 frames
    if (frameNum % 120 === 0 && est.filaOjos >= 0) {
        for (let col = colInicio; col < colFin; col += 5) {
            if (Math.random() < 0.3) {
                emitirOjosAbismo(col * TAM, est.filaOjos * TAM);
                break;
            }
        }
    }

    // Particulas del boss
    const bossInfo = obtenerInfoBoss();
    if (bossInfo) {
        // Aura del boss
        emitirAuraBoss(bossInfo.x, bossInfo.y, bossInfo.ancho, bossInfo.alto);

        // Estela del boss en fase critica (< 33% HP)
        if (bossInfo.vidaActual / bossInfo.vidaMax <= 0.33 && frameNum % 2 === 0) {
            emitirEstelaBoss(bossInfo.x, bossInfo.y, bossInfo.ancho, bossInfo.alto);
        }
    }
}

// --- Emision de particulas del jugador ---

function emitirParticulasJugador() {
    const jug = obtenerPosicion();

    // Polvo al aterrizar
    if (acabaDeAterrizar()) {
        emitirPolvoAterrizaje(jug.x + jug.ancho / 2, jug.y + jug.alto);
    }

    // Estela al correr
    if (jug.estaEnSuelo && Math.abs(jug.vx) > 1) {
        const cx = jug.direccion > 0 ? jug.x : jug.x + jug.ancho;
        emitirEstela(cx, jug.y + jug.alto, jug.direccion);
    }
}

// --- Game loop ---

const gameLoop4 = crearGameLoop(function () {
    if (!est.activo) {
        gameLoop4.detener();
        return;
    }

    // Freeze frame: solo renderizar, no actualizar
    if (estaCongelada()) {
        actualizarCamara(obtenerPosicion().x);
        renderFrame();
        return;
    }

    // Actualizar
    actualizarJugador();
    actualizarEnemigos();

    // Colisiones
    if (!est.muerto) {
        verificarColisionesEnemigos();
        verificarAbismo();
        verificarVictoria();
    }

    // Camara
    const jug = obtenerPosicion();
    actualizarCamara(jug.x);

    // Particulas
    emitirParticulasJugador();
    const camX = obtenerCamaraX();
    emitirParticulasAmbientales(camX);
    actualizarParticulas();

    // Render
    renderFrame();
});

function renderFrame() {
    const camX = obtenerCamaraX();
    const shakeY = obtenerShakeY();
    const tiempo = Date.now();

    // Aplicar shake vertical
    est.ctx.save();
    if (shakeY !== 0) {
        est.ctx.translate(0, shakeY);
    }

    // Fondo parallax (reemplaza fillRect solido)
    renderizarParallax(est.ctx, camX, tiempo);

    // Tiles con texturas
    renderizarTiles(est.ctx, camX, est.anchoCanvas, est.altoCanvas, esBossVivo(), tiempo);

    // Particulas detras de personajes (niebla, aura)
    renderizarParticulas(est.ctx, camX, est.anchoCanvas);

    // Enemigos y jugador
    renderizarEnemigos(est.ctx, camX);
    renderizarJugador(est.ctx, camX);

    // Vineta
    renderizarVineta(est.ctx);

    // Flash blanco
    renderizarFlash(est.ctx, est.anchoCanvas, est.altoCanvas, obtenerFlashAlpha());

    est.ctx.restore();

    // HUD jugador via overlay HTML (vida del jugador)
    actualizarHUDJugador(est.jugador.vidaActual, est.jugador.vidaMax);

    // HUD boss via overlay HTML (texto nitido a resolucion nativa)
    const bossInfo = obtenerInfoBoss();
    if (esBossVivo() && bossInfo) {
        actualizarHUDBoss(bossInfo.nombre, bossInfo.vidaActual / bossInfo.vidaMax);
        renderizarIndicadorBoss(est.ctx, bossInfo.x, bossInfo.ancho, camX, est.anchoCanvas, tiempo);
    } else {
        ocultarHUDBoss();
    }
}

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        est.teclasRef[e.key] = true;
    }
    if (e.key === 'Escape') {
        const salir = est.callbackSalir;
        limpiarHabitacion4();
        salir();
    }
}

function onKeyUp(e) {
    delete est.teclasRef[e.key];
}

// --- API publica ---

/**
 * Inicia la Habitacion 4 (El Abismo).
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al pasillo
 * @param {Object} [dpadArgumento] - Controles touch D-pad
 */
export function iniciarHabitacion4(jugadorRef, callback, dpadArgumento) {
    est.jugador = jugadorRef;
    est.callbackSalir = callback;
    est.activo = true;
    est.muerto = false;

    // Resetear mapa (restaurar spawns)
    resetearMapa();

    // Obtener spawns
    const spawns = obtenerSpawns();

    // Filas del subsuelo para particulas (las 2 ultimas filas interiores)
    const totalFilas = obtenerFilas();
    est.filaNiebla = totalFilas - 2;
    est.filaOjos = totalFilas - 1;

    // Crear pantalla
    est.modoInmersivo = crearModoInmersivo(reescalarCanvas);
    iniciarDOM(est.modoInmersivo.esMobile);

    // Mostrar llaves ya recolectadas en el HUD
    actualizarHUDInventario(est.jugador.inventario);

    // Iniciar sistemas visuales
    iniciarParallax();
    iniciarTexturas();
    iniciarRenderer(est.anchoCanvas, est.altoCanvas);
    iniciarSpritesJugador(jugadorRef.nombre, jugadorRef.colorHud || '#bb86fc');
    iniciarSpritesEnemigos();

    // Iniciar sistemas de juego
    iniciarCamara(est.anchoCanvas);
    iniciarJugador(jugadorRef, est.teclasRef);
    iniciarEnemigos(spawns.enemigos, spawns.boss);

    // Toast de inicio
    lanzarToast('El Abismo: \u00a1Cuidado con las ca\u00eddas!', '\ud83c\udf0a', 'estado');

    // Mostrar toast del boss
    const bossActual = obtenerEnemigosVivos().find(function (e) {
        return e.esBoss;
    });
    if (bossActual) {
        est.timeoutIds.push(
            setTimeout(function () {
                if (est.activo) {
                    lanzarToast(
                        '\u00a1' + bossActual.nombre + ' te espera!',
                        '\ud83d\udc79',
                        'dano'
                    );
                }
            }, 1500)
        );
    }

    // Controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // D-pad touch: modo dividido para platformer
    est.dpadRef = dpadArgumento;
    if (est.dpadRef) {
        est.dpadRef.setTeclasRef(est.teclasRef);
        est.dpadRef.setModoDividido();
        est.dpadRef.mostrar();
    }

    // Overlay de rotación y pantalla completa (solo mobile)
    est.modoInmersivo.activar();

    // Iniciar loop
    gameLoop4.iniciar();
}

/** Limpia y destruye la Habitacion 4 */
export function limpiarHabitacion4() {
    est.activo = false;

    // Cancelar timeouts pendientes (toast boss, victoria)
    for (let i = 0; i < est.timeoutIds.length; i++) {
        clearTimeout(est.timeoutIds[i]);
    }

    gameLoop4.detener();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // Salir de pantalla completa y desactivar overlay
    if (est.modoInmersivo) {
        est.modoInmersivo.desactivar();
    }

    // Restaurar D-pad a modo centrado para el pasillo
    if (est.dpadRef) {
        est.dpadRef.setModoCentrado();
    }

    limpiarEnemigos();
    limpiarParticulas();
    limpiarParallax();
    limpiarTexturas();
    limpiarSprites();
    limpiarRenderer();
    limpiarDOM();

    if (est.pantalla) {
        est.pantalla.remove();
    }

    // Restaurar modo normal del contenedor
    const juegoEl = document.getElementById('juego');
    if (juegoEl) juegoEl.classList.remove('juego-inmersivo');

    resetearEstado();
}
