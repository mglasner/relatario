// Habitacion 4 — El Abismo: Jugador platformer
// Estados: idle, correr, saltar, caer, golpeado, agacharse

import { CFG } from './config.js';
import { resolverColisionX, resolverColisionY, esMeta, esSolido } from './fisicas.js';
import { obtenerSpawnJugador } from './nivel.js';
import { obtenerSpriteJugador, HERO_LAYOUT } from './spritesPlat.js';
import { notificarVidaCambio, notificarJugadorMuerto } from '../../eventos.js';
import {
    calcularEscala,
    calcularHitbox,
    calcularSpriteDrawSize,
    calcularVelocidadPlat,
    calcularFuerzaSalto,
} from './escaladoPlat.js';

const FIS = CFG.fisicas;
const TAM = CFG.tiles.tamano;
const SPR = CFG.sprites;

// Estado del jugador platformer
let x = 0;
let y = 0;
let ancho = 12;
let alto = 14;
let spriteDrawW = 48;
let spriteDrawH = 60;
let velocidadMov = FIS.velocidadJugador;
let fuerzaSaltoActual = FIS.fuerzaSalto;
let vx = 0;
let vy = 0;
let direccion = 1; // 1=derecha, -1=izquierda
let estaEnSuelo = false;
let coyoteFrames = 0;
let jumpBufferFrames = 0;
let invulFrames = 0;
let knockbackVx = 0;
let colorJugador = '#bb86fc';
let jugadorRef = null;
let teclasRef = {};

// Estado de animacion
let estado = 'idle'; // idle, correr, saltar, caer, golpeado, agacharse
let frameAnim = 0;
let contadorAnim = 0;
let estabaSuelo = false; // para detectar aterrizaje
let yAnterior = 0; // posicion Y del frame anterior (para validar stomp "desde arriba")

// Agacharse
let altoNormal = 14;
let estaAgachado = false;

// Jump cut (salto variable)
let saltoCortado = false;

// Escala del jugador (para stomp proporcional)
let escalaJugador = 1;

// Velocidad base sin modificadores (para restaurar tras buff)
let velocidadBase = FIS.velocidadJugador;

// Power-up activo
let powerupActivo = null; // 'doble-salto' | 'escudo' | 'invu-velocidad' | null
let powerupFrames = 0; // frames restantes del buff
let doblesSaltoDisp = 0; // 0 o 1 (recarga al aterrizar)
let escudoActivo = false;

export function iniciarJugador(jugador, teclas) {
    jugadorRef = jugador;
    teclasRef = teclas;
    colorJugador = jugador.colorHud || '#bb86fc';

    // Calcular dimensiones y velocidad proporcionales
    const esc = calcularEscala(jugador.estatura);
    escalaJugador = esc;
    const hb = calcularHitbox(esc);
    ancho = hb.ancho;
    alto = hb.alto;
    altoNormal = alto;
    const sd = calcularSpriteDrawSize(esc);
    spriteDrawW = sd.ancho;
    spriteDrawH = sd.alto;
    velocidadMov = calcularVelocidadPlat(jugador.velocidad);
    velocidadBase = velocidadMov;
    fuerzaSaltoActual = calcularFuerzaSalto(esc);

    const spawn = obtenerSpawnJugador();
    x = spawn.col * TAM + (TAM - ancho) / 2;
    y = spawn.fila * TAM + (TAM - alto);
    vx = 0;
    vy = 0;
    direccion = 1;
    estaEnSuelo = true;
    coyoteFrames = 0;
    jumpBufferFrames = 0;
    invulFrames = 0;
    knockbackVx = 0;
    estaAgachado = false;
    saltoCortado = false;
    estado = 'idle';
    frameAnim = 0;
    contadorAnim = 0;
    estabaSuelo = true;
    yAnterior = y;
    powerupActivo = null;
    powerupFrames = 0;
    doblesSaltoDisp = 0;
    escudoActivo = false;
}

// --- Sub-funciones de actualizacion ---

function procesarAgacharse() {
    const quiereAgacharse = !!teclasRef['ArrowDown'] && estaEnSuelo && knockbackVx === 0;
    if (quiereAgacharse && !estaAgachado) {
        estaAgachado = true;
        const altoAgachado = Math.round(altoNormal * 0.6);
        y += alto - altoAgachado;
        alto = altoAgachado;
    } else if (!quiereAgacharse && estaAgachado) {
        const nuevaY = y - (altoNormal - alto);
        const margen = 2;
        if (!esSolido(x + margen, nuevaY) && !esSolido(x + ancho - margen, nuevaY)) {
            estaAgachado = false;
            y = nuevaY;
            alto = altoNormal;
        }
    }
}

function procesarMovimientoX() {
    let inputX = 0;
    if (!estaAgachado) {
        if (teclasRef['ArrowLeft']) inputX -= 1;
        if (teclasRef['ArrowRight']) inputX += 1;
    }

    if (knockbackVx !== 0) {
        vx = knockbackVx;
        knockbackVx *= 0.85;
        if (Math.abs(knockbackVx) < 0.3) knockbackVx = 0;
    } else {
        vx = inputX * velocidadMov;
    }

    if (inputX !== 0) direccion = inputX;
    x = resolverColisionX(x, y, ancho, alto, vx, estaEnSuelo);
    return inputX;
}

function procesarSalto() {
    const quiereSubir = !estaAgachado && teclasRef['ArrowUp'];
    if (quiereSubir) {
        jumpBufferFrames = FIS.jumpBuffer;
    } else if (jumpBufferFrames > 0) {
        jumpBufferFrames--;
    }

    if (estaEnSuelo) {
        coyoteFrames = FIS.coyoteTime;
        // Recargar doble salto al aterrizar
        if (powerupActivo === 'doble-salto') doblesSaltoDisp = 1;
    } else if (coyoteFrames > 0) {
        coyoteFrames--;
    }

    if (!estaAgachado && jumpBufferFrames > 0 && coyoteFrames > 0) {
        vy = fuerzaSaltoActual;
        jumpBufferFrames = 0;
        coyoteFrames = 0;
        saltoCortado = false;
    } else if (
        powerupActivo === 'doble-salto' &&
        doblesSaltoDisp > 0 &&
        !estaEnSuelo &&
        quiereSubir &&
        vy >= 0
    ) {
        // Doble salto: solo al inicio de la caída (vy >= 0) para no activar mientras sube
        vy = fuerzaSaltoActual;
        doblesSaltoDisp--;
        saltoCortado = false;
        jumpBufferFrames = 0;
    }

    if (!saltoCortado && vy < 0 && !teclasRef['ArrowUp']) {
        vy *= FIS.jumpCutFactor;
        saltoCortado = true;
    }
}

function aplicarGravedad() {
    vy += FIS.gravedad;
    if (vy > FIS.velocidadMaxCaida) vy = FIS.velocidadMaxCaida;

    const resY = resolverColisionY(x, y, ancho, alto, vy);
    y = resY.y;
    vy = resY.vy;
    estaEnSuelo = resY.enSuelo;
    if (estaEnSuelo) saltoCortado = false;
}

export function actualizarJugador() {
    if (!jugadorRef) return;

    yAnterior = y;
    const anteriorEnSuelo = estaEnSuelo;

    procesarAgacharse();
    const inputX = procesarMovimientoX();
    procesarSalto();
    aplicarGravedad();

    if (invulFrames > 0) invulFrames--;

    // Descontar buff activo
    if (powerupActivo !== null && powerupFrames > 0) {
        powerupFrames--;
        if (powerupFrames <= 0) {
            desactivarPowerup();
        }
    }

    estabaSuelo = anteriorEnSuelo;
    actualizarEstado(inputX);
}

function actualizarEstado(inputX) {
    let nuevoEstado = 'idle';

    if (invulFrames > 0 && knockbackVx !== 0) {
        nuevoEstado = 'golpeado';
    } else if (!estaEnSuelo && vy < 0) {
        nuevoEstado = 'saltar';
    } else if (!estaEnSuelo && vy >= 0) {
        nuevoEstado = 'caer';
    } else if (estaAgachado) {
        nuevoEstado = 'agacharse';
    } else if (inputX !== 0) {
        nuevoEstado = 'correr';
    }

    if (nuevoEstado !== estado) {
        estado = nuevoEstado;
        frameAnim = 0;
        contadorAnim = 0;
    } else {
        contadorAnim++;
        let vel = SPR.jugadorIdleVel;
        if (estado === 'correr') vel = SPR.jugadorCorrerVel;
        else if (estado === 'agacharse') vel = SPR.jugadorAgacharseVel;
        if (contadorAnim >= vel) {
            contadorAnim = 0;
            // Agacharse: detener en el último frame (pose estática, no ciclar)
            if (estado === 'agacharse') {
                if (frameAnim < HERO_LAYOUT.agacharse.cantidad - 1) frameAnim++;
            } else {
                frameAnim++;
            }
        }
    }
}

export function detectarMetaTile() {
    // Verificar si el jugador toca un tile META
    const centroX = x + ancho / 2;
    const centroY = y + alto / 2;
    return esMeta(centroX, centroY);
}

// Caer al fuego del abismo = muerte instantanea
export function caerAlAbismo() {
    if (!jugadorRef) return;
    jugadorRef.recibirDano(9999);
    notificarVidaCambio();
    notificarJugadorMuerto();
}

export function recibirDano(dano, desdeX) {
    if (!jugadorRef || invulFrames > 0) return false;

    // Escudo: absorber el golpe sin daño
    if (escudoActivo) {
        escudoActivo = false;
        powerupActivo = null;
        powerupFrames = 0;
        invulFrames = FIS.invulnerabilidad;
        return false;
    }

    jugadorRef.recibirDano(dano);
    notificarVidaCambio();

    // Knockback alejandose del origen del dano
    const dirKnock = desdeX < x ? 1 : -1;
    knockbackVx = FIS.knockbackX * dirKnock;
    vy = FIS.knockbackY;
    invulFrames = FIS.invulnerabilidad;

    if (!jugadorRef.estaVivo()) {
        notificarJugadorMuerto();
        return true;
    }
    return false;
}

export function aplicarStompRebote(saltandoActivo) {
    vy = saltandoActivo ? FIS.fuerzaStompReboteAlto : FIS.fuerzaStompReboteBajo;
    saltoCortado = false;
    // Breve invulnerabilidad post-stomp para que el rebote separe al jugador
    if (invulFrames < FIS.invulPostStomp) invulFrames = FIS.invulPostStomp;
}

function desactivarPowerup() {
    if (powerupActivo === 'invu-velocidad') {
        velocidadMov = velocidadBase;
    }
    powerupActivo = null;
    powerupFrames = 0;
    doblesSaltoDisp = 0;
    escudoActivo = false;
}

/**
 * Aplica un power-up al jugador. Si ya hay uno activo, lo reemplaza.
 * @param {string} efecto - 'doble-salto' | 'escudo' | 'invu-velocidad'
 * @param {number} duracion - frames de duración del buff
 */
export function aplicarPowerup(efecto, duracion) {
    // Desactivar el anterior limpiando modificadores
    if (powerupActivo === 'invu-velocidad') {
        velocidadMov = velocidadBase;
    }

    powerupActivo = efecto;
    powerupFrames = duracion;

    if (efecto === 'doble-salto') {
        doblesSaltoDisp = 1;
        escudoActivo = false;
    } else if (efecto === 'escudo') {
        escudoActivo = true;
        doblesSaltoDisp = 0;
    } else if (efecto === 'invu-velocidad') {
        invulFrames = Math.max(invulFrames, duracion);
        velocidadMov = velocidadBase * 1.5;
        escudoActivo = false;
        doblesSaltoDisp = 0;
    }
}

/**
 * Retorna el estado actual del power-up para el renderer.
 * @returns {{ tipo: string|null, framesRestantes: number }}
 */
export function obtenerPowerupActivo() {
    return { tipo: powerupActivo, framesRestantes: powerupFrames };
}

export function obtenerEscala() {
    return escalaJugador;
}

export function renderizarJugador(ctx, camaraX, camaraY) {
    if (!jugadorRef) return;

    // Parpadeo de invulnerabilidad
    if (invulFrames > 0 && Math.floor(invulFrames / 4) % 2 === 0) return;

    const drawX = Math.round(x - camaraX);
    const drawY = Math.round(y - camaraY);

    // Intentar usar sprite
    const sprite = obtenerSpriteJugador(estado, frameAnim);
    if (sprite) {
        // Centrar sprite escalado sobre el hitbox (pies alineados, centrado horizontal)
        const offX = drawX - (spriteDrawW - ancho) / 2;
        const offY = drawY - (spriteDrawH - alto);
        ctx.save();
        if (direccion < 0) {
            ctx.translate(offX + spriteDrawW, offY);
            ctx.scale(-1, 1);
            ctx.drawImage(sprite, 0, 0, spriteDrawW, spriteDrawH);
        } else {
            ctx.drawImage(sprite, offX, offY, spriteDrawW, spriteDrawH);
        }
        ctx.restore();
        return;
    }

    // Fallback: renderizado basico
    ctx.fillStyle = colorJugador;
    ctx.fillRect(drawX, drawY, ancho, alto);

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(drawX, drawY, ancho, 2);

    const ojoY = drawY + Math.round(alto * 0.29);
    ctx.fillStyle = '#fff';
    if (direccion > 0) {
        ctx.fillRect(drawX + Math.round(ancho * 0.5), ojoY, 3, 3);
        ctx.fillRect(drawX + Math.round(ancho * 0.83), ojoY, 2, 2);
    } else {
        ctx.fillRect(drawX + Math.round(ancho * 0.25), ojoY, 3, 3);
        ctx.fillRect(drawX, ojoY, 2, 2);
    }

    ctx.fillStyle = '#111';
    if (direccion > 0) {
        ctx.fillRect(drawX + Math.round(ancho * 0.67), ojoY + 1, 1, 1);
        ctx.fillRect(drawX + Math.round(ancho * 0.92), ojoY + 1, 1, 1);
    } else {
        ctx.fillRect(drawX + Math.round(ancho * 0.33), ojoY + 1, 1, 1);
        ctx.fillRect(drawX + Math.round(ancho * 0.08), ojoY + 1, 1, 1);
    }
}

export function obtenerPosicion() {
    return { x, y, ancho, alto, vy, vx, estaEnSuelo, estaAgachado, direccion, yAnterior };
}

export function esInvulnerable() {
    return invulFrames > 0;
}

export function acabaDeAterrizar() {
    return estaEnSuelo && !estabaSuelo;
}

export function obtenerColor() {
    return colorJugador;
}
