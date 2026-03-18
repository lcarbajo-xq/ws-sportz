# Sportz — Backend PoC

Servidor Express + WebSocket en TypeScript que expone una API REST y un canal WebSocket en tiempo real para seguimiento de partidos en directo. Incluye un simulador de eventos que genera partidos, goles y comentarios de forma aleatoria.

## Stack

- **Express 5** + TypeScript
- **WebSocket** (`ws`) — canal bidireccional para eventos en tiempo real
- **Drizzle ORM** + **Neon Postgres** — persistencia de partidos y comentarios
- **Arcjet** — protección de rate-limiting y acceso al endpoint WS
- **Zod** — validación de esquemas de entrada
- **tsx** — hot-reload en desarrollo

## Estructura del proyecto

```text
src/
├── index.ts              # Entrada principal (Express + WS server)
├── arcjet.ts             # Configuración de Arcjet (rate-limit, firewall)
├── db/
│   ├── db.ts             # Pool de conexión Drizzle
│   └── schema.ts         # Tablas: matches, commentary
├── routes/
│   ├── matches.ts        # GET /matches, POST /matches
│   └── commentary.ts     # GET /matches/:id/commentary
├── simulator/
│   ├── live-simulator.ts # Motor de simulación de eventos
│   └── run.ts            # Entrypoint alternativo con simulador embebido
├── utils/
│   └── get-match-status.ts
├── validation/
│   ├── matches.ts
│   └── commentary.ts
└── ws/
    └── server.ts         # WebSocket server: suscripciones, heartbeat, broadcast
```

## Requisitos previos

- Node.js 18+
- pnpm
- Cuenta en [Neon](https://neon.tech/) (base de datos Postgres serverless gratuita)
- (Opcional) Cuenta en [Arcjet](https://arcjet.com/) para protección WS

## Setup local

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Servidor
PORT=3005
HOST=0.0.0.0

# Arcjet (opcional — si no se configura, el middleware se omite)
ARCJET_KEY=ajkey_...

# Simulador (opcional, valores por defecto mostrados)
SIM_TICK_MS=3000
SIM_CREATE_MATCH_PROBABILITY=0.3
SIM_SCORE_UPDATE_PROBABILITY=0.4
SIM_MAX_LIVE_MATCHES=6
SIM_WS_PORT=3005
```

### 3. Configurar la base de datos

```bash
# Generar archivos de migración a partir del schema
pnpm db:generate

# Aplicar migraciones
pnpm db:migrate
```

### 4. Arrancar el servidor

**Modo A — Servidor independiente** (sin simulador, datos reales o via HTTP):

```bash
pnpm dev
```

Servidor disponible en `http://localhost:3005`.

**Modo B — Servidor con simulador integrado** (recomendado para pruebas locales):

```bash
pnpm simulator:dev
```

Este modo levanta el servidor completo con WebSocket y un simulador que genera eventos automáticamente cada ~3 segundos: crea partidos nuevos, actualiza marcadores y emite comentarios en directo.

## Scripts disponibles

| Script                 | Descripción                         |
| ---------------------- | ----------------------------------- |
| `pnpm dev`             | Servidor principal con hot-reload   |
| `pnpm build`           | Compila TypeScript a `dist/`        |
| `pnpm start`           | Ejecuta desde `dist/` (producción)  |
| `pnpm simulator:dev`   | Servidor + simulador con hot-reload |
| `pnpm simulator:start` | Servidor + simulador desde build    |
| `pnpm db:generate`     | Genera migraciones desde el schema  |
| `pnpm db:migrate`      | Aplica migraciones a Neon           |
| `pnpm db:studio`       | Abre Drizzle Studio (GUI de la DB)  |

## API REST

### `GET /matches`

Retorna la lista de partidos con scores y estado.

### `POST /matches`

Crea un partido nuevo manualmente.

### `GET /matches/:matchId/commentary`

Retorna el historial de comentarios de un partido.

## WebSocket

**URL:** `ws://localhost:3005/ws`

### Mensajes del cliente → servidor

```json
{ "type": "subscribe",   "matchId": 1 }
{ "type": "unsubscribe", "matchId": 1 }
```

### Mensajes del servidor → cliente

| Tipo               | Cuándo se emite                                  |
| ------------------ | ------------------------------------------------ |
| `welcome`          | Al conectar                                      |
| `subscribed`       | Confirmación de suscripción                      |
| `unsubscribed`     | Confirmación de baja                             |
| `match_created`    | Nuevo partido creado (broadcast a todos)         |
| `score_updated`    | Cambio de marcador (broadcast a todos)           |
| `match_commentary` | Nuevo comentario (solo suscriptores del partido) |
| `error`            | Error de protocolo o de negocio                  |

### Heartbeat

El servidor hace ping cada 30 segundos a todos los clientes. Si un cliente no responde con pong, se termina la conexión y se limpian sus suscripciones.

## Prueba rápida con los archivos `.http`

El directorio `http/` contiene colecciones para la extensión REST Client de VS Code:

```
http/
├── matches/index.http       # CRUD de partidos
├── commentary/index.http    # Consulta de comentarios
└── simulator/index.http     # Endpoints del modo simulador
```

Abre cualquiera de esos archivos y haz click en **"Send Request"** sobre cada bloque.

---

## Features futuras

- **Persistencia en localStorage / IndexedDB** — cachear comentarios y últimos partidos vistos para recuperar el estado al recargar sin esperar nuevas peticiones REST.
- **Suscripción a múltiples partidos simultáneos** — ampliar el protocolo WS para gestionar N suscripciones activas al mismo tiempo y mostrar un panel multi-partido.
- **Picture-in-Picture para Live Commentary** — usar la [Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API) o un canvas flotante para seguir el marcador y el comentario en directo aunque el usuario cambie de pestaña o minimice la ventana.
- **Notificaciones push de goles** — integrar la [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) para alertar al usuario de goles o cambios de marcador en partidos suscritos aunque la app esté en segundo plano.
- **Reconexión con rehydratación de estado** — al reconectar tras un corte, pedir el diferencial de eventos perdidos durante la desconexión y aplicarlos al estado local sin recargar la página.

# Ejecutar ejemplo CRUD

pnpm crud:example

```

## Estructura del Proyecto

```

sportz/
├── src/
│ ├── server.ts # Servidor Express principal
│ ├── db.ts # Cliente de base de datos Drizzle
│ ├── schema.ts # Definición de tablas y tipos
│ └── index.ts # Script de ejemplo CRUD
├── drizzle/ # Archivos de migración (generado)
├── dist/ # Archivos compilados (generado)
├── .env # Variables de entorno (no versionado)
├── drizzle.config.ts # Configuración de Drizzle Kit
├── tsconfig.json # Configuración TypeScript
└── package.json # Dependencias y scripts

````

## Schema de Base de Datos

### Tabla `demo_users`

| Campo       | Tipo        | Descripción                        |
| ----------- | ----------- | ---------------------------------- |
| `id`        | `serial`    | Primary key autoincremental        |
| `name`      | `text`      | Nombre del usuario                 |
| `email`     | `text`      | Email único del usuario            |
| `createdAt` | `timestamp` | Fecha de creación (default: now()) |

## Endpoints

### `GET /`

Endpoint de verificación del servidor.

**Respuesta:**

```json
{
  "success": true,
  "message": "Servidor funcionando correctamente"
}
````

## Tecnologías

### Backend

- [Express](https://expressjs.com/) - Framework web
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje tipado
- [CORS](https://github.com/expressjs/cors) - Middleware CORS
- [tsx](https://github.com/esbuild-kit/tsx) - TypeScript executor para desarrollo

### Base de Datos

- [Neon](https://neon.tech/) - Serverless Postgres
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [node-postgres](https://node-postgres.com/) - Driver PostgreSQL para Node.js
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) - Herramienta de migraciones

## Puerto

El servidor se ejecuta en el puerto **3005** por defecto.

```
http://localhost:3005
```
