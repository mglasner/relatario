// Showcase de climas — herramienta de desarrollo
// Muestra los 5 estados climáticos del Abismo animados en tiempo real
// Auto-inyecta una sección al final de vitrina.html

const W = 480;
const H = 270;
const TAM = 16; // tile size (igual que el juego)
const SUELO_Y = H - 3 * TAM; // y donde empieza el suelo

// --- Configuración visual por clima ---

const PAL = {
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

const CLIMAS = [
    { id: 'ninguno', label: 'Sin clima', sub: '— Noche normal —' },
    { id: 'invierno', label: 'Invierno', sub: 'La Tormenta Arcana' },
    { id: 'primavera', label: 'Primavera', sub: 'El Despertar del Bosque' },
    { id: 'verano', label: 'Verano', sub: 'El Sol Abrasador' },
    { id: 'otono', label: 'Otoño', sub: 'La Danza de las Hojas' },
];

// --- Generación de fondo (offscreen, una vez por panel) ---

function ruido1D(x, seed) {
    return (
        Math.sin(x * 0.3 + seed) * 0.5 +
        Math.sin(x * 0.7 + seed * 2.1) * 0.3 +
        Math.sin(x * 1.3 + seed * 0.7) * 0.2
    );
}

function generarBg(id) {
    const pal = PAL[id];
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // Cielo
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, pal.cTop);
    grad.addColorStop(0.6, pal.cMid);
    grad.addColorStop(1, pal.cBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (!pal.dia) {
        // Estrellas
        for (let i = 0; i < 60; i++) {
            const sx = (i * 137 + 51) % W;
            const sy = (i * 89 + 23) % (H - 80);
            const br = 0.3 + (i % 5) * 0.1;
            ctx.fillStyle = 'rgba(255,255,255,' + br + ')';
            ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1);
        }
    } else {
        // Sol
        const solX = id === 'verano' ? W * 0.15 : W * 0.78;
        const solY = H * 0.12;
        const gs = ctx.createRadialGradient(solX, solY, 0, solX, solY, 28);
        gs.addColorStop(0, 'rgba(255,255,220,0.95)');
        gs.addColorStop(0.4, 'rgba(255,240,140,0.7)');
        gs.addColorStop(1, 'rgba(255,220,80,0)');
        ctx.fillStyle = gs;
        ctx.fillRect(solX - 30, solY - 30, 60, 60);
    }

    // Montañas lejanas
    ctx.fillStyle = pal.mont;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let px = 0; px <= W; px += 2) {
        const h = ruido1D(px * 0.015, 3.7);
        ctx.lineTo(px, H * 0.55 + h * H * 0.2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // Riscos (más cercanos)
    ctx.fillStyle = pal.riscos;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let px = 0; px <= W; px += 2) {
        const h = ruido1D(px * 0.025, 7.1);
        const pico = Math.abs(Math.sin(px * 0.05 + 2.3)) * 0.15;
        ctx.lineTo(px, H * 0.65 + (h - pico) * H * 0.2);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    return c;
}

// Viñeta compartida (generada una vez)
function generarVineta() {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    const grad = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.35,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.7
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return c;
}

// --- Estado de cada panel ---

function crearEstado(id) {
    return {
        id,
        bg: generarBg(id),
        partic: [],
        t: 0,
        // Relámpago (invierno)
        relFrames: 0,
        relFade: 0,
        relProx: 280 + Math.floor(Math.random() * 140),
        relCount: 0,
        // Ráfaga de viento (otoño)
        rafCounter: 0,
        rafProx: 200 + Math.floor(Math.random() * 100),
        rafActiva: false,
        rafFrames: 0,
    };
}

// --- Sistema de partículas del showcase ---

function emitir(est) {
    const { id, partic, t } = est;

    if (id === 'invierno') {
        // Lluvia densa
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
        // Pétalos multicolor
        if (t % 4 === 0) {
            const paletas = [
                [255, 185, 215],
                [255, 175, 200],
                [225, 185, 245],
                [255, 215, 175],
                [185, 225, 250],
                [255, 240, 175],
                [195, 240, 190],
                [255, 205, 225],
            ];
            const c = paletas[Math.floor(Math.random() * paletas.length)];
            const vidaMax = 140 + Math.floor(Math.random() * 80);
            partic.push({
                x: Math.random() * W,
                y: -5,
                vx: 0,
                vy: 0.3 + Math.random() * 0.25,
                vida: vidaMax,
                vidaMax,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.92,
                tipo: 'petalo',
                tam: 3.5 + Math.random() * 2.5,
            });
        }
        // Destello de luz ocasional
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
        // Motas de polvo flotando
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
        // Hojas con ráfaga
        if (t % 3 === 0) {
            const palHoja = [
                [210, 80, 30],
                [230, 150, 40],
                [140, 50, 20],
                [180, 100, 20],
                [200, 120, 50],
            ];
            const c = palHoja[Math.floor(Math.random() * palHoja.length)];
            const mult = est.rafActiva ? 2.5 : 1;
            const vidaMax = 90 + Math.floor(Math.random() * 50);
            partic.push({
                x: Math.random() * W,
                y: -5,
                vx: (-0.8 - Math.random() * 1.4) * mult,
                vy: 0.4 + Math.random() * 0.8,
                vida: vidaMax,
                vidaMax,
                r: c[0],
                g: c[1],
                b: c[2],
                alpha: 0.8,
                tipo: 'hoja',
                tam: 2 + Math.random() * 2,
            });
        }
        // Lluvia suave de otoño
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
    const { id } = est;

    // Relámpago (invierno)
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

    // Ráfaga de viento (otoño)
    if (id === 'otono') {
        est.rafCounter++;
        if (!est.rafActiva && est.rafCounter >= est.rafProx) {
            est.rafActiva = true;
            est.rafFrames = 30;
            est.rafProx = 200 + Math.floor(Math.random() * 100);
            est.rafCounter = 0;
        }
        if (est.rafActiva) {
            est.rafFrames--;
            if (est.rafFrames <= 0) est.rafActiva = false;
        }
    }

    // Actualizar partículas
    const t = est.t;
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

function renderPanel(ctx, est, vineta) {
    const { id, t } = est;
    const pal = PAL[id];
    const pi2 = Math.PI * 2;

    // Fondo (offscreen: cielo + montañas)
    ctx.drawImage(est.bg, 0, 0);

    // Brillo o parpadeo de ambiente
    if (pal.dia) {
        const brillo = 0.05 + Math.sin(t * 0.002) * 0.02;
        ctx.fillStyle = 'rgba(255,240,180,' + brillo.toFixed(3) + ')';
        ctx.fillRect(0, 0, W, H * 0.5);
    } else if (id !== 'otono') {
        // Parpadeo de estrellas nocturnas
        const parpadeo = 0.85 + Math.sin(t * 0.003) * 0.15;
        ctx.globalAlpha = parpadeo;
        ctx.fillStyle = 'rgba(200,220,255,0.6)';
        for (let i = 0; i < 5; i++) {
            const sx = (i * 53 + 17) % W;
            const sy = (i * 41 + 7) % (H / 2);
            if (Math.sin(t * 0.005 + i * 1.7) > 0.3) ctx.fillRect(sx, sy, 1, 1);
        }
        ctx.globalAlpha = 1;
    }

    // Suelo sólido (3 filas de tiles)
    ctx.fillStyle = pal.suelo;
    ctx.fillRect(0, SUELO_Y, W, H - SUELO_Y);

    // Plataformas en distintas alturas
    ctx.fillStyle = pal.plat;
    ctx.fillRect(55, H * 0.625, 5 * TAM, TAM);
    ctx.fillRect(210, H * 0.53, 5 * TAM, TAM);
    ctx.fillRect(350, H * 0.66, 4 * TAM, TAM);

    // Hueco de abismo en el suelo
    ctx.clearRect(290, SUELO_Y, 3 * TAM, H - SUELO_Y);
    // Glow naranja hacia arriba desde el abismo
    const glowA = ctx.createLinearGradient(290, SUELO_Y, 290, SUELO_Y - 3 * TAM);
    glowA.addColorStop(0, 'rgba(255,100,20,0.28)');
    glowA.addColorStop(1, 'rgba(255,100,20,0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(290, SUELO_Y - 3 * TAM, 3 * TAM, 3 * TAM);

    // Partículas
    for (const p of est.partic) {
        const vidaRatio = p.vida / p.vidaMax;
        const alpha = vidaRatio > 0.15 ? p.alpha : (vidaRatio / 0.15) * p.alpha;
        const a = Math.max(0, Math.min(1, alpha));
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
            ctx.ellipse(0, 0, tam * 1.4, tam * 0.55, 0, 0, pi2);
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
            // polvo
            const mitad = p.tam / 2;
            ctx.fillRect(p.x - mitad, p.y - mitad, p.tam, p.tam);
        }
    }

    // Efectos especiales por clima
    if (id === 'invierno') {
        if (est.relFrames > 0) {
            ctx.fillStyle = 'rgba(200,170,255,0.70)';
            ctx.fillRect(0, 0, W, H);
        } else if (est.relFade > 0) {
            const f = est.relFade / 9;
            ctx.fillStyle = 'rgba(200,170,255,' + (0.7 * f).toFixed(3) + ')';
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
        for (let i = 0; i < 5; i++) {
            ctx.fillRect(0, H * 0.3 + i * 25, W, 2);
        }
    }

    // Tinte ambiental
    if (pal.tinte) {
        const [r, g, b, a2] = pal.tinte;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a2 + ')';
        ctx.fillRect(0, 0, W, H);
    }

    // Viñeta (offscreen)
    ctx.drawImage(vineta, 0, 0);
}

// --- Montaje de DOM y loop ---

function iniciarClimaShowcase() {
    const contenedor = document.getElementById('climaShowcase');
    if (!contenedor) return;

    const vineta = generarVineta();
    const paneles = [];

    for (const clima of CLIMAS) {
        // Card
        const card = document.createElement('div');
        card.className = 'card';

        // Canvas nativo 480x270, mostrado a 240x135
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

        paneles.push({
            ctx: canvas.getContext('2d'),
            est: crearEstado(clima.id),
        });
    }

    // Loop compartido para todos los paneles
    function loop() {
        for (const { ctx, est } of paneles) {
            emitir(est);
            actualizar(est);
            renderPanel(ctx, est, vineta);
        }
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}

iniciarClimaShowcase();
