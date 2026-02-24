// Componente: Transiciones cinemáticas entre pantallas
// Tres estilos: fade (oscurecer), wipe (cortina horizontal), iris (círculo cartoon)
// Uso: await transicion.ejecutar('fade', callback)

export function crearTransicion() {
    const overlay = document.createElement('div');
    overlay.className = 'transicion-overlay';
    document.body.appendChild(overlay);

    let enCurso = false;

    // Ejecuta una transición con el estilo dado
    // callback se invoca en el punto medio (pantalla cubierta) para cambiar contenido
    function ejecutar(estilo, callback) {
        if (enCurso) {
            callback();
            return Promise.resolve();
        }
        enCurso = true;

        return new Promise(function (resolve) {
            // Aplicar estilo de entrada
            overlay.className = 'transicion-overlay transicion-' + estilo + '-in';

            function alCubrir() {
                // Punto medio: pantalla cubierta, cambiar contenido
                callback();

                // Animar salida
                overlay.className = 'transicion-overlay transicion-' + estilo + '-out';

                overlay.addEventListener(
                    'animationend',
                    function alDescubrir() {
                        overlay.className = 'transicion-overlay';
                        enCurso = false;
                        resolve();
                    },
                    { once: true }
                );
            }
            overlay.addEventListener('animationend', alCubrir, { once: true });
        });
    }

    return { ejecutar };
}
