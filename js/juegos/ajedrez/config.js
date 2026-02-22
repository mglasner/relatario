// GENERADO desde datos/*.yaml — no editar directamente

export const CFG = {
    meta: {
        titulo: 'El Ajedrez',
        tiempoVictoria: 2500,
    },
    dificultad: {
        opciones: [
            {
                nombre: 'Fácil',
                nivel: 1,
            },
            {
                nombre: 'Normal',
                nivel: 2,
            },
            {
                nombre: 'Difícil',
                nivel: 3,
            },
        ],
        default: 1,
    },
    color: {
        opciones: [
            {
                nombre: '♔ Blancas',
                valor: 'white',
            },
            {
                nombre: '♚ Negras',
                valor: 'black',
            },
        ],
        default: 0,
    },
    ia: {
        retardoMovimiento: 500,
        retardoJaque: 300,
    },
    tablero: {
        tamCelda: 60,
        tamCeldaMobile: 48,
    },
    textos: {
        eligeColor: 'Tu color',
        turnoJugador: 'Tu turno',
        turnoIA: 'Turno del rival...',
        toastJaque: '¡Jaque!',
        toastMate: '¡Jaque mate!',
        toastTablas: 'Tablas',
        toastVictoria: '¡Has derrotado al ejército de villanos!',
        toastDerrota: 'El Monstruo Comelón ha ganado...',
        promocion: 'Elige una pieza',
    },
    curacion: {
        victoriaMin: 10,
        victoriaMax: 15,
    },
};
