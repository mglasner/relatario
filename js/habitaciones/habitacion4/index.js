// Habitacion 4 — El Abismo
// Platformer 2D side-scrolling: saltar plataformas, evitar abismos,
// stomper esbirros, derrotar al boss y conseguir la llave

import { CFG } from './config.js';
import {
    obtenerSpawns,
    resetearMapa,
    obtenerTile,
    obtenerFilas,
    obtenerColumnas,
} from './nivel.js';
import { crearPantalla, actualizarHUDBoss, ocultarHUDBoss, limpiarDOM } from './domPlat.js';
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

// --- Estado del modulo ---

let pantalla = null;
let ctx = null;
let animacionId = null;
let activo = false;
let callbackSalir = null;
let jugador = null;
let teclasRef = {};
let anchoCanvas = CFG.canvas.anchoBase;
let altoCanvas = CFG.canvas.altoBase;
let muerto = false;
let timeoutIds = [];

// Filas de abismo precomputadas para emision de particulas
let filaNiebla = -1;
let filaOjos = -1;

const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;

// --- Crear DOM (delegado a domPlat.js) ---

function iniciarDOM(esTouch) {
    anchoCanvas = CFG.canvas.anchoBase;
    altoCanvas = CFG.canvas.altoBase;

    const dom = crearPantalla(esTouch, function () {
        limpiarHabitacion4();
        callbackSalir();
    });

    pantalla = dom.pantalla;
    ctx = dom.ctx;
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

        // Stomp: pie del jugador sobre mitad superior del enemigo + cayendo
        const pieJugador = jug.y + jug.alto;
        const mitadEnemigo = e.y + e.alto / 2;

        if (jug.vy > 0 && pieJugador <= mitadEnemigo + CFG.enemigos.stompMargen) {
            const dano = jugador.ataques[0] ? jugador.ataques[0].dano : 10;
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
                muerto = true;
            } else {
                lanzarToast('-' + dano + ' HP', '\ud83d\udc94', 'dano');
            }
        }
    }
}

// --- Verificar caida al abismo ---

function verificarAbismo() {
    const jug = obtenerPosicion();
    const limiteY = obtenerFilas() * CFG.tiles.tamano;

    if (jug.y > limiteY) {
        const murio = caerAlAbismo();
        sacudir(6);
        if (murio) {
            muerto = true;
        } else {
            lanzarToast(
                '-' + CFG.fisicas.danoAbismo + ' HP (abismo)',
                '\ud83d\udd73\ufe0f',
                'dano'
            );
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
        lanzarToast('\u00a1Llave obtenida! Escapando...', '\ud83d\udd11', 'exito');

        timeoutIds.push(
            setTimeout(function () {
                limpiarHabitacion4();
                callbackSalir();
            }, CFG.meta.timeoutExito)
        );
    }
}

// --- Emision de particulas ambientales ---

function emitirParticulasAmbientales(camaraX) {
    const frameNum = obtenerFrameCount();
    const cols = obtenerColumnas();

    // Niebla del abismo: cada 5 frames, emitir en tiles visibles tipo ABISMO
    if (frameNum % 5 === 0 && filaNiebla >= 0) {
        const colInicio = Math.max(0, Math.floor(camaraX / TAM));
        const colFin = Math.min(cols, Math.ceil((camaraX + anchoCanvas) / TAM));

        for (let col = colInicio; col < colFin; col += 3) {
            if (obtenerTile(filaNiebla, col) === T.ABISMO) {
                emitirNieblaAbismo(col * TAM, filaNiebla * TAM);
            }
        }
    }

    // Ojos en la oscuridad: cada ~120 frames
    if (frameNum % 120 === 0 && filaOjos >= 0) {
        const colInicio = Math.max(0, Math.floor(camaraX / TAM));
        const colFin = Math.min(cols, Math.ceil((camaraX + anchoCanvas) / TAM));
        for (let col = colInicio; col < colFin; col += 5) {
            if (obtenerTile(filaOjos, col) === T.ABISMO && Math.random() < 0.3) {
                emitirOjosAbismo(col * TAM, filaOjos * TAM);
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

function gameLoop() {
    if (!activo) return;

    // Freeze frame: solo renderizar, no actualizar
    if (estaCongelada()) {
        actualizarCamara(obtenerPosicion().x);
        renderFrame();
        animacionId = requestAnimationFrame(gameLoop);
        return;
    }

    // Actualizar
    actualizarJugador();
    actualizarEnemigos();

    // Colisiones
    if (!muerto) {
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

    animacionId = requestAnimationFrame(gameLoop);
}

function renderFrame() {
    const camX = obtenerCamaraX();
    const shakeY = obtenerShakeY();
    const tiempo = Date.now();

    // Aplicar shake vertical
    ctx.save();
    if (shakeY !== 0) {
        ctx.translate(0, shakeY);
    }

    // Fondo parallax (reemplaza fillRect solido)
    renderizarParallax(ctx, camX, tiempo);

    // Tiles con texturas
    renderizarTiles(ctx, camX, anchoCanvas, altoCanvas, esBossVivo(), tiempo);

    // Particulas detras de personajes (niebla, aura)
    renderizarParticulas(ctx, camX, anchoCanvas);

    // Enemigos y jugador
    renderizarEnemigos(ctx, camX);
    renderizarJugador(ctx, camX);

    // Vineta
    renderizarVineta(ctx);

    // Flash blanco
    renderizarFlash(ctx, anchoCanvas, altoCanvas, obtenerFlashAlpha());

    ctx.restore();

    // HUD boss via overlay HTML (texto nitido a resolucion nativa)
    const bossInfo = obtenerInfoBoss();
    if (esBossVivo() && bossInfo) {
        actualizarHUDBoss(bossInfo.nombre, bossInfo.vidaActual / bossInfo.vidaMax);
        renderizarIndicadorBoss(ctx, bossInfo.x, camX, anchoCanvas, tiempo);
    } else {
        ocultarHUDBoss();
    }
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

// --- API publica ---

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

    // Precomputar filas de abismo para particulas
    filaNiebla = -1;
    filaOjos = -1;
    const totalFilas = obtenerFilas();
    for (let fila = 0; fila < totalFilas; fila++) {
        let tieneAbismo = false;
        for (let col = 0; col < obtenerColumnas(); col++) {
            if (obtenerTile(fila, col) === T.ABISMO) {
                tieneAbismo = true;
                break;
            }
        }
        if (tieneAbismo) {
            if (filaNiebla < 0) filaNiebla = fila;
            else if (filaOjos < 0) {
                filaOjos = fila;
                break;
            }
        }
    }

    // Crear pantalla
    iniciarDOM(!!dpadRef);

    // Iniciar sistemas visuales
    iniciarParallax();
    iniciarTexturas();
    iniciarRenderer(anchoCanvas, altoCanvas);
    iniciarSpritesJugador(jugadorRef.colorHud || '#bb86fc');
    iniciarSpritesEnemigos();

    // Iniciar sistemas de juego
    iniciarCamara(anchoCanvas);
    iniciarJugador(jugadorRef, teclasRef);
    iniciarEnemigos(spawns.enemigos, spawns.boss);

    // Toast de inicio
    lanzarToast('El Abismo: \u00a1Cuidado con las ca\u00eddas!', '\ud83c\udf0a', 'estado');

    // Mostrar toast del boss
    const bossActual = obtenerEnemigosVivos().find(function (e) {
        return e.esBoss;
    });
    if (bossActual) {
        timeoutIds.push(
            setTimeout(function () {
                if (activo) {
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
    limpiarParticulas();
    limpiarParallax();
    limpiarTexturas();
    limpiarSprites();
    limpiarRenderer();
    limpiarDOM();
    filaNiebla = -1;
    filaOjos = -1;

    if (pantalla && pantalla.parentNode) {
        pantalla.parentNode.removeChild(pantalla);
        pantalla = null;
    }

    // Restaurar modo normal del contenedor
    const juegoEl = document.getElementById('juego');
    if (juegoEl) juegoEl.classList.remove('juego-inmersivo');

    ctx = null;
}
