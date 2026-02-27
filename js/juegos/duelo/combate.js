// El Duelo — Sistema de combate
// Procesa ataques, detecta colisiones, aplica daño y knockback

import { CFG } from './config.js';
import { obtenerHitbox, aplicarRetroceso } from './luchador.js';

const CMB = CFG.combate;

/**
 * Inicia un ataque para un luchador
 * @param {Object} atacante - luchador que ataca
 * @param {Object} defensor - luchador que recibe
 * @param {string} tipo - 'rapido' | 'fuerte'
 */
export function procesarAtaque(atacante, _defensor, tipo) {
    if (atacante.estado === 'atacando' || atacante.estado === 'golpeado') return;
    if (atacante.cooldownAtaque > 0) return;

    atacante.estado = 'atacando';
    atacante.tipoAtaque = tipo;
    atacante.ataqueConecto = false;
    atacante.frameAnim = 0;
    atacante.frameTimer = 0;

    if (tipo === 'rapido') {
        atacante.ataqueTimer = CMB.ataqueRapidoDuracion;
        atacante.cooldownAtaque = CMB.ataqueRapidoCooldown;
    } else {
        atacante.ataqueTimer = CMB.ataqueFuerteDuracion;
        atacante.cooldownAtaque = CMB.ataqueFuerteCooldown;
    }
}

/**
 * Calcula la zona de ataque de un luchador
 */
function zonaAtaque(l) {
    const esRapido = l.tipoAtaque === 'rapido';
    const alcance = esRapido ? CMB.ataqueRapidoAlcance : CMB.ataqueFuerteAlcance;
    const altoZona = l.alto * 0.6;

    const x = l.direccion > 0 ? l.x + l.ancho : l.x - alcance;
    const y = l.y + l.alto * 0.15;

    return { x, y, ancho: alcance, alto: altoZona };
}

/**
 * Colisión AABB simple
 */
function aabb(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}

/**
 * Calcula el daño base según el tipo de ataque y los ataques del luchador
 */
function calcularDano(atacante) {
    const esRapido = atacante.tipoAtaque === 'rapido';
    const danoBase = esRapido ? CMB.ataqueRapidoDanoBase : CMB.ataqueFuerteDanoBase;

    // Escalar con daño del primer/segundo ataque de la entidad
    if (atacante.ataquesDatos.length === 0) return danoBase;
    const ataqueIdx = esRapido ? 0 : Math.min(1, atacante.ataquesDatos.length - 1);
    const ataqueDatos = atacante.ataquesDatos[ataqueIdx];
    if (ataqueDatos && ataqueDatos.dano) {
        return Math.round((danoBase + ataqueDatos.dano) / 2);
    }

    return danoBase;
}

/**
 * Parsea color hex a componentes RGB
 */
function hexARgb(hex) {
    if (!hex || hex.length < 7) return { r: 200, g: 100, b: 255 };
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

/**
 * Verifica colisiones de ataque entre dos luchadores (en ambas direcciones)
 * Retorna info del evento para partículas, o null
 */
export function verificarColisiones(l1, l2) {
    const r1 = verificarAtaque(l1, l2);
    if (r1) return r1;
    const r2 = verificarAtaque(l2, l1);
    if (r2) return r2;
    return null;
}

function verificarAtaque(atacante, defensor) {
    // Solo verificar si está atacando y no ha conectado aún
    if (atacante.estado !== 'atacando' || atacante.ataqueConecto) return null;

    // Solo conectar en la mitad de la animación de ataque (sweet spot)
    const duracion =
        atacante.tipoAtaque === 'rapido' ? CMB.ataqueRapidoDuracion : CMB.ataqueFuerteDuracion;
    const tiempoTranscurrido = duracion - atacante.ataqueTimer;
    if (tiempoTranscurrido < duracion * 0.2 || tiempoTranscurrido > duracion * 0.8) return null;

    const zona = zonaAtaque(atacante);
    const hitbox = obtenerHitbox(defensor);

    if (!aabb(zona, hitbox)) return null;

    // Si el defensor está agachado y el ataque es alto, esquivar
    if (defensor.agachado) {
        const ataqueAlto = zona.y < defensor.y + defensor.alto * CMB.ataqueAltoOffset;
        const altoCobertura = zona.alto < defensor.alto * CMB.ataqueAltoAlcanceY;
        if (ataqueAlto && altoCobertura) {
            return null; // esquivado por agacharse
        }
    }

    atacante.ataqueConecto = true;

    // Invulnerabilidad del defensor
    if (defensor.invulFrames > 0) return null;

    const dano = calcularDano(atacante);
    const esFuerte = atacante.tipoAtaque === 'fuerte';

    // Punto de impacto (para partículas)
    const impactoX = (zona.x + zona.ancho / 2 + hitbox.x + hitbox.ancho / 2) / 2;
    const impactoY = (zona.y + zona.alto / 2 + hitbox.y + hitbox.alto / 2) / 2;

    // Bloqueo
    if (defensor.bloqueando) {
        const danoReducido = Math.round(dano * CMB.bloqueoReduccion);
        defensor.vidaActual = Math.max(0, defensor.vidaActual - danoReducido);
        defensor.invulFrames = CMB.invulnerabilidad * 0.3;
        return {
            tipo: 'bloqueo',
            x: impactoX,
            y: impactoY,
        };
    }

    // Golpe directo
    defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);
    defensor.invulFrames = CMB.invulnerabilidad;
    aplicarRetroceso(defensor, atacante.x + atacante.ancho / 2, esFuerte);

    const { r, g, b } = hexARgb(atacante.colorHud);
    return {
        tipo: 'impacto',
        x: impactoX,
        y: impactoY,
        r,
        g,
        b,
    };
}
