// Habitación 1 — El Laberinto
// El jugador debe encontrar la llave y volver a la salida
// El laberinto se genera aleatoriamente cada vez

import { ENEMIGOS } from "../enemigos.js";

// --- Constantes ---

const TAM_CELDA = 30;
const TAM_JUGADOR = 22;
const VELOCIDAD = 3;
const MARGEN_COLISION = 2;
const TOLERANCIA_ESQUINA = 8;

// Dimensiones del laberinto (deben ser impares para el algoritmo de generación)
const FILAS = 17;
const COLS = 17;
const ATAJOS = 8; // Paredes extra que se abren para crear caminos alternativos
const COOLDOWN_TRAMPA = 1000; // ms entre golpes de la misma trampa

// Trasgo
const TAM_TRASGO = 20;
const VELOCIDAD_TRASGO = 2;
const COOLDOWN_TRASGO = 1500; // ms entre ataques del Trasgo
const INTERVALO_PATHFINDING = 500; // ms entre recálculos de ruta

// --- Generación aleatoria del laberinto ---

// Mezcla un array in-place (Fisher-Yates)
function mezclar(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

// Genera un laberinto usando Recursive Backtracking (DFS)
// Produce un laberinto "perfecto" (un solo camino entre dos puntos)
// luego abre algunos atajos para crear rutas alternativas
function generarMapa() {
    // Inicializar todo como paredes
    var mapa = [];
    for (var f = 0; f < FILAS; f++) {
        mapa[f] = [];
        for (var c = 0; c < COLS; c++) {
            mapa[f][c] = 1;
        }
    }

    // Las celdas lógicas están en posiciones impares del grid
    // Para un grid de 17x17, hay 8x8 = 64 celdas lógicas
    var filasLogicas = (FILAS - 1) / 2;
    var colsLogicas = (COLS - 1) / 2;

    var visitado = [];
    for (var f = 0; f < filasLogicas; f++) {
        visitado[f] = [];
        for (var c = 0; c < colsLogicas; c++) {
            visitado[f][c] = false;
        }
    }

    // Direcciones: arriba, derecha, abajo, izquierda
    var dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    // DFS iterativo con stack (evita desbordamiento de pila)
    var stack = [[0, 0]];
    visitado[0][0] = true;
    mapa[1][1] = 0; // Abrir la primera celda lógica (arriba-izquierda)

    while (stack.length > 0) {
        var actual = stack[stack.length - 1];
        var f = actual[0], c = actual[1];

        // Buscar vecinos no visitados
        var vecinos = [];
        for (var d = 0; d < dirs.length; d++) {
            var nf = f + dirs[d][0];
            var nc = c + dirs[d][1];
            if (nf >= 0 && nf < filasLogicas && nc >= 0 && nc < colsLogicas && !visitado[nf][nc]) {
                vecinos.push([nf, nc, d]);
            }
        }

        if (vecinos.length > 0) {
            // Elegir vecino aleatorio
            var elegido = vecinos[Math.floor(Math.random() * vecinos.length)];
            var nf = elegido[0], nc = elegido[1];

            // Abrir la pared entre las dos celdas
            mapa[f * 2 + 1 + dirs[elegido[2]][0]][c * 2 + 1 + dirs[elegido[2]][1]] = 0;
            // Abrir la celda destino
            mapa[nf * 2 + 1][nc * 2 + 1] = 0;

            visitado[nf][nc] = true;
            stack.push([nf, nc]);
        } else {
            stack.pop(); // Backtrack: volver a la celda anterior
        }
    }

    // Abrir atajos para que el laberinto sea menos frustrante
    abrirAtajos(mapa);

    return mapa;
}

// Elimina algunas paredes internas para crear rutas alternativas
function abrirAtajos(mapa) {
    var paredes = [];

    for (var f = 1; f < FILAS - 1; f++) {
        for (var c = 1; c < COLS - 1; c++) {
            if (mapa[f][c] !== 1) continue;

            // Pared horizontal (entre celdas de la misma fila)
            if (f % 2 === 1 && c % 2 === 0 && mapa[f][c - 1] === 0 && mapa[f][c + 1] === 0) {
                paredes.push([f, c]);
            }
            // Pared vertical (entre celdas de la misma columna)
            if (f % 2 === 0 && c % 2 === 1 && mapa[f - 1][c] === 0 && mapa[f + 1][c] === 0) {
                paredes.push([f, c]);
            }
        }
    }

    mezclar(paredes);
    var cantidad = Math.min(ATAJOS, paredes.length);
    for (var i = 0; i < cantidad; i++) {
        mapa[paredes[i][0]][paredes[i][1]] = 0;
    }
}

// Busca la celda más lejana desde un punto usando BFS
// Solo considera celdas lógicas (posiciones impares) como candidatas
function encontrarPuntoLejano(mapa, inicioF, inicioC) {
    var cola = [[inicioF, inicioC, 0]];
    var idx = 0;
    var visitadoBFS = [];
    for (var f = 0; f < FILAS; f++) {
        visitadoBFS[f] = [];
        for (var c = 0; c < COLS; c++) {
            visitadoBFS[f][c] = false;
        }
    }
    visitadoBFS[inicioF][inicioC] = true;

    var masLejano = [inicioF, inicioC];
    var maxDist = 0;
    var dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    while (idx < cola.length) {
        var actual = cola[idx++];
        var f = actual[0], c = actual[1], dist = actual[2];

        // Solo considerar celdas lógicas (intersecciones) para la llave
        if (dist > maxDist && f % 2 === 1 && c % 2 === 1) {
            maxDist = dist;
            masLejano = [f, c];
        }

        for (var d = 0; d < dirs.length; d++) {
            var nf = f + dirs[d][0];
            var nc = c + dirs[d][1];
            if (nf >= 0 && nf < FILAS && nc >= 0 && nc < COLS && !visitadoBFS[nf][nc] && mapa[nf][nc] === 0) {
                visitadoBFS[nf][nc] = true;
                cola.push([nf, nc, dist + 1]);
            }
        }
    }

    return masLejano;
}

// --- Trampas ---

// Coloca entre 3 y 5 trampas en celdas lógicas lejos de la entrada y la llave
function colocarTrampas() {
    var numTrampas = 3 + Math.floor(Math.random() * 3); // 3-5
    var celdasLibres = [];

    for (var f = 1; f < FILAS - 1; f++) {
        for (var c = 1; c < COLS - 1; c++) {
            if (mapa[f][c] !== 0) continue;
            if (f === entradaFila && c === entradaCol) continue;
            if (f === llaveFila && c === llaveCol) continue;
            // Evitar celdas muy cerca de la entrada
            if (Math.abs(f - entradaFila) + Math.abs(c - entradaCol) <= 3) continue;
            // Solo en celdas lógicas (intersecciones, más visibles)
            if (f % 2 !== 1 || c % 2 !== 1) continue;
            celdasLibres.push([f, c]);
        }
    }

    mezclar(celdasLibres);
    trampas = [];

    for (var i = 0; i < Math.min(numTrampas, celdasLibres.length); i++) {
        trampas.push({
            fila: celdasLibres[i][0],
            col: celdasLibres[i][1],
            periodo: 1500 + Math.floor(Math.random() * 2000), // 1.5-3.5s por ciclo
            desfase: Math.floor(Math.random() * 3000), // cada trampa arranca en distinto momento
            ultimoGolpe: 0,
            elemento: null,
        });
    }
}

// Determina si una trampa está activa (peligrosa) en este momento
function esTrampaActiva(trampa) {
    return Math.floor((Date.now() + trampa.desfase) / trampa.periodo) % 2 === 0;
}

// Actualiza el estado visual de cada trampa (se llama cada frame)
function actualizarTrampas() {
    for (var i = 0; i < trampas.length; i++) {
        var activa = esTrampaActiva(trampas[i]);
        if (activa) {
            trampas[i].elemento.classList.add("trampa-activa");
        } else {
            trampas[i].elemento.classList.remove("trampa-activa");
        }
    }
}

// Detecta si el jugador está sobre una trampa activa y aplica daño
function detectarTrampas() {
    var celda = getCeldaJugador();
    var ahora = Date.now();

    for (var i = 0; i < trampas.length; i++) {
        var t = trampas[i];
        if (celda.fila === t.fila && celda.col === t.col && esTrampaActiva(t)) {
            if (ahora - t.ultimoGolpe >= COOLDOWN_TRAMPA) {
                var dano = 5 + Math.floor(Math.random() * 6); // 5-10
                jugador.recibirDano(dano);
                t.ultimoGolpe = ahora;

                // Notificar a la barra superior
                document.dispatchEvent(new Event("vida-cambio"));

                // Número de daño flotante
                mostrarDano(dano);

                // Flash rojo en el jugador
                elementoJugador.classList.add("jugador-golpeado");
                setTimeout(function () {
                    elementoJugador.classList.remove("jugador-golpeado");
                }, 300);
            }
        }
    }
}

// Muestra un número de daño flotante que sube y desaparece
function mostrarDano(dano) {
    var elem = document.createElement("div");
    elem.className = "dano-flotante";
    elem.textContent = "-" + dano;
    elem.style.left = posX + "px";
    elem.style.top = posY - 5 + "px";
    contenedorLaberinto.appendChild(elem);

    setTimeout(function () {
        if (elem.parentNode) elem.parentNode.removeChild(elem);
    }, 800);
}

// --- Trasgo (enemigo con IA) ---

// Busca una celda a distancia media de la entrada para colocar al Trasgo
function posicionInicialTrasgo() {
    // BFS desde la entrada para calcular distancias
    var cola = [[entradaFila, entradaCol, 0]];
    var idx = 0;
    var distancias = {};
    distancias[entradaFila + "," + entradaCol] = 0;
    var dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    var maxDist = 0;

    while (idx < cola.length) {
        var actual = cola[idx++];
        var f = actual[0], c = actual[1], d = actual[2];
        if (d > maxDist) maxDist = d;

        for (var i = 0; i < dirs.length; i++) {
            var nf = f + dirs[i][0], nc = c + dirs[i][1];
            var key = nf + "," + nc;
            if (nf >= 0 && nf < FILAS && nc >= 0 && nc < COLS && mapa[nf][nc] === 0 && !(key in distancias)) {
                distancias[key] = d + 1;
                cola.push([nf, nc, d + 1]);
            }
        }
    }

    // Elegir celdas lógicas a 40-70% de la distancia máxima
    var distMin = Math.floor(maxDist * 0.4);
    var distMax = Math.floor(maxDist * 0.7);
    var candidatas = [];

    for (var key in distancias) {
        var dist = distancias[key];
        if (dist >= distMin && dist <= distMax) {
            var partes = key.split(",");
            var f = parseInt(partes[0]), c = parseInt(partes[1]);
            if (f % 2 === 1 && c % 2 === 1) {
                if (f === llaveFila && c === llaveCol) continue;
                candidatas.push([f, c]);
            }
        }
    }

    mezclar(candidatas);
    return candidatas.length > 0 ? candidatas[0] : [1, 1];
}

// Pathfinding BFS: calcula el camino más corto entre dos celdas
function calcularCamino(origenF, origenC, destinoF, destinoC) {
    var cola = [[origenF, origenC]];
    var idx = 0;
    var previo = {};
    previo[origenF + "," + origenC] = null;
    var dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    while (idx < cola.length) {
        var actual = cola[idx++];
        var f = actual[0], c = actual[1];

        if (f === destinoF && c === destinoC) {
            // Reconstruir camino
            var camino = [];
            var pos = [f, c];
            while (pos) {
                camino.unshift(pos);
                pos = previo[pos[0] + "," + pos[1]];
            }
            camino.shift(); // Quitar posición actual
            return camino;
        }

        for (var d = 0; d < dirs.length; d++) {
            var nf = f + dirs[d][0], nc = c + dirs[d][1];
            var key = nf + "," + nc;
            if (nf >= 0 && nf < FILAS && nc >= 0 && nc < COLS && mapa[nf][nc] === 0 && !(key in previo)) {
                previo[key] = [f, c];
                cola.push([nf, nc]);
            }
        }
    }

    return []; // Sin camino (no debería pasar en laberinto conectado)
}

// Inicializa el Trasgo en el laberinto
function iniciarTrasgo() {
    var pos = posicionInicialTrasgo();
    trasgo = {
        datos: ENEMIGOS.Trasgo,
        posX: pos[1] * TAM_CELDA + (TAM_CELDA - TAM_TRASGO) / 2,
        posY: pos[0] * TAM_CELDA + (TAM_CELDA - TAM_TRASGO) / 2,
        camino: [],
        ultimoGolpe: 0,
        ultimoPathfinding: 0,
        elemento: null,
    };
}

// Actualiza pathfinding, movimiento y colisión del Trasgo (cada frame)
function actualizarTrasgo() {
    if (!trasgo) return;

    // Recalcular ruta periódicamente
    var ahora = Date.now();
    if (ahora - trasgo.ultimoPathfinding >= INTERVALO_PATHFINDING) {
        trasgo.ultimoPathfinding = ahora;

        var celdaT = {
            fila: Math.floor((trasgo.posY + TAM_TRASGO / 2) / TAM_CELDA),
            col: Math.floor((trasgo.posX + TAM_TRASGO / 2) / TAM_CELDA),
        };
        var celdaJ = getCeldaJugador();
        trasgo.camino = calcularCamino(celdaT.fila, celdaT.col, celdaJ.fila, celdaJ.col);
    }

    // Mover hacia el siguiente punto del camino
    if (trasgo.camino.length > 0) {
        var objetivo = trasgo.camino[0];
        var targetX = objetivo[1] * TAM_CELDA + (TAM_CELDA - TAM_TRASGO) / 2;
        var targetY = objetivo[0] * TAM_CELDA + (TAM_CELDA - TAM_TRASGO) / 2;

        var dx = targetX - trasgo.posX;
        var dy = targetY - trasgo.posY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= VELOCIDAD_TRASGO) {
            trasgo.posX = targetX;
            trasgo.posY = targetY;
            trasgo.camino.shift();
        } else {
            trasgo.posX += (dx / dist) * VELOCIDAD_TRASGO;
            trasgo.posY += (dy / dist) * VELOCIDAD_TRASGO;
        }

        trasgo.elemento.style.left = trasgo.posX + "px";
        trasgo.elemento.style.top = trasgo.posY + "px";
    }

    // Detectar colisión con jugador
    detectarColisionTrasgo();
}

// Si el Trasgo toca al jugador, ataca con uno de sus ataques
function detectarColisionTrasgo() {
    var ahora = Date.now();
    if (ahora - trasgo.ultimoGolpe < COOLDOWN_TRASGO) return;

    // Colisión AABB entre Trasgo y jugador
    var solapan =
        trasgo.posX < posX + TAM_JUGADOR &&
        trasgo.posX + TAM_TRASGO > posX &&
        trasgo.posY < posY + TAM_JUGADOR &&
        trasgo.posY + TAM_TRASGO > posY;

    if (solapan) {
        var ataques = trasgo.datos.ataques;
        var ataque = ataques[Math.floor(Math.random() * ataques.length)];

        jugador.recibirDano(ataque.dano);
        trasgo.ultimoGolpe = ahora;

        document.dispatchEvent(new Event("vida-cambio"));
        mostrarDano(ataque.dano);

        elementoJugador.classList.add("jugador-golpeado");
        setTimeout(function () {
            elementoJugador.classList.remove("jugador-golpeado");
        }, 300);
    }
}

// --- Estado del módulo ---

let mapa = null;
let llaveFila = 0;
let llaveCol = 0;
let entradaFila = 0;
let entradaCol = 0;
let trampas = [];
let trasgo = null;

let jugador = null;
let callbackSalir = null;
let posX = 0;
let posY = 0;
let tieneLlave = false;
let animacionId = null;
let activo = false;
const teclas = {};

// Referencias a elementos del DOM (se crean dinámicamente)
let pantalla = null;
let contenedorLaberinto = null;
let elementoJugador = null;
let elementoLlave = null;
let indicador = null;
let mensajeExito = null;

// --- Crear pantalla HTML ---

function crearPantalla() {
    pantalla = document.createElement("div");
    pantalla.id = "pantalla-habitacion1";

    var titulo = document.createElement("h2");
    titulo.className = "titulo-habitacion";
    titulo.textContent = "Habitación 1 — El Laberinto";

    indicador = document.createElement("p");
    indicador.id = "laberinto-indicador";

    contenedorLaberinto = document.createElement("div");
    contenedorLaberinto.id = "laberinto";
    contenedorLaberinto.style.width = COLS * TAM_CELDA + "px";
    contenedorLaberinto.style.height = FILAS * TAM_CELDA + "px";

    // Jugador dentro del laberinto
    elementoJugador = document.createElement("div");
    elementoJugador.className = "jugador-laberinto";
    var img = document.createElement("img");
    img.src = jugador.img;
    img.alt = jugador.nombre;
    elementoJugador.appendChild(img);
    elementoJugador.classList.add(jugador.clase);

    mensajeExito = document.createElement("p");
    mensajeExito.id = "laberinto-mensaje";
    mensajeExito.classList.add("oculto");

    var hint = document.createElement("p");
    hint.className = "laberinto-hint";
    hint.textContent = "Usa las flechas ← ↑ ↓ → para moverte";

    var btnHuir = document.createElement("button");
    btnHuir.id = "btn-huir";
    btnHuir.textContent = "← Huir al pasillo";
    btnHuir.addEventListener("click", function () {
        limpiarHabitacion1();
        callbackSalir();
    });

    pantalla.appendChild(titulo);
    pantalla.appendChild(indicador);
    pantalla.appendChild(contenedorLaberinto);
    pantalla.appendChild(mensajeExito);
    pantalla.appendChild(hint);
    pantalla.appendChild(btnHuir);

    document.getElementById("juego").appendChild(pantalla);
}

// --- Funciones principales ---

export function iniciarHabitacion1(jugadorRef, callback) {
    jugador = jugadorRef;
    callbackSalir = callback;
    tieneLlave = false;
    activo = true;

    // Generar laberinto aleatorio
    mapa = generarMapa();

    // Entrada en la esquina inferior izquierda
    entradaFila = FILAS - 2;
    entradaCol = 1;

    // Colocar la llave en el punto más lejano de la entrada
    var puntoLlave = encontrarPuntoLejano(mapa, entradaFila, entradaCol);
    llaveFila = puntoLlave[0];
    llaveCol = puntoLlave[1];

    // Colocar trampas aleatorias
    colocarTrampas();

    // Colocar al Trasgo
    iniciarTrasgo();

    // Crear e insertar la pantalla
    crearPantalla();

    // Renderizar el laberinto
    renderizarLaberinto();

    // Posicionar jugador en la entrada
    posX = entradaCol * TAM_CELDA + (TAM_CELDA - TAM_JUGADOR) / 2;
    posY = entradaFila * TAM_CELDA + (TAM_CELDA - TAM_JUGADOR) / 2;
    actualizarPosicion();

    // Resetear indicador
    indicador.textContent = "🔑 Encuentra la llave";
    indicador.classList.remove("llave-obtenida");
    mensajeExito.classList.add("oculto");

    // Registrar controles
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // Iniciar game loop
    animacionId = requestAnimationFrame(loopLaberinto);
}

function renderizarLaberinto() {
    // Paredes
    for (var fila = 0; fila < mapa.length; fila++) {
        for (var col = 0; col < mapa[fila].length; col++) {
            if (mapa[fila][col] === 1) {
                var pared = document.createElement("div");
                pared.className = "laberinto-pared";
                pared.style.left = col * TAM_CELDA + "px";
                pared.style.top = fila * TAM_CELDA + "px";
                pared.style.width = TAM_CELDA + "px";
                pared.style.height = TAM_CELDA + "px";
                contenedorLaberinto.appendChild(pared);
            }
        }
    }

    // Trampas
    for (var i = 0; i < trampas.length; i++) {
        var t = trampas[i];
        var elemTrampa = document.createElement("div");
        elemTrampa.className = "laberinto-trampa";
        elemTrampa.style.left = t.col * TAM_CELDA + "px";
        elemTrampa.style.top = t.fila * TAM_CELDA + "px";
        elemTrampa.style.width = TAM_CELDA + "px";
        elemTrampa.style.height = TAM_CELDA + "px";
        contenedorLaberinto.appendChild(elemTrampa);
        t.elemento = elemTrampa;
    }

    // Trasgo
    if (trasgo) {
        var elemTrasgo = document.createElement("div");
        elemTrasgo.className = "trasgo-laberinto";
        elemTrasgo.style.width = TAM_TRASGO + "px";
        elemTrasgo.style.height = TAM_TRASGO + "px";
        elemTrasgo.style.left = trasgo.posX + "px";
        elemTrasgo.style.top = trasgo.posY + "px";
        var imgTrasgo = document.createElement("img");
        imgTrasgo.src = "assets/img/enemigos/trasgo.png";
        imgTrasgo.alt = "Trasgo";
        elemTrasgo.appendChild(imgTrasgo);
        contenedorLaberinto.appendChild(elemTrasgo);
        trasgo.elemento = elemTrasgo;
    }

    // Llave
    elementoLlave = document.createElement("div");
    elementoLlave.className = "laberinto-llave";
    elementoLlave.textContent = "🔑";
    elementoLlave.style.left = llaveCol * TAM_CELDA + "px";
    elementoLlave.style.top = llaveFila * TAM_CELDA + "px";
    elementoLlave.style.width = TAM_CELDA + "px";
    elementoLlave.style.height = TAM_CELDA + "px";
    contenedorLaberinto.appendChild(elementoLlave);

    // Salida
    var salida = document.createElement("div");
    salida.className = "laberinto-salida";
    salida.textContent = "🚪";
    salida.style.left = entradaCol * TAM_CELDA + "px";
    salida.style.top = entradaFila * TAM_CELDA + "px";
    salida.style.width = TAM_CELDA + "px";
    salida.style.height = TAM_CELDA + "px";
    contenedorLaberinto.appendChild(salida);

    // Jugador (siempre al final para que quede encima)
    contenedorLaberinto.appendChild(elementoJugador);
}

// --- Movimiento con colisiones y corner sliding ---

function esPared(pixelX, pixelY) {
    var col = Math.floor(pixelX / TAM_CELDA);
    var fila = Math.floor(pixelY / TAM_CELDA);

    if (fila < 0 || fila >= FILAS || col < 0 || col >= COLS) {
        return true;
    }
    return mapa[fila][col] === 1;
}

// Verifica colisión del jugador en una posición dada
function hayColision(x, y) {
    return esPared(x + MARGEN_COLISION, y + MARGEN_COLISION) ||
           esPared(x + TAM_JUGADOR - MARGEN_COLISION, y + MARGEN_COLISION) ||
           esPared(x + MARGEN_COLISION, y + TAM_JUGADOR - MARGEN_COLISION) ||
           esPared(x + TAM_JUGADOR - MARGEN_COLISION, y + TAM_JUGADOR - MARGEN_COLISION);
}

function moverEnLaberinto(dx, dy) {
    // Mover por eje X
    if (dx !== 0) {
        var nuevaX = posX + dx;
        if (!hayColision(nuevaX, posY)) {
            posX = nuevaX;
        } else {
            // Corner sliding: intentar deslizar en Y para doblar esquinas
            for (var i = 1; i <= TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(nuevaX, posY - i)) {
                    posY -= i;
                    posX = nuevaX;
                    break;
                }
                if (!hayColision(nuevaX, posY + i)) {
                    posY += i;
                    posX = nuevaX;
                    break;
                }
            }
        }
    }

    // Mover por eje Y
    if (dy !== 0) {
        var nuevaY = posY + dy;
        if (!hayColision(posX, nuevaY)) {
            posY = nuevaY;
        } else {
            // Corner sliding: intentar deslizar en X para doblar esquinas
            for (var i = 1; i <= TOLERANCIA_ESQUINA; i++) {
                if (!hayColision(posX - i, nuevaY)) {
                    posX -= i;
                    posY = nuevaY;
                    break;
                }
                if (!hayColision(posX + i, nuevaY)) {
                    posX += i;
                    posY = nuevaY;
                    break;
                }
            }
        }
    }

    actualizarPosicion();
}

function actualizarPosicion() {
    elementoJugador.style.left = posX + "px";
    elementoJugador.style.top = posY + "px";
}

// --- Detección de llave y salida ---

function getCeldaJugador() {
    var centroX = posX + TAM_JUGADOR / 2;
    var centroY = posY + TAM_JUGADOR / 2;
    return {
        fila: Math.floor(centroY / TAM_CELDA),
        col: Math.floor(centroX / TAM_CELDA),
    };
}

function detectarLlave() {
    if (tieneLlave) return;

    var celda = getCeldaJugador();
    if (celda.fila === llaveFila && celda.col === llaveCol) {
        tieneLlave = true;

        // Animación de absorción
        elementoLlave.classList.add("llave-recogida");

        // Actualizar indicador
        indicador.textContent = "🔑 ¡Llave obtenida! Vuelve a la salida";
        indicador.classList.add("llave-obtenida");

        // Guardar en inventario y notificar a la barra superior
        jugador.inventario.push("llave-habitacion-2");
        document.dispatchEvent(new Event("inventario-cambio"));
    }
}

function detectarSalida() {
    if (!tieneLlave) return;

    var celda = getCeldaJugador();
    if (celda.fila === entradaFila && celda.col === entradaCol) {
        activo = false;
        mensajeExito.textContent = "¡Escapaste con la llave!";
        mensajeExito.classList.remove("oculto");

        setTimeout(function () {
            limpiarHabitacion1();
            callbackSalir();
        }, 1500);
    }
}

// --- Game loop ---

function loopLaberinto() {
    if (!activo) return;

    var dx = 0;
    var dy = 0;

    if (teclas["ArrowUp"])    dy -= VELOCIDAD;
    if (teclas["ArrowDown"])  dy += VELOCIDAD;
    if (teclas["ArrowLeft"])  dx -= VELOCIDAD;
    if (teclas["ArrowRight"]) dx += VELOCIDAD;

    if (dx !== 0 || dy !== 0) {
        moverEnLaberinto(dx, dy);
    }

    actualizarTrampas();
    detectarTrampas();
    actualizarTrasgo();
    detectarLlave();
    detectarSalida();

    animacionId = requestAnimationFrame(loopLaberinto);
}

// --- Handlers de teclado ---

function onKeyDown(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        teclas[e.key] = true;
    }
}

function onKeyUp(e) {
    delete teclas[e.key];
}

// --- Limpieza ---

function limpiarHabitacion1() {
    activo = false;
    trampas = [];
    trasgo = null;

    if (animacionId) {
        cancelAnimationFrame(animacionId);
        animacionId = null;
    }

    // Remover handlers de teclado
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);

    // Limpiar teclas
    Object.keys(teclas).forEach(function (k) {
        delete teclas[k];
    });

    // Remover pantalla del DOM
    if (pantalla && pantalla.parentNode) {
        pantalla.parentNode.removeChild(pantalla);
        pantalla = null;
    }
}
