// Service Worker — El Relatario
// Estrategias diferenciadas por tipo de recurso

const CACHE_NAME = 'relatario-v1';
const BASE_PATH = '/';

// Assets estáticos para precachear en instalación
const STATIC_ASSETS = [
    BASE_PATH,
    BASE_PATH + 'juego.min.js',
    BASE_PATH + 'estilos.min.css',
    BASE_PATH + 'assets/fonts/lora-variable-latin.woff2',
    BASE_PATH + 'assets/fonts/quicksand-variable-latin.woff2',
    BASE_PATH + 'manifest.webmanifest',
    BASE_PATH + 'offline.html',
];

// Instalación: precachear assets críticos
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activación: limpiar caches antiguos
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys
                    .filter(function (key) {
                        return key !== CACHE_NAME;
                    })
                    .map(function (key) {
                        return caches.delete(key);
                    })
            );
        })
    );
    self.clients.claim();
});

// Fetch: estrategia según tipo de recurso
self.addEventListener('fetch', function (event) {
    const url = new URL(event.request.url);

    // API (futuro): network-only, nunca cachear
    if (url.pathname.startsWith(BASE_PATH + 'api/')) {
        return;
    }

    // HTML (navegación): network-first con fallback a cache
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(function (response) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(function () {
                    return caches.match(event.request).then(function (cached) {
                        return cached || caches.match(BASE_PATH + 'offline.html');
                    });
                })
        );
        return;
    }

    // Assets estáticos (JS, CSS, fuentes, imágenes): cache-first
    event.respondWith(
        caches.match(event.request).then(function (cached) {
            if (cached) {
                return cached;
            }
            return fetch(event.request).then(function (response) {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            });
        })
    );
});
