// Habitación 4 — El Abismo: Enemigos patrulla y boss
// Esbirros: 1 stomp = derrotado
// Boss: múltiples stomps, fases de velocidad, barra de vida

import { CFG } from './config.js';
import { resolverColisionX, resolverColisionY, esSolido, enSuelo } from './fisicas.js';
import { ENEMIGOS } from '../../enemigos.js';

const TAM = CFG.tiles.tamano;
const ENE = CFG.enemigos;
const BOSS = CFG.boss;
const COL = CFG.render;

// --- Pool de esbirros disponibles ---

const ESBIRROS = Object.values(ENEMIGOS).filter(function (e) {
    return e.tier === 'esbirro';
});

// --- Clase Enemigo Platformer ---

function crearEnemigo(col, fila, esBoss) {
    const ancho = esBoss ? 18 : 12;
    const alto = esBoss ? 18 : 12;

    // Seleccionar un esbirro aleatorio o el boss
    let datos;
    let vidaMax;

    if (esBoss) {
        // Buscar un élite para el boss
        const elites = Object.values(ENEMIGOS).filter(function (e) {
            return e.tier === 'elite';
        });
        datos = elites[Math.floor(Math.random() * elites.length)];
        vidaMax = datos ? datos.vidaMax : 100;
    } else {
        datos = ESBIRROS.length > 0 ? ESBIRROS[Math.floor(Math.random() * ESBIRROS.length)] : null;
        vidaMax = 1; // 1 stomp = derrotado
    }

    // Determinar nombre legible
    let nombre = 'Esbirro';
    if (datos) {
        nombre = datos.nombre;
    } else if (esBoss) {
        nombre = 'Boss';
    }

    return {
        x: col * TAM + (TAM - ancho) / 2,
        y: fila * TAM + (TAM - alto),
        ancho,
        alto,
        vx: 0,
        vy: 0,
        direccion: 1,
        velocidad: esBoss ? BOSS.velocidadBase : ENE.velocidadPatrulla,
        esBoss,
        vivo: true,
        vidaActual: vidaMax,
        vidaMax,
        datos,
        nombre,
        framesMuerte: 0,
        cooldownAtaque: 0,
    };
}

let enemigos = [];
let bossVivo = true;

export function iniciarEnemigos(spawnsEnemigos, spawnBoss) {
    enemigos = [];
    bossVivo = true;

    // Crear esbirros
    for (let i = 0; i < spawnsEnemigos.length; i++) {
        const spawn = spawnsEnemigos[i];
        enemigos.push(crearEnemigo(spawn.col, spawn.fila, false));
    }

    // Crear boss
    if (spawnBoss) {
        enemigos.push(crearEnemigo(spawnBoss.col, spawnBoss.fila, true));
    }
}

export function actualizarEnemigos() {
    for (let i = 0; i < enemigos.length; i++) {
        const e = enemigos[i];
        if (!e.vivo) {
            // Animación de muerte
            if (e.framesMuerte > 0) {
                e.framesMuerte--;
            }
            continue;
        }

        if (e.cooldownAtaque > 0) e.cooldownAtaque--;

        // Movimiento de patrulla
        let vel = e.velocidad;

        // Boss: aumentar velocidad según fase
        if (e.esBoss && e.vidaMax > 0) {
            const ratio = e.vidaActual / e.vidaMax;
            if (ratio <= BOSS.fasesCambio[1]) {
                vel *= BOSS.velocidadFases[1];
            } else if (ratio <= BOSS.fasesCambio[0]) {
                vel *= BOSS.velocidadFases[0];
            }
        }

        e.vx = vel * e.direccion;

        // Colisión horizontal
        const nuevaX = resolverColisionX(e.x, e.y, e.ancho, e.alto, e.vx);
        if (nuevaX === e.x && e.vx !== 0) {
            // Chocó con pared: girar
            e.direccion *= -1;
        } else {
            // Verificar precipicio adelante
            const bordeX = e.direccion > 0 ? nuevaX + e.ancho + 2 : nuevaX - 2;
            const pieY = e.y + e.alto + 2;
            if (!esSolido(bordeX, pieY) && enSuelo(e.x, e.y, e.ancho, e.alto)) {
                // Precipicio: girar
                e.direccion *= -1;
            } else {
                e.x = nuevaX;
            }
        }

        // Gravedad
        e.vy += CFG.fisicas.gravedad;
        if (e.vy > CFG.fisicas.velocidadMaxCaida) e.vy = CFG.fisicas.velocidadMaxCaida;

        const resY = resolverColisionY(e.x, e.y, e.ancho, e.alto, e.vy);
        e.y = resY.y;
        e.vy = resY.vy;
    }
}

export function renderizarEnemigos(ctx, camaraX) {
    for (let i = 0; i < enemigos.length; i++) {
        const e = enemigos[i];

        // Animación de muerte: encogimiento
        if (!e.vivo) {
            if (e.framesMuerte > 0) {
                const escala = e.framesMuerte / 20;
                const px = Math.round(e.x - camaraX + (e.ancho * (1 - escala)) / 2);
                const py = Math.round(e.y + e.alto * (1 - escala));
                const w = Math.round(e.ancho * escala);
                const h = Math.round(e.alto * escala);
                ctx.fillStyle = e.esBoss ? COL.colorBoss : COL.colorEnemigo;
                ctx.globalAlpha = escala;
                ctx.fillRect(px, py, w, h);
                ctx.globalAlpha = 1;
            }
            continue;
        }

        const px = Math.round(e.x - camaraX);
        const py = Math.round(e.y);

        // Cuerpo
        ctx.fillStyle = e.esBoss ? COL.colorBoss : COL.colorEnemigo;
        ctx.fillRect(px, py, e.ancho, e.alto);

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(px, py, e.ancho, 2);

        // Ojos
        const ojoY = py + (e.esBoss ? 5 : 3);
        ctx.fillStyle = '#fff';
        if (e.direccion > 0) {
            ctx.fillRect(px + e.ancho - 5, ojoY, 2, 2);
            ctx.fillRect(px + e.ancho - 9, ojoY, 2, 2);
        } else {
            ctx.fillRect(px + 3, ojoY, 2, 2);
            ctx.fillRect(px + 7, ojoY, 2, 2);
        }

        // Barra de vida del boss
        if (e.esBoss) {
            const barraAncho = e.ancho + 8;
            const barraAlto = 3;
            const barraX = px - 4;
            const barraY = py - 8;
            const ratio = e.vidaActual / e.vidaMax;

            // Fondo
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(barraX, barraY, barraAncho, barraAlto);

            // Vida
            ctx.fillStyle = ratio > 0.33 ? COL.colorBoss : '#e94560';
            ctx.fillRect(barraX, barraY, Math.round(barraAncho * ratio), barraAlto);

            // Nombre
            ctx.fillStyle = '#fff';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(e.nombre, px + e.ancho / 2, barraY - 2);
            ctx.textAlign = 'start';
        }
    }
}

// Obtener enemigos vivos para detección de colisiones
export function obtenerEnemigosVivos() {
    const vivos = [];
    for (let i = 0; i < enemigos.length; i++) {
        if (enemigos[i].vivo) vivos.push(enemigos[i]);
    }
    return vivos;
}

// Dañar enemigo por stomp
export function stomperEnemigo(enemigo, dano) {
    if (!enemigo.vivo) return false;

    if (enemigo.esBoss) {
        enemigo.vidaActual -= dano;
        if (enemigo.vidaActual <= 0) {
            enemigo.vidaActual = 0;
            enemigo.vivo = false;
            enemigo.framesMuerte = 20;
            bossVivo = false;
            return true; // boss derrotado
        }
        return false;
    }

    // Esbirro: 1 stomp = derrotado
    enemigo.vivo = false;
    enemigo.framesMuerte = 20;
    return false;
}

export function esBossVivo() {
    return bossVivo;
}

export function obtenerDanoEnemigo(enemigo) {
    if (!enemigo.datos || !enemigo.datos.ataques || enemigo.datos.ataques.length === 0) {
        return 10;
    }
    return enemigo.datos.ataques[0].dano;
}

export function limpiarEnemigos() {
    enemigos = [];
    bossVivo = true;
}
