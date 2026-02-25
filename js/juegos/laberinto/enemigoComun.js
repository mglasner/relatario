// Funciones compartidas entre enemigos del laberinto
// Evita duplicación de lógica de trampas, barras de vida y muerte

import { CONFIG, CFG, est } from './estado.js';
import { esTrampaActiva, esTrampaLentaActiva } from './trampas.js';
import { lanzarToast } from '../../componentes/toast.js';

// Obtiene la celda lógica donde está el centro del enemigo
export function getCeldaEnemigo(enemigo, tam) {
    return {
        fila: Math.floor((enemigo.posY + tam / 2) / CONFIG.TAM_CELDA),
        col: Math.floor((enemigo.posX + tam / 2) / CONFIG.TAM_CELDA),
    };
}

// BFS que calcula distancias desde un origen a todas las celdas alcanzables
export function calcularDistanciasBFS(origenFila, origenCol) {
    const cola = [[origenFila, origenCol, 0]];
    let idx = 0;
    const distancias = {};
    distancias[origenFila + ',' + origenCol] = 0;
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

    return { distancias, maxDist };
}

// Filtra celdas lógicas por rango de distancia, excluyendo celdas específicas
export function filtrarCandidatasPorDistancia(distancias, maxDist, fracMin, fracMax, excluir) {
    const distMin = Math.floor(maxDist * fracMin);
    const distMax = Math.floor(maxDist * fracMax);
    const candidatas = [];

    for (const key in distancias) {
        const dist = distancias[key];
        if (dist >= distMin && dist <= distMax) {
            const partes = key.split(',');
            const f = parseInt(partes[0]),
                c = parseInt(partes[1]);
            if (f % 2 === 1 && c % 2 === 1) {
                let excluida = false;
                for (let i = 0; i < excluir.length; i++) {
                    if (f === excluir[i][0] && c === excluir[i][1]) {
                        excluida = true;
                        break;
                    }
                }
                if (!excluida) candidatas.push([f, c]);
            }
        }
    }

    return candidatas;
}

// Detecta trampas de fuego y lentitud sobre un enemigo
// estKey: clave del enemigo en est ('trasgo' | 'villanoElite')
// Retorna true si el enemigo murió
export function detectarTrampasEnemigo(estKey, tam) {
    const enemigo = est[estKey];
    if (!enemigo) return false;

    const celda = getCeldaEnemigo(enemigo, tam);
    const ahora = Date.now();

    // Trampas de fuego
    for (let i = 0; i < est.trampas.length; i++) {
        const t = est.trampas[i];
        if (celda.fila === t.fila && celda.col === t.col && esTrampaActiva(t)) {
            if (ahora - enemigo.ultimoGolpeTrampa >= CONFIG.COOLDOWN_TRAMPA) {
                const tf = CFG.trampasFuego;
                const dano = tf.danoMin + Math.floor(Math.random() * (tf.danoMax - tf.danoMin + 1));
                enemigo.ultimoGolpeTrampa = ahora;
                enemigo.vida -= dano;

                // Número flotante
                const elem = document.createElement('div');
                elem.className = 'dano-flotante';
                elem.textContent = '-' + dano;
                elem.style.left = enemigo.posX + 'px';
                elem.style.top = enemigo.posY - 5 + 'px';
                est.contenedorLaberinto.appendChild(elem);
                setTimeout(function () {
                    elem.remove();
                }, 1000);

                // Flash
                enemigo.elemento.classList.add('enemigo-golpeado');
                const elemRef = enemigo.elemento;
                setTimeout(function () {
                    elemRef.classList.remove('enemigo-golpeado');
                }, 300);

                actualizarBarraVida(enemigo);

                if (enemigo.vida <= 0) {
                    eliminarEnemigo(estKey);
                    return true;
                }
            }
        }
    }

    // Trampas de lentitud
    if (enemigo.velocidadMult < 1) return false;
    for (let i = 0; i < est.trampasLentas.length; i++) {
        const t = est.trampasLentas[i];
        if (celda.fila === t.fila && celda.col === t.col && esTrampaLentaActiva(t)) {
            enemigo.velocidadMult = 1 - t.reduccion;
            enemigo.elemento.classList.add('enemigo-lento');
            if (enemigo.timerLentitud) clearTimeout(enemigo.timerLentitud);
            enemigo.timerLentitud = setTimeout(function () {
                if (est[estKey]) {
                    est[estKey].velocidadMult = 1;
                    est[estKey].elemento.classList.remove('enemigo-lento');
                }
            }, t.duracion);
            break;
        }
    }

    return false;
}

// Actualiza la barra de vida de un enemigo
function actualizarBarraVida(enemigo) {
    if (!enemigo.elementoBarraVida) return;
    const porcentaje = Math.max(0, (enemigo.vida / enemigo.vidaMax) * 100);
    enemigo.elementoBarraVida.style.width = porcentaje + '%';

    const contenedor = enemigo.elementoBarraVida.parentNode;
    if (porcentaje < 100) {
        contenedor.classList.add('barra-vida-visible');
    }
}

// Elimina un enemigo con animación de muerte
function eliminarEnemigo(estKey) {
    const enemigo = est[estKey];
    if (!enemigo) return;

    enemigo.elemento.classList.add('enemigo-muerte');
    lanzarToast('¡' + enemigo.datos.nombre + ' derrotado!', '💥', 'exito');

    const elemRef = enemigo.elemento;
    if (enemigo.timerLentitud) clearTimeout(enemigo.timerLentitud);
    est[estKey] = null;

    setTimeout(function () {
        if (elemRef.parentNode) elemRef.remove();
    }, 600);
}

// Crea la barra de vida DOM y la agrega al elemento contenedor
// Retorna el elemento de relleno para asignar a enemigo.elementoBarraVida
export function crearBarraVida(elemContenedor) {
    const barra = document.createElement('div');
    barra.className = 'barra-vida-enemigo';
    const relleno = document.createElement('div');
    relleno.className = 'barra-vida-enemigo-relleno';
    barra.appendChild(relleno);
    elemContenedor.appendChild(barra);
    return relleno;
}
