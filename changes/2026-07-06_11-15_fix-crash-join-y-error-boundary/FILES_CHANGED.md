# FILES_CHANGED — Fix: pantalla en blanco en /join (insertBefore) + ErrorBoundary

## Creados

- `ONG/src/app/components/shared/ErrorBoundary.tsx` — boundary de error genérico (class component, `getDerivedStateFromError`/`componentDidCatch`), con mensaje amigable y botón de recarga.

## Modificados

- `ONG/src/app/pages/landing/AccessCodeRedeemPage.tsx`:
  - Renderizado condicional reestructurado: un único `content: ReactNode` calculado por `if/else-if` (antes: 4 bloques `{cond && <div>}` hermanos), envuelto en `<div key={step}>{content}</div>`.
  - `autoComplete="name"|"email"|"new-password"` agregado a los 3 `<input>` del formulario; `autoComplete="off"` en el input de código.
  - Redirect a `/login` cambiado de `window.location.href` a `useNavigate()` de `react-router`, vía un nuevo paso intermedio `"redirecting"` y su propio `useEffect`.
  - Tipo `Step` extendido con `"redirecting"`.
- `ONG/src/app/routes.tsx` — la ruta `/join` ahora envuelve `<AccessCodeRedeemPage />` en `<ErrorBoundary>`; import de `ErrorBoundary` agregado.

## Eliminados

Ninguno.

## Carpetas afectadas

- `ONG/src/app/pages/landing/`
- `ONG/src/app/components/shared/`
- `ONG/src/app/`
- `changes/`
