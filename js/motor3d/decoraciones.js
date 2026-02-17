// Motor 3D — Decoraciones ambientales (antorchas, telarañas, murciélagos)

// Límites para rendimiento
const MAX_ANTORCHAS = 20;
const MAX_TELARANAS = 8;
const MAX_MURCIELAGOS = 2;
const RADIO_CULLING = 6;

// Frames de animación para antorchas
const FRAMES_ANTORCHA = ['\uD83D\uDD25', '\uD83D\uDD25'];

// Verifica si una celda es corredor (no pared)
function esCorredor(mapa, fila, col, filas, cols) {
    if (fila < 0 || fila >= filas || col < 0 || col >= cols) return false;
    return mapa[fila][col] === 0;
}

// Verifica si una celda es pared
function esPared(mapa, fila, col, filas, cols) {
    if (fila < 0 || fila >= filas || col < 0 || col >= cols) return true;
    return mapa[fila][col] === 1;
}

// Cuenta paredes adyacentes a una celda
function paredesAdyacentes(mapa, fila, col, filas, cols) {
    let count = 0;
    if (esPared(mapa, fila - 1, col, filas, cols)) count++;
    if (esPared(mapa, fila + 1, col, filas, cols)) count++;
    if (esPared(mapa, fila, col - 1, filas, cols)) count++;
    if (esPared(mapa, fila, col + 1, filas, cols)) count++;
    return count;
}

// Hash determinístico para colocación reproducible
function hashPos(x, y, seed) {
    let h = seed + x * 374761393 + y * 668265263;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = h ^ (h >>> 16);
    return (h & 0x7fffffff) / 0x7fffffff;
}

// Genera todas las decoraciones del laberinto
export function generarDecoraciones(mapa, filas, cols) {
    const antorchas = [];
    const telaranas = [];
    const murcielagos = [];

    // --- Antorchas: ~15% de paredes junto a corredores ---
    const candidatasAntorcha = [];
    const dirs = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];

    for (let f = 1; f < filas - 1; f++) {
        for (let c = 1; c < cols - 1; c++) {
            if (mapa[f][c] !== 1) continue; // Solo paredes

            // Buscar dirección hacia corredor adyacente
            for (const [df, dc] of dirs) {
                if (esCorredor(mapa, f + df, c + dc, filas, cols)) {
                    const h = hashPos(c, f, 7777 + df * 100 + dc * 10);
                    if (h < 0.15) {
                        candidatasAntorcha.push({
                            // Posicionar en el corredor, 0.05u desde la pared
                            x: c + dc + 0.5 - dc * 0.45,
                            y: f + df + 0.5 - df * 0.45,
                            frame: 0,
                            tiempoFrame: 0,
                            seed: hashPos(c, f, 999),
                        });
                    }
                    break; // Una antorcha por pared
                }
            }
        }
    }

    // Limitar cantidad
    for (let i = 0; i < Math.min(candidatasAntorcha.length, MAX_ANTORCHAS); i++) {
        antorchas.push(candidatasAntorcha[i]);
    }

    // --- Telarañas: esquinas en L (corredor con 2+ paredes adyacentes) ---
    let contTelaranas = 0;
    for (let f = 1; f < filas - 1 && contTelaranas < MAX_TELARANAS; f++) {
        for (let c = 1; c < cols - 1 && contTelaranas < MAX_TELARANAS; c++) {
            if (mapa[f][c] !== 0) continue; // Solo corredores
            if (paredesAdyacentes(mapa, f, c, filas, cols) < 2) continue;

            const h = hashPos(c, f, 5555);
            if (h < 0.3) {
                telaranas.push({
                    x: c + 0.5,
                    y: f + 0.5,
                    z: 0.85, // Cerca del techo
                });
                contTelaranas++;
            }
        }
    }

    // --- Murciélagos: en corredores largos ---
    let contMurcielagos = 0;
    for (let f = 2; f < filas - 2 && contMurcielagos < MAX_MURCIELAGOS; f++) {
        for (let c = 2; c < cols - 2 && contMurcielagos < MAX_MURCIELAGOS; c++) {
            if (mapa[f][c] !== 0) continue;

            // Verificar corredor largo horizontal o vertical (3+ celdas libres)
            const largoH =
                esCorredor(mapa, f, c - 1, filas, cols) && esCorredor(mapa, f, c + 1, filas, cols);
            const largoV =
                esCorredor(mapa, f - 1, c, filas, cols) && esCorredor(mapa, f + 1, c, filas, cols);

            if ((largoH || largoV) && hashPos(c, f, 3333) < 0.08) {
                murcielagos.push({
                    x: c + 0.5,
                    y: f + 0.5,
                    baseX: c + 0.5,
                    baseY: f + 0.5,
                    z: 0.8,
                    fase: hashPos(c, f, 4444) * Math.PI * 2,
                    velocidad: 0.8 + hashPos(c, f, 6666) * 0.4,
                    horizontal: largoH,
                });
                contMurcielagos++;
            }
        }
    }

    return { antorchas, telaranas, murcielagos };
}

// Actualiza animaciones de decoraciones
export function actualizarDecoraciones(decs, ahora) {
    // Animar frames de antorchas
    for (const antorcha of decs.antorchas) {
        if (ahora - antorcha.tiempoFrame > 200) {
            antorcha.frame = (antorcha.frame + 1) % FRAMES_ANTORCHA.length;
            antorcha.tiempoFrame = ahora;
        }
    }

    // Mover murciélagos con movimiento sinusoidal
    const t = ahora / 1000;
    for (const bat of decs.murcielagos) {
        const offset = Math.sin(t * bat.velocidad + bat.fase) * 0.4;
        if (bat.horizontal) {
            bat.x = bat.baseX + offset;
        } else {
            bat.y = bat.baseY + offset;
        }
        // Aleteo vertical sutil
        bat.z = 0.75 + Math.sin(t * 3 + bat.fase) * 0.05;
    }
}

// Pool de sprites preallocado para evitar allocaciones por frame
const MAX_SPRITES_DECO = MAX_ANTORCHAS + MAX_TELARANAS + MAX_MURCIELAGOS;
const _spritesPool = Array.from({ length: MAX_SPRITES_DECO }, () => ({
    x: 0,
    y: 0,
    z: 0,
    emoji: '',
    color: '',
}));
// Vista reutilizable: { sprites, count }
const _spritesResult = { sprites: _spritesPool, count: 0 };

// Convierte decoraciones a sprites para renderizar (con culling por distancia)
// Retorna { sprites, count } donde count indica cuántos slots están activos
export function obtenerSpritesDecoraciones(decs, jugadorX, jugadorY) {
    let idx = 0;
    const radioSq = RADIO_CULLING * RADIO_CULLING;

    // Antorchas
    for (const a of decs.antorchas) {
        const dx = a.x - jugadorX;
        const dy = a.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const s = _spritesPool[idx++];
        s.x = a.x;
        s.y = a.y;
        s.z = 0.55;
        s.emoji = FRAMES_ANTORCHA[a.frame];
        s.color = '#ff8800';
    }

    // Telarañas
    for (const t of decs.telaranas) {
        const dx = t.x - jugadorX;
        const dy = t.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const s = _spritesPool[idx++];
        s.x = t.x;
        s.y = t.y;
        s.z = t.z;
        s.emoji = '\uD83D\uDD78\uFE0F';
        s.color = '#888888';
    }

    // Murciélagos
    for (const b of decs.murcielagos) {
        const dx = b.x - jugadorX;
        const dy = b.y - jugadorY;
        if (dx * dx + dy * dy > radioSq) continue;

        const s = _spritesPool[idx++];
        s.x = b.x;
        s.y = b.y;
        s.z = b.z;
        s.emoji = '\uD83E\uDD87';
        s.color = '#6633aa';
    }

    _spritesResult.count = idx;
    return _spritesResult;
}
