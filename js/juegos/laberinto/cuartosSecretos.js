// Cuartos secretos del Laberinto
// Dead-ends sellados tras paredes falsas con recompensas ocultas

import { mezclar, encontrarDeadEnds } from '../../laberinto.js';
import { CONFIG, CFG, est, getCeldaJugador } from './estado.js';
import { lanzarToast } from '../../componentes/toast.js';
import { notificarVidaCambio } from '../../eventos.js';

const cfg = CFG.cuartosSecretos;
const CIRCUNFERENCIA_PROGRESO = 2 * Math.PI * 15;

// Direcciones: arriba, derecha, abajo, izquierda
const DIRS = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
];

// --- Colocar cuartos secretos ---

export function colocarCuartosSecretos() {
    const deadEnds = encontrarDeadEnds(est.mapa, CONFIG.FILAS, CONFIG.COLS);

    // Filtrar candidatos por distancia mínima a entrada y llave
    const candidatos = deadEnds.filter(function ([f, c]) {
        if (f === est.entradaFila && c === est.entradaCol) return false;
        if (f === est.llaveFila && c === est.llaveCol) return false;

        const distEntrada = Math.abs(f - est.entradaFila) + Math.abs(c - est.entradaCol);
        const distLlave = Math.abs(f - est.llaveFila) + Math.abs(c - est.llaveCol);

        return distEntrada >= cfg.distanciaMinEntrada && distLlave >= cfg.distanciaMinLlave;
    });

    mezclar(candidatos);

    const rango = cfg.cantidadMax - cfg.cantidadMin + 1;
    const cantidad = Math.min(
        cfg.cantidadMin + Math.floor(Math.random() * rango),
        candidatos.length
    );

    est.cuartosSecretos = [];

    for (let i = 0; i < cantidad; i++) {
        const [f, c] = candidatos[i];

        // Encontrar la única pared abierta (la salida del dead-end)
        let paredFila = -1;
        let paredCol = -1;
        for (const [df, dc] of DIRS) {
            if (est.mapa[f + df][c + dc] === 0) {
                paredFila = f + df;
                paredCol = c + dc;
                break;
            }
        }

        // Sin pared abierta encontrada (caso borde teórico)
        if (paredFila === -1) continue;

        // Sellar: convertir la pared intermedia abierta en pared falsa (valor 2)
        est.mapa[paredFila][paredCol] = 2;

        // Decidir recompensa
        const tipoRecompensa = Math.random() < cfg.probabilidadFuente ? 'fuente' : 'tesoro';

        est.cuartosSecretos.push({
            fila: f,
            col: c,
            paredFila,
            paredCol,
            abierto: false,
            recompensaRecogida: false,
            progresoEmpuje: 0,
            tipoRecompensa,
            pistaLanzada: false,
            elementoPared: null,
            elementoRecompensa: null,
            elementoProgreso: null,
        });
    }
}

// --- Renderizar cuartos secretos ---

export function renderizarCuartosSecretos() {
    for (let i = 0; i < est.cuartosSecretos.length; i++) {
        const cs = est.cuartosSecretos[i];

        // Overlay de grieta sobre la pared (la pared base viene del canvas)
        const pared = document.createElement('div');
        pared.className = 'laberinto-pared-falsa';
        pared.style.left = cs.paredCol * CONFIG.TAM_CELDA + 'px';
        pared.style.top = cs.paredFila * CONFIG.TAM_CELDA + 'px';
        pared.style.width = CONFIG.TAM_CELDA + 'px';
        pared.style.height = CONFIG.TAM_CELDA + 'px';
        est.contenedorLaberinto.appendChild(pared);
        cs.elementoPared = pared;

        // Recompensa oculta dentro del dead-end
        const recompensa = document.createElement('div');
        const claseRecompensa = cs.tipoRecompensa === 'fuente' ? 'cuarto-fuente' : 'cuarto-tesoro';
        recompensa.className = 'cuarto-recompensa oculto ' + claseRecompensa;
        recompensa.textContent = cs.tipoRecompensa === 'fuente' ? '\u26F2' : '\uD83C\uDF81';
        recompensa.style.left = cs.col * CONFIG.TAM_CELDA + 'px';
        recompensa.style.top = cs.fila * CONFIG.TAM_CELDA + 'px';
        recompensa.style.width = CONFIG.TAM_CELDA + 'px';
        recompensa.style.height = CONFIG.TAM_CELDA + 'px';
        est.contenedorLaberinto.appendChild(recompensa);
        cs.elementoRecompensa = recompensa;
    }
}

// --- Detectar proximidad (pista de brisa) ---

export function detectarProximidad() {
    if (!est.activo) return;

    const celda = getCeldaJugador();

    for (let i = 0; i < est.cuartosSecretos.length; i++) {
        const cs = est.cuartosSecretos[i];
        if (cs.abierto || cs.pistaLanzada) continue;

        // Distancia Manhattan en celdas lógicas (dividir por 2 porque celdas lógicas están cada 2 celdas)
        const distF = Math.abs(celda.fila - cs.paredFila);
        const distC = Math.abs(celda.col - cs.paredCol);
        const distancia = Math.floor((distF + distC) / 2);

        if (distancia <= cfg.radioProximidad) {
            cs.pistaLanzada = true;
            lanzarToast(cfg.toastPista, '\uD83C\uDF2C\uFE0F', 'estado');
        }
    }
}

// --- Detectar empuje contra pared falsa ---

export function detectarEmpuje(dx, dy) {
    if (!est.activo) return;

    const celda = getCeldaJugador();

    for (let i = 0; i < est.cuartosSecretos.length; i++) {
        const cs = est.cuartosSecretos[i];
        if (cs.abierto) continue;

        // Verificar si el jugador está adyacente a la pared falsa Y empujando hacia ella
        const estaAdyacente = esAdyacenteEmpujando(celda, cs, dx, dy);

        if (estaAdyacente) {
            cs.progresoEmpuje += 16.67; // ~1 frame a 60fps
            mostrarProgreso(cs);

            if (cs.progresoEmpuje >= cfg.tiempoEmpujar) {
                abrirCuartoSecreto(cs);
            }
        } else {
            if (cs.progresoEmpuje > 0) {
                cs.progresoEmpuje = 0;
                ocultarProgreso(cs);
            }
        }
    }
}

// Verifica si el jugador está junto a la pared falsa y caminando hacia ella
function esAdyacenteEmpujando(celda, cs, dx, dy) {
    const pf = cs.paredFila;
    const pc = cs.paredCol;

    // El jugador debe estar en la celda contigua a la pared falsa (no en la pared misma)
    // y moviéndose en la dirección correcta
    if (celda.fila === pf - 1 && celda.col === pc && dy > 0) return true; // arriba, empujando abajo
    if (celda.fila === pf + 1 && celda.col === pc && dy < 0) return true; // abajo, empujando arriba
    if (celda.fila === pf && celda.col === pc - 1 && dx > 0) return true; // izquierda, empujando derecha
    if (celda.fila === pf && celda.col === pc + 1 && dx < 0) return true; // derecha, empujando izquierda

    return false;
}

// --- Anillo SVG de progreso ---

function mostrarProgreso(cs) {
    if (!cs.elementoProgreso) {
        const contenedor = document.createElement('div');
        contenedor.className = 'cuarto-progreso';

        // Posicionar sobre el jugador (tamaño fijo 36px)
        contenedor.style.left = est.posX + CONFIG.TAM_JUGADOR / 2 - 18 + 'px';
        contenedor.style.top = est.posY + CONFIG.TAM_JUGADOR / 2 - 18 + 'px';

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '36');
        svg.setAttribute('height', '36');
        svg.setAttribute('viewBox', '0 0 36 36');
        svg.classList.add('cuarto-progreso-svg');

        const pista = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pista.setAttribute('cx', '18');
        pista.setAttribute('cy', '18');
        pista.setAttribute('r', '15');
        pista.classList.add('cuarto-pista');

        const circulo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circulo.setAttribute('cx', '18');
        circulo.setAttribute('cy', '18');
        circulo.setAttribute('r', '15');
        circulo.classList.add('cuarto-progreso-circulo');

        circulo.style.strokeDasharray = CIRCUNFERENCIA_PROGRESO;
        circulo.style.strokeDashoffset = CIRCUNFERENCIA_PROGRESO;

        svg.appendChild(pista);
        svg.appendChild(circulo);
        contenedor.appendChild(svg);
        est.contenedorLaberinto.appendChild(contenedor);
        cs.elementoProgreso = contenedor;
        cs.elementoCirculo = circulo;
    }

    // Actualizar posición (sigue al jugador)
    cs.elementoProgreso.style.left = est.posX + CONFIG.TAM_JUGADOR / 2 - 18 + 'px';
    cs.elementoProgreso.style.top = est.posY + CONFIG.TAM_JUGADOR / 2 - 18 + 'px';

    // Actualizar progreso visual
    const porcentaje = cs.progresoEmpuje / cfg.tiempoEmpujar;
    cs.elementoCirculo.style.strokeDashoffset = CIRCUNFERENCIA_PROGRESO * (1 - porcentaje);
}

function ocultarProgreso(cs) {
    if (cs.elementoProgreso) {
        cs.elementoProgreso.remove();
        cs.elementoProgreso = null;
        cs.elementoCirculo = null;
    }
}

// --- Abrir cuarto secreto ---

function abrirCuartoSecreto(cs) {
    cs.abierto = true;
    cs.progresoEmpuje = 0;
    ocultarProgreso(cs);

    // Abrir en el mapa (valor 2 → 0)
    est.mapa[cs.paredFila][cs.paredCol] = 0;

    // Limpiar la pared del canvas (el ctx ya tiene scale(dpr), usar coordenadas lógicas)
    if (est.ctxMapa) {
        est.ctxMapa.clearRect(
            cs.paredCol * CONFIG.TAM_CELDA,
            cs.paredFila * CONFIG.TAM_CELDA,
            CONFIG.TAM_CELDA,
            CONFIG.TAM_CELDA
        );
    }

    // Animación de la pared
    cs.elementoPared.classList.add('pared-abriendo');
    setTimeout(function () {
        if (cs.elementoPared && cs.elementoPared.parentNode) {
            cs.elementoPared.remove();
        }
    }, 600);

    // Revelar recompensa
    cs.elementoRecompensa.classList.remove('oculto');
    cs.elementoRecompensa.classList.add('recompensa-aparecer');

    lanzarToast(cfg.toastAbierto, '\uD83D\uDEAA', 'exito');
}

// --- Detectar recompensa ---

export function detectarRecompensa() {
    if (!est.activo) return;

    const celda = getCeldaJugador();

    for (let i = 0; i < est.cuartosSecretos.length; i++) {
        const cs = est.cuartosSecretos[i];
        if (!cs.abierto || cs.recompensaRecogida) continue;

        if (celda.fila === cs.fila && celda.col === cs.col) {
            cs.recompensaRecogida = true;

            // Animación de recoger
            cs.elementoRecompensa.classList.add('recompensa-recogida');
            setTimeout(function () {
                if (cs.elementoRecompensa && cs.elementoRecompensa.parentNode) {
                    cs.elementoRecompensa.remove();
                }
            }, 500);

            if (cs.tipoRecompensa === 'fuente') {
                aplicarCuracion();
            } else {
                lanzarToast(cfg.toastTesoro, '\uD83C\uDF81', 'item');
            }
        }
    }
}

// Cura un porcentaje de vida del jugador
function aplicarCuracion() {
    const rango = cfg.curacionMax - cfg.curacionMin;
    const porcentaje = cfg.curacionMin + Math.random() * rango;
    const curacion = Math.round((est.jugador.vidaMax * porcentaje) / 100);

    est.jugador.vidaActual = Math.min(est.jugador.vidaActual + curacion, est.jugador.vidaMax);
    notificarVidaCambio();

    // Texto flotante verde
    const elem = document.createElement('div');
    elem.className = 'efecto-flotante efecto-curacion';
    elem.textContent = '+' + curacion + ' \u2764\uFE0F';
    elem.style.left = est.posX + 'px';
    elem.style.top = est.posY - 5 + 'px';
    est.contenedorLaberinto.appendChild(elem);
    setTimeout(function () {
        if (elem.parentNode) elem.remove();
    }, 1000);

    lanzarToast(cfg.toastFuente, '\u26F2', 'exito');
}
