// GENERADO desde datos/*.yaml — no editar directamente

const CFG_CLIMA = {
    probSinClima: 0.2,
    estaciones: {
        invierno: {
            nombre: 'La Tormenta Arcana',
            tinte: [15, 30, 70, 0.18],
            cielo3d: {
                cieloArriba: '#080d18',
                cieloAbajo: '#142240',
                sueloArriba: '#0a1428',
                sueloAbajo: '#060c18',
                tinte: 'rgba(30,60,120,0.12)',
            },
        },
        primavera: {
            nombre: 'El Despertar del Bosque',
            tinte: [100, 200, 80, 0.07],
            cielo3d: {
                cieloArriba: '#5ba8d4',
                cieloAbajo: '#9dd5b0',
                sueloArriba: '#4a9e5c',
                sueloAbajo: '#2d6b3a',
                tinte: 'rgba(100,200,80,0.08)',
            },
        },
        verano: {
            nombre: 'El Sol Abrasador',
            tinte: [220, 140, 20, 0.12],
            cielo3d: {
                cieloArriba: '#c07010',
                cieloAbajo: '#e8a020',
                sueloArriba: '#8b5010',
                sueloAbajo: '#5a3008',
                tinte: 'rgba(220,140,20,0.10)',
            },
        },
        otono: {
            nombre: 'La Danza de las Hojas',
            tinte: [180, 80, 20, 0.1],
            cielo3d: {
                cieloArriba: '#2a1408',
                cieloAbajo: '#5a2c0e',
                sueloArriba: '#6b3810',
                sueloAbajo: '#3a1c08',
                tinte: 'rgba(180,80,20,0.08)',
            },
        },
    },
    paletas: {
        petalo: [
            [255, 185, 215],
            [255, 175, 200],
            [225, 185, 245],
            [255, 215, 175],
            [185, 225, 250],
            [255, 240, 175],
            [195, 240, 190],
            [255, 205, 225],
        ],
        hoja: [
            [210, 80, 30],
            [230, 150, 40],
            [140, 50, 20],
            [180, 100, 20],
            [200, 120, 50],
        ],
    },
    particulas2d: {
        invierno: {
            lluvia: {
                cantidad: 2,
                cantidadRand: 2,
                vx: -1.2,
                vyBase: 5.5,
                vyRand: 2,
                vidaBase: 20,
                vidaRand: 8,
                tamano: 2,
                color: [170, 200, 255],
                alpha: 0.6,
            },
        },
        primavera: {
            petalos: {
                intervalo: 8,
                vxRand: 1.2,
                vyBase: 0.5,
                vyRand: 0.5,
                vidaBase: 140,
                vidaRand: 80,
                tamanoBase: 3.5,
                tamanoRand: 2.5,
                alpha: 0.85,
            },
            destellos: {
                intervalo: 7,
                vidaBase: 60,
                vidaRand: 30,
                tamano: 1.2,
                color: [255, 255, 200],
                alpha: 0.85,
            },
        },
        verano: {
            polvo: {
                intervalo: 4,
                vxBase: 0.1,
                vxRand: 0.15,
                vidaBase: 250,
                vidaRand: 100,
                tamanoBase: 1,
                tamanoRand: 1,
                color: [220, 190, 100],
                alphaBase: 0.25,
                alphaRand: 0.2,
            },
        },
        otono: {
            hojas: {
                intervalo: 4,
                vxBase: -0.8,
                vxRand: 1.4,
                vyBase: 0.4,
                vyRand: 0.8,
                vidaBase: 90,
                vidaRand: 50,
                tamanoBase: 2,
                tamanoRand: 1,
                alpha: 0.8,
            },
            lluviaSuave: {
                intervalo: 2,
                vx: -0.6,
                vyBase: 2.5,
                vyRand: 1,
                vidaBase: 35,
                vidaRand: 10,
                tamano: 1.5,
                color: [200, 160, 80],
                alpha: 0.28,
            },
            rafaga: {
                intervaloMin: 180,
                intervaloRand: 120,
                duracion: 30,
                vxBase: -2.5,
                vxRand: 0.5,
            },
        },
    },
    particulas3d: {
        invierno: {
            lluvia: {
                intervalo: 2,
                distBase: 0.5,
                distRand: 2.5,
                zBase: 0.95,
                zRand: 0.05,
                vx: -0.003,
                vz: -0.025,
                vida: 40,
                color: [170, 200, 255],
                alpha: 0.55,
                tamano: 1.5,
            },
        },
        primavera: {
            petalos: {
                intervalo: 8,
                distBase: 0.5,
                distRand: 2,
                zBase: 0.8,
                zRand: 0.2,
                vxRand: 0.002,
                vyRand: 0.002,
                vz: -0.004,
                vidaBase: 120,
                vidaRand: 60,
                alpha: 0.85,
                tamanoBase: 3,
                tamanoRand: 1.5,
            },
        },
        verano: {
            motas: {
                intervalo: 5,
                distBase: 0.3,
                distRand: 3,
                zBase: 0.2,
                zRand: 0.5,
                vxRand: 0.001,
                vyRand: 0.001,
                vz: 0.0005,
                vidaBase: 200,
                vidaRand: 100,
                color: [220, 190, 100],
                alpha: 0.3,
                tamanoBase: 1.5,
                tamanoRand: 1,
            },
        },
        otono: {
            hojas: {
                intervalo: 3,
                distBase: 0.4,
                distRand: 2.5,
                zBase: 0.7,
                zRand: 0.3,
                vxRand: 0.004,
                vyRand: 0.004,
                vzBase: -0.006,
                vzRand: 0.003,
                vidaBase: 80,
                vidaRand: 50,
                alpha: 0.75,
                tamanoBase: 2,
                tamanoRand: 1,
            },
        },
        coloresHojas3d: [
            [210, 80, 30],
            [230, 150, 40],
            [140, 50, 20],
        ],
    },
};

export const ESTACIONES = CFG_CLIMA.estaciones;
export const PALETAS_PETALO = CFG_CLIMA.paletas.petalo;
export const PALETAS_HOJA = CFG_CLIMA.paletas.hoja;
export const PARTICULAS_2D = CFG_CLIMA.particulas2d;
export const PARTICULAS_3D = CFG_CLIMA.particulas3d;

/**
 * Sortea una estación aleatoria.
 * @returns {string|null} Clave de estación ('invierno'|'primavera'|'verano'|'otono') o null
 */
export function sortearEstacion() {
    if (Math.random() < CFG_CLIMA.probSinClima) return null;
    const keys = Object.keys(ESTACIONES);
    return keys[Math.floor(Math.random() * keys.length)];
}
