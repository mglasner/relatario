// Vitrina de sprites — herramienta de desarrollo para El Abismo
// Carga todos los sprite sheets y cicla por los estados de animación
// Uso: abrir http://localhost:3000/vitrina.html con npm run dev
//
// NO se incluye en producción: build:js solo bundlea js/juego.js,
// build:html no copia vitrina.html a dist/

const FW = 96;
const FH = 120;

// --- Personajes (sprites + ataques unificados) ---
// Datos de ataques provienen de personajes.yaml y enemigos.yaml

const HEROES = [
    {
        nombre: 'DonBu',
        src: 'assets/img/sprites-plat/donbu.png',
        ataques: [
            { nombre: 'Patada de mula', arq: 'carga', color: '#d4a052', sec: '#8B6914', radio: 1 },
            { nombre: 'Cabezazo terco', arq: 'salto', color: '#8B6914', sec: '#d4a052', radio: 1 },
        ],
    },
    {
        nombre: 'Hana',
        src: 'assets/img/sprites-plat/hana.png',
        ataques: [
            {
                nombre: 'Pirueta fulminante',
                arq: 'carga',
                color: '#e91e90',
                sec: '#ff69b4',
                radio: 1,
            },
            { nombre: 'Coreografía letal', arq: 'aoe', color: '#ff69b4', sec: '#e91e90', radio: 3 },
        ],
    },
    {
        nombre: 'Kira',
        src: 'assets/img/sprites-plat/kira.png',
        ataques: [
            {
                nombre: 'Disparo certero',
                arq: 'proyectil',
                color: '#2ec4b6',
                sec: '#ffffff',
                radio: 1,
            },
            { nombre: 'Trampa de luz', arq: 'aoe', color: '#ffffff', sec: '#2ec4b6', radio: 2 },
        ],
    },
    {
        nombre: 'PomPom',
        src: 'assets/img/sprites-plat/pompom.png',
        ataques: [
            { nombre: 'Cucharonazo', arq: 'carga', color: '#8B4513', sec: '#f8a5c2', radio: 1 },
            {
                nombre: 'Abrazo aplastante',
                arq: 'salto',
                color: '#f8a5c2',
                sec: '#fcc2d7',
                radio: 1,
            },
        ],
    },
    {
        nombre: 'Orejas',
        src: 'assets/img/sprites-plat/orejas.png',
        ataques: [
            { nombre: 'Azadonazo', arq: 'carga', color: '#808080', sec: '#e67e22', radio: 1 },
            {
                nombre: 'Lluvia de zanahorias',
                arq: 'proyectil',
                color: '#ff8c00',
                sec: '#228b22',
                radio: 1,
            },
        ],
    },
    {
        nombre: 'Rosé',
        src: 'assets/img/sprites-plat/rose.png',
        ataques: [
            {
                nombre: 'Latigazo de tela',
                arq: 'carga',
                color: '#ffffff',
                sec: '#2ecc71',
                radio: 1,
            },
            { nombre: 'Giro del cubo', arq: 'aoe', color: '#2ecc71', sec: '#ffffff', radio: 2 },
        ],
    },
    {
        nombre: 'Lina',
        src: 'assets/img/sprites-plat/lina.png',
        ataques: [
            { nombre: 'Nota aguda', arq: 'proyectil', color: '#d4a0ff', sec: '#9b59b6', radio: 1 },
            { nombre: 'Encore explosivo', arq: 'aoe', color: '#ffd700', sec: '#9b59b6', radio: 3 },
        ],
    },
    {
        nombre: 'PandaJuro',
        src: 'assets/img/sprites-plat/pandajuro.png',
        ataques: [
            { nombre: 'Corte samurái', arq: 'carga', color: '#c0392b', sec: '#e0e0e0', radio: 1 },
            {
                nombre: 'Golpe de bambú',
                arq: 'proyectil',
                color: '#4a7c3f',
                sec: '#c0392b',
                radio: 1,
            },
        ],
    },
];

const VILLANOS = [
    {
        nombre: 'Siniestra',
        src: 'assets/img/sprites-plat/siniestra.png',
        ataques: [
            { nombre: 'Llama negra', arq: 'proyectil', color: '#1a0a2e', sec: '#ff6600', radio: 1 },
            { nombre: 'Grito arcano', arq: 'aoe', color: '#9b59b6', sec: '#4a0080', radio: 3 },
        ],
    },
    {
        nombre: 'Trasgo',
        src: 'assets/img/sprites-plat/trasgo.png',
        ataques: [
            { nombre: 'Golpe sucio', arq: 'carga', color: '#2d5a1e', sec: '#6b4423', radio: 1 },
            { nombre: 'Trampa', arq: 'aoe', color: '#6b4423', sec: '#2d5a1e', radio: 2 },
        ],
    },
    {
        nombre: 'El Errante',
        src: 'assets/img/sprites-plat/errante.png',
        ataques: [
            { nombre: 'Mordida tóxica', arq: 'carga', color: '#00ff88', sec: '#004d26', radio: 1 },
            {
                nombre: 'Eco fantasmal',
                arq: 'proyectil',
                color: '#b0e0e6',
                sec: '#ffffff',
                radio: 1,
            },
        ],
    },
    {
        nombre: 'El Profano',
        src: 'assets/img/sprites-plat/profano.png',
        ataques: [
            { nombre: 'Zarpazo sombrío', arq: 'carga', color: '#1a1a2e', sec: '#4a0080', radio: 1 },
            { nombre: 'Emboscada', arq: 'salto', color: '#000000', sec: '#1a1a2e', radio: 1 },
        ],
    },
    {
        nombre: 'Topete',
        src: 'assets/img/sprites-plat/topete.png',
        ataques: [
            {
                nombre: 'Berrinche explosivo',
                arq: 'aoe',
                color: '#ff4444',
                sec: '#ff8800',
                radio: 2,
            },
            { nombre: 'Cadenazo', arq: 'carga', color: '#aaaaaa', sec: '#666666', radio: 1 },
        ],
    },
    {
        nombre: 'Pototo',
        src: 'assets/img/sprites-plat/pototo.png',
        ataques: [
            { nombre: 'Risa burlesca', arq: 'aoe', color: '#8e44ad', sec: '#2c003e', radio: 2 },
            {
                nombre: 'Travesura doble',
                arq: 'proyectil',
                color: '#2c003e',
                sec: '#8e44ad',
                radio: 1,
            },
        ],
    },
    {
        nombre: 'La Grotesca',
        src: 'assets/img/sprites-plat/grotesca.png',
        ataques: [
            {
                nombre: 'Tela encantada',
                arq: 'proyectil',
                color: '#f0e0f0',
                sec: '#cc6699',
                radio: 1,
            },
            {
                nombre: 'Caída vertiginosa',
                arq: 'salto',
                color: '#cc6699',
                sec: '#880044',
                radio: 1.5,
            },
        ],
    },
    {
        nombre: 'El Disonante',
        src: 'assets/img/sprites-plat/disonante.png',
        ataques: [
            {
                nombre: 'Nota discordante',
                arq: 'proyectil',
                color: '#ffd700',
                sec: '#cc8800',
                radio: 1,
            },
            { nombre: 'Réquiem arcano', arq: 'aoe', color: '#4a0080', sec: '#ffd700', radio: 3 },
        ],
    },
    {
        nombre: 'El M. Comelón',
        src: 'assets/img/sprites-plat/comelon.png',
        ataques: [
            { nombre: 'Bocado estelar', arq: 'carga', color: '#ff4500', sec: '#8b0000', radio: 1 },
            { nombre: 'Gran Mascada', arq: 'aoe', color: '#8b0000', sec: '#ff4500', radio: 4 },
        ],
    },
    {
        nombre: 'La Nebulosa',
        src: 'assets/img/sprites-plat/nebulosa.png',
        ataques: [
            { nombre: 'Niebla cósmica', arq: 'aoe', color: '#4a0e4e', sec: '#0a0a3a', radio: 4 },
            {
                nombre: 'Vórtice de sombra',
                arq: 'proyectil',
                color: '#0a0a3a',
                sec: '#4a0e4e',
                radio: 1,
            },
        ],
    },
];

// --- Estados de animación ---
// Layout unificado de 17 frames: idle(2) run(6) jump fall hit atk1(2) atk2(2) crouch(2)

const ESTADOS = [
    { nombre: 'idle', inicio: 0, cantidad: 2, duracion: 90 },
    { nombre: 'correr', inicio: 2, cantidad: 6, duracion: 100 },
    { nombre: 'saltar', inicio: 8, cantidad: 1, duracion: 45 },
    { nombre: 'caer', inicio: 9, cantidad: 1, duracion: 45 },
    { nombre: 'agacharse', inicio: 15, cantidad: 2, duracion: 70 },
    { nombre: 'ataque 1', inicio: 11, cantidad: 2, duracion: 60 },
    { nombre: 'ataque 2', inicio: 13, cantidad: 2, duracion: 60 },
    { nombre: 'golpeado', inicio: 10, cantidad: 1, duracion: 45 },
];

const ANIM_SPEED = 8;

// --- Estado del showcase de sprites ---

const cards = [];
let estadoIdx = 0;
let timer = 0;
let frameAnim = 0;
let frameTimer = 0;
let velocidad = 1;
let zoom = 2;
let flip = false;
let modoFijo = -1;

// --- Utilidades ---

function cargarImagen(src) {
    return new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () {
            resolve(img);
        };
        img.onerror = function () {
            reject(new Error('No se pudo cargar: ' + src));
        };
        img.src = src;
    });
}

function hexARgb(hex) {
    if (!hex || hex.length < 7) return { r: 200, g: 100, b: 255 };
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

// ============================
// PARTE 1: Showcase de sprites
// ============================

function crearCard(contenedor, personaje) {
    const card = document.createElement('div');
    card.className = 'card';
    const canvas = document.createElement('canvas');
    canvas.width = FW;
    canvas.height = FH;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = personaje.nombre;
    card.appendChild(canvas);
    card.appendChild(name);
    contenedor.appendChild(card);

    const entry = { canvas, ctx: canvas.getContext('2d'), img: null };
    cargarImagen(personaje.src)
        .then(function (img) {
            entry.img = img;
        })
        .catch(function () {});
    cards.push(entry);
}

function crearBotones() {
    const grupo = document.getElementById('stateButtons');
    const autoBtn = document.createElement('button');
    autoBtn.className = 'state-btn active';
    autoBtn.textContent = 'Auto';
    autoBtn.addEventListener('click', function () {
        modoFijo = -1;
        timer = 0;
        frameAnim = 0;
        frameTimer = 0;
        marcarBotonActivo();
    });
    grupo.appendChild(autoBtn);

    for (let i = 0; i < ESTADOS.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'state-btn';
        btn.textContent = ESTADOS[i].nombre;
        btn.addEventListener(
            'click',
            (function (idx) {
                return function () {
                    modoFijo = idx;
                    estadoIdx = idx;
                    frameAnim = 0;
                    frameTimer = 0;
                    marcarBotonActivo();
                };
            })(i)
        );
        grupo.appendChild(btn);
    }
}

function marcarBotonActivo() {
    const btns = document.querySelectorAll('.state-btn');
    for (let i = 0; i < btns.length; i++) {
        if (i === 0) {
            btns[i].classList.toggle('active', modoFijo === -1);
        } else {
            btns[i].classList.toggle('active', modoFijo === i - 1);
        }
    }
}

function aplicarZoom() {
    const sprW = (FW / 2) * zoom;
    const sprH = (FH / 2) * zoom;
    for (let i = 0; i < cards.length; i++) {
        cards[i].canvas.style.width = sprW + 'px';
        cards[i].canvas.style.height = sprH + 'px';
    }
    for (let i = 0; i < demos.length; i++) {
        demos[i].canvas.style.width = DW * zoom + 'px';
        demos[i].canvas.style.height = DH * zoom + 'px';
    }
}

function dibujarFrame(card, frameIdx) {
    const ctx = card.ctx;
    ctx.clearRect(0, 0, FW, FH);
    if (!card.img) {
        ctx.fillStyle = '#2a2a4e';
        ctx.fillRect(24, 20, 48, 80);
        ctx.fillStyle = '#555';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('cargando…', FW / 2, FH / 2);
        return;
    }
    ctx.save();
    if (flip) {
        ctx.translate(FW, 0);
        ctx.scale(-1, 1);
    }
    ctx.drawImage(card.img, frameIdx * FW, 0, FW, FH, 0, 0, FW, FH);
    ctx.restore();
}

function actualizarShowcase() {
    timer += velocidad;
    frameTimer += velocidad;
    if (frameTimer >= ANIM_SPEED) {
        frameTimer -= ANIM_SPEED;
        frameAnim++;
    }
    if (modoFijo === -1) {
        const est = ESTADOS[estadoIdx];
        if (timer >= est.duracion) {
            timer = 0;
            frameAnim = 0;
            frameTimer = 0;
            estadoIdx = (estadoIdx + 1) % ESTADOS.length;
        }
    }
    const est = ESTADOS[estadoIdx];
    const frameIdx = est.inicio + (frameAnim % est.cantidad);
    document.getElementById('stateLabel').textContent = est.nombre;
    for (let i = 0; i < cards.length; i++) {
        dibujarFrame(cards[i], frameIdx);
    }
}

// ============================
// PARTE 2: Demos de ataques
// ============================

const DW = 160;
const DH = 110;
const SUELO = 90;
const SPW = 48;
const SPH = 60;
const TAU = Math.PI * 2;

const demos = [];

function emitirPart(d, cfg) {
    if (d.parts.length >= 25) return;
    d.parts.push({
        x: cfg.x,
        y: cfg.y,
        vx: cfg.vx || 0,
        vy: cfg.vy || 0,
        vida: cfg.vida || 15,
        vidaMax: cfg.vida || 15,
        tam: cfg.tam || 2,
        r: cfg.r || 255,
        g: cfg.g || 255,
        b: cfg.b || 255,
        grav: cfg.grav || false,
    });
}

function crearDemoCard(contenedor, cfg) {
    const card = document.createElement('div');
    card.className = 'card';

    const canvas = document.createElement('canvas');
    canvas.width = DW;
    canvas.height = DH;

    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = cfg.nombre;

    // Selector de ataques con checkboxes
    const selector = document.createElement('div');
    selector.className = 'atk-selector';
    const checks = [];
    for (let i = 0; i < cfg.ataques.length; i++) {
        const a = cfg.ataques[i];
        const label = document.createElement('label');
        label.className = 'atk-check';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = true;
        const texto = document.createTextNode(a.nombre + ' (' + a.arq + ')');
        label.appendChild(cb);
        label.appendChild(texto);
        selector.appendChild(label);
        checks.push({ cb, label });
    }

    card.appendChild(canvas);
    card.appendChild(name);
    card.appendChild(selector);
    contenedor.appendChild(card);

    // Prevenir que se desmarquen todos
    for (let i = 0; i < checks.length; i++) {
        checks[i].cb.addEventListener('change', function () {
            let alguno = false;
            for (let j = 0; j < checks.length; j++) {
                if (checks[j].cb.checked) {
                    alguno = true;
                    break;
                }
            }
            if (!alguno) checks[i].cb.checked = true;
        });
    }

    const xInicio = cfg.ataques[0].arq === 'aoe' ? DW / 2 : 45;

    const d = {
        canvas,
        ctx: canvas.getContext('2d'),
        img: null,
        checks,
        ataques: cfg.ataques,
        atkIdx: 0,
        xInicio,
        // Estado
        fase: 'idle',
        timer: 30 + Math.floor(Math.random() * 30),
        sf: 0,
        st: 0,
        bx: xInicio,
        by: SUELO - SPH,
        byBase: SUELO - SPH,
        vy: 0,
        saltoX: 0,
        proy: null,
        zona: null,
        parts: [],
    };

    // Marcar el primer ataque como activo
    actualizarCheckActivo(d);

    cargarImagen(cfg.src)
        .then(function (img) {
            d.img = img;
        })
        .catch(function () {});

    demos.push(d);
}

function actualizarCheckActivo(d) {
    for (let i = 0; i < d.checks.length; i++) {
        d.checks[i].label.classList.toggle('playing', i === d.atkIdx);
    }
}

function resetearDemo(d) {
    // Buscar el siguiente ataque habilitado
    const total = d.ataques.length;
    let next = (d.atkIdx + 1) % total;
    for (let i = 0; i < total; i++) {
        if (d.checks[next].cb.checked) break;
        next = (next + 1) % total;
    }
    d.atkIdx = next;
    actualizarCheckActivo(d);

    const atk = d.ataques[d.atkIdx];
    d.xInicio = atk.arq === 'aoe' ? DW / 2 : 45;

    d.fase = 'idle';
    d.timer = 40;
    d.bx = d.xInicio;
    d.by = d.byBase;
    d.vy = 0;
    d.proy = null;
    d.zona = null;
    d.parts = [];
}

function ejecutarDemo(d) {
    const atk = d.ataques[d.atkIdx];
    const cx = d.bx;
    const cy = d.by + SPH / 2;

    switch (atk.arq) {
        case 'proyectil':
            d.proy = { x: cx + SPW / 2 + 4, y: cy, vx: 2.5, vy: 0, vida: 60 };
            d.timer = 0;
            break;
        case 'carga':
            d.timer = 35;
            break;
        case 'salto':
            d.vy = -5;
            d.saltoX = d.bx + 80;
            d.timer = 0;
            break;
        case 'aoe':
            d.zona = {
                cx: cx,
                cy: SUELO,
                radio: 40 * Math.min(atk.radio, 3),
                vida: 30,
                vidaMax: 30,
            };
            d.timer = 30;
            break;
    }
}

function actualizarEjecucion(d) {
    const atk = d.ataques[d.atkIdx];
    const rgb = hexARgb(atk.color);

    switch (atk.arq) {
        case 'proyectil':
            if (!d.proy) {
                d.fase = 'recuperacion';
                d.timer = 30;
            }
            break;

        case 'carga':
            d.bx += 3.5;
            d.timer--;
            if (Math.random() < 0.6) {
                emitirPart(d, {
                    x: d.bx - SPW / 2 + (Math.random() - 0.5) * 4,
                    y: SUELO + (Math.random() - 0.5) * 2,
                    vx: -0.5 - Math.random() * 0.3,
                    vy: -Math.random() * 0.5,
                    vida: 8 + Math.floor(Math.random() * 5),
                    tam: 1.5 + Math.random(),
                    r: rgb.r,
                    g: rgb.g,
                    b: rgb.b,
                });
            }
            if (d.timer <= 0 || d.bx > DW - 15) {
                d.fase = 'recuperacion';
                d.timer = 30;
            }
            break;

        case 'salto': {
            d.timer++;
            d.vy += 0.4;
            d.by += d.vy;
            const diff = d.saltoX - d.bx;
            d.bx += Math.min(Math.abs(diff), 2) * Math.sign(diff);

            if (d.timer > 5 && d.by >= d.byBase) {
                d.by = d.byBase;
                d.vy = 0;
                const r = 40 * Math.min(atk.radio, 3);
                d.zona = { cx: d.bx, cy: SUELO, radio: r, vida: 15, vidaMax: 15 };
                for (let i = 0; i < 8; i++) {
                    const ang = (i / 8) * TAU;
                    const vel = 1 + Math.random() * 1.5;
                    emitirPart(d, {
                        x: d.bx,
                        y: SUELO,
                        vx: Math.cos(ang) * vel,
                        vy: Math.sin(ang) * vel * 0.3 - 0.5,
                        vida: 12 + Math.floor(Math.random() * 8),
                        tam: 1.5 + Math.random() * 1.5,
                        r: rgb.r,
                        g: rgb.g,
                        b: rgb.b,
                        grav: true,
                    });
                }
                d.fase = 'recuperacion';
                d.timer = 30;
            }
            if (d.timer > 120) {
                d.fase = 'recuperacion';
                d.timer = 30;
            }
            break;
        }

        case 'aoe':
            d.timer--;
            if (d.timer <= 0) {
                d.fase = 'recuperacion';
                d.timer = 30;
            }
            break;
    }
}

function actualizarDemo(d) {
    const atk = d.ataques[d.atkIdx];

    d.st++;
    if (d.st >= 8) {
        d.st = 0;
        d.sf++;
    }

    // Partículas
    for (let i = d.parts.length - 1; i >= 0; i--) {
        const p = d.parts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.grav) p.vy += 0.15;
        p.vida--;
        if (p.vida <= 0) d.parts.splice(i, 1);
    }

    // Proyectil
    if (d.proy) {
        d.proy.x += d.proy.vx;
        d.proy.vida--;
        if (Math.random() < 0.5) {
            const rgb = hexARgb(atk.color);
            emitirPart(d, {
                x: d.proy.x + (Math.random() - 0.5) * 3,
                y: d.proy.y + (Math.random() - 0.5) * 3,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                vida: 8 + Math.floor(Math.random() * 5),
                tam: 1.5 + Math.random(),
                r: rgb.r,
                g: rgb.g,
                b: rgb.b,
            });
        }
        if (d.proy.vida <= 0 || d.proy.x > DW + 10) d.proy = null;
    }

    // Zona
    if (d.zona) {
        d.zona.vida--;
        if (d.zona.vida <= 0) d.zona = null;
    }

    // Máquina de estados
    switch (d.fase) {
        case 'idle':
            d.timer--;
            if (d.timer <= 0) {
                d.fase = 'telegrafo';
                d.timer = 45;
            }
            break;

        case 'telegrafo': {
            const rgb = hexARgb(atk.color);
            if (Math.random() > 0.6) {
                const ang = Math.random() * TAU;
                const dist = SPH * 0.6 + Math.random() * 4;
                emitirPart(d, {
                    x: d.bx + Math.cos(ang) * dist,
                    y: d.by + SPH / 2 + Math.sin(ang) * dist,
                    vx: Math.cos(ang) * 0.5,
                    vy: Math.sin(ang) * 0.5 - 0.3,
                    vida: 10 + Math.floor(Math.random() * 8),
                    tam: 1.5 + Math.random(),
                    r: rgb.r,
                    g: rgb.g,
                    b: rgb.b,
                });
            }
            d.timer--;
            if (d.timer <= 0) {
                d.fase = 'ejecutando';
                ejecutarDemo(d);
            }
            break;
        }

        case 'ejecutando':
            actualizarEjecucion(d);
            break;

        case 'recuperacion':
            d.timer--;
            if (d.timer <= 0) resetearDemo(d);
            break;
    }
}

function renderizarDemo(d) {
    const ctx = d.ctx;
    const atk = d.ataques[d.atkIdx];

    // Fondo + suelo
    ctx.fillStyle = '#0a0a16';
    ctx.fillRect(0, 0, DW, DH);
    ctx.fillStyle = '#2a2a5e';
    ctx.fillRect(0, SUELO, DW, DH - SUELO);
    ctx.fillStyle = '#3a3a7e';
    ctx.fillRect(0, SUELO, DW, 2);

    // Zona de daño
    if (d.zona) {
        const z = d.zona;
        const ratio = z.vida / z.vidaMax;
        const rAct = z.radio * (0.7 + (1 - ratio) * 0.3);
        ctx.strokeStyle = atk.color;
        ctx.globalAlpha = ratio * 0.6;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(z.cx, z.cy, rAct, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = ratio * 0.12;
        ctx.beginPath();
        ctx.arc(z.cx, z.cy, rAct, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Sprite del personaje
    const drawX = d.bx - SPW / 2;
    const drawY = d.by;
    let sprFrame;
    if (d.fase === 'telegrafo' || d.fase === 'ejecutando') {
        sprFrame = d.atkIdx === 0 ? 11 + (d.sf % 2) : 13 + (d.sf % 2);
    } else {
        sprFrame = d.sf % 2;
    }
    if (d.img) {
        ctx.drawImage(d.img, sprFrame * FW, 0, FW, FH, drawX, drawY, SPW, SPH);
    } else {
        ctx.fillStyle = '#bb86fc';
        ctx.fillRect(drawX, drawY, SPW, SPH);
    }

    // Telégrafo: pulso + "!"
    if (d.fase === 'telegrafo') {
        const cx = d.bx;
        const cy = d.by + SPH / 2;
        const pulso = Math.sin(d.timer * 0.3) * 0.5 + 0.5;
        const radio = SPH * 0.7;
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = pulso * 0.25;
        ctx.beginPath();
        ctx.arc(cx, cy, radio, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;

        const rgb = hexARgb(atk.color);
        ctx.fillStyle =
            'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + (0.5 + pulso * 0.5) + ')';
        ctx.fillRect(cx - 1, drawY - 10, 2, 4);
        ctx.fillRect(cx - 1, drawY - 4, 2, 2);
    }

    // Proyectil: halo + núcleo
    if (d.proy) {
        const p = d.proy;
        ctx.fillStyle = atk.sec;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = atk.color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // Partículas
    for (let i = 0; i < d.parts.length; i++) {
        const p = d.parts[i];
        const ratio = p.vida / p.vidaMax;
        const a = ((ratio * 100 + 0.5) | 0) * 0.01;
        ctx.fillStyle = 'rgba(' + p.r + ',' + p.g + ',' + p.b + ',' + a + ')';
        ctx.fillRect(p.x - p.tam / 2, p.y - p.tam / 2, p.tam, p.tam);
    }
}

// ============================
// PARTE 3: Loop e init
// ============================

function tick() {
    actualizarShowcase();
    for (let i = 0; i < demos.length; i++) {
        actualizarDemo(demos[i]);
        renderizarDemo(demos[i]);
    }
    requestAnimationFrame(tick);
}

function init() {
    const heroesGrid = document.getElementById('heroes');
    const villanosGrid = document.getElementById('villanos');
    for (let i = 0; i < HEROES.length; i++) crearCard(heroesGrid, HEROES[i]);
    for (let i = 0; i < VILLANOS.length; i++) crearCard(villanosGrid, VILLANOS[i]);

    crearBotones();

    // Demos de ataques (reusan los mismos arrays)
    const demosHeroes = document.getElementById('demosHeroes');
    for (let i = 0; i < HEROES.length; i++) crearDemoCard(demosHeroes, HEROES[i]);
    const demosVillanos = document.getElementById('demosVillanos');
    for (let i = 0; i < VILLANOS.length; i++) crearDemoCard(demosVillanos, VILLANOS[i]);

    aplicarZoom();

    // Controles
    document.getElementById('speed').addEventListener('input', function (e) {
        velocidad = parseFloat(e.target.value);
    });
    document.getElementById('zoom').addEventListener('input', function (e) {
        zoom = parseInt(e.target.value, 10);
        aplicarZoom();
    });
    document.getElementById('flip').addEventListener('change', function (e) {
        flip = e.target.checked;
    });

    requestAnimationFrame(tick);
}

init();
