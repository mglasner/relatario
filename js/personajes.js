// GENERADO desde datos/*.yaml — no editar directamente

import { Personaje } from './entidades.js';

const PERSONAJES = {
    Lina: new Personaje(
        'Lina',
        100,
        [
            { nombre: 'Nota aguda', dano: 15, descripcion: 'Un agudo que aturde al rival' },
            {
                nombre: 'Encore explosivo',
                dano: 25,
                descripcion: 'Actuación final que arrasa el escenario',
            },
        ],
        {
            img: 'assets/img/personajes/lina.webp',
            clase: 'jugador-lina',
            descripcion:
                'Idol de K-pop y visual de su banda. A los 13 ya llena estadios, firma autógrafos y tiene fans que gritan su nombre. Pero lo que nadie sabe es que su voz no solo emociona: cuando Lina canta en su registro más agudo, las ventanas tiemblan y los villanos se tapan los oídos.\n\nDetrás del escenario es una chica normal que se ríe demasiado fuerte, come ramen a escondidas de su manager y se queda dormida viendo doramas. Pero cuando aparece un monstruo, se pone los audífonos, sube el volumen y convierte cada pelea en un concierto.\n',
            edad: 13,
            velocidad: 7,
            velAtaque: 6,
            estatura: 1.55,
            colorHud: '#9b59b6',
            colorHudClaro: '#bb86fc',
            colorPiel: '#f5d0a9',
            emojiHud: '🎤',
        }
    ),

    Rosé: new Personaje(
        'Rosé',
        90,
        [
            {
                nombre: 'Latigazo de tela',
                dano: 20,
                descripcion: 'Un giro envolvente con la tela aérea',
            },
            {
                nombre: 'Giro del cubo',
                dano: 10,
                descripcion: 'Atrapa al rival girando desde el cubo',
            },
        ],
        {
            img: 'assets/img/personajes/rose.webp',
            clase: 'jugador-rose',
            descripcion:
                'Tiene 10 años y ya hace cosas en la tela aérea que los adultos no se atreven ni a mirar. Sube, gira, se suelta y vuelve a agarrarse como si la gravedad fuera una sugerencia. Sus compañeras de circo dicen que nació sin miedo. Su mamá dice que nació sin sentido común.\n\nRosé nunca se rinde. Nunca. Si se cae, se levanta. Si se pierde, busca otro camino. Si un villano le dice "ríndete", ella se ríe y le tira un giro del cubo en la cara. Es la más chica del grupo, pero tiene el corazón más grande y la terquedad más feroz.\n',
            edad: 10,
            velocidad: 8,
            velAtaque: 7,
            estatura: 1.4,
            colorHud: '#2ecc71',
            colorHudClaro: '#6bfc86',
            colorPiel: '#f5d0a9',
            emojiHud: '✨',
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
            descripcion:
                'Shōgun legendario de la era Tokugawa. Dicen que una noche, cien ninjas rodearon su templo mientras dormía. PandaJuro se despertó, arrancó un bambú del jardín y los venció a todos antes de que se le enfriara el té. Desde entonces nadie lo molesta a la hora de la siesta.\n\nTiene 300 años pero no aparenta más de 280. Es lento porque no tiene apuro: dice que la prisa es para los que no saben pelear. Gruñón, honorable y furiosamente leal. Si te ganas su respeto, PandaJuro dará su vida por ti. Si no, te ignorará y seguirá comiendo bambú.\n',
            edad: 300,
            velocidad: 5,
            velAtaque: 4,
            estatura: 1.7,
            colorHud: '#c0392b',
            colorHudClaro: '#e74c3c',
            colorPiel: '#1a1a1a',
            emojiHud: '⚔️',
        }
    ),

    Hana: new Personaje(
        'Hana',
        95,
        [
            {
                nombre: 'Pirueta fulminante',
                dano: 20,
                descripcion: 'Un giro vertiginoso que derriba al rival',
            },
            { nombre: 'Coreografía letal', dano: 22, descripcion: 'Movimientos mortales de baile' },
        ],
        {
            img: 'assets/img/personajes/hana.webp',
            clase: 'jugador-hana',
            descripcion:
                'A los 16 años, Hana ya baila como si su cuerpo no tuviera huesos. Jazz, contemporáneo, hip-hop, lo que sea. Sus profesores dejaron de enseñarle porque ella les enseña a ellos. Cuando baila, la gente se queda quieta mirando, hipnotizada, como si el tiempo se detuviera.\n\nLo que sus rivales no entienden es que cada pirueta es un ataque. Cada giro lleva fuerza, cada paso lleva intención. Hana no pelea: baila. Y cuando termina su coreografía, el villano ya está en el suelo preguntándose qué pasó.\n',
            edad: 16,
            velocidad: 9,
            velAtaque: 8,
            estatura: 1.62,
            colorHud: '#e91e90',
            colorHudClaro: '#fc86d4',
            colorPiel: '#f5d0a9',
            emojiHud: '🌸',
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
            descripcion:
                'A los 14, Kira ya tiene un canal de investigación paranormal con miles de seguidores. Lleva siempre su linterna modificada, un cuaderno lleno de apuntes y una cámara infrarroja que le regaló su abuelo. Si algo raro pasa en el barrio, Kira es la primera en llegar y la última en irse.\n\nNo le tiene miedo a nada porque, según ella, "el miedo es solo información que no has procesado". Analiza, deduce y actúa con una precisión que pone nervioso a cualquier fantasma. Sus disparos de luz nunca fallan, y si un villano intenta esconderse en la oscuridad, peor para él.\n',
            edad: 14,
            velocidad: 7,
            velAtaque: 7,
            estatura: 1.58,
            colorHud: '#2ec4b6',
            colorHudClaro: '#3dd8c8',
            colorPiel: '#f5d0a9',
            emojiHud: '🔦',
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
            descripcion:
                'DonBu es un burro terco, cascarrabias y con un corazón de oro que intenta disimular. Casado con Pamelota, una burra elegante que lo domina con una sola mirada. Sus hijas Pototo y Topete lo vuelven loco: le esconden la pipa, le pintan la cola y le ponen moños mientras duerme.\n\nLento como él solo, pero cuando se enoja no hay quien lo pare. Su patada de mula ha mandado a volar a villanos tres veces más grandes que él. Dice que pelea para proteger a su familia, pero en el fondo le gusta. Es el tipo de padre que refunfuña todo el día y después se queda despierto cuidando que todos duerman bien.\n',
            edad: 45,
            velocidad: 4,
            velAtaque: 3,
            estatura: 1.5,
            colorHud: '#d4a052',
            colorHudClaro: '#e6b86a',
            colorPiel: '#8B6914',
            emojiHud: '🛡️',
        }
    ),

    PomPom: new Personaje(
        'PomPom',
        85,
        [
            {
                nombre: 'Cucharonazo',
                dano: 18,
                descripcion: 'Un golpe certero con el cucharón de madera',
            },
            {
                nombre: 'Abrazo aplastante',
                dano: 22,
                descripcion: 'Un abrazo maternal con la fuerza de quien carga 15 hijos',
            },
        ],
        {
            img: 'assets/img/personajes/pompom.webp',
            clase: 'jugador-pompom',
            descripcion:
                'La coneja más hermosa de la pradera. Todos los conejos del condado hacían fila para cortejarla, pero PomPom eligió a Orejas, el más feo del valle. "Está loca", decían. Pero ella vio lo que nadie más veía: que detrás de esa cara de zanahoria mordida había el corazón más noble bajo tierra.\n\nHoy gobierna la madriguera más caótica del subsuelo. Quince conejitos corriendo por los túneles, robándose las zanahorias del almacén. Un golpe de su cucharón contra la mesa y todo queda en silencio. Humilde hasta el ridículo: si le dices que es hermosa, se pone colorada y dice "ay, no, qué cosas dices".\n',
            edad: 32,
            velocidad: 8,
            velAtaque: 7,
            estatura: 0.45,
            colorHud: '#f8a5c2',
            colorHudClaro: '#fcc2d7',
            colorPiel: '#fefefe',
            emojiHud: '🥄',
        }
    ),

    Orejas: new Personaje(
        'Orejas',
        110,
        [
            {
                nombre: 'Azadonazo',
                dano: 25,
                descripcion: 'Un golpe contundente con su azadón de campo',
            },
            {
                nombre: 'Lluvia de zanahorias',
                dano: 15,
                descripcion: 'Lanza zanahorias a diestra y siniestra desde su bolsa',
            },
        ],
        {
            img: 'assets/img/personajes/orejas.webp',
            clase: 'jugador-orejas',
            descripcion:
                'Una oreja le llega al suelo, la otra apunta al cielo. Dientes chuecos, patas tan largas que tropieza consigo mismo. "Ahí va Orejas, el que parece que lo armaron con piezas sobrantes", decían de pequeño. Pero nunca se amargó. Simplemente sonreía y seguía su camino. Contra todo pronóstico, PomPom, la coneja más hermosa de la pradera, se enamoró de él.\n\nCada mañana sale al campo con su azadón y una bolsa remendada veinte veces, buscando zanahorias para PomPom y sus quince hijos. Silba mientras trabaja, una melodía torcida igual que sus dientes, pero llena de alegría. Su mejor amigo es Don Topo, el viejo topo ciego de al lado, que le dijo una vez: "tú no eres feo, Orejas... es que yo no veo".\n',
            edad: 35,
            velocidad: 6,
            velAtaque: 5,
            estatura: 0.5,
            colorHud: '#e67e22',
            colorHudClaro: '#f0a04b',
            colorPiel: '#a0826d',
            emojiHud: '🥕',
        }
    ),
};

export { PERSONAJES };
