// Clases base del modelo de juego

// Clase base para cualquier entidad con vida (personajes, enemigos)
class Entidad {
    constructor(nombre, vidaMax) {
        this.nombre = nombre;
        this.vidaMax = vidaMax;
        this.vidaActual = vidaMax;
        this.inventario = [];
    }

    estaVivo() {
        return this.vidaActual > 0;
    }

    recibirDano(cantidad) {
        this.vidaActual = Math.max(0, this.vidaActual - cantidad);
    }

    curar(cantidad) {
        this.vidaActual = Math.min(this.vidaMax, this.vidaActual + cantidad);
    }
}

// Personaje jugable con ataques y datos visuales
class Personaje extends Entidad {
    constructor(nombre, vidaMax, ataques, datos) {
        super(nombre, vidaMax);
        this.ataques = ataques;
        this.img = datos.img;
        this.clase = datos.clase;
        this.descripcion = datos.descripcion;
        this.velocidad = datos.velocidad;
        this.estatura = datos.estatura;
        this.edad = datos.edad;
    }
}

// Enemigo con ataques y datos visuales
class Enemigo extends Entidad {
    constructor(nombre, vidaMax, ataques, datos) {
        super(nombre, vidaMax);
        this.ataques = ataques;
        // Soportar el formato anterior (string) y el nuevo (objeto)
        if (typeof datos === 'string') {
            this.descripcion = datos;
        } else if (datos) {
            this.img = datos.img;
            this.clase = datos.clase;
            this.descripcion = datos.descripcion || '';
            this.velocidad = datos.velocidad;
            this.estatura = datos.estatura;
            this.edad = datos.edad;
        }
    }
}

export { Entidad, Personaje, Enemigo };
