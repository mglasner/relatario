// Script de build: convierte cuentos/*/libro.yaml + *.md → js/cuentos/registro.js

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import yaml from 'js-yaml';
import { marked } from 'marked';
import prettier from 'prettier';

const DIR_CUENTOS = 'cuentos';
const SALIDA = 'js/cuentos/registro.js';
const CABECERA = '// ⚙️ GENERADO desde cuentos/ — no editar directamente\n';

// Lee la config de Prettier del proyecto
async function leerConfigPrettier() {
    const raw = readFileSync('.prettierrc', 'utf-8');
    return { ...JSON.parse(raw), parser: 'babel' };
}

// Descubre directorios de cuentos con libro.yaml
function descubrirCuentos() {
    if (!existsSync(DIR_CUENTOS)) return [];

    return readdirSync(DIR_CUENTOS, { withFileTypes: true })
        .filter((d) => d.isDirectory() && existsSync(join(DIR_CUENTOS, d.name, 'libro.yaml')))
        .map((d) => d.name)
        .sort();
}

// Valida metadata mínima de un libro
function validar(slug, meta) {
    const errores = [];

    if (!meta.titulo) errores.push('falta "titulo"');
    if (!Array.isArray(meta.capitulos) || meta.capitulos.length === 0) {
        errores.push('debe tener al menos 1 capítulo');
    } else {
        meta.capitulos.forEach((cap, i) => {
            if (!cap.archivo) errores.push(`capítulo #${i + 1}: falta "archivo"`);
            if (!cap.titulo) errores.push(`capítulo #${i + 1}: falta "titulo"`);
        });
    }

    if (errores.length > 0) {
        throw new Error(
            `cuentos/${slug}/libro.yaml:\n${errores.map((e) => `  - ${e}`).join('\n')}`
        );
    }
}

// Procesa un cuento: lee yaml + markdowns, retorna datos
function procesarCuento(slug) {
    const dir = join(DIR_CUENTOS, slug);
    const metaRaw = readFileSync(join(dir, 'libro.yaml'), 'utf-8');
    const meta = yaml.load(metaRaw);

    // Ignorar YAML vacío o borradores
    if (!meta || !meta.publicado) return null;

    validar(slug, meta);

    // Configurar marked para sanitizar rutas de imágenes
    const renderer = new marked.Renderer();
    const imgOriginal = renderer.image.bind(renderer);
    renderer.image = function (token) {
        // Reescribir rutas relativas para que apunten desde el root
        if (token.href && !token.href.startsWith('/') && !token.href.startsWith('http')) {
            token.href = `cuentos/${slug}/${token.href}`;
        }
        return imgOriginal(token);
    };

    const capitulos = meta.capitulos.map((cap) => {
        const mdPath = join(dir, cap.archivo);
        if (!existsSync(mdPath)) {
            throw new Error(`cuentos/${slug}: archivo no encontrado: ${cap.archivo}`);
        }
        const md = readFileSync(mdPath, 'utf-8');
        const html = marked(md, { renderer });
        return { titulo: cap.titulo, html };
    });

    return {
        slug,
        titulo: meta.titulo,
        subtitulo: meta.subtitulo || '',
        color: meta.color || '#7a6e5d',
        portada: meta.portada ? `cuentos/${slug}/${meta.portada}` : '',
        lomo: meta.lomo ? `cuentos/${slug}/${meta.lomo}` : '',
        capitulos,
    };
}

// Genera el JS del registro usando JSON.stringify para escapar correctamente
function generarRegistroJS(cuentos) {
    const estante = cuentos.map((c) => ({
        id: `cuento-${c.slug}`,
        titulo: c.titulo,
        color: c.color,
        ...(c.lomo && { img: c.lomo }),
    }));

    const datos = {};
    for (const c of cuentos) {
        datos[c.slug] = {
            titulo: c.titulo,
            subtitulo: c.subtitulo || '',
            ...(c.portada && { portada: c.portada }),
            capitulos: c.capitulos,
        };
    }

    return [
        CABECERA,
        `export const CUENTOS_ESTANTE = ${JSON.stringify(estante, null, 4)};\n`,
        `export const CUENTOS_DATOS = ${JSON.stringify(datos, null, 4)};\n`,
    ].join('\n');
}

async function main() {
    const configPrettier = await leerConfigPrettier();
    const slugs = descubrirCuentos();

    const cuentos = [];
    for (const slug of slugs) {
        const cuento = procesarCuento(slug);
        if (cuento) {
            cuentos.push(cuento);
            console.log(`  ✓ ${slug} (${cuento.capitulos.length} capítulos)`);
        } else {
            console.log(`  · ${slug} (borrador, omitido)`);
        }
    }

    // Asegurar que el directorio de salida existe
    mkdirSync(dirname(SALIDA), { recursive: true });

    const js = generarRegistroJS(cuentos);
    const formateado = await prettier.format(js, configPrettier);
    writeFileSync(SALIDA, formateado);

    console.log(`${SALIDA} generado (${cuentos.length} cuentos publicados)`);
}

main();
