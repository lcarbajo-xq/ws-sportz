# Sportz

Servidor Express simple en TypeScript con soporte para CORS, manejo de JSON e integración con Neon Postgres usando Drizzle ORM.

## Características

- ⚡ Express 5 con TypeScript
- 🔒 CORS habilitado
- 📦 Soporte para JSON
- 🛠️ Modo desarrollo con hot-reload
- 🏗️ Build de producción
- 🗄️ Base de datos Neon Postgres con Drizzle ORM
- 🔄 Migraciones automáticas con Drizzle Kit

## Requisitos Previos

- Node.js 18+
- pnpm

## Instalación

```bash
pnpm install
```

## Configuración de Base de Datos

### 1. Configurar Neon Database

1. Crea una cuenta en [Neon](https://neon.tech/)
2. Crea un nuevo proyecto y obtén tu connection string
3. En el archivo `.env`, reemplaza los placeholders con tus credenciales reales:

```env
DATABASE_URL="postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require"
```

### 2. Generar Migraciones

```bash
pnpm db:generate
```

Este comando genera archivos de migración basados en tu schema en el directorio `drizzle/`.

### 3. Aplicar Migraciones

```bash
pnpm db:migrate
```

Este comando aplica las migraciones pendientes a tu base de datos Neon.

### 4. Probar Conexión (Opcional)

Ejecuta el script de ejemplo CRUD:

```bash
pnpm crud:example
```

Este script crea, lee, actualiza y elimina un usuario de prueba para verificar la conexión.

## Scripts Disponibles

### Modo Desarrollo

```bash
pnpm dev
```

Inicia el servidor en modo desarrollo con hot-reload usando `tsx`.

### Build

```bash
pnpm build
```

Compila el proyecto TypeScript a JavaScript en el directorio `dist/`.

### Producción

```bash
pnpm start
```

Ejecuta el servidor desde los archivos compilados.

### Base de Datos

```bash
# Generar archivos de migración desde el schema
pnpm db:generate

# Aplicar migraciones a la base de datos
pnpm db:migrate

# Abrir Drizzle Studio (GUI para explorar la DB)
pnpm db:studio

# Ejecutar ejemplo CRUD
pnpm crud:example
```

## Estructura del Proyecto

```
sportz/
├── src/
│   ├── server.ts       # Servidor Express principal
│   ├── db.ts           # Cliente de base de datos Drizzle
│   ├── schema.ts       # Definición de tablas y tipos
│   └── index.ts        # Script de ejemplo CRUD
├── drizzle/            # Archivos de migración (generado)
├── dist/               # Archivos compilados (generado)
├── .env                # Variables de entorno (no versionado)
├── drizzle.config.ts   # Configuración de Drizzle Kit
├── tsconfig.json       # Configuración TypeScript
└── package.json        # Dependencias y scripts
```

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
```

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
