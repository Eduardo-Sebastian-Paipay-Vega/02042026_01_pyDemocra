# CHANGELOG — Hardening de dependencias: 0 vulnerabilidades de npm audit

**Fecha:** 2026-07-11
**Hora:** 15:30 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Eliminar las 4 vulnerabilidades reportadas por `npm audit` (1 crítica, 2 altas, 1 moderada) como primera fase de un pedido más amplio de hardening/testing/performance/docs. Fase 1 de 6 (ver `dds/` o el plan de la sesión para el resto).

## Contexto del problema

`npm audit` reportaba desde hace varias sesiones (confirmado en `changes/2026-07-06_14-00_instala-dependencias-swagger-jest/CHANGELOG.md`, donde se documentó explícitamente que NO se resolvían por requerir versiones mayores fuera de alcance en ese momento):

- `jspdf` (`^2.5.2`) — **crítico**, fix solo disponible en `4.2.1` (salto mayor).
- `dompurify` — moderado, dependencia transitiva de `jspdf`, se resuelve junto con el bump de `jspdf`.
- `react-router` (`7.13.0`) — alto, fix disponible en `7.18.1` (no-mayor).
- `vite` (`6.3.5`) — alto, fix disponible en `6.4.3` (no-mayor).

## Motivo de la modificación

Un pedido explícito de hardening de seguridad debe, como mínimo, cerrar vulnerabilidades conocidas y parcheables de dependencias. `react-router`/`vite` eran de bajo riesgo (fix no-mayor). `jspdf` requería más cuidado por ser un salto mayor (2.x → 4.x) con solo 2 call sites en todo el frontend.

## Solución implementada

1. `npm install react-router@7.18.1 vite@6.4.3` — sin cambios de API esperados (mismo major).
2. `npm install jspdf@4.2.1` — salto mayor. Arrastra el fix de `dompurify` (dependencia transitiva, ya no aparece en `npm audit`).
3. Verificación exhaustiva del salto mayor de `jspdf` antes de dar por bueno el cambio:
   - Revisión manual de los 2 únicos call sites: `ong/src/app/modules/people/idCardPdfExport.ts` y `idCardBatch.ts` (funciones `exportIdCardPdf`, `exportIdCardPdfFromConfig`, `exportIdCardsBatch`).
   - `npx tsc --noEmit`: 0 errores nuevos atribuibles a `jspdf` (se confirmó vía `git stash` que los 6 errores preexistentes en `IdCards.tsx` sobre `Variants` de `framer-motion` ya existían ANTES del bump, no están relacionados).
   - Script de verificación aislado (`.tmp-verify-jspdf.mjs`, ejecutado y eliminado tras la prueba) que ejercita exactamente la misma superficie de API que usa el código de producción: constructor `new jsPDF({ orientation, unit: "mm", format: [w, h] })`, `addImage(dataUrl, "PNG", x, y, w, h)`, `setDrawColor`/`setLineWidth`/`line` (crop marks), `addPage([w,h], orientation)` (export por lotes multi-página), y `output("datauristring")`/`output("arraybuffer")`. Resultado: PDFs válidos (header `%PDF-1.3`, trailer `%%EOF`, 3 páginas confirmadas en el caso de lote, imagen y trazos de línea presentes en la estructura interna del PDF).
   - **No se pudo hacer una prueba manual end-to-end en navegador** (login real + flujo de OTP del motor de riesgo + navegación a `/ong` → IdCards → exportar) porque el entorno no tiene `chromium-cli` disponible y no hay credenciales de prueba en este contexto. Se documenta esta limitación explícitamente en vez de afirmar una verificación que no se hizo. Recomendación: la próxima vez que alguien use la función de exportación de carnets en la UI real, confirmar visualmente que el PDF se ve correcto (imagen nítida, crop marks en las 4 esquinas).
4. Suite completa corrida después de cada paso: `npm test` (backend, 334/334) y `npm run test:web` (frontend, 268/268 en 79 archivos) — ambos en verde, sin cambios de cobertura.
5. `npm run build` — compiló ambas apps (`/` y `/ong`) sin errores.

## Riesgos identificados

- El bump de `jspdf` no tiene cobertura de tests automatizados propia (no existían tests para `idCardPdfExport.ts`/`idCardBatch.ts` antes de este cambio — fuera del alcance de esta fase, se abordará si el módulo `people` entra en el tier de cobertura de la Fase 3).
- La verificación de la API se hizo con un script aislado que reproduce las llamadas reales, no con la app corriendo en un navegador real. Riesgo residual bajo (la superficie de API verificada es exactamente la que usa el código), pero no es 100% equivalente a una prueba manual en UI.

## Impacto esperado

Ninguno en comportamiento — mismo output visual esperado de los PDFs. `npm audit` pasa de 4 a 0 vulnerabilidades.

## Módulos afectados

- `package.json` / `package-lock.json` (versiones de `react-router`, `vite`, `jspdf`).
- Ningún archivo de código de producción modificado en esta fase.

## Dependencias involucradas

- `react-router` 7.13.0 → 7.18.1
- `vite` 6.3.5 → 6.4.3
- `jspdf` ^2.5.2 → 4.2.1 (`dompurify` transitivo se resuelve solo)

## Posibles efectos secundarios

- Si en el futuro se usa alguna función de `jspdf` no cubierta por los 2 call sites actuales (ej. `jspdf-autotable` u otro plugin), debe verificarse por separado — esta fase solo cubrió la superficie de API realmente usada hoy.

## Cómo revertir

`npm install jspdf@2.5.2 react-router@7.13.0 vite@6.3.5` y `git checkout -- package.json package-lock.json` sobre el commit anterior a este.
