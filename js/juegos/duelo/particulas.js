// El Duelo — Sistema de partículas
// Emisores para impacto de golpe, bloqueo, y KO

const particulas = [];
const MAX_PARTICULAS = 150;

function emitir(x, y, cantidad, cfg) {
    for (let i = 0; i < cantidad && particulas.length < MAX_PARTICULAS; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const vel = cfg.velMin + Math.random() * (cfg.velMax - cfg.velMin);
        particulas.push({
            x: x + (Math.random() - 0.5) * (cfg.spread || 4),
            y: y + (Math.random() - 0.5) * (cfg.spread || 4),
            vx: Math.cos(angulo) * vel,
            vy: Math.sin(angulo) * vel - (cfg.uplift || 0),
            vida: cfg.vidaMin + Math.random() * (cfg.vidaMax - cfg.vidaMin),
            vidaMax: cfg.vidaMax,
            r: cfg.r,
            g: cfg.g,
            b: cfg.b,
            tam: cfg.tamMin + Math.random() * (cfg.tamMax - cfg.tamMin),
            gravedad: cfg.gravedad || 0,
            friccion: cfg.friccion || 0.98,
        });
    }
}

/**
 * Emite partículas de impacto de golpe
 */
export function emitirImpacto(x, y, r, g, b) {
    emitir(x, y, 12, {
        r,
        g,
        b,
        velMin: 1,
        velMax: 3,
        vidaMin: 10,
        vidaMax: 25,
        tamMin: 1.5,
        tamMax: 3,
        uplift: 1,
        spread: 6,
        gravedad: 0.08,
        friccion: 0.95,
    });
    // Chispas blancas
    emitir(x, y, 5, {
        r: 255,
        g: 255,
        b: 255,
        velMin: 2,
        velMax: 4,
        vidaMin: 5,
        vidaMax: 12,
        tamMin: 1,
        tamMax: 2,
        spread: 3,
        friccion: 0.92,
    });
}

/**
 * Emite partículas de bloqueo (escudo)
 */
export function emitirBloqueo(x, y) {
    emitir(x, y, 8, {
        r: 200,
        g: 220,
        b: 255,
        velMin: 0.5,
        velMax: 2,
        vidaMin: 8,
        vidaMax: 18,
        tamMin: 1,
        tamMax: 2.5,
        uplift: 0.5,
        spread: 8,
        friccion: 0.96,
    });
}

/**
 * Emite partículas de KO (explosión grande)
 */
export function emitirKO(x, y) {
    // Explosión naranja/roja
    emitir(x, y, 25, {
        r: 255,
        g: 140,
        b: 40,
        velMin: 1.5,
        velMax: 5,
        vidaMin: 15,
        vidaMax: 40,
        tamMin: 2,
        tamMax: 5,
        uplift: 2,
        spread: 10,
        gravedad: 0.05,
        friccion: 0.94,
    });
    // Estrellas blancas
    emitir(x, y, 10, {
        r: 255,
        g: 255,
        b: 220,
        velMin: 2,
        velMax: 6,
        vidaMin: 10,
        vidaMax: 30,
        tamMin: 1.5,
        tamMax: 3.5,
        spread: 6,
        friccion: 0.93,
    });
}

/**
 * Actualiza todas las partículas
 */
export function actualizarParticulas(dt) {
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.vx *= p.friccion;
        p.vy *= p.friccion;
        p.vy += p.gravedad * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vida -= dt;

        if (p.vida <= 0) {
            particulas.splice(i, 1);
        }
    }
}

/**
 * Renderiza todas las partículas en el canvas
 */
export function renderizarParticulas(ctx) {
    for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];
        const alpha = Math.max(0, p.vida / p.vidaMax);
        const tam = p.tam * (0.5 + alpha * 0.5);

        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + alpha + ')';
        ctx.fillRect(Math.round(p.x - tam / 2), Math.round(p.y - tam / 2), tam, tam);
    }
}

export function limpiarParticulas() {
    particulas.length = 0;
}
