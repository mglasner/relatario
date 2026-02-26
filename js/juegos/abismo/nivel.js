// Habitación 4 — El Abismo: Mapa de tiles con múltiples plantillas
// Cada partida selecciona una plantilla al azar
// 0=vacío, 1=suelo, 2=plataforma, 3=abismo, 4=spawn jugador, 5=spawn enemigo, 6=spawn boss, 7=meta

import { CFG } from './config.js';

const T = CFG.tiles.tipos;

// ============================================================
// Plantilla 1: "La Travesía" — ruta lineal con desvíos
// 17 filas × 130 columnas
// ============================================================

// prettier-ignore
// Secciones: inicio seguro (1-17) | esbirro1 (20-37) | esbirro2 (40-57) | esbirro3 (60-77) | boss (80-106) | meta (109-128)
// Separadas por huecos de 2 tiles (18-19, 38-39, 58-59, 78-79); meta conectada sin hueco
// Rutas altas: arco (esb1, fila 10), torre (esb2, fila 6), zigzag (esb3, fila 6); ruta baja: 1→2→3 fuegos progresivos
const MAPA_1 = [
    // Fila 0 - techo
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Filas 1-5 - aire
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 6 - plataformas cumbre (esb2:50-51, esb3:71-72)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 7 - aire
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 8 - plataformas altas (esb2:49-51, esb3:68-69+74-75, boss:84-86+92-94)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 9 - aire
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 10 - plataformas medias (tut:6-8, esb1:26-29, esb2:46-48+52-54, esb3:65-66, boss:82-83+88-90+96-98)
    [1,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 11 - aire
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 12 - plataformas bajas (inicio:9-11, esb1:22-24+31-34, esb2:42-44+55-57, esb3:62-63+76-77, boss:83-85+91-93+99-101)
    [1,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,2,2,2,0,0,0,0,2,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 13 - spawns (esbirros cols 28,48,69 | boss col 93)
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,7,0,0,0,0,0,0,0,0,0,0,0,0,1],
    // Fila 14 - suelo: 1 fuego esb1(24-25), 2 fuegos esb2(44-45+53-54), 3 fuegos esb3(63-64+67-68+73-74), gaps entre secciones
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,3,3,1,1,1,1,1,1,1,3,3,1,1,1,0,0,1,1,1,3,3,1,1,3,3,1,1,1,1,3,3,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Fila 15 - fuego bajo huecos y trampas
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,3,3,1,1,1,1,1,1,1,3,3,1,1,1,3,3,1,1,1,3,3,1,1,3,3,1,1,1,1,3,3,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    // Fila 16 - fuego profundo
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,3,3,1,1,1,1,3,3,1,1,1,1,1,1,1,3,3,1,1,1,3,3,1,1,1,3,3,1,1,3,3,1,1,1,1,3,3,1,1,1,3,3,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const SPAWN_1 = { col: 3, fila: 13 };

// ============================================================
// Plantilla 2: "El Cerro" — terreno con desniveles y cámara vertical
// 25 filas × 100 columnas
// El jugador sube por escalones de terreno hasta la cima donde espera el boss
// ============================================================

function generarCerro() {
    const FILAS = 25;
    const COLS = 100;

    // Inicializar con vacío
    const mapa = [];
    for (let f = 0; f < FILAS; f++) {
        mapa.push(new Array(COLS).fill(T.VACIO));
    }

    // Techo (fila 0) y paredes laterales
    for (let c = 0; c < COLS; c++) mapa[0][c] = T.SUELO;
    for (let f = 0; f < FILAS; f++) {
        mapa[f][0] = T.SUELO;
        mapa[f][COLS - 1] = T.SUELO;
    }

    // Segmentos de terreno: suelo sólido desde la fila indicada hasta el fondo
    // Cada salto entre secciones es de 2 tiles verticales (dentro del rango de salto)
    const segmentos = [
        { c0: 1, c1: 10, fila: 20 }, // Inicio (valle)
        { c0: 13, c1: 20, fila: 18 }, // Escalón 1
        { c0: 23, c1: 33, fila: 16 }, // Meseta (esbirro 1)
        { c0: 36, c1: 45, fila: 14 }, // Meseta alta (esbirro 2)
        { c0: 48, c1: 55, fila: 12 }, // Cresta
        { c0: 58, c1: 75, fila: 10 }, // Cima (esbirro 3 + boss)
        { c0: 78, c1: 98, fila: 10 }, // Salida (meta) — misma altura que cima
    ];

    for (let s = 0; s < segmentos.length; s++) {
        const seg = segmentos[s];
        for (let c = seg.c0; c <= seg.c1; c++) {
            for (let f = seg.fila; f < FILAS; f++) {
                mapa[f][c] = T.SUELO;
            }
        }
    }

    // Abismo en TODOS los huecos sin suelo (3 filas inferiores)
    for (let c = 1; c < COLS - 1; c++) {
        let tieneSuelo = false;
        for (let f = 1; f < FILAS; f++) {
            if (mapa[f][c] === T.SUELO) {
                tieneSuelo = true;
                break;
            }
        }
        if (!tieneSuelo) {
            for (let f = FILAS - 3; f < FILAS; f++) {
                mapa[f][c] = T.ABISMO;
            }
        }
    }

    // Plataformas para rutas alternativas y arena del boss
    const plataformas = [
        // Bypass esbirro 1 (meseta, cols 23-33)
        { fila: 13, c0: 25, c1: 27 },
        { fila: 11, c0: 30, c1: 32 },
        // Bypass esbirro 2 (meseta alta, cols 36-45)
        { fila: 11, c0: 38, c1: 40 },
        { fila: 9, c0: 42, c1: 44 },
        // Plataformas en cresta
        { fila: 9, c0: 50, c1: 52 },
        // Arena del boss (cima, cols 58-75)
        { fila: 7, c0: 62, c1: 64 },
        { fila: 8, c0: 67, c1: 68 },
        { fila: 7, c0: 70, c1: 72 },
    ];

    for (let p = 0; p < plataformas.length; p++) {
        const pl = plataformas[p];
        for (let c = pl.c0; c <= pl.c1; c++) {
            mapa[pl.fila][c] = T.PLATAFORMA;
        }
    }

    // Spawns de enemigos y boss (1 fila arriba del suelo de su sección)
    mapa[15][28] = T.SPAWN_ENEMIGO; // Esbirro 1 en meseta (suelo fila 16)
    mapa[13][41] = T.SPAWN_ENEMIGO; // Esbirro 2 en meseta alta (suelo fila 14)
    mapa[9][63] = T.SPAWN_ENEMIGO; // Esbirro 3 en cima (suelo fila 10)
    mapa[9][70] = T.SPAWN_BOSS; // Boss en cima (suelo fila 10)

    // Meta (fila de aire sobre la salida: el jugador la detecta al caminar)
    mapa[9][95] = T.META;
    mapa[9][96] = T.META;
    mapa[9][97] = T.META;

    return mapa;
}

const MAPA_2 = generarCerro();
const SPAWN_2 = { col: 3, fila: 19 };

// ============================================================
// Sistema de plantillas
// ============================================================

const PLANTILLAS = [
    { mapa: MAPA_1, spawn: SPAWN_1 },
    { mapa: MAPA_2, spawn: SPAWN_2 },
];

// Estado activo del mapa (se llena en resetearMapa)
let mapa = [];
let spawnJugador = { col: 0, fila: 0 };

// Selecciona una plantilla al azar y copia el mapa fresco
export function resetearMapa() {
    const idx = Math.floor(Math.random() * PLANTILLAS.length);
    const plantilla = PLANTILLAS[idx];
    mapa = [];
    for (let f = 0; f < plantilla.mapa.length; f++) {
        mapa.push(plantilla.mapa[f].slice());
    }
    spawnJugador = { col: plantilla.spawn.col, fila: plantilla.spawn.fila };
}

// Extraer spawns de enemigos y boss del mapa (limpia las celdas)
export function obtenerSpawns() {
    const enemigos = [];
    let boss = null;

    for (let fila = 0; fila < mapa.length; fila++) {
        for (let col = 0; col < mapa[fila].length; col++) {
            if (mapa[fila][col] === T.SPAWN_ENEMIGO) {
                enemigos.push({ col, fila });
                mapa[fila][col] = T.VACIO;
            } else if (mapa[fila][col] === T.SPAWN_BOSS) {
                boss = { col, fila };
                mapa[fila][col] = T.VACIO;
            }
        }
    }

    return { enemigos, boss };
}

export function obtenerSpawnJugador() {
    return { col: spawnJugador.col, fila: spawnJugador.fila };
}

export function obtenerFilas() {
    return mapa.length;
}

export function obtenerColumnas() {
    return mapa.length > 0 ? mapa[0].length : 0;
}

export function obtenerTile(fila, col) {
    if (fila < 0 || fila >= mapa.length || col < 0 || col >= mapa[0].length) {
        return T.VACIO;
    }
    return mapa[fila][col];
}
