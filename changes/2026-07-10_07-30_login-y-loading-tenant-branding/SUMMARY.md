# Resumen ejecutivo

## Qué se hizo
Se reemplazaron el ícono genérico de Login y el spinner de la pantalla de
carga del tenant por el isotipo oficial de Democra, se le dio al fondo y a
la tarjeta de Login la misma atmósfera visual (gradientes, vidrio esmerilado)
de la Landing Page, se añadió una micro-animación de flotación al logo de
carga, y se agregó un botón auxiliar "¿Necesitas ayuda para ingresar?" en
Login.

## Por qué se hizo
REQ-002 y REQ-003 (`dds/MEJORAS/09072026/REQ002.md`, `REQ003.md`) señalaron
que estas dos pantallas rompían la consistencia de marca del resto del
sitio, usando placeholders provisionales.

## Qué beneficio aporta
Experiencia de marca unificada desde el primer contacto (Landing) hasta el
ingreso a la aplicación (Login → carga del tenant), y un canal de ayuda
visible para usuarios con problemas de acceso, sin tocar la lógica de
autenticación.

## Qué funcionalidades quedaron afectadas
Ninguna se rompió. `handleSubmit`, la llamada a
`fn_get_user_redirect_target`, el toggle de contraseña y el bootstrap del
tenant (estados `unauthenticated`, `missing_profile`, `missing_tenant`,
`invalid_tenant`, `unsupported_industry`) permanecen sin cambios — solo se
tocó la pantalla de carga exitosa (`TenantBootstrapLoadingScreen`), no las
de error (`TenantStatusScreen`).
