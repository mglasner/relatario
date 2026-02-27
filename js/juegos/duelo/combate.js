// El Duelo — Sistema de combate
// Procesa ataques, detecta colisiones, aplica daño y knockback

import { CFG } from './config.js';
import { obtenerHitbox, aplicarRetroceso } from './luchador.js';
import { hexARgb } from './utilsDuelo.js';

const CMB = CFG.combate;
const MEC = CFG.mecanicas;

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

    // Determinar si es ataque con proyectil
    const esRapido = tipo === 'rapido';
    const ataqueIdx = esRapido ? 0 : Math.min(1, atacante.ataquesDatos.length - 1);
    const datosAtaque = atacante.ataquesDatos[ataqueIdx];
    atacante.esProyectil = !!(datosAtaque && datosAtaque.arquetipo === 'proyectil');
    atacante.proyectilEmitido = false;
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
export function aabb(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}

/**
 * Calcula el daño base según el tipo de ataque y los ataques del luchador
 */
export function calcularDano(atacante) {
    const esRapido = atacante.tipoAtaque === 'rapido';
    const danoBase = esRapido ? CMB.ataqueRapidoDanoBase : CMB.ataqueFuerteDanoBase;

    // Escalar con daño del primer/segundo ataque de la entidad
    let dano = danoBase;
    if (atacante.ataquesDatos.length > 0) {
        const ataqueIdx = esRapido ? 0 : Math.min(1, atacante.ataquesDatos.length - 1);
        const ataqueDatos = atacante.ataquesDatos[ataqueIdx];
        if (ataqueDatos && ataqueDatos.dano) {
            dano = Math.round((danoBase + ataqueDatos.dano) / 2);
        }
    }

    // Multiplicador de combo
    const mults = MEC.comboMultiplicadores;
    const comboMult = mults[Math.min(atacante.comboCount, mults.length - 1)];
    dano = Math.round(dano * comboMult);

    // Multiplicador de boost (parry)
    dano = Math.round(dano * atacante.boostDano);

    // Multiplicador aéreo
    if (atacante.ataqueAereo) {
        dano = Math.round(dano * MEC.aereoMultDano);
    }

    return dano;
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
    // Los ataques de proyectil no usan zona melee — el proyectil real maneja la colisión
    if (atacante.esProyectil) return null;

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
    const esAereo = atacante.ataqueAereo;

    // Punto de impacto (para partículas)
    const impactoX = (zona.x + zona.ancho / 2 + hitbox.x + hitbox.ancho / 2) / 2;
    const impactoY = (zona.y + zona.alto / 2 + hitbox.y + hitbox.alto / 2) / 2;

    // Ataques aéreos son imbloquéables — saltar directo al impacto
    if (!esAereo && defensor.bloqueando && !defensor.guardiaRota) {
        // ¿Es parry? (bloqueo con timing preciso)
        if (defensor.parryVentana > 0) {
            // Aturdimiento al atacante
            atacante.estado = 'golpeado';
            atacante.invulFrames = MEC.parryAturdimiento;
            atacante.ataqueTimer = 0;
            aplicarRetroceso(atacante, defensor.x + defensor.ancho / 2, true);
            // Boost al defensor
            defensor.boostDano = MEC.parryBoostDano;
            defensor.boostTimer = MEC.parryBoostDuracion;
            defensor.parryVentana = 0;
            return { tipo: 'parry', x: impactoX, y: impactoY };
        }

        // Reducir guardia
        const costo = esFuerte ? MEC.guardiaCostoFuerte : MEC.guardiaCostoRapido;
        defensor.guardiaHP -= costo;

        if (defensor.guardiaHP <= 0) {
            // ¡Guardia rota!
            defensor.guardiaHP = 0;
            defensor.guardiaRota = true;
            defensor.bloqueando = false;
            defensor.estado = 'golpeado';
            defensor.invulFrames = MEC.guardiaRotaStun;
            aplicarRetroceso(defensor, atacante.x + atacante.ancho / 2, true);
            defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);
            // Cuenta como combo hit
            atacante.comboCount++;
            atacante.comboTimer = MEC.comboTimer;
            const { r, g, b } = hexARgb(defensor.colorHud);
            return { tipo: 'guardiaRota', x: impactoX, y: impactoY, r, g, b };
        }

        // Bloqueo normal (guardia aguantó)
        const danoReducido = Math.round(dano * CMB.bloqueoReduccion);
        defensor.vidaActual = Math.max(0, defensor.vidaActual - danoReducido);
        defensor.invulFrames = CMB.invulnerabilidad * 0.3;
        atacante.comboCount = 0; // El rival bloqueó, se rompe el combo
        return { tipo: 'bloqueo', x: impactoX, y: impactoY };
    }

    // Golpe directo (incluye aéreo imbloqueable)
    defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);
    defensor.invulFrames = CMB.invulnerabilidad;
    aplicarRetroceso(defensor, atacante.x + atacante.ancho / 2, esFuerte || esAereo);

    // Combo tracking
    atacante.comboCount++;
    atacante.comboTimer = MEC.comboTimer;

    const { r, g, b } = hexARgb(atacante.colorHud);
    return {
        tipo: 'impacto',
        fuerte: esFuerte,
        aereo: esAereo,
        atacante,
        x: impactoX,
        y: impactoY,
        r,
        g,
        b,
    };
}

/**
 * Aplica daño de un proyectil al defensor.
 * Maneja bloqueo, quiebre de guardia e impacto directo.
 * No permite parry (requiere timing melee, no a distancia).
 * @param {boolean} esFuerte - si el ataque original fue fuerte (almacenado en el proyectil)
 * @returns {{ tipo: string, x: number, y: number, r?: number, g?: number, b?: number, atacante?: Object }} resultado para partículas/toast
 */
export function aplicarDanoProyectil(atacante, defensor, dano, esFuerte, impactoX, impactoY) {
    if (defensor.invulFrames > 0) return null;

    // Bloqueo (sin parry — no se puede parry a distancia)
    if (defensor.bloqueando && !defensor.guardiaRota) {
        const costo = esFuerte ? MEC.guardiaCostoFuerte : MEC.guardiaCostoRapido;
        defensor.guardiaHP -= costo;

        if (defensor.guardiaHP <= 0) {
            // ¡Guardia rota!
            defensor.guardiaHP = 0;
            defensor.guardiaRota = true;
            defensor.bloqueando = false;
            defensor.estado = 'golpeado';
            defensor.invulFrames = MEC.guardiaRotaStun;
            aplicarRetroceso(defensor, atacante.x + atacante.ancho / 2, true);
            defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);
            atacante.comboCount++;
            atacante.comboTimer = MEC.comboTimer;
            const { r, g, b } = hexARgb(defensor.colorHud);
            return { tipo: 'guardiaRota', x: impactoX, y: impactoY, r, g, b };
        }

        // Bloqueo normal — daño reducido
        const danoReducido = Math.round(dano * CMB.bloqueoReduccion);
        defensor.vidaActual = Math.max(0, defensor.vidaActual - danoReducido);
        defensor.invulFrames = CMB.invulnerabilidad * 0.3;
        atacante.comboCount = 0;
        return { tipo: 'bloqueo', x: impactoX, y: impactoY };
    }

    // Impacto directo
    defensor.vidaActual = Math.max(0, defensor.vidaActual - dano);
    defensor.invulFrames = CMB.invulnerabilidad;
    aplicarRetroceso(defensor, atacante.x + atacante.ancho / 2, esFuerte);
    atacante.comboCount++;
    atacante.comboTimer = MEC.comboTimer;

    const { r, g, b } = hexARgb(atacante.colorHud);
    return { tipo: 'impacto', fuerte: esFuerte, atacante, x: impactoX, y: impactoY, r, g, b };
}
