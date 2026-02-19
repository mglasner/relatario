// GENERADO desde datos/*.yaml — no editar directamente

export const CFG = {
    meta: {
        titulo: 'El Memorice',
        itemInventario: 'llave-habitacion-4',
        tiempoVictoria: 2000,
    },
    tablero: {
        filas: 4,
        columnas: 5,
        numHeroes: 5,
        numVillanos: 5,
    },
    intentos: {
        max: 30,
        alerta: 5,
        margenAdvertencia: 3,
    },
    curacion: {
        parMin: 1,
        parMax: 3,
        victoriaMin: 8,
        victoriaMax: 12,
    },
    tiempos: {
        volteo: 500,
        noMatch: 800,
    },
    textos: {
        indicador: 'Intentos: {restantes}',
        toastMatch: '¡Par encontrado!',
        toastVictoria: '¡Memorice completado!',
        toastAdvertencia: '¡Quedan pocos turnos!',
    },
};
