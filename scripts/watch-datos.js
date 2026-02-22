// Observa datos/*.yaml y cuentos/**/*.{md,yaml}, regenera los JS automáticamente

import { watch, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Build inicial
execSync('node scripts/build-datos.js', { stdio: 'inherit' });
execSync('node scripts/build-cuentos.js', { stdio: 'inherit' });
console.log('Observando datos/*.yaml y cuentos/...');

let timeoutDatos;
watch('datos', (_event, filename) => {
    if (!filename?.endsWith('.yaml')) return;
    clearTimeout(timeoutDatos);
    timeoutDatos = setTimeout(() => {
        console.log(`\n${filename} cambió, regenerando datos...`);
        try {
            execSync('node scripts/build-datos.js', { stdio: 'inherit' });
        } catch {
            // El error ya se imprimió via stdio
        }
    }, 200);
});

// Observar cada directorio de cuento (fs.watch no es recursivo)
let timeoutCuentos;

function regenerarCuentos(origen) {
    clearTimeout(timeoutCuentos);
    timeoutCuentos = setTimeout(() => {
        console.log(`\n${origen} cambió, regenerando cuentos...`);
        try {
            execSync('node scripts/build-cuentos.js', { stdio: 'inherit' });
        } catch {
            // El error ya se imprimió via stdio
        }
    }, 200);
}

if (existsSync('cuentos')) {
    // Observar el directorio raíz cuentos/ (detecta nuevos subdirectorios)
    watch('cuentos', (_event, filename) => {
        if (filename) regenerarCuentos(`cuentos/${filename}`);
    });

    // Observar cada subdirectorio de cuento
    readdirSync('cuentos', { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .forEach((d) => {
            const dir = join('cuentos', d.name);
            watch(dir, (_event, filename) => {
                if (filename?.endsWith('.md') || filename?.endsWith('.yaml')) {
                    regenerarCuentos(`${dir}/${filename}`);
                }
            });
        });
}
