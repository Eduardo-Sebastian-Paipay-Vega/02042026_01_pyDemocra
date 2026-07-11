# CHANGELOG — Validación de tipo MIME y tamaño en subidas a Supabase Storage

**Fecha:** 2026-07-11
**Hora:** 16:05 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Cerrar un gap de seguridad concreto: `uploadFileToStorage()` subía cualquier archivo a Supabase Storage sin validar su tipo MIME ni su tamaño. Fase 2 de 6 del hardening/testing/performance/docs pedido en esta sesión.

## Contexto del problema

La auditoría de seguridad interna ya existente (`dds/fases/fase_1_descubrimiento_y_analisis/red_teaming/auditorias/01-auditoria-seguridad-inicial.md`) señalaba como superficie de ataque: *"Subida de archivos (evidencias, fotos) — Riesgo de inyección de malware si no hay validación de MIME types y escaneo antivirus"*. Al revisar el código se confirmó que ese gap era 100% real: `ong/src/app/services/shared/storage.ts` (y su copia en `src/modules/ong/app/services/shared/storage.ts`) tomaban `request.file.type` tal cual lo reporta el navegador y lo pasaban directo a `supabase.storage.upload()` como `contentType`, sin ningún allow-list ni límite de tamaño.

## Motivo de la modificación

Un atacante (o un usuario descuidado) podía subir cualquier tipo de archivo — ejecutables, scripts, archivos arbitrariamente grandes — a cualquiera de los 5 buckets usados en la app (avatars, documentos de voluntarios, documentos de admisión, evidencia de onboarding, assets de proyectos/cursos/inventario).

## Solución implementada

1. **`ong/src/app/services/shared/storage.ts`** y **`src/modules/ong/app/services/shared/storage.ts`** (copias independientes hoy, ver hallazgo de la Fase 6 — se aplicó el mismo fix a ambas por separado):
   - Nuevos campos opcionales en `StorageUploadRequest`: `allowedMimeTypes?: readonly string[]` y `maxSizeBytes?: number`.
   - Nueva función privada `assertAllowedFile()` que rechaza (lanzando `Error` antes de tocar Supabase) un archivo cuyo `type` no esté en la lista permitida, o cuyo `size` exceda el máximo.
   - Cada bucket-getter (`getPeoplePhotoUploadBucket`, `getVolunteerDocumentsUploadBucket`, `getAdmissionDocumentsUploadBucket`, `getAdmissionOnboardingEvidenceBucket`, `getAssetsUploadBucket` — este último solo existe en la copia de `ong/src`) ahora devuelve también `allowedMimeTypes`/`maxSizeBytes`:
     - Fotos/avatars/assets: `image/jpeg`, `image/png`, `image/webp` — máximo 5 MB.
     - Documentos y evidencia: los mismos tipos de imagen + `application/pdf` — máximo 10 MB.
   - **Compatibilidad hacia atrás**: como todos los ~9 call sites existentes usan el patrón `{...getXBucket(), file, pathSegments}`, la validación se activa automáticamente sin tocar ningún componente de UI. Si algún caller futuro llama `uploadFileToStorage` sin pasar `allowedMimeTypes`/`maxSizeBytes` explícitos, no se valida nada (mismo comportamiento que antes).
2. **Tests nuevos** (`storage.test.ts` en ambas rutas, 5 tests cada uno): rechazo por tipo no permitido, rechazo por tamaño excedido, aceptación de PDF en bucket de documentos pero rechazo del mismo PDF como foto de perfil, caso feliz sin cambio de comportamiento, y compatibilidad hacia atrás cuando no se pasan las nuevas opciones.

## Riesgos identificados

- **Esto es validación del lado del cliente únicamente** (se ejecuta en el navegador antes del `upload()`). Un atacante que llame directamente a la API de Supabase Storage con un token válido, sin pasar por la UI, podría saltarse esta validación. La auditoría interna ya recomendaba una Edge Function del lado de Supabase que valide "Magic Numbers" (contenido real del archivo, no solo el `Content-Type` declarado) — **eso queda fuera de esta fase** por ser un cambio de infraestructura (requiere desplegar una Edge Function separada), documentado aquí como seguimiento explícito.
- El `type` de un `File` en el navegador se basa en la extensión/metadata que reporta el sistema operativo, no en el contenido real — sigue siendo posible renombrar un archivo malicioso con extensión `.png`. Esta validación reduce el riesgo (bloquea el 100% de los casos accidentales y una parte de los maliciosos) pero no lo elimina — consistente con lo ya documentado en la auditoría interna.

## Impacto esperado

Los usuarios que intenten subir un archivo fuera del tipo/tamaño esperado por cada formulario verán un error claro en vez de que el archivo se suba sin control. Ningún flujo existente cambia de comportamiento para archivos válidos.

## Módulos afectados

- `ong/src/app/services/shared/storage.ts`
- `ong/src/app/services/shared/storage.test.ts` (nuevo)
- `src/modules/ong/app/services/shared/storage.ts`
- `src/modules/ong/app/services/shared/storage.test.ts` (nuevo)

## Dependencias involucradas

Ninguna nueva.

## Posibles efectos secundarios

Ninguno para archivos que ya cumplían con los tipos/tamaños esperados por cada formulario. Si algún flujo de negocio real necesitaba subir un tipo de archivo distinto (ej. `.docx`), empezará a fallar — no se encontró ningún caso así en el código actual, pero vale la pena verificarlo si aparece un reporte de usuario.

## Verificación realizada

- `npm test` (backend): 334/334 sin cambios (no se tocó backend).
- `npm run test:web`: 278/278 (antes 268/268 — +10 tests nuevos, 0 regresiones).
- `npm run build`: compiló ambas apps sin errores.

## Cómo revertir

`git revert` del commit `fix(security): valida tipo MIME y tamaño antes de subir archivos a Storage`.
