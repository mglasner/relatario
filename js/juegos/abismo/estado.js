// Estado compartido de El Abismo
// Agrupa todas las variables de estado del módulo en un solo objeto

import { CFG } from './config.js';
import { crearTimeoutTracker } from '../../utils.js';

// Tracker centralizado de timeouts para limpieza segura
export const timeouts = crearTimeoutTracker();

// Snapshot para resetear estado en limpiarAbismo
const valoresIniciales = {
    pantalla: null,
    ctx: null,
    activo: false,
    callbackSalir: null,
    jugador: null,
    anchoCanvas: CFG.canvas.anchoBase,
    altoCanvas: CFG.canvas.altoBase,
    muerto: false,
    modoLandscape: null,
    dpadRef: null,
    // Filas del subsuelo para emision de particulas (desacoplado del tile ABISMO)
    filaNiebla: -1,
    filaOjos: -1,
};

// --- Estado mutable ---
// teclasRef se excluye de valoresIniciales porque resetearEstado limpia sus keys
// sin reasignar la referencia (compartida con jugadorPlat)

export const est = { ...valoresIniciales, teclasRef: {} };

// Resetea el estado a valores iniciales (no reasigna teclasRef para no romper refs compartidas)
export function resetearEstado() {
    // Limpiar teclas sin reasignar referencia (compartida con jugadorPlat)
    Object.keys(est.teclasRef).forEach(function (k) {
        delete est.teclasRef[k];
    });
    Object.assign(est, valoresIniciales);
}
