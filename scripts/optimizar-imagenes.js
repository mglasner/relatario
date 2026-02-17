/**
 * Script de optimización de imágenes.
 *
 * Convierte todas las imágenes en assets/img/ a WebP redimensionadas
 * al tamaño máximo de display (@2x retina). Los originales se preservan.
 *
 * Uso: node scripts/optimizar-imagenes.js
 */

import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';

// Tamaños máximos de display @2x retina por carpeta/uso
const TAMANOS = {
    personajes: 240, // tarjeta selección ~120px display
    enemigos: 240, // avatar enemigos ~120px display
    pasillo: 400, // cuadros decorativos ~200px display
};

const DIR_ORIGEN = 'assets/img';
const CALIDAD_WEBP = 80;

function walk(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walk(full));
        else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) results.push(full);
    }
    return results;
}

function obtenerTamano(archivo) {
    const rel = relative(DIR_ORIGEN, archivo);
    const carpeta = rel.split(/[/\\]/)[0];
    return TAMANOS[carpeta] || 300;
}

async function optimizar() {
    const archivos = walk(DIR_ORIGEN);
    let totalOriginal = 0;
    let totalOptimizado = 0;

    console.log('Optimizando imagenes...\n');

    for (const archivo of archivos) {
        const tamano = obtenerTamano(archivo);
        const nombre = basename(archivo, extname(archivo));
        const destino = join(dirname(archivo), nombre + '.webp');

        const meta = await sharp(archivo).metadata();
        const kbOriginal = Math.round(statSync(archivo).size / 1024);
        totalOriginal += kbOriginal;

        // Redimensionar solo si es mas grande que el target
        let pipeline = sharp(archivo);
        if (meta.width > tamano || meta.height > tamano) {
            pipeline = pipeline.resize(tamano, tamano, {
                fit: 'inside',
                withoutEnlargement: true,
            });
        }

        await pipeline.webp({ quality: CALIDAD_WEBP }).toFile(destino);

        const kbOptimizado = Math.round(statSync(destino).size / 1024);
        totalOptimizado += kbOptimizado;
        const reduccion = Math.round((1 - kbOptimizado / kbOriginal) * 100);

        const rel = relative('.', archivo);
        console.log(
            `${rel}: ${meta.width}x${meta.height} (${kbOriginal} KB) -> ${tamano}px WebP (${kbOptimizado} KB) -${reduccion}%`
        );
    }

    console.log('\n--- Resumen ---');
    console.log(`Original: ${totalOriginal} KB (${(totalOriginal / 1024).toFixed(1)} MB)`);
    console.log(`Optimizado: ${totalOptimizado} KB (${(totalOptimizado / 1024).toFixed(1)} MB)`);
    console.log(`Reduccion: ${Math.round((1 - totalOptimizado / totalOriginal) * 100)}%`);
}

optimizar().catch(console.error);
