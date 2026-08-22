---
name: modern-ui-development
description: >-
  Guía para el agente sobre cómo instalar y configurar UI moderna (React Three Fiber, Framer Motion, Auto-animate, Shadcn) en el proyecto pyDemocra, sorteando problemas de concurrencia y dependencias específicas de Windows/Vite.
---

# Desarrollo de UI Moderna en pyDemocra

## Overview
Este skill proporciona las reglas e instrucciones paso a paso para desarrollar UI avanzada (3D y animaciones declarativas) en este proyecto. Resuelve de forma proactiva problemas críticos conocidos: conflictos de resolución de dependencias NPM (como `date-fns`) y bloqueos de archivos en Windows por el servidor Vite (`EPERM: operation not permitted, open 'package-lock.json'`).

## Stack Visual Autorizado
- **3D y WebGL**: `three`, `@react-three/fiber`, `@react-three/drei`
- **Animaciones UI por elemento**: `framer-motion`
- **Animaciones automáticas de Listas**: `@formkit/auto-animate`
- **Iconografía**: `lucide-react`
- **Componentes Base**: Shadcn UI (configurado para usar Tailwind v4).

## Dependencies
*(No requiere otros Agent Skills, todo se opera vía CLI)*

## Workflow de Instalación y Configuración

### 1. Parar Servidores de Desarrollo (MANDATORIO en Windows)
Antes de ejecutar cualquier comando `npm install` o `npx shadcn`, asegúrate de detener cualquier tarea en segundo plano que ejecute el servidor de Vite (`npm run dev`). De lo contrario, los comandos fallarán con un error `EPERM` en archivos como `package-lock.json` o `components.json` debido al bloqueo de archivos de Windows.
- Usa la herramienta `manage_task` o lanza un comando de PowerShell para matar procesos de node: `Stop-Process -Name "node" -Force` si es estrictamente necesario.

### 2. Bypass de Conflictos de Dependencia NPM
Al instalar paquetes nuevos o al correr configuradores como `shadcn`, siempre se deben resolver los problemas de dependencias subyacentes asegurando que se utilice el flag de resolución de peer-deps heredadas. 
Para instalaciones aisladas, usa:
```bash
npm install <package> --legacy-peer-deps
```
**Nota:** El proyecto idealmente tiene `.npmrc` configurado con `legacy-peer-deps=true`, pero tenlo en mente para scripts explícitos.

### 3. Arquitectura del Proyecto
Coloca los componentes visuales en las rutas correspondientes:
- **Componentes 3D**: `/educ/src/components/3d/` (ej. `Scene3D.tsx`)
- **UI Animada y Bloques**: `/educ/src/components/ui/` (ej. `HeroSection.tsx`, `InteractiveList.tsx`)
- **Páginas de agregación**: `/educ/src/features/<feature>/` (ej. `/educ/src/features/demo/DemoPage.tsx`)

### 4. Routing con Lazy Loading
Dado que paquetes como `three` son pesados, siempre utiliza carga diferida (lazy loading) al integrar componentes complejos en el `AppRouter.tsx`:
```tsx
import { lazy, Suspense } from 'react';
const Scene3D = lazy(() => import('../components/3d/Scene3D'));

// ... dentro del enrutador:
<Route path="/mi-ruta-3d" element={
  <Suspense fallback={<div>Cargando motor 3D...</div>}>
    <Scene3D />
  </Suspense>
} />
```

## Common Mistakes
1. **Ejecutar `npm install` mientras Vite corre**: Vite bloquea el archivo `package-lock.json` y/o escanea agresivamente directorios en Windows. Mata el proceso de Vite antes de cualquier cambio en dependencias.
2. **Intentar inicializar Shadcn ignorando el flag `--legacy-peer-deps`**: Provocará conflictos del árbol de NPM irresolubles por dependencias secundarias.
3. **No sanitizar imports**: Recuerda siempre verificar qué versión de Tailwind se usa (v4) y si los componentes son estables.
