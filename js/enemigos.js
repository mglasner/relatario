// GENERADO desde datos/*.yaml — no editar directamente

import { Enemigo } from './entidades.js';

const ENEMIGOS = {
    Siniestra: new Enemigo(
        'Siniestra',
        150,
        [
            { nombre: 'Llama negra', dano: 15, descripcion: 'Fuego oscuro que consume todo' },
            { nombre: 'Grito arcano', dano: 18, descripcion: 'Onda de energía pura' },
        ],
        {
            tier: 'elite',
            genero: 'femenino',
            img: 'assets/img/enemigos/siniestra.webp',
            clase: 'villano-siniestra',
            descripcion:
                'Nadie sabe quién fue Siniestra antes de convertirse en espectro, pero los rumores dicen que era una hechicera que hizo un trato con las sombras... y las sombras no cumplieron su parte.\n\nAhora vaga furiosa por los pasillos, dejando un rastro de llamas oscuras que se apagan solas al amanecer. Si escuchas un susurro helado detrás de ti, ya es demasiado tarde para correr.',
            edad: 500,
            velocidad: 7,
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
            genero: 'masculino',
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
            { nombre: 'Eco fantasmal', dano: 12, descripcion: 'Aullido paralizante de otro mundo' },
        ],
        {
            tier: 'elite',
            genero: 'masculino',
            img: 'assets/img/enemigos/errante.webp',
            clase: 'villano-errante',
            descripcion:
                'El Errante lleva mil años caminando sin descanso por los rincones más oscuros de El Relatario. Dicen que busca algo que perdió hace siglos, pero nadie sabe qué es.\n\nLo único seguro es que no le gusta que lo interrumpan: cada intruso que se cruza en su camino recibe una mordida tóxica como advertencia. Lento pero implacable, siempre te encuentra.',
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
                nombre: 'Zarpazo sombrío',
                dano: 18,
                descripcion: 'Un zarpazo rápido desde las sombras',
            },
            { nombre: 'Emboscada', dano: 15, descripcion: 'Aparece por sorpresa y ataca' },
        ],
        {
            tier: 'elite',
            genero: 'masculino',
            img: 'assets/img/enemigos/profano.webp',
            clase: 'villano-profano',
            descripcion:
                'El Profano es una sombra con forma humana que se desliza entre las paredes sin hacer ruido. Fue el guardián de un templo olvidado, pero algo lo corrompió y ahora solo obedece a la oscuridad.\n\nAparece cuando menos lo esperas, siempre detrás de ti, siempre en silencio. Los más valientes juran haber visto sus ojos brillar en la negrura un segundo antes de sentir el frío de su cuchillada sombría.',
            edad: 800,
            velocidad: 5,
            velAtaque: 3,
            estatura: 1.95,
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
            genero: 'femenino',
            img: 'assets/img/enemigos/topete.webp',
            clase: 'villano-topete',
            descripcion:
                'Topete tiene 5 años, cachetes de ángel y el corazón de un pequeño demonio travieso. Es la sombra fiel de su hermana Pototo: donde va una, va la otra, y donde hay una travesura, Topete ya está ahí con su sonrisa de "yo no fui". DonBu intentó encadenarla una vez... tres veces... bueno, ya perdió la cuenta. Ella siempre se escapa, y para colmo usa las cadenas rotas como juguetes.\n\nNo te dejes engañar por su tamaño: sus berrinches explosivos hacen temblar los pasillos enteros, y cuando agita sus cadenitas al aire, hasta Siniestra se hace a un lado. Su madre Pamelotota dice que es "expresiva". DonBu dice que es un terremoto con coletas.',
            edad: 5,
            velocidad: 5,
            velAtaque: 8,
            estatura: 1.1,
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
            genero: 'femenino',
            img: 'assets/img/enemigos/pototo.webp',
            clase: 'villano-pototo',
            descripcion:
                'Pototo es la mayor de las hermanas del caos y la mente maestra detrás de cada travesura en El Relatario. Con 10 años ya tiene un historial de bromas que haría llorar a cualquier villano adulto. Su pelo largo y oscuro esconde una mirada calculadora detrás del antifaz: cuando cruza los brazos y sonríe de lado, DonBu sabe que algo terrible está por pasar.\n\nSu especialidad es el plan a largo plazo: puede pasar días fingiendo ser una niña buena hasta que llega el momento perfecto para soltar su risa burlesca y desatar el caos. Cuando DonBu logra atraparla y encadenarla, ella lo mira fijo y dice "¿en serio, papá?" con una calma que da escalofríos. A los cinco minutos ya está libre y planeando la siguiente travesura.',
            edad: 10,
            velocidad: 5,
            velAtaque: 6,
            estatura: 1.35,
        }
    ),

    'La Grotesca': new Enemigo(
        'La Grotesca',
        160,
        [
            {
                nombre: 'Tela encantada',
                dano: 16,
                descripcion: 'Envuelve al rival con telas encantadas',
            },
            {
                nombre: 'Caída vertiginosa',
                dano: 20,
                descripcion: 'Se lanza desde lo alto con todo su peso',
            },
        ],
        {
            tier: 'elite',
            genero: 'femenino',
            img: 'assets/img/enemigos/grotesca.webp',
            clase: 'villano-grotesca',
            descripcion:
                'Hubo un tiempo en que La Grotesca era la artista más deslumbrante del Gran Circo de las Sombras. Su nombre artístico era "Bella Estrella" y cuando volaba por las telas aéreas, el público contenía la respiración. Pero todo cambió en la Gran Final, cuando una niña de 10 años llamada Rosé la superó en la competencia... y Bella cayó desde lo más alto. La envidia y la rabia la transformaron en algo irreconocible.\n\nAhora se hace llamar La Grotesca y arrastra sus viejas telas por los pasillos oscuros, buscando venganza. Su cuerpo se hinchó con la furia acumulada, su maquillaje se corrió para siempre y su belleza se marchitó, pero su habilidad con las telas sigue intacta... solo que ahora las usa para atrapar en vez de para brillar. Si escuchas el sonido de telas arrastrándose por el suelo, ya es tarde para escapar.',
            edad: 35,
            velocidad: 3,
            velAtaque: 5,
            estatura: 1.6,
        }
    ),

    'El Disonante': new Enemigo(
        'El Disonante',
        170,
        [
            {
                nombre: 'Nota discordante',
                dano: 16,
                descripcion: 'Una nota tan desafinada que hace temblar los huesos',
            },
            {
                nombre: 'Réquiem arcano',
                dano: 20,
                descripcion: 'Melodía arcana que drena la energía vital',
            },
        ],
        {
            tier: 'elite',
            genero: 'masculino',
            img: 'assets/img/enemigos/disonante.webp',
            clase: 'villano-disonante',
            descripcion:
                'Hubo un tiempo en que El Disonante fue el violinista más talentoso del mundo de las sombras. Su mejor amigo, un joven cantante llamado Luminox, le prometió que triunfarían juntos: "Tú compones, yo canto, seremos leyenda". Pero Luminox robó sus melodías, se convirtió en el idol más famoso del reino y jamás lo mencionó. La traición le retorció el alma... y la cara. Hoy su rostro es tan desagradable como las notas que arranca de su violín roto.\n\nAhora arrastra su violín agrietado por los pasillos, dejando un rastro de notas amargas que hacen llorar a las paredes. Odia el K-pop con cada fibra de su ser: si escucha un ritmo pegajoso, entra en un frenesí de cuerdas chirriantes. Por eso cuando supo que Lina, una idol que llena estadios, había entrado a El Relatario, afinó su arco por primera vez en décadas. Esta vez, dice, el público escuchará su versión de la historia.',
            edad: 200,
            velocidad: 5,
            velAtaque: 5,
            estatura: 1.85,
        }
    ),

    'El Monstruo Comelón': new Enemigo(
        'El Monstruo Comelón',
        240,
        [
            {
                nombre: 'Bocado estelar',
                dano: 24,
                descripcion: 'Mordisco cósmico que hace temblar el espacio',
            },
            {
                nombre: 'Gran Mascada',
                dano: 30,
                descripcion: 'Abre sus fauces y tritura todo a su paso',
            },
        ],
        {
            tier: 'pesadilla',
            genero: 'masculino',
            img: 'assets/img/enemigos/comelon.webp',
            clase: 'villano-comelon',
            descripcion:
                'El Monstruo Comelón es la criatura más grande y hambrienta que jamás ha flotado por el espacio. Su boca es tan descomunal que podría tragarse la Luna de un solo mordisco... y repetir con la Tierra de postre. Lleva eones vagando entre las estrellas, devorando todo lo que encuentra: planetas, asteroides, cometas e incluso alguna que otra estrella despistada. Los científicos del universo lo llaman "Evento Gastronómico de Nivel Cósmico". Él se llama a sí mismo "un poquito antojadizo".\n\nLo curioso es que El Comelón no es malvado... solo tiene un hambre infinita y cero autocontrol. Cuando La Nebulosa le señala un nuevo mundo, sus ojitos brillan como supernovas y empieza a salivar asteroides. Su estómago retumba con tal fuerza que los planetas cercanos tiemblan en sus órbitas. Dicen que en algún lugar de su panza gigante hay un planeta entero que se salvó porque El Comelón se distrajo con otro más sabroso.',
            edad: 5000000,
            velocidad: 3,
            velAtaque: 4,
            estatura: 99999.9,
        }
    ),

    'La Nebulosa': new Enemigo(
        'La Nebulosa',
        230,
        [
            {
                nombre: 'Niebla cósmica',
                dano: 20,
                descripcion: 'Envuelve al rival en oscuridad helada',
            },
            {
                nombre: 'Vórtice de sombra',
                dano: 26,
                descripcion: 'Remolino de sombras que arrastra todo',
            },
        ],
        {
            tier: 'pesadilla',
            genero: 'femenino',
            img: 'assets/img/enemigos/nebulosa.webp',
            clase: 'villano-nebulosa',
            descripcion:
                'La Nebulosa es una nube viviente de gas y polvo estelar que flota por el cosmos con una curiosidad insaciable. Sus ojos — dos luces brillantes que parpadean entre la bruma — son lo único constante en su forma siempre cambiante: a veces parece un remolino de colores, otras veces una cortina de humo con garras, y cuando está contenta se expande hasta cubrir lunas enteras.\n\nEs la compañera perfecta del Monstruo Comelón: mientras él devora, ella prepara el terreno envolviendo planetas en una oscuridad tan espesa que nadie ve venir lo que se acerca. Lo hace por diversión, no por maldad: para La Nebulosa, envolver un mundo en sombras es como jugar a las escondidas a escala cósmica. Su risa es un eco lejano que resuena entre las estrellas, y cuando se aburre, crea vórtices de sombra solo para ver cómo giran.',
            edad: 3000000,
            velocidad: 5,
            velAtaque: 5,
            estatura: 500,
        }
    ),
};

export { ENEMIGOS };
