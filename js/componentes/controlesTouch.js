// Componente: D-pad virtual para dispositivos touch
// Soporta tres modos:
// - Centrado (laberinto 2D): 4 botones ▲◀▶▼ centrados abajo
// - Dividido (platformer): izq ◀▶ movimiento / der botones A (saltar) y B (agacharse)
// - CruzSplit (laberinto 3D): cruz ▲◀▶▼ a la izquierda + der A/B
//
// La cruz soporta diagonales invisibles: tocar entre dos flechas adyacentes
// activa ambas direcciones simultáneamente (grilla 3x3 con esquinas diagonales).

export function crearControlesTouch() {
    // No crear si no hay soporte touch
    const esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!esTouch) {
        return {
            setTeclasRef() {},
            mostrar() {},
            ocultar() {},
            setModoDividido() {},
            setModoCentrado() {},
            setModoCruzSplit() {},
        };
    }

    let teclasRef = {};
    let modo = 'centrado'; // 'centrado' | 'dividido' | 'cruzSplit'

    // Helper: crear boton touch con eventos tactiles (para split y A/B)
    function crearBoton(clase, key, texto) {
        const btn = document.createElement('button');
        btn.className = 'dpad-btn ' + clase;
        btn.textContent = texto;
        btn.type = 'button';

        btn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            teclasRef[key] = true;
        });

        btn.addEventListener('touchend', function (e) {
            e.preventDefault();
            delete teclasRef[key];
        });

        btn.addEventListener('touchcancel', function () {
            delete teclasRef[key];
        });

        return btn;
    }

    // Helper: crear boton visual sin eventos touch (la cruz maneja touch a nivel contenedor)
    function crearBotonVisual(clase, texto) {
        const btn = document.createElement('button');
        btn.className = 'dpad-btn ' + clase;
        btn.textContent = texto;
        btn.type = 'button';
        return btn;
    }

    // --- Contenedor cruz (laberinto: ▲◀▶▼ con diagonales invisibles) ---
    const contenedor = document.createElement('div');
    contenedor.className = 'dpad-contenedor';

    const btnArriba = crearBotonVisual('dpad-arriba', '▲');
    const btnIzquierda = crearBotonVisual('dpad-izquierda', '◀');
    const btnDerecha = crearBotonVisual('dpad-derecha', '▶');
    const btnAbajo = crearBotonVisual('dpad-abajo', '▼');

    contenedor.appendChild(btnArriba);
    contenedor.appendChild(btnIzquierda);
    contenedor.appendChild(btnDerecha);
    contenedor.appendChild(btnAbajo);

    // --- Touch diagonal: grilla 3x3 sobre el contenedor ---
    // Cada celda mapea a 0, 1 o 2 teclas según su posición:
    //   ↑←  [▲]  ↑→
    //   [◀]  ·   [▶]
    //   ↓←  [▼]  ↓→
    const TECLAS_DIRECCION = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    const ZONAS = [
        ['ArrowUp', 'ArrowLeft'],
        ['ArrowUp'],
        ['ArrowUp', 'ArrowRight'],
        ['ArrowLeft'],
        [],
        ['ArrowRight'],
        ['ArrowDown', 'ArrowLeft'],
        ['ArrowDown'],
        ['ArrowDown', 'ArrowRight'],
    ];

    // Referencia a botones por tecla para feedback visual
    const botonesDir = {
        ArrowUp: btnArriba,
        ArrowDown: btnAbajo,
        ArrowLeft: btnIzquierda,
        ArrowRight: btnDerecha,
    };

    // Touches activos en la cruz: Map<touchId, string[]>
    const touchesCruz = new Map();

    function obtenerZona(touch) {
        const rect = contenedor.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const col = Math.max(0, Math.min(2, Math.floor(x / (rect.width / 3))));
        const row = Math.max(0, Math.min(2, Math.floor(y / (rect.height / 3))));
        return ZONAS[row * 3 + col];
    }

    function recalcularTeclasCruz() {
        // Limpiar todas las teclas direccionales
        for (let i = 0; i < TECLAS_DIRECCION.length; i++) {
            delete teclasRef[TECLAS_DIRECCION[i]];
        }
        // Reactivar según touches activos
        touchesCruz.forEach(function (teclas) {
            for (let i = 0; i < teclas.length; i++) {
                teclasRef[teclas[i]] = true;
            }
        });
        // Feedback visual en botones
        for (const key in botonesDir) {
            botonesDir[key].classList.toggle('dpad-activo', !!teclasRef[key]);
        }
    }

    // touchstart/touchmove: actualizar zona del touch
    // touchend/touchcancel: eliminar touch del mapa
    function manejarTouchCruz(e) {
        const esFin = e.type === 'touchend' || e.type === 'touchcancel';
        if (e.type !== 'touchcancel') e.preventDefault();

        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            if (esFin) {
                touchesCruz.delete(touch.identifier);
            } else {
                touchesCruz.set(touch.identifier, obtenerZona(touch));
            }
        }
        recalcularTeclasCruz();
    }

    contenedor.addEventListener('touchstart', manejarTouchCruz);
    contenedor.addEventListener('touchmove', manejarTouchCruz);
    contenedor.addEventListener('touchend', manejarTouchCruz);
    contenedor.addEventListener('touchcancel', manejarTouchCruz);

    // --- Contenedor izquierdo (platformer: ◀ ▶) ---
    const contIzq = document.createElement('div');
    contIzq.className = 'dpad-izq-contenedor';

    contIzq.appendChild(crearBoton('dpad-split-izq', 'ArrowLeft', '◀'));
    contIzq.appendChild(crearBoton('dpad-split-der', 'ArrowRight', '▶'));

    // --- Contenedor derecho (platformer: botones A y B estilo SNES) ---
    const contDer = document.createElement('div');
    contDer.className = 'dpad-der-contenedor';

    // B: agacharse
    const btnB = crearBoton('dpad-btn-b', 'ArrowDown', '▼');

    // A: saltar (accion principal)
    const btnA = crearBoton('dpad-btn-a', 'ArrowUp', 'A');

    contDer.appendChild(btnB);
    contDer.appendChild(btnA);

    // Agregar los 3 contenedores al body
    document.body.appendChild(contenedor);
    document.body.appendChild(contIzq);
    document.body.appendChild(contDer);

    // Estado inicial: todos ocultos
    contenedor.classList.add('oculto');
    contIzq.classList.add('oculto');
    contDer.classList.add('oculto');

    function limpiarTouchesCruz() {
        touchesCruz.clear();
        recalcularTeclasCruz();
    }

    function setTeclasRef(obj) {
        teclasRef = obj;
        limpiarTouchesCruz();
    }

    function mostrar() {
        const esDividido = modo === 'dividido';
        const esCentrado = modo === 'centrado';

        contenedor.classList.toggle('oculto', esDividido);
        contenedor.classList.toggle('dpad-cruz-split', modo === 'cruzSplit');
        contIzq.classList.toggle('oculto', !esDividido);
        contDer.classList.toggle('oculto', esCentrado);
    }

    function ocultar() {
        limpiarTouchesCruz();
        contenedor.classList.add('oculto');
        contIzq.classList.add('oculto');
        contDer.classList.add('oculto');
    }

    function setModoDividido() {
        modo = 'dividido';
    }

    function setModoCentrado() {
        modo = 'centrado';
    }

    function setModoCruzSplit() {
        modo = 'cruzSplit';
    }

    return { setTeclasRef, mostrar, ocultar, setModoDividido, setModoCentrado, setModoCruzSplit };
}
