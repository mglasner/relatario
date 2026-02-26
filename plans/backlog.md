# Backlog de Features — El Relatario

> Ideas de features entretenidas para agregar, ordenadas por dificultad de implementacion.

| # | Feature | Dificultad | Requiere | Estado |
|---|---------|-----------|----------|--------|
| 1 | [Cuartos secretos en El Laberinto](#1-cuartos-secretos-en-el-laberinto) | Baja | — | [x] |
| 2 | [Sistema de logros con medallas](#2-sistema-de-logros-con-medallas) | Baja | #14 | 🔒 |
| 3 | [Power-ups en El Abismo](#3-power-ups-coleccionables-en-el-abismo) | Media-Baja | — | [ ] |
| 4 | [Niveles de dificultad en El Memorice](#4-niveles-de-dificultad-en-el-memorice) | Media-Baja | — | [x] |
| 5 | [Efectos climaticos en los juegos](#5-efectos-climaticos-en-los-juegos) | Media-Baja | — | [x] |
| 6 | [Diario de aventuras (stats y records)](#6-diario-de-aventuras-stats-y-records) | Media | #14 | 🔒 |
| 7 | [Enemigos con habilidades especiales](#7-enemigos-con-habilidades-especiales-en-el-laberinto) | Media | — | [ ] |
| 8 | [Modo Boss Rush](#8-modo-boss-rush) | Media | — | [ ] |
| 9 | [Mascotas acompanantes](#9-mascotas-acompanantes) | Media-Alta | — | [ ] |
| 10 | [Editor de niveles para El Abismo](#10-editor-de-niveles-para-el-abismo) | Alta | — | [ ] |
| 11 | [Ajedrez local (heroes vs villanos)](#11-ajedrez-local-heroes-vs-villanos) | Alta | — | [x] |
| 12 | [Modo Historia / Campana](#12-modo-historia-cooperativo-campana) | Muy Alta | — | [ ] |
| 13 | [Multijugador online (turnos)](#13-multijugador-online-para-juegos-por-turnos) | Alta | #11, #4 | [ ] |
| 14 | [Sistema de autenticacion y backend](#14-sistema-de-autenticacion-y-backend) | Muy Alta | — | [ ] |
| 15 | [Fix deteccion de stomp en El Abismo](#15-fix-deteccion-de-stomp-en-el-abismo) | Baja | — | [x] |
| 16 | [Particulas con colision al suelo en El Abismo](#16-particulas-con-colision-al-suelo-en-el-abismo) | Baja | — | [x] |
| 17 | [Salto variable (jump cut) en El Abismo](#17-salto-variable-jump-cut-en-el-abismo) | Media-Baja | — | [x] |
| 18 | [Esbirros con patron diferenciado en El Abismo](#18-esbirros-con-patron-diferenciado-en-el-abismo) | Media-Baja | — | [x] |
| 19 | [Rediseno del mapa con rutas alternativas en El Abismo](#19-rediseno-del-mapa-con-rutas-alternativas-en-el-abismo) | Media-Baja | — | [x] |
| 20 | [Boss con patrones de ataque en El Abismo](#20-boss-con-patrones-de-ataque-en-el-abismo) | Media | — | [x] |
| 21 | [Generacion procedural de secciones en El Abismo](#21-generacion-procedural-de-secciones-en-el-abismo) | Media | — | [ ] |
| 22 | [Archienemigos: rivalidades narrativas en los juegos](#22-archienemigos-rivalidades-narrativas-en-los-juegos) | Media | — | [ ] |

---

## 1. Cuartos secretos en El Laberinto

**Dificultad: Baja** | Archivos: `js/juegos/laberinto/index.js`, `datos/laberinto.yaml`

Agregar 1-2 habitaciones secretas ocultas detras de paredes que se ven ligeramente distintas (un tile mas claro). Al caminar contra ellas durante 2 segundos, la pared se abre revelando un cuarto con un tesoro bonus o curacion. El generador procedural ya usa DFS — solo necesita reservar un dead-end, marcar la pared adyacente como "falsa" y colocar un item adentro.

**Por que es divertido**: Los ninos aman los secretos. Genera la costumbre de explorar cada rincon en vez de correr directo a la llave.

---

## 2. Sistema de logros con medallas

**Dificultad: Baja** | Archivos nuevos: `js/componentes/libroLogros.js`, `datos/logros.yaml`

Un nuevo libro en el estante: "El Medallero". Contiene ~20 logros desbloqueables con medallas de bronce/plata/oro. Ejemplos:

- "Velocista" — ganar El Laberinto en menos de 60 segundos
- "Memoria perfecta" — ganar El Memorice sin fallar un par
- "Sin dano" — completar El Abismo sin perder vida
- "Coleccionista" — encontrar 5 tesoros
- "Ajedrecista" — ganar en dificultad 3

Se persisten en `localStorage` igual que los tesoros. Cada logro muestra una medalla animada al desbloquearse (reutilizando el sistema de `modalTesoro.js`).

**Por que es divertido**: Da razones para rejugar cada juego con objetivos diferentes. Los ninos compiten entre hermanos por quien tiene mas medallas.

---

## 3. Power-ups coleccionables en El Abismo

**Dificultad: Media-Baja** | Archivos: `js/juegos/abismo/`, `datos/abismo.yaml`

Objetos flotantes que aparecen en plataformas durante el nivel:

- **Escudo magico** (burbuja azul) — absorbe 1 golpe, dura 10 segundos
- **Botas de viento** (icono verde) — doble salto durante 8 segundos
- **Estrella fugaz** (destello dorado) — invulnerabilidad + velocidad x1.5 por 5 segundos

Se colocan en tiles tipo `SPAWN_POWERUP` (nuevo tipo 8). El sistema de particulas existente ya puede hacer el efecto visual de recogerlos. Requiere agregar un array de power-ups activos al estado del jugador y timers de expiracion.

**Por que es divertido**: El Abismo es el juego mas dificil — los power-ups lo hacen mas accesible para los mas chicos sin bajar la dificultad base.

---

## 4. Niveles de dificultad en El Memorice

**Dificultad: Media-Baja** | Archivos: `js/juegos/memorice/index.js`, `datos/memorice.yaml`, `css/juegos/memorice.css`

Tres modos de dificultad seleccionables antes de iniciar la partida:

- **Facil**: igual que el modo actual, pero con efecto climatico de relampagos (ver item 5) que revela todas las cartas brevemente con ~20% de probabilidad cada turno. Ideal para los mas chicos
- **Normal**: el modo actual (4x5, 30 intentos, sin ayudas)
- **Dificil**: despues de cada par encontrado, las cartas restantes se reordenan aleatoriamente en sus posiciones. La memoria ya no sirve — hay que encontrar pares rapido antes de que se mezclen

El selector de dificultad puede ser un grupo de 3 botones debajo del selector de heroe en la pagina del Memorice dentro del Libro de Juegos. La dificultad elegida se pasa como parametro al iniciar el juego.

**Por que es divertido**: El modo facil permite que ninos mas chicos disfruten sin frustrarse. El modo dificil es un desafio genuino incluso para adultos — la mezcla post-par convierte el memorice en un juego de velocidad y suerte.

---

## 5. Efectos climaticos en los juegos

**Dificultad: Media-Baja** | Archivos: `js/juegos/*/renderer.js` o nuevos modulos de clima

Sistema de clima aleatorio que afecta visualmente (y opcionalmente mecanicamente) cada partida:

- **Laberinto**: niebla que reduce visibilidad a ~3 tiles alrededor del jugador
- **Laberinto 3D**: antorchas parpadean mas (viento), particulas de polvo flotan
- **Abismo**: lluvia con gotas en canvas + viento lateral leve que afecta saltos
- **Memorice**: relampagos que brevemente iluminan todas las cartas (micro-pista)

Se elige aleatoriamente al iniciar cada partida (~30% probabilidad de clima especial). Es puramente visual en la mayoria de los casos — usa el sistema de particulas existente.

**Por que es divertido**: Cada partida se siente diferente. "Me toco con lluvia!" genera conversacion.

---

## 6. Diario de aventuras (stats y records)

**Dificultad: Media** | Archivos nuevos: `js/componentes/libroDiario.js`, almacenamiento en `localStorage`

Un libro "El Diario" en el estante que registra estadisticas del jugador:

- **Records por juego**: tiempo mas rapido, menos intentos, mayor vida al ganar
- **Estadisticas globales**: partidas jugadas, victorias, derrotas, heroe favorito
- **Historial**: ultimas 10 partidas con heroe usado, juego, resultado
- **Racha**: victorias consecutivas actual y record

Cada juego al terminar llama `registrarPartida({ juego, heroe, resultado, tiempo, vidaFinal })`. El diario muestra todo con graficos simples (barras CSS, no necesita canvas).

**Por que es divertido**: Los ninos adoran las estadisticas. "Llevo 7 victorias seguidas con Orejas" genera orgullo y motivacion.

---

## 7. Enemigos con habilidades especiales en El Laberinto

**Dificultad: Media** | Archivos: `js/juegos/laberinto/index.js`, `datos/enemigos.yaml`, `datos/laberinto.yaml`

En vez de que los esbirros solo persigan, cada tipo de enemigo tendria una habilidad unica:

- **Trasgo**: se vuelve invisible por 3 segundos (solo se ve su sombra), reaparece cerca
- **Topete**: deja trampas pegajosas al caminar (ralentizan como las telaranas actuales)
- **Pototo**: se divide en 2 mini-versiones al recibir dano (mas lentas, menos vida)

El elite tambien cambiaria:

- **Siniestra**: deja un rastro de fuego temporal por donde camina
- **El Errante**: teletransporta al jugador a un tile aleatorio al tocarlo (en vez de dano)

Requiere extender la IA de pathfinding con comportamientos por tipo y agregar los efectos visuales.

**Por que es divertido**: Cambia la estrategia de "huir de todo" a "cada enemigo es un puzzle diferente".

---

## 8. Modo Boss Rush

**Dificultad: Media** | Archivos: `js/juegos/bossrush/index.js` (nuevo), `datos/bossrush.yaml`

Un 6to juego en el Libro de Juegos: enfrentar a los 5 villanos elite en secuencia sin recuperar toda la vida entre rondas (solo +10% entre peleas). Cada pelea es una arena cerrada estilo Abismo (plataforma plana + boss). La dificultad escala: velocidad base del boss sube un 10% por ronda.

Reutiliza el motor del Abismo (`fisicas.js`, `renderer.js`, colisiones) pero con un mapa mini-arena hardcodeado. Al ganar las 5 rondas, se desbloquea un tesoro exclusivo ("Corona del Campeon").

**Por que es divertido**: Es el modo "hardcore" para cuando ya dominan los juegos individuales. Combina la tension de El Abismo con la resistencia de un maraton.

---

## 9. Mascotas acompanantes

**Dificultad: Media-Alta** | Archivos: `datos/mascotas.yaml` (nuevo), multiples juegos

Cada heroe puede elegir una mascota antes de jugar (gato, buho, hada, dragoncito). La mascota aparece siguiendo al jugador en El Laberinto y El Abismo con un efecto visual simple (sprite pequeno que flota cerca). Cada mascota da un bonus pasivo:

- **Gato**: detecta trampas cercanas (parpadea en rojo)
- **Buho**: ilumina mas area en Laberinto 3D
- **Hada**: regenera 1 HP cada 30 segundos
- **Dragoncito**: ahuyenta al primer esbirro que se acerque (1 uso por partida)

Se seleccionan en el modal de seleccion de heroe del Libro de Juegos (nueva fila de iconos debajo de los avatares).

**Por que es divertido**: Los ninos aman las mascotas. Agrega otra capa de personalizacion y estrategia a la seleccion pre-juego.

---

## 10. Editor de niveles para El Abismo

**Dificultad: Alta** | Archivos nuevos: `js/juegos/abismo/editor.js`, `js/componentes/libroNiveles.js`

Un editor visual de niveles donde el jugador coloca tiles arrastrando en una grilla:

- Paleta lateral con: suelo, plataforma, abismo, spawn jugador/enemigo/boss, meta
- Grilla visual del tamano del canvas (30x17 tiles)
- Boton "Probar" que lanza el nivel directamente
- Guardar/cargar en `localStorage` (maximo 5 niveles custom)
- Nuevo libro "Mis Niveles" en el estante inferior para acceder a los niveles guardados

Reutiliza todo el motor existente del Abismo — el editor solo genera el array `mapa[][]` que ya consume el juego. La complejidad esta en la UI del editor (drag-and-drop, touch support, validacion de que el nivel es completable).

**Por que es divertido**: Pasa de consumir contenido a crearlo. Los hermanos pueden disenar niveles para desafiar al otro.

---

## 11. Ajedrez local (heroes vs villanos)

**Dificultad: Alta** | Archivos nuevos: `js/juegos/ajedrez/index.js`, `js/juegos/ajedrez/tablero.js`, `js/juegos/ajedrez/reglas.js`, `js/juegos/ajedrez/ia.js`, `css/juegos/ajedrez.css`, `datos/ajedrez.yaml`

Un 6to juego en el Libro de Juegos: ajedrez tematico con piezas de heroes vs villanos. Dos modos de juego seleccionables al iniciar:

### Modos de juego

- **Heroes vs Villanos (IA)**: el jugador controla los heroes y la IA controla los villanos. Dificultad ajustable (profundidad del minimax o similar)
- **Heroe Humano vs Villano Humano**: dos jugadores en el mismo dispositivo (hot-seat). Al cambiar de turno se muestra un overlay "Turno de Heroes" / "Turno de Villanos" para que el otro jugador tome el dispositivo

### Mecanicas

- **Piezas tematizadas**: cada pieza de ajedrez corresponde a un personaje. Los peones son esbirros, las torres son heroes/villanos tanque, los alfiles son magicos, los caballos son agiles, la reina es el elite, el rey es el lider del equipo
- **Tablero visual**: tablero 8x8 con estetica de El Relatario (colores del equipo de cada bando), piezas como avatares miniatura de los personajes
- **Reglas completas**: movimientos legales, enroque, captura al paso, promocion de peon, jaque y jaque mate. Se puede implementar con una libreria ligera de validacion o desde cero
- **Touch + mouse**: drag-and-drop para mover piezas, con highlight de movimientos legales al seleccionar una pieza

Se integra como una pagina mas del Libro de Juegos. El selector de modo (IA vs 1v1) aparece en el modal de seleccion antes de jugar, similar al selector de dificultad del Memorice.

**Por que es divertido**: Es el primer juego con opcion de 2 jugadores de El Relatario. Contra la IA es un desafio estrategico individual; en 1v1 los hermanos se enfrentan directamente, cada uno con "su equipo". Convierte personajes conocidos en piezas estrategicas.

---

## 12. Modo Historia cooperativo (campana)

**Dificultad: Muy Alta** | Archivos nuevos: `js/campana/`, `datos/campana.yaml`, multiples cuentos

Una campana narrativa que conecta los 5 juegos en una historia secuencial:

- **Estructura**: 5 capitulos, cada uno con un prologo narrativo (cuento) + un juego obligatorio + un epilogo
- **Progresion**: el heroe elegido al inicio se mantiene durante toda la campana, la vida persiste entre juegos (con curacion parcial entre capitulos)
- **Narrativa**: cada capitulo presenta un villano, explica por que esta causando problemas, y el juego correspondiente es la confrontacion
- **Desbloqueo**: completar la campana desbloquea un final especial en el estante (nuevo cuento "El Epilogo") y un tesoro mitico exclusivo
- **Dificultad adaptativa**: si el jugador pierde 3 veces en un capitulo, ofrece bajar la dificultad

Requiere un sistema de progresion persistente, integracion con el sistema de cuentos, cutscenes entre juegos, y balanceo de la dificultad a lo largo de ~45 minutos de juego.

**Por que es divertido**: Transforma 5 juegos independientes en una aventura epica con inicio, desarrollo y final. Es "el modo" para jugar en familia un sabado por la tarde.

---

## 13. Multijugador online para juegos por turnos

**Dificultad: Alta** | Archivos: `js/juegos/ajedrez/online.js` (nuevo), `js/juegos/memorice/online.js` (nuevo), `js/componentes/salaOnline.js` (nuevo)

Sistema multijugador para 2 jugadores en dispositivos distintos, enfocado en juegos por turnos. Sin backend propio: usa Firebase Realtime Database como relay (gratis hasta 100 conexiones simultaneas, SDK client-side compatible con GitHub Pages).

### Prerequisitos

- Ajedrez local completado (#11) [x]
- Niveles de dificultad en Memorice completado (#4) [x]

### Arquitectura

- **Infraestructura**: Firebase Realtime Database (BaaS). Sin servidor propio, sin cambios al hosting en GitHub Pages. El SDK de Firebase (~50KB) se consume directamente desde el cliente
- **Matchmaking**: codigo de sala de 4 letras. Jugador A crea sala → recibe codigo → lo comparte → Jugador B ingresa codigo → conectados. Sin cuentas, sin lobby, sin autenticacion
- **Sincronizacion**: solo se envian acciones/movimientos (~50 bytes por mensaje, cada varios segundos). Ambos clientes tienen la logica completa del juego y aplican las acciones recibidas. No se sincroniza estado completo
- **Reconexion**: si un jugador se desconecta, 60 segundos para reconectarse antes de perder por abandono
- **Latencia**: tolerancia alta (500ms+ esta bien para turnos)

### Fase 1: Ajedrez online

El ajedrez local ya tiene toda la logica de reglas, tablero y renderizado. Solo falta la capa de red:

- **Nuevo modo**: "Online" como tercera opcion junto a "vs IA" y "vs Humano" en el selector de modo
- **Sala**: UI para crear/unirse a sala con codigo de 4 letras
- **Perspectiva**: cada jugador ve el tablero desde su lado (heroes abajo)
- **Sincronizacion**: enviar movimiento (`{desde: "e2", hasta: "e4"}`) al otro jugador via Firebase
- **Turno**: indicador claro de "Tu turno" / "Esperando rival..."
- **Fin de partida**: jaque mate, tablas, abandono o timeout por desconexion

### Fase 2: Memorice cooperativo online

Reutiliza toda la infraestructura Firebase de Fase 1:

- **Modo cooperativo**: ambos jugadores ven el mismo tablero y se turnan volteando cartas
- **Sincronizacion**: enviar accion (`{tipo: "voltear", carta: 7}`) al otro jugador
- **Turnos compartidos**: los intentos se comparten (ambos contribuyen al limite de 25)
- **Victoria conjunta**: ambos ganan si completan todos los pares

### Componente compartido: sala online

`js/componentes/salaOnline.js` — modulo reutilizable para cualquier juego por turnos:

- Crear sala (generar codigo, registrar en Firebase)
- Unirse a sala (validar codigo, conectar)
- Enviar/recibir acciones (pub/sub sobre la sala)
- Detectar desconexion (heartbeat)
- UI de espera ("Esperando rival...")

**Por que es divertido**: "Te mando el codigo y jugamos" — permite jugar con primos, amigos o familiares que no estan en la misma casa. Es la primera experiencia social de El Relatario, sin friccion de cuentas ni instalacion.

---

## 14. Sistema de autenticacion y backend

**Dificultad: Muy Alta** | Archivos nuevos: backend completo, migracion de `localStorage`

Infraestructura para que los datos del jugador (tesoros, logros, stats, niveles custom) persistan entre dispositivos y no se pierdan al borrar cache.

- **Autenticacion**: login simple con Google/GitHub OAuth (familiar para padres). Opcionalmente un modo "perfil local" sin cuenta para mantener la experiencia actual sin friccion
- **Backend**: API REST o serverless functions (Supabase, Firebase, o Node.js propio) con base de datos para almacenar perfiles de jugador
- **Migracion**: al crear cuenta, ofrecer importar los datos existentes de `localStorage` al perfil en la nube
- **Perfiles familiares**: una cuenta padre puede tener multiples perfiles hijos (cada hermano con su propio progreso)
- **Sincronizacion**: al iniciar sesion en otro dispositivo, se descargan los datos del jugador. Conflictos se resuelven con "el dato mas reciente gana"
- **Fallback offline**: si no hay conexion, se usa `localStorage` como cache y se sincroniza al reconectar

Este item es prerequisito para features sociales futuras (rankings, compartir niveles, ajedrez con cuenta) y habilita persistencia real de progreso.

**Por que es divertido**: "No importa si papa formatea el computador — mis tesoros estan guardados". Tambien permite jugar en el tablet de la abuela y tener el mismo progreso.

---

## 15. Fix deteccion de stomp en El Abismo

**Dificultad: Baja** | Archivos: `js/juegos/abismo/index.js`, `datos/abismo.yaml`

La deteccion de stomp (saltar sobre enemigos) usa un margen fijo de 2px para decidir si el jugador cayo encima o choco de lado. Con personajes de distinta estatura (hitbox de 6 a 20px de alto) ese margen es muy restrictivo y causa stomps fallidos que registran como golpe lateral.

- **Margen proporcional**: cambiar de `stompMargen: 2` fijo a un porcentaje del alto del enemigo (~30%), garantizando consistencia independiente de la estatura
- **Zona de stomp visual**: opcionalmente mostrar un breve destello en la cabeza del enemigo cuando el jugador esta en rango de stomp valido
- **Tolerancia de velocidad**: relajar `stompVyMin` (actualmente 2 px/frame) para personajes mas lentos que caen con menos velocidad

**Por que es importante**: Elimina frustracion. El jugador siente que hizo bien el salto pero recibe dano — es injusto.

---

## 16. Particulas con colision al suelo en El Abismo

**Dificultad: Baja** | Archivos: `js/juegos/abismo/particulas.js`, `js/juegos/abismo/fisicas.js`

Las particulas de tipo chispa (stomp) y fragmento (muerte de enemigo) caen al vacio atravesando los tiles solidos. Deberian rebotar o detenerse al tocar el suelo.

- **Check de colision**: en el update de cada particula con gravedad, verificar `esSolido(x, y)` antes de mover
- **Rebote**: al colisionar, invertir `vy *= -0.4` (rebote amortiguado) y aplicar friccion `vx *= 0.7`
- **Limite de rebotes**: despues de 2 rebotes, la particula se queda quieta y desvanece (reducir vida restante)

**Por que es importante**: Las particulas que respetan la fisica del mundo se sienten muchisimo mejor. Es un polish pequeno con impacto visual grande.

---

## 17. Salto variable (jump cut) en El Abismo

**Dificultad: Media-Baja** | Archivos: `js/juegos/abismo/jugadorPlat.js`, `datos/abismo.yaml`

Actualmente el salto es fijo: siempre sube la misma altura (-7.5 px/frame). El jump cut permite saltos cortos y largos segun cuanto tiempo se mantiene presionado el boton.

- **Mecanica**: si el jugador suelta ArrowUp mientras `vy < 0` (subiendo), aplicar `vy *= jumpCutFactor` (ej: 0.4) para frenar la subida
- **Parametro YAML**: `jumpCutFactor: 0.4` configurable en `datos/abismo.yaml`
- **Resultado**: tap rapido = salto bajo para plataformas cercanas, mantener = salto completo para huecos grandes

**Por que es importante**: Es una mecanica estandar en platformers modernos (Celeste, Hollow Knight, Mario). Da al jugador control fino sobre la altura del salto, lo que hace el movimiento mas expresivo y preciso.

---

## 18. Esbirros con patron diferenciado en El Abismo

**Dificultad: Media-Baja** | Archivos: `js/juegos/abismo/enemigoPlat.js`, `datos/abismo.yaml`

Los 3 esbirros del nivel son identicos: patrullan horizontalmente y giran al chocar con paredes o precipicios. Darle un patron distinto a cada uno segun su indice de spawn.

- **Esbirro 1 (patrullero)**: el actual, camina de lado a lado. Es el mas predecible y facil
- **Esbirro 2 (saltarin)**: patrulla pero salta periodicamente cada ~90 frames. El salto lo hace impredecible y dificil de stompar
- **Esbirro 3 (centinela)**: camina, se detiene 60 frames (mira alrededor), y reanuda en direccion aleatoria. Requiere paciencia

Cada patron se selecciona por indice de spawn (no aleatorio) para que la curva de dificultad sea consistente.

**Por que es importante**: Variedad en enemigos hace que cada seccion del nivel se sienta diferente y requiera estrategias distintas.

---

## 19. Rediseno del mapa con rutas alternativas en El Abismo

**Dificultad: Media-Baja** | Archivos: `js/juegos/abismo/nivel.js`

El mapa actual es completamente lineal: una sola ruta de izquierda a derecha sin decisiones. Agregar caminos altos (plataformas) y bajos (suelo) en cada seccion.

- **Ruta alta**: mas plataformas y saltos de precision, permite esquivar enemigos por arriba. Mas rapida pero arriesgada (caida = dano o volver abajo)
- **Ruta baja**: suelo con enemigos, mas segura pero mas lenta y con mas combate
- **Reconexion**: ambas rutas se juntan antes de cada seccion nueva, para que el jugador pueda cambiar de estrategia
- **Secretos**: tiles ocultos en la ruta alta con items de curacion (preparacion para power-ups futuros)

Solo requiere editar el array `mapa[][]` en `nivel.js`. No necesita cambios en el motor.

**Por que es importante**: Rutas alternativas dan rejugabilidad ("esta vez voy por arriba") y permiten que jugadores de distintos niveles completen el juego con estrategias diferentes.

---

## 20. Boss con patrones de ataque en El Abismo

**Dificultad: Media** | Archivos: `js/juegos/abismo/enemigoPlat.js`, `js/juegos/abismo/index.js`, `datos/abismo.yaml`

El boss actual solo patrulla y hace dano por contacto — es anticlimático para un jefe final. Darle ataques telegrafados por fase:

- **Fase 1 (>66% HP) — Embestida**: se detiene, parpadea rojo 30 frames (telegrafeo), y carga horizontalmente al doble de velocidad durante 60 frames. El jugador debe saltar para esquivar
- **Fase 2 (33-66% HP) — Salto aplastante**: salta alto y cae con fuerza generando una onda expansiva (particulas + dano en area de 2 tiles a cada lado del impacto). El jugador debe alejarse del punto de caida
- **Fase 3 (<33% HP) — Invocacion**: invoca 1 mini-esbirro temporal (vida baja, desaparece en 10 segundos). Maximo 1 invocado a la vez. Combina con embestida

Cada ataque tiene un cooldown y se alterna con la patrulla normal. Los ataques se telegrafean visualmente para que el jugador pueda reaccionar.

**Por que es importante**: Un boss memorable es el climax del juego. Patrones telegrafados ensenan al jugador a observar, esquivar y buscar ventanas de ataque — la esencia de un buen platformer.

---

## 21. Generacion procedural de secciones en El Abismo

**Dificultad: Media** | Archivos: `js/juegos/abismo/nivel.js`, `datos/abismo.yaml`

Reemplazar el mapa hardcodeado por un sistema de secciones modulares que se ensamblan aleatoriamente.

- **Secciones prefabricadas**: definir ~10-12 bloques de ~15 tiles de ancho cada uno, con dificultad etiquetada (facil, media, dificil)
- **Ensamblaje**: al iniciar partida, seleccionar N secciones con dificultad progresiva (2 faciles → 2 medias → 1 dificil → boss arena → meta)
- **Conectores**: cada seccion tiene una "entrada" (izquierda) y "salida" (derecha) a la misma altura para que encajen
- **Spawns dinamicos**: los puntos de spawn de enemigos estan definidos dentro de cada seccion, no globalmente
- **Semilla opcional**: guardar la semilla para poder compartir niveles ("prueba la semilla 4521")

**Por que es importante**: Cada partida es un nivel diferente, lo que multiplica la rejugabilidad drasticamente. "A ver que me toca hoy" genera expectativa.

---

## 22. Archienemigos: rivalidades narrativas en los juegos

**Dificultad: Media** | Archivos: `datos/personajes.yaml`, `datos/enemigos.yaml`, `js/juegos/*/`, `css/juegos/comun.css`

Cuando un heroe se encuentra con su archienemigo en cualquier juego, ambos se reconocen con un efecto visual dramatico y el villano gana un buff temporal. Las rivalidades surgen de las historias de los personajes.

### Pares de archienemigos (confirmados por el lore)

Definidos en los YAML con un campo `archienemigo` que referencia al rival:

| Heroe | Villano | Relacion narrativa |
|-------|---------|-------------------|
| Rose | La Grotesca | Grotesca era "Bella Estrella" hasta que Rose la vencio en tela aerea. Rivalidad de circo |
| Lina | El Disonante | El Disonante odia el K-pop y afino su arco al saber que Lina entro a El Relatario. Rivalidad musical |
| DonBu | Pototo | Padre vs hija rebelde mayor. Travesura vs autoridad |
| DonBu | Topete | Padre vs hija rebelde menor. Berrinches vs paciencia |

Se pueden agregar mas pares a futuro conforme se creen las historias que los conecten.

### Deteccion del encuentro

Al iniciar cualquier juego, verificar si el heroe elegido tiene archienemigo y si ese enemigo esta presente en la partida (los enemigos se asignan aleatoriamente, asi que el encuentro es un evento raro y especial). Al detectarse:

1. **Toast narrativo**: mensaje tematico del encuentro (ej: "¡La Grotesca reconoce a Rose! Su furia se desata...")
2. **Efecto visual**: resplandor rojo pulsante en el villano + resplandor verde en el heroe, duracion ~3 segundos
3. **Buff al villano**: +25% velocidad y +20% dano durante toda la partida (la furia lo potencia)
4. **Buff al heroe** (opcional): +10% velocidad (la motivacion lo impulsa) o ningun buff (para que el encuentro sea un desafio extra)

### Efectos por juego

- **El Abismo**: al aparecer el esbirro/boss archienemigo, pausa breve + efecto visual + toast. El enemigo tiene aura roja permanente sutil como recordatorio
- **El Laberinto**: al entrar en rango de vision del archienemigo, efecto visual + toast. El enemigo persigue con mas determinacion (velocidad boosteada)
- **El Memorice**: al voltear la carta del archienemigo, flash rojo en la carta + toast. Las cartas del archienemigo se mezclan con mas frecuencia (si dificultad dificil) o se revelan menos tiempo (modo relampago)
- **El Ajedrez**: al capturar una pieza archienemiga, animacion especial de confrontacion. Puramente estetico

### Efecto visual (resplandor)

Aura pulsante usando canvas para los juegos de canvas (Abismo, Laberinto) y CSS `box-shadow` animado para los juegos DOM (Memorice, Ajedrez):

- **Villano**: `box-shadow: 0 0 20px rgba(255, 50, 50, 0.8)` pulsando, color rojo furia
- **Heroe**: `box-shadow: 0 0 20px rgba(50, 255, 100, 0.8)` pulsando, color verde determinacion
- En canvas: dibujar circulo con gradiente radial detras del sprite, opacidad oscilante via `Math.sin(frame * 0.1)`

### Datos YAML

```yaml
# personajes.yaml
Rose:
    archienemigo: La Grotesca
    # ...resto de campos existentes

# enemigos.yaml
La Grotesca:
    archienemigo: Rose
    # ...resto de campos existentes
```

El campo es bidireccional (ambos referencian al otro) para busquedas rapidas desde cualquier lado. `build-datos.js` valida que las referencias sean consistentes.

### Caso especial: DonBu y sus hijas

DonBu tiene DOS archienemigas (Pototo y Topete). El campo puede ser un array:

```yaml
DonBu:
    archienemigo: [Pototo, Topete]
```

El tono del encuentro es distinto: no es furia sino exasperacion paterna. El toast podria ser: "¡DonBu ve a Pototo! Suspira profundo..." y en vez de aura roja, Pototo/Topete tienen aura morada (travesura). El buff tambien puede ser menor o diferente (las hijas se vuelven mas esquivas en vez de mas fuertes).

**Por que es divertido**: Transforma encuentros aleatorios en momentos narrativos memorables. "¡Me toco La Grotesca jugando con Rose!" genera emocion porque el jugador conoce la historia. Incentiva probar distintos heroes para buscar los encuentros. Y el buff al villano convierte la rivalidad en un desafio real — no es solo cosmetico, cambia la partida.
