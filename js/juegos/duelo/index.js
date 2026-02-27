// El Duelo — Juego de peleas 1v1
// Héroe vs villano en combate en tiempo real con bloqueo y esquiva

import { CFG } from './config.js';
import { est, resetearEstado, timeouts } from './estado.js';
import {
    crearPantalla,
    actualizarHUDVida,
    actualizarHUDNombres,
    actualizarHUDTimer,
    reescalarCanvas,
    obtenerDPR,
    obtenerBotonesAtaque,
    limpiarDOM,
} from './domDuelo.js';
import { crearModoLandscape } from '../../componentes/modoLandscape.js';
import { crearGameLoop } from '../../utils.js';
import { notificarVictoria, notificarJugadorMuerto } from '../../eventos.js';
import { crearLuchador, actualizarLuchador, aplicarGravedad } from './luchador.js';
import { renderizarEscena, reiniciarClimaRenderer } from './renderer.js';
import { procesarAtaque, verificarColisiones } from './combate.js';
import { actualizarIA, resetearIA } from './ia.js';
import {
    emitirAura,
    emitirClima,
    emitirImpacto,
    emitirBloqueo,
    emitirKO,
    emitirParry,
    emitirGuardiaRota,
    emitirProyectil,
    actualizarParticulas,
    actualizarProyectiles,
    renderizarParticulas,
    renderizarProyectiles,
    reiniciarClimaParticulas,
    limpiarParticulas,
} from './particulas.js';
import { cargarSpritesLuchador, limpiarSprites } from './spritesDuelo.js';
import { inicializarGradas, actualizarGradas, limpiarGradas } from './gradas.js';
import { sortearEstacion, ESTACIONES } from '../clima.js';
import { lanzarToast } from '../../componentes/toast.js';

const ANCHO = CFG.canvas.anchoBase;
const ALTO = CFG.canvas.altoBase;
const MEC = CFG.mecanicas;

let gameLoop = null;
let timerInterval = null;
let listenerResize = null;
let listenerKeydown = null;
let listenerKeyup = null;
let listenerTouchStart = null;
let listenerTouchEnd = null;

// --- Crear luchadores desde datos del personaje/enemigo ---

function crearLuchadores(jugador, opciones) {
    const oponente = opciones.oponente;
    const jugadorEsVillano = !!opciones.jugadorEsVillano;

    // Luchador 1 (humano) — a la izquierda
    const l1 = crearLuchador({
        nombre: jugador.nombre,
        vidaMax: jugador.vidaMax,
        ataques: jugador.ataques,
        velocidad: jugador.velocidad,
        estatura: jugador.estatura,
        img: jugador.img,
        colorHud: jugador.colorHud || '#5eeadb',
        esVillano: jugadorEsVillano,
        direccion: 1,
        x: ANCHO / 2 - CFG.arena.separacionInicial / 2,
    });

    // Luchador 2 (IA) — a la derecha
    const l2 = crearLuchador({
        nombre: oponente.nombre,
        vidaMax: oponente.vidaMax,
        ataques: oponente.ataques,
        velocidad: oponente.velocidad,
        estatura: oponente.estatura,
        img: oponente.img,
        colorHud: oponente.colorHud || '#e94560',
        esVillano: !jugadorEsVillano,
        tier: oponente.tier || 'elite',
        direccion: -1,
        x: ANCHO / 2 + CFG.arena.separacionInicial / 2,
    });

    est.luchador1 = l1;
    est.luchador2 = l2;
}

// --- Input del jugador ---

function procesarInput(l, _dt) {
    if (est.fase !== 'pelea') return;

    const teclas = est.teclasRef;
    const rival = est.luchador2;

    // Movimiento horizontal
    l.vx = 0;
    if (teclas.ArrowLeft) {
        l.vx = -l.vel;
    } else if (teclas.ArrowRight) {
        l.vx = l.vel;
    }

    // Saltar
    if (teclas.ArrowUp && l.enSuelo) {
        l.vy = CFG.fisicas.fuerzaSalto;
        l.enSuelo = false;
    }

    // Agacharse
    l.agachado = !!teclas.ArrowDown && l.enSuelo;

    // Bloqueo: mantener dirección opuesta al rival (no puede si guardia rota)
    const rivalAlaDerecha = rival.x > l.x;
    const estabaBloqueando = l.bloqueando;
    l.bloqueando =
        l.enSuelo &&
        l.estado !== 'atacando' &&
        !l.guardiaRota &&
        ((rivalAlaDerecha && teclas.ArrowLeft) || (!rivalAlaDerecha && teclas.ArrowRight));

    // Parry window: al empezar a bloquear
    if (l.bloqueando && !estabaBloqueando) {
        l.parryVentana = MEC.parryVentana;
    }

    // Ataques
    if (teclas.a && l.cooldownAtaque <= 0 && l.estado !== 'atacando' && l.estado !== 'golpeado') {
        l.ataqueAereo = !l.enSuelo;
        procesarAtaque(l, rival, 'rapido');
        if (l.ataqueAereo) l.cooldownAtaque = MEC.aereoCooldown;
        teclas.a = false;
    }
    if (teclas.s && l.cooldownAtaque <= 0 && l.estado !== 'atacando' && l.estado !== 'golpeado') {
        l.ataqueAereo = !l.enSuelo;
        procesarAtaque(l, rival, 'fuerte');
        if (l.ataqueAereo) l.cooldownAtaque = MEC.aereoCooldown;
        teclas.s = false;
    }
}

// --- Fases del juego ---

function iniciarFaseCountdown() {
    est.fase = 'countdown';
    est.faseTimer = CFG.pantallas.countdownSegundos * 60;
}

function iniciarFasePelea() {
    est.fase = 'pelea';
    est.tiempoRestante = CFG.combate.tiempoRonda;
    // Timer de cuenta regresiva (1 segundo real)
    timerInterval = setInterval(function () {
        if (est.fase !== 'pelea' || !est.activo) return;
        est.tiempoRestante--;
        actualizarHUDTimer(est.tiempoRestante);
        if (est.tiempoRestante <= 0) {
            finalizarPelea('tiempo');
        }
    }, 1000);
}

function iniciarFaseResultado(motivo) {
    est.fase = 'resultado';
    est.faseTimer = CFG.pantallas.resultadoSegundos * 60;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // Determinar ganador
    const l1 = est.luchador1;
    const l2 = est.luchador2;
    if (motivo === 'ko-jugador') {
        est.ganador = 'enemigo';
    } else if (motivo === 'ko-enemigo') {
        est.ganador = 'jugador';
        notificarVictoria();
    } else {
        // Tiempo agotado: gana quien tiene más vida
        if (l1.vidaActual > l2.vidaActual) {
            est.ganador = 'jugador';
            notificarVictoria();
        } else if (l2.vidaActual > l1.vidaActual) {
            est.ganador = 'enemigo';
        } else {
            est.ganador = 'empate';
        }
    }

    // Derrota/empate: mostrar modal estándar tras breve pausa
    if (est.ganador !== 'jugador') {
        timeouts.set(function () {
            notificarJugadorMuerto();
        }, CFG.meta.timeoutExito);
    }
}

function finalizarPelea(motivo) {
    if (est.fase === 'resultado') return;
    iniciarFaseResultado(motivo);
}

// --- Game loop principal ---

function actualizar(_tiempo, dt) {
    if (!est.activo) return;

    const l1 = est.luchador1;
    const l2 = est.luchador2;

    if (est.fase === 'countdown') {
        est.faseTimer -= dt;
        if (est.faseTimer <= 0) iniciarFasePelea();
    } else if (est.fase === 'pelea') {
        // Input humano
        procesarInput(l1, dt);

        // IA
        actualizarIA(l2, l1, dt);

        // Física
        aplicarGravedad(l1, dt);
        aplicarGravedad(l2, dt);
        actualizarLuchador(l1, dt);
        actualizarLuchador(l2, dt);

        // Partículas de aura orbitando luchadores
        emitirAura(l1);
        emitirAura(l2);

        // Partículas de clima
        if (est.estacion) emitirClima(est.estacion, ANCHO);

        // Emitir proyectiles al iniciar ataque a distancia
        if (l1.estado === 'atacando' && l1.esProyectil && !l1.proyectilEmitido) {
            emitirProyectil(l1, l2);
            l1.proyectilEmitido = true;
        }
        if (l2.estado === 'atacando' && l2.esProyectil && !l2.proyectilEmitido) {
            emitirProyectil(l2, l1);
            l2.proyectilEmitido = true;
        }

        // Colisiones ataque → daño
        const resultado = verificarColisiones(l1, l2);
        if (resultado) {
            if (resultado.tipo === 'parry') {
                emitirParry(resultado.x, resultado.y);
                est.flashAlpha = 0.3;
                lanzarToast('¡Parada!', '⚔️', 'exito');
            } else if (resultado.tipo === 'guardiaRota') {
                emitirGuardiaRota(resultado.x, resultado.y, resultado.r, resultado.g, resultado.b);
                est.flashAlpha = 0.35;
                lanzarToast('¡Guardia rota!', '💥', 'dano');
            } else if (resultado.tipo === 'impacto') {
                emitirImpacto(resultado.x, resultado.y, resultado.r, resultado.g, resultado.b);
                est.flashAlpha = resultado.fuerte ? 0.4 : 0.25;
                if (resultado.aereo) {
                    lanzarToast('¡Ataque aéreo!', '🦅', 'exito');
                }
                // Toast de combo
                if (resultado.atacante.comboCount >= 3) {
                    lanzarToast('¡Combo x' + resultado.atacante.comboCount + '!', '🔥', 'exito');
                }
            } else if (resultado.tipo === 'bloqueo') {
                emitirBloqueo(resultado.x, resultado.y);
            }
        }

        // Orientar luchadores: siempre encaran al rival (estilo juego de pelea)
        l1.direccion = l2.x > l1.x ? 1 : -1;
        l2.direccion = l1.x > l2.x ? 1 : -1;

        // HUD
        actualizarHUDVida(l1.vidaActual, l1.vidaMax, l2.vidaActual, l2.vidaMax);

        // Verificar KO
        if (l1.vidaActual <= 0) {
            emitirKO(l1.x, l1.y + l1.alto / 2);
            est.flashAlpha = 0.6;
            finalizarPelea('ko-jugador');
        } else if (l2.vidaActual <= 0) {
            emitirKO(l2.x, l2.y + l2.alto / 2);
            est.flashAlpha = 0.6;
            finalizarPelea('ko-enemigo');
        }
    } else if (est.fase === 'resultado') {
        est.faseTimer -= dt;
        // Solo auto-salir en victoria; en derrota el modalDerrota maneja la salida
        if (est.faseTimer <= 0 && est.ganador === 'jugador') {
            const salir = est.callbackSalir;
            limpiarDuelo();
            if (salir) salir();
            return;
        }
    }

    // Decay del flash
    est.flashAlpha *= 0.88;

    // Gradas (espectadores animados)
    actualizarGradas(est);

    // Partículas y proyectiles (siempre)
    actualizarParticulas(dt);
    actualizarProyectiles(dt);

    // Renderizado
    const ctx = est.ctx;
    const dpr = obtenerDPR();
    ctx.save();
    ctx.scale(dpr, dpr);
    renderizarEscena(ctx, ANCHO, ALTO, est);
    renderizarProyectiles(ctx);
    renderizarParticulas(ctx);
    ctx.restore();
}

// --- Controles del teclado ---

function onKeydown(e) {
    if (e.key === 'Escape') return; // manejado por modalSalir en juego.js
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault();
        est.teclasRef[key] = true;
    }
    if (key === 'a' || key === 'A' || key === 'z' || key === 'Z') {
        est.teclasRef.a = true;
    }
    if (key === 's' || key === 'S' || key === 'x' || key === 'X') {
        est.teclasRef.s = true;
    }
}

function onKeyup(e) {
    const key = e.key;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
        est.teclasRef[key] = false;
    }
    if (key === 'a' || key === 'A' || key === 'z' || key === 'Z') {
        est.teclasRef.a = false;
    }
    if (key === 's' || key === 'S' || key === 'x' || key === 'X') {
        est.teclasRef.s = false;
    }
}

// --- Controles touch (botones de ataque) ---

function configurarTouchAtaque() {
    const btns = obtenerBotonesAtaque();
    if (!btns) return;

    listenerTouchStart = function (e) {
        const btn = e.target.closest('.duelo-btn-ataque');
        if (!btn) return;
        e.preventDefault();
        if (btn.dataset.ataque === 'rapido') est.teclasRef.a = true;
        if (btn.dataset.ataque === 'fuerte') est.teclasRef.s = true;
    };

    listenerTouchEnd = function (e) {
        const btn = e.target.closest('.duelo-btn-ataque');
        if (!btn) return;
        if (btn.dataset.ataque === 'rapido') est.teclasRef.a = false;
        if (btn.dataset.ataque === 'fuerte') est.teclasRef.s = false;
    };

    btns.addEventListener('touchstart', listenerTouchStart, { passive: false });
    btns.addEventListener('touchend', listenerTouchEnd);
}

// --- API pública ---

/**
 * Inicia el juego El Duelo
 * @param {Personaje|Enemigo} jugador — entidad controlada por el humano
 * @param {Function} onSalir — callback para volver al Libro de Juegos
 * @param {Object} dpad — controles touch
 * @param {Object} opciones — { oponente, jugadorEsVillano, dificultad }
 */
export function iniciarDuelo(jugador, onSalir, dpad, opciones) {
    resetearEstado();
    est.callbackSalir = onSalir;
    est.dpadRef = dpad;

    const esTouch = 'ontouchstart' in window;

    // DOM
    const dom = crearPantalla(esTouch, function () {
        const salir = est.callbackSalir;
        limpiarDuelo();
        salir();
    });
    est.pantalla = dom.pantalla;
    est.ctx = dom.ctx;

    if (!est.ctx) return;

    // D-pad (modo dividido: izq movimiento, der salto/agacharse)
    est.dpadRef = dpad;
    if (est.dpadRef) {
        est.dpadRef.setTeclasRef(est.teclasRef);
        est.dpadRef.setModoDividido();
        est.dpadRef.mostrar();
    }

    // Overlay de rotación y pantalla completa (solo mobile)
    est.modoLandscape = crearModoLandscape(function () {
        reescalarCanvas();
    });
    est.modoLandscape.activar();

    // Crear luchadores, resetear IA y sortear clima
    resetearIA();
    est.estacion = sortearEstacion();
    reiniciarClimaParticulas();
    reiniciarClimaRenderer();
    crearLuchadores(jugador, opciones || {});
    inicializarGradas(
        est.luchador1.nombre,
        est.luchador1.esVillano,
        est.luchador2.nombre,
        est.luchador2.esVillano
    );

    // Cargar sprites
    cargarSpritesLuchador(est.luchador1);
    cargarSpritesLuchador(est.luchador2);

    // HUD
    actualizarHUDNombres(est.luchador1.nombre, est.luchador2.nombre);
    actualizarHUDVida(
        est.luchador1.vidaActual,
        est.luchador1.vidaMax,
        est.luchador2.vidaActual,
        est.luchador2.vidaMax
    );
    actualizarHUDTimer(CFG.combate.tiempoRonda);

    // Controles teclado
    listenerKeydown = onKeydown;
    listenerKeyup = onKeyup;
    document.addEventListener('keydown', listenerKeydown);
    document.addEventListener('keyup', listenerKeyup);

    // Controles touch
    configurarTouchAtaque();

    // Resize
    listenerResize = reescalarCanvas;
    window.addEventListener('resize', listenerResize);

    // Iniciar countdown directo
    est.activo = true;
    iniciarFaseCountdown();

    // Toast de clima estacional
    if (est.estacion) {
        timeouts.set(function () {
            if (est.activo) lanzarToast(ESTACIONES[est.estacion].nombre, '🌪️', 'estado');
        }, 1200);
    }

    // Game loop
    gameLoop = crearGameLoop(actualizar);
    gameLoop.iniciar();
}

export function limpiarDuelo() {
    est.activo = false;

    if (gameLoop) {
        gameLoop.detener();
        gameLoop = null;
    }

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    timeouts.limpiar();

    if (listenerKeydown) {
        document.removeEventListener('keydown', listenerKeydown);
        listenerKeydown = null;
    }
    if (listenerKeyup) {
        document.removeEventListener('keyup', listenerKeyup);
        listenerKeyup = null;
    }
    if (listenerResize) {
        window.removeEventListener('resize', listenerResize);
        listenerResize = null;
    }

    const btns = obtenerBotonesAtaque();
    if (btns && listenerTouchStart) {
        btns.removeEventListener('touchstart', listenerTouchStart);
        btns.removeEventListener('touchend', listenerTouchEnd);
    }
    listenerTouchStart = null;
    listenerTouchEnd = null;

    if (est.dpadRef) {
        est.dpadRef.setModoCentrado();
    }

    if (est.modoLandscape) {
        est.modoLandscape.desactivar();
    }

    limpiarParticulas();
    limpiarGradas();
    limpiarSprites();

    // Quitar modo inmersivo
    const juegoEl = document.getElementById('juego');
    juegoEl.classList.remove('juego-inmersivo');

    // Remover pantalla
    if (est.pantalla) {
        est.pantalla.remove();
    }

    limpiarDOM();
    resetearEstado();
}
