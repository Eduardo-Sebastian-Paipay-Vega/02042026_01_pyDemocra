# CHANGELOG — Design System: Admission Documents

**Fecha:** 2026-08-28 12:57 -05:00
**Autor:** Claude (Antigravity)

## Objetivo
Aplicar el Design System dark mode (tokens warm-dark) a la página de Documentos de Admisión (`/ong/app/admission/documents`).

## Contexto del problema
La página utilizaba las variables `--t-*` genéricas sin un scope CSS propio. Otros módulos del proyecto (Dashboard, Medical Records) ya tienen scopes con paletas personalizadas (`.panel-principal-theme`, `.fichas-medicas-theme`). El usuario solicitó aplicar una paleta warm-dark específica con tokens definidos.

## Motivo de la modificación
El usuario proporcionó un Design System completo con tokens exactos:
- Background principal: `#100F0D`
- Cards/Surfaces: `#171512`
- Borders: `#26231F`
- Texto primario: `#F9F7F3`, secundario: `#A4A29F`, muted: `#686561`
- Accent CTA: `#356C92`, Emerald: `#08996A`, Purple: `#8B5CF6`, Amber: `#D97706`

## Solución implementada
1. **Nuevo scope CSS** `.admision-docs-theme` en `index.css` que mapea los tokens del usuario a las variables `--t-*` existentes, activo solo en modo oscuro (`data-app-theme="oscuro"`).
2. **Wrapper del componente** con la clase `admision-docs-theme` en el `<motion.div>` raíz.
3. **4 KPI Cards** (Bento Grid row) que muestran métricas reales derivadas de los hooks existentes (`useSolicitudesAdmision`, `useDocumentosAdmision`): total solicitudes, documentos pendientes, tasa de aprobación, documentos rechazados. Con badges pill colorizados (green/amber/red) según la spec.
4. **Empty States mejorados** con icono desaturado en contenedor soft (`bg var(--t-hover)`, `rounded-xl`), título `text-sm font-medium`, subtítulo `text-xs text-center max-w-xs`.
5. **Cards con `rounded-xl`** (12px) en lugar de `rounded-2xl` para mejor coherencia con el Design System.
6. **Botón close** del modal reemplazado de texto "X" a ícono `<X>` de lucide-react con hover interactivo.
7. **Toda la data es real**: las KPIs se computan de `requests.rows` y `documents.rows`. Cero datos mock.

## Riesgos identificados
- El scope CSS solo se activa en `data-app-theme="oscuro"`. En modo claro, las variables `--t-*` no se sobrescriben y la página se renderiza con la paleta default del tema claro — esto es intencional y consistente con el patrón del proyecto.
- Los errores TS preexistentes en `ong/src/app/services/operacion/*.ts` no están relacionados con este cambio.

## Impacto esperado
- Mejora visual significativa en modo oscuro con la paleta warm-dark solicitada.
- KPIs ofrecen visibilidad rápida del estado documental sin navegar la tabla.
- Empty states más coherentes con el Design System.

## Módulos afectados
- `ong/src/app/pages/AdmissionDocuments.tsx`
- `ong/src/styles/index.css`

## Dependencias involucradas
- `lucide-react` (ya presente en el proyecto)
- Sin nuevas dependencias

## Posibles efectos secundarios
- Ninguno: el scope CSS es aislado y el componente ya consumía variables `--t-*`.

## Estado del cambio
✅ **Completado**
