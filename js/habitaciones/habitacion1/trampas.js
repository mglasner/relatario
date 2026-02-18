// Trampas de la Habitación 1
// Trampas de fuego (daño) y trampas de lentitud (ralentización)

import { mezclar } from '../../laberinto.js';
import { CONFIG, est, getCeldaJugador, aplicarDanoJugador } from './estado.js';
import { lanzarToast } from '../../componentes/toast.js';

// --- Trampas de fuego ---

// Coloca entre 3 y 5 trampas en celdas lógicas lejos de la entrada y la llave
export function colocarTrampas() {
    const numTrampas = 3 + Math.floor(Math.random() * 3);
    const celdasLibres = [];

    for (let f = 1; f < CONFIG.FILAS - 1; f++) {
        for (let c = 1; c < CONFIG.COLS - 1; c++) {
            if (est.mapa[f][c] !== 0) continue;
            if (f === est.entradaFila && c === est.entradaCol) continue;
            if (f === est.llaveFila && c === est.llaveCol) continue;
            if (Math.abs(f - est.entradaFila) + Math.abs(c - est.entradaCol) <= 3) continue;
            if (f % 2 !== 1 || c % 2 !== 1) continue;
            celdasLibres.push([f, c]);
        }
    }

    mezclar(celdasLibres);
    est.trampas = [];

    for (let i = 0; i < Math.min(numTrampas, celdasLibres.length); i++) {
        est.trampas.push({
            fila: celdasLibres[i][0],
            col: celdasLibres[i][1],
            periodo: 1500 + Math.floor(Math.random() * 2000),
            desfase: Math.floor(Math.random() * 3000),
            ultimoGolpe: 0,
            elemento: null,
        });
    }
}

// Determina si una trampa está activa (peligrosa) en este momento
export function esTrampaActiva(trampa) {
    return Math.floor((Date.now() + trampa.desfase) / trampa.periodo) % 2 === 0;
}

// Actualiza el estado visual de cada trampa (se llama cada frame)
export function actualizarTrampas() {
    for (let i = 0; i < est.trampas.length; i++) {
        const activa = esTrampaActiva(est.trampas[i]);
        if (activa) {
            est.trampas[i].elemento.classList.add('trampa-activa');
        } else {
            est.trampas[i].elemento.classList.remove('trampa-activa');
        }
    }
}

// Detecta si el jugador está sobre una trampa activa y aplica daño
export function detectarTrampas() {
    const celda = getCeldaJugador();
    const ahora = Date.now();

    for (let i = 0; i < est.trampas.length; i++) {
        const t = est.trampas[i];
        if (celda.fila === t.fila && celda.col === t.col && esTrampaActiva(t)) {
            if (ahora - t.ultimoGolpe >= CONFIG.COOLDOWN_TRAMPA) {
                const dano = 5 + Math.floor(Math.random() * 6);
                t.ultimoGolpe = ahora;
                aplicarDanoJugador(dano);
                lanzarToast('Trampa de fuego (-' + dano + ')', '🔥', 'dano');
            }
        }
    }
}

// Renderiza los elementos DOM de las trampas de fuego
export function renderizarTrampas() {
    for (let i = 0; i < est.trampas.length; i++) {
        const t = est.trampas[i];
        const elem = document.createElement('div');
        elem.className = 'laberinto-trampa';
        elem.style.left = t.col * CONFIG.TAM_CELDA + 'px';
        elem.style.top = t.fila * CONFIG.TAM_CELDA + 'px';
        elem.style.width = CONFIG.TAM_CELDA + 'px';
        elem.style.height = CONFIG.TAM_CELDA + 'px';
        est.contenedorLaberinto.appendChild(elem);
        t.elemento = elem;
    }
}

// --- Trampas de lentitud ---

// Coloca 2-3 trampas que ralentizan al jugador
export function colocarTrampasLentas() {
    const numTrampas = 2 + Math.floor(Math.random() * 2);
    const celdasLibres = [];

    // Evitar celdas ocupadas por trampas de fuego
    const ocupadas = {};
    for (let i = 0; i < est.trampas.length; i++) {
        ocupadas[est.trampas[i].fila + ',' + est.trampas[i].col] = true;
    }

    for (let f = 1; f < CONFIG.FILAS - 1; f++) {
        for (let c = 1; c < CONFIG.COLS - 1; c++) {
            if (est.mapa[f][c] !== 0) continue;
            if (f === est.entradaFila && c === est.entradaCol) continue;
            if (f === est.llaveFila && c === est.llaveCol) continue;
            if (Math.abs(f - est.entradaFila) + Math.abs(c - est.entradaCol) <= 3) continue;
            if (f % 2 !== 1 || c % 2 !== 1) continue;
            if (ocupadas[f + ',' + c]) continue;
            celdasLibres.push([f, c]);
        }
    }

    mezclar(celdasLibres);
    est.trampasLentas = [];

    for (let i = 0; i < Math.min(numTrampas, celdasLibres.length); i++) {
        est.trampasLentas.push({
            fila: celdasLibres[i][0],
            col: celdasLibres[i][1],
            periodo: 2000 + Math.floor(Math.random() * 2000),
            desfase: Math.floor(Math.random() * 3000),
            reduccion: 0.3 + Math.random() * 0.3,
            duracion: 3000 + Math.floor(Math.random() * 1000),
            ultimoGolpe: 0,
            elemento: null,
        });
    }
}

// Determina si una trampa de lentitud está activa
export function esTrampaLentaActiva(trampa) {
    return Math.floor((Date.now() + trampa.desfase) / trampa.periodo) % 2 === 0;
}

// Actualiza el estado visual de las trampas de lentitud
export function actualizarTrampasLentas() {
    for (let i = 0; i < est.trampasLentas.length; i++) {
        const activa = esTrampaLentaActiva(est.trampasLentas[i]);
        if (activa) {
            est.trampasLentas[i].elemento.classList.add('trampa-lenta-activa');
        } else {
            est.trampasLentas[i].elemento.classList.remove('trampa-lenta-activa');
        }
    }
}

// Detecta si el jugador pisa una trampa de lentitud activa
export function detectarTrampasLentas() {
    if (est.velocidadActual < est.velocidadBase) return;

    const celda = getCeldaJugador();
    const ahora = Date.now();

    for (let i = 0; i < est.trampasLentas.length; i++) {
        const t = est.trampasLentas[i];
        if (celda.fila === t.fila && celda.col === t.col && esTrampaLentaActiva(t)) {
            if (ahora - t.ultimoGolpe >= CONFIG.COOLDOWN_TRAMPA_LENTA) {
                t.ultimoGolpe = ahora;
                aplicarLentitud(t.reduccion, t.duracion);
            }
        }
    }
}

// Aplica reducción de velocidad temporal
export function aplicarLentitud(reduccion, duracion) {
    est.velocidadActual = est.velocidadBase * (1 - reduccion);

    // Feedback visual
    est.elementoJugador.classList.add('jugador-lento');
    lanzarToast('Telaraña — velocidad reducida', '🕸️', 'estado');

    // Texto flotante
    const elem = document.createElement('div');
    elem.className = 'efecto-flotante efecto-lentitud';
    elem.textContent = '🕸️ Lento!';
    elem.style.left = est.posX + 'px';
    elem.style.top = est.posY - 5 + 'px';
    est.contenedorLaberinto.appendChild(elem);
    setTimeout(function () {
        if (elem.parentNode) elem.parentNode.removeChild(elem);
    }, 1000);

    // Restaurar velocidad tras la duración
    if (est.timerLentitud) clearTimeout(est.timerLentitud);
    est.timerLentitud = setTimeout(function () {
        est.velocidadActual = est.velocidadBase;
        est.elementoJugador.classList.remove('jugador-lento');
        est.timerLentitud = null;
    }, duracion);
}

// Renderiza los elementos DOM de las trampas de lentitud
export function renderizarTrampasLentas() {
    for (let i = 0; i < est.trampasLentas.length; i++) {
        const tl = est.trampasLentas[i];
        const elem = document.createElement('div');
        elem.className = 'laberinto-trampa-lenta';
        elem.style.left = tl.col * CONFIG.TAM_CELDA + 'px';
        elem.style.top = tl.fila * CONFIG.TAM_CELDA + 'px';
        elem.style.width = CONFIG.TAM_CELDA + 'px';
        elem.style.height = CONFIG.TAM_CELDA + 'px';
        est.contenedorLaberinto.appendChild(elem);
        tl.elemento = elem;
    }
}
