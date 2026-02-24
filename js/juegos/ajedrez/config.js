// GENERADO desde datos/*.yaml — no editar directamente

export const CFG = {
    meta: {
        titulo: 'El Ajedrez',
        tiempoVictoria: 2500,
    },
    modo: {
        opciones: [
            {
                id: 'ia',
                nombre: 'vs Villanos (IA)',
                icono: '🤖',
            },
            {
                id: 'humano',
                nombre: 'vs Humano',
                icono: '🤝',
            },
        ],
        default: 0,
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
        toastJaque: '¡Jaque!',
        toastTablas: 'Tablas',
        toastVictoria: '¡Has derrotado al ejército de villanos!',
        toastDerrota: 'El Monstruo Comelón ha ganado...',
        toastVictoriaHeroes: '¡Los Héroes ganan!',
        toastVictoriaVillanos: '¡Los Villanos ganan!',
        eligeModo: 'Modo de juego',
        ofrecerTablas: 'Ofrecer tablas',
        heroesOfrecenTablas: 'Los Héroes ofrecen tablas',
        villanosOfrecenTablas: 'Los Villanos ofrecen tablas',
        aceptarTablas: 'Aceptar',
        rechazarTablas: 'Rechazar',
    },
    curacion: {
        victoriaMin: 10,
        victoriaMax: 15,
    },
};
