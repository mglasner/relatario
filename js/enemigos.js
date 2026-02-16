// Definición de enemigos
import { Enemigo } from "./entidades.js";

const ENEMIGOS = {
    Siniestra: new Enemigo("Siniestra", 150, [
        { nombre: "Llama negra", dano: 30, descripcion: "Fuego oscuro que consume todo" },
        { nombre: "Grito infernal", dano: 30, descripcion: "Onda de terror puro" }
    ], "Espectro furioso. Destruye todo a su paso."),

    Trasgo: new Enemigo("Trasgo", 50, [
        { nombre: "Golpe sucio", dano: 7, descripcion: "Un golpe bajo y traicionero" },
        { nombre: "Trampa", dano: 10, descripcion: "Trampa escondida en el suelo" }
    ], "Duende torpe. Intenta ser malo pero le sale mal.")
};

export { ENEMIGOS };
