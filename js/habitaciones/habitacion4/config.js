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
        stompMargen: 4,
        cooldownAtaque: 60,
    },
    boss: {
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
    escalado: {
        estaturaRef: 1.55, // Lina = escala 1.0
        escalaMin: 0.55,
        escalaMax: 1.35,
        hitboxBaseW: 12,
        hitboxBaseH: 14,
        spriteBaseW: 48,
        spriteBaseH: 60,
        velAttrMin: 3, // atributo velocidad minimo
        velAttrMax: 9, // atributo velocidad maximo
        velPlatMin: 1.5, // px/frame para vel=3
        velPlatMax: 3.5, // px/frame para vel=9
        fuerzaSaltoBase: -7.5,
        fuerzaSaltoFactor: 0.3, // cuanto se ajusta por escala
        velPatrullaFactor: 0.4, // esbirros: velPlat * este factor
        velBossFactor: 0.5, // boss: velPlat * este factor
    },
    camara: {
        shakeDecay: 0.9,
    },
    sprites: {
        jugadorIdleVel: 30, // frames entre cada frame de idle
        jugadorCorrerVel: 6, // frames entre cada frame de correr
    },
    meta: {
        titulo: 'Habitacion 4 — El Abismo',
        itemInventario: 'llave-habitacion-5',
        timeoutExito: 1500,
    },
};
