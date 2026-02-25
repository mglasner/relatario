// Estado compartido y utilidades de la Habitación 1
// Todos los submódulos (trampas, trasgo) acceden a este estado

import { CFG } from './config.js';
import { notificarVidaCambio, notificarJugadorMuerto } from '../../eventos.js';

// Re-exportar CFG para que los submódulos accedan a valores específicos
export { CFG };

// --- Constantes (inicializadas desde config, mutadas por calcularTamCelda) ---

export const CONFIG = {
    TAM_CELDA: CFG.render.tamCeldaBase,
    TAM_JUGADOR: CFG.jugador.tamBase,
    VELOCIDAD: CFG.jugador.velocidadBase,
    MARGEN_COLISION: CFG.jugador.margenColision,
    TOLERANCIA_ESQUINA: CFG.jugador.toleranciaEsquina,
    FILAS: CFG.laberinto.filas,
    COLS: CFG.laberinto.columnas,
    ATAJOS: CFG.laberinto.atajos,
    COOLDOWN_TRAMPA: CFG.trampasFuego.cooldown,
    COOLDOWN_TRAMPA_LENTA: CFG.trampasLentitud.cooldown,
    TAM_TRASGO: CFG.trasgo.tamBase,
    VELOCIDAD_TRASGO: CFG.trasgo.velocidadBase,
    COOLDOWN_BASE: CFG.trasgo.cooldownBaseAtaque,
    INTERVALO_PATHFINDING: CFG.trasgo.intervaloPathfinding,
    COUNTDOWN_ELITE: CFG.villanoElite.countdown,
    INTERVALO_PATHFINDING_ELITE: CFG.villanoElite.intervaloPathfinding,
    TAM_ELITE: CFG.villanoElite.tamBase,
    VELOCIDAD_ELITE: CFG.villanoElite.velocidadBase,
};

// --- Estado mutable ---

export const est = {
    mapa: null,
    llaveFila: 0,
    llaveCol: 0,
    entradaFila: 0,
    entradaCol: 0,
    trampas: [],
    trampasLentas: [],
    cuartosSecretos: [],
    trasgo: null,
    villanoElite: null,
    countdownElite: null,
    tiempoRestante: 0,
    velocidadBase: CONFIG.VELOCIDAD,
    velocidadActual: CONFIG.VELOCIDAD,
    escalaVisual: 1,
    timerLentitud: null,
    timerAparicion: null,
    jugador: null,
    callbackSalir: null,
    posX: 0,
    posY: 0,
    tieneLlave: false,
    activo: false,
    teclas: {},
    // Referencias DOM (se crean dinámicamente)
    canvasMapa: null,
    ctxMapa: null,
    pantalla: null,
    contenedorLaberinto: null,
    elementoJugador: null,
    elementoLlave: null,
    indicador: null,
    mensajeExito: null,
};

// Valores base para escalar proporcionalmente (derivados del config)
const VALORES_BASE = {
    TAM_CELDA: CFG.render.tamCeldaBase,
    TAM_JUGADOR: CFG.jugador.tamBase,
    TAM_TRASGO: CFG.trasgo.tamBase,
    TAM_ELITE: CFG.villanoElite.tamBase,
    VELOCIDAD: CFG.jugador.velocidadBase,
    VELOCIDAD_TRASGO: CFG.trasgo.velocidadBase,
    VELOCIDAD_ELITE: CFG.villanoElite.velocidadBase,
    MARGEN_COLISION: CFG.jugador.margenColision,
    TOLERANCIA_ESQUINA: CFG.jugador.toleranciaEsquina,
};

// Calcula TAM_CELDA según el espacio disponible y escala todo proporcionalmente
export function calcularTamCelda() {
    const contenedor = document.getElementById('juego');

    // Límite por ancho
    const maxAncho = Math.min(contenedor.clientWidth - 20, VALORES_BASE.TAM_CELDA * CONFIG.COLS);
    const celdaPorAncho = Math.floor(maxAncho / CONFIG.COLS);

    // Límite por alto: descontar barra superior, título, indicador, botón y D-pad
    // D-pad: 3 filas de 56px + 2 gaps de 4px + 20px bottom ≈ 196px
    const esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const espacioDpad = esTouch ? 200 : 0;
    const espacioUI = 130; // barra + título + indicador + botón + márgenes
    const altoDisponible = window.innerHeight - espacioUI - espacioDpad;
    const celdaPorAlto = Math.floor(altoDisponible / CONFIG.FILAS);

    CONFIG.TAM_CELDA = Math.max(Math.min(celdaPorAncho, celdaPorAlto), 12);

    const escala = CONFIG.TAM_CELDA / VALORES_BASE.TAM_CELDA;
    CONFIG.TAM_JUGADOR = Math.max(12, Math.round(VALORES_BASE.TAM_JUGADOR * escala));
    CONFIG.TAM_TRASGO = Math.max(10, Math.round(VALORES_BASE.TAM_TRASGO * escala));
    CONFIG.TAM_ELITE = Math.max(12, Math.round(VALORES_BASE.TAM_ELITE * escala));
    CONFIG.VELOCIDAD = Math.max(1.5, VALORES_BASE.VELOCIDAD * escala);
    CONFIG.VELOCIDAD_TRASGO = Math.max(1, VALORES_BASE.VELOCIDAD_TRASGO * escala);
    CONFIG.VELOCIDAD_ELITE = Math.max(1, VALORES_BASE.VELOCIDAD_ELITE * escala);
    CONFIG.MARGEN_COLISION = Math.max(1, Math.round(VALORES_BASE.MARGEN_COLISION * escala));
    CONFIG.TOLERANCIA_ESQUINA = Math.max(3, Math.round(VALORES_BASE.TOLERANCIA_ESQUINA * escala));
}

// --- Utilidades compartidas ---

// Obtiene la celda lógica donde está el centro del jugador
export function getCeldaJugador() {
    const centroX = est.posX + CONFIG.TAM_JUGADOR / 2;
    const centroY = est.posY + CONFIG.TAM_JUGADOR / 2;
    return {
        fila: Math.floor(centroY / CONFIG.TAM_CELDA),
        col: Math.floor(centroX / CONFIG.TAM_CELDA),
    };
}

// Aplica daño al jugador con feedback visual y verifica muerte
export function aplicarDanoJugador(dano) {
    est.jugador.recibirDano(dano);
    notificarVidaCambio();

    // Número de daño flotante
    const elem = document.createElement('div');
    elem.className = 'dano-flotante';
    elem.textContent = '-' + dano;
    elem.style.left = est.posX + 'px';
    elem.style.top = est.posY - 5 + 'px';
    est.contenedorLaberinto.appendChild(elem);
    setTimeout(function () {
        elem.remove();
    }, 1000);

    // Flash en el sprite del jugador
    est.elementoJugador.classList.add('jugador-golpeado');
    setTimeout(function () {
        est.elementoJugador.classList.remove('jugador-golpeado');
    }, 300);

    // Screen shake en el contenedor del laberinto
    est.contenedorLaberinto.classList.remove('screen-shake');
    void est.contenedorLaberinto.offsetWidth; // forzar reflow para reiniciar animación
    est.contenedorLaberinto.classList.add('screen-shake');
    setTimeout(function () {
        est.contenedorLaberinto.classList.remove('screen-shake');
    }, 300);

    // Viñeta roja en el contenedor del laberinto
    est.contenedorLaberinto.classList.remove('vineta-dano');
    void est.contenedorLaberinto.offsetWidth;
    est.contenedorLaberinto.classList.add('vineta-dano');
    setTimeout(function () {
        est.contenedorLaberinto.classList.remove('vineta-dano');
    }, 400);

    if (!est.jugador.estaVivo()) {
        est.activo = false;
        notificarJugadorMuerto();
    }
}
