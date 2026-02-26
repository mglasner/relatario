// Script de desarrollo: observador YAML + servidor BrowserSync

import { spawn } from 'child_process';

// Observador de datos YAML — regenera JS al cambiar
const watcher = spawn('node', ['scripts/watch-datos.js'], { stdio: 'inherit' });

// Servidor de desarrollo con hot-reload
// stdout en 'pipe' para detectar cuando esté listo y abrir la vitrina
const server = spawn(
    'npx',
    ['browser-sync', 'start', '--server', '--files', '**/*.html, **/*.css, **/*.js', '--no-notify'],
    { stdio: ['inherit', 'pipe', 'inherit'], shell: true }
);

// Re-imprimir stdout del servidor y detectar la URL local para abrir páginas dev
let paginasAbiertas = false;
server.stdout.on('data', function (chunk) {
    const txt = chunk.toString();
    process.stdout.write(txt);

    if (!paginasAbiertas) {
        const match = txt.match(/Local:\s*(https?:\/\/localhost:\d+)/);
        if (match) {
            paginasAbiertas = true;
            // BrowserSync ya abre index.html (desktop). Abrir mobile y vitrina:
            abrirUrl(match[1] + '/preview-mobile.html');
            abrirUrl(match[1] + '/vitrina.html');
        }
    }
});

function abrirUrl(url) {
    const cmd =
        process.platform === 'win32'
            ? 'start'
            : process.platform === 'darwin'
              ? 'open'
              : 'xdg-open';
    spawn(cmd, [url], { shell: true });
}

function salir() {
    watcher.kill();
    server.kill();
    process.exit();
}

process.on('SIGINT', salir);
process.on('SIGTERM', salir);
server.on('exit', salir);
