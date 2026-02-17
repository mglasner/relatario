// Habitación 2 — El Laberinto 3D
// Vista pseudo-3D con raycasting estilo Doom
// El jugador debe encontrar la llave y volver a la salida

// --- Constantes ---

const ANCHO_CANVAS = 640;
const ALTO_CANVAS = 400;
const ANCHO_MINIMAPA = 150;
const ALTO_MINIMAPA = 150;
const FOV = Math.PI / 3; // 60 grados
const NUM_RAYOS = 320;
const ANCHO_FRANJA = ANCHO_CANVAS / NUM_RAYOS; // 2px por franja

// Dimensiones del laberinto (impares para el algoritmo de generación)
const FILAS = 13;
const COLS = 13;
const ATAJOS = 6;

// Movimiento del jugador
const VELOCIDAD_MOV = 0.06;
const VELOCIDAD_GIRO = 0.04;
const RADIO_COLISION = 0.2;

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
function generarMapa() {
    var mapa = [];
    for (var f = 0; f < FILAS; f++) {
        mapa[f] = [];
        for (var c = 0; c < COLS; c++) {
            mapa[f][c] = 1;
        }
    }

    var filasLogicas = (FILAS - 1) / 2;
    var colsLogicas = (COLS - 1) / 2;

    var visitado = [];
    for (var f = 0; f < filasLogicas; f++) {
        visitado[f] = [];
        for (var c = 0; c < colsLogicas; c++) {
            visitado[f][c] = false;
        }
    }

    var dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    var stack = [[0, 0]];
    visitado[0][0] = true;
    mapa[1][1] = 0;

    while (stack.length > 0) {
        var actual = stack[stack.length - 1];
        var f = actual[0], c = actual[1];

        var vecinos = [];
        for (var d = 0; d < dirs.length; d++) {
            var nf = f + dirs[d][0];
            var nc = c + dirs[d][1];
            if (nf >= 0 && nf < filasLogicas && nc >= 0 && nc < colsLogicas && !visitado[nf][nc]) {
                vecinos.push([nf, nc, d]);
            }
        }

        if (vecinos.length > 0) {
            var elegido = vecinos[Math.floor(Math.random() * vecinos.length)];
            var nf = elegido[0], nc = elegido[1];
            mapa[f * 2 + 1 + dirs[elegido[2]][0]][c * 2 + 1 + dirs[elegido[2]][1]] = 0;
            mapa[nf * 2 + 1][nc * 2 + 1] = 0;
            visitado[nf][nc] = true;
            stack.push([nf, nc]);
        } else {
            stack.pop();
        }
    }

    abrirAtajos(mapa);
    return mapa;
}

// Elimina algunas paredes para crear rutas alternativas
function abrirAtajos(mapa) {
    var paredes = [];

    for (var f = 1; f < FILAS - 1; f++) {
        for (var c = 1; c < COLS - 1; c++) {
            if (mapa[f][c] !== 1) continue;
            if (f % 2 === 1 && c % 2 === 0 && mapa[f][c - 1] === 0 && mapa[f][c + 1] === 0) {
                paredes.push([f, c]);
            }
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

// --- Estado del módulo ---

let mapa = null;
let llaveFila = 0;
let llaveCol = 0;
let entradaFila = 0;
let entradaCol = 0;

let jugador = null;
let callbackSalir = null;
let jugadorX = 0;
let jugadorY = 0;
let angulo = 0;
let tieneLlave = false;
let animacionId = null;
let activo = false;
const teclas = {};

// Referencias DOM
let pantalla = null;
let canvas3D = null;
let ctx3D = null;
let canvasMini = null;
let ctxMini = null;
let minimapBase = null;
let gradCielo = null;
let gradSuelo = null;
let avatarImg = null;
let indicador = null;
let mensajeExito = null;

// --- Crear pantalla HTML ---

function crearPantalla() {
    pantalla = document.createElement("div");
    pantalla.id = "pantalla-habitacion2";

    var titulo = document.createElement("h2");
    titulo.className = "titulo-habitacion";
    titulo.textContent = "Habitación 2 — El Laberinto 3D";

    indicador = document.createElement("p");
    indicador.id = "laberinto3d-indicador";

    // Contenedor para canvas 3D + minimapa
    var contenedor = document.createElement("div");
    contenedor.id = "contenedor-3d";

    canvas3D = document.createElement("canvas");
    canvas3D.id = "canvas-3d";
    canvas3D.width = ANCHO_CANVAS;
    canvas3D.height = ALTO_CANVAS;
    ctx3D = canvas3D.getContext("2d");

    canvasMini = document.createElement("canvas");
    canvasMini.id = "canvas-minimapa";
    canvasMini.width = ANCHO_MINIMAPA;
    canvasMini.height = ALTO_MINIMAPA;
    ctxMini = canvasMini.getContext("2d");

    contenedor.appendChild(canvas3D);
    contenedor.appendChild(canvasMini);

    // Pre-crear gradientes (no cambian entre frames)
    gradCielo = ctx3D.createLinearGradient(0, 0, 0, ALTO_CANVAS / 2);
    gradCielo.addColorStop(0, "#050510");
    gradCielo.addColorStop(1, "#0f0a1a");

    gradSuelo = ctx3D.createLinearGradient(0, ALTO_CANVAS / 2, 0, ALTO_CANVAS);
    gradSuelo.addColorStop(0, "#150d24");
    gradSuelo.addColorStop(1, "#0a0510");

    mensajeExito = document.createElement("p");
    mensajeExito.id = "laberinto3d-mensaje";
    mensajeExito.classList.add("oculto");

    var hint = document.createElement("p");
    hint.className = "laberinto-hint";
    hint.textContent = "↑↓ avanzar/retroceder — ←→ girar";

    var btnHuir = document.createElement("button");
    btnHuir.id = "btn-huir-3d";
    btnHuir.textContent = "← Huir al pasillo";
    btnHuir.addEventListener("click", function () {
        limpiarHabitacion2();
        callbackSalir();
    });

    pantalla.appendChild(titulo);
    pantalla.appendChild(indicador);
    pantalla.appendChild(contenedor);
    pantalla.appendChild(mensajeExito);
    pantalla.appendChild(hint);
    pantalla.appendChild(btnHuir);

    document.getElementById("juego").appendChild(pantalla);
}

// --- Raycasting (algoritmo DDA) ---

function renderizar3D() {
    // Cielo
    ctx3D.fillStyle = gradCielo;
    ctx3D.fillRect(0, 0, ANCHO_CANVAS, ALTO_CANVAS / 2);

    // Suelo
    ctx3D.fillStyle = gradSuelo;
    ctx3D.fillRect(0, ALTO_CANVAS / 2, ANCHO_CANVAS, ALTO_CANVAS / 2);

    // Z-buffer para sprites
    var zBuffer = new Array(NUM_RAYOS);

    // Lanzar un rayo por cada columna
    for (var i = 0; i < NUM_RAYOS; i++) {
        var anguloRayo = angulo - FOV / 2 + (i / NUM_RAYOS) * FOV;

        var rayDirX = Math.cos(anguloRayo);
        var rayDirY = Math.sin(anguloRayo);

        // Celda actual del mapa
        var mapX = Math.floor(jugadorX);
        var mapY = Math.floor(jugadorY);

        // Distancia entre líneas de grid consecutivas a lo largo del rayo
        var deltaDistX = Math.abs(1 / rayDirX);
        var deltaDistY = Math.abs(1 / rayDirY);

        // Dirección de paso y distancia al primer borde
        var stepX, stepY, sideDistX, sideDistY;

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (jugadorX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1 - jugadorX) * deltaDistX;
        }

        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (jugadorY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1 - jugadorY) * deltaDistY;
        }

        // DDA: avanzar celda a celda hasta golpear una pared
        var hit = false;
        var lado = 0; // 0 = pared vertical (E/O), 1 = pared horizontal (N/S)
        var iter = 0;

        while (!hit && iter < 50) {
            iter++;
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                lado = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                lado = 1;
            }

            if (mapY >= 0 && mapY < FILAS && mapX >= 0 && mapX < COLS) {
                if (mapa[mapY][mapX] === 1) hit = true;
            } else {
                hit = true;
            }
        }

        // Distancia euclídea a lo largo del rayo
        var distRayo;
        if (lado === 0) {
            distRayo = sideDistX - deltaDistX;
        } else {
            distRayo = sideDistY - deltaDistY;
        }

        // Corrección de ojo de pez (proyección perpendicular al plano de cámara)
        var distPerp = distRayo * Math.cos(anguloRayo - angulo);
        if (distPerp < 0.01) distPerp = 0.01;

        zBuffer[i] = distPerp;

        // Altura de la franja de pared en pantalla
        var alturaPared = ALTO_CANVAS / distPerp;
        var inicioY = Math.floor((ALTO_CANVAS - alturaPared) / 2);
        var finY = Math.floor((ALTO_CANVAS + alturaPared) / 2);

        // Color con efecto de profundidad (más lejos = más oscuro)
        var brillo = Math.min(1, 1.5 / distPerp);
        var r, g, b;
        if (lado === 1) {
            // Paredes N/S más oscuras
            r = Math.floor(42 * brillo);
            g = Math.floor(26 * brillo);
            b = Math.floor(62 * brillo);
        } else {
            // Paredes E/O más claras
            r = Math.floor(61 * brillo);
            g = Math.floor(37 * brillo);
            b = Math.floor(85 * brillo);
        }

        ctx3D.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
        ctx3D.fillRect(i * ANCHO_FRANJA, inicioY, ANCHO_FRANJA, finY - inicioY);
    }

    return zBuffer;
}

// --- Sprites 3D (llave y salida visibles en el mundo 3D) ---

function renderizarSprites(zBuffer) {
    var sprites = [];

    if (!tieneLlave) {
        sprites.push({ x: llaveCol + 0.5, y: llaveFila + 0.5, emoji: "\uD83D\uDD11", color: "#ffd700" });
    }

    sprites.push({
        x: entradaCol + 0.5, y: entradaFila + 0.5,
        emoji: "\uD83D\uDEAA",
        color: tieneLlave ? "#44ff44" : "#444444",
    });

    // Ordenar por distancia (más lejanos primero para overlap correcto)
    sprites.sort(function (a, b) {
        var da = (a.x - jugadorX) * (a.x - jugadorX) + (a.y - jugadorY) * (a.y - jugadorY);
        var db = (b.x - jugadorX) * (b.x - jugadorX) + (b.y - jugadorY) * (b.y - jugadorY);
        return db - da;
    });

    for (var i = 0; i < sprites.length; i++) {
        dibujarSprite(sprites[i], zBuffer);
    }
}

function dibujarSprite(sprite, zBuffer) {
    var dx = sprite.x - jugadorX;
    var dy = sprite.y - jugadorY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.3) return;

    // Ángulo del sprite relativo al jugador
    var anguloSprite = Math.atan2(dy, dx);
    var anguloRel = anguloSprite - angulo;

    // Normalizar a [-PI, PI]
    while (anguloRel > Math.PI) anguloRel -= 2 * Math.PI;
    while (anguloRel < -Math.PI) anguloRel += 2 * Math.PI;

    // Fuera del campo de visión
    if (Math.abs(anguloRel) > FOV / 2 + 0.15) return;

    // Posición horizontal en pantalla
    var screenX = (0.5 + anguloRel / FOV) * ANCHO_CANVAS;

    // Distancia perpendicular para tamaño correcto
    var distPerp = dist * Math.cos(anguloRel);
    if (distPerp < 0.1) return;

    // Verificar z-buffer: si hay pared delante, no dibujar
    var colCentral = Math.floor(screenX / ANCHO_FRANJA);
    if (colCentral >= 0 && colCentral < NUM_RAYOS && distPerp >= zBuffer[colCentral]) return;

    // Tamaño del emoji según distancia
    var fontSize = Math.min(Math.max(ALTO_CANVAS / distPerp * 0.4, 10), 60);

    ctx3D.save();
    ctx3D.font = Math.floor(fontSize) + "px serif";
    ctx3D.textAlign = "center";
    ctx3D.textBaseline = "middle";
    ctx3D.shadowColor = sprite.color;
    ctx3D.shadowBlur = 15;
    ctx3D.fillText(sprite.emoji, screenX, ALTO_CANVAS / 2);
    ctx3D.shadowBlur = 0;
    ctx3D.restore();
}

// --- Minimapa ---

// Pre-renderiza las paredes en un canvas offscreen (no cambian)
function crearMinimapBase() {
    minimapBase = document.createElement("canvas");
    minimapBase.width = ANCHO_MINIMAPA;
    minimapBase.height = ALTO_MINIMAPA;
    var ctx = minimapBase.getContext("2d");

    var tamCelda = ANCHO_MINIMAPA / COLS;

    // Fondo
    ctx.fillStyle = "#0d0d1a";
    ctx.fillRect(0, 0, ANCHO_MINIMAPA, ALTO_MINIMAPA);

    // Paredes
    ctx.fillStyle = "#2a1a3e";
    for (var f = 0; f < FILAS; f++) {
        for (var c = 0; c < COLS; c++) {
            if (mapa[f][c] === 1) {
                ctx.fillRect(
                    c * tamCelda, f * tamCelda,
                    tamCelda + 0.5, tamCelda + 0.5
                );
            }
        }
    }
}

// Dibuja el minimapa cada frame: base + elementos dinámicos
function renderizarMinimapa() {
    ctxMini.drawImage(minimapBase, 0, 0);

    var tamCelda = ANCHO_MINIMAPA / COLS;

    // Salida (verde si tiene llave, gris si no)
    ctxMini.fillStyle = tieneLlave ? "#44ff44" : "#336633";
    ctxMini.beginPath();
    ctxMini.arc(
        (entradaCol + 0.5) * tamCelda,
        (entradaFila + 0.5) * tamCelda,
        4, 0, Math.PI * 2
    );
    ctxMini.fill();

    // Llave (dorada con brillo, solo si no la tiene)
    if (!tieneLlave) {
        ctxMini.save();
        ctxMini.shadowColor = "#ffd700";
        ctxMini.shadowBlur = 6;
        ctxMini.fillStyle = "#ffd700";
        ctxMini.beginPath();
        ctxMini.arc(
            (llaveCol + 0.5) * tamCelda,
            (llaveFila + 0.5) * tamCelda,
            4, 0, Math.PI * 2
        );
        ctxMini.fill();
        ctxMini.restore();
    }

    // Jugador (avatar circular con glow)
    var px = jugadorX * tamCelda;
    var py = jugadorY * tamCelda;
    var radioAvatar = 8;

    // Resplandor detrás del avatar
    ctxMini.save();
    ctxMini.shadowColor = "#ffcc00";
    ctxMini.shadowBlur = 10;
    ctxMini.fillStyle = "rgba(255, 204, 0, 0.4)";
    ctxMini.beginPath();
    ctxMini.arc(px, py, radioAvatar + 2, 0, Math.PI * 2);
    ctxMini.fill();
    ctxMini.restore();

    // Imagen del avatar recortada en círculo
    ctxMini.save();
    ctxMini.beginPath();
    ctxMini.arc(px, py, radioAvatar, 0, Math.PI * 2);
    ctxMini.closePath();
    ctxMini.clip();
    ctxMini.drawImage(avatarImg, px - radioAvatar, py - radioAvatar, radioAvatar * 2, radioAvatar * 2);
    ctxMini.restore();

    // Borde del avatar (más grueso y brillante)
    ctxMini.strokeStyle = "#ffcc00";
    ctxMini.lineWidth = 2.5;
    ctxMini.beginPath();
    ctxMini.arc(px, py, radioAvatar, 0, Math.PI * 2);
    ctxMini.stroke();

    // Línea de dirección (más larga y gruesa)
    var linLen = 12;
    ctxMini.strokeStyle = "#ffcc00";
    ctxMini.lineWidth = 2;
    ctxMini.beginPath();
    ctxMini.moveTo(
        px + Math.cos(angulo) * radioAvatar,
        py + Math.sin(angulo) * radioAvatar
    );
    ctxMini.lineTo(
        px + Math.cos(angulo) * (radioAvatar + linLen),
        py + Math.sin(angulo) * (radioAvatar + linLen)
    );
    ctxMini.stroke();

    // Campo de visión (FOV) como dos líneas tenues
    var fovLen = 18;
    ctxMini.strokeStyle = "rgba(255, 204, 0, 0.3)";
    ctxMini.lineWidth = 1;
    ctxMini.beginPath();
    ctxMini.moveTo(
        px + Math.cos(angulo - FOV / 2) * radioAvatar,
        py + Math.sin(angulo - FOV / 2) * radioAvatar
    );
    ctxMini.lineTo(
        px + Math.cos(angulo - FOV / 2) * fovLen,
        py + Math.sin(angulo - FOV / 2) * fovLen
    );
    ctxMini.moveTo(
        px + Math.cos(angulo + FOV / 2) * radioAvatar,
        py + Math.sin(angulo + FOV / 2) * radioAvatar
    );
    ctxMini.lineTo(
        px + Math.cos(angulo + FOV / 2) * fovLen,
        py + Math.sin(angulo + FOV / 2) * fovLen
    );
    ctxMini.stroke();
}

// --- Movimiento y colisiones ---

function esPared(x, y) {
    var col = Math.floor(x);
    var fila = Math.floor(y);
    if (fila < 0 || fila >= FILAS || col < 0 || col >= COLS) return true;
    return mapa[fila][col] === 1;
}

// Verifica colisión usando las 4 esquinas del radio de colisión
function hayColision(x, y) {
    return esPared(x - RADIO_COLISION, y - RADIO_COLISION) ||
           esPared(x + RADIO_COLISION, y - RADIO_COLISION) ||
           esPared(x - RADIO_COLISION, y + RADIO_COLISION) ||
           esPared(x + RADIO_COLISION, y + RADIO_COLISION);
}

function moverJugador() {
    // Rotación
    if (teclas["ArrowLeft"]) angulo -= VELOCIDAD_GIRO;
    if (teclas["ArrowRight"]) angulo += VELOCIDAD_GIRO;

    // Avanzar / retroceder
    var dx = 0, dy = 0;

    if (teclas["ArrowUp"]) {
        dx += Math.cos(angulo) * VELOCIDAD_MOV;
        dy += Math.sin(angulo) * VELOCIDAD_MOV;
    }
    if (teclas["ArrowDown"]) {
        dx -= Math.cos(angulo) * VELOCIDAD_MOV;
        dy -= Math.sin(angulo) * VELOCIDAD_MOV;
    }

    // Colisión por eje separado (permite deslizarse contra paredes)
    if (dx !== 0) {
        var nuevaX = jugadorX + dx;
        if (!hayColision(nuevaX, jugadorY)) {
            jugadorX = nuevaX;
        }
    }

    if (dy !== 0) {
        var nuevaY = jugadorY + dy;
        if (!hayColision(jugadorX, nuevaY)) {
            jugadorY = nuevaY;
        }
    }
}

// --- Detección de llave y salida ---

function detectarLlave() {
    if (tieneLlave) return;

    var celdaX = Math.floor(jugadorX);
    var celdaY = Math.floor(jugadorY);

    if (celdaY === llaveFila && celdaX === llaveCol) {
        tieneLlave = true;

        indicador.textContent = "\uD83D\uDD11 \u00A1Llave obtenida! Vuelve a la salida";
        indicador.classList.add("llave-obtenida");

        // Guardar en inventario y notificar a la barra superior
        jugador.inventario.push("llave-habitacion-3");
        document.dispatchEvent(new Event("inventario-cambio"));
    }
}

function detectarSalida() {
    if (!tieneLlave) return;

    var celdaX = Math.floor(jugadorX);
    var celdaY = Math.floor(jugadorY);

    if (celdaY === entradaFila && celdaX === entradaCol) {
        activo = false;
        mensajeExito.textContent = "\u00A1Escapaste con la llave!";
        mensajeExito.classList.remove("oculto");

        setTimeout(function () {
            limpiarHabitacion2();
            callbackSalir();
        }, 1500);
    }
}

// --- Game loop ---

function loop() {
    if (!activo) return;

    moverJugador();
    detectarLlave();
    detectarSalida();

    var zBuffer = renderizar3D();
    renderizarSprites(zBuffer);
    renderizarMinimapa();

    animacionId = requestAnimationFrame(loop);
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

// --- API pública ---

export function iniciarHabitacion2(jugadorRef, callback) {
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

    // Posición inicial del jugador (centro de la celda de entrada, mirando arriba)
    jugadorX = entradaCol + 0.5;
    jugadorY = entradaFila + 0.5;
    angulo = -Math.PI / 2;

    // Cargar imagen del avatar para el minimapa
    avatarImg = new Image();
    avatarImg.src = jugador.img;

    // Crear e insertar la pantalla
    crearPantalla();

    // Pre-renderizar minimapa base
    crearMinimapBase();

    // Resetear indicador
    indicador.textContent = "\uD83D\uDD11 Encuentra la llave";
    indicador.classList.remove("llave-obtenida");
    mensajeExito.classList.add("oculto");

    // Registrar controles
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // Iniciar game loop
    animacionId = requestAnimationFrame(loop);
}

export function limpiarHabitacion2() {
    activo = false;

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

    canvas3D = null;
    ctx3D = null;
    canvasMini = null;
    ctxMini = null;
    minimapBase = null;
    gradCielo = null;
    gradSuelo = null;
    avatarImg = null;
}
