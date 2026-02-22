// Crea la estructura de un cuento nuevo a partir de una plantilla
// Uso: node scripts/nuevo-cuento.js "Mi nuevo cuento" [--slug mi-slug]

import { mkdirSync, writeFileSync } from 'fs';

const args = process.argv.slice(2);
const flagSlug = args.indexOf('--slug');
let titulo = '';
let slug = '';

if (flagSlug !== -1) {
    slug = args[flagSlug + 1];
    args.splice(flagSlug, 2);
}

titulo = args.join(' ').trim();

if (!titulo) {
    console.error('Uso: node scripts/nuevo-cuento.js "Título del cuento" [--slug mi-slug]');
    process.exit(1);
}

if (!slug) {
    slug = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

const dir = `cuentos/${slug}`;
const assetsDir = `${dir}/assets`;

mkdirSync(assetsDir, { recursive: true });

const libroYaml = `titulo: ${titulo}
subtitulo: ''
color: '#7a6e5d'
portada: assets/portada.webp
publicado: false
capitulos:
  - archivo: cap-01.md
    titulo: Capítulo 1
`;

writeFileSync(`${dir}/libro.yaml`, libroYaml);
writeFileSync(`${dir}/cap-01.md`, 'Aquí comienza tu historia...\n');

console.log(`Cuento creado en ${dir}/`);
console.log('  libro.yaml  — metadata (publicado: false)');
console.log('  cap-01.md   — primer capítulo');
console.log('  assets/     — directorio para imágenes');
