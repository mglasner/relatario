import { crearModoOrientacion } from './modoOrientacion.js';

export function crearModoLandscape(onCambio) {
    return crearModoOrientacion('landscape', onCambio);
}
