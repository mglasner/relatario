// El Laberinto — Laberinto 2D procedural
// El jugador debe encontrar la llave y volver a la salida
// El laberinto se genera aleatoriamente cada vez

import { generarMapa, encontrarPuntoLejano } from '../../laberinto.js';
import {
    colocarCuartosSecretos,
    renderizarCuartosSecretos,
    detectarProximidad,
    detectarEmpuje,
    detectarRecompensa,
} from './cuartosSecretos.js';
import { CONFIG, CFG, est, calcularTamCelda, getCeldaJugador } from './estado.js';
import {
    colocarTrampas,
    actualizarTrampas,
    detectarTrampas,
    renderizarTrampas,
    colocarTrampasLentas,
    actualizarTrampasLentas,
    detectarTrampasLentas,
    renderizarTrampasLentas,
} from './trampas.js';
import { iniciarTrasgo, actualizarTrasgo, renderizarTrasgo } from './trasgo.js';
import { iniciarCountdown, actualizarVillanoElite, limpiarVillanoElite } from './villanoElite.js';
import { lanzarToast } from '../../componentes/toast.js';
import { sortearEstacion, ESTACIONES } from '../clima.js';

import { crearPantallaJuego } from '../../componentes/pantallaJuego.js';
import { crearModoPortrait } from '../../componentes/modoPortrait.js';
import { crearElemento, crearGameLoop } from '../../utils.js';
import { notificarVictoria } from '../../eventos.js';

// --- Sistema de clima (canvas overlay sobre el laberinto) ---

let climaCanvas = null;
let climaCtx = null;
let climaRafId = null;
let climaEstacion = null;
let climaParticulas = [];
let climaFrame = 0;
let climaRafagaCounter = 0;
let climaRafagaProx = 200 + Math.floor(Math.random() * 100);
let climaRafagaActiva = false;
let climaRafagaFrames = 0;

const COLORES_HOJAS_LAB = [
    [210, 80, 30],
    [230, 150, 40],
    [140, 50, 20],
];

function emitirParticulasClimaLab(ancho, alto) {
    if (climaEstacion === 'invierno') {
        const n = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++) {
            climaParticulas.push({
                x: Math.random() * ancho,
                y: -5,
                vx: -1.2,
                vy: 5.5 + Math.random() * 2,
                vida: 20 + Math.floor(Math.random() * 8),
                vidaMax: 28,
                r: 170,
                g: 200,
                b: 255,
                alpha: 0.6,
                tipo: 'lluvia',
                tam: 2,
            });
        }
    } else if (climaEstacion === 'primavera') {
        if (climaFrame % 4 === 0) {
            const paletas = [
                [230, 80, 130], // rosa fucsia
                [220, 60, 110], // cerezo
                [200, 80, 200], // violeta
                [245, 160, 60], // naranja durazno
                [80, 180, 220], // celeste
                [255, 220, 60], // amarillo pollito
                [160, 220, 80], // verde lima
                [240, 130, 180], // rosa claro
            ];
            const c = paletas[Math.floor(Math.random() * paletas.length)];
            const vidaMax = 140 + Math.floor(Math.random() * 80);
            climaParticulas.push({
                x: Math.random() * ancho,
                y: -5,
                vx: (Math.random() - 0.5) * 1.2,
                vy: 0.5 + Math.random() * 0.5,
                vida: vidaMax,
                vidaMax,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.85,
                tipo: 'petalo',
                tam: 3.5 + Math.random() * 2.5,
            });
        }
        if (climaFrame % 7 === 0) {
            climaParticulas.push({
                x: Math.random() * ancho,
                y: Math.random() * alto * 0.7,
                vx: 0,
                vy: 0,
                vida: 60 + Math.floor(Math.random() * 30),
                vidaMax: 90,
                r: 255,
                g: 255,
                b: 200,
                alpha: 0.85,
                tipo: 'destello-luz',
                tam: 2,
            });
        }
    } else if (climaEstacion === 'verano') {
        if (climaFrame % 4 === 0) {
            climaParticulas.push({
                x: Math.random() * ancho,
                y: Math.random() * alto * 0.7,
                vx: 0.1 + Math.random() * 0.15,
                vy: 0,
                vida: 250 + Math.floor(Math.random() * 100),
                vidaMax: 350,
                r: 220,
                g: 190,
                b: 100,
                alpha: 0.25 + Math.random() * 0.2,
                tipo: 'mota',
                tam: 1 + Math.random(),
            });
        }
    } else if (climaEstacion === 'otono') {
        climaRafagaCounter++;
        if (climaRafagaCounter >= climaRafagaProx) {
            climaRafagaCounter = 0;
            climaRafagaProx = 180 + Math.floor(Math.random() * 120);
            climaRafagaActiva = true;
            climaRafagaFrames = 30;
        }
        if (climaRafagaActiva) {
            climaRafagaFrames--;
            if (climaRafagaFrames <= 0) climaRafagaActiva = false;
        }
        if (climaFrame % 4 === 0) {
            const c = COLORES_HOJAS_LAB[Math.floor(Math.random() * 3)];
            const vxHoja = climaRafagaActiva
                ? -2.5 - Math.random() * 0.5
                : -0.8 - Math.random() * 1.4;
            climaParticulas.push({
                x: ancho + 5,
                y: Math.random() * alto,
                vx: vxHoja,
                vy: 0.4 + Math.random() * 0.8,
                vida: 90 + Math.floor(Math.random() * 50),
                vidaMax: 140,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.8,
                tipo: 'hoja',
                tam: 2 + Math.random(),
            });
        }
        if (climaFrame % 2 === 0) {
            climaParticulas.push({
                x: Math.random() * ancho,
                y: -5,
                vx: -0.6,
                vy: 2.5 + Math.random() * 1,
                vida: 35 + Math.floor(Math.random() * 10),
                vidaMax: 45,
                r: 200,
                g: 160,
                b: 80,
                alpha: 0.28,
                tipo: 'lluvia-suave',
                tam: 1.5,
            });
        }
    }
}

function loopClimaLab() {
    if (!climaCanvas || !climaEstacion) return;
    climaFrame++;

    const ancho = climaCanvas.width;
    const alto = climaCanvas.height;
    climaCtx.clearRect(0, 0, ancho, alto);

    // Emitir (con cap de partículas para performance)
    if (climaParticulas.length < 150) {
        emitirParticulasClimaLab(ancho, alto);
    }

    // Actualizar y renderizar
    const vivas = [];
    for (let i = 0; i < climaParticulas.length; i++) {
        const p = climaParticulas[i];

        // Movimiento especial por tipo
        if (p.tipo === 'petalo') {
            p.vx = Math.sin(climaFrame * 0.04 + p.vidaMax * 0.27) * 1.1;
        } else if (p.tipo === 'mota') {
            p.vy = Math.sin(climaFrame * 0.02 + p.x * 0.05) * 0.15;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vida--;

        // Descartar si salió de pantalla o expiró
        if (p.vida <= 0 || p.x < -10 || p.x > ancho + 10 || p.y > alto + 10) continue;

        // Alpha según tipo
        const ratio = p.vida / p.vidaMax;
        let alpha = p.alpha;
        if (p.tipo === 'destello-luz') {
            alpha = p.alpha * Math.abs(Math.sin(climaFrame * 0.15 + p.x * 0.1));
        } else if (p.tipo === 'petalo' || p.tipo === 'hoja') {
            alpha = ratio > 0.15 ? p.alpha : (ratio / 0.15) * p.alpha;
        } else if (p.tipo === 'lluvia' || p.tipo === 'lluvia-suave') {
            alpha = ratio > 0.2 ? p.alpha : (ratio / 0.2) * p.alpha;
        }

        const a = Math.max(0, Math.min(1, alpha));
        if (a < 0.01) {
            vivas.push(p);
            continue;
        }

        // Renderizar
        climaCtx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + a.toFixed(2) + ')';
        if (p.tipo === 'lluvia') {
            climaCtx.fillRect(p.x, p.y, 1, 5);
        } else if (p.tipo === 'lluvia-suave') {
            climaCtx.fillRect(p.x, p.y, 0.5, 3);
        } else if (p.tipo === 'destello-luz') {
            climaCtx.beginPath();
            climaCtx.arc(p.x, p.y, p.tam, 0, Math.PI * 2);
            climaCtx.fill();
        } else if (p.tipo === 'petalo') {
            // Pétalo: elipse alargada rotada según dirección de movimiento
            const angPetalo = Math.atan2(p.vy, p.vx);
            climaCtx.save();
            climaCtx.translate(p.x, p.y);
            climaCtx.rotate(angPetalo);
            climaCtx.beginPath();
            climaCtx.ellipse(0, 0, p.tam * 1.4, p.tam * 0.55, 0, 0, Math.PI * 2);
            climaCtx.fill();
            climaCtx.restore();
        } else if (p.tipo === 'hoja') {
            // Hoja: óvalo puntiagudo con bezier, orientado según movimiento
            const angHoja = Math.atan2(p.vy, p.vx) + Math.PI * 0.5;
            const rh = p.tam;
            climaCtx.save();
            climaCtx.translate(p.x, p.y);
            climaCtx.rotate(angHoja);
            climaCtx.beginPath();
            climaCtx.moveTo(0, -rh * 1.6);
            climaCtx.bezierCurveTo(rh * 0.85, -rh * 0.6, rh * 0.85, rh * 0.6, 0, rh * 1.6);
            climaCtx.bezierCurveTo(-rh * 0.85, rh * 0.6, -rh * 0.85, -rh * 0.6, 0, -rh * 1.6);
            climaCtx.fill();
            climaCtx.restore();
        } else {
            // mota
            const mitad = p.tam / 2;
            climaCtx.fillRect(p.x - mitad, p.y - mitad, p.tam, p.tam);
        }

        vivas.push(p);
    }
    climaParticulas = vivas;

    climaRafId = requestAnimationFrame(loopClimaLab);
}

function iniciarClimaLab(estacion) {
    if (!estacion) return;
    climaEstacion = estacion;
    climaParticulas = [];
    climaFrame = 0;
    climaRafagaCounter = 0;
    climaRafagaActiva = false;
    climaRafagaFrames = 0;

    const ancho = CONFIG.COLS * CONFIG.TAM_CELDA;
    const alto = CONFIG.FILAS * CONFIG.TAM_CELDA;
    climaCanvas = document.createElement('canvas');
    climaCanvas.className = 'clima-overlay';
    climaCanvas.width = ancho;
    climaCanvas.height = alto;
    climaCtx = climaCanvas.getContext('2d');

    // Insertar al final del contenedor (encima de todo excepto el jugador)
    est.contenedorLaberinto.appendChild(climaCanvas);

    climaRafId = requestAnimationFrame(loopClimaLab);
}

function limpiarClimaLab() {
    if (climaRafId) {
        cancelAnimationFrame(climaRafId);
        climaRafId = null;
    }
    climaCanvas = null;
    climaCtx = null;
    climaEstacion = null;
    climaParticulas = [];
}

// --- Crear pantalla HTML ---

function crearPantalla(esTouch) {
    const { pantalla } = crearPantallaJuego(
        'pantalla-laberinto',
        'juego-laberinto',
        CFG.meta.titulo,
        function () {
            limpiarLaberinto();
            est.callbackSalir();
        }
    );
    est.pantalla = pantalla;

    est.indicador = document.createElement('p');
    est.indicador.id = 'laberinto-indicador';

    est.contenedorLaberinto = document.createElement('div');
    est.contenedorLaberinto.id = 'laberinto';
    est.contenedorLaberinto.style.width = CONFIG.COLS * CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.style.height = CONFIG.FILAS * CONFIG.TAM_CELDA + 'px';

    // Jugador dentro del laberinto
    est.elementoJugador = document.createElement('div');
    est.elementoJugador.className = 'jugador-laberinto';
    est.elementoJugador.style.width = CONFIG.TAM_JUGADOR + 'px';
    est.elementoJugador.style.height = CONFIG.TAM_JUGADOR + 'px';
    const img = document.createElement('img');
    img.src = est.jugador.img;
    img.alt = est.jugador.nombre;
    est.elementoJugador.appendChild(img);
    est.elementoJugador.classList.add(est.jugador.clase);

    est.mensajeExito = document.createElement('p');
    est.mensajeExito.id = 'laberinto-mensaje';
    est.mensajeExito.classList.add('oculto');

    pantalla.appendChild(est.indicador);
    pantalla.appendChild(est.contenedorLaberinto);
    pantalla.appendChild(est.mensajeExito);

    if (!esTouch) {
        const hint = crearElemento(
            'p',
            'laberinto-hint',
            'Usa las flechas ← ↑ ↓ → para moverte · Esc para huir'
        );
        pantalla.appendChild(hint);
    }

    document.getElementById('juego').appendChild(pantalla);
}

// --- Funciones principales ---

/**
 * Inicia El Laberinto.
 * @param {Object} jugadorRef - Personaje seleccionado
 * @param {Function} callback - Callback para volver al Libro de Juegos
 * @param {Object} [dpadRef] - Controles touch D-pad
 */
export function iniciarLaberinto(jugadorRef, callback, dpadRef) {
    est.jugador = jugadorRef;
    est.callbackSalir = callback;
    est.tieneLlave = false;
    est.activo = true;

    // Escalar tamaño de celda al viewport
    calcularTamCelda();

    // Generar laberinto aleatorio
    est.mapa = generarMapa(CONFIG.FILAS, CONFIG.COLS, CONFIG.ATAJOS);

    // Entrada en la esquina inferior izquierda
    est.entradaFila = CONFIG.FILAS - 2;
    est.entradaCol = 1;

    // Colocar la llave en el punto más lejano de la entrada
    const puntoLlave = encontrarPuntoLejano(
        est.mapa,
        CONFIG.FILAS,
        CONFIG.COLS,
        est.entradaFila,
        est.entradaCol
    );
    est.llaveFila = puntoLlave[0];
    est.llaveCol = puntoLlave[1];

    // Colocar cuartos secretos (antes de trampas para reservar dead-ends)
    colocarCuartosSecretos();

    // Colocar trampas aleatorias
    colocarTrampas();
    colocarTrampasLentas();

    // Velocidad según atributo del personaje
    est.velocidadBase =
        CONFIG.VELOCIDAD * (est.jugador.velocidad / CFG.jugador.velocidadReferencia);
    est.velocidadActual = est.velocidadBase;
    if (est.timerLentitud) {
        clearTimeout(est.timerLentitud);
        est.timerLentitud = null;
    }

    // Escala visual según estatura (no afecta colisiones)
    est.escalaVisual =
        CFG.jugador.escalaVisualBase * (est.jugador.estatura / CFG.jugador.estaturaReferencia);

    // Activar fullscreen y lock portrait en mobile
    est.modoPortrait = crearModoPortrait();
    est.modoPortrait.activar();

    // Crear e insertar la pantalla
    crearPantalla(!!dpadRef);

    // Renderizar el laberinto (sin enemigos aún)
    renderizarLaberinto();

    // Posicionar jugador en la entrada
    est.posX = est.entradaCol * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_JUGADOR) / 2;
    est.posY = est.entradaFila * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_JUGADOR) / 2;
    actualizarPosicion();

    // Resetear indicador
    est.indicador.replaceChildren();
    const imgIndicador = document.createElement('img');
    imgIndicador.src = 'assets/img/llaves/llave-laberinto.webp';
    imgIndicador.alt = '';
    imgIndicador.className = 'indicador-llave-img';
    est.indicador.appendChild(imgIndicador);
    est.indicador.appendChild(document.createTextNode(' ' + CFG.textos.indicadorBusqueda));
    est.indicador.classList.remove('llave-obtenida');
    est.mensajeExito.classList.add('oculto');

    // Registrar controles
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Activar D-pad touch apuntando a las teclas del laberinto
    if (dpadRef) {
        dpadRef.setTeclasRef(est.teclas);
        dpadRef.mostrar();
    }

    // Sortear e iniciar clima
    const estacionLab = sortearEstacion();
    iniciarClimaLab(estacionLab);
    if (estacionLab) {
        setTimeout(function () {
            if (est.activo) {
                lanzarToast(
                    '\u2728 ' + ESTACIONES[estacionLab].nombre,
                    '\ud83c\udf2c\ufe0f',
                    'estado'
                );
            }
        }, 800);
    }

    // Exploración libre: enemigos aparecen tras el delay configurado
    est.timerAparicion = setTimeout(function () {
        if (!est.activo) return;
        iniciarTrasgo();
        renderizarTrasgo();
        iniciarCountdown();
    }, CFG.trasgo.delay * 1000);

    // Iniciar game loop
    gameLoop.iniciar();
}

// --- Renderizado ---

function renderizarLaberinto() {
    // Paredes: canvas estático (reemplaza ~280 divs por 1 canvas dibujado una sola vez)
    const tam = CONFIG.TAM_CELDA;
    const ancho = CONFIG.COLS * tam;
    const alto = CONFIG.FILAS * tam;
    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    canvas.className = 'laberinto-canvas';
    canvas.width = ancho * dpr;
    canvas.height = alto * dpr;
    canvas.style.width = ancho + 'px';
    canvas.style.height = alto + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Colores de pared desde CSS variables
    const styles = getComputedStyle(est.contenedorLaberinto);
    const colorPared = styles.getPropertyValue('--juego-pared').trim() || '#3d2560';
    const colorOscuro = styles.getPropertyValue('--juego-pared-oscuro').trim() || '#201035';
    const colorBorde = styles.getPropertyValue('--juego-borde').trim() || 'rgba(100,60,150,0.25)';

    // Gradiente global diagonal (simula iluminación)
    const grad = ctx.createLinearGradient(0, 0, ancho, alto);
    grad.addColorStop(0, colorPared);
    grad.addColorStop(1, colorOscuro);

    // Dibujar todas las paredes (valor >= 1: paredes normales y falsas)
    ctx.fillStyle = grad;
    for (let fila = 0; fila < CONFIG.FILAS; fila++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (est.mapa[fila][col] >= 1) {
                ctx.fillRect(col * tam, fila * tam, tam, tam);
            }
        }
    }

    // Bordes sutiles entre celdas
    ctx.strokeStyle = colorBorde;
    ctx.lineWidth = 0.5;
    for (let fila = 0; fila < CONFIG.FILAS; fila++) {
        for (let col = 0; col < CONFIG.COLS; col++) {
            if (est.mapa[fila][col] >= 1) {
                ctx.strokeRect(col * tam + 0.5, fila * tam + 0.5, tam - 1, tam - 1);
            }
        }
    }

    est.contenedorLaberinto.appendChild(canvas);
    est.canvasMapa = canvas;
    est.ctxMapa = ctx;

    // Trampas (delegadas a submódulos, appenden al contenedor directamente)
    renderizarTrampas();
    renderizarTrampasLentas();
    renderizarCuartosSecretos();

    // Llave
    est.elementoLlave = document.createElement('div');
    est.elementoLlave.className = 'laberinto-llave';
    const imgLlave = document.createElement('img');
    imgLlave.src = 'assets/img/llaves/llave-laberinto.webp';
    imgLlave.alt = 'Llave';
    est.elementoLlave.appendChild(imgLlave);
    est.elementoLlave.style.left = est.llaveCol * CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.top = est.llaveFila * CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.width = CONFIG.TAM_CELDA + 'px';
    est.elementoLlave.style.height = CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.appendChild(est.elementoLlave);

    // Salida
    const salida = document.createElement('div');
    salida.className = 'laberinto-salida';
    salida.textContent = '🚪';
    salida.style.left = est.entradaCol * CONFIG.TAM_CELDA + 'px';
    salida.style.top = est.entradaFila * CONFIG.TAM_CELDA + 'px';
    salida.style.width = CONFIG.TAM_CELDA + 'px';
    salida.style.height = CONFIG.TAM_CELDA + 'px';
    est.contenedorLaberinto.appendChild(salida);

    // Jugador (siempre al final para que quede encima)
    est.contenedorLaberinto.appendChild(est.elementoJugador);
}

// --- Movimiento con colisiones y corner sliding ---

function esPared(pixelX, pixelY) {
    const col = Math.floor(pixelX / CONFIG.TAM_CELDA);
    const fila = Math.floor(pixelY / CONFIG.TAM_CELDA);

    if (fila < 0 || fila >= CONFIG.FILAS || col < 0 || col >= CONFIG.COLS) {
        return true;
    }
    return est.mapa[fila][col] !== 0;
}

function hayColision(x, y) {
    return (
        esPared(x + CONFIG.MARGEN_COLISION, y + CONFIG.MARGEN_COLISION) ||
        esPared(x + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION, y + CONFIG.MARGEN_COLISION) ||
        esPared(x + CONFIG.MARGEN_COLISION, y + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION) ||
        esPared(
            x + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION,
            y + CONFIG.TAM_JUGADOR - CONFIG.MARGEN_COLISION
        )
    );
}

function moverEnLaberinto(dx, dy) {
    // Mover por eje X
    if (dx !== 0) {
        const nuevaX = est.posX + dx;
        if (!hayColision(nuevaX, est.posY)) {
            est.posX = nuevaX;
        } else {
            for (let i = 1; i <= CONFIG.TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(nuevaX, est.posY - i)) {
                    est.posY -= i;
                    est.posX = nuevaX;
                    break;
                }
                if (!hayColision(nuevaX, est.posY + i)) {
                    est.posY += i;
                    est.posX = nuevaX;
                    break;
                }
            }
        }
    }

    // Mover por eje Y
    if (dy !== 0) {
        const nuevaY = est.posY + dy;
        if (!hayColision(est.posX, nuevaY)) {
            est.posY = nuevaY;
        } else {
            for (let i = 1; i <= CONFIG.TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(est.posX - i, nuevaY)) {
                    est.posX -= i;
                    est.posY = nuevaY;
                    break;
                }
                if (!hayColision(est.posX + i, nuevaY)) {
                    est.posX += i;
                    est.posY = nuevaY;
                    break;
                }
            }
        }
    }

    actualizarPosicion();
}

function actualizarPosicion() {
    est.elementoJugador.style.transform = `translate(${est.posX}px, ${est.posY}px) scale(${est.escalaVisual})`;
}

// --- Detección de llave y salida ---

function detectarLlave() {
    if (est.tieneLlave) return;

    const celda = getCeldaJugador();

    if (celda.fila === est.llaveFila && celda.col === est.llaveCol) {
        est.tieneLlave = true;

        est.elementoLlave.classList.add('llave-recogida');

        est.indicador.replaceChildren();
        const imgObtenida = document.createElement('img');
        imgObtenida.src = 'assets/img/llaves/llave-laberinto.webp';
        imgObtenida.alt = '';
        imgObtenida.className = 'indicador-llave-img';
        est.indicador.appendChild(imgObtenida);
        est.indicador.appendChild(document.createTextNode(' ' + CFG.textos.indicadorLlaveObtenida));
        est.indicador.classList.add('llave-obtenida');

        lanzarToast(CFG.textos.toastLlave, '\uD83D\uDD11', 'item');
    }
}

function detectarSalida() {
    if (!est.tieneLlave) return;

    const celda = getCeldaJugador();

    if (celda.fila === est.entradaFila && celda.col === est.entradaCol) {
        est.activo = false;
        est.mensajeExito.textContent = CFG.textos.mensajeExito;
        est.mensajeExito.classList.remove('oculto');
        lanzarToast(CFG.textos.mensajeExito, '🚪', 'exito');

        notificarVictoria();
        setTimeout(function () {
            limpiarLaberinto();
            est.callbackSalir();
        }, CFG.meta.timeoutExito);
    }
}

// --- Game loop ---

const gameLoop = crearGameLoop(function (_tiempo, _dt) {
    if (!est.activo) {
        gameLoop.detener();
        return;
    }

    let dx = 0;
    let dy = 0;

    if (est.teclas['ArrowUp']) dy -= est.velocidadActual;
    if (est.teclas['ArrowDown']) dy += est.velocidadActual;
    if (est.teclas['ArrowLeft']) dx -= est.velocidadActual;
    if (est.teclas['ArrowRight']) dx += est.velocidadActual;

    if (dx !== 0 || dy !== 0) {
        moverEnLaberinto(dx, dy);
    }

    actualizarTrampas();
    detectarTrampas();
    actualizarTrampasLentas();
    detectarTrampasLentas();
    actualizarTrasgo();
    actualizarVillanoElite();
    detectarLlave();
    detectarSalida();
    detectarProximidad();
    detectarEmpuje(dx, dy);
    detectarRecompensa();
});

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        est.teclas[e.key] = true;
    }
    if (e.key === 'Escape') {
        limpiarLaberinto();
        est.callbackSalir();
    }
}

function onKeyUp(e) {
    delete est.teclas[e.key];
}

// --- Limpieza ---

/** Limpia y destruye El Laberinto */
export function limpiarLaberinto() {
    est.activo = false;
    if (est.timerAparicion) {
        clearTimeout(est.timerAparicion);
        est.timerAparicion = null;
    }
    est.trampas = [];
    est.trampasLentas = [];
    est.cuartosSecretos = [];
    est.trasgo = null;
    limpiarVillanoElite();
    est.velocidadActual = CONFIG.VELOCIDAD;
    if (est.timerLentitud) {
        clearTimeout(est.timerLentitud);
        est.timerLentitud = null;
    }

    gameLoop.detener();

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    est.teclas = {};

    if (est.modoPortrait) {
        est.modoPortrait.desactivar();
        est.modoPortrait = null;
    }

    limpiarClimaLab();

    if (est.pantalla) {
        est.pantalla.remove();
        est.pantalla = null;
    }
}
