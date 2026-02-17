// Componente: D-pad virtual para dispositivos touch
// Crea 4 botones direccionales fijos en la parte inferior de la pantalla
// Solo visible en dispositivos con touch

export function crearControlesTouch() {
    // No crear si no hay soporte touch
    const esTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!esTouch) {
        return {
            setTeclasRef() {},
            mostrar() {},
            ocultar() {},
        };
    }

    let teclasRef = {};

    const contenedor = document.createElement('div');
    contenedor.className = 'dpad-contenedor';

    // Crear los 4 botones
    const teclas = [
        { clase: 'dpad-arriba', key: 'ArrowUp', texto: '▲' },
        { clase: 'dpad-izquierda', key: 'ArrowLeft', texto: '◀' },
        { clase: 'dpad-derecha', key: 'ArrowRight', texto: '▶' },
        { clase: 'dpad-abajo', key: 'ArrowDown', texto: '▼' },
    ];

    teclas.forEach(function (t) {
        const btn = document.createElement('button');
        btn.className = 'dpad-btn ' + t.clase;
        btn.textContent = t.texto;
        btn.type = 'button';

        // touchstart activa la tecla
        btn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            teclasRef[t.key] = true;
        });

        // touchend desactiva la tecla
        btn.addEventListener('touchend', function (e) {
            e.preventDefault();
            delete teclasRef[t.key];
        });

        // Si el dedo sale del botón, desactivar
        btn.addEventListener('touchcancel', function () {
            delete teclasRef[t.key];
        });

        contenedor.appendChild(btn);
    });

    document.body.appendChild(contenedor);
    contenedor.classList.add('oculto');

    function setTeclasRef(obj) {
        teclasRef = obj;
    }

    function mostrar() {
        contenedor.classList.remove('oculto');
    }

    function ocultar() {
        contenedor.classList.add('oculto');
    }

    return { setTeclasRef, mostrar, ocultar };
}
