# Sportz

Servidor Express simple en TypeScript con soporte para CORS y manejo de JSON.

## Características

- ⚡ Express 5 con TypeScript
- 🔒 CORS habilitado
- 📦 Soporte para JSON
- 🛠️ Modo desarrollo con hot-reload
- 🏗️ Build de producción

## Requisitos Previos

- Node.js 18+
- pnpm

## Instalación

```bash
pnpm install
```

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

## Estructura del Proyecto

```
sportz/
├── src/
│   └── server.ts       # Servidor Express principal
├── dist/               # Archivos compilados (generado)
├── tsconfig.json       # Configuración TypeScript
└── package.json        # Dependencias y scripts
```

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

- [Express](https://expressjs.com/) - Framework web
- [TypeScript](https://www.typescriptlang.org/) - Lenguaje tipado
- [CORS](https://github.com/expressjs/cors) - Middleware CORS
- [tsx](https://github.com/esbuild-kit/tsx) - TypeScript executor para desarrollo

## Puerto

El servidor se ejecuta en el puerto **3005** por defecto.

```
http://localhost:3005
```
