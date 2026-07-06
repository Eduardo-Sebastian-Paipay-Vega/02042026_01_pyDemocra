# CHANGELOG — Fix: pantalla en blanco en /join (insertBefore) + ErrorBoundary

**Fecha:** 2026-07-06
**Hora:** 11:15 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Corregir un crash de React en `/join` (`AccessCodeRedeemPage.tsx`) que dejaba la pantalla en blanco tras completar el registro, y agregar un `ErrorBoundary` en la ruta para que cualquier error de renderizado futuro muestre un mensaje amigable en vez de romper toda la app.

## Contexto del problema

El usuario reportó, al probar en real el flujo de canje de código:

```
NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which
the new node is to be inserted is not a child of this node.
```

Ocurría al transicionar de "enviando" (`submitting`) a "éxito" (`done`).

## Motivo de la modificación

**Causa raíz:** `AccessCodeRedeemPage.tsx` tenía los campos de correo y contraseña como `<input>` sin ningún atributo `autoComplete`. El gestor de contraseñas/autofill del navegador inyecta sus propios nodos DOM dentro de esos `<input>` (íconos, popups de sugerencia) por fuera del control de React. El componente renderizaba cada paso (`code`/`checking`, `form`/`submitting`, `done`, `error`) como bloques `{condición && <div>...}` **hermanos** apuntando al mismo hueco del árbol — al pasar de `submitting` a `done`, React intenta desmontar el bloque del formulario (con los `<input>` ya "contaminados" por el navegador) y monta el bloque de éxito; el reconciliador llama `insertBefore` esperando encontrar un nodo de referencia que el navegador ya movió/removió, y explota.

## Solución implementada

1. **Un único bloque de contenido por paso** (`content: ReactNode`, calculado con un if/else-if antes del `return`) en vez de múltiples `{cond && <div>}` hermanos — todos renderizados dentro de un solo `<div key={step}>{content}</div>`. El `key={step}` fuerza a React a tratar cada paso como un subárbol completamente distinto (desmonta/monta limpio), en vez de intentar reconciliar parcialmente contra nodos que el navegador ya tocó.
2. **`autoComplete` explícito en los 3 `<input>`** (`name`, `email`, `new-password`) — reduce la inyección de UI de autofill/gestor de contraseñas del navegador en esos campos, mitigando la causa raíz directamente.
3. **Redirect a `/login` vía React Router** (`useNavigate`) en vez de `window.location.href` — se agregó un paso `"redirecting"` intermedio con su propio `useEffect`, evitando navegar desde dentro de un `onClick` mientras el componente sigue montado.
4. **Nuevo componente `ErrorBoundary`** (`ONG/src/app/components/shared/ErrorBoundary.tsx`, class component estándar con `getDerivedStateFromError`/`componentDidCatch`) envolviendo la ruta `/join` en `routes.tsx` — si algo similar vuelve a fallar (esta u otra causa), se muestra un mensaje amigable con botón "Recargar página" en vez de pantalla en blanco.

## Riesgos identificados

- `autoComplete` reduce pero no elimina al 100% la inyección de DOM por extensiones/gestores de contraseñas de terceros (a diferencia del autofill nativo del navegador, que sí respeta bien estos atributos) — por eso se agregó también el `ErrorBoundary` como red de seguridad, no como único fix.
- No fue posible reproducir el crash original en Playwright headless (los gestores de contraseñas/autofill no están activos en ese entorno) — la verificación fue: (a) confirmar que las transiciones de paso equivalentes (`code`→`checking`→`error`, `error`→`code`) no generan errores de consola con la nueva estructura, y (b) revisión manual de que `ErrorBoundary` sigue el patrón estándar de React (no una implementación custom no probada).

## Impacto esperado

- El flujo de `/join` deja de crashear en la transición `submitting`→`done` para la causa identificada (autofill del navegador).
- Si ocurriera cualquier otro error de renderizado no anticipado en esa ruta, el usuario ve un mensaje de error con opción de recargar, en vez de una pantalla en blanco sin ninguna pista.

## Módulos afectados

- `ONG/src/app/pages/landing/AccessCodeRedeemPage.tsx`
- `ONG/src/app/components/shared/ErrorBoundary.tsx` (nuevo)
- `ONG/src/app/routes.tsx`

## Dependencias involucradas

Ninguna nueva.

## Posibles efectos secundarios

Ninguno — el comportamiento funcional (validar código, crear cuenta, consumir código, redirigir) es el mismo; solo cambia cómo se organiza el árbol de React y cómo se navega al final.

## Verificación realizada

- `npx tsc --noEmit`: sin errores nuevos en `AccessCodeRedeemPage.tsx`, `ErrorBoundary.tsx` ni `routes.tsx`.
- Playwright contra `npm run dev:web`: transición `code`→`checking`→`error` (con un código inválido) y `error`→`code` (reintentar), ambas sin errores de consola ni de página.
- No se pudo forzar el crash original exacto en este entorno (requiere un gestor de contraseñas/autofill real de navegador, ausente en Chromium headless) — la corrección se basa en el diagnóstico de causa raíz (atributos `autoComplete` ausentes + reconciliación por bloques hermanos) más la red de seguridad del `ErrorBoundary`.

## Cómo revertir

`git revert` del commit `fix(ong): corrige crash de renderizado en /join y agrega ErrorBoundary`.
