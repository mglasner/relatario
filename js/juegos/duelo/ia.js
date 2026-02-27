// El Duelo — IA del oponente
// State machine simple: idle → acercarse → atacar → retroceder
// Agresividad escalada por tier del enemigo

import { CFG } from './config.js';
import { procesarAtaque } from './combate.js';

const IA = CFG.ia;
const FIS = CFG.fisicas;
const MEC = CFG.mecanicas;

// Estados de la IA
const ESTADOS_IA = {
    IDLE: 'idle',
    ACERCAR: 'acercar',
    ATACAR: 'atacar',
    RETROCEDER: 'retroceder',
    BLOQUEAR: 'bloquear',
};

// Estado interno de la IA (no necesita reset porque se recrea por partida)
let estadoIA = ESTADOS_IA.IDLE;
let timerIA = 0;
let timerDecision = 0;

function obtenerAgresividad(tier) {
    if (IA.agresividad[tier] !== undefined) return IA.agresividad[tier];
    return 1.0;
}

/**
 * Actualiza la IA de un luchador
 * @param {Object} ia - luchador controlado por IA
 * @param {Object} rival - luchador humano
 * @param {number} dt - delta time normalizado
 */
export function actualizarIA(ia, rival, dt) {
    const agresividad = obtenerAgresividad(ia.tier);

    // Distancia al rival
    const cx = ia.x + ia.ancho / 2;
    const rivalCx = rival.x + rival.ancho / 2;
    const distancia = Math.abs(cx - rivalCx);
    const dirHaciaRival = rivalCx > cx ? 1 : -1;

    timerDecision -= dt;

    // Cooldown de reacción
    if (timerIA > 0) {
        timerIA -= dt;
        ia.vx = 0;
        return;
    }

    // Máquina de estados
    switch (estadoIA) {
        case ESTADOS_IA.IDLE: {
            ia.vx = 0;
            ia.bloqueando = false;
            ia.agachado = false;

            if (timerDecision <= 0) {
                timerDecision = IA.reaccionMin + Math.random() * (IA.reaccionMax - IA.reaccionMin);

                // Decidir siguiente acción
                // A larga distancia con proyectil: atacar directamente
                const tieneProyectil = ia.ataquesDatos.some((a) => a.arquetipo === 'proyectil');
                if (tieneProyectil && distancia > IA.distanciaOptima * 1.5) {
                    estadoIA = ESTADOS_IA.ATACAR;
                } else if (distancia > IA.distanciaOptima * 1.5) {
                    estadoIA = ESTADOS_IA.ACERCAR;
                } else if (distancia <= IA.distanciaOptima) {
                    // Cerca: atacar o bloquear
                    const roll = Math.random();
                    if (roll < IA.probAtaque * 60 * agresividad) {
                        estadoIA = ESTADOS_IA.ATACAR;
                    } else if (roll < IA.probBloqueo * agresividad) {
                        estadoIA = ESTADOS_IA.BLOQUEAR;
                        timerIA = 20 + Math.random() * 40;
                    } else {
                        estadoIA = ESTADOS_IA.RETROCEDER;
                        timerIA = 20 + Math.random() * 30;
                    }
                } else {
                    // Media distancia: acercarse o saltar
                    if (Math.random() < IA.probSalto * 60 * agresividad && ia.enSuelo) {
                        ia.vy = FIS.fuerzaSalto;
                        ia.enSuelo = false;
                    }
                    estadoIA = ESTADOS_IA.ACERCAR;
                }
            }
            break;
        }

        case ESTADOS_IA.ACERCAR: {
            ia.bloqueando = false;
            ia.agachado = false;
            ia.vx = ia.vel * dirHaciaRival * 0.8;

            if (distancia <= IA.distanciaOptima) {
                estadoIA = ESTADOS_IA.IDLE;
                timerDecision = 0;
            }
            break;
        }

        case ESTADOS_IA.ATACAR: {
            ia.vx = 0;
            ia.bloqueando = false;
            ia.agachado = false;

            if (ia.cooldownAtaque <= 0 && ia.estado !== 'atacando' && ia.estado !== 'golpeado') {
                // Si tiene proyectil y está lejos, preferir ataque a distancia
                const idxProy = ia.ataquesDatos.findIndex((a) => a.arquetipo === 'proyectil');
                if (idxProy >= 0 && distancia > IA.distanciaOptima * 0.8) {
                    const tipo = idxProy === 0 ? 'rapido' : 'fuerte';
                    procesarAtaque(ia, rival, tipo);
                } else {
                    const tipo = Math.random() < 0.6 ? 'rapido' : 'fuerte';
                    ia.ataqueAereo = !ia.enSuelo;
                    procesarAtaque(ia, rival, tipo);
                    if (ia.ataqueAereo) ia.cooldownAtaque = MEC.aereoCooldown;
                }
            }

            // Después de atacar, volver a decidir
            estadoIA = ESTADOS_IA.IDLE;
            timerDecision = IA.reaccionMin * (1 / agresividad);
            break;
        }

        case ESTADOS_IA.RETROCEDER: {
            ia.bloqueando = false;
            ia.agachado = false;
            ia.vx = ia.vel * -dirHaciaRival * 0.6;

            if (timerIA <= 0 || distancia > IA.distanciaOptima * 2) {
                estadoIA = ESTADOS_IA.IDLE;
                timerDecision = 0;
            }
            break;
        }

        case ESTADOS_IA.BLOQUEAR: {
            ia.vx = 0;
            // No puede bloquear con guardia rota
            if (ia.guardiaRota) {
                ia.bloqueando = false;
                estadoIA = ESTADOS_IA.RETROCEDER;
                timerIA = 30;
                break;
            }
            const estabaBloqueandoIA = ia.bloqueando;
            ia.bloqueando = true;
            ia.agachado = Math.random() < 0.3;

            // Intentar parry al empezar a bloquear
            if (ia.bloqueando && !estabaBloqueandoIA) {
                if (Math.random() < IA.probParry * agresividad) {
                    ia.parryVentana = MEC.parryVentana;
                }
            }

            if (timerIA <= 0) {
                ia.bloqueando = false;
                ia.agachado = false;
                estadoIA = ESTADOS_IA.IDLE;
                timerDecision = 0;
            }
            break;
        }
    }

    // Ataque aéreo: si está en el aire y cayendo cerca del rival
    if (!ia.enSuelo && ia.vy > 0 && distancia < IA.distanciaOptima * 1.2) {
        if (
            ia.cooldownAtaque <= 0 &&
            ia.estado !== 'atacando' &&
            Math.random() < IA.probAtaqueAereo * agresividad
        ) {
            ia.ataqueAereo = true;
            procesarAtaque(ia, rival, 'fuerte');
            if (ia.ataqueAereo) ia.cooldownAtaque = MEC.aereoCooldown;
        }
    }

    // Adaptación a guardia baja: retroceder para regenerar
    if (ia.guardiaHP <= 1 && estadoIA !== ESTADOS_IA.RETROCEDER) {
        estadoIA = ESTADOS_IA.RETROCEDER;
        timerIA = 40;
    }

    // Reacción al ser golpeado: contraatacar rápido
    if (ia.estado === 'golpeado' && estadoIA !== ESTADOS_IA.BLOQUEAR) {
        const reaccion = Math.random();
        if (reaccion < IA.probBloqueo * agresividad) {
            estadoIA = ESTADOS_IA.BLOQUEAR;
            timerIA = 15;
        } else if (reaccion < IA.probBloqueo * agresividad + 0.2 * agresividad) {
            estadoIA = ESTADOS_IA.ATACAR;
            timerDecision = 0;
        }
    }
}

/**
 * Resetea el estado de la IA (para nueva partida)
 */
export function resetearIA() {
    estadoIA = ESTADOS_IA.IDLE;
    timerIA = 0;
    timerDecision = 0;
}
