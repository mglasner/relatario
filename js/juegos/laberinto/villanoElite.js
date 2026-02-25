// Villano Élite — Enemigo de tier "elite" que aparece tras un countdown
// Persigue al jugador usando el mismo pathfinding BFS que el Trasgo

import { ENEMIGOS } from '../../enemigos.js';
import { mezclar } from '../../laberinto.js';
import { CONFIG, CFG, est, getCeldaJugador, aplicarDanoJugador } from './estado.js';
import { calcularCamino } from './trasgo.js';
import {
    getCeldaEnemigo,
    calcularDistanciasBFS,
    filtrarCandidatasPorDistancia,
    calcularFactorProgresivo,
    detectarTrampasEnemigo,
    crearBarraVida,
} from './enemigoComun.js';
import { lanzarToast } from '../../componentes/toast.js';

// Filtra enemigos de tier elite
function obtenerEnemigosElite() {
    const lista = [];
    for (const key in ENEMIGOS) {
        if (ENEMIGOS[key].tier === 'elite') {
            lista.push(ENEMIGOS[key]);
        }
    }
    return lista;
}

// Posición aleatoria lejos del jugador (50-80% de distancia máxima)
function posicionInicialElite() {
    const celdaJ = getCeldaJugador();
    const { distancias, maxDist } = calcularDistanciasBFS(celdaJ.fila, celdaJ.col);

    const celdaTrasgo = est.trasgo
        ? getCeldaEnemigo(est.trasgo, CONFIG.TAM_TRASGO)
        : { fila: -1, col: -1 };

    const excluir = [
        [est.entradaFila, est.entradaCol],
        [est.llaveFila, est.llaveCol],
        [celdaTrasgo.fila, celdaTrasgo.col],
    ];
    const candidatas = filtrarCandidatasPorDistancia(
        distancias,
        maxDist,
        CFG.villanoElite.posicionDistMin,
        CFG.villanoElite.posicionDistMax,
        excluir
    );

    mezclar(candidatas);
    return candidatas.length > 0 ? candidatas[0] : [1, CONFIG.COLS - 2];
}

// Inicializa el villano élite
function iniciarVillanoElite() {
    const enemigos = obtenerEnemigosElite();
    if (enemigos.length === 0) return;

    mezclar(enemigos);
    const datos = enemigos[0];
    const pos = posicionInicialElite();

    // Escala visual según estatura del villano
    const escalaVisual =
        CFG.villanoElite.escalaVisualBase * (datos.estatura / CFG.villanoElite.estaturaReferencia);

    est.villanoElite = {
        datos: datos,
        vida: datos.vidaMax,
        vidaMax: datos.vidaMax,
        posX: pos[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_ELITE) / 2,
        posY: pos[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_ELITE) / 2,
        camino: [],
        ultimoGolpe: 0,
        ultimoGolpeTrampa: 0,
        ultimoPathfinding: 0,
        tiempoAparicion: Date.now(),
        velocidadMult: 1,
        timerLentitud: null,
        escalaVisual: escalaVisual,
        elemento: null,
        elementoBarraVida: null,
    };

    // Renderizar el villano
    renderizarVillanoElite();

    // Toast de alerta
    lanzarToast(CFG.textos.toastElite.replace('{nombre}', datos.nombre), '💀', 'dano');
}

// Renderiza el villano élite en el laberinto
function renderizarVillanoElite() {
    if (!est.villanoElite) return;

    const datos = est.villanoElite.datos;
    const elem = document.createElement('div');
    elem.className = 'elite-laberinto elite-aparicion';
    elem.style.width = CONFIG.TAM_ELITE + 'px';
    elem.style.height = CONFIG.TAM_ELITE + 'px';
    elem.style.transform = `translate(${est.villanoElite.posX}px, ${est.villanoElite.posY}px) scale(${est.villanoElite.escalaVisual})`;

    const img = document.createElement('img');
    img.src = datos.img;
    img.alt = datos.nombre;
    elem.appendChild(img);
    est.villanoElite.elementoBarraVida = crearBarraVida(elem);

    est.contenedorLaberinto.appendChild(elem);
    est.villanoElite.elemento = elem;

    // Quitar clase de animación de aparición después de que termine
    setTimeout(function () {
        elem.classList.remove('elite-aparicion');
    }, 500);
}

// Actualiza pathfinding, movimiento y colisión del villano élite (cada frame)
export function actualizarVillanoElite() {
    if (!est.villanoElite) return;

    const ahora = Date.now();

    // Recalcular ruta periódicamente
    if (ahora - est.villanoElite.ultimoPathfinding >= CONFIG.INTERVALO_PATHFINDING_ELITE) {
        est.villanoElite.ultimoPathfinding = ahora;

        const celdaV = getCeldaEnemigo(est.villanoElite, CONFIG.TAM_ELITE);
        const celdaJ = getCeldaJugador();
        est.villanoElite.camino = calcularCamino(celdaV.fila, celdaV.col, celdaJ.fila, celdaJ.col);
    }

    // Velocidad con factor progresivo (despertar gradual) + atributo + lentitud
    const factorProg = calcularFactorProgresivo(
        est.villanoElite.tiempoAparicion,
        CFG.villanoElite.velocidadInicial,
        CFG.villanoElite.tiempoAceleracion
    );
    const velocidad =
        CONFIG.VELOCIDAD_ELITE *
        (est.villanoElite.datos.velocidad / CFG.villanoElite.velocidadReferencia) *
        factorProg *
        est.villanoElite.velocidadMult;

    // Mover hacia el siguiente punto del camino
    if (est.villanoElite.camino.length > 0) {
        const objetivo = est.villanoElite.camino[0];
        const targetX = objetivo[1] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_ELITE) / 2;
        const targetY = objetivo[0] * CONFIG.TAM_CELDA + (CONFIG.TAM_CELDA - CONFIG.TAM_ELITE) / 2;

        const dx = targetX - est.villanoElite.posX;
        const dy = targetY - est.villanoElite.posY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= velocidad) {
            est.villanoElite.posX = targetX;
            est.villanoElite.posY = targetY;
            est.villanoElite.camino.shift();
        } else {
            est.villanoElite.posX += (dx / dist) * velocidad;
            est.villanoElite.posY += (dy / dist) * velocidad;
        }

        est.villanoElite.elemento.style.transform = `translate(${est.villanoElite.posX}px, ${est.villanoElite.posY}px) scale(${est.villanoElite.escalaVisual})`;
    }

    // Trampas afectan al villano élite
    if (detectarTrampasEnemigo('villanoElite', CONFIG.TAM_ELITE)) return;

    // Detectar colisión con jugador
    detectarColisionElite();
}

// Si el villano toca al jugador, ataca con uno de sus ataques
function detectarColisionElite() {
    if (!est.activo) return;

    const ahora = Date.now();
    const cooldown = CONFIG.COOLDOWN_BASE / est.villanoElite.datos.velAtaque;
    if (ahora - est.villanoElite.ultimoGolpe < cooldown) return;

    const solapan =
        est.villanoElite.posX < est.posX + CONFIG.TAM_JUGADOR &&
        est.villanoElite.posX + CONFIG.TAM_ELITE > est.posX &&
        est.villanoElite.posY < est.posY + CONFIG.TAM_JUGADOR &&
        est.villanoElite.posY + CONFIG.TAM_ELITE > est.posY;

    if (solapan) {
        const ataques = est.villanoElite.datos.ataques;
        const ataque = ataques[Math.floor(Math.random() * ataques.length)];
        est.villanoElite.ultimoGolpe = ahora;
        aplicarDanoJugador(ataque.dano);
        lanzarToast(
            est.villanoElite.datos.nombre + ' — ' + ataque.nombre + ' (-' + ataque.dano + ')',
            '💀',
            'dano'
        );
    }
}

// --- Countdown: anillo arcano ---

const CIRCUNFERENCIA = 2 * Math.PI * 42; // r=42 en el SVG viewBox 0 0 100 100
const SVG_NS = 'http://www.w3.org/2000/svg';

// Crea la estructura DOM del countdown con anillo SVG
function crearCountdownDOM() {
    const contenedor = document.createElement('div');
    contenedor.className = 'countdown-elite';

    // Wrapper del anillo
    const wrap = document.createElement('div');
    wrap.className = 'countdown-anillo-wrap';

    // SVG con dos círculos: pista + progreso
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'countdown-anillo');
    svg.setAttribute('viewBox', '0 0 100 100');

    const pista = document.createElementNS(SVG_NS, 'circle');
    pista.setAttribute('class', 'countdown-pista');
    pista.setAttribute('cx', '50');
    pista.setAttribute('cy', '50');
    pista.setAttribute('r', '42');

    const progreso = document.createElementNS(SVG_NS, 'circle');
    progreso.setAttribute('class', 'countdown-progreso');
    progreso.setAttribute('cx', '50');
    progreso.setAttribute('cy', '50');
    progreso.setAttribute('r', '42');
    progreso.style.strokeDasharray = CIRCUNFERENCIA;
    progreso.style.strokeDashoffset = '0';

    svg.appendChild(pista);
    svg.appendChild(progreso);
    wrap.appendChild(svg);

    // Número central
    const numero = document.createElement('div');
    numero.className = 'countdown-numero';

    wrap.appendChild(numero);
    contenedor.appendChild(wrap);

    // Subtítulo
    const texto = document.createElement('div');
    texto.className = 'countdown-texto';
    texto.textContent = 'Amenaza inminente';
    contenedor.appendChild(texto);

    est.contenedorLaberinto.appendChild(contenedor);
    return contenedor;
}

// Actualiza el anillo y el número
function actualizarCountdownVisual(elem) {
    const numero = elem.querySelector('.countdown-numero');
    const progreso = elem.querySelector('.countdown-progreso');

    // Actualizar número con animación de tick
    numero.textContent = est.tiempoRestante;
    numero.classList.remove('countdown-tick');
    void numero.offsetWidth; // forzar reflow
    numero.classList.add('countdown-tick');

    // Deplecionar anillo: de 0 (lleno) a CIRCUNFERENCIA (vacío)
    const fraccionRestante = est.tiempoRestante / CONFIG.COUNTDOWN_ELITE;
    progreso.style.strokeDashoffset = CIRCUNFERENCIA * (1 - fraccionRestante);

    // Últimos 3 segundos: modo urgente (ring + borde rojo)
    if (est.tiempoRestante <= 3) {
        elem.classList.add('countdown-urgente');
        est.contenedorLaberinto.classList.remove('laberinto-amenaza');
        est.contenedorLaberinto.classList.add('laberinto-amenaza-urgente');
    }
}

// Quita las clases de borde del laberinto
function limpiarBordeAmenaza() {
    est.contenedorLaberinto.classList.remove('laberinto-amenaza');
    est.contenedorLaberinto.classList.remove('laberinto-amenaza-urgente');
}

// Inicia el countdown que libera un villano élite
export function iniciarCountdown() {
    est.tiempoRestante = CONFIG.COUNTDOWN_ELITE;
    const elem = crearCountdownDOM();
    est.contenedorLaberinto.classList.add('laberinto-amenaza');
    actualizarCountdownVisual(elem);

    est.countdownElite = setInterval(function () {
        est.tiempoRestante--;

        if (est.tiempoRestante <= 0) {
            clearInterval(est.countdownElite);
            est.countdownElite = null;

            // Quitar borde pulsante y animación de salida del ring
            limpiarBordeAmenaza();
            elem.classList.add('countdown-salida');
            setTimeout(function () {
                if (elem.parentNode) elem.parentNode.removeChild(elem);
            }, 400);

            // Liberar villano élite
            if (est.activo) {
                iniciarVillanoElite();
            }
        } else {
            actualizarCountdownVisual(elem);
        }
    }, 1000);
}

// Limpieza completa
export function limpiarVillanoElite() {
    if (est.countdownElite) {
        clearInterval(est.countdownElite);
        est.countdownElite = null;
    }
    if (est.villanoElite && est.villanoElite.timerLentitud) {
        clearTimeout(est.villanoElite.timerLentitud);
    }
    if (est.contenedorLaberinto) limpiarBordeAmenaza();
    est.villanoElite = null;
    est.tiempoRestante = 0;
}
