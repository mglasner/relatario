// Trasgo — Enemigo con IA de la Habitación 1
// Persigue al jugador usando pathfinding BFS

import { ENEMIGOS } from '../../enemigos.js';
import { mezclar } from '../../laberinto.js';
import { CONFIG, CFG, est, getCeldaJugador, aplicarDanoJugador } from './estado.js';
import {
    getCeldaEnemigo,
    calcularDistanciasBFS,
    filtrarCandidatasPorDistancia,
    calcularFactorProgresivo,
    detectarTrampasEnemigo,
    crearBarraVida,
} from './enemigoComun.js';
import { lanzarToast } from '../../componentes/toast.js';

// Busca una celda a distancia media de la entrada para colocar al Trasgo
function posicionInicialTrasgo() {
    const { distancias, maxDist } = calcularDistanciasBFS(est.entradaFila, est.entradaCol);
    const excluir = [[est.llaveFila, est.llaveCol]];
    const candidatas = filtrarCandidatasPorDistancia(
        distancias,
        maxDist,
        CFG.trasgo.posicionDistMin,
        CFG.trasgo.posicionDistMax,
        excluir
    );

    mezclar(candidatas);
    return candidatas.length > 0 ? candidatas[0] : [1, 1];
}

// Pathfinding BFS: calcula el camino más corto entre dos celdas
export function calcularCamino(origenF, origenC, destinoF, destinoC) {
    const cola = [[origenF, origenC]];
    let idx = 0;
    const previo = {};
    previo[origenF + ',' + origenC] = null;
    const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ];

    while (idx < cola.length) {
        const actual = cola[idx++];
        const f = actual[0],
            c = actual[1];

        if (f === destinoF && c === destinoC) {
            const camino = [];
            let pos = [f, c];
            while (pos) {
                camino.unshift(pos);
                pos = previo[pos[0] + ',' + pos[1]];
            }
            camino.shift();
            return camino;
        }

        for (let d = 0; d < dirs.length; d++) {
            const nf = f + dirs[d][0],
                nc = c + dirs[d][1];
            const key = nf + ',' + nc;
            if (
                nf >= 0 &&
                nf < CONFIG.FILAS &&
                nc >= 0 &&
                nc < CONFIG.COLS &&
                est.mapa[nf][nc] === 0 &&
                !(key in previo)
            ) {
                previo[key] = [f, c];
                cola.push([nf, nc]);
            }
        }
    }

    return [];
}

// Inicializa el Trasgo en el laberinto
export function iniciarTrasgo() {
    const pos = posicionInicialTrasgo();
    const datos = ENEMIGOS.Trasgo;
    est.trasgo = {
        datos: datos,
        vida: datos.vidaMax,
        vidaMax: datos.vidaMax,
        posX: pos[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2,
        posY: pos[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2,
        camino: [],
        ultimoGolpe: 0,
        ultimoGolpeTrampa: 0,
        ultimoPathfinding: 0,
        tiempoAparicion: Date.now(),
        velocidadMult: 1,
        timerLentitud: null,
        elemento: null,
        elementoBarraVida: null,
    };
}

// Actualiza pathfinding, movimiento y colisión del Trasgo (cada frame)
export function actualizarTrasgo() {
    if (!est.trasgo) return;

    // Recalcular ruta periódicamente
    const ahora = Date.now();
    if (ahora - est.trasgo.ultimoPathfinding >= CONFIG.INTERVALO_PATHFINDING) {
        est.trasgo.ultimoPathfinding = ahora;

        const celdaT = getCeldaEnemigo(est.trasgo, CONFIG.TAM_TRASGO);
        const celdaJ = getCeldaJugador();
        est.trasgo.camino = calcularCamino(celdaT.fila, celdaT.col, celdaJ.fila, celdaJ.col);
    }

    // Velocidad con factor progresivo (despertar gradual) + multiplicador de lentitud
    const factorProg = calcularFactorProgresivo(
        est.trasgo.tiempoAparicion,
        CFG.trasgo.velocidadInicial,
        CFG.trasgo.tiempoAceleracion
    );
    const vel = CONFIG.VELOCIDAD_TRASGO * factorProg * est.trasgo.velocidadMult;
    if (est.trasgo.camino.length > 0) {
        const objetivo = est.trasgo.camino[0];
        const targetX = objetivo[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2;
        const targetY = objetivo[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2;

        const dx = targetX - est.trasgo.posX;
        const dy = targetY - est.trasgo.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= vel) {
            est.trasgo.posX = targetX;
            est.trasgo.posY = targetY;
            est.trasgo.camino.shift();
        } else {
            est.trasgo.posX += (dx / dist) * vel;
            est.trasgo.posY += (dy / dist) * vel;
        }

        est.trasgo.elemento.style.transform = `translate(${est.trasgo.posX}px, ${est.trasgo.posY}px)`;
    }

    // Trampas afectan al trasgo
    if (detectarTrampasEnemigo('trasgo', CONFIG.TAM_TRASGO)) return;

    // Detectar colisión con jugador
    detectarColisionTrasgo();
}

// Si el Trasgo toca al jugador, ataca con uno de sus ataques
function detectarColisionTrasgo() {
    if (!est.activo) return;

    const ahora = Date.now();
    const cooldown = CONFIG.COOLDOWN_BASE / est.trasgo.datos.velAtaque;
    if (ahora - est.trasgo.ultimoGolpe < cooldown) return;

    const solapan =
        est.trasgo.posX < est.posX + CONFIG.TAM_JUGADOR &&
        est.trasgo.posX + CONFIG.TAM_TRASGO > est.posX &&
        est.trasgo.posY < est.posY + CONFIG.TAM_JUGADOR &&
        est.trasgo.posY + CONFIG.TAM_TRASGO > est.posY;

    if (solapan) {
        const ataques = est.trasgo.datos.ataques;
        const ataque = ataques[Math.floor(Math.random() * ataques.length)];
        est.trasgo.ultimoGolpe = ahora;
        aplicarDanoJugador(ataque.dano);
        lanzarToast('Trasgo — ' + ataque.nombre + ' (-' + ataque.dano + ')', '👹', 'dano');
    }
}

// Renderiza el Trasgo en el laberinto
export function renderizarTrasgo() {
    if (!est.trasgo) return;

    const elem = document.createElement('div');
    elem.className = 'trasgo-laberinto';
    elem.style.width = CONFIG.TAM_TRASGO + 'px';
    elem.style.height = CONFIG.TAM_TRASGO + 'px';
    elem.style.transform = `translate(${est.trasgo.posX}px, ${est.trasgo.posY}px)`;
    const img = document.createElement('img');
    img.src = 'assets/img/enemigos/trasgo.webp';
    img.alt = 'Trasgo';
    elem.appendChild(img);
    est.trasgo.elementoBarraVida = crearBarraVida(elem);

    est.contenedorLaberinto.appendChild(elem);
    est.trasgo.elemento = elem;
}
