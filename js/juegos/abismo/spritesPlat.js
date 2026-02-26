// Habitacion 4 — El Abismo: Sprites de personajes y enemigos
// Carga sprite sheets PNG (generados con IA) y los parte en frames.
// Fallback: genera sprites procedurales si no hay sprite sheet disponible.
//
// Layout unificado (17 frames): [idle×2, run×6, jump, fall, hit, atk1×2, atk2×2, crouch×2]
// Cada frame mide FRAME_W x FRAME_H pixeles (resolucion 2x).

// --- Constantes ---

const FRAME_W = 96;
const FRAME_H = 120;

// Layout unificado (17 frames): idle(2) run(6) jump fall hit atk1(2) atk2(2) crouch(2)
export const HERO_LAYOUT = {
    idle: { inicio: 0, cantidad: 2 },
    correr: { inicio: 2, cantidad: 6 },
    saltar: { inicio: 8, cantidad: 1 },
    caer: { inicio: 9, cantidad: 1 },
    golpeado: { inicio: 10, cantidad: 1 },
    ataque1: { inicio: 11, cantidad: 2 },
    ataque2: { inicio: 13, cantidad: 2 },
    agacharse: { inicio: 15, cantidad: 2 },
};

// Enemigos usan el mismo layout, con alias patrulla → correr
const ENEMY_LAYOUT = {
    idle: { inicio: 0, cantidad: 2 },
    patrulla: { inicio: 2, cantidad: 6 },
    saltar: { inicio: 8, cantidad: 1 },
    caer: { inicio: 9, cantidad: 1 },
    golpeado: { inicio: 10, cantidad: 1 },
    ataque: { inicio: 11, cantidad: 2 },
    ataque2: { inicio: 13, cantidad: 2 },
    agacharse: { inicio: 15, cantidad: 2 },
};

// Personajes con sprite sheet disponible (nombre en minusculas → archivo)
const SPRITE_SHEETS = {
    donbu: { src: 'assets/img/sprites-plat/donbu.png' },
    hana: { src: 'assets/img/sprites-plat/hana.png' },
    kira: { src: 'assets/img/sprites-plat/kira.png' },
    pompom: { src: 'assets/img/sprites-plat/pompom.png' },
    orejas: { src: 'assets/img/sprites-plat/orejas.png' },
    rosé: { src: 'assets/img/sprites-plat/rose.png' },
    lina: { src: 'assets/img/sprites-plat/lina.png' },
    pandajuro: { src: 'assets/img/sprites-plat/pandajuro.png' },
};

// Enemigos con sprite sheet (nombre completo en minusculas → archivo)
const ENEMY_SPRITE_SHEETS = {
    siniestra: { src: 'assets/img/sprites-plat/siniestra.png' },
    trasgo: { src: 'assets/img/sprites-plat/trasgo.png' },
    'el errante': { src: 'assets/img/sprites-plat/errante.png' },
    'el profano': { src: 'assets/img/sprites-plat/profano.png' },
    topete: { src: 'assets/img/sprites-plat/topete.png' },
    pototo: { src: 'assets/img/sprites-plat/pototo.png' },
    'la grotesca': { src: 'assets/img/sprites-plat/grotesca.png' },
    'el disonante': { src: 'assets/img/sprites-plat/disonante.png' },
    'el monstruo comelón': { src: 'assets/img/sprites-plat/comelon.png' },
    'la nebulosa': { src: 'assets/img/sprites-plat/nebulosa.png' },
};

// --- Estado ---

let spritesJugador = null; // { idle: [canvas,..], correr: [...], saltar: [...], caer: [...], golpeado: [...] }
let spriteSheetCargado = false;

// --- Carga de sprite sheet ---

function cargarImagen(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo cargar: ' + src));
        img.src = src;
    });
}

function cortarFrames(img, layout) {
    const frames = {};
    for (const [estado, { inicio, cantidad }] of Object.entries(layout)) {
        frames[estado] = [];
        for (let i = 0; i < cantidad; i++) {
            const c = document.createElement('canvas');
            c.width = FRAME_W;
            c.height = FRAME_H;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, (inicio + i) * FRAME_W, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
            frames[estado].push(c);
        }
    }
    return frames;
}

export function iniciarSpritesJugador(nombrePersonaje, colorBase) {
    spriteSheetCargado = false;

    // Generar procedurales inmediatamente como fallback
    generarSpritesProceduralJugador(colorBase);

    // Intentar cargar sprite sheet en background
    const key = nombrePersonaje.toLowerCase();
    const config = SPRITE_SHEETS[key];

    if (config) {
        cargarImagen(config.src)
            .then((img) => {
                spritesJugador = cortarFrames(img, HERO_LAYOUT);
                spriteSheetCargado = true;
            })
            .catch(() => {
                // Mantener procedurales
            });
    }
}

export function obtenerSpriteJugador(estado, frameIndex) {
    if (!spritesJugador || !spritesJugador[estado]) return null;
    const frames = spritesJugador[estado];
    return frames[frameIndex % frames.length];
}

export function obtenerDimensionesSprite() {
    if (spriteSheetCargado) return { ancho: 48, alto: 60 }; // tamaño logico de dibujo (game coords)
    return { ancho: 12, alto: 14 }; // dimensiones procedurales
}

export function usaSpriteSheet() {
    return spriteSheetCargado;
}

// --- Sprites de enemigos ---

let spritesEsbirros = null; // cache procedural
let spritesBoss = null; // cache procedural
let spritesEnemigosSheet = {}; // nombre → { idle: [canvas,..], patrulla: [...], ... }

function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function mezclarColor(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
    const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
    const nb = Math.min(255, Math.max(0, Math.round(b * factor)));
    return '#' + ((1 << 24) | (nr << 16) | (ng << 8) | nb).toString(16).slice(1);
}

function generarSpriteEnemigo(ancho, alto, color, estado, frame) {
    const c = document.createElement('canvas');
    c.width = ancho;
    c.height = alto;
    const ctx = c.getContext('2d');

    const claro = mezclarColor(color, 1.3);
    const oscuro = mezclarColor(color, 0.7);

    const margenX = 1;
    const margenY = 1;
    for (let by = margenY; by < alto - margenY; by++) {
        for (let bx = margenX; bx < ancho - margenX; bx++) {
            px(ctx, bx, by, by === margenY ? claro : color);
        }
    }

    for (let bx = margenX; bx < ancho - margenX; bx++) {
        px(ctx, bx, alto - margenY - 1, oscuro);
    }

    const ojoY = Math.floor(alto * 0.3);
    const ojoIzq = Math.floor(ancho * 0.3);
    const ojoDer = Math.floor(ancho * 0.65);
    px(ctx, ojoIzq, ojoY, '#ffffff');
    px(ctx, ojoIzq + 1, ojoY, '#ffffff');
    px(ctx, ojoDer, ojoY, '#ffffff');
    px(ctx, ojoDer + 1, ojoY, '#ffffff');
    px(ctx, ojoIzq + 1, ojoY, '#111111');
    px(ctx, ojoDer, ojoY, '#111111');

    if (estado === 'idle' && frame === 1) {
        px(ctx, margenX + 1, alto - 1, oscuro);
        px(ctx, ancho - margenX - 2, alto - 1, oscuro);
    }

    if (estado === 'patrulla') {
        const legOff = frame % 2;
        px(ctx, margenX + legOff, alto - 1, oscuro);
        px(ctx, ancho - margenX - 1 - legOff, alto - 1, oscuro);
    }

    return c;
}

export function obtenerSpriteEnemigo(color, ancho, alto, esBoss, estado, frameIndex) {
    const key = color + '_' + ancho + '_' + estado;
    const cache = esBoss ? spritesBoss : spritesEsbirros;
    if (!cache) return null;

    if (!cache[key]) {
        cache[key] = [
            generarSpriteEnemigo(ancho, alto, color, estado, 0),
            generarSpriteEnemigo(ancho, alto, color, estado, 1),
        ];
    }

    return cache[key][frameIndex % cache[key].length];
}

export function iniciarSpritesEnemigos() {
    spritesEsbirros = {};
    spritesBoss = {};
    spritesEnemigosSheet = {};
}

// Carga sprite sheet de un enemigo por nombre (se llama al crear cada enemigo)
export function iniciarSpritesEnemigo(nombreEnemigo) {
    const key = nombreEnemigo.toLowerCase();
    if (spritesEnemigosSheet[key] !== undefined) return; // ya cargado o cargando

    const config = ENEMY_SPRITE_SHEETS[key];
    if (!config) return;

    spritesEnemigosSheet[key] = null; // marcar como cargando
    cargarImagen(config.src)
        .then((img) => {
            spritesEnemigosSheet[key] = cortarFrames(img, ENEMY_LAYOUT);
        })
        .catch(() => {
            // mantener procedurales como fallback
        });
}

export function obtenerSpriteEnemigoSheet(nombreEnemigo, estado, frameIndex) {
    const key = nombreEnemigo.toLowerCase();
    const frames = spritesEnemigosSheet[key];
    if (!frames || !frames[estado]) return null;
    const arr = frames[estado];
    return arr[frameIndex % arr.length];
}

export function obtenerColorBossFase(ratio) {
    if (ratio <= 0.33) return '#e94560';
    if (ratio <= 0.66) return '#f0a030';
    return '#bb86fc';
}

export function limpiarSprites() {
    spritesJugador = null;
    spritesEsbirros = null;
    spritesBoss = null;
    spritesEnemigosSheet = {};
    spriteSheetCargado = false;
}

// --- Fallback: Sprites procedurales del jugador ---

function generarSpriteJugador(color, estado, frame) {
    const c = document.createElement('canvas');
    c.width = 12;
    c.height = 14;
    const ctx = c.getContext('2d');

    const claro = mezclarColor(color, 1.3);
    const oscuro = mezclarColor(color, 0.7);

    const offY = estado === 'idle' && frame === 1 ? -1 : 0;

    // Cabeza
    const headY = 0 + offY;
    for (let hy = 0; hy < 4; hy++) {
        for (let hx = 4; hx < 8; hx++) {
            px(ctx, hx, headY + hy, hy === 0 ? claro : color);
        }
    }
    px(ctx, 4, headY, oscuro);
    px(ctx, 5, headY, oscuro);
    px(ctx, 6, headY, oscuro);
    px(ctx, 7, headY, oscuro);
    px(ctx, 5, headY + 2, '#ffffff');
    px(ctx, 6, headY + 2, '#111111');
    px(ctx, 7, headY + 2, '#ffffff');

    // Cuerpo
    const bodyY = 4 + offY;
    for (let by = 0; by < 5; by++) {
        for (let bx = 3; bx < 9; bx++) {
            px(ctx, bx, bodyY + by, by === 0 ? claro : color);
        }
    }

    // Brazos
    if (estado === 'saltar') {
        px(ctx, 2, bodyY, color);
        px(ctx, 2, bodyY - 1, color);
        px(ctx, 9, bodyY, color);
        px(ctx, 9, bodyY - 1, color);
    } else if (estado === 'caer') {
        px(ctx, 1, bodyY + 1, color);
        px(ctx, 2, bodyY + 1, color);
        px(ctx, 9, bodyY + 1, color);
        px(ctx, 10, bodyY + 1, color);
    } else if (estado === 'golpeado') {
        px(ctx, 2, bodyY + 2, color);
        px(ctx, 9, bodyY + 2, color);
    } else if (estado === 'agacharse') {
        px(ctx, 1, bodyY + 2, color);
        px(ctx, 2, bodyY + 2, color);
        px(ctx, 9, bodyY + 2, color);
        px(ctx, 10, bodyY + 2, color);
    } else {
        const brazoOff = estado === 'correr' ? (frame % 2 === 0 ? 0 : 1) : 0;
        px(ctx, 2, bodyY + 1 + brazoOff, color);
        px(ctx, 9, bodyY + 1 - brazoOff, color);
    }

    // Piernas
    const legY = 9 + offY;
    if (estado === 'correr') {
        const paso = frame % 4;
        if (paso === 0) {
            px(ctx, 4, legY, oscuro);
            px(ctx, 4, legY + 1, oscuro);
            px(ctx, 4, legY + 2, oscuro);
            px(ctx, 4, legY + 3, oscuro);
            px(ctx, 5, legY, oscuro);
            px(ctx, 7, legY, oscuro);
            px(ctx, 7, legY + 1, oscuro);
            px(ctx, 7, legY + 2, oscuro);
        } else if (paso === 1) {
            px(ctx, 4, legY, oscuro);
            px(ctx, 4, legY + 1, oscuro);
            px(ctx, 4, legY + 2, oscuro);
            px(ctx, 4, legY + 3, oscuro);
            px(ctx, 5, legY, oscuro);
            px(ctx, 5, legY + 1, oscuro);
            px(ctx, 6, legY, oscuro);
            px(ctx, 6, legY + 1, oscuro);
            px(ctx, 6, legY + 2, oscuro);
            px(ctx, 6, legY + 3, oscuro);
            px(ctx, 7, legY, oscuro);
            px(ctx, 7, legY + 1, oscuro);
        } else if (paso === 2) {
            px(ctx, 7, legY, oscuro);
            px(ctx, 7, legY + 1, oscuro);
            px(ctx, 7, legY + 2, oscuro);
            px(ctx, 7, legY + 3, oscuro);
            px(ctx, 6, legY, oscuro);
            px(ctx, 4, legY, oscuro);
            px(ctx, 4, legY + 1, oscuro);
            px(ctx, 4, legY + 2, oscuro);
        } else {
            px(ctx, 4, legY, oscuro);
            px(ctx, 4, legY + 1, oscuro);
            px(ctx, 4, legY + 2, oscuro);
            px(ctx, 4, legY + 3, oscuro);
            px(ctx, 5, legY, oscuro);
            px(ctx, 5, legY + 1, oscuro);
            px(ctx, 6, legY, oscuro);
            px(ctx, 6, legY + 1, oscuro);
            px(ctx, 6, legY + 2, oscuro);
            px(ctx, 6, legY + 3, oscuro);
            px(ctx, 7, legY, oscuro);
            px(ctx, 7, legY + 1, oscuro);
        }
    } else if (estado === 'saltar') {
        px(ctx, 5, legY, oscuro);
        px(ctx, 5, legY + 1, oscuro);
        px(ctx, 5, legY + 2, oscuro);
        px(ctx, 6, legY, oscuro);
        px(ctx, 6, legY + 1, oscuro);
        px(ctx, 6, legY + 2, oscuro);
    } else if (estado === 'caer') {
        px(ctx, 3, legY, oscuro);
        px(ctx, 3, legY + 1, oscuro);
        px(ctx, 4, legY + 1, oscuro);
        px(ctx, 4, legY + 2, oscuro);
        px(ctx, 7, legY, oscuro);
        px(ctx, 7, legY + 1, oscuro);
        px(ctx, 8, legY + 1, oscuro);
        px(ctx, 8, legY + 2, oscuro);
    } else if (estado === 'golpeado') {
        px(ctx, 4, legY, oscuro);
        px(ctx, 5, legY, oscuro);
        px(ctx, 6, legY, oscuro);
        px(ctx, 7, legY, oscuro);
        px(ctx, 4, legY + 1, oscuro);
        px(ctx, 7, legY + 1, oscuro);
    } else if (estado === 'agacharse') {
        // Piernas cortas y abiertas (cuclillas)
        px(ctx, 3, legY, oscuro);
        px(ctx, 3, legY + 1, oscuro);
        px(ctx, 4, legY + 1, oscuro);
        px(ctx, 7, legY + 1, oscuro);
        px(ctx, 8, legY, oscuro);
        px(ctx, 8, legY + 1, oscuro);
    } else {
        px(ctx, 4, legY, oscuro);
        px(ctx, 4, legY + 1, oscuro);
        px(ctx, 4, legY + 2, oscuro);
        px(ctx, 4, legY + 3, oscuro);
        px(ctx, 5, legY, oscuro);
        px(ctx, 6, legY, oscuro);
        px(ctx, 7, legY, oscuro);
        px(ctx, 7, legY + 1, oscuro);
        px(ctx, 7, legY + 2, oscuro);
        px(ctx, 7, legY + 3, oscuro);
    }

    return c;
}

function generarSpritesProceduralJugador(colorBase) {
    spritesJugador = {
        idle: [
            generarSpriteJugador(colorBase, 'idle', 0),
            generarSpriteJugador(colorBase, 'idle', 1),
        ],
        correr: [
            generarSpriteJugador(colorBase, 'correr', 0),
            generarSpriteJugador(colorBase, 'correr', 1),
            generarSpriteJugador(colorBase, 'correr', 2),
            generarSpriteJugador(colorBase, 'correr', 3),
        ],
        saltar: [generarSpriteJugador(colorBase, 'saltar', 0)],
        caer: [generarSpriteJugador(colorBase, 'caer', 0)],
        golpeado: [generarSpriteJugador(colorBase, 'golpeado', 0)],
        agacharse: [
            generarSpriteJugador(colorBase, 'agacharse', 0),
            generarSpriteJugador(colorBase, 'agacharse', 1),
        ],
    };
}
