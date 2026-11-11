# Backend — Papiro

## Requisitos

- Node.js 18.18 o superior.
- PostgreSQL 14 o superior.
- npm.

## Configuración local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear una base de datos PostgreSQL llamada `papiro`.

3. Copiar `.env.example` como `.env` y configurar `DATABASE_URL` con las credenciales locales.

4. Generar Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Crear y aplicar la primera migración:

   ```bash
   npm run db:migrate
   ```

6. Iniciar el servidor:

   ```bash
   npm run dev
   ```

## Comandos de base de datos

- `npm run db:generate`: genera Prisma Client desde el esquema.
- `npm run db:migrate`: crea/aplica migraciones en desarrollo.
- `npm run db:studio`: abre Prisma Studio.
- `npm run db:seed`: ejecuta la carga inicial cuando esté implementada.

No subir nunca el archivo `.env` ni compartir credenciales de PostgreSQL.
