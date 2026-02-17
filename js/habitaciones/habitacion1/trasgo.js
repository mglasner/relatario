// Trasgo — Enemigo con IA de la Habitación 1
// Persigue al jugador usando pathfinding BFS

import { ENEMIGOS } from '../../enemigos.js';
import { mezclar } from '../../laberinto.js';
import { CONFIG, est, getCeldaJugador, aplicarDanoJugador } from './estado.js';
import { lanzarToast } from '../../componentes/toast.js';

// Busca una celda a distancia media de la entrada para colocar al Trasgo
function posicionInicialTrasgo() {
    const cola = [[est.entradaFila, est.entradaCol, 0]];
    let idx = 0;
    const distancias = {};
    distancias[est.entradaFila + ',' + est.entradaCol] = 0;
    const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ];
    let maxDist = 0;

    while (idx < cola.length) {
        const actual = cola[idx++];
        const f = actual[0],
            c = actual[1],
            d = actual[2];
        if (d > maxDist) maxDist = d;

        for (let i = 0; i < dirs.length; i++) {
            const nf = f + dirs[i][0],
                nc = c + dirs[i][1];
            const key = nf + ',' + nc;
            if (
                nf >= 0 &&
                nf < CONFIG.FILAS &&
                nc >= 0 &&
                nc < CONFIG.COLS &&
                est.mapa[nf][nc] === 0 &&
                !(key in distancias)
            ) {
                distancias[key] = d + 1;
                cola.push([nf, nc, d + 1]);
            }
        }
    }

    // Elegir celdas lógicas a 40-70% de la distancia máxima
    const distMin = Math.floor(maxDist * 0.4);
    const distMax = Math.floor(maxDist * 0.7);
    const candidatas = [];

    for (const key in distancias) {
        const dist = distancias[key];
        if (dist >= distMin && dist <= distMax) {
            const partes = key.split(',');
            const f = parseInt(partes[0]),
                c = parseInt(partes[1]);
            if (f % 2 === 1 && c % 2 === 1) {
                if (f === est.llaveFila && c === est.llaveCol) continue;
                candidatas.push([f, c]);
            }
        }
    }

    mezclar(candidatas);
    return candidatas.length > 0 ? candidatas[0] : [1, 1];
}

// Pathfinding BFS: calcula el camino más corto entre dos celdas
function calcularCamino(origenF, origenC, destinoF, destinoC) {
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
    est.trasgo = {
        datos: ENEMIGOS.Trasgo,
        posX: pos[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2,
        posY: pos[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2,
        camino: [],
        ultimoGolpe: 0,
        ultimoPathfinding: 0,
        elemento: null,
    };
}

// Actualiza pathfinding, movimiento y colisión del Trasgo (cada frame)
export function actualizarTrasgo() {
    if (!est.trasgo) return;

    // Recalcular ruta periódicamente
    const ahora = Date.now();
    if (ahora - est.trasgo.ultimoPathfinding >= CONFIG.INTERVALO_PATHFINDING) {
        est.trasgo.ultimoPathfinding = ahora;

        const celdaT = {
            fila: Math.floor((est.trasgo.posY + CONFIG.TAM_TRASGO / 2) / CONFIG.TAM_CELDA),
            col: Math.floor((est.trasgo.posX + CONFIG.TAM_TRASGO / 2) / CONFIG.TAM_CELDA),
        };
        const celdaJ = getCeldaJugador();
        est.trasgo.camino = calcularCamino(celdaT.fila, celdaT.col, celdaJ.fila, celdaJ.col);
    }

    // Mover hacia el siguiente punto del camino
    if (est.trasgo.camino.length > 0) {
        const objetivo = est.trasgo.camino[0];
        const targetX = objetivo[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2;
        const targetY = objetivo[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_TRASGO) / 2;

        const dx = targetX - est.trasgo.posX;
        const dy = targetY - est.trasgo.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= CONFIG.VELOCIDAD_TRASGO) {
            est.trasgo.posX = targetX;
            est.trasgo.posY = targetY;
            est.trasgo.camino.shift();
        } else {
            est.trasgo.posX += (dx / dist) * CONFIG.VELOCIDAD_TRASGO;
            est.trasgo.posY += (dy / dist) * CONFIG.VELOCIDAD_TRASGO;
        }

        est.trasgo.elemento.style.transform = `translate(${est.trasgo.posX}px, ${est.trasgo.posY}px)`;
    }

    // Detectar colisión con jugador
    detectarColisionTrasgo();
}

// Si el Trasgo toca al jugador, ataca con uno de sus ataques
function detectarColisionTrasgo() {
    const ahora = Date.now();
    if (ahora - est.trasgo.ultimoGolpe < CONFIG.COOLDOWN_TRASGO) return;

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
    est.contenedorLaberinto.appendChild(elem);
    est.trasgo.elemento = elem;
}
