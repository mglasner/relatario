// El Abismo — Platformer 2D
// Platformer 2D side-scrolling: saltar plataformas, evitar abismos,
// stomper esbirros, derrotar al boss y conseguir la llave

import { CFG } from './config.js';
import { est, resetearEstado, timeouts } from './estado.js';
import {
    obtenerSpawns,
    resetearMapa,
    obtenerFilas,
    obtenerColumnas,
    obtenerTile,
} from './nivel.js';
import {
    crearPantalla,
    actualizarHUDJugador,
    actualizarHUDInventario,
    actualizarHUDBoss,
    ocultarHUDBoss,
    reescalarCanvas,
    obtenerDPR,
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
    tipoAbismo,
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
    obtenerEscala,
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
    emitirChispaFuego,
    emitirDestellosCristal,
    emitirBurbujaPantano,
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
import { notificarVictoria } from '../../eventos.js';

import { crearGameLoop } from '../../utils.js';

const TAM = CFG.tiles.tamano;

// --- Crear DOM (delegado a domPlat.js) ---

function iniciarDOM(esTouch) {
    est.anchoCanvas = CFG.canvas.anchoBase;
    est.altoCanvas = CFG.canvas.altoBase;

    const dom = crearPantalla(esTouch, function () {
        const salir = est.callbackSalir;
        limpiarAbismo();
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
    const jugRect = { x: jug.x, y: jug.y, ancho: jug.ancho, alto: jug.alto };
    const pieJugador = jug.y + jug.alto;
    const pieAnterior = jug.yAnterior + jug.alto;

    for (let i = 0; i < vivos.length; i++) {
        const e = vivos[i];
        const eneRect = { x: e.x, y: e.y, ancho: e.ancho, alto: e.alto };

        if (!aabbColision(jugRect, eneRect)) continue;

        // Stomp: requiere 3 condiciones simultáneas:
        // 1. Cayendo con fuerza suficiente (vy >= stompVyMin ajustado por escala)
        // 2. Pies sobre la mitad superior del enemigo (margen proporcional al alto)
        // 3. En el frame anterior los pies no habían pasado la base del enemigo
        //    (valida que el jugador viene genuinamente "desde arriba")
        const mitadEnemigo = e.y + e.alto / 2;
        const margenStomp = e.alto * CFG.enemigos.stompMargenRatio;
        const escJug = obtenerEscala();
        const vyMin =
            CFG.enemigos.stompVyMinBase * (1 - CFG.enemigos.stompVyMinEscalaFactor * (1 - escJug));

        if (
            jug.vy >= vyMin &&
            pieJugador <= mitadEnemigo + margenStomp &&
            pieAnterior <= e.y + e.alto
        ) {
            const dano = est.jugador.ataques[0] ? est.jugador.ataques[0].dano : 10;
            const resultado = stomperEnemigo(e, dano);
            // Rebote para no caer dentro del enemigo (siempre, aunque esté protegido)
            aplicarStompRebote(est.teclasRef['ArrowUp']);
            // Feedback visual solo si el stomp conectó (no bloqueado por invulnerabilidad)
            if (!resultado.bloqueado) procesarStomp(e, resultado);
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
        actualizarHUDInventario(est.jugador.inventario);
        notificarVictoria();
        lanzarToast('\u00a1Desafío superado! Escapando...', '\u2728', 'exito');

        const salir = est.callbackSalir;
        timeouts.set(function () {
            limpiarAbismo();
            salir();
        }, CFG.meta.timeoutExito);
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

    // Particulas por variante de abismo (fuego, cristales, pantano)
    const filaSuelo = obtenerFilas() - 3;
    if (frameNum % 3 === 0) {
        const tipoAbis = CFG.tiles.tipos.ABISMO;
        for (let col = colInicio; col < colFin; col += 2) {
            if (obtenerTile(filaSuelo, col) !== tipoAbis) continue;
            const va = tipoAbismo(filaSuelo, col);
            const abX = col * TAM;
            const abY = filaSuelo * TAM;
            if (va === 'FUEGO') {
                emitirChispaFuego(abX, abY);
            } else if (va === 'CRISTALES') {
                emitirDestellosCristal(abX, abY);
            } else if (va === 'PANTANO') {
                emitirBurbujaPantano(abX, abY);
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

const gameLoop4 = crearGameLoop(function (_tiempo, _dt) {
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

    // Actualizar (solo si el jugador sigue vivo)
    if (!est.muerto) {
        actualizarJugador();
        actualizarEnemigos();
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

    // DPR base transform (coordenadas de juego → pixels de canvas)
    const dpr = obtenerDPR();
    est.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Aplicar shake vertical
    est.ctx.save();
    if (shakeY !== 0) {
        est.ctx.translate(0, shakeY);
    }

    // Fondo parallax (reemplaza fillRect solido)
    renderizarParallax(est.ctx, camX, tiempo);

    // Tiles con texturas
    renderizarTiles(est.ctx, camX, est.anchoCanvas, esBossVivo(), tiempo);

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
        renderizarIndicadorBoss(
            est.ctx,
            bossInfo.x,
            bossInfo.ancho,
            camX,
            est.anchoCanvas,
            est.altoCanvas,
            tiempo
        );
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
        limpiarAbismo();
        salir();
    }
}

function onKeyUp(e) {
    delete est.teclasRef[e.key];
}

// --- API publica ---

/**
 * Inicia El Abismo.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadArgumento] - Controles touch D-pad
 */
export function iniciarAbismo(jugadorRef, callback, dpadArgumento) {
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
    const bossActual = obtenerInfoBoss();
    if (bossActual) {
        timeouts.set(function () {
            if (est.activo) {
                lanzarToast('\u00a1' + bossActual.nombre + ' te espera!', '\ud83d\udc79', 'dano');
            }
        }, 1500);
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

/** Limpia y destruye El Abismo */
export function limpiarAbismo() {
    est.activo = false;

    // Cancelar todos los timeouts pendientes de una vez
    timeouts.limpiar();

    gameLoop4.detener();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    // Salir de pantalla completa y desactivar overlay
    if (est.modoInmersivo) {
        est.modoInmersivo.desactivar();
    }

    // Restaurar D-pad a modo centrado (default para otros juegos)
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
