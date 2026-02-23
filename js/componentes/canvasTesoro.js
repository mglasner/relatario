// Canvas renderer para tesoros épico+ en el Tesorario
// Dibuja imagen con rotación pseudo-3D, partículas orbitales, rayos, anillos y bloom

import { crearGameLoop } from '../utils.js';

const DOS_PI = Math.PI * 2;

// Configuración por tier
const CONFIG_TIER = {
    epico: {
        color: [160, 80, 255],
        velGiro: 0.8,
        particulas: 22,
        estela: 0.3,
        rayos: 0,
        anillos: 0,
        bloom: false,
        pulsoEscala: false,
        cicloColor: false,
    },
    legendario: {
        color: [255, 160, 40],
        velGiro: 1.2,
        particulas: 35,
        estela: 0.5,
        rayos: 6,
        anillos: 2,
        bloom: false,
        pulsoEscala: false,
        cicloColor: false,
    },
    mitico: {
        color: [255, 80, 100],
        velGiro: 1.6,
        particulas: 50,
        estela: 0.6,
        rayos: 12,
        anillos: 3,
        bloom: true,
        pulsoEscala: true,
        cicloColor: true,
    },
};

function inicializarParticulas(cantidad, tamano) {
    const particulas = [];
    const radio = tamano * 0.42;
    for (let i = 0; i < cantidad; i++) {
        particulas.push({
            angulo: Math.random() * DOS_PI,
            radio: radio * (0.7 + Math.random() * 0.3),
            velAngular: 0.4 + Math.random() * 0.8,
            tamano: 1.2 + Math.random() * 1.8,
            opacidad: 0.4 + Math.random() * 0.6,
        });
    }
    return particulas;
}

function actualizarParticulas(particulas, dt) {
    for (const p of particulas) {
        p.angulo += p.velAngular * dt;
    }
}

function colorConAlpha(rgb, alpha) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')';
}

function aplicarBloom(ctx, activar) {
    ctx.globalCompositeOperation = activar ? 'lighter' : 'source-over';
}

// Ciclo cromático para mítico: rota el hue
function colorCiclico(base, t) {
    const offset = Math.sin(t * 0.5) * 40;
    return [
        Math.min(255, Math.max(0, base[0] + offset)),
        Math.min(255, Math.max(0, base[1] - offset * 0.5)),
        Math.min(255, Math.max(0, base[2] + offset * 0.3)),
    ];
}

function dibujarAura(ctx, config, t, tamano, colorActual) {
    const centro = tamano / 2;
    const radio = tamano * 0.45;
    const pulso = 0.6 + 0.3 * Math.sin(t * 1.5);

    aplicarBloom(ctx, config.bloom);

    const grad = ctx.createRadialGradient(centro, centro, 0, centro, centro, radio);
    grad.addColorStop(0, colorConAlpha(colorActual, 0.18 * pulso));
    grad.addColorStop(0.6, colorConAlpha(colorActual, 0.08 * pulso));
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centro, centro, radio, 0, DOS_PI);
    ctx.fill();

    aplicarBloom(ctx, false);
}

function dibujarParticulas(ctx, particulas, config, tamano, colorActual) {
    const centro = tamano / 2;
    const colorSolido = colorConAlpha(colorActual, 1);

    aplicarBloom(ctx, config.bloom);

    for (const p of particulas) {
        const x = centro + Math.cos(p.angulo) * p.radio;
        const y = centro + Math.sin(p.angulo) * p.radio;

        // Estela (círculo más grande y transparente)
        if (config.estela > 0) {
            ctx.globalAlpha = p.opacidad * config.estela * 0.4;
            ctx.fillStyle = colorSolido;
            ctx.beginPath();
            ctx.arc(x, y, p.tamano * 2.5, 0, DOS_PI);
            ctx.fill();
        }

        // Partícula principal
        ctx.globalAlpha = p.opacidad;
        ctx.fillStyle = colorSolido;
        ctx.beginPath();
        ctx.arc(x, y, p.tamano, 0, DOS_PI);
        ctx.fill();
    }

    ctx.globalAlpha = 1;
    aplicarBloom(ctx, false);
}

function dibujarRayos(ctx, config, t, tamano) {
    if (config.rayos === 0) return;

    const centro = tamano / 2;
    const largo = tamano * 0.48;
    const rotBase = t * 0.3;

    aplicarBloom(ctx, config.bloom);
    ctx.lineWidth = 1.5;

    for (let i = 0; i < config.rayos; i++) {
        const angulo = rotBase + (i * DOS_PI) / config.rayos;
        const x2 = centro + Math.cos(angulo) * largo;
        const y2 = centro + Math.sin(angulo) * largo;

        const grad = ctx.createLinearGradient(centro, centro, x2, y2);
        grad.addColorStop(0, colorConAlpha(config.color, 0.25));
        grad.addColorStop(1, colorConAlpha(config.color, 0));

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(centro, centro);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    aplicarBloom(ctx, false);
}

function dibujarAnillos(ctx, config, t, tamano) {
    if (config.anillos === 0) return;

    const centro = tamano / 2;
    const radioMax = tamano * 0.46;
    const duracion = 3; // segundos para un ciclo completo

    for (let i = 0; i < config.anillos; i++) {
        // Stagger temporal entre anillos
        const fase = ((t + (i * duracion) / config.anillos) % duracion) / duracion;
        const radio = radioMax * (0.3 + fase * 0.7);
        const opacidad = 0.35 * (1 - fase);

        ctx.strokeStyle = colorConAlpha(config.color, opacidad);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centro, centro, radio, 0, DOS_PI);
        ctx.stroke();
    }
}

function dibujarImagenRotada(ctx, img, t, config, tamano) {
    const centro = tamano / 2;
    const imgTamano = tamano * 0.75;

    // Pseudo-3D: oscilación coseno para simular rotación en Y
    const escalaX = Math.abs(Math.cos(t * config.velGiro));
    // Pulso de escala (respiración) para mítico
    const pulso = config.pulsoEscala ? 1 + 0.05 * Math.sin(t * 2) : 1;
    const escalaFinal = escalaX * pulso;

    // No dibujar si está de canto (evitar imagen invertida)
    if (escalaFinal < 0.05) return;

    ctx.save();
    ctx.translate(centro, centro);
    ctx.scale(escalaFinal, pulso);

    // Borde redondeado con clip
    const mitad = imgTamano / 2;
    const radioClip = imgTamano * 0.08;
    ctx.beginPath();
    ctx.roundRect(-mitad, -mitad, imgTamano, imgTamano, radioClip);
    ctx.clip();

    ctx.drawImage(img, -mitad, -mitad, imgTamano, imgTamano);

    // Borde sutil
    ctx.strokeStyle = colorConAlpha(config.color, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-mitad, -mitad, imgTamano, imgTamano, radioClip);
    ctx.stroke();

    ctx.restore();
}

// Dibuja un frame estático (para prefers-reduced-motion)
function dibujarFrameEstatico(ctx, img, config, tamano, colorActual) {
    dibujarAura(ctx, config, 0, tamano, colorActual);
    dibujarImagenRotada(ctx, img, 0, config, tamano);
}

/**
 * Crea un canvas animado para un tesoro de tier épico+.
 * @param {string} imgSrc - ruta de la imagen del tesoro
 * @param {'epico'|'legendario'|'mitico'} tier - tier del tesoro
 * @param {number} tamano - tamaño en px CSS del canvas
 * @returns {{ elemento: HTMLCanvasElement, iniciar: Function, detener: Function }}
 */
export function crearCanvasTesoro(imgSrc, tier, tamano) {
    const config = CONFIG_TIER[tier];
    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    canvas.width = tamano * dpr;
    canvas.height = tamano * dpr;
    canvas.style.width = tamano + 'px';
    canvas.style.height = tamano + 'px';
    canvas.className = 'tesorario-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Tesoro de tier ' + tier);

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const particulas = inicializarParticulas(config.particulas, tamano);
    const img = new Image();
    let imgCargada = false;
    let tiempoInicio = 0;

    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const loop = crearGameLoop(function (timestamp) {
        if (!imgCargada) return;

        const t = (timestamp - tiempoInicio) / 1000;
        const dt = 1 / 60; // delta fijo para partículas

        const colorActual = config.cicloColor ? colorCiclico(config.color, t) : config.color;

        // Limpiar
        ctx.clearRect(0, 0, tamano, tamano);

        // Capas de atrás hacia adelante
        dibujarAura(ctx, config, t, tamano, colorActual);
        dibujarAnillos(ctx, config, t, tamano);
        dibujarRayos(ctx, config, t, tamano);
        actualizarParticulas(particulas, dt);
        dibujarParticulas(ctx, particulas, config, tamano, colorActual);
        dibujarImagenRotada(ctx, img, t, config, tamano);
    });

    img.onload = function () {
        imgCargada = true;
        if (reducido) {
            dibujarFrameEstatico(ctx, img, config, tamano, config.color);
        }
    };
    img.src = imgSrc;

    return {
        elemento: canvas,
        iniciar() {
            if (reducido) return;
            tiempoInicio = performance.now();
            loop.iniciar();
        },
        detener() {
            loop.detener();
        },
    };
}
