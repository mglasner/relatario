// Script de build: convierte datos/*.yaml → JS generado
// - personajes.yaml → js/personajes.js
// - enemigos.yaml   → js/enemigos.js
// - {laberinto,laberinto3d,memorice,abismo}.yaml → js/juegos/{slug}/config.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import prettier from 'prettier';

const CABECERA = '// GENERADO desde datos/*.yaml — no editar directamente\n';
const IMG_PLACEHOLDER = 'assets/img/placeholder.webp';

// --- Tesoros ---

const TIERS_CON_SPRITE = ['epico', 'legendario', 'mitico'];
const TIERS_VALIDOS = ['curioso', 'raro', 'epico', 'legendario', 'mitico'];

function validarTesoro(nombre, datos, archivo) {
    const errores = [];
    if (!datos.tier || !TIERS_VALIDOS.includes(datos.tier)) {
        errores.push(`  - tier inválido: "${datos.tier}" (debe ser ${TIERS_VALIDOS.join('/')})`);
    }
    if (datos.peso == null) errores.push('  - falta "peso"');
    if (!datos.img) errores.push('  - falta "img"');
    if (!datos.clase) errores.push('  - falta "clase"');

    if (TIERS_CON_SPRITE.includes(datos.tier)) {
        if (!datos.sprite) errores.push(`  - falta "sprite" (requerido para tier ${datos.tier})`);
        if (!datos.frames) errores.push(`  - falta "frames" (requerido para tier ${datos.tier})`);
    }
    if (!Array.isArray(datos.juegos) || datos.juegos.length === 0) {
        errores.push('  - falta "juegos" (array de slugs de juegos)');
    }

    if (errores.length > 0) {
        throw new Error(`${archivo} → ${nombre}:\n${errores.join('\n')}`);
    }
}

function generarTesorosJS(datos) {
    const entradas = Object.entries(datos).map(function ([nombre, d]) {
        const clave = generarClave(nombre);
        const desc = (d.descripcion || '').replace(/'/g, "\\'").replace(/\n/g, '\\n').trim();
        const lineas = [
            `tier: '${d.tier}',`,
            `peso: ${d.peso},`,
            `img: '${d.img}',`,
            `clase: '${d.clase}',`,
            `descripcion: '${desc}',`,
        ];
        if (d.sprite) lineas.push(`sprite: '${d.sprite}',`);
        if (d.frames) lineas.push(`frames: ${d.frames},`);
        if (d.juegos) lineas.push(`juegos: [${d.juegos.map((j) => `'${j}'`).join(', ')}],`);
        const cuerpo = lineas.map((l) => `        ${l}`).join('\n');
        return `    ${clave}: {\n${cuerpo}\n    },`;
    });

    return [
        CABECERA,
        'const TESOROS = {',
        entradas.join('\n\n'),
        '};',
        '',
        'export { TESOROS };',
    ].join('\n');
}

// --- Entidades ---

const CAMPOS_ENTIDAD = [
    'vida',
    'clase',
    'descripcion',
    'edad',
    'velocidad',
    'velAtaque',
    'estatura',
];
const CAMPOS_PERSONAJE = [
    ...CAMPOS_ENTIDAD,
    'genero',
    'colorHud',
    'colorHudClaro',
    'colorPiel',
    'emojiHud',
];
const CAMPOS_ENEMIGO = ['tier', 'genero', ...CAMPOS_ENTIDAD];
const CAMPOS_ATAQUE = ['nombre', 'dano', 'descripcion'];

// Valida que una entidad tenga todos los campos requeridos
function validar(nombre, datos, archivo, campos) {
    const errores = [];

    for (const campo of campos) {
        if (datos[campo] == null || datos[campo] === '') {
            errores.push(`  - falta "${campo}"`);
        }
    }

    if (!datos.img) {
        datos.img = IMG_PLACEHOLDER;
        console.warn(`  ⚠ ${nombre}: sin imagen, usando placeholder`);
    }

    if (!Array.isArray(datos.ataques) || datos.ataques.length === 0) {
        errores.push('  - debe tener al menos 1 ataque');
    } else {
        datos.ataques.forEach((ataque, i) => {
            for (const campo of CAMPOS_ATAQUE) {
                if (ataque[campo] == null || ataque[campo] === '') {
                    errores.push(`  - ataque #${i + 1}: falta "${campo}"`);
                }
            }
        });
    }

    if (errores.length > 0) {
        throw new Error(`${archivo} → ${nombre}:\n${errores.join('\n')}`);
    }
}

// Valida todas las entidades de un archivo
function validarTodos(datos, archivo, campos) {
    for (const [nombre, d] of Object.entries(datos)) {
        validar(nombre, d, archivo, campos);
    }
}

// Lee la config de Prettier del proyecto
async function leerConfigPrettier() {
    const raw = readFileSync('.prettierrc', 'utf-8');
    return { ...JSON.parse(raw), parser: 'babel' };
}

// Genera el string de un ataque: { nombre: '...', dano: N, descripcion: '...' }
function generarAtaque(ataque) {
    const nombre = ataque.nombre.replace(/'/g, "\\'");
    const desc = ataque.descripcion.replace(/'/g, "\\'");
    return `{ nombre: '${nombre}', dano: ${ataque.dano}, descripcion: '${desc}' }`;
}

// Genera el string de un objeto de datos (img, clase, descripcion, etc.)
function generarDatos(datos) {
    const lineas = [
        ...(datos.tier ? [`tier: '${datos.tier}',`] : []),
        ...(datos.genero ? [`genero: '${datos.genero}',`] : []),
        `img: '${datos.img}',`,
        `clase: '${datos.clase}',`,
        `descripcion: '${datos.descripcion.replace(/'/g, "\\'").replace(/\n/g, '\\n')}',`,
        `edad: ${datos.edad},`,
        `velocidad: ${datos.velocidad},`,
        `velAtaque: ${datos.velAtaque},`,
        `estatura: ${datos.estatura},`,
        ...(datos.colorHud ? [`colorHud: '${datos.colorHud}',`] : []),
        ...(datos.colorHudClaro ? [`colorHudClaro: '${datos.colorHudClaro}',`] : []),
        ...(datos.colorPiel ? [`colorPiel: '${datos.colorPiel}',`] : []),
        ...(datos.emojiHud ? [`emojiHud: '${datos.emojiHud}',`] : []),
    ];
    return `{\n${lineas.map((l) => `            ${l}`).join('\n')}\n        }`;
}

// Genera la clave del objeto (con comillas si tiene espacios)
function generarClave(nombre) {
    return /\s/.test(nombre) ? `'${nombre}'` : nombre;
}

// Genera el JS completo para un archivo de datos
function generarJS(datos, clase, importPath) {
    const entradas = Object.entries(datos).map(([nombre, d]) => {
        const ataques = d.ataques.map(generarAtaque);
        const ataquesStr = `[\n${ataques.map((a) => `            ${a},`).join('\n')}\n        ]`;
        const datosStr = generarDatos(d);
        const clave = generarClave(nombre);
        return `    ${clave}: new ${clase}(\n        '${nombre}',\n        ${d.vida},\n        ${ataquesStr},\n        ${datosStr}\n    ),`;
    });

    const nombreConst = clase === 'Personaje' ? 'PERSONAJES' : 'ENEMIGOS';

    return [
        CABECERA,
        `import { ${clase} } from '${importPath}';`,
        '',
        `const ${nombreConst} = {`,
        entradas.join('\n\n'),
        '};',
        '',
        `export { ${nombreConst} };`,
    ].join('\n');
}

// --- Juegos: YAML → config.js ---

// Schema de validación: sección → campos requeridos
const SCHEMA_LABERINTO = {
    meta: ['titulo', 'timeoutExito'],
    textos: [
        'indicadorBusqueda',
        'indicadorLlaveObtenida',
        'toastLlave',
        'mensajeExito',
        'toastElite',
    ],
    laberinto: ['filas', 'columnas', 'atajos'],
    jugador: [
        'tamBase',
        'velocidadBase',
        'velocidadReferencia',
        'margenColision',
        'toleranciaEsquina',
        'escalaVisualBase',
        'estaturaReferencia',
    ],
    trampasFuego: [
        'cantidadMin',
        'cantidadMax',
        'distanciaMinEntrada',
        'periodoMin',
        'periodoMax',
        'desfaseMax',
        'cooldown',
        'danoMin',
        'danoMax',
    ],
    trampasLentitud: [
        'cantidadMin',
        'cantidadMax',
        'distanciaMinEntrada',
        'periodoMin',
        'periodoMax',
        'desfaseMax',
        'cooldown',
        'reduccionMin',
        'reduccionMax',
        'duracionMin',
        'duracionMax',
    ],
    trasgo: [
        'tamBase',
        'velocidadBase',
        'cooldownBaseAtaque',
        'intervaloPathfinding',
        'velocidadInicial',
        'tiempoAceleracion',
        'posicionDistMin',
        'posicionDistMax',
    ],
    villanoElite: [
        'tamBase',
        'velocidadBase',
        'velocidadReferencia',
        'countdown',
        'intervaloPathfinding',
        'velocidadInicial',
        'tiempoAceleracion',
        'posicionDistMin',
        'posicionDistMax',
        'escalaVisualBase',
        'estaturaReferencia',
    ],
    render: ['tamCeldaBase'],
    cuartosSecretos: [
        'cantidadMin',
        'cantidadMax',
        'tiempoEmpujar',
        'distanciaMinEntrada',
        'distanciaMinLlave',
        'radioProximidad',
        'curacionMin',
        'curacionMax',
        'probabilidadFuente',
        'toastPista',
        'toastAbierto',
        'toastFuente',
        'toastTesoro',
    ],
};

const SCHEMA_LABERINTO3D = {
    meta: ['titulo', 'timeoutExito'],
    textos: ['indicadorBusqueda', 'indicadorLlaveObtenida', 'toastLlave', 'mensajeExito'],
    laberinto: ['filas', 'columnas', 'atajos'],
    trampasFuego: [
        'cantidadMin',
        'cantidadMax',
        'distanciaMinEntrada',
        'periodoMin',
        'periodoMax',
        'desfaseMax',
        'cooldown',
        'danoMin',
        'danoMax',
    ],
    rendimiento: ['warmupFrames', 'umbralFrameLento', 'framesLentosParaFallback', 'flashDano'],
};

const SCHEMA_MEMORICE = {
    meta: ['titulo', 'tiempoVictoria'],
    tablero: ['filas', 'columnas', 'numHeroes', 'numVillanos'],
    intentos: ['max', 'alerta', 'margenAdvertencia'],
    curacion: ['parMin', 'parMax', 'victoriaMin', 'victoriaMax'],
    tiempos: ['volteo', 'noMatch'],
    textos: [
        'indicador',
        'toastMatch',
        'toastVictoria',
        'toastAdvertencia',
        'toastCuracion',
        'toastRelampago',
        'toastBarajar',
    ],
    dificultad: ['opciones', 'default'],
    relampago: ['probabilidad', 'duracion', 'flash'],
    barajar: ['retraso', 'animacion'],
};

const SCHEMA_ABISMO = {
    meta: ['titulo', 'timeoutExito'],
    canvas: ['anchoBase', 'altoBase'],
    tiles: ['tamano', 'tipos'],
    fisicas: [
        'gravedad',
        'velocidadMaxCaida',
        'velocidadJugador',
        'fuerzaSalto',
        'fuerzaStompReboteBajo',
        'fuerzaStompReboteAlto',
        'coyoteTime',
        'jumpBuffer',
        'invulnerabilidad',
        'knockbackX',
        'knockbackY',
    ],
    enemigos: ['stompMargen', 'stompVyMin', 'cooldownAtaque', 'invulStomp', 'stunStomp'],
    boss: ['fasesCambio', 'velocidadFases'],
    render: ['colorSuelo', 'colorPlataforma', 'colorEnemigo', 'colorBoss'],
    escalado: [
        'estaturaRef',
        'escalaMin',
        'escalaMax',
        'hitboxBaseW',
        'hitboxBaseH',
        'spriteBaseW',
        'spriteBaseH',
        'velAttrMin',
        'velAttrMax',
        'velPlatMin',
        'velPlatMax',
        'fuerzaSaltoBase',
        'fuerzaSaltoFactor',
    ],
    camara: ['shakeDecay'],
    sprites: ['jugadorIdleVel', 'jugadorCorrerVel'],
};

const SCHEMA_AJEDREZ = {
    meta: ['titulo', 'tiempoVictoria'],
    modo: ['opciones', 'default'],
    dificultad: ['opciones', 'default'],
    color: ['opciones', 'default'],
    ia: ['retardoMovimiento', 'retardoJaque'],
    tablero: ['tamCelda', 'tamCeldaMobile'],
    textos: [
        'eligeColor',
        'toastJaque',
        'toastTablas',
        'toastVictoria',
        'toastDerrota',
        'toastVictoriaHeroes',
        'toastVictoriaVillanos',
        'eligeModo',
        'ofrecerTablas',
        'heroesOfrecenTablas',
        'villanosOfrecenTablas',
        'aceptarTablas',
        'rechazarTablas',
    ],
    curacion: ['victoriaMin', 'victoriaMax'],
};

// Tabla de juegos: slug → schema de validación
const JUEGOS = [
    { slug: 'laberinto', schema: SCHEMA_LABERINTO },
    { slug: 'laberinto3d', schema: SCHEMA_LABERINTO3D },
    { slug: 'memorice', schema: SCHEMA_MEMORICE },
    { slug: 'abismo', schema: SCHEMA_ABISMO },
    { slug: 'ajedrez', schema: SCHEMA_AJEDREZ },
];

// Valida un juego contra su schema
function validarJuego(datos, archivo, schema) {
    const errores = [];

    for (const [seccion, campos] of Object.entries(schema)) {
        if (!datos[seccion]) {
            errores.push(`  - falta sección "${seccion}"`);
            continue;
        }
        for (const campo of campos) {
            if (datos[seccion][campo] == null || datos[seccion][campo] === '') {
                errores.push(`  - ${seccion}.${campo}: falta valor`);
            }
        }
    }

    if (errores.length > 0) {
        throw new Error(`${archivo}:\n${errores.join('\n')}`);
    }
}

// Genera JS de config para un juego (objeto plano exportado)
function generarConfigJS(datos) {
    return `${CABECERA}\nexport const CFG = ${JSON.stringify(datos, null, 4)};\n`;
}

async function main() {
    const configPrettier = await leerConfigPrettier();

    // Personajes
    const personajesYaml = readFileSync('datos/personajes.yaml', 'utf-8');
    const personajesData = yaml.load(personajesYaml);
    validarTodos(personajesData, 'personajes.yaml', CAMPOS_PERSONAJE);
    const personajesJS = generarJS(personajesData, 'Personaje', './entidades.js');
    const personajesFmt = await prettier.format(personajesJS, configPrettier);
    writeFileSync('js/personajes.js', personajesFmt);
    console.log('js/personajes.js generado');

    // Enemigos
    const enemigosYaml = readFileSync('datos/enemigos.yaml', 'utf-8');
    const enemigosData = yaml.load(enemigosYaml);
    validarTodos(enemigosData, 'enemigos.yaml', CAMPOS_ENEMIGO);
    const enemigosJS = generarJS(enemigosData, 'Enemigo', './entidades.js');
    const enemigosFmt = await prettier.format(enemigosJS, configPrettier);
    writeFileSync('js/enemigos.js', enemigosFmt);
    console.log('js/enemigos.js generado');

    // Tesoros
    const tesorosYaml = readFileSync('datos/tesoros.yaml', 'utf-8');
    const tesorosData = yaml.load(tesorosYaml);
    for (const [nombre, d] of Object.entries(tesorosData)) {
        validarTesoro(nombre, d, 'tesoros.yaml');
    }
    const tesorosJS = generarTesorosJS(tesorosData);
    const tesorosFmt = await prettier.format(tesorosJS, configPrettier);
    writeFileSync('js/tesoros.js', tesorosFmt);
    console.log('js/tesoros.js generado');

    // Juegos
    for (const { slug, schema } of JUEGOS) {
        const archivo = `datos/${slug}.yaml`;
        if (!existsSync(archivo)) continue;

        const datos = yaml.load(readFileSync(archivo, 'utf-8'));
        validarJuego(datos, `${slug}.yaml`, schema);
        const salida = `js/juegos/${slug}/config.js`;
        const formateado = await prettier.format(generarConfigJS(datos), configPrettier);
        writeFileSync(salida, formateado);
        console.log(`${salida} generado`);
    }
}

main();
