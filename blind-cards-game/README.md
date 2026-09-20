# Blind Cards 🃏

Juego de cartas ciegas multijugador en tiempo real (similar a *Hanabi* / *Blind Man's Buff*), con chat de texto y chat de voz.

Implementado según la arquitectura documentada:
- **Frontend:** React + Vite + TypeScript, Tailwind CSS, `socket.io-client`, `@livekit/components-react`
- **Backend:** Node.js + TypeScript, Express, `socket.io`, `livekit-server-sdk`, `multer` + `adm-zip`

## Estructura

```
blind-cards-game/
├── client/   # App React (Vite + TS)
└── server/   # Servidor Node/Express + Socket.io + LiveKit
```

## Puesta en marcha

### 1. Servidor

```bash
cd server
npm install
cp .env.example .env
# completar LIVEKIT_API_KEY, LIVEKIT_API_SECRET y LIVEKIT_URL en .env
npm run dev
```

El servidor queda escuchando en `http://localhost:4000`.

### 2. Cliente

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

El cliente queda disponible en `http://localhost:5173`.

## Flujo del juego

1. El jugador elige un **gamertag** (persistido en `localStorage`).
2. Puede **crear una sala** (pública/privada, 3-8 jugadores, baraja estándar o personalizada vía ZIP) o **unirse** a una sala pública o mediante código de 6 caracteres.
3. El anfitrión inicia la partida cuando hay al menos 3 jugadores: el servidor reparte una carta por jugador, ocultando siempre la carta propia de cada uno.
4. En su turno, el jugador activo selecciona a un oponente (le da una pista por voz/chat) y luego marca si **adivinó** o **no adivinó**:
   - **Adivinó:** se descarta la carta, el oponente roba una nueva y el jugador activo retiene el turno.
   - **No adivinó:** el turno pasa al jugador que intentó adivinar.
5. La partida termina cuando se agota el mazo o alguien alcanza el puntaje de victoria configurado.

## Notas de seguridad

El servidor nunca envía a un jugador el valor real de su propia carta — el estado se "sanitiza" (`GameEngine.sanitizeForPlayer`) antes de transmitirse a cada socket individualmente, evitando trampas inspeccionando el tráfico de red o el estado de React.

## Mazos personalizados

Se aceptan **dos formatos** de ZIP para subir un mazo personalizado (el servidor detecta cuál es automáticamente):

1. **Formato clásico:** `deck.json` en la raíz (52 cartas, 13 por palo) + carpeta `cards/` con las imágenes referenciadas.
2. **Spritesheet estilo Balatro:** subís directamente la imagen PNG de un mod/texture pack de Balatro (grilla estándar de 13 columnas x 4 filas, 71x95px por carta a escala 1x, o el doble a 2x — se detecta el tamaño automáticamente). El servidor recorta cada carta sola. Si tu pack usa una grilla distinta, incluí un `manifest.json` en el mismo ZIP:
   ```json
   {
     "name": "Mi mazo Balatro",
     "columns": 13,
     "rows": 4,
     "cardWidth": 71,
     "cardHeight": 95,
     "rankOrder": ["2","3","4","5","6","7","8","9","10","J","Q","K","A"],
     "suitOrder": ["spades","hearts","clubs","diamonds"]
   }
   ```
   Todos los campos son opcionales — se completan con estos valores por defecto si no los indicás.

## Jugar con o sin figuras (J, Q, K, A)

Al crear una sala hay un interruptor "Jugar con figuras" — desactivarlo hace que el mazo estándar solo incluya cartas numéricas (2 al 10), quedando 36 cartas en vez de 52. Afecta únicamente a la baraja estándar; los mazos personalizados siempre usan las 52 cartas que trae el ZIP.

## Navegación y animaciones

- Botón "← Cambiar gamertag" en el lobby, y "← Volver al lobby" dentro de la sala/mesa de juego (con confirmación si la partida ya está en curso).
- Las cartas tienen una animación sutil de aparición al repartirse, un leve flotado continuo, y un pulso en la carta del jugador cuyo turno está activo.

## Desplegar en línea GRATIS (jugar con amigos por internet)

Servidor y cliente se despliegan por separado, en dos servicios gratuitos: **Render** (servidor) + **Vercel** (cliente) + **LiveKit Cloud** (voz, opcional). Ninguno de los tres pide tarjeta para el uso que necesita este proyecto.

### A. Subir el proyecto a GitHub

```bash
cd blind-cards-game
git init
git add .
git commit -m "Blind Cards"
```

Creá un repositorio en GitHub y subilo (`git remote add origin ...` + `git push`). El `.gitignore` ya excluye `node_modules` y `.env`, así que no subís nada innecesario ni tus credenciales.

### B. Desplegar el servidor en Render (gratis)

1. Entrá a [render.com](https://render.com) y creá una cuenta con GitHub.
2. "New +" → "Web Service" → elegí tu repositorio.
3. Render detecta el `render.yaml` incluido automáticamente y propone: **Root Directory** `server`, **Build Command** `npm install && npm run build`, **Start Command** `npm run start`. Confirmá el plan **Free**.
4. En **Environment**, completá las variables:
   - `CLIENT_ORIGIN` → lo dejás pendiente por ahora, lo completás en el paso E
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (ver sección C)
5. Deploy. Render te da una URL pública tipo `https://blind-cards-server.onrender.com`. **Copiala**, la necesitás para el cliente.

> Nota sobre el plan gratis de Render: si nadie usa el servidor durante 15 minutos, se "duerme", y el primer pedido después tarda ~30-60 segundos en responder mientras despierta. Para jugar con amigos alcanza perfecto — solo avisales que el primer ingreso puede tardar un poco.

### C. Voz en línea con LiveKit Cloud (opcional, gratis)

1. Creá una cuenta gratis en [cloud.livekit.io](https://cloud.livekit.io) (plan **Build**, no pide tarjeta) y un proyecto nuevo.
2. En el dashboard del proyecto, copiá `API Key`, `API Secret` y la `WebSocket URL` (empieza con `wss://`).
3. Pegalos como variables de entorno en Render (paso B.4).

Si te lo salteás, el resto del juego funciona igual — solo el botón "Unirse al Chat de Voz" va a fallar.

### D. Desplegar el cliente en Vercel (gratis)

1. Entrá a [vercel.com](https://vercel.com), "Add New Project" → importá el mismo repo de GitHub.
2. En **Root Directory**, poné `client`.
3. En **Environment Variables**, agregá `VITE_SERVER_URL` con la URL de Render del paso B.5 (ej. `https://blind-cards-server.onrender.com`).
4. Deploy. Vercel te da una URL tipo `https://tu-juego.vercel.app` — esa es la que compartís con tus amigos.

### E. Cerrar el círculo del CORS

Volvé a Render y completá la variable `CLIENT_ORIGIN` que dejaste pendiente con la URL de Vercel del paso D.4 (ej. `https://tu-juego.vercel.app`). Guardá — Render redeploya solo. Sin este paso, el navegador va a bloquear la conexión del cliente al servidor por CORS.

### F. Probar

Abrí la URL de Vercel en dos dispositivos o pestañas distintas (con gamertags distintos), creá una sala, compartí el código de 6 caracteres, y a jugar. No hace falta que tus amigos instalen nada — solo entran al link. Si el servidor estaba "dormido", el primer intento de crear/unirse a una sala puede tardar hasta un minuto; el resto va normal.

> Si preferís **Railway** en vez de Render, el `server/railway.json` incluido también sirve — pero desde 2026 Railway ya no tiene plan gratis permanente (da $5 de crédito único y después cobra), así que Render es la opción sin costo real.

## Pendientes / posibles extensiones

- Autenticación de cuentas persistentes (actualmente juego rápido por gamertag).
- Persistencia de salas en base de datos (actualmente en memoria del proceso).
- Reconexión automática de jugadores tras cortes de red.
