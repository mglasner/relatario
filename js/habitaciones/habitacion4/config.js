// Habitación 4 — El Abismo: Constantes de configuración

export const CFG = {
    canvas: { anchoBase: 480, altoBase: 270 },
    tiles: {
        tamano: 16,
        tipos: {
            VACIO: 0,
            SUELO: 1,
            PLATAFORMA: 2,
            ABISMO: 3,
            SPAWN_JUGADOR: 4,
            SPAWN_ENEMIGO: 5,
            SPAWN_BOSS: 6,
            META: 7,
        },
    },
    fisicas: {
        gravedad: 0.5,
        velocidadMaxCaida: 8,
        velocidadJugador: 2.5,
        fuerzaSalto: -7.5,
        fuerzaStompRebote: -5,
        coyoteTime: 6,
        jumpBuffer: 6,
        danoAbismo: 15,
        invulnerabilidad: 60,
        knockbackX: 3,
        knockbackY: -4,
    },
    enemigos: {
        velocidadPatrulla: 1,
        stompMargen: 4,
        cooldownAtaque: 60,
    },
    boss: {
        velocidadBase: 0.8,
        fasesCambio: [0.66, 0.33],
        velocidadFases: [1.0, 1.4],
    },
    render: {
        colorCielo: '#0a0a2e',
        colorAbismo: '#050510',
        colorSuelo: '#2a2a5e',
        colorPlataforma: '#3a3a7e',
        colorEnemigo: '#e94560',
        colorBoss: '#bb86fc',
        colorMeta: '#6bfc86',
    },
    meta: {
        titulo: 'Habitacion 4 — El Abismo',
        itemInventario: 'llave-habitacion-5',
        timeoutExito: 1500,
    },
};
