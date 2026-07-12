# Resumen ejecutivo

## Qué se hizo

Se construyó un módulo de email completo (`server/services/email/`) usando el SDK oficial de Resend, en TypeScript, siguiendo SOLID: configuración validada, cliente singleton, 8 tipos de correo con plantillas HTML separadas (OTP, verificación, bienvenida, reset de contraseña, invitación, alerta, notificación, auditoría), reintentos con backoff ante errores transitorios, validación previa, manejo de errores sin fallos silenciosos, logging estructurado, y documentación completa (`README.md`). El envío de OTP existente (`otp-mailer.js`) se migró para usar este módulo por debajo, sin cambiar su contrato público.

## Por qué se hizo

El proyecto ya dependía de Resend pero solo para OTP, con `fetch` manual y HTML embebido — no había forma de reutilizar esa infraestructura para ningún otro tipo de correo sin duplicar código. Pedido explícito del usuario de una integración production-ready, extensible y tipada.

## Qué beneficio aporta

- Cualquier flujo nuevo (bienvenida, invitaciones, alertas, auditoría, etc.) puede enviar correo con una llamada de una línea, con el mismo branding, logging y manejo de errores.
- El módulo es extensible sin tocar código existente: un tipo de correo nuevo es un archivo de plantilla + un tipo de datos.
- El flujo de OTP se volvió más robusto (ya no puede tumbar el proceso ante un error de red no capturado) sin cambiar su comportamiento observable para quien lo llama.
- Documentación operativa completa: cómo configurar el dominio en Resend, cómo probar, cómo agregar templates, y un análisis razonado de por qué el proyecto debe seguir enviando todo desde el backend (Opción B) en vez de delegar en el SMTP de Supabase (Opción A).

## Qué funcionalidades quedaron afectadas

- **OTP de step-up (MFA)**: sigue funcionando igual para quien lo consume (`risk-engine.js`), ahora vía el SDK oficial de Resend en vez de `fetch` manual.
- **Ninguna otra funcionalidad existente** se modificó — el resto del cambio es código nuevo (el módulo de email) más limpieza de configuración que ya estaba muerta.
