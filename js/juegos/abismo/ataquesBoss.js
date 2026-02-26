// El Abismo — Sistema de ataques del boss
// Máquina de estados: patrulla → telégrafo → ejecutando → recuperación
// 4 arquetipos: proyectil (orbe dirigido), carga (embestida), salto (impacto), aoe (área)

import { CFG } from './config.js';
import { aabbColision, resolverColisionX, esSolido, enSuelo } from './fisicas.js';
import { emitirImpactoSuelo } from './particulas.js';

const BA = CFG.bossAtaques;

// --- Pool de proyectiles (máximo 5 simultáneos) ---

const proyectiles = [];
const MAX_PROYECTILES = 5;

function crearProyectil(x, y, vx, vy, dano, color, colorSec) {
    if (proyectiles.length >= MAX_PROYECTILES) return;
    proyectiles.push({
        x,
        y,
        vx,
        vy,
        ancho: BA.proyectilTamano,
        alto: BA.proyectilTamano,
        vida: BA.proyectilVida,
        dano,
        color,
        colorSec: colorSec || color,
    });
}

// --- Pool de zonas de daño (salto impacto, aoe) ---

const zonas = [];
const MAX_ZONAS = 3;

function crearZona(cx, cy, radio, dano, duracion, color) {
    if (zonas.length >= MAX_ZONAS) return;
    zonas.push({
        cx,
        cy,
        radio,
        dano,
        vidaMax: duracion,
        vida: duracion,
        color,
        danoAplicado: false,
    });
}

// --- Referencia al boss (para renderizado) ---

let bossRef = null;

// --- Inicializar estado de ataque en un boss ---

export function initAtaqueBoss(boss) {
    // Limpiar estado previo (robustez ante reinicio sin limpiarAtaques)
    proyectiles.length = 0;
    zonas.length = 0;
    bossRef = boss;
    boss.ataqueEstado = 'patrulla';
    boss.ataqueCooldown = BA.cooldown;
    boss.ataqueTimer = 0;
    boss.ataqueActual = null;
    boss.cargaDir = 0;
    boss.saltoObjetivoX = 0;
}

// --- Cooldown según fase de vida del boss ---

function cooldownPorFase(boss) {
    if (boss.vidaMax <= 0) return BA.cooldown;
    const ratio = boss.vidaActual / boss.vidaMax;
    if (ratio <= 0.33) return BA.cooldownFase3;
    if (ratio <= 0.66) return BA.cooldownFase2;
    return BA.cooldown;
}

// --- Elegir ataque (aleatorio con sesgo por distancia 60/40) ---
// Cerca → favorece aoe/carga/salto; lejos → favorece proyectil

function esAtaqueLejos(arquetipo) {
    return arquetipo === 'proyectil';
}

function elegirAtaque(boss, distancia) {
    const ataques = boss.datos ? boss.datos.ataques : null;
    if (!ataques || ataques.length === 0) return null;
    if (ataques.length === 1) return ataques[0];

    // Separar ataques por rango
    const cercanos = [];
    const lejanos = [];
    for (let i = 0; i < ataques.length; i++) {
        if (esAtaqueLejos(ataques[i].arquetipo)) {
            lejanos.push(ataques[i]);
        } else {
            cercanos.push(ataques[i]);
        }
    }

    // Si todos son del mismo tipo de rango, elegir al azar uniforme
    if (cercanos.length === 0 || lejanos.length === 0) {
        return ataques[Math.floor(Math.random() * ataques.length)];
    }

    // Sesgo 60/40: favorecer el grupo apropiado a la distancia
    const esCerca = distancia < BA.rangoDeteccion * 0.5;
    const probLejos = esCerca ? 0.4 : 0.6;
    const grupo = Math.random() < probLejos ? lejanos : cercanos;
    return grupo[Math.floor(Math.random() * grupo.length)];
}

// --- Ejecutar ataque según arquetipo ---

function ejecutarAtaque(boss, jugCx, jugCy) {
    const ataque = boss.ataqueActual;
    if (!ataque) return;

    const cx = boss.x + boss.ancho / 2;
    const cy = boss.y + boss.alto / 2;

    switch (ataque.arquetipo) {
        case 'proyectil': {
            const dx = jugCx - cx;
            const dy = jugCy - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            crearProyectil(
                cx,
                cy,
                (dx / dist) * BA.proyectilVel,
                (dy / dist) * BA.proyectilVel,
                ataque.dano,
                ataque.color,
                ataque.colorSecundario
            );
            // Proyectil ya disparado, termina inmediatamente
            boss.ataqueTimer = 0;
            break;
        }
        case 'carga': {
            boss.cargaDir = boss.direccion;
            boss.ataqueTimer = BA.cargaDuracion;
            break;
        }
        case 'salto': {
            boss.vy = BA.saltoFuerza;
            boss.saltoObjetivoX = jugCx;
            boss.ataqueTimer = 0;
            break;
        }
        case 'aoe': {
            const radio = BA.aoeRadioBase * (ataque.radio || 1);
            crearZona(cx, cy, radio, ataque.dano, BA.aoeDuracion, ataque.color);
            boss.ataqueTimer = BA.aoeDuracion;
            break;
        }
        default:
            boss.ataqueTimer = 0;
    }
}

// --- Actualizar la ejecución en curso ---
// Retorna true cuando el ataque termina

function actualizarEjecucion(boss) {
    const ataque = boss.ataqueActual;
    if (!ataque) return true;

    switch (ataque.arquetipo) {
        case 'proyectil':
            return true;

        case 'carga': {
            const vel = boss.velocidad * BA.cargaVelMultiplier;
            boss.vx = vel * boss.cargaDir;
            const nuevaX = resolverColisionX(boss.x, boss.y, boss.ancho, boss.alto, boss.vx, true);
            if (nuevaX === boss.x && boss.vx !== 0) {
                // Golpeó una pared → terminar carga
                return true;
            }
            // Protección anti-precipicio (no mover al borde)
            const bordeX = boss.cargaDir > 0 ? nuevaX + boss.ancho + 2 : nuevaX - 2;
            const pieY = boss.y + boss.alto + 2;
            if (!esSolido(bordeX, pieY)) {
                return true;
            }
            boss.x = nuevaX;
            boss.ataqueTimer--;
            return boss.ataqueTimer <= 0;
        }

        case 'salto': {
            boss.ataqueTimer++;

            // Movimiento horizontal hacia el objetivo
            const diff = boss.saltoObjetivoX - (boss.x + boss.ancho / 2);
            boss.vx = Math.min(Math.abs(diff), 2) * Math.sign(diff);
            const nuevaX = resolverColisionX(boss.x, boss.y, boss.ancho, boss.alto, boss.vx, false);
            boss.x = nuevaX;

            // Detectar aterrizaje: después de unos frames en el aire, verificar enSuelo
            if (boss.ataqueTimer > 5 && enSuelo(boss.x, boss.y, boss.ancho, boss.alto)) {
                // Impacto en el suelo → crear zona de daño + partículas
                const cx = boss.x + boss.ancho / 2;
                const cy = boss.y + boss.alto;
                const radio = BA.aoeRadioBase * (ataque.radio || 1);
                crearZona(cx, cy, radio, ataque.dano, 15, ataque.color);
                const { r, g, b } = hexARgb(ataque.color);
                emitirImpactoSuelo(cx, cy, r, g, b);
                return true;
            }

            // Seguridad: abortar si tarda demasiado
            return boss.ataqueTimer > 120;
        }

        case 'aoe': {
            boss.vx = 0;
            boss.ataqueTimer--;
            return boss.ataqueTimer <= 0;
        }

        default:
            return true;
    }
}

// --- Máquina de estados del boss ---
// Retorna true si el boss está en un estado de ataque (no debe patrullar)

export function actualizarAtaqueBoss(boss, jugCx, jugCy) {
    // Si el boss fue stompeado o murió, interrumpir ataque
    if (!boss.vivo || boss.stunFrames > 0) {
        if (boss.ataqueEstado !== 'patrulla') {
            boss.ataqueEstado = 'patrulla';
            boss.ataqueCooldown = cooldownPorFase(boss);
            boss.ataqueActual = null;
        }
        return false;
    }

    const estado = boss.ataqueEstado;

    if (estado === 'patrulla') {
        if (boss.ataqueCooldown > 0) {
            boss.ataqueCooldown--;
            return false;
        }
        // No iniciar ataques en el aire
        if (!enSuelo(boss.x, boss.y, boss.ancho, boss.alto)) return false;
        // Verificar distancia al jugador
        const dx = boss.x + boss.ancho / 2 - jugCx;
        const dy = boss.y + boss.alto / 2 - jugCy;
        const distSq = dx * dx + dy * dy;
        if (distSq > BA.rangoDeteccion * BA.rangoDeteccion) return false;

        // Iniciar ataque (sesgo por distancia)
        const dist = Math.sqrt(distSq);
        const ataque = elegirAtaque(boss, dist);
        if (!ataque) return false;

        boss.ataqueActual = ataque;
        boss.ataqueEstado = 'telegrafo';
        boss.ataqueTimer = BA.telegrafoFrames;
        // Orientar hacia el jugador
        boss.direccion = jugCx > boss.x + boss.ancho / 2 ? 1 : -1;
        return true;
    }

    if (estado === 'telegrafo') {
        boss.vx = 0;
        boss.ataqueTimer--;
        if (boss.ataqueTimer <= 0) {
            boss.ataqueEstado = 'ejecutando';
            ejecutarAtaque(boss, jugCx, jugCy);
        }
        return true;
    }

    if (estado === 'ejecutando') {
        const terminado = actualizarEjecucion(boss);
        if (terminado) {
            boss.ataqueEstado = 'recuperacion';
            boss.ataqueTimer = BA.recuperacionFrames;
        }
        return true;
    }

    if (estado === 'recuperacion') {
        boss.vx = 0;
        boss.ataqueTimer--;
        if (boss.ataqueTimer <= 0) {
            boss.ataqueEstado = 'patrulla';
            boss.ataqueCooldown = cooldownPorFase(boss);
            boss.ataqueActual = null;
        }
        return true;
    }

    return false;
}

// --- Actualizar proyectiles ---

export function actualizarProyectiles() {
    for (let i = proyectiles.length - 1; i >= 0; i--) {
        const p = proyectiles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vida--;
        // Verificar centro y bordes del proyectil contra tiles sólidos
        const r = p.ancho / 2;
        if (
            p.vida <= 0 ||
            esSolido(p.x, p.y) ||
            esSolido(p.x - r, p.y) ||
            esSolido(p.x + r, p.y) ||
            esSolido(p.x, p.y - r) ||
            esSolido(p.x, p.y + r)
        ) {
            proyectiles.splice(i, 1);
        }
    }
}

// --- Actualizar zonas de daño ---

export function actualizarZonas() {
    for (let i = zonas.length - 1; i >= 0; i--) {
        zonas[i].vida--;
        if (zonas[i].vida <= 0) {
            zonas.splice(i, 1);
        }
    }
}

// --- Colisión de proyectiles con el jugador ---
// Retorna { dano, desdeX } o null

export function colisionProyectilesJugador(jugRect) {
    for (let i = proyectiles.length - 1; i >= 0; i--) {
        const p = proyectiles[i];
        const pRect = {
            x: p.x - p.ancho / 2,
            y: p.y - p.alto / 2,
            ancho: p.ancho,
            alto: p.alto,
        };
        if (aabbColision(jugRect, pRect)) {
            const dano = p.dano;
            const desdeX = p.x;
            proyectiles.splice(i, 1);
            return { dano, desdeX };
        }
    }
    return null;
}

// --- Colisión de zonas con el jugador ---
// Retorna { dano, desdeX } o null

export function colisionZonasJugador(jugCx, jugCy) {
    for (let i = 0; i < zonas.length; i++) {
        const z = zonas[i];
        if (z.danoAplicado) continue;
        const dx = jugCx - z.cx;
        const dy = jugCy - z.cy;
        if (dx * dx + dy * dy <= z.radio * z.radio) {
            z.danoAplicado = true;
            return { dano: z.dano, desdeX: z.cx };
        }
    }
    return null;
}

// --- Parsear color hex a componentes para partículas ---

export function hexARgb(hex) {
    if (!hex || hex.length < 7) return { r: 200, g: 100, b: 255 };
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

// --- Renderizar efectos de ataque ---

export function renderizarAtaques(ctx, camaraX, camaraY) {
    // Telégrafo: pulso visual alrededor del boss
    if (bossRef && bossRef.vivo && bossRef.ataqueEstado === 'telegrafo' && bossRef.ataqueActual) {
        const px = Math.round(bossRef.x + bossRef.ancho / 2 - camaraX);
        const py = Math.round(bossRef.y + bossRef.alto / 2 - camaraY);
        const pulso = Math.sin(bossRef.ataqueTimer * 0.3) * 0.5 + 0.5;
        const radio = Math.max(bossRef.ancho, bossRef.alto) * 0.8;

        ctx.fillStyle = bossRef.ataqueActual.color || '#ffffff';
        ctx.globalAlpha = pulso * 0.25;
        ctx.beginPath();
        ctx.arc(px, py, radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Indicador "!" sobre el boss
        const { r, g, b } = hexARgb(bossRef.ataqueActual.color);
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.5 + pulso * 0.5) + ')';
        const ix = px;
        const iy = Math.round(bossRef.y - 12 - camaraY);
        ctx.fillRect(ix - 1, iy, 2, 4);
        ctx.fillRect(ix - 1, iy + 6, 2, 2);
    }

    // Proyectiles
    for (let i = 0; i < proyectiles.length; i++) {
        const p = proyectiles[i];
        const px = Math.round(p.x - camaraX);
        const py = Math.round(p.y - camaraY);
        const tam = p.ancho;

        // Halo exterior
        ctx.fillStyle = p.colorSec;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(px, py, tam, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, tam * 0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    // Zonas de daño
    for (let i = 0; i < zonas.length; i++) {
        const z = zonas[i];
        const zx = Math.round(z.cx - camaraX);
        const zy = Math.round(z.cy - camaraY);
        const ratio = z.vida / z.vidaMax;
        // Radio se expande al inicio y se encoge al final
        const radioActual = z.radio * (0.7 + (1 - ratio) * 0.3);

        // Anillo exterior
        ctx.strokeStyle = z.color;
        ctx.globalAlpha = ratio * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zx, zy, radioActual, 0, Math.PI * 2);
        ctx.stroke();

        // Relleno semitransparente
        ctx.fillStyle = z.color;
        ctx.globalAlpha = ratio * 0.12;
        ctx.beginPath();
        ctx.arc(zx, zy, radioActual, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

// --- Getters para partículas ---

export function obtenerProyectiles() {
    return proyectiles;
}

export function obtenerBossAtaque() {
    if (!bossRef || !bossRef.vivo) return null;
    return bossRef;
}

// --- Limpiar ---

export function limpiarAtaques() {
    proyectiles.length = 0;
    zonas.length = 0;
    bossRef = null;
}
