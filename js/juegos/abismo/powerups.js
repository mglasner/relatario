// Habitación 4 — El Abismo: Power-ups coleccionables
// Objetos flotantes que otorgan buffs temporales al recogerlos.
// Reaparecen en zona diferente tras expirar el buff.

import { CFG } from './config.js';

const PW = CFG.powerups;
const T = CFG.tiles.tipos;
const TAM = CFG.tiles.tamano;

// Definición de tipos (extrae el array ordenado una vez)
const TIPOS = Object.keys(PW.tipos).map((id) => ({ id, ...PW.tipos[id] }));

// Imágenes precargadas
const imagenes = {};

// Estado de los power-ups activos en el mapa
// Cada slot: { tipoIdx, x, y, zona, fase, timer, img }
// fase: 'activo' | 'respawn'
let slots = [];
let mapaRef = null;
let totalFilas = 0;
let zonas = []; // array de {c0, c1} por zona

// --- Precarga de imágenes ---

function precargarImagenes() {
    for (let i = 0; i < TIPOS.length; i++) {
        const tipo = TIPOS[i];
        if (imagenes[tipo.id]) continue;
        const img = new Image();
        img.src = tipo.img;
        imagenes[tipo.id] = img;
    }
}

// --- Cálculo de zonas ---

function calcularZonas(cols) {
    const res = [];
    // Columnas jugables: 1 .. cols-2 (evitar paredes)
    for (let c0 = 1; c0 < cols - 1; c0 += PW.zonaAncho) {
        const c1 = Math.min(c0 + PW.zonaAncho - 1, cols - 2);
        res.push({ c0, c1 });
    }
    return res;
}

// Tiles de altura libre sobre el suelo para colocar el power-up
const ALTURA_SOBRE_SUELO = 3;

// Busca una posición válida flotando ALTURA_SOBRE_SUELO tiles por encima del suelo
function buscarPosEnZona(zonaIdx) {
    const zona = zonas[zonaIdx];
    const candidatos = [];
    for (let c = zona.c0; c <= zona.c1; c++) {
        for (let f = ALTURA_SOBRE_SUELO + 1; f < totalFilas - 1; f++) {
            const tipo = mapaRef[f][c];
            if (tipo !== T.SUELO && tipo !== T.PLATAFORMA) continue;
            // Verificar que hay ALTURA_SOBRE_SUELO tiles vacíos encima
            let libre = true;
            for (let k = 1; k <= ALTURA_SOBRE_SUELO; k++) {
                if (mapaRef[f - k][c] !== T.VACIO) {
                    libre = false;
                    break;
                }
            }
            if (libre) candidatos.push({ c, f: f - ALTURA_SOBRE_SUELO });
        }
    }
    if (candidatos.length === 0) return null;
    return candidatos[Math.floor(Math.random() * candidatos.length)];
}

// Elige zona aleatoria diferente a `excluir`
function elegirZonaDistinta(excluir) {
    if (zonas.length <= 1) return 0;
    let z;
    do {
        z = Math.floor(Math.random() * zonas.length);
    } while (z === excluir);
    return z;
}

// --- API pública ---

/**
 * Inicializa los power-ups con el mapa actual.
 * Llamar después de resetearMapa() y obtenerSpawns().
 * @param {number[][]} mapa - Snapshot del mapa (array 2D)
 * @param {number} filas
 * @param {number} cols
 */
export function iniciarPowerups(mapa, filas, cols) {
    mapaRef = mapa;
    totalFilas = filas;
    zonas = calcularZonas(cols);
    slots = [];

    precargarImagenes();

    // Crear un slot por zona, ciclando entre los tipos
    const numSlots = zonas.length;
    for (let i = 0; i < numSlots; i++) {
        const tipoIdx = i % TIPOS.length;
        const pos = buscarPosEnZona(i);
        if (!pos) continue;
        slots.push({
            tipoIdx,
            // Centro del tile
            x: pos.c * TAM + TAM / 2 - PW.imgTamano / 2,
            yBase: pos.f * TAM + TAM / 2 - PW.imgTamano / 2,
            y: pos.f * TAM + TAM / 2 - PW.imgTamano / 2,
            zona: i,
            fase: 'activo',
            timer: 0, // en fase respawn: frames restantes
        });
    }
}

/**
 * Actualiza la animación de flotación y los timers de respawn.
 * @param {number} frameCount
 */
export function actualizarPowerups(frameCount) {
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.fase === 'activo') {
            // Animación seno vertical
            s.y = s.yBase + Math.sin(frameCount * PW.animVelocidad + i * 1.3) * PW.animAmplitud;
        } else if (s.fase === 'respawn') {
            s.timer--;
            if (s.timer <= 0) {
                // Reaparecer en zona distinta
                const nuevaZona = elegirZonaDistinta(s.zona);
                const pos = buscarPosEnZona(nuevaZona);
                if (pos) {
                    s.zona = nuevaZona;
                    s.x = pos.c * TAM + TAM / 2 - PW.imgTamano / 2;
                    s.yBase = pos.f * TAM + TAM / 2 - PW.imgTamano / 2;
                    s.y = s.yBase;
                }
                s.fase = 'activo';
            }
        }
    }
}

/**
 * Dibuja los power-ups visibles en el mapa.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} camaraX
 * @param {number} camaraY
 * @param {number} anchoCanvas
 * @param {number} altoCanvas
 */
export function renderizarPowerups(ctx, camaraX, camaraY, anchoCanvas, altoCanvas) {
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.fase !== 'activo') continue;

        const px = s.x - camaraX;
        const py = s.y - camaraY;

        // Culling
        if (px < -PW.imgTamano * 2 || px > anchoCanvas + PW.imgTamano * 2) continue;
        if (py < -PW.imgTamano * 2 || py > altoCanvas + PW.imgTamano * 2) continue;

        const tipo = TIPOS[s.tipoIdx];
        const img = imagenes[tipo.id];
        const [r, g, b] = tipo.auraColor;
        const cx = px + PW.imgTamano / 2;
        const cy = py + PW.imgTamano / 2;
        const radioGlow = PW.imgTamano * 1.3;
        const radioClip = PW.imgTamano * 0.55;

        // Glow circular difuso detrás del objeto
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radioGlow);
        grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.45)');
        grad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',0.15)');
        grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radioGlow, 0, Math.PI * 2);
        ctx.fill();

        if (img && img.complete && img.naturalWidth > 0) {
            // Recortar la imagen en círculo para eliminar el fondo cuadrado
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radioClip, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, px, py, PW.imgTamano, PW.imgTamano);
            ctx.restore();
        } else {
            // Fallback: círculo sólido del color del aura
            ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.85)';
            ctx.beginPath();
            ctx.arc(cx, cy, radioClip, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Verifica si el jugador colisiona con algún power-up activo (AABB).
 * Si hay colisión, pone el slot en fase 'respawn' y retorna la info del efecto.
 * @param {{ x: number, y: number, ancho: number, alto: number }} jugRect
 * @param {number} duracionBuff - duración del buff activo (para calcular timer respawn)
 * @returns {{ efecto: string, duracion: number, auraColor: number[], nombre: string }|null}
 */
export function verificarColisionPowerup(jugRect, duracionBuff) {
    for (let i = 0; i < slots.length; i++) {
        const s = slots[i];
        if (s.fase !== 'activo') continue;

        // AABB
        if (
            jugRect.x < s.x + PW.imgTamano &&
            jugRect.x + jugRect.ancho > s.x &&
            jugRect.y < s.y + PW.imgTamano &&
            jugRect.y + jugRect.alto > s.y
        ) {
            const tipo = TIPOS[s.tipoIdx];
            const duracion = tipo.duracion ?? tipo.duracionMax ?? 480;

            // Timer respawn: duración del buff recogido + extra
            s.fase = 'respawn';
            s.timer = (duracionBuff || duracion) + PW.respawnExtra;

            return {
                efecto: tipo.efecto,
                duracion,
                auraColor: tipo.auraColor,
                nombre: tipo.id
                    .split('-')
                    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                    .join(' '),
            };
        }
    }
    return null;
}

/** Limpia todos los slots */
export function limpiarPowerups() {
    slots = [];
    mapaRef = null;
}
