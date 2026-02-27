// Estado compartido de El Duelo
// Agrupa todas las variables de estado del módulo en un solo objeto

import { CFG } from './config.js';
import { crearTimeoutTracker } from '../../utils.js';

// Tracker centralizado de timeouts para limpieza segura
export const timeouts = crearTimeoutTracker();

// Snapshot para resetear estado en limpiarDuelo
const valoresIniciales = {
    pantalla: null,
    ctx: null,
    activo: false,
    callbackSalir: null,
    anchoCanvas: CFG.canvas.anchoBase,
    altoCanvas: CFG.canvas.altoBase,
    modoLandscape: null,
    dpadRef: null,
    // Fase del juego: 'vs' | 'countdown' | 'pelea' | 'resultado'
    fase: null,
    faseTimer: 0,
    // Luchadores
    luchador1: null, // luchador controlado por el jugador humano
    luchador2: null, // luchador controlado por la IA
    // Ronda
    tiempoRestante: CFG.combate.tiempoRonda,
    ganador: null, // 'jugador' | 'enemigo' | 'empate'
};

// Estado mutable (teclasRef se excluye para no romper refs compartidas)
export const est = { ...valoresIniciales, teclasRef: {} };

// Resetea el estado a valores iniciales
export function resetearEstado() {
    Object.keys(est.teclasRef).forEach(function (k) {
        delete est.teclasRef[k];
    });
    Object.assign(est, valoresIniciales);
}
