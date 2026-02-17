// Definición de enemigos
import { Enemigo } from './entidades.js';

const ENEMIGOS = {
    Siniestra: new Enemigo(
        'Siniestra',
        150,
        [
            { nombre: 'Llama negra', dano: 30, descripcion: 'Fuego oscuro que consume todo' },
            { nombre: 'Grito infernal', dano: 30, descripcion: 'Onda de terror puro' },
        ],
        {
            img: 'assets/img/enemigos/siniestra.webp',
            clase: 'villano-siniestra',
            descripcion: 'Espectro furioso. Destruye todo a su paso.',
        }
    ),

    Trasgo: new Enemigo(
        'Trasgo',
        50,
        [
            { nombre: 'Golpe sucio', dano: 7, descripcion: 'Un golpe bajo y traicionero' },
            { nombre: 'Trampa', dano: 10, descripcion: 'Trampa escondida en el suelo' },
        ],
        {
            img: 'assets/img/enemigos/trasgo.webp',
            clase: 'villano-trasgo',
            descripcion: 'Duende torpe. Intenta ser malo pero le sale mal.',
        }
    ),

    'El Errante': new Enemigo(
        'El Errante',
        140,
        [
            { nombre: 'Mordida tóxica', dano: 35, descripcion: 'Mordida venenosa que infecta' },
            {
                nombre: 'Grito de ultratumba',
                dano: 25,
                descripcion: 'Aullido paralizante del más allá',
            },
        ],
        {
            img: 'assets/img/enemigos/errante.webp',
            clase: 'villano-errante',
            descripcion: 'Cadáver inteligente y siniestro. Planifica cada ataque.',
        }
    ),

    'El Profano': new Enemigo(
        'El Profano',
        180,
        [
            {
                nombre: 'Cuchillada sombría',
                dano: 35,
                descripcion: 'Un tajo rápido desde las sombras',
            },
            { nombre: 'Emboscada', dano: 30, descripcion: 'Aparece por sorpresa y ataca' },
        ],
        {
            img: 'assets/img/enemigos/profano.webp',
            clase: 'villano-profano',
            descripcion: 'Sigiloso y despiadado. Aparece cuando menos lo esperas.',
        }
    ),
};

export { ENEMIGOS };
