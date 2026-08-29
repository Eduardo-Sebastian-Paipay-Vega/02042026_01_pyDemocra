# INFORME DE AUDITORÍA ARQUITECTÓNICA: MÓDULO DE ADMISIÓN

**Fecha:** 2026-08-28
**Autor:** Antigravity (Auditor Senior / Arquitecto BD)
**Objetivo:** Auditoría exhaustiva del flujo documental, esquema de base de datos (`BD.json`) y submódulos de la interfaz de Admisión.

---

## 1. Diagnóstico General del Flujo y Lógica Documental

El ecosistema de Admisión está diseñado bajo una arquitectura robusta de multi-tenancy (se observa `tenant_id` obligatorio en todas las entidades) y una clara separación de responsabilidades en el esquema `rrhh`. 

**Ciclo de Vida y Transición:**
El flujo end-to-end revela una decisión de diseño arquitectónico crítica: **la separación entre Postulante y Voluntario**. 
1. El postulante nace en `rrhh.solicitudes_admision`.
2. Se enriquece con `documentos_admision` y `entrevistas_admision` ancladas al `id_solicitud`.
3. Existe una barrera de "Conversión": Una vez aprobada la solicitud, el sistema exige crear un registro real en `ong.voluntarios` y almacenar el enlace en `id_voluntario_vinculado`.
4. El proceso de *Onboarding* (`onboarding_voluntario`) **no está atado a la solicitud**, sino a `id_voluntario`. Esto significa que el Onboarding es estrictamente un proceso post-admisión (inducción de personal).

**Fallas en el mecanismo de reintento documental:**
El ciclo de vida documental es frágil. La tabla `documentos_admision` solo posee un flag booleano (`verificado`). Si un documento es rechazado (ej. DNI borroso), no hay un flujo nativo de reintento ni campos para almacenar motivos de rechazo, forzando a los usuarios a usar notas generales de la solicitud o eliminar físicamente el registro del documento.

---

## 2. Análisis Detallado por Submódulo

### 2.1. Solicitudes (Registro Inicial)
- **Soporte BD:** Tabla `rrhh.solicitudes_admision` + `rrhh.admision_estado_historial`.
- **Evaluación:** Excelente trazabilidad de estados. El uso de `admision_estado_historial` (`estado_anterior`, `estado_nuevo`, `comentario`, `cambiado_por`) es una gran práctica para auditorías de cumplimiento. 
- **Deficiencia:** La columna `estado` en la tabla principal es `character varying` sin una tabla catalógica (como sí la tiene `ong.estados_voluntario`). Esto permite inconsistencias a nivel de inserción de datos ("En Revision" vs "En Revisión").

### 2.2. Documentos (Verificación)
- **Soporte BD:** Tabla `rrhh.documentos_admision`.
- **Evaluación:** Incluye logs de auditoría estándar (`created_at`, `updated_by`, etc.) y firma del verificador (`verified_by`, `verified_at`).
- **Deficiencia:** Solo admite un estado binario (verificado: true/false). No maneja versionado de archivos (`archivo_url` se sobreescribiría en caso de actualización) y carece de un campo `comentarios_verificacion` para el feedback.

### 2.3. Entrevistas
- **Soporte BD:** Tabla `rrhh.entrevistas_admision`.
- **Evaluación:** Muy completa. Soporta métricas cuantitativas (`puntaje` numeric) y cualitativas (`comentarios` text, `resultado` varchar), además de enlazar con el evaluador (`entrevistador_id`).
- **Deficiencia:** Al igual que en Solicitudes, `resultado` es un string libre. Si se requiere hacer analítica de aprobación/rechazo en entrevistas, debería restringirse mediante un constraint o Enum en PostgreSQL.

### 2.4. Onboarding (Inducción)
- **Soporte BD:** Tablas `rrhh.onboarding_pasos` (catálogo) y `rrhh.onboarding_voluntario` (transaccional).
- **Evaluación:** La arquitectura modular (catálogo vs. progreso del voluntario) permite configurar dinámicamente checklists institucionales (`orden`, `obligatorio`). Incluye carga probatoria (`evidencia_url`).
- **Deficiencia:** Ninguna funcional severa, pero es la **única** tabla del módulo que implementa *Soft Delete* (`is_deleted`, `deleted_at`, `deleted_by`). Las demás tablas sufren riesgo de borrado físico (Hard Delete).

---

## 3. Matriz de Hallazgos y Errores en `BD.json` (Gap Analysis)

| Entidad / Tabla | Hallazgo / Brecha Identificada | Nivel de Riesgo | Solución Recomendada |
| :--- | :--- | :---: | :--- |
| `documentos_admision` | **Carencia de estado y feedback de rechazo.** Un boolean `verificado` no diferencia entre "Pendiente de revisar" y "Rechazado". | Alto | Cambiar `verificado` boolean por `estado` (enum: PENDING, APPROVED, REJECTED) y agregar `notas_verificacion` (text). |
| `solicitudes_admision` | **Hard-deletes expuestos.** No existen campos `deleted_at`. Si se elimina una solicitud por error, se pierde la traza. | Alto | Implementar patrón Soft-Delete (como en `onboarding_voluntario`). |
| `solicitudes_admision` | **Diccionario de datos débil.** El `estado` no está normalizado frente a una tabla catálogo, a diferencia de los voluntarios (`ong.estados_voluntario`). | Medio | Crear la tabla `rrhh.cat_estados_admision` y establecer la FK, o forzar un constraint tipo `CHECK` en SQL. |
| `documentos_admision` | **Ausencia de control de versiones.** Si el candidato resube un archivo, se pierde el rastro del archivo anterior rechazado. | Medio | Permitir múltiples registros con el mismo `tipo_documento` pero con un flag `es_vigente`, o llevar el tracking de reintentos. |
| Toda la base de datos | **Reglas RLS Inconsistentes.** Solo las tablas en `educa` y `clinico` indican `"rls_enabled": true`. Las de `rrhh` devuelven `false`. | Alto | Habilitar RLS en todo el esquema `rrhh` para evitar accesos cruzados entre `tenant_ids`. |

---

## 4. Diagrama Textual de Transición de Estados (State Machine)

Con base en la estructura de conversión extraída, la máquina de estados implícita que debes garantizar en la UI y el backend es:

```text
[ NUEVO REGISTRO ] --> (ESTADO: PENDIENTE)
                             │
                             ▼
                     (ESTADO: EN_REVISIÓN) <───────┐ (Reintento de Documentos)
                             │                     │
      [¿Documentos OK?] ─────┴────(No)─────────────┘
             │(Sí)
             ▼
                     (ESTADO: ENTREVISTA)
                             │
     [¿Aprobó entrevista?]───┴────(No)──> (ESTADO: RECHAZADA) ─> [ FIN ]
             │(Sí)
             ▼
                     (ESTADO: APROBADA)
                             │
             [ BOTÓN UI: "Convertir a Voluntario" ]
             (Genera rrhh.codigos_registro_voluntario)
                             │
             [ Alta en tabla ong.voluntarios ]
                             │
             ▼
                     (ESTADO: CONVERTIDA)
                             │
                             ▼
              [ INICIA MÓDULO DE ONBOARDING ]
           (Se usan rrhh.onboarding_voluntario)
```

---

## 5. Plan de Acción y Recomendaciones Técnicas

1. **Parche de Esquema Documental (Urgente):**
   Crear una migración en Supabase (`npx supabase migration new fix_admission_documents`) para inyectar una columna de feedback y un estado real en lugar de un boolean:
   ```sql
   ALTER TABLE rrhh.documentos_admision 
   ADD COLUMN estado_validacion VARCHAR(50) DEFAULT 'PENDIENTE',
   ADD COLUMN comentarios_rechazo TEXT;
   ```
2. **Estandarización de Seguridad (DevSecOps):**
   Exigir a través de políticas SQL que la seguridad a nivel de filas (RLS) se active en `rrhh.solicitudes_admision` y derivadas, validando obligatoriamente que `auth.uid() = tenant_id`.
3. **Optimización de Interfaz (Frontend):**
   En la interfaz de Documentos, el botón actual de verificación debe desgajarse en dos: **"Aprobar"** y **"Rechazar"**. Si se rechaza, forzar la apertura de un Modal para ingresar el motivo de rechazo (alojado en `comentarios_rechazo`), notificando automáticamente al postulante.
