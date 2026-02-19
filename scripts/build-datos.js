// Script de build: convierte datos/*.yaml → JS generado
// - personajes.yaml → js/personajes.js
// - enemigos.yaml   → js/enemigos.js
// - habitacion*.yaml → js/habitaciones/habitacion*/config.js

import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import prettier from 'prettier';

const CABECERA = '// GENERADO desde datos/*.yaml — no editar directamente\n';
const IMG_PLACEHOLDER = 'assets/img/placeholder.webp';

const CAMPOS_ENTIDAD = [
    'vida',
    'clase',
    'descripcion',
    'edad',
    'velocidad',
    'velAtaque',
    'estatura',
];
const CAMPOS_PERSONAJE = [...CAMPOS_ENTIDAD, 'colorHud', 'colorHudClaro', 'colorPiel', 'emojiHud'];
const CAMPOS_ENEMIGO = ['tier', ...CAMPOS_ENTIDAD];
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

// --- Habitaciones: YAML → config.js ---

// Schema de validación: sección → campos requeridos
const SCHEMA_HABITACION1 = {
    meta: ['titulo', 'itemInventario', 'timeoutExito'],
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
        'posicionDistMin',
        'posicionDistMax',
    ],
    villanoElite: [
        'tamBase',
        'velocidadBase',
        'velocidadReferencia',
        'countdown',
        'intervaloPathfinding',
        'posicionDistMin',
        'posicionDistMax',
        'escalaVisualBase',
        'estaturaReferencia',
    ],
    render: ['tamCeldaBase'],
};

const SCHEMA_HABITACION2 = {
    meta: ['titulo', 'itemInventario', 'timeoutExito'],
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

const SCHEMA_HABITACION3 = {
    meta: ['titulo', 'itemInventario', 'tiempoVictoria'],
    tablero: ['filas', 'columnas', 'numHeroes', 'numVillanos'],
    intentos: ['max', 'alerta', 'margenAdvertencia'],
    curacion: ['parMin', 'parMax', 'victoriaMin', 'victoriaMax'],
    tiempos: ['volteo', 'noMatch'],
    textos: ['indicador', 'toastMatch', 'toastVictoria', 'toastAdvertencia', 'toastCuracion'],
};

// Valida una habitación contra su schema
function validarHabitacion(datos, archivo, schema) {
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

// Genera JS de config para una habitación (objeto plano exportado)
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

    // Habitación 1
    const hab1Archivo = 'datos/habitacion1.yaml';
    if (existsSync(hab1Archivo)) {
        const hab1Yaml = readFileSync(hab1Archivo, 'utf-8');
        const hab1Data = yaml.load(hab1Yaml);
        validarHabitacion(hab1Data, 'habitacion1.yaml', SCHEMA_HABITACION1);
        const hab1JS = generarConfigJS(hab1Data);
        const hab1Fmt = await prettier.format(hab1JS, configPrettier);
        writeFileSync('js/habitaciones/habitacion1/config.js', hab1Fmt);
        console.log('js/habitaciones/habitacion1/config.js generado');
    }

    // Habitación 2
    const hab2Archivo = 'datos/habitacion2.yaml';
    if (existsSync(hab2Archivo)) {
        const hab2Yaml = readFileSync(hab2Archivo, 'utf-8');
        const hab2Data = yaml.load(hab2Yaml);
        validarHabitacion(hab2Data, 'habitacion2.yaml', SCHEMA_HABITACION2);
        const hab2JS = generarConfigJS(hab2Data);
        const hab2Fmt = await prettier.format(hab2JS, configPrettier);
        writeFileSync('js/habitaciones/config-habitacion2.js', hab2Fmt);
        console.log('js/habitaciones/config-habitacion2.js generado');
    }

    // Habitación 3
    const hab3Archivo = 'datos/habitacion3.yaml';
    if (existsSync(hab3Archivo)) {
        const hab3Yaml = readFileSync(hab3Archivo, 'utf-8');
        const hab3Data = yaml.load(hab3Yaml);
        validarHabitacion(hab3Data, 'habitacion3.yaml', SCHEMA_HABITACION3);
        const hab3JS = generarConfigJS(hab3Data);
        const hab3Fmt = await prettier.format(hab3JS, configPrettier);
        writeFileSync('js/habitaciones/habitacion3/config.js', hab3Fmt);
        console.log('js/habitaciones/habitacion3/config.js generado');
    }
}

main();
