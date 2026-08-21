# Registro de Cambios: Corrección de Dependencias UI
**Fecha:** 03 de Agosto de 2026
**Autor:** Antigravity (IA)

## Resumen del Cambio
Se ha resuelto un error crítico de compilación en Next.js (`Module not found: Can't resolve 'class-variance-authority'`) originado tras la instalación de los componentes base de `shadcn/ui`.

## Justificación Técnica
La CLI de `shadcn` (`npx shadcn@latest add ...`) a veces omite la instalación automática de subdependencias necesarias en entornos monorepo pnpm, lo que produce fallos de resolución en los import paths (ej. `./src/components/ui/button.tsx`).

## Acciones Tomadas
Se ejecutó la instalación manual de los paquetes base requeridos por los primitivos de Radix UI y shadcn:
```bash
pnpm add class-variance-authority @radix-ui/react-slot clsx tailwind-merge
```
El servidor de desarrollo (`pnpm dev`) en `apps/web` retomó la compilación exitosa después de la descarga.

## Estado
Propagación completada. UI corriendo de nuevo.
