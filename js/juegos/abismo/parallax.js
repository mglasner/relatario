// Habitacion 4 — El Abismo: Fondo parallax multicapa
// Capas generadas una vez en offscreen canvases, renderizadas con drawImage

import { CFG } from './config.js';

const ANCHO = CFG.canvas.anchoBase;
const ALTO = CFG.canvas.altoBase;

// Offscreen canvases para cada capa
let capaCielo = null;
let capaNeblina = null;
let capaMontanas = null;
let capaRiscos = null;
let capaNiebla = null;

// Indica si el fondo es de día (primavera/verano)
let esDeDia = false;

// Velocidades de parallax por capa (relativas a la camara)
const VEL_NEBLINA = 0.05;
const VEL_MONTANAS = 0.1;
const VEL_RISCOS = 0.25;
const VEL_NIEBLA = 0.4;

// Ruido 1D simple (suma de senos)
function ruido1D(x, seed) {
    return (
        Math.sin(x * 0.3 + seed) * 0.5 +
        Math.sin(x * 0.7 + seed * 2.1) * 0.3 +
        Math.sin(x * 1.3 + seed * 0.7) * 0.2
    );
}

// --- Paletas de fondo por estación ---

const PALETA_NOCHE = {
    cieloTop: '#050520',
    cieloMid: '#0a0a3e',
    cieloBot: '#0d0d48',
    neblinaColores: [
        [80, 40, 120],
        [40, 60, 130],
        [100, 50, 100],
    ],
    montanas: '#12123a',
    riscos: '#18184a',
    nieblaColor: [100, 80, 160],
};

const PALETA_PRIMAVERA = {
    cieloTop: '#4a9ed4',
    cieloMid: '#7ec8e8',
    cieloBot: '#ffe8b8',
    neblinaColores: [
        [255, 250, 240],
        [230, 245, 220],
        [200, 230, 255],
    ],
    montanas: '#2d6020',
    riscos: '#224818',
    nieblaColor: [180, 230, 160],
};

const PALETA_VERANO = {
    cieloTop: '#1a5fa8',
    cieloMid: '#3a8fd4',
    cieloBot: '#e8c040',
    neblinaColores: [
        [255, 245, 200],
        [255, 230, 150],
        [240, 220, 180],
    ],
    montanas: '#3a5420',
    riscos: '#2e4018',
    nieblaColor: [255, 210, 80],
};

// --- Generadores de cada capa ---

function generarCielo(paleta) {
    const c = document.createElement('canvas');
    c.width = ANCHO;
    c.height = ALTO;
    const ctx = c.getContext('2d');

    // Gradiente de fondo
    const grad = ctx.createLinearGradient(0, 0, 0, ALTO);
    grad.addColorStop(0, paleta.cieloTop);
    grad.addColorStop(0.6, paleta.cieloMid);
    grad.addColorStop(1, paleta.cieloBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ANCHO, ALTO);

    if (paleta === PALETA_NOCHE) {
        // Estrellas (~80) solo de noche
        for (let i = 0; i < 80; i++) {
            const sx = (i * 137 + 51) % ANCHO;
            const sy = (i * 89 + 23) % (ALTO - 40);
            const tamano = i % 3 === 0 ? 2 : 1;
            const brillo = 0.4 + (i % 5) * 0.12;
            ctx.fillStyle = 'rgba(255,255,255,' + brillo + ')';
            ctx.fillRect(sx, sy, tamano, tamano);
        }
    } else {
        // Sol visible de día: disco brillante en la esquina superior
        const solX = paleta === PALETA_VERANO ? ANCHO * 0.15 : ANCHO * 0.78;
        const solY = ALTO * 0.12;
        const gradSol = ctx.createRadialGradient(solX, solY, 0, solX, solY, 28);
        gradSol.addColorStop(0, 'rgba(255,255,220,0.95)');
        gradSol.addColorStop(0.4, 'rgba(255,240,140,0.7)');
        gradSol.addColorStop(1, 'rgba(255,220,80,0)');
        ctx.fillStyle = gradSol;
        ctx.fillRect(solX - 30, solY - 30, 60, 60);
    }

    return c;
}

function generarNeblina(paleta) {
    const c = document.createElement('canvas');
    c.width = ANCHO * 2;
    c.height = ALTO;
    const ctx = c.getContext('2d');

    if (paleta === PALETA_NOCHE) {
        // Círculos borrosos con blending aditivo (aurora nocturna)
        ctx.globalCompositeOperation = 'lighter';
    }

    for (let i = 0; i < 12; i++) {
        const cx = (i * 97 + 30) % (ANCHO * 2);
        const cy = ALTO * 0.3 + ruido1D(i, 5.3) * ALTO * 0.3;
        const radio = 40 + (i % 4) * 25;
        const col = paleta.neblinaColores[i % paleta.neblinaColores.length];
        // Nubes de día más visibles, aurora nocturna más sutil
        const alpha = paleta === PALETA_NOCHE ? 0.04 + (i % 3) * 0.015 : 0.06 + (i % 3) * 0.025;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
        grad.addColorStop(0, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')');
        grad.addColorStop(1, 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radio, cy - radio, radio * 2, radio * 2);
    }

    if (paleta === PALETA_NOCHE) {
        ctx.globalCompositeOperation = 'source-over';
    }
    return c;
}

function generarMontanas(paleta) {
    const anchoTotal = ANCHO * 2;
    const c = document.createElement('canvas');
    c.width = anchoTotal;
    c.height = ALTO;
    const ctx = c.getContext('2d');

    ctx.fillStyle = paleta.montanas;
    ctx.beginPath();
    ctx.moveTo(0, ALTO);

    for (let px = 0; px <= anchoTotal; px += 2) {
        const h = ruido1D(px * 0.015, 3.7);
        const py = ALTO * 0.55 + h * ALTO * 0.2;
        ctx.lineTo(px, py);
    }

    ctx.lineTo(anchoTotal, ALTO);
    ctx.closePath();
    ctx.fill();

    return c;
}

function generarRiscos(paleta) {
    const anchoTotal = ANCHO * 2;
    const c = document.createElement('canvas');
    c.width = anchoTotal;
    c.height = ALTO;
    const ctx = c.getContext('2d');

    ctx.fillStyle = paleta.riscos;
    ctx.beginPath();
    ctx.moveTo(0, ALTO);

    for (let px = 0; px <= anchoTotal; px += 2) {
        const h = ruido1D(px * 0.025, 7.1);
        // Picos mas agudos
        const pico = Math.abs(Math.sin(px * 0.05 + 2.3)) * 0.15;
        const py = ALTO * 0.65 + (h - pico) * ALTO * 0.2;
        ctx.lineTo(px, py);
    }

    ctx.lineTo(anchoTotal, ALTO);
    ctx.closePath();
    ctx.fill();

    return c;
}

function generarNiebla(paleta) {
    const anchoTotal = ANCHO * 2;
    const c = document.createElement('canvas');
    c.width = anchoTotal;
    c.height = ALTO;
    const ctx = c.getContext('2d');

    const [nr, ng, nb] = paleta.nieblaColor;

    // Franjas horizontales de niebla baja
    for (let i = 0; i < 6; i++) {
        const fx = (i * 143 + 20) % anchoTotal;
        const fy = ALTO * 0.78 + (i % 3) * 12;
        const fw = 80 + (i % 4) * 40;
        const fh = 8 + (i % 3) * 6;
        const alpha = 0.06 + (i % 3) * 0.02;

        const grad = ctx.createLinearGradient(fx, fy, fx, fy + fh);
        grad.addColorStop(0, 'rgba(' + nr + ',' + ng + ',' + nb + ',' + alpha + ')');
        grad.addColorStop(1, 'rgba(' + nr + ',' + ng + ',' + nb + ',0)');
        ctx.fillStyle = grad;
        ctx.fillRect(fx, fy, fw, fh);
    }

    return c;
}

// --- API publica ---

/**
 * @param {string|null} estacion - Estación climática activa (null = noche por defecto)
 */
export function iniciarParallax(estacion) {
    let paleta = PALETA_NOCHE;
    if (estacion === 'primavera') paleta = PALETA_PRIMAVERA;
    else if (estacion === 'verano') paleta = PALETA_VERANO;

    esDeDia = paleta !== PALETA_NOCHE;

    capaCielo = generarCielo(paleta);
    capaNeblina = generarNeblina(paleta);
    capaMontanas = generarMontanas(paleta);
    capaRiscos = generarRiscos(paleta);
    capaNiebla = generarNiebla(paleta);
}

export function renderizarParallax(ctx, camaraX, tiempo) {
    if (!capaCielo) return;

    // Capa 0: Cielo fijo
    ctx.drawImage(capaCielo, 0, 0);

    if (esDeDia) {
        // De día: brillo suave del sol (pulsante)
        const brillo = 0.06 + Math.sin(tiempo * 0.002) * 0.03;
        ctx.fillStyle = 'rgba(255,240,180,' + brillo.toFixed(3) + ')';
        ctx.fillRect(0, 0, ANCHO, ALTO * 0.5);
    } else {
        // De noche: parpadeo de estrellas via globalAlpha sutil
        const parpadeo = 0.85 + Math.sin(tiempo * 0.003) * 0.15;
        ctx.globalAlpha = parpadeo;
        ctx.fillStyle = 'rgba(200,220,255,0.6)';
        for (let i = 0; i < 8; i++) {
            const sx = (i * 53 + 17) % ANCHO;
            const sy = (i * 41 + 7) % (ALTO / 2);
            const t = Math.sin(tiempo * 0.005 + i * 1.7);
            if (t > 0.3) {
                ctx.fillRect(sx, sy, 1, 1);
            }
        }
        ctx.globalAlpha = 1;
    }

    // Capa 1: Neblina/aurora (se desplaza lento)
    const offNeblina = (camaraX * VEL_NEBLINA) % capaNeblina.width;
    ctx.drawImage(capaNeblina, -offNeblina, 0);
    ctx.drawImage(capaNeblina, capaNeblina.width - offNeblina, 0);

    // Capa 2: Montanas lejanas
    const offMontanas = (camaraX * VEL_MONTANAS) % capaMontanas.width;
    ctx.drawImage(capaMontanas, -offMontanas, 0);
    ctx.drawImage(capaMontanas, capaMontanas.width - offMontanas, 0);

    // Capa 3: Riscos/columnas
    const offRiscos = (camaraX * VEL_RISCOS) % capaRiscos.width;
    ctx.drawImage(capaRiscos, -offRiscos, 0);
    ctx.drawImage(capaRiscos, capaRiscos.width - offRiscos, 0);

    // Capa 4: Niebla baja con ondulacion
    const offNiebla = (camaraX * VEL_NIEBLA) % capaNiebla.width;
    const ondulacion = Math.sin(tiempo * 0.002) * 3;
    ctx.drawImage(capaNiebla, -offNiebla, ondulacion);
    ctx.drawImage(capaNiebla, capaNiebla.width - offNiebla, ondulacion);
}

export function limpiarParallax() {
    capaCielo = null;
    capaNeblina = null;
    capaMontanas = null;
    capaRiscos = null;
    capaNiebla = null;
    esDeDia = false;
}
