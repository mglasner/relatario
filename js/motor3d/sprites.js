// Motor 3D — Renderizado de sprites billboard

import { FOV, canvas } from './config.js';

// Dibuja un sprite individual con z-buffer check
function dibujarSprite(ctx, sprite, zBuffer, jugadorX, jugadorY, angulo) {
    const dx = sprite.x - jugadorX;
    const dy = sprite.y - jugadorY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.3) return;

    // Ángulo del sprite relativo al jugador
    const anguloSprite = Math.atan2(dy, dx);
    let anguloRel = anguloSprite - angulo;

    // Normalizar a [-PI, PI]
    while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
    while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;

    // Fuera del campo de visión
    if (Math.abs(anguloRel) > FOV / 2 + 0.15) return;

    // Posición horizontal en pantalla
    const screenX = (0.5 + anguloRel / FOV) * canvas.ancho;

    // Distancia perpendicular para tamaño correcto
    const distPerp = dist * Math.cos(anguloRel);
    if (distPerp < 0.1) return;

    // Verificar z-buffer
    const colCentral = Math.floor(screenX / canvas.anchoFranja);
    if (colCentral >= 0 && colCentral < canvas.numRayos && distPerp >= zBuffer[colCentral]) return;

    // Tamaño del emoji según distancia
    const fontSize = Math.min(Math.max((canvas.alto / distPerp) * 0.4, 10), 60);

    // Offset vertical según z del sprite (0=suelo, 1=techo, 0.5=centro)
    const alturaPared = canvas.alto / distPerp;
    const z = sprite.z !== undefined ? sprite.z : 0.5;
    const screenY = canvas.alto / 2 - (z - 0.5) * alturaPared;

    // Pseudo-glow sin shadowBlur (mucho más rápido)
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.font = Math.floor(fontSize * 1.4) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sprite.emoji, screenX, screenY);
    ctx.restore();

    // Sprite principal
    ctx.font = Math.floor(fontSize) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sprite.emoji, screenX, screenY);
}

// Renderiza todos los sprites ordenados por distancia (más lejanos primero)
// sprites = [{ x, y, emoji, color, z? }, ...]
export function renderizarSprites(ctx, sprites, zBuffer, jugadorX, jugadorY, angulo) {
    sprites.sort(function (a, b) {
        const da = (a.x - jugadorX) ** 2 + (a.y - jugadorY) ** 2;
        const db = (b.x - jugadorX) ** 2 + (b.y - jugadorY) ** 2;
        return db - da;
    });

    for (let i = 0; i < sprites.length; i++) {
        dibujarSprite(ctx, sprites[i], zBuffer, jugadorX, jugadorY, angulo);
    }
}
