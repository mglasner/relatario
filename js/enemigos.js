// GENERADO desde datos/*.yaml — no editar directamente

import { Enemigo } from './entidades.js';

const ENEMIGOS = {
    Siniestra: new Enemigo(
        'Siniestra',
        150,
        [
            { nombre: 'Llama negra', dano: 15, descripcion: 'Fuego oscuro que consume todo' },
            { nombre: 'Grito infernal', dano: 18, descripcion: 'Onda de terror puro' },
        ],
        {
            tier: 'terror',
            img: 'assets/img/enemigos/siniestra.webp',
            clase: 'villano-siniestra',
            descripcion:
                'Nadie sabe quién fue Siniestra antes de convertirse en espectro, pero los rumores dicen que era una hechicera que hizo un trato con las sombras... y las sombras no cumplieron su parte.\n\nAhora vaga furiosa por los pasillos, dejando un rastro de llamas oscuras que se apagan solas al amanecer. Si escuchas un susurro helado detrás de ti, ya es demasiado tarde para correr.',
            edad: 500,
            velocidad: 5,
            velAtaque: 3,
            estatura: 1.8,
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
            tier: 'esbirro',
            img: 'assets/img/enemigos/trasgo.webp',
            clase: 'villano-trasgo',
            descripcion:
                'Trasgo es el villano que nadie se toma en serio... y eso le enfurece muchísimo. Este pequeño duende verde lleva siglos intentando dar miedo, pero siempre tropieza con sus propias trampas.\n\nUna vez intentó asustar a un gato y terminó trepado a un árbol pidiendo ayuda. Eso sí, no te confíes: de vez en cuando le sale una travesura que realmente duele.',
            edad: 120,
            velocidad: 6,
            velAtaque: 7,
            estatura: 0.6,
        }
    ),

    'El Errante': new Enemigo(
        'El Errante',
        140,
        [
            { nombre: 'Mordida tóxica', dano: 18, descripcion: 'Mordida venenosa que infecta' },
            {
                nombre: 'Grito de ultratumba',
                dano: 12,
                descripcion: 'Aullido paralizante del más allá',
            },
        ],
        {
            tier: 'terror',
            img: 'assets/img/enemigos/errante.webp',
            clase: 'villano-errante',
            descripcion:
                'El Errante lleva mil años caminando sin descanso por los rincones más oscuros de La Casa del Terror. Dicen que busca algo que perdió hace siglos, pero nadie sabe qué es.\n\nLo único seguro es que no le gusta que lo interrumpan: cada intruso que se cruza en su camino recibe una mordida tóxica como advertencia. Lento pero implacable, siempre te encuentra.',
            edad: 1000,
            velocidad: 3,
            velAtaque: 3,
            estatura: 1.9,
        }
    ),

    'El Profano': new Enemigo(
        'El Profano',
        180,
        [
            {
                nombre: 'Cuchillada sombría',
                dano: 18,
                descripcion: 'Un tajo rápido desde las sombras',
            },
            { nombre: 'Emboscada', dano: 15, descripcion: 'Aparece por sorpresa y ataca' },
        ],
        {
            tier: 'terror',
            img: 'assets/img/enemigos/profano.webp',
            clase: 'villano-profano',
            descripcion:
                'El Profano es una sombra con forma humana que se desliza entre las paredes sin hacer ruido. Fue el guardián de un templo olvidado, pero algo lo corrompió y ahora solo obedece a la oscuridad.\n\nAparece cuando menos lo esperas, siempre detrás de ti, siempre en silencio. Los más valientes juran haber visto sus ojos brillar en la negrura un segundo antes de sentir el frío de su cuchillada sombría.',
            edad: 800,
            velocidad: 4,
            velAtaque: 3,
            estatura: 2.1,
        }
    ),

    Topete: new Enemigo(
        'Topete',
        35,
        [
            {
                nombre: 'Berrinche explosivo',
                dano: 6,
                descripcion: 'Rabieta que hace temblar el piso',
            },
            { nombre: 'Cadenazo', dano: 10, descripcion: 'Golpe con las cadenas rotas' },
        ],
        {
            tier: 'esbirro',
            img: 'assets/img/enemigos/topete.png',
            clase: 'villano-topete',
            descripcion:
                'Topete tiene 5 años, cachetes de ángel y el corazón de un pequeño demonio travieso. Es la sombra fiel de su hermana Pototo: donde va una, va la otra, y donde hay una travesura, Topete ya está ahí con su sonrisa de "yo no fui". DonBu intentó encadenarla una vez... tres veces... bueno, ya perdió la cuenta. Ella siempre se escapa, y para colmo usa las cadenas rotas como juguetes.\n\nNo te dejes engañar por su tamaño: sus berrinches explosivos hacen temblar los pasillos enteros, y cuando agita sus cadenitas al aire, hasta Siniestra se hace a un lado. Su madre Pamelotota dice que es "expresiva". DonBu dice que es un terremoto con coletas.',
            edad: 5,
            velocidad: 7,
            velAtaque: 8,
            estatura: 0.9,
        }
    ),

    Pototo: new Enemigo(
        'Pototo',
        45,
        [
            { nombre: 'Risa burlesca', dano: 8, descripcion: 'Carcajada tan fuerte que aturde' },
            {
                nombre: 'Travesura doble',
                dano: 12,
                descripcion: 'Plan maestro coordinado con su hermana',
            },
        ],
        {
            tier: 'esbirro',
            img: 'assets/img/enemigos/pototo.png',
            clase: 'villano-pototo',
            descripcion:
                'Pototo es la mayor de las hermanas del caos y la mente maestra detrás de cada travesura en La Casa del Terror. Con 10 años ya tiene un historial de bromas que haría llorar a cualquier villano adulto. Su pelo largo y oscuro esconde una mirada calculadora detrás del antifaz: cuando cruza los brazos y sonríe de lado, DonBu sabe que algo terrible está por pasar.\n\nSu especialidad es el plan a largo plazo: puede pasar días fingiendo ser una niña buena hasta que llega el momento perfecto para soltar su risa burlesca y desatar el caos. Cuando DonBu logra atraparla y encadenarla, ella lo mira fijo y dice "¿en serio, papá?" con una calma que da escalofríos. A los cinco minutos ya está libre y planeando la siguiente travesura.',
            edad: 10,
            velocidad: 8,
            velAtaque: 6,
            estatura: 1.35,
        }
    ),
};

export { ENEMIGOS };
