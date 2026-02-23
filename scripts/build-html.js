// Script de build: genera dist/ con HTML reescrito, archivos SEO y assets para producción

import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

mkdirSync('dist', { recursive: true });

// Build ID único para cache-busting en cada deploy
const buildId = Date.now().toString(36);

let html = readFileSync('index.html', 'utf-8');

// Reescribir CSS: estilos.css → estilos.min.css?v=buildId
html = html.replace('href="estilos.css"', `href="estilos.min.css?v=${buildId}"`);

// Reescribir JS: js/juego.js → juego.min.js?v=buildId
html = html.replace('src="js/juego.js"', `src="juego.min.js?v=${buildId}"`);

writeFileSync('dist/index.html', html);

// Copiar manifest
cpSync('manifest.webmanifest', 'dist/manifest.webmanifest');

// Copiar assets estáticos (imágenes y fuentes)
cpSync('assets', 'dist/assets', { recursive: true });

// Service worker: inyectar versión única y URLs versionadas
let sw = readFileSync('sw.js', 'utf-8');
sw = sw.replace(/relatario-v\w+/, 'relatario-' + buildId);
sw = sw.replace("'juego.min.js'", `'juego.min.js?v=${buildId}'`);
sw = sw.replace("'estilos.min.css'", `'estilos.min.css?v=${buildId}'`);
writeFileSync('dist/sw.js', sw);
// eslint-disable-next-line no-console
console.log('SW cache version: relatario-' + buildId);

// Copiar assets de cuentos publicados a dist/
if (existsSync('cuentos')) {
    readdirSync('cuentos', { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .forEach((d) => {
            const libroPath = join('cuentos', d.name, 'libro.yaml');
            if (!existsSync(libroPath)) return;
            const meta = yaml.load(readFileSync(libroPath, 'utf-8'));
            if (!meta || !meta.publicado) return;

            const assetsDir = join('cuentos', d.name, 'assets');
            if (existsSync(assetsDir)) {
                const destDir = join('dist', 'cuentos', d.name, 'assets');
                mkdirSync(destDir, { recursive: true });
                cpSync(assetsDir, destDir, { recursive: true });
            }
        });
}

// CNAME para GitHub Pages custom domain
writeFileSync('dist/CNAME', 'relatario.cl');

// robots.txt
writeFileSync(
    'dist/robots.txt',
    `User-agent: *\nAllow: /\nSitemap: https://relatario.cl/sitemap.xml\n`
);

// sitemap.xml
const hoy = new Date().toISOString().split('T')[0];
writeFileSync(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://relatario.cl/</loc>
    <lastmod>${hoy}</lastmod>
  </url>
</urlset>`
);

// 404.html
cpSync('404.html', 'dist/404.html');
