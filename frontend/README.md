# Sportz — Frontend PoC

Dashboard en tiempo real para seguimiento de partidos en directo. Construido con React 19, TypeScript y Tailwind CSS v4. Consume la API REST del backend y mantiene una conexión WebSocket persistente con reconexión automática exponencial.

## Stack

- **Vite 7** — servidor de desarrollo y bundler
- **React 19** — UI con hooks
- **TypeScript** — tipado estricto end-to-end
- **Tailwind CSS v4** — estilos con `@theme` custom tokens
- **Native WebSocket API** — comunicación en tiempo real

## Estructura del proyecto

```text
frontend/src/
├── components/
│   ├── Header.tsx                 # Indicador de estado de conexión WS
│   ├── match-card.tsx             # Tarjeta de partido con marcador en vivo
│   ├── live-commentary-pannel.tsx # Panel de comentarios en tiempo real
│   └── status-indicator.tsx      # Dot de color según estado WS
├── hooks/
│   └── use-live-match.ts          # Hook principal: estado, WS, API
├── lib/
│   ├── api.ts                     # Cliente REST (fetch)
│   └── ws.ts                      # WebSocketClient con reconexión exponencial
├── types/
│   └── domain.ts                  # Tipos compartidos (Match, Commentary, WS msgs)
├── consts/
│   └── index.ts                   # URLs base, timeouts, config de paginación
├── App.tsx
└── main.tsx
```

## Requisitos previos

- Node.js 20.19+
- pnpm
- Backend corriendo (ver [README del backend](../README.md))

## Setup local

### 1. Instalar dependencias

```bash
# Desde la carpeta frontend/
pnpm install
```

### 2. Variables de entorno

Crea un archivo `.env` en `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:3005
VITE_WS_URL=ws://localhost:3005/ws
```

Si no existe el `.env`, el cliente usa esos mismos valores por defecto, así que la app funciona sin crearlo en local.

### 3. Arrancar

```bash
pnpm dev
```

Aplicación disponible en `http://localhost:5173`.

## Cómo probar en local (paso a paso)

### Setup recomendado para PoC

Usa **dos terminales**:

**Terminal 1 — Backend con simulador:**

```bash
cd sportz          # raíz del proyecto
pnpm simulator:dev
```

Esto levanta el servidor Express + WebSocket en el puerto 3005 y arranca el simulador que genera eventos automáticos cada ~3 s.

**Terminal 2 — Frontend:**

```bash
cd sportz/frontend
pnpm dev
```

Abre `http://localhost:5173` en el navegador.

### Flujo de prueba

1. La app conecta automáticamente al WebSocket al montarse.
2. El indicador de estado en el header pasa de **Connecting** → **Connected** (punto verde).
3. Los partidos aparecen en el grid izquierdo, creados por el simulador.
4. Haz click en **"Watch Live"** en cualquier tarjeta para suscribirte a ese partido.
5. El panel derecho empieza a recibir comentarios en tiempo real (goles, tarjetas, etc.).
6. El marcador en la tarjeta se actualiza con animación cada vez que hay un gol.
7. Si el banner **"N new matches added"** aparece, haz click en **Dismiss** o espera 5 s.
8. Para dejar de ver un partido, haz click en **"Close"** dentro del panel de comentarios.

### Probar la reconexión automática

1. Con el frontend corriendo y conectado (punto verde), para el backend (`Ctrl+C` en Terminal 1).
2. El indicador pasa a **Error** o **Reconnecting**.
3. Vuelve a arrancar el backend: el cliente reconecta automáticamente con backoff exponencial (1 s, 2 s, 4 s… hasta 30 s máximo).
4. Al reconectar, el estado vuelve a **Connected** y puedes retomar las suscripciones.

### Probar paginación

El grid muestra 6 partidos por página. Si el simulador crea más de 6, aparecen los botones **Prev / Next**.

## Scripts disponibles

| Script         | Descripción                     |
| -------------- | ------------------------------- |
| `pnpm dev`     | Servidor de desarrollo con HMR  |
| `pnpm build`   | Build de producción en `dist/`  |
| `pnpm preview` | Preview del build de producción |
| `pnpm lint`    | Linting con ESLint              |

## Configuración del cliente WebSocket

El cliente (`src/lib/ws.ts`) implementa:

- Reconexión automática con **backoff exponencial** (inicio: 1 s, máximo: 30 s).
- Detección de cierre limpio vs. inesperado vía `CloseEvent.wasClean` y código de cierre.
- Guard anti-duplicado: no abre un socket nuevo si ya hay uno en `OPEN`, `CONNECTING` o `CLOSING`.
- Limpieza de listeners siempre ligada al socket específico que los registró, para evitar listeners huérfanos.

Parámetros ajustables en `src/consts/index.ts`:

```ts
INITIAL_RECONNECT_DELAY // 1000 ms por defecto
MAX_RECONNECT_DELAY // 30 000 ms por defecto
```

---

## Features futuras

- **Persistencia en localStorage / IndexedDB** — guardar el historial de comentarios y el partido seleccionado para restaurar el estado al recargar la página sin peticiones adicionales al servidor.
- **Suscripción a múltiples partidos simultáneos** — permitir abrir varios paneles de comentarios en paralelo, cada uno suscrito a un partido distinto, con layout configurable tipo grid o tabs.
- **Picture-in-Picture para Live Commentary** — usar la [Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API) para mantener el marcador y el comentario en directo visibles en una ventana flotante al cambiar de pestaña o minimizar el navegador.
- **Notificaciones push de goles** — integrar la [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) para enviar alertas del sistema cuando se produce un gol o un evento destacado en un partido suscrito, aunque la app esté en segundo plano.
- **Reconexión con rehydratación de estado** — al reconectar tras un corte, solicitar el diferencial de eventos perdidos durante la desconexión y aplicarlos al estado local sin recargar la página completa.

- `GET /matches?limit=50` - Fetch all matches
- `GET /matches/:matchId/commentary?limit=100` - Fetch commentary for a match

### WebSocket Events

**Client → Server:**

- `{ type: "subscribe", matchId: number }` - Subscribe to match updates
- `{ type: "unsubscribe", matchId: number }` - Unsubscribe from match

**Server → Client:**

- `{ type: "welcome" }` - Connection established
- `{ type: "subscribed", matchId }` - Subscription confirmed
- `{ type: "match_commentary", data: Commentary }` - New commentary event
- `{ type: "match_created", data: Match }` - New match created
- `{ type: "error", error: string }` - Error occurred

## Component Overview

### `Header`

Displays app title, WebSocket connection status, and match count from API.

### `MatchCard`

Shows match details (teams, score, status) with "Watch Live" or "Close" button.

### `LiveCommentaryPanel`

Displays real-time commentary feed for the selected match with formatted events.

### `useLiveMatch` Hook

Manages WebSocket connection, match selection, commentary caching, and API calls.

## Development Tips

- **Hot Module Replacement (HMR)**: Changes auto-reload in development
- **TypeScript**: All types are defined in `src/types/domain.ts`
- **Tailwind**: Use utility classes; custom components defined in `index.css`
- **WebSocket Reconnection**: Automatic retry with exponential backoff
- **Commentary Cache**: Previously loaded commentary is cached per match

## Troubleshooting

### WebSocket connection fails

- Ensure backend is running on the correct port
- Check `VITE_WS_URL` in `.env` matches backend WebSocket path
- Verify CORS is enabled on backend

### No matches displayed

- Check backend has matches in the database
- Verify `VITE_API_BASE_URL` in `.env` is correct
- Check browser console for API errors

### Styles not loading

- Run `pnpm install` to ensure Tailwind is installed
- If you use a custom `tailwind.config.js`, verify Vite is loading it
- Verify `src/index.css` imports Tailwind with `@import "tailwindcss"

## License

MIT
