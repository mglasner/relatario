// Motor 3D — Raycaster DDA con texture mapping e iluminación

import { FOV, TEX_SIZE, COLORES, canvas } from './config.js';
import { obtenerTextura } from './texturas.js';

// Renderiza la vista 3D con raycasting DDA
// Retorna el zBuffer para sprites
export function renderizar3D(ctx, jugador, mapa, filas, cols, grad, texturas, mapaLuz) {
    const { ancho, alto, numRayos, anchoFranja } = canvas;
    const mitadAlto = alto / 2;

    // Cielo y suelo
    ctx.fillStyle = grad.cielo;
    ctx.fillRect(0, 0, ancho, mitadAlto);
    ctx.fillStyle = grad.suelo;
    ctx.fillRect(0, mitadAlto, ancho, mitadAlto);

    const zBuffer = new Array(numRayos);

    for (let i = 0; i < numRayos; i++) {
        const anguloRayo = jugador.angulo - FOV / 2 + (i / numRayos) * FOV;
        const rayDirX = Math.cos(anguloRayo);
        const rayDirY = Math.sin(anguloRayo);

        let mapX = Math.floor(jugador.x);
        let mapY = Math.floor(jugador.y);

        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);

        let stepX, stepY, sideDistX, sideDistY;

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (jugador.x - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1 - jugador.x) * deltaDistX;
        }

        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (jugador.y - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1 - jugador.y) * deltaDistY;
        }

        // DDA: avanzar celda a celda hasta golpear pared
        let hit = false;
        let lado = 0; // 0 = pared vertical (E/O), 1 = pared horizontal (N/S)
        let iter = 0;

        while (!hit && iter < 50) {
            iter++;
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                lado = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                lado = 1;
            }

            if (mapY >= 0 && mapY < filas && mapX >= 0 && mapX < cols) {
                if (mapa[mapY][mapX] === 1) hit = true;
            } else {
                hit = true;
            }
        }

        // Distancia a lo largo del rayo (antes de corrección ojo de pez)
        const distRayo = lado === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;

        // Corrección ojo de pez (distancia perpendicular al plano de cámara)
        let distPerp = distRayo * Math.cos(anguloRayo - jugador.angulo);
        if (distPerp < 0.01) distPerp = 0.01;

        zBuffer[i] = distPerp;

        const alturaPared = alto / distPerp;
        const inicioY = Math.floor(mitadAlto - alturaPared / 2);
        const screenX = i * anchoFranja;

        if (texturas) {
            // --- Modo texturizado ---

            // wallX: posición exacta del impacto en la pared (0.0 - 1.0)
            let wallX;
            if (lado === 0) {
                wallX = jugador.y + distRayo * rayDirY;
            } else {
                wallX = jugador.x + distRayo * rayDirX;
            }
            wallX = wallX - Math.floor(wallX);

            // Columna de la textura a dibujar
            const texX = Math.min(Math.floor(wallX * TEX_SIZE), TEX_SIZE - 1);
            const tex = obtenerTextura(mapX, mapY, texturas);

            // Dibujar franja de textura (1px de ancho del source, estirado al alto de la pared)
            ctx.drawImage(tex, texX, 0, 1, TEX_SIZE, screenX, inicioY, anchoFranja, alturaPared);

            // Calcular brillo (distancia + iluminación dinámica)
            let brillo = Math.min(1, 1.5 / distPerp);

            if (mapaLuz) {
                const lx = Math.min(cols - 1, Math.max(0, mapX));
                const ly = Math.min(filas - 1, Math.max(0, mapY));
                const luzLocal = mapaLuz[ly * cols + lx];
                brillo = luzLocal * Math.min(1, 1.5 / distPerp);
            }

            // Caras N/S 20% más oscuras
            if (lado === 1) brillo *= 0.8;

            // Overlay de oscuridad por distancia
            const oscuridad = 1 - brillo;
            if (oscuridad > 0.01) {
                ctx.fillStyle = 'rgba(0,0,0,' + oscuridad.toFixed(2) + ')';
                ctx.fillRect(screenX, inicioY, anchoFranja, alturaPared);
            }

            // Tinte cálido naranja cerca de antorchas
            if (mapaLuz) {
                const lx = Math.min(cols - 1, Math.max(0, mapX));
                const ly = Math.min(filas - 1, Math.max(0, mapY));
                const luzLocal = mapaLuz[ly * cols + lx];
                if (luzLocal > 0.3) {
                    const tinte = (luzLocal - 0.3) * 0.15;
                    ctx.fillStyle = 'rgba(255,160,50,' + tinte.toFixed(3) + ')';
                    ctx.fillRect(screenX, inicioY, anchoFranja, alturaPared);
                }
            }
        } else {
            // --- Fallback: colores sólidos (sin texturas) ---
            const brillo = Math.min(1, 1.5 / distPerp);
            const color = lado === 1 ? COLORES.paredNS : COLORES.paredEO;
            const r = Math.floor(color.r * brillo);
            const g = Math.floor(color.g * brillo);
            const b = Math.floor(color.b * brillo);
            ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
            ctx.fillRect(screenX, inicioY, anchoFranja, alturaPared);
        }
    }

    return zBuffer;
}
