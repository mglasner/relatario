// Showcase de climas — herramienta de desarrollo
// Paneles animados para El Abismo y El Laberinto 3D

import { PALETAS_PETALO, PALETAS_HOJA } from '../juegos/clima.js';

const W = 480;
const H = 270;
const TAM = 16;
const SUELO_Y = H - 3 * TAM;
const PI2 = Math.PI * 2;

const CLIMAS = [
    { id: 'ninguno', label: 'Sin clima', sub: '— Sin estación —' },
    { id: 'invierno', label: 'Invierno', sub: 'La Tormenta Arcana' },
    { id: 'primavera', label: 'Primavera', sub: 'El Despertar del Bosque' },
    { id: 'verano', label: 'Verano', sub: 'El Sol Abrasador' },
    { id: 'otono', label: 'Otoño', sub: 'La Danza de las Hojas' },
];

// ─── Paletas ─────────────────────────────────────────────────────────────────

const PAL_ABISMO = {
    ninguno: {
        dia: false,
        cTop: '#050520',
        cMid: '#0a0a3e',
        cBot: '#0d0d48',
        mont: '#12123a',
        riscos: '#18184a',
        suelo: '#2a2a5e',
        plat: '#3a3a7e',
        tinte: null,
    },
    invierno: {
        dia: false,
        cTop: '#080d18',
        cMid: '#0d1a30',
        cBot: '#142240',
        mont: '#080e20',
        riscos: '#0d1428',
        suelo: '#1a2840',
        plat: '#253a58',
        tinte: [15, 30, 70, 0.18],
    },
    primavera: {
        dia: true,
        cTop: '#4a9ed4',
        cMid: '#7ec8e8',
        cBot: '#ffe8b8',
        mont: '#2d6020',
        riscos: '#224818',
        suelo: '#4a6030',
        plat: '#5a7840',
        tinte: [100, 200, 80, 0.07],
    },
    verano: {
        dia: true,
        cTop: '#1a5fa8',
        cMid: '#3a8fd4',
        cBot: '#e8c040',
        mont: '#3a5420',
        riscos: '#2e4018',
        suelo: '#5c4020',
        plat: '#7a5030',
        tinte: [220, 140, 20, 0.12],
    },
    otono: {
        dia: false,
        cTop: '#2a1408',
        cMid: '#4a2410',
        cBot: '#6a3818',
        mont: '#3a1e08',
        riscos: '#4a2810',
        suelo: '#5c3818',
        plat: '#7a5030',
        tinte: [180, 80, 20, 0.1],
    },
};

const PAL_3D = {
    ninguno: {
        cA: '#0a0804',
        cB: '#1a1208',
        sA: '#1a1408',
        sB: '#0a0804',
        wNS: { r: 26, g: 62, b: 30 },
        wEO: { r: 37, g: 85, b: 42 },
        tinte: null,
    },
    invierno: {
        cA: '#080d18',
        cB: '#142240',
        sA: '#0a1428',
        sB: '#060c18',
        wNS: { r: 20, g: 40, b: 70 },
        wEO: { r: 28, g: 55, b: 95 },
        tinte: 'rgba(30,60,120,0.12)',
    },
    primavera: {
        cA: '#5ba8d4',
        cB: '#9dd5b0',
        sA: '#4a9e5c',
        sB: '#2d6b3a',
        wNS: { r: 30, g: 80, b: 35 },
        wEO: { r: 40, g: 110, b: 50 },
        tinte: 'rgba(100,200,80,0.08)',
    },
    verano: {
        cA: '#c07010',
        cB: '#e8a020',
        sA: '#8b5010',
        sB: '#5a3008',
        wNS: { r: 80, g: 55, b: 20 },
        wEO: { r: 110, g: 75, b: 25 },
        tinte: 'rgba(220,140,20,0.10)',
    },
    otono: {
        cA: '#2a1408',
        cB: '#5a2c0e',
        sA: '#6b3810',
        sB: '#3a1c08',
        wNS: { r: 60, g: 35, b: 15 },
        wEO: { r: 80, g: 48, b: 20 },
        tinte: 'rgba(180,80,20,0.08)',
    },
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

function ruido1D(x, seed) {
    return (
        Math.sin(x * 0.3 + seed) * 0.5 +
        Math.sin(x * 0.7 + seed * 2.1) * 0.3 +
        Math.sin(x * 1.3 + seed * 0.7) * 0.2
    );
}

function generarVineta() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.7
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    return c;
}

// ─── Fondos offscreen ─────────────────────────────────────────────────────────

function generarBgAbismo(id) {
    const pal = PAL_ABISMO[id];
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    const gC = ctx.createLinearGradient(0, 0, 0, H);
    gC.addColorStop(0, pal.cTop);
    gC.addColorStop(0.6, pal.cMid);
    gC.addColorStop(1, pal.cBot);
    ctx.fillStyle = gC;
    ctx.fillRect(0, 0, W, H);

    if (!pal.dia) {
        for (let i = 0; i < 60; i++) {
            const sx = (i * 137 + 51) % W;
            const sy = (i * 89 + 23) % (H - 80);
            ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + (i % 5) * 0.1) + ')';
            ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
        }
    } else {
        const solX = id === 'verano' ? W * 0.15 : W * 0.78;
        const solY = H * 0.12;
        const gs = ctx.createRadialGradient(solX, solY, 0, solX, solY, 28);
        gs.addColorStop(0, 'rgba(255,255,220,0.95)');
        gs.addColorStop(0.4, 'rgba(255,240,140,0.7)');
        gs.addColorStop(1, 'rgba(255,220,80,0)');
        ctx.fillStyle = gs;
        ctx.fillRect(solX - 30, solY - 30, 60, 60);
    }

    ctx.fillStyle = pal.mont;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let px = 0; px <= W; px += 2) {
        ctx.lineTo(px, H * 0.55 + ruido1D(px * 0.015, 3.7) * H * 0.2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = pal.riscos;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let px = 0; px <= W; px += 2) {
        const pico = Math.abs(Math.sin(px * 0.05 + 2.3)) * 0.15;
        ctx.lineTo(px, H * 0.65 + (ruido1D(px * 0.025, 7.1) - pico) * H * 0.2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    return c;
}

function generarBg3D(id) {
    const pal = PAL_3D[id];
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // Cielo
    const gC = ctx.createLinearGradient(0, 0, 0, H / 2);
    gC.addColorStop(0, pal.cA);
    gC.addColorStop(1, pal.cB);
    ctx.fillStyle = gC;
    ctx.fillRect(0, 0, W, H / 2);

    // Suelo
    const gS = ctx.createLinearGradient(0, H / 2, 0, H);
    gS.addColorStop(0, pal.sA);
    gS.addColorStop(1, pal.sB);
    ctx.fillStyle = gS;
    ctx.fillRect(0, H / 2, W, H / 2);

    // Mini-raycaster: corredor recto (ancho 1 tile, 8 tiles de profundidad)
    // Cada columna de píxeles = un rayo independiente
    const FOV_R = Math.PI / 3;
    const corrH = 0.5; // semiancho del corredor
    const profMax = 8;

    for (let i = 0; i < W; i++) {
        const ang = -FOV_R / 2 + (i / W) * FOV_R;
        const cosA = Math.cos(ang);
        const sinA = Math.sin(ang);

        const distLado = sinA !== 0 ? Math.abs(corrH / sinA) : Infinity;
        const distFondo = cosA > 0 ? profMax / cosA : Infinity;
        const esLado = distLado < distFondo;
        const dist = Math.min(distLado, distFondo);
        if (!isFinite(dist) || dist <= 0) continue;

        const wallH = Math.min(H, (H / dist) * 1.2);
        const yTop = H / 2 - wallH / 2;

        const col = esLado ? pal.wNS : pal.wEO;
        const niebla = Math.max(0.08, 1 - dist / 14);
        ctx.fillStyle =
            'rgb(' +
            Math.floor(col.r * niebla) +
            ',' +
            Math.floor(col.g * niebla) +
            ',' +
            Math.floor(col.b * niebla) +
            ')';
        ctx.fillRect(i, yTop, 2, wallH);
    }

    // Antorchas en las paredes laterales
    for (const ax of [W * 0.28, W * 0.72]) {
        const gT = ctx.createRadialGradient(ax, H * 0.46, 0, ax, H * 0.46, 22);
        gT.addColorStop(0, 'rgba(255,160,40,0.30)');
        gT.addColorStop(1, 'rgba(255,100,10,0)');
        ctx.fillStyle = gT;
        ctx.fillRect(ax - 24, H * 0.34, 48, 48);
        ctx.fillStyle = 'rgba(255,140,20,0.7)';
        ctx.fillRect(ax - 1, H * 0.45, 2, 4);
    }

    // Glow del fondo (fondo del corredor)
    const gF = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 40);
    gF.addColorStop(0, 'rgba(255,180,60,0.22)');
    gF.addColorStop(0.5, 'rgba(255,120,20,0.08)');
    gF.addColorStop(1, 'rgba(255,60,10,0)');
    ctx.fillStyle = gF;
    ctx.fillRect(W / 2 - 44, H / 2 - 44, 88, 88);

    return c;
}

// ─── Estado de panel ──────────────────────────────────────────────────────────

function crearEstado(id) {
    return {
        id,
        bg: null, // se asigna desde el llamador
        partic: [],
        t: 0,
        relFrames: 0,
        relFade: 0,
        relProx: 280 + Math.floor(Math.random() * 140),
        relCount: 0,
        rafCounter: 0,
        rafProx: 200 + Math.floor(Math.random() * 100),
        rafActiva: false,
        rafFrames: 0,
    };
}

// ─── Sistema de partículas compartido ────────────────────────────────────────

function emitir(est) {
    const { id, partic, t } = est;

    if (id === 'invierno') {
        if (t % 2 === 0) {
            partic.push({
                x: Math.random() * (W + 40) - 20,
                y: -6,
                vx: -1.2,
                vy: 6 + Math.random() * 1.5,
                vida: 25,
                vidaMax: 25,
                r: 150,
                g: 180,
                b: 255,
                alpha: 0.6,
                tipo: 'lluvia',
                tam: 1,
            });
        }
    } else if (id === 'primavera') {
        if (t % 4 === 0) {
            const c = PALETAS_PETALO[Math.floor(Math.random() * PALETAS_PETALO.length)];
            const vm = 140 + Math.floor(Math.random() * 80);
            partic.push({
                x: Math.random() * W,
                y: -5,
                vx: 0,
                vy: 0.3 + Math.random() * 0.25,
                vida: vm,
                vidaMax: vm,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.92,
                tipo: 'petalo',
                tam: 3.5 + Math.random() * 2.5,
            });
        }
        if (t % 9 === 0 && Math.random() < 0.4) {
            partic.push({
                x: Math.random() * W,
                y: Math.random() * H * 0.6,
                vx: 0,
                vy: 0,
                vida: 70 + Math.floor(Math.random() * 20),
                vidaMax: 90,
                r: 255,
                g: 255,
                b: 200,
                alpha: 0.7,
                tipo: 'destello',
                tam: 1,
            });
        }
    } else if (id === 'verano') {
        if (t % 5 === 0) {
            partic.push({
                x: Math.random() * W,
                y: H * 0.2 + Math.random() * H * 0.55,
                vx: 0.12 + Math.random() * 0.13,
                vy: 0,
                vida: 280 + Math.floor(Math.random() * 70),
                vidaMax: 350,
                r: 255,
                g: 210,
                b: 120,
                alpha: 0.28 + Math.random() * 0.17,
                tipo: 'polvo',
                tam: 1 + Math.random(),
            });
        }
    } else if (id === 'otono') {
        if (t % 3 === 0) {
            const c = PALETAS_HOJA[Math.floor(Math.random() * PALETAS_HOJA.length)];
            const mult = est.rafActiva ? 2.5 : 1;
            const vm = 90 + Math.floor(Math.random() * 50);
            partic.push({
                x: Math.random() * W,
                y: -5,
                vx: (-0.8 - Math.random() * 1.4) * mult,
                vy: 0.4 + Math.random() * 0.8,
                vida: vm,
                vidaMax: vm,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.8,
                tipo: 'hoja',
                tam: 2 + Math.random() * 2,
            });
        }
        if (t % 4 === 0) {
            partic.push({
                x: Math.random() * (W + 20),
                y: -3,
                vx: -0.6,
                vy: 2.5 + Math.random(),
                vida: 40,
                vidaMax: 40,
                r: 180,
                g: 150,
                b: 100,
                alpha: 0.28,
                tipo: 'lluvia-suave',
                tam: 0.5,
            });
        }
    }
}

function actualizar(est) {
    const { id, t } = est;

    if (id === 'invierno') {
        est.relCount++;
        if (est.relCount >= est.relProx && est.relFrames === 0) {
            est.relFrames = 3;
            est.relFade = 9;
            est.relProx = 280 + Math.floor(Math.random() * 140);
            est.relCount = 0;
        }
        if (est.relFrames > 0) est.relFrames--;
        else if (est.relFade > 0) est.relFade--;
    }

    if (id === 'otono') {
        est.rafCounter++;
        if (!est.rafActiva && est.rafCounter >= est.rafProx) {
            est.rafActiva = true;
            est.rafFrames = 30;
            est.rafProx = 200 + Math.floor(Math.random() * 100);
            est.rafCounter = 0;
        }
        if (est.rafActiva && --est.rafFrames <= 0) est.rafActiva = false;
    }

    const vivas = [];
    for (const p of est.partic) {
        if (p.tipo === 'petalo') {
            p.vx = Math.sin(t * 0.04 + p.vidaMax * 0.27) * 1.1;
        } else if (p.tipo === 'polvo') {
            p.vy = Math.sin(t * 0.02 + p.x * 0.05) * 0.15;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vida--;
        if (p.vida <= 0 || p.x < -20 || p.x > W + 20 || p.y > H + 20) continue;
        vivas.push(p);
    }
    est.partic = vivas;
    est.t++;
}

function renderParticulas(ctx, partic, t) {
    for (const p of partic) {
        const vr = p.vida / p.vidaMax;
        const a = Math.max(0, Math.min(1, vr > 0.15 ? p.alpha : (vr / 0.15) * p.alpha));
        if (a < 0.01) continue;

        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + a.toFixed(2) + ')';

        if (p.tipo === 'petalo') {
            const ang = Math.atan2(p.vy, p.vx);
            const esc = 1 + 0.28 * Math.sin(p.vida * 0.12 + p.vidaMax * 0.43);
            const tam = p.tam * esc;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.ellipse(0, 0, tam * 1.4, tam * 0.55, 0, 0, PI2);
            ctx.fill();
            ctx.restore();
        } else if (p.tipo === 'hoja') {
            const ang = Math.atan2(p.vy, p.vx) + Math.PI * 0.5;
            const esc = 1 + 0.28 * Math.sin(p.vida * 0.12 + p.vidaMax * 0.43);
            const rh = p.tam * esc;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, -rh * 1.6);
            ctx.bezierCurveTo(rh * 0.85, -rh * 0.6, rh * 0.85, rh * 0.6, 0, rh * 1.6);
            ctx.bezierCurveTo(-rh * 0.85, rh * 0.6, -rh * 0.85, -rh * 0.6, 0, -rh * 1.6);
            ctx.fill();
            ctx.restore();
        } else if (p.tipo === 'destello') {
            const dA = a * Math.abs(Math.sin(t * 0.15 + p.x * 0.1));
            ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + dA.toFixed(2) + ')';
            ctx.fillRect(p.x, p.y, 1, 1);
        } else if (p.tipo === 'lluvia') {
            ctx.fillRect(p.x, p.y, 1, 5);
        } else if (p.tipo === 'lluvia-suave') {
            ctx.fillRect(p.x, p.y, 0.5, 3);
        } else {
            const m = p.tam / 2;
            ctx.fillRect(p.x - m, p.y - m, p.tam, p.tam);
        }
    }
}

// ─── Efectos especiales de clima ──────────────────────────────────────────────

function renderEfectosClima(ctx, est) {
    const { id, t } = est;

    if (id === 'invierno') {
        if (est.relFrames > 0) {
            ctx.fillStyle = 'rgba(200,170,255,0.70)';
            ctx.fillRect(0, 0, W, H);
        } else if (est.relFade > 0) {
            ctx.fillStyle = 'rgba(200,170,255,' + ((0.7 * est.relFade) / 9).toFixed(3) + ')';
            ctx.fillRect(0, 0, W, H);
        }
    } else if (id === 'primavera') {
        const sg = ctx.createRadialGradient(W * 0.85, H * 0.05, 0, W * 0.85, H * 0.05, W * 0.6);
        sg.addColorStop(0, 'rgba(255,255,180,0.10)');
        sg.addColorStop(1, 'rgba(255,255,180,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
    } else if (id === 'verano') {
        const radio = 70 + Math.sin(t * 0.025) * 20;
        const sg = ctx.createRadialGradient(W * 0.12, H * 0.08, 0, W * 0.12, H * 0.08, radio);
        sg.addColorStop(0, 'rgba(255,220,80,0.14)');
        sg.addColorStop(1, 'rgba(255,220,80,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, W, H);
    } else if (id === 'otono' && est.rafActiva) {
        ctx.fillStyle = 'rgba(200,160,80,0.08)';
        for (let i = 0; i < 5; i++) ctx.fillRect(0, H * 0.3 + i * 25, W, 2);
    }
}

// ─── Render El Abismo ─────────────────────────────────────────────────────────

function renderPanelAbismo(ctx, est, vineta) {
    const { id, t } = est;
    const pal = PAL_ABISMO[id];

    ctx.drawImage(est.bg, 0, 0);

    if (pal.dia) {
        const b = 0.05 + Math.sin(t * 0.002) * 0.02;
        ctx.fillStyle = 'rgba(255,240,180,' + b.toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H * 0.5);
    } else if (id !== 'otono') {
        ctx.globalAlpha = 0.85 + Math.sin(t * 0.003) * 0.15;
        ctx.fillStyle = 'rgba(200,220,255,0.6)';
        for (let i = 0; i < 5; i++) {
            if (Math.sin(t * 0.005 + i * 1.7) > 0.3)
                ctx.fillRect((i * 53 + 17) % W, (i * 41 + 7) % (H / 2), 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    // Suelo y plataformas representativas del mapa
    ctx.fillStyle = pal.suelo;
    ctx.fillRect(0, SUELO_Y, W, H - SUELO_Y);
    ctx.fillStyle = pal.plat;
    ctx.fillRect(55, H * 0.625, 5 * TAM, TAM);
    ctx.fillRect(210, H * 0.53, 5 * TAM, TAM);
    ctx.fillRect(350, H * 0.66, 4 * TAM, TAM);

    // Hueco de abismo
    ctx.clearRect(290, SUELO_Y, 3 * TAM, H - SUELO_Y);
    const gA = ctx.createLinearGradient(290, SUELO_Y, 290, SUELO_Y - 3 * TAM);
    gA.addColorStop(0, 'rgba(255,100,20,0.28)');
    gA.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = gA;
    ctx.fillRect(290, SUELO_Y - 3 * TAM, 3 * TAM, 3 * TAM);

    renderParticulas(ctx, est.partic, t);
    renderEfectosClima(ctx, est);

    if (pal.tinte) {
        const [r, g, b, a] = pal.tinte;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        ctx.fillRect(0, 0, W, H);
    }

    ctx.drawImage(vineta, 0, 0);
}

// ─── Render El Laberinto 3D ───────────────────────────────────────────────────

function renderPanel3D(ctx, est, vineta) {
    const { id, t } = est;
    const pal = PAL_3D[id];

    ctx.drawImage(est.bg, 0, 0);

    // Pulso del glow de antorchas (animado)
    const pulso = 0.18 + Math.sin(t * 0.06) * 0.07;
    for (const ax of [W * 0.28, W * 0.72]) {
        const gT = ctx.createRadialGradient(ax, H * 0.46, 0, ax, H * 0.46, 20);
        gT.addColorStop(0, 'rgba(255,160,40,' + pulso.toFixed(3) + ')');
        gT.addColorStop(1, 'rgba(255,100,10,0)');
        ctx.fillStyle = gT;
        ctx.fillRect(ax - 24, H * 0.34, 48, 48);
    }

    renderParticulas(ctx, est.partic, t);
    renderEfectosClima(ctx, est);

    if (pal.tinte) {
        ctx.fillStyle = pal.tinte;
        ctx.fillRect(0, 0, W, H);
    }

    ctx.drawImage(vineta, 0, 0);
}

// ─── Montaje de sección ───────────────────────────────────────────────────────

function montarSeccion(contenedorId, renderFn, generarBgFn) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    const vineta = generarVineta();
    const paneles = [];

    for (const clima of CLIMAS) {
        const card = document.createElement('div');
        card.className = 'card';

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        canvas.style.width = '240px';
        canvas.style.height = '135px';

        const nombre = document.createElement('span');
        nombre.className = 'name';
        nombre.textContent = clima.label;

        const sub = document.createElement('span');
        sub.style.cssText =
            'display:block;font-size:0.65em;color:#888;margin-top:2px;line-height:1.2;min-height:2em';
        sub.textContent = clima.sub;

        card.append(canvas, nombre, sub);
        contenedor.appendChild(card);

        const est = crearEstado(clima.id);
        est.bg = generarBgFn(clima.id);
        paneles.push({ ctx: canvas.getContext('2d'), est });
    }

    function loop() {
        for (const { ctx, est } of paneles) {
            emitir(est);
            actualizar(est);
            renderFn(ctx, est, vineta);
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// ─── Inicio ───────────────────────────────────────────────────────────────────

montarSeccion('climaShowcaseAbismo', renderPanelAbismo, generarBgAbismo);
montarSeccion('climaShowcase3D', renderPanel3D, generarBg3D);
