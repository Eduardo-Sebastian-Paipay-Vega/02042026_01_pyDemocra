# Dockerfile unificado para el Monorepo EDUCACION OS
FROM node:18-alpine AS builder

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiar archivos de configuración del monorepo
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el código fuente completo
COPY . .

# Construir los proyectos (Añadir más filtros aquí cuando haya backend)
RUN pnpm --filter @educacion/web build

# Etapa de Producción (Servidor Nginx para el frontend)
FROM nginx:alpine AS runner

# Copiar los assets construidos
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Exponer puerto HTTP estándar
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
