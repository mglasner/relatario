// Definición de personajes jugables
import { Personaje } from './entidades.js';

const PERSONAJES = {
    Lina: new Personaje(
        'Lina',
        100,
        [
            { nombre: 'Golpe veloz', dano: 15, descripcion: 'Un golpe rápido' },
            { nombre: 'Patada giratoria', dano: 25, descripcion: 'Ataque poderoso' },
        ],
        {
            img: 'assets/img/personajes/lina.webp',
            clase: 'jugador-lina',
            descripcion: '13 años. Valiente e inteligente.',
        }
    ),

    Rosé: new Personaje(
        'Rosé',
        90,
        [
            { nombre: 'Rayo de luz', dano: 20, descripcion: 'Destello cegador' },
            { nombre: 'Escudo brillante', dano: 10, descripcion: 'Ataque defensivo' },
        ],
        {
            img: 'assets/img/personajes/rose.webp',
            clase: 'jugador-rose',
            descripcion: '10 años. Nunca se rinde.',
        }
    ),

    PandaJuro: new Personaje(
        'PandaJuro',
        120,
        [
            { nombre: 'Corte samurái', dano: 30, descripcion: 'Un tajo devastador' },
            { nombre: 'Golpe de bambú', dano: 18, descripcion: 'Golpe rápido con bambú' },
        ],
        {
            img: 'assets/img/personajes/pandajuro.webp',
            clase: 'jugador-pandajuro',
            descripcion: 'Furioso, leal y honorable.',
        }
    ),

    Hana: new Personaje(
        'Hana',
        95,
        [
            { nombre: 'Onda sónica', dano: 20, descripcion: 'Un grito agudo que aturde' },
            { nombre: 'Coreografía letal', dano: 22, descripcion: 'Movimientos mortales de baile' },
        ],
        {
            img: 'assets/img/personajes/hana.webp',
            clase: 'jugador-hana',
            descripcion: '16 años. Idol de K-pop. Lucha con música.',
        }
    ),

    Kira: new Personaje(
        'Kira',
        95,
        [
            { nombre: 'Disparo certero', dano: 28, descripcion: 'Un tiro preciso que no falla' },
            { nombre: 'Trampa de luz', dano: 18, descripcion: 'Destello que ciega y daña' },
        ],
        {
            img: 'assets/img/personajes/kira.webp',
            clase: 'jugador-kira',
            descripcion: '14 años. Investigadora paranormal. Nada se le escapa.',
        }
    ),

    DonBu: new Personaje(
        'DonBu',
        140,
        [
            { nombre: 'Patada de mula', dano: 35, descripcion: 'Una coz devastadora' },
            { nombre: 'Cabezazo terco', dano: 20, descripcion: 'Embiste con toda su terquedad' },
        ],
        {
            img: 'assets/img/personajes/donbu.webp',
            clase: 'jugador-donbu',
            descripcion: 'Padre de familia. Burro terco y protector.',
        }
    ),
};

export { PERSONAJES };
