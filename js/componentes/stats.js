// Stats compartidos: tiers y generación de barras de stats

import { crearElemento } from '../utils.js';

// Tiers de villanos
export const TIERS = {
    esbirro: { emoji: '\u{1F479}', label: 'Esbirro' },
    terror: { emoji: '\u{1F480}', label: 'Terror' },
    pesadilla: { emoji: '\u{1F441}\uFE0F', label: 'Pesadilla' },
    leyenda: { emoji: '\u{1F525}', label: 'Leyenda Oscura' },
};

// Llena la sección de stats (vida + ataques) de una tarjeta
export function llenarStats(tarjeta, datos) {
    tarjeta.querySelector('.descripcion').textContent = datos.descripcion;

    const stats = tarjeta.querySelector('.stats');

    // Barra de vida (escala: 150 = 100%)
    const statVida = crearElemento('div', 'stat-vida');
    statVida.appendChild(crearElemento('span', 'stat-label', 'Vida'));
    const barraFondo = crearElemento('div', 'barra-vida-fondo');
    const barraRelleno = crearElemento('div', 'barra-vida-relleno');
    barraRelleno.style.transform = 'scaleX(' + datos.vidaMax / 150 + ')';
    barraFondo.appendChild(barraRelleno);
    statVida.appendChild(barraFondo);
    statVida.appendChild(crearElemento('span', 'stat-valor', datos.vidaMax.toString()));
    stats.appendChild(statVida);

    // Barra de velocidad (escala: 10 = 100%)
    if (datos.velocidad !== undefined) {
        const statVel = crearElemento('div', 'stat-velocidad');
        statVel.appendChild(crearElemento('span', 'stat-label', 'Velocidad'));
        const barraFondoVel = crearElemento('div', 'barra-vida-fondo');
        const barraRellenoVel = crearElemento('div', 'barra-velocidad-relleno');
        barraRellenoVel.style.transform = 'scaleX(' + datos.velocidad / 10 + ')';
        barraFondoVel.appendChild(barraRellenoVel);
        statVel.appendChild(barraFondoVel);
        statVel.appendChild(crearElemento('span', 'stat-valor', datos.velocidad.toString()));
        stats.appendChild(statVel);
    }

    // Barra de velocidad de ataque (escala: 10 = 100%)
    if (datos.velAtaque !== undefined) {
        const statVelAtk = crearElemento('div', 'stat-vel-ataque');
        statVelAtk.appendChild(crearElemento('span', 'stat-label', 'Vel. Ataque'));
        const barraFondoVA = crearElemento('div', 'barra-vida-fondo');
        const barraRellenoVA = crearElemento('div', 'barra-vel-ataque-relleno');
        barraRellenoVA.style.transform = 'scaleX(' + datos.velAtaque / 10 + ')';
        barraFondoVA.appendChild(barraRellenoVA);
        statVelAtk.appendChild(barraFondoVA);
        statVelAtk.appendChild(crearElemento('span', 'stat-valor', datos.velAtaque.toString()));
        stats.appendChild(statVelAtk);
    }

    // Atributos extra (edad, estatura)
    if (datos.edad !== undefined || datos.estatura !== undefined) {
        const statAtributos = crearElemento('div', 'stat-atributos');
        statAtributos.appendChild(crearElemento('span', 'stat-label', 'Atributos'));

        if (datos.edad !== undefined) {
            const fila = crearElemento('div', 'ataque');
            fila.appendChild(crearElemento('span', 'ataque-nombre', 'Edad'));
            fila.appendChild(crearElemento('span', 'stat-valor', datos.edad + ' años'));
            statAtributos.appendChild(fila);
        }

        if (datos.estatura !== undefined) {
            const fila = crearElemento('div', 'ataque');
            fila.appendChild(crearElemento('span', 'ataque-nombre', 'Estatura'));
            fila.appendChild(crearElemento('span', 'stat-valor', datos.estatura + ' m'));
            statAtributos.appendChild(fila);
        }

        stats.appendChild(statAtributos);
    }

    // Ataques
    const statAtaques = crearElemento('div', 'stat-ataques');
    statAtaques.appendChild(crearElemento('span', 'stat-label', 'Ataques'));
    datos.ataques.forEach(function (ataque) {
        const ataqueDiv = crearElemento('div', 'ataque');
        ataqueDiv.appendChild(crearElemento('span', 'ataque-nombre', ataque.nombre));
        ataqueDiv.appendChild(crearElemento('span', 'ataque-dano', ataque.dano.toString()));
        statAtaques.appendChild(ataqueDiv);
    });
    stats.appendChild(statAtaques);
}
