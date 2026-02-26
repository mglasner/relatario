// Habitacion 4 — El Abismo: Enemigos patrulla y boss
// Esbirros: 1 stomp = derrotado
// Boss: multiples stomps, fases de velocidad, barra de vida

import { CFG } from './config.js';
import {
    resolverColisionX,
    resolverColisionY,
    esSolido,
    enSuelo,
    haySueloDebajo,
} from './fisicas.js';
import { ENEMIGOS } from '../../enemigos.js';
import {
    obtenerSpriteEnemigo,
    obtenerSpriteEnemigoSheet,
    obtenerColorBossFase,
    iniciarSpritesEnemigo,
} from './spritesPlat.js';
import {
    calcularEscala,
    calcularHitbox,
    calcularSpriteDrawSize,
    calcularVelocidadPlat,
} from './escaladoPlat.js';
import { initAtaqueBoss, actualizarAtaqueBoss } from './ataquesBoss.js';

const TAM = CFG.tiles.tamano;
const BOSS = CFG.boss;
const COL = CFG.render;
const PAT = CFG.patrones;

// --- Pool de esbirros disponibles ---

const ESBIRROS = Object.values(ENEMIGOS).filter(function (e) {
    return e.tier === 'esbirro';
});
const ELITES = Object.values(ENEMIGOS).filter(function (e) {
    return e.tier === 'elite';
});

// --- Clase Enemigo Platformer ---

function crearEnemigo(col, fila, esBossFlag, datos, patron) {
    const vidaMax = esBossFlag ? (datos ? datos.vidaMax : 100) : 1;

    // Determinar nombre legible
    let nombre = 'Esbirro';
    if (datos) {
        nombre = datos.nombre;
    } else if (esBossFlag) {
        nombre = 'Boss';
    }

    // Calcular escala y dimensiones desde estatura del enemigo
    let estatura = 1.0;
    if (datos) estatura = datos.estatura;
    else if (esBossFlag) estatura = 1.8;

    const escalaEne = calcularEscala(estatura);
    const hb = calcularHitbox(escalaEne);
    const sd = calcularSpriteDrawSize(escalaEne);

    // Calcular velocidad desde atributo velocidad del enemigo
    const velAttr = datos ? datos.velocidad : 5;
    const velFinal = calcularVelocidadPlat(velAttr);

    // Cargar sprite sheet del enemigo (si existe)
    iniciarSpritesEnemigo(nombre);

    return {
        x: col * TAM + (TAM - hb.ancho) / 2,
        y: fila * TAM + (TAM - hb.alto),
        ancho: hb.ancho,
        alto: hb.alto,
        spriteDrawW: sd.ancho,
        spriteDrawH: sd.alto,
        vx: 0,
        vy: 0,
        direccion: 1,
        velocidad: velFinal,
        esBoss: esBossFlag,
        vivo: true,
        vidaActual: vidaMax,
        vidaMax,
        datos,
        nombre,
        framesMuerte: 0,
        cooldownAtaque: 0,
        invulStomp: 0,
        stunFrames: 0,
        timerBloqueoInversion: 0,
        frameAnim: 0,
        contadorAnim: 0,
        patron: esBossFlag ? 'patrullero' : patron || 'patrullero',
        saltarinTimer:
            patron === 'saltarin' ? Math.floor(Math.random() * PAT.saltarinIntervalo) : 0,
        centinelaEstado: 'marcha',
        centinelaTimer:
            patron === 'centinela'
                ? PAT.centinelaMarchaMin +
                  Math.floor(Math.random() * (PAT.centinelaMarchaMax - PAT.centinelaMarchaMin))
                : 0,
    };
}

let enemigos = [];
let bossVivo = true;

export function iniciarEnemigos(spawnsEnemigos, spawnBoss) {
    enemigos = [];
    bossVivo = true;

    // Crear esbirros: uno de cada tipo, sin repetir
    const esbirrosDisponibles = ESBIRROS.slice();
    for (let i = esbirrosDisponibles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [esbirrosDisponibles[i], esbirrosDisponibles[j]] = [
            esbirrosDisponibles[j],
            esbirrosDisponibles[i],
        ];
    }

    // Barajar patrones de patrulla (uno distinto por esbirro, cíclico si hay más de 3)
    const patronesBase = ['patrullero', 'saltarin', 'centinela'];
    for (let i = patronesBase.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [patronesBase[i], patronesBase[j]] = [patronesBase[j], patronesBase[i]];
    }

    const totalEsbirros = Math.min(spawnsEnemigos.length, esbirrosDisponibles.length);
    for (let i = 0; i < totalEsbirros; i++) {
        const spawn = spawnsEnemigos[i];
        const patron = patronesBase[i % patronesBase.length];
        enemigos.push(crearEnemigo(spawn.col, spawn.fila, false, esbirrosDisponibles[i], patron));
    }
    // Crear boss: elegir un elite aleatorio
    if (spawnBoss) {
        const bossData = ELITES[Math.floor(Math.random() * ELITES.length)];
        const boss = crearEnemigo(spawnBoss.col, spawnBoss.fila, true, bossData);
        initAtaqueBoss(boss);
        enemigos.push(boss);
    }
}

// Movimiento horizontal con detección de paredes y precipicios.
// COOLDOWN_INVERSION evita que el enemigo oscile izquierda/derecha
// en plataformas angostas o bordes con vacío a ambos lados.
const COOLDOWN_INVERSION = 8; // frames de espera entre inversiones de dirección

function girarDireccion(e) {
    e.direccion *= -1;
    e.timerBloqueoInversion = COOLDOWN_INVERSION;
}

function moverPatrulla(e, enPiso) {
    const nuevaX = resolverColisionX(e.x, e.y, e.ancho, e.alto, e.vx, enPiso);
    if (nuevaX === e.x && e.vx !== 0) {
        // Chocó contra una pared: girar con cooldown
        if (e.timerBloqueoInversion <= 0) girarDireccion(e);
    } else {
        const bordeX = e.direccion > 0 ? nuevaX + e.ancho + 2 : nuevaX - 2;
        const pieY = e.y + e.alto + 2;
        if (!esSolido(bordeX, pieY) && enPiso) {
            // Precipicio adelante: girar sin mover (con cooldown).
            // Con timer activo no moverse — el saltarín escapa por su propio timer;
            // el boss nunca arriesga caer al abismo.
            if (e.timerBloqueoInversion <= 0) girarDireccion(e);
        } else {
            e.x = nuevaX;
        }
    }
}

export function actualizarEnemigos(jugadorPos) {
    // Centro del jugador (para ataques del boss)
    const jugCx = jugadorPos ? jugadorPos.x + jugadorPos.ancho / 2 : 0;
    const jugCy = jugadorPos ? jugadorPos.y + jugadorPos.alto / 2 : 0;

    for (let i = 0; i < enemigos.length; i++) {
        const e = enemigos[i];
        if (!e.vivo) {
            // Animacion de muerte
            if (e.framesMuerte > 0) {
                e.framesMuerte--;
            }
            continue;
        }

        if (e.cooldownAtaque > 0) e.cooldownAtaque--;
        if (e.invulStomp > 0) e.invulStomp--;
        if (e.timerBloqueoInversion > 0) e.timerBloqueoInversion--;
        if (e.stunFrames > 0) {
            e.stunFrames--;
            // Durante stun: solo aplicar gravedad, no patrullar
            e.vx = 0;
            e.vy += CFG.fisicas.gravedad;
            if (e.vy > CFG.fisicas.velocidadMaxCaida) e.vy = CFG.fisicas.velocidadMaxCaida;
            const resY = resolverColisionY(e.x, e.y, e.ancho, e.alto, e.vy);
            e.y = resY.y;
            e.vy = resY.vy;
            // El stun también interrumpe ataques del boss
            if (e.esBoss) actualizarAtaqueBoss(e, jugCx, jugCy);
            continue;
        }

        // Velocidad base (con fases del boss)
        let vel = e.velocidad;
        if (e.esBoss && e.vidaMax > 0) {
            const ratio = e.vidaActual / e.vidaMax;
            if (ratio <= BOSS.fasesCambio[1]) {
                vel *= BOSS.velocidadFases[1];
            } else if (ratio <= BOSS.fasesCambio[0]) {
                vel *= BOSS.velocidadFases[0];
            }
        }

        // Movimiento segun patron (saltarín ignora plataformas como suelo)
        const ignorarPlat = e.patron === 'saltarin';
        const enPiso = enSuelo(e.x, e.y, e.ancho, e.alto, ignorarPlat);

        if (e.esBoss) {
            // Boss: la máquina de ataques puede anular la patrulla
            const enAtaque = actualizarAtaqueBoss(e, jugCx, jugCy);
            if (!enAtaque) {
                // Patrulla normal cuando no está atacando
                e.vx = vel * e.direccion;
                moverPatrulla(e, enPiso);
            }
        } else if (e.patron === 'centinela') {
            // Centinela: alterna entre marcha y pausa, elige dirección al azar
            if (e.centinelaEstado === 'pausa') {
                e.vx = 0;
                e.centinelaTimer--;
                if (e.centinelaTimer <= 0) {
                    e.centinelaEstado = 'marcha';
                    e.direccion = Math.random() < 0.5 ? 1 : -1;
                    e.centinelaTimer =
                        PAT.centinelaMarchaMin +
                        Math.floor(
                            Math.random() * (PAT.centinelaMarchaMax - PAT.centinelaMarchaMin)
                        );
                }
            } else {
                e.vx = vel * e.direccion;
                moverPatrulla(e, enPiso);
                e.centinelaTimer--;
                if (e.centinelaTimer <= 0) {
                    e.centinelaEstado = 'pausa';
                    e.centinelaTimer =
                        PAT.centinelaPausaMin +
                        Math.floor(Math.random() * (PAT.centinelaPausaMax - PAT.centinelaPausaMin));
                }
            }
        } else if (e.patron === 'saltarin') {
            // Saltarín: camina en el suelo, salta avanzando (con protección anti-abismo)
            if (enPiso) {
                e.vx = vel * e.direccion;
                moverPatrulla(e, enPiso);
                e.saltarinTimer--;
                if (e.saltarinTimer <= 0) {
                    e.vy = PAT.saltarinSalto;
                    // Jitter ±25% para evitar resonancia con el ciclo de patrulla
                    e.saltarinTimer = Math.floor(
                        PAT.saltarinIntervalo * (0.75 + Math.random() * 0.5)
                    );
                }
            } else {
                // En el aire: avanzar solo si hay suelo adelante (no caer en abismos)
                const bordeX = e.direccion > 0 ? e.x + e.ancho + 2 : e.x - 2;
                if (haySueloDebajo(bordeX, e.y + e.alto, 5, true)) {
                    e.vx = vel * e.direccion;
                    const nuevaX = resolverColisionX(e.x, e.y, e.ancho, e.alto, e.vx, false);
                    if (nuevaX !== e.x) e.x = nuevaX;
                } else {
                    e.vx = 0;
                }
            }
        } else {
            // Patrullero: movimiento continuo
            e.vx = vel * e.direccion;
            moverPatrulla(e, enPiso);
        }

        // Gravedad
        e.vy += CFG.fisicas.gravedad;
        if (e.vy > CFG.fisicas.velocidadMaxCaida) e.vy = CFG.fisicas.velocidadMaxCaida;

        const resY = resolverColisionY(e.x, e.y, e.ancho, e.alto, e.vy, ignorarPlat);
        e.y = resY.y;
        e.vy = resY.vy;

        // Animacion (ciclo de 12 para soportar 2 y 4 frames)
        e.contadorAnim++;
        if (e.contadorAnim >= 10) {
            e.contadorAnim = 0;
            e.frameAnim = (e.frameAnim + 1) % 12;
        }
    }
}

export function renderizarEnemigos(ctx, camaraX, camaraY) {
    for (let i = 0; i < enemigos.length; i++) {
        const e = enemigos[i];
        const sdw = e.spriteDrawW;
        const sdh = e.spriteDrawH;

        // Animacion de muerte: encogimiento
        if (!e.vivo) {
            if (e.framesMuerte > 0) {
                const escalaMuerte = e.framesMuerte / 20;
                ctx.globalAlpha = escalaMuerte;

                // Si tiene sprite sheet, encoger el sprite completo
                const sheetSprite = obtenerSpriteEnemigoSheet(e.nombre, 'golpeado', 0);
                if (sheetSprite) {
                    const sw = Math.round(sdw * escalaMuerte);
                    const sh = Math.round(sdh * escalaMuerte);
                    const sx = Math.round(
                        e.x - camaraX - (sdw - e.ancho) / 2 + (sdw * (1 - escalaMuerte)) / 2
                    );
                    const sy = Math.round(
                        e.y - camaraY - (sdh - e.alto) + sdh * (1 - escalaMuerte)
                    );
                    ctx.drawImage(sheetSprite, sx, sy, sw, sh);
                } else {
                    const drawX = Math.round(e.x - camaraX + (e.ancho * (1 - escalaMuerte)) / 2);
                    const drawY = Math.round(e.y - camaraY + e.alto * (1 - escalaMuerte));
                    const w = Math.round(e.ancho * escalaMuerte);
                    const h = Math.round(e.alto * escalaMuerte);
                    ctx.fillStyle = e.esBoss ? COL.colorBoss : COL.colorEnemigo;
                    ctx.fillRect(drawX, drawY, w, h);
                }
                ctx.globalAlpha = 1;
            }
            continue;
        }

        // Parpadeo de invulnerabilidad post-stomp (igual que el jugador)
        if (e.invulStomp > 0 && Math.floor(e.invulStomp / 4) % 2 === 0) continue;

        const hitboxX = Math.round(e.x - camaraX);
        const hitboxY = Math.round(e.y - camaraY);

        // Estado de animacion (stun o quieto → idle, moviéndose → patrulla)
        const estadoAnim = e.stunFrames <= 0 && Math.abs(e.vx) > 0.1 ? 'patrulla' : 'idle';

        // Intentar sprite sheet primero
        const spriteSheet = obtenerSpriteEnemigoSheet(e.nombre, estadoAnim, e.frameAnim);
        if (spriteSheet) {
            // Centrar sprite escalado sobre hitbox (pies alineados, centrado horizontal)
            const offX = hitboxX - (sdw - e.ancho) / 2;
            const offY = hitboxY - (sdh - e.alto);
            ctx.save();
            if (e.direccion < 0) {
                ctx.translate(offX + sdw, offY);
                ctx.scale(-1, 1);
                ctx.drawImage(spriteSheet, 0, 0, sdw, sdh);
            } else {
                ctx.drawImage(spriteSheet, offX, offY, sdw, sdh);
            }
            ctx.restore();
            continue;
        }

        // Fallback: sprite procedural
        let colorActual = e.esBoss ? COL.colorBoss : COL.colorEnemigo;
        if (e.esBoss && e.vidaMax > 0) {
            colorActual = obtenerColorBossFase(e.vidaActual / e.vidaMax);
        }

        const sprite = obtenerSpriteEnemigo(
            colorActual,
            e.ancho,
            e.alto,
            e.esBoss,
            estadoAnim,
            e.frameAnim
        );

        if (sprite) {
            ctx.save();
            if (e.direccion < 0) {
                ctx.translate(hitboxX + e.ancho, hitboxY);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0);
            } else {
                ctx.drawImage(sprite, hitboxX, hitboxY);
            }
            ctx.restore();
        } else {
            // Fallback ultimo: rectangulo basico
            ctx.fillStyle = colorActual;
            ctx.fillRect(hitboxX, hitboxY, e.ancho, e.alto);

            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(hitboxX, hitboxY, e.ancho, 2);

            const ojoY = hitboxY + Math.round(e.alto * 0.3);
            ctx.fillStyle = '#fff';
            if (e.direccion > 0) {
                ctx.fillRect(hitboxX + e.ancho - 5, ojoY, 2, 2);
                ctx.fillRect(hitboxX + e.ancho - 9, ojoY, 2, 2);
            } else {
                ctx.fillRect(hitboxX + 3, ojoY, 2, 2);
                ctx.fillRect(hitboxX + 7, ojoY, 2, 2);
            }
        }
    }
}

// Obtener enemigos vivos para deteccion de colisiones
export function obtenerEnemigosVivos() {
    const vivos = [];
    for (let i = 0; i < enemigos.length; i++) {
        if (enemigos[i].vivo) vivos.push(enemigos[i]);
    }
    return vivos;
}

// Fase del boss segun ratio de vida (0 = sano, 1 = herido, 2 = critico)
function faseBoss(ratio) {
    if (ratio <= BOSS.fasesCambio[1]) return 2;
    if (ratio <= BOSS.fasesCambio[0]) return 1;
    return 0;
}

const SIN_EFECTO = { bossDestruido: false, cambioFase: false, bloqueado: false };
const BLOQUEADO = { bossDestruido: false, cambioFase: false, bloqueado: true };

// Danar enemigo por stomp — retorna { bossDestruido, cambioFase }
export function stomperEnemigo(enemigo, dano) {
    if (!enemigo.vivo) return SIN_EFECTO;

    if (enemigo.esBoss) {
        // Boss con invulnerabilidad post-stomp: ignorar si aun esta protegido
        if (enemigo.invulStomp > 0) return BLOQUEADO;

        const faseAntes = faseBoss(enemigo.vidaActual / enemigo.vidaMax);
        enemigo.vidaActual -= dano;

        // Activar invulnerabilidad y stun post-stomp
        enemigo.invulStomp = CFG.enemigos.invulStomp;
        enemigo.stunFrames = CFG.enemigos.stunStomp;

        if (enemigo.vidaActual <= 0) {
            enemigo.vidaActual = 0;
            enemigo.vivo = false;
            enemigo.framesMuerte = 20;
            bossVivo = false;
            return { bossDestruido: true, cambioFase: false };
        }

        const faseDespues = faseBoss(enemigo.vidaActual / enemigo.vidaMax);
        return { bossDestruido: false, cambioFase: faseDespues > faseAntes };
    }

    // Esbirro: 1 stomp = derrotado
    enemigo.vivo = false;
    enemigo.framesMuerte = 20;
    return SIN_EFECTO;
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

// Obtener info del boss para el HUD
export function obtenerInfoBoss() {
    for (let i = 0; i < enemigos.length; i++) {
        const e = enemigos[i];
        if (e.esBoss && e.vivo) {
            return {
                nombre: e.nombre,
                vidaActual: e.vidaActual,
                vidaMax: e.vidaMax,
                x: e.x,
                y: e.y,
                ancho: e.ancho,
                alto: e.alto,
            };
        }
    }
    return null;
}

export function obtenerBossRef() {
    for (let i = 0; i < enemigos.length; i++) {
        if (enemigos[i].esBoss && enemigos[i].vivo) return enemigos[i];
    }
    return null;
}

export function limpiarEnemigos() {
    enemigos = [];
    bossVivo = true;
}
