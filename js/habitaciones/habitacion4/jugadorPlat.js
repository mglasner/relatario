// Habitación 4 — El Abismo: Jugador platformer
// Estados: idle, correr, saltar, caer, golpeado

import { CFG } from './config.js';
import { resolverColisionX, resolverColisionY, esAbismo, esMeta } from './fisicas.js';
import { obtenerSpawnJugador } from './nivel.js';

const FIS = CFG.fisicas;
const TAM = CFG.tiles.tamano;

// Estado del jugador platformer
let x = 0;
let y = 0;
const ANCHO = 12;
const ALTO = 14;
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

export function iniciarJugador(jugador, teclas) {
    jugadorRef = jugador;
    teclasRef = teclas;
    colorJugador = jugador.colorHud || '#bb86fc';

    const spawn = obtenerSpawnJugador();
    x = spawn.col * TAM + (TAM - ANCHO) / 2;
    y = spawn.fila * TAM + (TAM - ALTO);
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
}

export function actualizarJugador() {
    if (!jugadorRef) return;

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
        vx = inputX * FIS.velocidadJugador;
    }

    // Dirección visual
    if (inputX !== 0) direccion = inputX;

    // Resolver colisión X
    x = resolverColisionX(x, y, ANCHO, ALTO, vx);

    // Jump buffer: recordar intención de saltar
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
        vy = FIS.fuerzaSalto;
        jumpBufferFrames = 0;
        coyoteFrames = 0;
    }

    // Gravedad
    vy += FIS.gravedad;
    if (vy > FIS.velocidadMaxCaida) vy = FIS.velocidadMaxCaida;

    // Resolver colisión Y
    const resY = resolverColisionY(x, y, ANCHO, ALTO, vy);
    y = resY.y;
    vy = resY.vy;
    estaEnSuelo = resY.enSuelo;

    // Actualizar último punto seguro en suelo
    if (estaEnSuelo && !detectarAbismo()) {
        respawnX = x;
        respawnY = y;
    }

    // Invulnerabilidad
    if (invulFrames > 0) invulFrames--;
}

export function detectarAbismo() {
    // Verificar si el centro inferior del jugador está en abismo
    const centroX = x + ANCHO / 2;
    const pieY = y + ALTO + 2;
    return esAbismo(centroX, pieY);
}

export function detectarMetaTile() {
    // Verificar si el jugador toca un tile META
    const centroX = x + ANCHO / 2;
    const centroY = y + ALTO / 2;
    return esMeta(centroX, centroY);
}

// Se llama solo cuando el jugador ya cayó debajo del nivel (verificado por el caller)
export function caerAlAbismo() {
    if (!jugadorRef || invulFrames > 0) return false;

    jugadorRef.recibirDano(FIS.danoAbismo);
    document.dispatchEvent(new Event('vida-cambio'));

    if (!jugadorRef.estaVivo()) {
        document.dispatchEvent(new Event('jugador-muerto'));
        return true;
    }

    // Respawn en último punto seguro
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

    // Knockback alejándose del origen del daño
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

    const px = Math.round(x - camaraX);
    const py = Math.round(y);

    // Cuerpo
    ctx.fillStyle = colorJugador;
    ctx.fillRect(px, py, ANCHO, ALTO);

    // Borde más claro arriba
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(px, py, ANCHO, 2);

    // Ojos
    const ojoY = py + 4;
    ctx.fillStyle = '#fff';
    if (direccion > 0) {
        ctx.fillRect(px + 6, ojoY, 3, 3);
        ctx.fillRect(px + 10, ojoY, 2, 2);
    } else {
        ctx.fillRect(px + 3, ojoY, 3, 3);
        ctx.fillRect(px, ojoY, 2, 2);
    }

    // Pupilas
    ctx.fillStyle = '#111';
    if (direccion > 0) {
        ctx.fillRect(px + 8, ojoY + 1, 1, 1);
        ctx.fillRect(px + 11, ojoY + 1, 1, 1);
    } else {
        ctx.fillRect(px + 4, ojoY + 1, 1, 1);
        ctx.fillRect(px + 1, ojoY + 1, 1, 1);
    }
}

export function obtenerPosicion() {
    return { x, y, ancho: ANCHO, alto: ALTO, vy, estaEnSuelo };
}

export function esInvulnerable() {
    return invulFrames > 0;
}
