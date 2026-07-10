# Guía de Onboarding para Nuevos Desarrolladores

*Fuente de verdad: Ecosistema Tecnológico de Democra*

¡Bienvenido al equipo de ingeniería de Democra! Esta guía es tu punto de partida (Fase 0) para levantar el entorno local y entender las convenciones clave antes de tu primer Pull Request.

## 1. Stack Tecnológico Core
Debes tener instalado en tu máquina local:
*   **Node.js** (v20+ recomendado).
*   **npm** (Gestor de paquetes).
*   **Supabase CLI** (`npm install -g supabase` o vía brew). Usado para levantar la base de datos local y correr migraciones.
*   **Git**

## 2. Levantando el Entorno Local

El repositorio está dividido entre el frontend (Vite) y el backend híbrido (Express + Supabase).

### Paso 2.1: Supabase Local (Base de Datos y Auth)
Democra confía fuertemente en PostgreSQL y RLS. Para no afectar producción, debes correr Supabase localmente.
1. Ejecuta `supabase start` en la raíz del proyecto.
2. Esto descargará las imágenes Docker (PostgreSQL, GoTrue para Auth, PostgREST) y ejecutará las migraciones de `supabase/migrations/` automáticamente.
3. El dashboard local estará en `localhost:54323`.

### Paso 2.2: Backend de Seguridad (Express)
El Risk Engine se corre de forma separada a Supabase.
1. Crea un archivo `.env` en la raíz (pide las variables de entorno de `RESEND_API_KEY` a tu líder técnico).
2. Ejecuta `node server/index.js` (El servidor escucha en `localhost:8787`).

### Paso 2.3: Frontend Multi-Page (React)
1. Instala dependencias: `npm install` (y asegúrate de correr `npm install --prefix ong` si estás tocando el código del módulo legacy, aunque estamos migrando a `ong/src/`).
2. Ejecuta `npm run dev`.
3. Vite servirá la Landing Page en `localhost:5173/` y la App de ONG en `localhost:5173/ong`.

## 3. Convenciones de Desarrollo (Developer Experience)

*   **No usamos ORM:** No intentes instalar Prisma. Usamos el cliente `@supabase/supabase-js`. Los tipos están en `app-database.ts`. Si alteras una tabla, debes actualizar ese archivo manualmente.
*   **Estilos:** Usamos Tailwind CSS v4. No escribas CSS puro a menos que sea estrictamente necesario. Usa `clsx` y `tailwind-merge` para componentes UI reutilizables (basados en Radix).
*   **GitFlow Simplificado:** Ramas `feature/nombre-corto`. Commits basados en *Conventional Commits* (ej. `feat: añade botón de login`, `fix: corrige validación ruc`).
