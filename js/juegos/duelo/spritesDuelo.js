// El Duelo — Carga y gestión de sprites de luchadores
// Reutiliza los sprite sheets del Abismo (HERO_LAYOUT / ENEMY_LAYOUT)

const FRAME_W = 96;
const FRAME_H = 120;

// Layout de héroes (17 frames)
const HERO_LAYOUT = {
    idle: { inicio: 0, cantidad: 2 },
    correr: { inicio: 2, cantidad: 6 },
    saltar: { inicio: 8, cantidad: 1 },
    caer: { inicio: 9, cantidad: 1 },
    golpeado: { inicio: 10, cantidad: 1 },
    ataque1: { inicio: 11, cantidad: 2 },
    ataque2: { inicio: 13, cantidad: 2 },
    agacharse: { inicio: 15, cantidad: 2 },
};

// Layout de enemigos (17 frames)
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

// Personajes con sprite sheet (mismos que El Abismo)
const SPRITE_SHEETS = {
    donbu: 'assets/img/sprites-plat/donbu.png',
    hana: 'assets/img/sprites-plat/hana.png',
    kira: 'assets/img/sprites-plat/kira.png',
    pompom: 'assets/img/sprites-plat/pompom.png',
    orejas: 'assets/img/sprites-plat/orejas.png',
    rosé: 'assets/img/sprites-plat/rose.png',
    lina: 'assets/img/sprites-plat/lina.png',
    pandajuro: 'assets/img/sprites-plat/pandajuro.png',
};

const ENEMY_SPRITE_SHEETS = {
    siniestra: 'assets/img/sprites-plat/siniestra.png',
    trasgo: 'assets/img/sprites-plat/trasgo.png',
    'el errante': 'assets/img/sprites-plat/errante.png',
    'el profano': 'assets/img/sprites-plat/profano.png',
    topete: 'assets/img/sprites-plat/topete.png',
    pototo: 'assets/img/sprites-plat/pototo.png',
    'la grotesca': 'assets/img/sprites-plat/grotesca.png',
    'el disonante': 'assets/img/sprites-plat/disonante.png',
    'el monstruo comelón': 'assets/img/sprites-plat/comelon.png',
    'la nebulosa': 'assets/img/sprites-plat/nebulosa.png',
};

// Cache de sprites cargados (nombre → { estado: [canvas, ...] })
const cache = {};

function cargarImagen(src) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
            resolve(img);
        };
        img.onerror = function () {
            reject(new Error('No se pudo cargar: ' + src));
        };
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

/**
 * Mapea estado del luchador → estado del sprite sheet
 */
function mapearEstado(estadoLuchador, esVillano) {
    switch (estadoLuchador) {
        case 'idle':
        case 'bloquear':
            return 'idle';
        case 'caminar':
            return esVillano ? 'patrulla' : 'correr';
        case 'saltar':
            return 'saltar';
        case 'caer':
            return 'caer';
        case 'golpeado':
            return 'golpeado';
        case 'atacando':
            return esVillano ? 'ataque' : 'ataque1';
        case 'agachado':
            return 'agacharse';
        default:
            return 'idle';
    }
}

/**
 * Carga sprite sheet para un luchador
 */
export function cargarSpritesLuchador(luchador) {
    const key = luchador.nombre.toLowerCase();

    // Buscar en heroes primero, luego enemigos
    const srcHeroe = SPRITE_SHEETS[key];
    const srcEnemigo = ENEMY_SPRITE_SHEETS[key];
    const src = srcHeroe || srcEnemigo;
    const layout = srcHeroe ? HERO_LAYOUT : ENEMY_LAYOUT;

    if (!src) return;

    if (cache[key]) {
        luchador.sprites = cache[key];
        luchador.spriteSheet = true;
        return;
    }

    cargarImagen(src)
        .then(function (img) {
            const frames = cortarFrames(img, layout);
            cache[key] = frames;
            luchador.sprites = frames;
            luchador.spriteSheet = true;
        })
        .catch(function () {
            // Mantener sin sprites (se usará renderizado procedural)
        });
}

/**
 * Obtiene el frame de sprite actual para un luchador
 */
export function obtenerSprite(luchador) {
    if (!luchador.sprites) return null;

    let estadoSprite = mapearEstado(luchador.estado, luchador.esVillano);

    // Golpe fuerte usa ataque2 si existe
    if (luchador.estado === 'atacando' && luchador.tipoAtaque === 'fuerte') {
        estadoSprite = 'ataque2';
    }

    const frames = luchador.sprites[estadoSprite];
    if (!frames || frames.length === 0) {
        // Fallback a idle
        const fallback = luchador.sprites.idle;
        if (!fallback) return null;
        return fallback[luchador.frameAnim % fallback.length];
    }

    return frames[luchador.frameAnim % frames.length];
}

export function limpiarSprites() {
    // No limpiar el cache global (se reutiliza entre partidas)
}
