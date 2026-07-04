# Reglas de desarrollo — Democra

> Vigente desde 2026-07-04. Aplica a todo trabajo de Claude Code en este repositorio, en toda sesión futura, sin necesidad de que se solicite de nuevo.

## Regla obligatoria: auditoría de cambios y versionado

Cada vez que se realice un **cambio importante** (nueva funcionalidad, refactorización, corrección de error relevante, cambio de arquitectura, modificación de base de datos, cambio de UI significativo, etc.), se debe:

### 1. Crear una carpeta de auditoría

```
changes/YYYY-MM-DD_HH-MM_nombre-del-cambio/
```

Ejemplo: `changes/2026-07-04_16-35_mejora-modulo-ong/`

Con, como mínimo, estos 3 archivos:

**`CHANGELOG.md`** — debe incluir:
- Fecha y hora
- Objetivo del cambio
- Contexto del problema
- Motivo de la modificación
- Solución implementada
- Riesgos identificados
- Impacto esperado
- Módulos afectados
- Dependencias involucradas
- Posibles efectos secundarios
- Estado del cambio (Completado / Parcial / Pendiente)

**`SUMMARY.md`** — resumen ejecutivo:
- Qué se hizo
- Por qué se hizo
- Qué beneficio aporta
- Qué funcionalidades quedaron afectadas

**`FILES_CHANGED.md`** — lista completa:
- Archivos creados / modificados / eliminados, carpetas afectadas
- Qué cambió en cada uno (breve, por archivo)

La documentación debe ser suficientemente detallada como para servir de historial técnico real — no un resumen mínimo. Cualquier desarrollador debe poder entender qué ocurrió, cuándo, por qué, quién lo hizo (Claude) y cómo revertirlo.

### 2. Commit en Conventional Commits

Cada cambio importante termina en un commit. Formato:

```
tipo(alcance): descripción exacta del cambio

feat(ong): agrega sistema de validación de beneficiarios
fix(auth): corrige expiración del JWT
refactor(database): reorganiza repositorios
style(ui): mejora consistencia visual del dashboard
```

### 3. Push a GitHub

Cuando el cambio quede terminado y estable:
1. Verificar que el proyecto compile.
2. Verificar que no existan errores nuevos.
3. Ejecutar las pruebas disponibles.
4. Confirmar que no se rompió funcionalidad existente.
5. Commit.
6. **Push inmediato a `origin/main`** — no acumular cambios grandes sin subirlos. Esto es autorización permanente para hacer push sin volver a preguntar, siempre que los pasos 1–4 se hayan verificado y el cambio esté genuinamente estable. Si algo queda incierto, roto, o parcialmente probado, no se hace push — se reporta el motivo en vez de forzarlo.

## Objetivo de esta regla

Trazabilidad completa, auditorías técnicas simples, reversión sencilla ante problemas, y un remoto (`origin/main`) siempre sincronizado con el estado real del trabajo.
