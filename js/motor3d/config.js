// Motor 3D — Configuración y constantes

export const TEX_SIZE = 64;
export const FOV = Math.PI / 3; // 60 grados
export const VELOCIDAD_MOV = 0.06;
export const VELOCIDAD_GIRO = 0.04;
export const RADIO_COLISION = 0.2;

// Paleta de colores (bosque encantado)
export const COLORES = {
    paredNS: { r: 26, g: 62, b: 30 },
    paredEO: { r: 37, g: 85, b: 42 },
    cieloArriba: '#050f05',
    cieloAbajo: '#0a1a0f',
    sueloArriba: '#0d240d',
    sueloAbajo: '#050a05',
    minimapaFondo: '#0d1a0d',
    minimapaParedes: '#1a3e1a',
};

// Estado mutable del canvas (se recalcula al redimensionar)
export const canvas = {
    ancho: 640,
    alto: 400,
    numRayos: 320,
    anchoFranja: 2,
    anchoMini: 150,
    altoMini: 150,
};

// Recalcula dimensiones según el contenedor del juego
export function calcularDimensiones() {
    const contenedor = document.getElementById('juego');
    canvas.ancho = Math.min(640, contenedor.clientWidth - 20);
    canvas.alto = Math.round(canvas.ancho * 0.625);
    canvas.numRayos = Math.max(160, Math.round(canvas.ancho / 2));
    canvas.anchoFranja = canvas.ancho / canvas.numRayos;
    canvas.anchoMini = Math.min(150, Math.round(canvas.ancho * 0.23));
    canvas.altoMini = canvas.anchoMini;
}
