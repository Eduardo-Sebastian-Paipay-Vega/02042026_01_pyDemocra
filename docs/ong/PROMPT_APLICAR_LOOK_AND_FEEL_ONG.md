# Prompt — Aplicar LOOK_AND_FEEL_ONG.md al módulo ONG (`src/modules/ong/`)

> Pega este documento completo como prompt inicial de una sesión de Claude Code (o similar) sobre el repositorio de Democra.

## Contexto

Existe un documento de diseño ya generado: **`LOOK_AND_FEEL_ONG.md`** (raíz del repo). Es la guía oficial e integral de identidad visual, tipografía, color, espaciado, componentes, estados, accesibilidad y microcopys para el módulo ONG.

Tu única tarea es **aplicar esa guía como cambios de presentación** al módulo ONG ya existente en el código. No la reinterpretes ni propongas una alternativa: implementa lo que dice, con la máxima fidelidad posible.

## Alcance — léelo dos veces antes de tocar un archivo

Este repositorio contiene **dos implementaciones distintas del módulo ONG**:

- **`src/modules/ong/`** (raíz) — la versión vigente e integrada, con soporte ACE (Access & Context Engine). **Este es el único objetivo de este prompt.**
- **`ONG/`** (carpeta independiente, con su propio `package.json`) — versión más antigua y duplicada, documentada como tal en `AUDIT_REPORT.md`. **Fuera de alcance. No tocar ningún archivo dentro de `ONG/`.**

Dentro de `src/modules/ong/`, la estructura relevante es:

```
src/modules/ong/
├── app/
│   ├── components/{layout,shared,ui}/   ← componentes reutilizados por todo el módulo
│   ├── modules/{governance,home,notifications,people,projects,settings}/components/
│   ├── pages/                            ← ~40 páginas (Dashboard, Beneficiaries, Volunteers, Finance, ...)
│   ├── services/                         ← lógica de datos — FUERA DE ALCANCE
│   ├── tenant/                           ← bootstrap multi-tenant — FUERA DE ALCANCE
│   └── lib/theme-context.tsx             ← contexto de tema existente, punto de entrada para tokens
└── styles/index.css                      ← sistema de tokens de diseño existente (variables --t-*)
```

**No modificar ningún otro módulo** (landing, nosotros, `server/`, `ONG/`). No tocar componentes verdaderamente compartidos fuera de `src/modules/ong/` salvo que exista (o debas crear) una variante exclusiva para ONG — nunca cambies el original compartido.

## Restricciones — comportamiento funcional intacto

No modificar bajo ningún concepto:

- lógica de negocio, reglas de validación, permisos, autenticación
- rutas, contratos de API, llamadas a `services/*`
- modelos de datos, `tenant/bootstrap.ts`, estado global, flujo de navegación

Todo archivo bajo `app/services/`, `app/tenant/`, `app/data/` y `app/lib/` (salvo `theme-context.tsx`) se considera lógica: si una tarea de esta implementación parece requerir tocarlos, deténte y repórtalo en vez de modificarlos. Solo se puede modificar: JSX/estructura visual, clases/estilos, `styles/index.css`, y los componentes bajo `app/components/` y `app/modules/*/components/`.

## Fuente de verdad y sistema de tokens existente

Toda decisión de color, tipografía, espaciado y estado visual debe salir de `LOOK_AND_FEEL_ONG.md`. Ante un conflicto entre el diseño actual del código y el documento, **gana el documento**.

Este módulo ya tiene un sistema de tokens CSS (`--t-text`, `--t-text-secondary`, `--t-text-dim`, `--t-surface`, `--t-elevated`, `--t-border`, `--t-hover`, `--t-input-bg`, ver `src/modules/ong/styles/index.css` y `app/lib/theme-context.tsx`, y la convención documentada en `CONTRIBUTING.md`). **Mapea las decisiones de `LOOK_AND_FEEL_ONG.md` sobre estos tokens existentes** — actualiza sus valores/añade los que falten — en vez de introducir clases Tailwind con colores fijos o un sistema paralelo. Esto es una regla de la casa, no una preferencia opcional.

## Paso 1 — Auditoría previa (obligatoria antes de escribir código)

1. Lee `LOOK_AND_FEEL_ONG.md` completo.
2. Recorre `src/modules/ong/app/{components,modules,pages}` y el sistema de tokens actual.
3. Genera una lista de brechas: qué pantallas/componentes ya cumplen la guía, cuáles no, y por qué (color, tipografía, espaciado, estados, accesibilidad, animación, microcopy).
4. Prioriza por impacto visual (páginas/componentes de mayor uso primero: layout, navegación, Dashboard, componentes `shared/` y `ui/` antes que páginas individuales).
5. No empieces a implementar hasta terminar este paso.

## Paso 2 — Implementación incremental

- Aplica cambios de forma incremental, manteniendo el sistema funcional en cada paso.
- Reutiliza componentes existentes (`app/components/ui/`, `app/components/shared/`) en vez de crear duplicados; si un patrón se repite en 3+ pantallas y no existe componente para ello, créalo ahí.
- Evita estilos arbitrarios: todo color/espaciado/tamaño debe trazarse a una decisión de `LOOK_AND_FEEL_ONG.md` o a un token existente.
- Ninguna pantalla del módulo debe quedar con el diseño anterior si el documento define uno nuevo para ese tipo de elemento.
- Anima solo lo que el documento indica que debe animarse; nada de efectos añadidos por iniciativa propia.

## Paso 3 — Validación

Antes de cerrar, verifica y confirma explícitamente:

- [ ] Todas las pantallas de `src/modules/ong/app/pages/` revisadas contra la guía
- [ ] Consistencia: mismos botones/inputs/tablas/cards se ven igual en todo el módulo
- [ ] Accesibilidad: contraste, tamaños mínimos, estados de foco, navegación por teclado
- [ ] `npm run dev` sigue levantando los 3 servicios sin errores (`npm run validate`)
- [ ] `npm run build` (raíz) sigue compilando sin nuevos errores
- [ ] Ningún archivo fuera de `src/modules/ong/` fue modificado
- [ ] Ningún archivo de `app/services/`, `app/tenant/`, `app/data/` fue modificado
- [ ] El comportamiento funcional (clics, formularios, navegación, permisos) es idéntico al anterior

## Entregable

Al finalizar, genera `LOOK_AND_FEEL_IMPLEMENTATION_REPORT.md` en la raíz del repo con:

1. **Resumen ejecutivo** — objetivo, alcance, resultado.
2. **Auditoría inicial** — brechas encontradas (del Paso 1).
3. **Cambios aplicados** — agrupados por: layout/navegación, componentes (`ui/`, `shared/`), páginas, formularios, tablas, cards, color, tipografía, accesibilidad, animaciones.
4. **Archivos modificados** — lista real, con el motivo de cada cambio.
5. **Verificación** — el checklist del Paso 3, marcado.
6. **Pendientes** — cualquier punto de `LOOK_AND_FEEL_ONG.md` que no se pudo aplicar tal cual por una limitación real del código existente, con la alternativa visual más cercana adoptada y su justificación.
