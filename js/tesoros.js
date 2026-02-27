// GENERADO desde datos/*.yaml — no editar directamente

const TESOROS = {
    'Brújula Estelar': {
        tier: 'curioso',
        peso: 30,
        img: 'assets/img/tesoros/brujula-estelar.webp',
        clase: 'tesoro-brujula-estelar',
        descripcion:
            'Una brújula dorada cuya aguja siempre apunta hacia la aventura más cercana. Dicen que fue forjada con polvo de estrellas fugaces.\n',
        juegos: ['laberinto', 'laberinto3d'],
    },

    'Cristal de Luna': {
        tier: 'curioso',
        peso: 30,
        img: 'assets/img/tesoros/cristal-luna.webp',
        clase: 'tesoro-cristal-luna',
        descripcion:
            'Un cristal traslúcido que guarda en su interior una niebla plateada llena de secretos. Brilla con más fuerza en noches de luna llena.\n',
        juegos: ['memorice', 'ajedrez', 'dueloAjedrez', 'duelo'],
    },

    'Anillo del Viento': {
        tier: 'curioso',
        peso: 30,
        img: 'assets/img/tesoros/anillo-viento.webp',
        clase: 'tesoro-anillo-viento',
        descripcion:
            'Un anillo de jade que susurra melodías cuando sopla la brisa. Quien lo usa puede escuchar los secretos que el viento trae de tierras lejanas.\n',
        juegos: ['abismo', 'laberinto'],
    },

    'Pluma del Fénix': {
        tier: 'raro',
        peso: 15,
        img: 'assets/img/tesoros/pluma-fenix.webp',
        clase: 'tesoro-pluma-fenix',
        descripcion:
            'Una pluma iridiscente que cambia de color con la luz. Quien la porta siente un calor reconfortante, como si el fénix velara por su viaje.\n',
        juegos: ['laberinto', 'memorice', 'abismo', 'duelo'],
    },

    'Reloj de Arena Infinito': {
        tier: 'raro',
        peso: 15,
        img: 'assets/img/tesoros/reloj-arena.webp',
        clase: 'tesoro-reloj-arena',
        descripcion:
            'Un diminuto reloj de arena que nunca termina de vaciarse. Se dice que quien lo observa con paciencia puede ver destellos del futuro entre los granos que caen.\n',
        juegos: ['laberinto3d', 'ajedrez', 'dueloAjedrez', 'memorice'],
    },

    'Llave de los Sueños': {
        tier: 'raro',
        peso: 15,
        img: 'assets/img/tesoros/llave-suenos.webp',
        clase: 'tesoro-llave-suenos',
        descripcion:
            'Una llave de cristal azul que abre puertas que solo existen en los sueños. Quien duerme con ella bajo la almohada viaja a mundos imposibles.\n',
        juegos: ['abismo', 'laberinto3d', 'ajedrez', 'dueloAjedrez'],
    },

    'Espejo de Verdades': {
        tier: 'epico',
        peso: 6,
        img: 'assets/img/tesoros/espejo-verdades.webp',
        clase: 'tesoro-espejo-verdades',
        descripcion:
            'Un espejo de plata que muestra no lo que eres, sino lo que podrías llegar a ser. Solo los valientes se atreven a mirar.\n',
        sprite: 'assets/img/tesoros/espejo-verdades-sprite.png',
        frames: 6,
        juegos: [
            'laberinto',
            'laberinto3d',
            'memorice',
            'abismo',
            'ajedrez',
            'dueloAjedrez',
            'duelo',
        ],
    },

    'Mapa Viviente': {
        tier: 'epico',
        peso: 6,
        img: 'assets/img/tesoros/mapa-viviente.webp',
        clase: 'tesoro-mapa-viviente',
        descripcion:
            'Un pergamino mágico que dibuja solo los caminos que recorres. Cada aventura deja una línea dorada que nunca se borra.\n',
        sprite: 'assets/img/tesoros/mapa-viviente-sprite.png',
        frames: 6,
        juegos: [
            'laberinto',
            'laberinto3d',
            'memorice',
            'abismo',
            'ajedrez',
            'dueloAjedrez',
            'duelo',
        ],
    },

    'Corona de Sombras': {
        tier: 'legendario',
        peso: 2,
        img: 'assets/img/tesoros/corona-sombras.webp',
        clase: 'tesoro-corona-sombras',
        descripcion:
            'Una corona forjada en la oscuridad más profunda, tejida con hilos de sombra que danzan como llamas negras. Quien la porta puede ver lo invisible y caminar entre las penumbras.\n',
        sprite: 'assets/img/tesoros/corona-sombras-sprite.png',
        frames: 8,
        juegos: [
            'laberinto',
            'laberinto3d',
            'memorice',
            'abismo',
            'ajedrez',
            'dueloAjedrez',
            'duelo',
        ],
    },

    'Corazón de Dragón': {
        tier: 'mitico',
        peso: 1,
        img: 'assets/img/tesoros/corazon-dragon.webp',
        clase: 'tesoro-corazon-dragon',
        descripcion:
            'El corazón cristalizado del último dragón, latiendo con un fuego eterno que nunca se apaga. Su brillo calienta el alma de quien lo encuentra y le otorga un coraje sin igual.\n',
        sprite: 'assets/img/tesoros/corazon-dragon-sprite.png',
        frames: 8,
        juegos: [
            'laberinto',
            'laberinto3d',
            'memorice',
            'abismo',
            'ajedrez',
            'dueloAjedrez',
            'duelo',
        ],
    },
};

export { TESOROS };
