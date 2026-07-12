# SUMMARY — Incidente de producción resuelto

**Qué se hizo:** Se convirtió `server/services/email/` de TypeScript a JavaScript plano y se corrigió el import roto en `otp-mailer.js`, tras un incidente breve donde toda la API de producción devolvía 500.

**Por qué se hizo:** El backend de este proyecto no tiene paso de build — Vercel ejecuta los archivos `server/**/*.js` tal cual con Node nativo. El módulo de email (escrito en TypeScript, con imports usando extensión `.ts` literal) nunca se había ejecutado fuera de Jest (que sí transpila con Babel), así que el problema pasó inadvertido hasta el deploy a producción.

**Qué beneficio aporta:** La API vuelve a funcionar en producción. Se verificó exhaustivamente (incluyendo una prueba bajo Node puro que replica exactamente el runtime de Vercel) antes de redesplegar, para no repetir el mismo tipo de fallo.

**Qué funcionalidades quedaron afectadas:** Ninguna — mismo comportamiento del módulo de email, ahora en JS ejecutable. Cronología completa del incidente (detección, rollback, causa raíz, fix, redeploy) documentada en el CHANGELOG.
