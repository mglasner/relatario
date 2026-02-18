# Plan: Modelo de personajes y sistema de combate

## Estado actual

Los personajes se modelan como un objeto plano en `juego.js` (líneas 31-35):

```js
const datosPersonajes = {
    Lina: { img: 'assets/img/personajes/lina.png', clase: 'jugador-lina' },
    Rosé: { img: 'assets/img/personajes/rose.png', clase: 'jugador-rose' },
    PandaJuro: { img: 'assets/img/personajes/pandajuro.png', clase: 'jugador-pandajuro' },
};
```

No hay modelo de datos real: solo imagen y clase CSS. El nombre y la descripcion
viven en el HTML.

## Objetivo

Modelar personajes con vida, ataques y estructura extensible usando programacion
orientada a objetos, preparando el terreno para un sistema de combate contra
enemigos.

## Diseno propuesto

### Jerarquia de clases

```
Entidad (base)
├── nombre, vidaMax, vidaActual
├── estaVivo(), recibirDano(), curar()
│
├── Personaje (hereda de Entidad)
│   ├── ataques[], img, clase, descripcion
│   └── (futuro: defensa, velocidad, nivel, experiencia)
│
└── Enemigo (hereda de Entidad)
    ├── ataques[]
    └── (futuro: recompensa, tipo)
```

### Clase Entidad (base)

Responsabilidad: manejar vida y estado basico de cualquier entidad del juego.

```js
class Entidad {
    constructor(nombre, vidaMax) {
        this.nombre = nombre;
        this.vidaMax = vidaMax;
        this.vidaActual = vidaMax;
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
```

### Clase Personaje

Responsabilidad: representar un personaje jugable con sus ataques y datos
visuales.

```js
class Personaje extends Entidad {
    constructor(nombre, vidaMax, ataques, datos) {
        super(nombre, vidaMax);
        this.ataques = ataques;
        this.img = datos.img;
        this.clase = datos.clase;
        this.descripcion = datos.descripcion;
    }
}
```

### Clase Enemigo

Responsabilidad: representar un enemigo con sus ataques.

```js
class Enemigo extends Entidad {
    constructor(nombre, vidaMax, ataques) {
        super(nombre, vidaMax);
        this.ataques = ataques;
    }
}
```

### Definicion de personajes

Reemplaza el objeto `datosPersonajes` actual:

```js
const PERSONAJES = {
    Lina: new Personaje(
        'Lina',
        100,
        [
            { nombre: 'Golpe veloz', dano: 15, descripcion: 'Un golpe rapido' },
            { nombre: 'Patada giratoria', dano: 25, descripcion: 'Ataque poderoso' },
        ],
        {
            img: 'assets/img/personajes/lina.png',
            clase: 'jugador-lina',
            descripcion: '13 anos. Valiente e inteligente.',
        }
    ),

    Rosé: new Personaje(
        'Rosé',
        90,
        [
            { nombre: 'Rayo de luz', dano: 20, descripcion: 'Destello cegador' },
            { nombre: 'Escudo brillante', dano: 10, descripcion: 'Ataque defensivo' },
        ],
        {
            img: 'assets/img/personajes/rose.png',
            clase: 'jugador-rose',
            descripcion: '10 anos. Nunca se rinde.',
        }
    ),

    PandaJuro: new Personaje(
        'PandaJuro',
        120,
        [
            { nombre: 'Corte samurai', dano: 30, descripcion: 'Un tajo devastador' },
            { nombre: 'Golpe de bambu', dano: 18, descripcion: 'Golpe rapido con bambu' },
        ],
        {
            img: 'assets/img/personajes/pandajuro.png',
            clase: 'jugador-pandajuro',
            descripcion: 'Furioso, leal y honorable.',
        }
    ),
};
```

### Balance de personajes

| Personaje     | Vida | Ataque 1           | Ataque 2              | Estilo                |
| ------------- | ---- | ------------------ | --------------------- | --------------------- |
| **Lina**      | 100  | Golpe veloz (15)   | Patada giratoria (25) | Equilibrada           |
| **Rose**      | 90   | Rayo de luz (20)   | Escudo brillante (10) | Especial / magica     |
| **PandaJuro** | 120  | Corte samurai (30) | Golpe de bambu (18)   | Tanque / fuerza bruta |

## Principios de diseno aplicados

| Principio                               | Aplicacion                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| **Separar datos de vista**              | Las clases manejan datos (vida, dano); el DOM muestra la UI                  |
| **Single Responsibility**               | `Entidad` maneja vida, `Personaje` agrega ataques, el codigo de UI es aparte |
| **Abierto a extension**                 | Agregar defensa, velocidad, nivel es solo agregar propiedades                |
| **Composicion sobre herencia profunda** | Los ataques son objetos en un array, no subclases                            |

## Cambios necesarios en el codigo

1. **Agregar clases** al inicio de `juego.js` (Entidad, Personaje, Enemigo)
2. **Reemplazar** `datosPersonajes` por `PERSONAJES` usando las nuevas clases
3. **Actualizar** las referencias en el codigo existente:
    - `datos.img` y `datos.clase` siguen funcionando igual (son propiedades de Personaje)
    - Guardar la instancia del personaje elegido (no solo el nombre)
4. **No tocar** la UI ni el HTML por ahora

## Extensibilidad futura

Agregar nuevas caracteristicas sera directo con esta estructura:

- **Defensa**: agregar `this.defensa` a Entidad y modificar `recibirDano()`
- **Objetos/Items**: nueva clase `Item` con efecto
- **Niveles**: agregar `this.nivel` y `this.experiencia` a Personaje
- **Tipos de ataque**: los ataques pueden volverse una clase `Ataque` con tipo
  (fuego, hielo), cooldown, etc.
- **Nuevos enemigos**: instanciar `new Enemigo(...)` con distintas stats
