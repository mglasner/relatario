// El Duelo — Creación y movimiento de luchadores
// Cada luchador tiene posición, hitbox, estado de animación y stats de combate

import { CFG } from './config.js';

const ESC = CFG.escalado;
const FIS = CFG.fisicas;
const CMB = CFG.combate;
const MEC = CFG.mecanicas;

/**
 * Calcula la escala visual de un luchador según su estatura
 */
export function calcularEscala(estatura) {
    const ratio = estatura / ESC.estaturaRef;
    return Math.max(ESC.escalaMin, Math.min(ESC.escalaMax, ratio));
}

/**
 * Interpola velocidad según atributo (3-9) → (velMin-velMax)
 */
function calcularVelocidad(attrVel) {
    const t = (attrVel - ESC.velAttrMin) / (ESC.velAttrMax - ESC.velAttrMin);
    return ESC.velMin + t * (ESC.velMax - ESC.velMin);
}

/**
 * Crea un luchador con todos los datos necesarios para el combate
 */
export function crearLuchador(cfg) {
    const escala = calcularEscala(cfg.estatura || ESC.estaturaRef);
    const vel = calcularVelocidad(cfg.velocidad || 6);
    const ancho = Math.round(ESC.hitboxBaseW * escala);
    const alto = Math.round(ESC.hitboxBaseH * escala);

    return {
        // Identidad
        nombre: cfg.nombre,
        img: cfg.img,
        esVillano: cfg.esVillano || false,
        tier: cfg.tier || 'elite',
        ataquesDatos: cfg.ataques || [],

        // Posición y dimensiones
        x: cfg.x || 0,
        y: CFG.arena.sueloY - alto,
        ancho: ancho,
        alto: alto,
        escala: escala,
        spriteW: Math.round(ESC.spriteBaseW * escala),
        spriteH: Math.round(ESC.spriteBaseH * escala),
        direccion: cfg.direccion || 1, // 1 = derecha, -1 = izquierda

        // Física
        vx: 0,
        vy: 0,
        vel: vel,
        enSuelo: true,

        // Vida
        vidaMax: cfg.vidaMax || 100,
        vidaActual: cfg.vidaMax || 100,
        colorHud: cfg.colorHud,

        // Estados
        estado: 'idle', // idle, caminar, saltar, caer, atacando, golpeado, agachado, bloquear
        agachado: false,
        bloqueando: false,
        invulFrames: 0,

        // Ataque
        cooldownAtaque: 0,
        ataqueTimer: 0,
        tipoAtaque: null, // 'rapido' | 'fuerte'
        ataqueConecto: false,

        // Parry
        parryVentana: 0,
        boostDano: 1.0,
        boostTimer: 0,

        // Combos
        comboCount: 0,
        comboTimer: 0,

        // Ataque aéreo
        ataqueAereo: false,

        // Guardia
        guardiaHP: MEC.guardiaMax,
        guardiaRota: false,
        guardiaRegenTimer: 0,

        // Animación
        frameAnim: 0,
        frameTimer: 0,

        // Sprites (cargados asíncronamente)
        sprites: null,
        spriteSheet: false,
    };
}

/**
 * Aplica gravedad a un luchador
 */
export function aplicarGravedad(l, dt) {
    if (l.enSuelo) return;
    l.vy += FIS.gravedad * dt;
    if (l.vy > FIS.velocidadMaxCaida) l.vy = FIS.velocidadMaxCaida;
}

/**
 * Actualiza posición, estado de animación y timers de un luchador
 */
export function actualizarLuchador(l, dt) {
    // Movimiento horizontal
    l.x += l.vx * dt;

    // Limitar a la arena
    if (l.x < CFG.arena.limiteIzq) l.x = CFG.arena.limiteIzq;
    if (l.x + l.ancho > CFG.arena.limiteDer) l.x = CFG.arena.limiteDer - l.ancho;

    // Movimiento vertical
    l.y += l.vy * dt;
    const sueloY = CFG.arena.sueloY - l.alto;
    if (l.y >= sueloY) {
        l.y = sueloY;
        l.vy = 0;
        l.enSuelo = true;
    }

    // Timers
    if (l.invulFrames > 0) l.invulFrames -= dt;
    if (l.cooldownAtaque > 0) l.cooldownAtaque -= dt;
    if (l.parryVentana > 0) l.parryVentana -= dt;

    // Parry boost decay
    if (l.boostTimer > 0) {
        l.boostTimer -= dt;
        if (l.boostTimer <= 0) l.boostDano = 1.0;
    }

    // Combo timeout
    if (l.comboTimer > 0) {
        l.comboTimer -= dt;
        if (l.comboTimer <= 0) l.comboCount = 0;
    }

    // Guardia regeneración (solo si NO está bloqueando)
    if (!l.bloqueando && l.guardiaHP < MEC.guardiaMax) {
        l.guardiaRegenTimer += dt;
        if (l.guardiaRegenTimer >= MEC.guardiaRegenIntervalo) {
            l.guardiaRegenTimer = 0;
            l.guardiaHP = Math.min(l.guardiaHP + 1, MEC.guardiaMax);
            if (l.guardiaHP > 0) l.guardiaRota = false;
        }
    } else {
        l.guardiaRegenTimer = 0;
    }

    // Estado de ataque
    if (l.ataqueTimer > 0) {
        l.ataqueTimer -= dt;
        if (l.ataqueTimer <= 0) {
            l.estado = 'idle';
            l.tipoAtaque = null;
            l.ataqueConecto = false;
        }
    }

    // Determinar estado de animación
    const estadoPrev = l.estado;
    if (l.ataqueTimer > 0) {
        l.estado = 'atacando';
    } else if (l.invulFrames > CMB.invulnerabilidad * 0.7) {
        l.estado = 'golpeado';
    } else if (l.agachado) {
        l.estado = 'agachado';
    } else if (l.bloqueando && Math.abs(l.vx) < 0.1) {
        l.estado = 'bloquear';
    } else if (!l.enSuelo && l.vy < 0) {
        l.estado = 'saltar';
    } else if (!l.enSuelo && l.vy >= 0) {
        l.estado = 'caer';
    } else if (Math.abs(l.vx) > 0.1) {
        l.estado = 'caminar';
    } else {
        l.estado = 'idle';
    }

    // Reset de animación al cambiar de estado (igual que El Abismo)
    if (l.estado !== estadoPrev) {
        l.frameAnim = 0;
        l.frameTimer = 0;
    }

    // Animación
    l.frameTimer += dt;
    const velAnim =
        l.estado === 'idle'
            ? CFG.sprites.idleVel
            : l.estado === 'caminar'
              ? CFG.sprites.correrVel
              : l.estado === 'atacando'
                ? CFG.sprites.ataqueVel
                : l.estado === 'golpeado'
                  ? CFG.sprites.golpeadoVel
                  : CFG.sprites.agacharseVel;
    if (l.frameTimer >= velAnim) {
        l.frameTimer = 0;
        l.frameAnim++;
    }
}

/**
 * Obtiene el hitbox efectivo del luchador (considerando agacharse)
 */
export function obtenerHitbox(l) {
    if (l.agachado) {
        const altoCrouched = Math.round(l.alto * CMB.agacharsePorcentajeHitbox);
        return {
            x: l.x,
            y: l.y + l.alto - altoCrouched,
            ancho: l.ancho,
            alto: altoCrouched,
        };
    }
    return { x: l.x, y: l.y, ancho: l.ancho, alto: l.alto };
}

/**
 * Aplica retroceso por golpe
 */
export function aplicarRetroceso(l, desdeX, esFuerte) {
    const retX = esFuerte ? FIS.retrocesoGolpeFuerte : FIS.retrocesoGolpe;
    const dir = l.x > desdeX ? 1 : -1;
    l.vx = retX * dir;
    l.vy = FIS.retrocesoVertical;
    l.enSuelo = false;
}
