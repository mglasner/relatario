# El Relatario — App Personalizable con IA

> Reporte de ideas para transformar El Relatario de un sitio estático con personajes
> fijos a una plataforma donde cada usuario crea su propio universo narrativo.

Fecha: 2026-02-26

---

## 1. Concepto central

Cada usuario arma **su propio Relatario**: crea héroes, villanos y tesoros describiendo
lo que imagina en texto libre. La IA genera el avatar, sprite sheet, descripción
narrativa y stats. Los juegos (laberinto, memorice, abismo, etc.) son los mismos
para todos, pero se adaptan a los personajes y objetos creados por el usuario.

### Flujo del usuario

```
Abrir app → Crear héroe (describir en texto) → IA genera avatar + stats + descripción
         → El héroe aparece en MI estante, MI heroario, MI libro de juegos
         → Jugar con MI héroe contra MIS villanos
         → Ganar tesoros para MI tesorario
```

---

## 2. Por qué funciona

1. **Diferenciador real** — Compite en la categoría "herramientas creativas para
   niños" (Toca Boca, Gacha Life, Roblox), no contra miles de minijuegos genéricos.

2. **Enganche emocional** — Un niño que creó a "Dragoncito Azul" y lo ve corriendo
   en El Abismo tiene un vínculo que un personaje pre-hecho nunca logra. Es *su* héroe.

3. **Rejugabilidad infinita** — El contenido lo genera el usuario. No se necesita
   crear 50 personajes; el usuario crea los que quiera.

4. **Monetización natural** — "Crea 2 personajes gratis, después $X/mes" o "genera
   5 avatares al día gratis". La IA tiene costo por uso, así que el modelo freemium
   calza perfecto.

5. **Viralidad** — "Mira el villano que creé" → compartir → descargar la app.

---

## 3. Qué cambia arquitecturalmente

| Aspecto        | Hoy (estático)                     | Con la idea                              |
| -------------- | ---------------------------------- | ---------------------------------------- |
| **Personajes** | YAML estático en build-time        | Base de datos por usuario                |
| **Avatares**   | `.webp` en `/assets/`              | Generados por IA, guardados en cloud     |
| **Sprites**    | PNG strips manuales                | Generados por IA (el mayor desafío)      |
| **Stats**      | Fijos en YAML                      | Generados/balanceados por IA o por usuario |
| **Backend**    | No hay                             | Auth, DB, storage, API de IA             |
| **Estado**     | Todo local, sin persistencia       | Cuentas con guardado en nube             |

---

## 4. Desafíos técnicos

### 4.1 Generación de sprites (el más difícil)

El Abismo necesita sprite sheets de 48×60px con 9-15 frames (idle, correr, saltar,
atacar). Generar esto con IA de forma consistente y usable es el mayor reto.

**Opciones:**

- **Sprite genérico coloreado** (más viable hoy): generar solo el avatar estático
  y usar un sprite base animado con los colores del personaje.
- **Modelos especializados en pixel art**: existen algunos, pero la calidad varía.
- **Variaciones programáticas**: generar un personaje base y aplicar colores/accesorios
  por código.

### 4.2 Backend y cuentas

Se pasa de un sitio estático a una app con:

- Autenticación (Google/Apple sign-in para simplificar)
- Base de datos (personajes, enemigos, tesoros por usuario)
- Storage (imágenes generadas)
- API que conecta con el modelo de IA

### 4.3 Costos de IA por usuario

Cada generación de avatar/descripción cuesta. Con niños que van a querer crear
50 personajes por día, se necesita:

- Límites por cuenta free
- Cache inteligente (prompts similares → resultado cacheado)
- Modelos más baratos para tareas simples

### 4.4 Moderación de contenido

Los niños van a escribir de todo. Se necesita filtrar:

- Contenido inapropiado en las descripciones
- Que la IA no genere imágenes inadecuadas
- Cumplimiento COPPA si se apunta a menores de 13 años

---

## 5. Stack sugerido

```
Frontend:   El mismo HTML/CSS/JS actual (o migrar a Svelte/Vue)
Backend:    Supabase (auth + DB Postgres + storage, tier gratuito generoso)
IA imágenes: API de generación (Gemini, DALL-E, Stable Diffusion)
IA texto:   Claude API para descripciones y stats
Hosting:    Vercel o Cloudflare Pages
```

Supabase da auth, base de datos y storage sin montar infraestructura propia.

---

## 6. Ruta incremental

### Fase 1 — Validar la idea (MVP mínimo)

- Agregar un formulario "Crear héroe" (nombre + descripción corta)
- La IA genera avatar + descripción + stats
- Se guarda en `localStorage` (sin backend aún)
- El personaje aparece en el estante y se puede usar en los juegos
- Sin sprites custom: usar sprite genérico coloreado
- **Objetivo**: validar que la experiencia de "crear y jugar con mi héroe" engancha

### Fase 2 — Backend y cuentas

- Supabase para auth y persistencia
- Compartir creaciones con link
- Galería de personajes de la comunidad
- **Objetivo**: retención y efecto de red

### Fase 3 — Sprites y pulido

- Generación de sprite sheets con IA
- Tesorario personalizado
- App nativa con Capacitor
- **Objetivo**: calidad de app store

### Fase 4 — Monetización

- Modelo freemium: X creaciones gratis/mes, premium para más
- Publicar en Google Play y App Store
- **Objetivo**: ingresos sostenibles

---

## 7. Publicación en tiendas

| Tienda             | Viabilidad  | Cómo                              | Costo                  |
| ------------------ | ----------- | --------------------------------- | ---------------------- |
| **Google Play**    | Alta        | Capacitor o TWA → AAB             | $25 USD (única vez)    |
| **Apple App Store**| Media-Baja  | Capacitor/Ionic (Apple rechaza web wrappers simples) | $99 USD/año |
| **Microsoft Store**| Alta        | PWABuilder → MSIX                 | ~$19 USD (única vez)   |
| **Steam**          | Media       | Electron o Tauri                  | $100 USD por juego     |
| **itch.io**        | Muy alta    | Subir como juego web              | Gratis (ellos toman %) |
| **Poki/CrazyGames**| Alta       | Portal web, monetizan con ads     | Gratis                 |

### Obstáculos para stores

- Apple rechaza web wrappers sin funcionalidad nativa real
- Competencia intensa en stores generalistas
- El código fuente es público actualmente (habría que hacer el repo privado)

### Ruta recomendada

1. **Empezar por itch.io y portales web** (cero inversión, feedback real)
2. Si hay tracción → Google Play + Microsoft Store
3. Si hay ingresos → Apple App Store

---

## 8. Conclusión

La idea transforma El Relatario de "4 minijuegos lindos" a **"plataforma creativa
para niños"**, categoría con mercado probado y disposición a pagar. El mayor riesgo
técnico son los sprites animados; lo demás es arquitectura conocida.

La Fase 1 se puede hacer sin cambiar casi nada del código actual — solo agregar el
flujo de creación con IA y un adaptador que convierta el personaje creado al formato
que los juegos ya esperan.
