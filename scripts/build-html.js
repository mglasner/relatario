// Script de build: copia index.html a dist/ reescribiendo rutas para producción

import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';

mkdirSync('dist', { recursive: true });

let html = readFileSync('index.html', 'utf-8');

// Reescribir CSS: estilos.css → estilos.min.css
html = html.replace('href="estilos.css"', 'href="estilos.min.css"');

// Reescribir JS: js/juego.js → juego.min.js
html = html.replace('src="js/juego.js"', 'src="juego.min.js"');

writeFileSync('dist/index.html', html);

// Copiar assets estáticos (imágenes y fuentes)
cpSync('assets', 'dist/assets', { recursive: true });
