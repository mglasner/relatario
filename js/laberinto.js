// Módulo compartido de generación de laberintos
// Usado por El Laberinto (2D) y El Laberinto 3D

// Mezcla un array in-place (Fisher-Yates)
export function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

// Genera un laberinto usando Recursive Backtracking (DFS)
// Produce un laberinto "perfecto" (un solo camino entre dos puntos)
// luego abre algunos atajos para crear rutas alternativas
export function generarMapa(filas, cols, atajos) {
    // Inicializar todo como paredes
    const mapa = [];
    for (let f = 0; f < filas; f++) {
        mapa[f] = [];
        for (let c = 0; c < cols; c++) {
            mapa[f][c] = 1;
        }
    }

    // Las celdas lógicas están en posiciones impares del grid
    const filasLogicas = (filas - 1) / 2;
    const colsLogicas = (cols - 1) / 2;

    const visitado = [];
    for (let f = 0; f < filasLogicas; f++) {
        visitado[f] = [];
        for (let c = 0; c < colsLogicas; c++) {
            visitado[f][c] = false;
        }
    }

    // Direcciones: arriba, derecha, abajo, izquierda
    const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ];

    // DFS iterativo con stack (evita desbordamiento de pila)
    const stack = [[0, 0]];
    visitado[0][0] = true;
    mapa[1][1] = 0; // Abrir la primera celda lógica (arriba-izquierda)

    while (stack.length > 0) {
        const actual = stack[stack.length - 1];
        const f = actual[0],
            c = actual[1];

        // Buscar vecinos no visitados
        const vecinos = [];
        for (let d = 0; d < dirs.length; d++) {
            const nf = f + dirs[d][0];
            const nc = c + dirs[d][1];
            if (nf >= 0 && nf < filasLogicas && nc >= 0 && nc < colsLogicas && !visitado[nf][nc]) {
                vecinos.push([nf, nc, d]);
            }
        }

        if (vecinos.length > 0) {
            // Elegir vecino aleatorio
            const elegido = vecinos[Math.floor(Math.random() * vecinos.length)];
            const nf = elegido[0],
                nc = elegido[1];

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
    abrirAtajos(mapa, filas, cols, atajos);

    return mapa;
}

// Elimina algunas paredes internas para crear rutas alternativas
function abrirAtajos(mapa, filas, cols, cantidad) {
    const paredes = [];

    for (let f = 1; f < filas - 1; f++) {
        for (let c = 1; c < cols - 1; c++) {
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
    const num = Math.min(cantidad, paredes.length);
    for (let i = 0; i < num; i++) {
        mapa[paredes[i][0]][paredes[i][1]] = 0;
    }
}

// Encuentra todos los dead-ends (callejones sin salida) del mapa
// Un dead-end es una celda lógica (impar,impar) con exactamente 1 pared intermedia abierta
export function encontrarDeadEnds(mapa, filas, cols) {
    const resultado = [];
    const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ];
    for (let f = 1; f < filas - 1; f += 2) {
        for (let c = 1; c < cols - 1; c += 2) {
            if (mapa[f][c] !== 0) continue;
            let salidas = 0;
            for (const [df, dc] of dirs) {
                if (mapa[f + df][c + dc] === 0) salidas++;
            }
            if (salidas === 1) resultado.push([f, c]);
        }
    }
    return resultado;
}

// Busca la celda más lejana desde un punto usando BFS
// Solo considera celdas lógicas (posiciones impares) como candidatas
export function encontrarPuntoLejano(mapa, filas, cols, inicioF, inicioC) {
    const cola = [[inicioF, inicioC, 0]];
    let idx = 0;
    const visitadoBFS = [];
    for (let f = 0; f < filas; f++) {
        visitadoBFS[f] = [];
        for (let c = 0; c < cols; c++) {
            visitadoBFS[f][c] = false;
        }
    }
    visitadoBFS[inicioF][inicioC] = true;

    let masLejano = [inicioF, inicioC];
    let maxDist = 0;
    const dirs = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
    ];

    while (idx < cola.length) {
        const actual = cola[idx++];
        const f = actual[0],
            c = actual[1],
            dist = actual[2];

        // Solo considerar celdas lógicas (intersecciones) para la llave
        if (dist > maxDist && f % 2 === 1 && c % 2 === 1) {
            maxDist = dist;
            masLejano = [f, c];
        }

        for (let d = 0; d < dirs.length; d++) {
            const nf = f + dirs[d][0];
            const nc = c + dirs[d][1];
            if (
                nf >= 0 &&
                nf < filas &&
                nc >= 0 &&
                nc < cols &&
                !visitadoBFS[nf][nc] &&
                mapa[nf][nc] === 0
            ) {
                visitadoBFS[nf][nc] = true;
                cola.push([nf, nc, dist + 1]);
            }
        }
    }

    return masLejano;
}
