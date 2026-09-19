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

Deben subirse como `.zip` conteniendo `deck.json` (con exactamente 52 cartas, 13 por palo) y una carpeta `cards/` con las imágenes referenciadas. El validador (`server/src/utils/deckValidator.ts`) rechaza mazos incompletos, duplicados o con imágenes faltantes.

## Desplegar en línea (jugar con amigos por internet)

Servidor y cliente se despliegan por separado. Guía para **Railway** (servidor) + **Vercel** (cliente) — ambos con planes gratuitos que alcanzan de sobra para esto.

### A. Subir el proyecto a GitHub

```bash
cd blind-cards-game
git init
git add .
git commit -m "Blind Cards"
```

Creá un repositorio en GitHub y subilo (`git remote add origin ...` + `git push`). Como el `.gitignore` ya excluye `node_modules` y `.env`, no subís nada innecesario ni tus credenciales.

### B. Desplegar el servidor en Railway

1. Entrá a [railway.app](https://railway.app), "New Project" → "Deploy from GitHub repo" → elegí tu repo.
2. En **Settings → Root Directory**, poné `server` (el repo tiene cliente y servidor juntos, Railway necesita saber cuál desplegar).
3. Railway detecta `package.json` automáticamente (usa el `railway.json` incluido) y corre `npm install` → `npm run build` → `npm run start`.
4. En **Variables**, agregá:
   - `CLIENT_ORIGIN` → lo completás en el paso D, dejalo pendiente por ahora
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL` (ver sección C)
   - Railway ya define `PORT` automáticamente, no lo toques
5. Cuando termine el deploy, Railway te da una URL pública tipo `https://tu-juego-server.up.railway.app`. **Copiala**, la necesitás para el cliente.

### C. Voz en línea con LiveKit Cloud (opcional pero recomendado)

1. Creá una cuenta gratis en [cloud.livekit.io](https://cloud.livekit.io) y un proyecto nuevo.
2. En el dashboard del proyecto, copiá `API Key`, `API Secret` y la `WebSocket URL` (empieza con `wss://`).
3. Pegalos como variables de entorno en Railway (paso B.4).

Si te lo salteás, el resto del juego funciona igual — solo el botón "Unirse al Chat de Voz" va a fallar.

### D. Desplegar el cliente en Vercel

1. Entrá a [vercel.com](https://vercel.com), "Add New Project" → importá el mismo repo de GitHub.
2. En **Root Directory**, poné `client`.
3. En **Environment Variables**, agregá `VITE_SERVER_URL` con la URL de Railway del paso B.5 (ej. `https://tu-juego-server.up.railway.app`).
4. Deploy. Vercel te da una URL tipo `https://tu-juego.vercel.app` — esa es la que compartís con tus amigos.

### E. Cerrar el círculo del CORS

Volvé a Railway y completá la variable `CLIENT_ORIGIN` que dejaste pendiente con la URL de Vercel del paso D.4 (ej. `https://tu-juego.vercel.app`). Guardá — Railway redeploya solo. Sin este paso, el navegador va a bloquear la conexión del cliente al servidor por CORS.

### F. Probar

Abrí la URL de Vercel en dos dispositivos o pestañas distintas (con gamertags distintos), creá una sala, compartí el código de 6 caracteres, y a jugar. No hace falta que tus amigos instalen nada — solo entran al link.

## Pendientes / posibles extensiones

- Autenticación de cuentas persistentes (actualmente juego rápido por gamertag).
- Persistencia de salas en base de datos (actualmente en memoria del proceso).
- Reconexión automática de jugadores tras cortes de red.
