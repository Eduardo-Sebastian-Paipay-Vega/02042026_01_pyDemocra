# Resumen ejecutivo

## Qué se hizo

Se agregó verificación de cuenta por correo (con botón, bloqueante) para cuentas nuevas, se conectó al login real el motor de OTP por dispositivo/IP nuevo que ya existía en el backend pero nunca se invocaba desde el frontend, y se agregó una notificación por correo cuando ocurre un inicio de sesión desde un dispositivo no reconocido.

## Por qué se hizo

El usuario pidió estas tres funcionalidades asumiendo que la parte de OTP de login ya podía no estar funcionando. Al investigar se confirmó que efectivamente no estaba conectada: `Login.tsx` iniciaba sesión directo contra Supabase sin pasar nunca por el endpoint `/api/auth/risk-evaluate` que ya calcula el riesgo y exige OTP en dispositivos nuevos.

## Qué beneficio aporta

- Ninguna cuenta nueva puede operar en la plataforma sin confirmar que el correo le pertenece.
- Un login desde un dispositivo nuevo ahora exige un código OTP real (antes no exigía nada) y notifica al dueño de la cuenta por correo.
- Se reutilizó al 100% la infraestructura ya existente (plantillas de correo, motor de riesgo, patrón de estados de bootstrap) — no se inventó ningún mecanismo nuevo.

## Qué funcionalidades quedaron afectadas

- Flujo de registro (`CreateTenantPage` → `bootstrap-tenant`): ahora dispara un correo de verificación al final.
- Flujo de login (`Login.tsx`): ahora puede detenerse en una pantalla de OTP antes de entrar a la app.
- Bootstrap del tenant (`bootstrap.ts`/`routes.tsx`): nuevo estado `email_unverified` que bloquea el acceso a la SPA hasta verificar.
- Ningún flujo existente (permisos, módulos, sesiones de terminal, otros correos) se modificó.
