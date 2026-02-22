// Libro de cuento — adapta datos de un cuento al motor genérico crearLibro()

import { crearElemento } from '../utils.js';
import { crearLibro, generarPortada } from './libro.js';

// Genera el contenido HTML de un capítulo
// El HTML proviene de marked (build-time) sobre .md propios, no de entrada de usuario
function renderizarCapitulo(cap) {
    const contenido = crearElemento('div', 'libro-detalle-contenido libro-capitulo');

    contenido.appendChild(crearElemento('h2', 'libro-capitulo-titulo', cap.titulo));
    contenido.appendChild(crearElemento('div', 'libro-ornamento'));

    const prosa = crearElemento('div', 'libro-prosa');
    prosa.innerHTML = cap.html;
    contenido.appendChild(prosa);

    return contenido;
}

// Crea un libro de cuento a partir de los datos generados por build-cuentos
export function crearLibroCuento(cuento) {
    const capitulos = cuento.capitulos.map(function (cap) {
        return {
            textoIndice: cap.titulo,
            generarContenido: function () {
                return renderizarCapitulo(cap);
            },
        };
    });

    return crearLibro({
        entidades: {},
        generarDetalle: function () {
            return crearElemento('div');
        },
        claseRaiz: 'libro-cuento',
        titulo: cuento.titulo,
        subtitulo: cuento.subtitulo,
        tituloExtras: 'Capítulos',
        paginaInicio: {
            textoIndice: 'Portada',
            textoSeccion: 'Portada',
            generarContenido: function () {
                return generarPortada(cuento.titulo, cuento.portada);
            },
        },
        paginasExtras: capitulos,
    });
}
