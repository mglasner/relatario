// Definición de personajes jugables
import { Personaje } from './entidades.js';

const PERSONAJES = {
    Lina: new Personaje(
        'Lina',
        100,
        [
            { nombre: 'Nota aguda', dano: 15, descripcion: 'Un agudo que aturde al rival' },
            { nombre: 'Encore explosivo', dano: 25, descripcion: 'Actuación final que arrasa el escenario' },
        ],
        {
            img: 'assets/img/personajes/lina.webp',
            clase: 'jugador-lina',
            descripcion: '13 años. Idol de K-pop y visual de su banda. Lucha al ritmo de la música.',
            edad: 13,
            velocidad: 7,
            estatura: 1.55,
        }
    ),

    Rosé: new Personaje(
        'Rosé',
        90,
        [
            { nombre: 'Latigazo de tela', dano: 20, descripcion: 'Un giro envolvente con la tela aérea' },
            { nombre: 'Giro del cubo', dano: 10, descripcion: 'Atrapa al rival girando desde el cubo' },
        ],
        {
            img: 'assets/img/personajes/rose.webp',
            clase: 'jugador-rose',
            descripcion: '10 años. Estudiante de circo aéreo. Domina la tela y el cubo.',
            edad: 10,
            velocidad: 8,
            estatura: 1.4,
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
            descripcion: 'Shōgun legendario de la era Tokugawa. Venció a 100 ninjas con un solo bambú.',
            edad: 300,
            velocidad: 5,
            estatura: 1.7,
        }
    ),

    Hana: new Personaje(
        'Hana',
        95,
        [
            { nombre: 'Pirueta fulminante', dano: 20, descripcion: 'Un giro vertiginoso que derriba al rival' },
            { nombre: 'Coreografía letal', dano: 22, descripcion: 'Movimientos mortales de baile' },
        ],
        {
            img: 'assets/img/personajes/hana.webp',
            clase: 'jugador-hana',
            descripcion: '16 años. Bailarina. Sus movimientos hipnotizan a cualquier rival.',
            edad: 16,
            velocidad: 9,
            estatura: 1.62,
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
            edad: 14,
            velocidad: 7,
            estatura: 1.58,
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
            descripcion: 'Padre de familia. Casado con Pamelota, sus hijas Pototo y Topete le dan más problemas que cualquier villano.',
            edad: 45,
            velocidad: 4,
            estatura: 1.5,
        }
    ),
};

export { PERSONAJES };
