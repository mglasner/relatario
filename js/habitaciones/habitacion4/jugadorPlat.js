// Habitacion 4 — El Abismo: Jugador platformer
// Estados: idle, correr, saltar, caer, golpeado

import { CFG } from './config.js';
import { resolverColisionX, resolverColisionY, esAbismo, esMeta } from './fisicas.js';
import { obtenerSpawnJugador } from './nivel.js';
import { obtenerSpriteJugador } from './spritesPlat.js';
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
let respawnX = 0;
let respawnY = 0;
let jugadorRef = null;
let teclasRef = {};

// Estado de animacion
let estado = 'idle'; // idle, correr, saltar, caer, golpeado
let frameAnim = 0;
let contadorAnim = 0;
let estabaSuelo = false; // para detectar aterrizaje

export function iniciarJugador(jugador, teclas) {
    jugadorRef = jugador;
    teclasRef = teclas;
    colorJugador = jugador.colorHud || '#bb86fc';

    // Calcular dimensiones y velocidad proporcionales
    const esc = calcularEscala(jugador.estatura);
    const hb = calcularHitbox(esc);
    ancho = hb.ancho;
    alto = hb.alto;
    const sd = calcularSpriteDrawSize(esc);
    spriteDrawW = sd.ancho;
    spriteDrawH = sd.alto;
    velocidadMov = calcularVelocidadPlat(jugador.velocidad);
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
    respawnX = x;
    respawnY = y;
    estado = 'idle';
    frameAnim = 0;
    contadorAnim = 0;
    estabaSuelo = true;
}

export function actualizarJugador() {
    if (!jugadorRef) return;

    const anteriorEnSuelo = estaEnSuelo;

    // Input horizontal
    let inputX = 0;
    if (teclasRef['ArrowLeft']) inputX -= 1;
    if (teclasRef['ArrowRight']) inputX += 1;

    // Knockback override
    if (knockbackVx !== 0) {
        vx = knockbackVx;
        knockbackVx *= 0.85;
        if (Math.abs(knockbackVx) < 0.3) knockbackVx = 0;
    } else {
        vx = inputX * velocidadMov;
    }

    // Direccion visual
    if (inputX !== 0) direccion = inputX;

    // Resolver colision X
    x = resolverColisionX(x, y, ancho, alto, vx);

    // Jump buffer: recordar intencion de saltar
    if (teclasRef['ArrowUp']) {
        jumpBufferFrames = FIS.jumpBuffer;
    } else if (jumpBufferFrames > 0) {
        jumpBufferFrames--;
    }

    // Coyote time: gracia al borde
    if (estaEnSuelo) {
        coyoteFrames = FIS.coyoteTime;
    } else if (coyoteFrames > 0) {
        coyoteFrames--;
    }

    // Saltar
    if (jumpBufferFrames > 0 && coyoteFrames > 0) {
        vy = fuerzaSaltoActual;
        jumpBufferFrames = 0;
        coyoteFrames = 0;
    }

    // Gravedad
    vy += FIS.gravedad;
    if (vy > FIS.velocidadMaxCaida) vy = FIS.velocidadMaxCaida;

    // Resolver colision Y
    const resY = resolverColisionY(x, y, ancho, alto, vy);
    y = resY.y;
    vy = resY.vy;
    estaEnSuelo = resY.enSuelo;

    // Actualizar ultimo punto seguro en suelo
    if (estaEnSuelo && !detectarAbismo()) {
        respawnX = x;
        respawnY = y;
    }

    // Invulnerabilidad
    if (invulFrames > 0) invulFrames--;

    // Detectar aterrizaje (transicion aire→suelo)
    estabaSuelo = anteriorEnSuelo;

    // Actualizar estado de animacion
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
    } else if (inputX !== 0) {
        nuevoEstado = 'correr';
    }

    if (nuevoEstado !== estado) {
        estado = nuevoEstado;
        frameAnim = 0;
        contadorAnim = 0;
    } else {
        contadorAnim++;
        const vel = estado === 'correr' ? SPR.jugadorCorrerVel : SPR.jugadorIdleVel;
        if (contadorAnim >= vel) {
            contadorAnim = 0;
            frameAnim++;
        }
    }
}

export function detectarAbismo() {
    // Verificar si el centro inferior del jugador esta en abismo
    const centroX = x + ancho / 2;
    const pieY = y + alto + 2;
    return esAbismo(centroX, pieY);
}

export function detectarMetaTile() {
    // Verificar si el jugador toca un tile META
    const centroX = x + ancho / 2;
    const centroY = y + alto / 2;
    return esMeta(centroX, centroY);
}

// Se llama solo cuando el jugador ya cayo debajo del nivel (verificado por el caller)
export function caerAlAbismo() {
    if (!jugadorRef || invulFrames > 0) return false;

    jugadorRef.recibirDano(FIS.danoAbismo);
    document.dispatchEvent(new Event('vida-cambio'));

    if (!jugadorRef.estaVivo()) {
        document.dispatchEvent(new Event('jugador-muerto'));
        return true;
    }

    // Respawn en ultimo punto seguro
    x = respawnX;
    y = respawnY;
    vy = 0;
    vx = 0;
    knockbackVx = 0;
    invulFrames = FIS.invulnerabilidad;
    return false;
}

export function recibirDano(dano, desdeX) {
    if (!jugadorRef || invulFrames > 0) return false;

    jugadorRef.recibirDano(dano);
    document.dispatchEvent(new Event('vida-cambio'));

    // Knockback alejandose del origen del dano
    const dirKnock = desdeX < x ? 1 : -1;
    knockbackVx = FIS.knockbackX * dirKnock;
    vy = FIS.knockbackY;
    invulFrames = FIS.invulnerabilidad;

    if (!jugadorRef.estaVivo()) {
        document.dispatchEvent(new Event('jugador-muerto'));
        return true;
    }
    return false;
}

export function aplicarStompRebote() {
    vy = FIS.fuerzaStompRebote;
}

export function renderizarJugador(ctx, camaraX) {
    if (!jugadorRef) return;

    // Parpadeo de invulnerabilidad
    if (invulFrames > 0 && Math.floor(invulFrames / 4) % 2 === 0) return;

    const drawX = Math.round(x - camaraX);
    const drawY = Math.round(y);

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
    return { x, y, ancho, alto, vy, vx, estaEnSuelo, direccion };
}

export function esInvulnerable() {
    return invulFrames > 0;
}

export function acabaDeAterrizar() {
    return estaEnSuelo && !estabaSuelo;
}

export function obtenerEstado() {
    return estado;
}

export function obtenerColor() {
    return colorJugador;
}
