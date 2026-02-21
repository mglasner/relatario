// Motor 3D — Minimapa con pre-renderizado

import { COLORES } from './config.js';

// Pre-renderiza paredes estáticas en un canvas offscreen
export function crearMinimapBase(mapa, filas, cols, ancho, alto) {
    const base = document.createElement('canvas');
    base.width = ancho;
    base.height = alto;
    const ctx = base.getContext('2d');

    const tamCelda = ancho / cols;

    ctx.fillStyle = COLORES.minimapaFondo;
    ctx.fillRect(0, 0, ancho, alto);

    ctx.fillStyle = COLORES.minimapaParedes;
    for (let f = 0; f < filas; f++) {
        for (let c = 0; c < cols; c++) {
            if (mapa[f][c] === 1) {
                ctx.fillRect(c * tamCelda, f * tamCelda, tamCelda + 0.5, tamCelda + 0.5);
            }
        }
    }

    return base;
}

// Dibuja minimapa: base estática + elementos dinámicos
// datos = { jugadorX, jugadorY, angulo, tieneLlave, llaveCol, llaveFila,
//           entradaCol, entradaFila, avatarImg, fov, cols }
export function renderizarMinimapa(ctx, base, datos) {
    ctx.drawImage(base, 0, 0);

    const tamCelda = base.width / datos.cols;

    // Escala proporcional: 1.0 en minimapa de ~150px, menor en pantallas chicas
    const esc = Math.min(1, tamCelda / 11.5);

    // Salida
    const radioSalida = Math.max(2, Math.round(4 * esc));
    ctx.fillStyle = datos.tieneLlave ? '#44ff44' : '#336633';
    ctx.beginPath();
    ctx.arc(
        (datos.entradaCol + 0.5) * tamCelda,
        (datos.entradaFila + 0.5) * tamCelda,
        radioSalida,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Llave (dorada con pseudo-glow sin shadowBlur)
    if (!datos.tieneLlave) {
        const lx = (datos.llaveCol + 0.5) * tamCelda;
        const ly = (datos.llaveFila + 0.5) * tamCelda;
        const radioLlaveGlow = Math.max(3, Math.round(7 * esc));
        const radioLlave = Math.max(2, Math.round(4 * esc));
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(lx, ly, radioLlaveGlow, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(lx, ly, radioLlave, 0, Math.PI * 2);
        ctx.fill();
    }

    // Jugador — tamaño proporcional al minimapa
    const px = datos.jugadorX * tamCelda;
    const py = datos.jugadorY * tamCelda;
    const radioAvatar = Math.max(3, Math.round(8 * esc));

    // Resplandor (pseudo-glow sin shadowBlur)
    const glowExt = Math.max(1, Math.round(4 * esc));
    const glowInt = Math.max(1, Math.round(2 * esc));
    ctx.fillStyle = 'rgba(255, 204, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(px, py, radioAvatar + glowExt, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 204, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(px, py, radioAvatar + glowInt, 0, Math.PI * 2);
    ctx.fill();

    // Avatar recortado en círculo
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, radioAvatar, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
        datos.avatarImg,
        px - radioAvatar,
        py - radioAvatar,
        radioAvatar * 2,
        radioAvatar * 2
    );
    ctx.restore();

    // Borde del avatar
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = Math.max(1.5, 2.5 * esc);
    ctx.beginPath();
    ctx.arc(px, py, radioAvatar, 0, Math.PI * 2);
    ctx.stroke();

    // Línea de dirección
    const linLen = Math.max(6, Math.round(12 * esc));
    ctx.lineWidth = Math.max(1, 2 * esc);
    ctx.beginPath();
    ctx.moveTo(
        px + Math.cos(datos.angulo) * radioAvatar,
        py + Math.sin(datos.angulo) * radioAvatar
    );
    ctx.lineTo(
        px + Math.cos(datos.angulo) * (radioAvatar + linLen),
        py + Math.sin(datos.angulo) * (radioAvatar + linLen)
    );
    ctx.stroke();

    // Campo de visión (FOV)
    const fovLen = Math.max(10, Math.round(18 * esc));
    ctx.strokeStyle = 'rgba(255, 204, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(
        px + Math.cos(datos.angulo - datos.fov / 2) * radioAvatar,
        py + Math.sin(datos.angulo - datos.fov / 2) * radioAvatar
    );
    ctx.lineTo(
        px + Math.cos(datos.angulo - datos.fov / 2) * fovLen,
        py + Math.sin(datos.angulo - datos.fov / 2) * fovLen
    );
    ctx.moveTo(
        px + Math.cos(datos.angulo + datos.fov / 2) * radioAvatar,
        py + Math.sin(datos.angulo + datos.fov / 2) * radioAvatar
    );
    ctx.lineTo(
        px + Math.cos(datos.angulo + datos.fov / 2) * fovLen,
        py + Math.sin(datos.angulo + datos.fov / 2) * fovLen
    );
    ctx.stroke();
}
