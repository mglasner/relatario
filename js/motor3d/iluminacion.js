// Motor 3D — Iluminación dinámica desde antorchas

const LUZ_AMBIENTAL = 0.15;
const RADIO_LUZ = 3;
const RADIO_LUZ_SQ = RADIO_LUZ * RADIO_LUZ;

// Precalcula el mapa de luz para todo el laberinto
// Retorna Float32Array[filas * cols] con valores de brillo (0.0 - 1.0+)
export function precalcularMapaLuz(filas, cols, antorchas, tiempo) {
    const mapa = new Float32Array(filas * cols);

    // Luz ambiental base en todas las celdas
    mapa.fill(LUZ_AMBIENTAL);

    // Contribución de cada antorcha
    for (const antorcha of antorchas) {
        // Parpadeo sutil por antorcha
        const parpadeo = 0.85 + Math.sin(tiempo / 1000 + antorcha.seed * 10) * 0.15;
        const intensidad = parpadeo;

        // Solo afectar celdas en el radio de la antorcha
        const minF = Math.max(0, Math.floor(antorcha.y - RADIO_LUZ));
        const maxF = Math.min(filas - 1, Math.ceil(antorcha.y + RADIO_LUZ));
        const minC = Math.max(0, Math.floor(antorcha.x - RADIO_LUZ));
        const maxC = Math.min(cols - 1, Math.ceil(antorcha.x + RADIO_LUZ));

        for (let f = minF; f <= maxF; f++) {
            for (let c = minC; c <= maxC; c++) {
                const dx = c + 0.5 - antorcha.x;
                const dy = f + 0.5 - antorcha.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < RADIO_LUZ_SQ) {
                    // Atenuación cuadrática
                    const atenuacion = 1 - distSq / RADIO_LUZ_SQ;
                    mapa[f * cols + c] += intensidad * atenuacion * 0.8;
                }
            }
        }
    }

    return mapa;
}
