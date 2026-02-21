// Componente reutilizable: Barra de vida con corazón palpitante
// Usado por barraSuperior (pasillo/habitaciones) y HUD in-canvas (habitación 4)

export function crearBarraVida(opciones = {}) {
    const { mostrarTexto = false, claseExtra = '' } = opciones;

    // --- Crear estructura DOM ---
    const el = document.createElement('div');
    el.className = 'barra-vida-jugador' + (claseExtra ? ' ' + claseExtra : '');

    const corazon = document.createElement('span');
    corazon.className = 'barra-vida-corazon';
    corazon.textContent = '\u2764\uFE0F';

    const barraFondo = document.createElement('div');
    barraFondo.className = 'barra-vida-fondo';

    const barraRelleno = document.createElement('div');
    barraRelleno.className = 'barra-vida-relleno';

    let vidaTexto = null;
    if (mostrarTexto) {
        vidaTexto = document.createElement('span');
        vidaTexto.className = 'barra-vida-texto';
    }

    barraFondo.appendChild(barraRelleno);
    if (vidaTexto) barraFondo.appendChild(vidaTexto);

    el.appendChild(corazon);
    el.appendChild(barraFondo);

    // --- Método actualizar ---
    function actualizar(vidaActual, vidaMax) {
        if (!vidaMax) return;
        const porcentaje = Math.round((vidaActual / vidaMax) * 100);
        barraRelleno.style.transform = 'scaleX(' + porcentaje / 100 + ')';

        // Color dinámico: verde → amarillo → rojo
        if (porcentaje > 60) {
            barraRelleno.style.background = 'linear-gradient(90deg, #2ecc71, #6bfc86)';
        } else if (porcentaje > 30) {
            barraRelleno.style.background = 'linear-gradient(90deg, #f39c12, #f1c40f)';
        } else {
            barraRelleno.style.background = 'linear-gradient(90deg, #e74c3c, #e94560)';
        }

        if (vidaTexto) {
            vidaTexto.textContent = vidaActual + '/' + vidaMax;
        }

        // Estado de peligro (corazón late rápido)
        el.classList.toggle('barra-vida-peligro', porcentaje <= 25);
    }

    return { el, actualizar };
}
