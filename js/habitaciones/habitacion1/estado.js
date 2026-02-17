// Estado compartido y utilidades de la Habitación 1
// Todos los submódulos (trampas, trasgo) acceden a este estado

// --- Constantes ---

export const CONFIG = {
    TAM_CELDA: 30,
    TAM_JUGADOR: 22,
    VELOCIDAD: 3,
    MARGEN_COLISION: 2,
    TOLERANCIA_ESQUINA: 8,
    FILAS: 17,
    COLS: 17,
    ATAJOS: 8,
    COOLDOWN_TRAMPA: 1000,
    COOLDOWN_TRAMPA_LENTA: 500,
    TAM_TRASGO: 20,
    VELOCIDAD_TRASGO: 2,
    COOLDOWN_TRASGO: 1500,
    INTERVALO_PATHFINDING: 500,
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
    trasgo: null,
    velocidadActual: CONFIG.VELOCIDAD,
    timerLentitud: null,
    jugador: null,
    callbackSalir: null,
    posX: 0,
    posY: 0,
    tieneLlave: false,
    animacionId: null,
    activo: false,
    teclas: {},
    // Referencias DOM (se crean dinámicamente)
    pantalla: null,
    contenedorLaberinto: null,
    elementoJugador: null,
    elementoLlave: null,
    indicador: null,
    mensajeExito: null,
};

// Valores base para escalar proporcionalmente
const VALORES_BASE = {
    TAM_CELDA: 30,
    TAM_JUGADOR: 22,
    TAM_TRASGO: 20,
    VELOCIDAD: 3,
    VELOCIDAD_TRASGO: 2,
    MARGEN_COLISION: 2,
    TOLERANCIA_ESQUINA: 8,
};

// Calcula TAM_CELDA según el ancho disponible y escala todo proporcionalmente
export function calcularTamCelda() {
    const contenedor = document.getElementById('juego');
    const maxAncho = Math.min(contenedor.clientWidth - 20, VALORES_BASE.TAM_CELDA * CONFIG.COLS);
    CONFIG.TAM_CELDA = Math.max(Math.floor(maxAncho / CONFIG.COLS), 16);

    const escala = CONFIG.TAM_CELDA / VALORES_BASE.TAM_CELDA;
    CONFIG.TAM_JUGADOR = Math.max(12, Math.round(VALORES_BASE.TAM_JUGADOR * escala));
    CONFIG.TAM_TRASGO = Math.max(10, Math.round(VALORES_BASE.TAM_TRASGO * escala));
    CONFIG.VELOCIDAD = Math.max(1.5, VALORES_BASE.VELOCIDAD * escala);
    CONFIG.VELOCIDAD_TRASGO = Math.max(1, VALORES_BASE.VELOCIDAD_TRASGO * escala);
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
    document.dispatchEvent(new Event('vida-cambio'));

    // Número de daño flotante
    const elem = document.createElement('div');
    elem.className = 'dano-flotante';
    elem.textContent = '-' + dano;
    elem.style.left = est.posX + 'px';
    elem.style.top = est.posY - 5 + 'px';
    est.contenedorLaberinto.appendChild(elem);
    setTimeout(function () {
        if (elem.parentNode) elem.parentNode.removeChild(elem);
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
        document.dispatchEvent(new Event('jugador-muerto'));
    }
}
