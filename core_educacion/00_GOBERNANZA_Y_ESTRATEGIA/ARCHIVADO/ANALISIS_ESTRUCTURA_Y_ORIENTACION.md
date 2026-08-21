# 📊 ANÁLISIS ESTRUCTURAL DE FASES Y ORIENTACIÓN A INSTITUCIONES EDUCATIVAS

> **Proyecto**: Sistema de Gestión Educativa Integral  
> **Documento**: Mapa de Estructura Actual y Recomendaciones de Orientación  
> **Fecha**: 2026-05-16  
> **Autor**: Eduardo Sebastian Paipay Vega

---

## 🎯 RESUMEN EJECUTIVO

El proyecto tiene una **estructura sólida y bien definida en 6 fases**. Sin embargo, hay **3 áreas críticas** que requieren orientación específica hacia **instituciones educativas (colegios, academias, escuelas)**:

1. **Gestión de Matrícula y Planes de Pago** (actualmente genérico)
2. **Gestión de Profesores y Recursos Humanos** (débilmente cubierto)
3. **Procesos Administrativos Educativos** (muy genérico, necesita especificidad)

**Enfoque**: NO borrar, NO alterar → AGREGAR, MODIFICAR y ORIENTAR.

---

## 📋 ESTRUCTURA ACTUAL: LAS 6 FASES

### **✅ FASE 1: PROBLEMAS DETECTADOS**
**Estado**: ✅ BIEN ORIENTADA A EDUCACIÓN

**Qué tiene bien**:
- Problemas específicos de instituciones educativas ✅
- Abandono estudiantil 40-50% mes 2 ✅
- Fragmentación de herramientas educativas ✅
- Carga administrativa de coordinadores ✅
- Riesgo legal GDPR/FERPA ✅
- Profesores mencionados ✅

**Qué falta AGREGAR**:
- Problema específico: Falta de **gestión eficiente de planes de matrícula** (bimestral, anual, mensual)
- Problema específico: **Incompatibilidad de horarios** entre profesores y estudiantes
- Problema específico: **Dificultad en pagos parciales** (algunos padres no pueden pagar todo de una)
- Problema específico: **Inexistencia de plan de profesores** (contratación, horarios, evaluación docente)
- Problema específico: **Falta de seguimiento a padres de familia** como usuario activo

**Recomendación**: AGREGAR nueva sección "**Problemática 8: Gestión Deficiente de Matrícula y Planes de Pago**"

---

### **✅ FASE 2: PROPUESTA DE VALOR AGREGADO**
**Estado**: 🟡 PARCIALMENTE ORIENTADA

**Qué tiene bien**:
- Retención de estudiantes (crítico para colegios) ✅
- Automatización administrativa ✅
- Cumplimiento regulatorio ✅
- Comparativa con competencia (Moodle, Canvas, Google Classroom) ✅

**Qué falta AGREGAR**:
- **Segmento "Academias privadas"** (no está específicamente mencionado)
- **Valor para padres de familia** como principal stakeholder (solo mencionado como "padre")
- **Valor agregado en gestión de profesores**: "Plataforma centralizada para horarios, calificación, evaluación docente"
- **Valor para instituciones multilingües o múltiples sedes**

**Recomendación**: 
- AGREGAR nuevo segmento cliente: "**Academias y Centros de Capacitación**"
- MODIFICAR canvas de valor agregado para incluir: **Gestión Integral de Profesores y Horarios**
- AGREGAR tabla de "Dolores específicos de Coordinadores de Matrícula"

---

### **✅ FASE 3: REQUISITOS FUNCIONALES Y CASOS DE USO**
**Estado**: 🔴 NECESITA ORIENTACIÓN SIGNIFICATIVA

**Qué tiene bien**:
- Módulos educativos base (Enseñanza, Gamificación, Pagos, Comunicación) ✅
- Casos de uso detallados para estudiantes ✅
- Requisitos de seguridad y compliance ✅

**QUE FALTA AGREGAR - CRÍTICO**:

#### **a) Módulo 8: GESTIÓN DE PROFESORES Y HORARIOS**
Necesita nuevos requisitos funcionales:
- RF-021: Crear y gestionar perfiles de profesores (datos personales, especialidades, horarios)
- RF-022: Asignar profesores a cursos y secciones
- RF-023: Sistema de horarios con conflictos automáticos (no 2 profesores en mismo salón)
- RF-024: Evaluar desempeño docente (by estudiantes y coordinadores)
- RF-025: Gestionar contrataciones, renovaciones y terminaciones de profesores

#### **b) Módulo 9: GESTIÓN DE MATRÍCULA Y PLANES DE PAGO**
Necesita nuevos requisitos funcionales:
- RF-026: Crear planes de matrícula (mensual, bimestral, trimestral, anual)
- RF-027: Permitir inscripción en múltiples cursos con validación de horarios
- RF-028: Configurar cuotas, descuentos, becas por institución
- RF-029: Generar contratos de matrícula digitalmente firmados
- RF-030: Gestionar deudas, pagos parciales y planes de pago diferido

#### **c) Módulo 10: GESTIÓN ADMINISTRATIVA EDUCATIVA**
Necesita nuevos requisitos funcionales:
- RF-031: Generar certificados de estudios automáticamente
- RF-032: Gestionar carpetas académicas por estudiante (actas, reportes)
- RF-033: Crear reportes de desempeño por sección y grado
- RF-034: Seguimiento de asistencia por profesor y estudiante
- RF-035: Gestión de permisos, autorizaciones de salida, cambios de horario

#### **d) Módulo 11: GESTIÓN DE PADRES DE FAMILIA**
Necesita nuevos requisitos funcionales:
- RF-036: Portal específico para padres de familia con datos solo de su hijo
- RF-037: Notificaciones automáticas de calificaciones bajas, inasistencias
- RF-038: Sistema de comunicación bidireccional padre-institución
- RF-039: Autorización de actividades extracurriculares
- RF-040: Vista de estado de pagos y deuda histórica

**Recomendación**: 
- AGREGAR 20 nuevos requisitos funcionales (RF-021 a RF-040)
- AGREGAR 8-10 nuevos casos de uso para profesores y coordinadores de matrícula
- MODIFICAR matriz de trazabilidad para incluir estos nuevos RF y CU

---

### **✅ FASE 4: PLAN DE NEGOCIO**
**Estado**: 🟡 NECESITA AJUSTES DE SEGMENTOS

**Qué tiene bien**:
- Modelo financiero sólido (SaaS) ✅
- Go-to-market strategy clara ✅
- Proyecciones realistas ✅

**Qué falta MODIFICAR**:

#### **Segmentación Cliente MEJORADA**:
Cambiar de segmentación genérica a **específica educativa**:

**Actual**:
- Colegios privados
- Universidades pequeñas
- Redes de colegios
- Organismos públicos

**Propuesto** (AGREGAR especificidad):
- **Colegios Privados Urbanos** (500-2000 est., presupuesto medio-alto)
- **Academias Técnicas y Centros de Capacitación** (50-500 est., modelo matrícula flexible)
- **Escuelas Rurales e Integradas** (100-500 est., menos presupuesto, necesidades de acceso)
- **Redes de Colegios Multilingües** (3000-20000 est., múltiples sedes, sincronización crítica)
- **Universidades Pequeñas** (1000-5000 est., ciclos complejos)
- **Organismos Gubernamentales** (municipalidades, secretarías de educación)

**Recomendación**:
- MODIFICAR sección "👥 Segmentos de Clientes" con segmentación más específica
- AGREGAR tabla de "Pain Points específicos por tipo de institución educativa"
- AGREGAR ajuste de precios por segmento (ej: Academias pagan menos que colegios)

---

### **✅ FASE 5: BASE DE DATOS**
**Estado**: 🟡 ESTRUCTURA BIEN, PERO FALTA MODELADO EDUCATIVO

**Qué tiene bien**:
- Tablas base de usuarios, estudiantes, cursos ✅
- Relaciones claras ✅
- Campos de seguridad (encriptación, auditoría) ✅

**Qué falta AGREGAR - Nuevas Tablas**:

#### **a) Tablas para Gestión de Profesores**:
```
TABLA: profesores
- profesor_id (PK)
- usuario_id (FK)
- instituto_id (FK)
- especialidad (VARCHAR)
- titulo_academico (VARCHAR)
- numero_licencia (VARCHAR) ← IMPORTANTE
- fecha_contratacion (DATE)
- tipo_contrato (ENUM: tiempo_completo, medio_tiempo, honorarios)
- estado_contrato (ENUM: activo, suspendido, finalizado)
- salario_base (DECIMAL)
- fecha_evaluacion_anual (DATE)
```

#### **b) Tablas para Horarios y Secciones**:
```
TABLA: secciones
- seccion_id (PK)
- curso_id (FK)
- instituto_id (FK)
- numero_seccion (INT) ← Ej: 10-A, 10-B
- profesor_id (FK → profesores)
- capacidad_maxima (INT)
- horario_inicio (TIME)
- horario_fin (TIME)
- dia_semana (ENUM: lunes...viernes)
- salón (VARCHAR)

TABLA: horarios_profesor
- horario_profesor_id (PK)
- profesor_id (FK)
- seccion_id (FK)
- dia_semana (ENUM)
- hora_inicio (TIME)
- hora_fin (TIME)
- salon_id (FK) ← Para detectar conflictos
```

#### **c) Tablas para Gestión de Matrícula**:
```
TABLA: planes_matrícula
- plan_matricula_id (PK)
- instituto_id (FK)
- nombre (VARCHAR) ← Ej: "Plan Mensual", "Plan Anual"
- descripcion (TEXT)
- cuota_base (DECIMAL)
- numero_cuotas (INT)
- interes_mora (DECIMAL)
- activo (BOOLEAN)

TABLA: inscritos_plan
- inscrito_plan_id (PK)
- estudiante_id (FK)
- plan_matricula_id (FK)
- fecha_inicio (DATE)
- monto_total (DECIMAL)
- cuota_pagada_hasta (INT)
- deuda_acumulada (DECIMAL)

TABLA: becas_descuentos
- beca_id (PK)
- instituto_id (FK)
- estudiante_id (FK)
- tipo_beca (ENUM: académica, economica, deportiva)
- porcentaje_descuento (DECIMAL)
- fecha_inicio (DATE)
- fecha_fin (DATE)
```

#### **d) Tablas para Autorización y Documentos Educativos**:
```
TABLA: autorizaciones
- autorizacion_id (PK)
- estudiante_id (FK)
- tipo_autorizacion (ENUM: salida_institucion, actividad_extraescolar, uso_foto)
- estado (ENUM: pendiente, aprobada, rechazada)
- fecha_solicitud (TIMESTAMP)
- fecha_resolucion (TIMESTAMP)
- padre_id (FK → usuarios)
- documento_url (VARCHAR) ← Firma digital

TABLA: certificados_academicos
- certificado_id (PK)
- estudiante_id (FK)
- tipo (ENUM: conducta, notas, egreso)
- fecha_emisión (DATE)
- pdf_url (VARCHAR)
- numero_certificado (VARCHAR) ← Folio único
```

#### **e) Tabla para Evaluación Docente**:
```
TABLA: evaluaciones_docentes
- evaluacion_id (PK)
- profesor_id (FK)
- estudiante_id (FK)
- puntuacion (FLOAT 1-5)
- comentario (TEXT)
- fecha_evaluacion (DATE)
- anonimo (BOOLEAN)
```

**Recomendación**:
- AGREGAR 8 nuevas tablas específicas de educación
- MODIFICAR diagrama ER para incluir estas relaciones
- MANTENER el modelado actual (no borrar nada)

---

### **✅ FASE 6: DISEÑO UX/UI**
**Estado**: 🟡 NECESITA ORIENTACIÓN VISUAL Y NUEVAS PANTALLAS

**Qué tiene bien**:
- Principios de diseño claros (mobile-first, gamificación) ✅
- Wireframes para estudiante ✅
- Mapa de sitio general ✅

**Qué falta AGREGAR - Nuevas Pantallas/Secciones**:

#### **a) Portal de Profesores**:
```
DASHBOARD PROFESOR (Nueva)
├─ Mis Cursos y Secciones
├─ Calendario de Clases (con horarios)
├─ Estudiantes por Sección
├─ Calificar y Enviar Retroalimentación
├─ Ver Evaluaciones de Desempeño (by estudiantes)
├─ Horario Semanal (para detectar conflictos)
└─ Reportes de Asistencia
```

#### **b) Portal de Coordinador de Matrícula**:
```
DASHBOARD COORDINADOR (Nueva)
├─ Gestionar Planes de Matrícula
├─ Inscripciones Nuevas (validar horarios)
├─ Seguimiento de Pagos
├─ Becas y Descuentos
├─ Reportes de Deuda
├─ Contratos Digitales (firmados)
└─ Análisis de Retención
```

#### **c) Portal de Padres de Familia (Mejorado)**:
```
DASHBOARD PADRE (Existente pero MEJORAR)
├─ Datos de mi Hijo/a (foto, grado, sección)
├─ Calificaciones en Tiempo Real
├─ Asistencia por Día
├─ Próximas Evaluaciones
├─ Mensajes del Profesor
├─ Estado de Pagos (Deuda) ← CRÍTICO
├─ Autorizar Actividades
└─ Descargar Certificados
```

#### **d) Pantalla de Gestión de Horarios (Nueva)**:
```
GESTIÓN DE HORARIOS (Nueva)
Matriz de Conflictos:
┌─────────────────────────────────┐
│ Profesor | Lun | Mar | Mié | ... │
├─────────────────────────────────┤
│ Juan    | 9-10│10-11│     │     │
│         │(Sal.1)│(Sal.2)     │
│ María   │10-11│10-11│     │ ❌  │
│         │(Sal.1)│(Sal.2)┃Conflicto│
└─────────────────────────────────┘
```

**Recomendación**:
- AGREGAR 4 nuevos portales/dashboards específicos
- AGREGAR 15-20 nuevas pantallas (wireframes)
- MANTENER diseño actual (expandir, no reemplazar)

---

## 🎯 MATRIZ DE ORIENTACIÓN RECOMENDADA

| Fase | Estado Actual | Orientación Necesaria | Acción |
|------|---------------|-----------------------|--------|
| **Fase 1** | ✅ Bien | Agregar "Problemática de Matrícula" | AGREGAR 1 sección |
| **Fase 2** | 🟡 Parcial | Agregar segmento "Academias", mejorar valor profesor | MODIFICAR 2 secciones |
| **Fase 3** | 🔴 Incompleta | Agregar Módulos 8-11 y RF-021 a RF-040 | AGREGAR 20 RF + 8 CU |
| **Fase 4** | 🟡 Parcial | Segmentación más específica educativa | MODIFICAR 2 secciones |
| **Fase 5** | 🟡 Incompleta | Agregar 8 nuevas tablas educativas | AGREGAR 8 tablas |
| **Fase 6** | 🟡 Incompleta | Agregar 4 portales y 20 pantallas nuevas | AGREGAR 24 pantallas |

---

## 📝 PLAN DE EJECUCIÓN

### **Etapa 1: Completar Fase 3 (RF y CU)**
Agregar 20 nuevos requisitos funcionales específicos de:
- Gestión de Profesores
- Gestión de Matrícula
- Gestión Administrativa
- Gestión de Padres

### **Etapa 2: Actualizar Fase 5 (BD)**
Agregar 8 nuevas tablas y relaciones para soportar:
- Profesores y Horarios
- Planes de Matrícula
- Autorizaciones
- Evaluaciones Docentes

### **Etapa 3: Expandir Fase 6 (UX/UI)**
Crear 4 nuevos portales + 20 wireframes para:
- Dashboard Profesor
- Dashboard Coordinador Matrícula
- Dashboard Padre (mejorado)
- Gestor de Horarios

### **Etapa 4: Ajustar Fase 4 (Plan Negocio)**
Actualizar segmentación y precios según tipo de institución educativa

### **Etapa 5: Enriquecer Fases 1-2**
Agregar problemas y valor específicos de cada segmento

---

## ✅ CONCLUSIÓN

El proyecto tiene una **excelente base estructural**. Lo que necesita es:
- ✅ **AMPLIAR** con funcionalidades específicas de instituciones educativas
- ✅ **ORIENTAR** hacia realidades de colegios, academias, escuelas
- ✅ **DETALLE** en gestión de profesores y matrícula (actualmente débil)
- ❌ **NO borrar** nada existente
- ❌ **NO alterar** lo que funciona bien

Una vez completadas estas orientaciones, el proyecto será **específicamente diseñado para instituciones educativas**, no solo "educación en general".

---

*Documento de análisis completado: 2026-05-16*

---
