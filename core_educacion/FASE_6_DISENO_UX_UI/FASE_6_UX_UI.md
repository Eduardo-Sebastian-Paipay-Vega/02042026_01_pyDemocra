# 🎨 FASE 6: DISEÑO UX / UI — EDUCACION OS

> **Estado DDS:** `DOC_UPDATED` | **Última Auditoría:** 2026-08-02 | **Nivel de Cobertura:** 100%
> **Trazabilidad:** Integrado con el Esquema Global DDS.

---

## 1. Introducción y Principios de Diseño

Este documento define la arquitectura de interfaz de usuario y experiencia de usuario (UX/UI) para un sistema de gestión educativa integral orientado a **academias, colegios, universidades y redes educativas**.

### 1.1 Orientación Institucional

El diseño de UX/UI está específicamente optimizado para:

- **Académicos/Directores**: Visibilidad estratégica en tiempo real, reportes ejecutivos, toma de decisiones
- **Coordinadores de Matrícula**: Flujos simplificados para inscripción, gestión de planes de pago, resolución de conflictos
- **Profesores**: Gestión de clases, calificaciones, comunicación con estudiantes y padres
- **Padres de Familia**: Visibilidad 360° del desempeño de sus hijos, historial de pagos, comunicación directa
- **Administrativos**: Reportes financieros, gestión de documentos, auditoría de procesos

### 1.2 Principios de Diseño Fundamentales

1. **Simplicidad Operacional**: Reducir clics, minimizar pasos para tareas críticas
2. **Claridad Visual**: Iconografía educativa consistente, uso de colores semánticos
3. **Eficiencia**: Dashboards contextuales que muestren información relevante al primer vistazo
4. **Accesibilidad**: Cumplimiento WCAG 2.1 AA, soporte para múltiples dispositivos
5. **Localización**: Adaptar a calendarios académicos, nomenclatura regional, idiomas

---

## 2. Portal del Coordinador de Matrícula (NUEVO)

### 2.1 Descripción Funcional

Portal especializado para gestión integral de inscripciones, planes de pago y resolución de conflictos de horario. Target: Coordinadores de Admisión y Personal Administrativo.

**Objetivo Clave**: Reducir tiempo de inscripción de 45 minutos a <10 minutos por estudiante.

### 2.2 Secciones Principales

#### 2.2.1 Dashboard de Matrícula
```
┌─────────────────────────────────────────────────────────┐
│  GESTIÓN DE MATRÍCULA - Semestre 2026-I                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  MÉTRICAS CRÍTICAS:                                     │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Inscritos    │ Cupos Libres │ Deuda Total  │        │
│  │    245       │      55      │   $42,500    │        │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                          │
│  ACCIONES RÁPIDAS:                                      │
│  ┌────────────────────────────────────────────┐        │
│  │ [+ Nueva Inscripción]  [Ver Conflictos]    │        │
│  │ [Generar Recibos]      [Reporte de Deuda] │        │
│  └────────────────────────────────────────────┘        │
│                                                          │
│  INSCRIPCIONES RECIENTES:                              │
│  ┌────────────────────────────────────────────┐        │
│  │ Juan Pérez       10-A    $1,200  ✓ Pagado │        │
│  │ María García     9-B     $900   ⏳ Pendiente│        │
│  │ Carlos López     11-C    $1,500  ✗ Deuda  │        │
│  │ [Ver todas →]                              │        │
│  └────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

#### 2.2.2 Formulario de Nueva Inscripción (Wizard 4 Pasos)

**PASO 1: Información Básica del Estudiante**
```
┌─────────────────────────────────────┐
│ Paso 1/4: Datos del Estudiante      │
├─────────────────────────────────────┤
│                                     │
│ Nombre Completo: [____________]    │
│ Cédula/RUT:     [____________]     │
│ Fecha Nacimiento: [_______]        │
│ Género: (●) M  ( ) F  ( ) Otro    │
│                                     │
│ [← Atrás]  [Siguiente →]            │
└─────────────────────────────────────┘
```

**PASO 2: Información de Contacto**
```
┌─────────────────────────────────────┐
│ Paso 2/4: Contacto del Padre        │
├─────────────────────────────────────┤
│                                     │
│ Email Padre: [_________________]  │
│ Teléfono: [__________________]    │
│ Emergencia: [________________]     │
│                                     │
│ [← Atrás]  [Siguiente →]            │
└─────────────────────────────────────┘
```

**PASO 3: Selección de Grado y Sección**
```
┌───────────────────────────────────────┐
│ Paso 3/4: Asignación de Curso         │
├───────────────────────────────────────┤
│                                       │
│ Grado: [Seleccionar ▼]               │
│         └─ 10° Grado                  │
│                                       │
│ Secciones Disponibles:               │
│ ☐ 10-A (32/35 cupos)                 │
│ ☐ 10-B (30/35 cupos) ⚠ Sin profesor  │
│ ☑ 10-C (20/35 cupos) RECOMENDADO    │
│                                       │
│ ⚠️ ALERTA: 10-B sin profesor          │
│            asignado aún               │
│                                       │
│ [← Atrás]  [Siguiente →]              │
└───────────────────────────────────────┘
```

**PASO 4: Plan de Pago**
```
┌──────────────────────────────────────────┐
│ Paso 4/4: Plan de Pago                   │
├──────────────────────────────────────────┤
│                                          │
│ Planes Disponibles:                     │
│                                          │
│ ◯ Plan Anual                             │
│   $4,800 en una cuota (Desc. 5%)        │
│                                          │
│ ◉ Plan Semestral                         │
│   $2,600 c/ semestre                    │
│                                          │
│ ◯ Plan Mensual                           │
│   $450/mes (12 cuotas)                  │
│   Interés de mora: 2% mensual           │
│                                          │
│ Becas/Descuentos Aplicables:            │
│ ☐ Hermano inscrito (15% desc.)          │
│ ☐ Rendimiento académico (10% desc.)     │
│ ☐ Situación económica (consultar)       │
│                                          │
│ TOTAL A PAGAR: $2,600                   │
│                                          │
│ [← Atrás]  [COMPLETAR INSCRIPCIÓN]      │
└──────────────────────────────────────────┘
```

#### 2.2.3 Gestor de Conflictos de Horario
```
┌──────────────────────────────────────────┐
│ DETECCIÓN AUTOMÁTICA DE CONFLICTOS       │
├──────────────────────────────────────────┤
│                                          │
│ ⚠️ CONFLICTO DETECTADO:                  │
│                                          │
│ Estudiante: Juan Pérez                  │
│ Conflicto: Prof. García está en 10-A    │
│           a las 08:00 (Inglés) y en     │
│           10-B a las 08:00 (Matemática) │
│                                          │
│ Opciones de Resolución:                 │
│ [1] Asignar a 10-C (diferente Prof.)    │
│ [2] Cambiar horario de una sección      │
│ [3] Asignar otro profesor a 10-B        │
│ [4] Marcar como excepción (revisar)     │
│                                          │
│ Acción Recomendada: Opción 1             │
└──────────────────────────────────────────┘
```

#### 2.2.4 Reportes Financieros
```
┌──────────────────────────────────────────┐
│ REPORTE DE DEUDA - Mayo 2026             │
├──────────────────────────────────────────┤
│                                          │
│ RESUMEN:                                │
│ • Estudiantes con Deuda: 34 (13.9%)     │
│ • Deuda Total Acumulada: $42,500        │
│ • % Morosidad: 8.4%                     │
│ • Ingresos Potenciales Pendientes:      │
│   $312,400 (en 12 meses)                │
│                                          │
│ TOP 5 DEUDORES:                         │
│ 1. Familia García - $3,200 (90+ días)   │
│ 2. Familia López - $2,800 (75+ días)    │
│ 3. Familia Rodríguez - $2,100 (60 días) │
│ ...                                     │
│                                          │
│ [Generar Cobranza] [Exportar PDF]       │
└──────────────────────────────────────────┘
```

---

## 3. Portal del Docente (Mejorado para Instituciones)

### 3.1 Dashboard Docente Actualizado
```
┌──────────────────────────────────────────┐
│  PANEL DOCENTE - Prof. García            │
├──────────────────────────────────────────┤
│                                          │
│  MIS CLASES (Semestre 2026-I):          │
│  ┌────────────────────────────────────┐ │
│  │ 10-A Matemática  (32 estudiantes)  │ │
│  │ L-M-J 08:00-09:30  Salón 4        │ │
│  │ Evaluaciones Pendientes: 3         │ │
│  │ [Acceder →]                        │ │
│  ├────────────────────────────────────┤ │
│  │ 11-B Cálculo     (28 estudiantes)  │ │
│  │ M-J 10:00-11:30  Salón 5          │ │
│  │ Evaluaciones Pendientes: 5         │ │
│  │ [Acceder →]                        │ │
│  └────────────────────────────────────┘ │
│                                          │
│  TAREAS PENDIENTES HOY:                │
│  ☐ Calificar prueba 10-A (15 pending)   │
│  ☐ Responder consulta alumno            │
│  ☐ Subir material de clase (11-B)      │
│                                          │
│  ESTUDIANTES CON BAJO RENDIMIENTO:      │
│  • Carlos López (10-A) - Promedio: 5.2  │
│  • Ana Martínez (11-B) - Promedio: 5.8  │
│                                          │
│  [Generar Reporte de Desempeño]         │
└──────────────────────────────────────────┘
```

### 3.2 Sección de Evaluaciones por Clase
```
┌──────────────────────────────────────────┐
│ CALIFICACIONES - 10-A Matemática        │
├──────────────────────────────────────────┤
│                                          │
│ Período: 1° Semestre 2026                │
│                                          │
│ Estudiante         │ Quiz1 │ Exam │ Prom│
│ ──────────────────┼───────┼──────┼────│
│ Juan Pérez         │  8.5  │  9.0 │ 8.7│
│ María García       │  9.2  │  8.8 │ 9.0│
│ Carlos López       │  5.3  │  5.0 │ 5.2│ ⚠️
│ Ana Martínez       │  7.8  │  6.5 │ 7.1│
│ [Ver más...]       │       │      │    │
│                                          │
│ [+ Agregar Calificación] [Exportar]     │
└──────────────────────────────────────────┘
```

### 3.3 Gestión de Asistencia
```
┌──────────────────────────────────────────┐
│ ASISTENCIA - 10-A, 15 de Mayo 2026       │
├──────────────────────────────────────────┤
│                                          │
│ [Marcar asistencia rápidamente]         │
│                                          │
│ ☑ Juan Pérez       (Presente)           │
│ ☑ María García     (Presente)           │
│ ☐ Carlos López     (Ausente)            │
│ ◐ Ana Martínez     (Tarde - 15 min)    │
│ ☑ Pedro Sánchez    (Presente)           │
│                                          │
│ Asistencia Hoy: 80% (4/5)               │
│                                          │
│ [Guardar] [Justificar Ausencia]         │
└──────────────────────────────────────────┘
```

---

## 4. Portal Mejorado para Padres de Familia

### 4.1 Dashboard Padres - Visibilidad 360°
```
┌──────────────────────────────────────────────┐
│  PORTAL PADRES - Familia García              │
├──────────────────────────────────────────────┤
│                                              │
│  HIJO(A): Juan García (10-A)                │
│                                              │
│  DESEMPEÑO ACADÉMICO:                      │
│  ┌──────────────────────────────┐          │
│  │ Promedio General: 8.3        │          │
│  │ Mejores Cursos:              │          │
│  │  • Inglés: 9.5 ▲             │          │
│  │  • Matemática: 8.7           │          │
│  │ Áreas de Mejora:             │          │
│  │  • Educación Física: 7.2 ▼  │          │
│  └──────────────────────────────┘          │
│                                              │
│  ASISTENCIA:                                │
│  ┌──────────────────────────────┐          │
│  │ Asistencia Este Mes: 96%     │          │
│  │ Ausencias Injustificadas: 0  │          │
│  │ Retrasos: 2                  │          │
│  └──────────────────────────────┘          │
│                                              │
│  ESTADO DE PAGO:                            │
│  ┌──────────────────────────────┐          │
│  │ Plan: Mensual ($450)         │          │
│  │ Próximo Pago: 30 de mayo     │          │
│  │ Estado: ✓ PAGADO             │          │
│  │ Saldo Deuda: $0              │          │
│  └──────────────────────────────┘          │
│                                              │
│  COMUNICACIONES RECIENTES:                  │
│  📧 Prof. García: "Excelente desempeño"    │
│  📧 Coordinadora: "Recordatorio pago"      │
│  💬 [Ver todas las comunicaciones]         │
│                                              │
│  [Autorizar Actividad] [Descargar Boletín] │
└──────────────────────────────────────────────┘
```

### 4.2 Sección de Comunicaciones Unificadas
```
┌──────────────────────────────────────────┐
│ COMUNICACIONES - Familia García          │
├──────────────────────────────────────────┤
│                                          │
│ Filtros: [Todos ▼] [De: Institución ▼] │
│                                          │
│ BANDEJA DE ENTRADA:                     │
│                                          │
│ 📧 15 May 10:30 - Prof. García          │
│    Asunto: Evaluación de Matemática     │
│    "Juan obtuvo 9.0 en la prueba..."    │
│    [Responder]                          │
│                                          │
│ 📧 14 May 16:45 - Coordinadora          │
│    Asunto: Confirmación de Pago         │
│    "Pago recibido por $450..."          │
│                                          │
│ 💬 14 May 15:20 - Prof. García (Chat)   │
│    "¿Tienes dudas sobre la tarea?"      │
│    [Responder en Chat]                  │
│                                          │
│ Conversaciones Activas: 3                │
│                                          │
│ [Escribir Mensaje Nuevo]                │
└──────────────────────────────────────────┘
```

### 4.3 Autorización de Actividades (Digital)
```
┌──────────────────────────────────────────┐
│ AUTORIZACIONES PENDIENTES                │
├──────────────────────────────────────────┤
│                                          │
│ ⏳ PENDIENTE DESDE 12 May:               │
│                                          │
│ Actividad: Salida a Museo (17 May)      │
│ Descrip.: Visita al Museo de Arte       │
│ Horario: 08:00-14:00                    │
│ Costo: $25 (incluido en mensualidad)    │
│                                          │
│ Detalles de la Actividad:               │
│ • Ubicación: Museo Nacional             │
│ • Responsable: Prof. García             │
│ • Nº Estudiantes: 32                    │
│ • Seguro: Sí (incluido)                 │
│                                          │
│ Autorizaciones Requeridas:              │
│ ☑ Uso de Foto/Video (ya autorizado)    │
│ ☐ Salida de Institución                │
│                                          │
│ [✓ Autorizar]  [✗ Rechazar]  [Ver más] │
└──────────────────────────────────────────┘
```

---

## 5. Portal del Director/Rector (Mejorado)

### 5.1 Dashboard Ejecutivo
```
┌──────────────────────────────────────────────┐
│  DASHBOARD EJECUTIVO - 2026-I               │
├──────────────────────────────────────────────┤
│                                              │
│  MÉTRICAS CLAVE DE INSTITUCIÓN:             │
│  ┌──────────┬──────────┬──────────┐         │
│  │ Inscritos│ Tasa Ret.│ Promedio │         │
│  │   300    │   94%    │   7.8    │         │
│  └──────────┴──────────┴──────────┘         │
│                                              │
│  DATOS FINANCIEROS:                        │
│  ┌──────────────────────────────────┐      │
│  │ Ingresos Proyectados (Semestre): │      │
│  │                    $180,000      │      │
│  │ Recaudado hasta Hoy: $156,300    │      │
│  │ % Recaudación: 86.8%             │      │
│  │ Deuda Pendiente: $38,900         │      │
│  └──────────────────────────────────┘      │
│                                              │
│  DESEMPEÑO ACADÉMICO:                      │
│  Promedio Institucional: 7.8 (Meta: 8.0)  │
│  Estudiantes en Riesgo: 12 (4%)            │
│  Tasa de Reprobación: 2.1%                 │
│                                              │
│  INDICADORES OPERACIONALES:                │
│  • Cobertura de Docentes: 100% asignados   │
│  • Conflictos de Horario Detectados: 3     │
│  • Certificados Pendientes: 8              │
│                                              │
│  [Ver Reportes Detallados] [Exportar]      │
└──────────────────────────────────────────────┘
```

### 5.2 Gestión de Profesores
```
┌──────────────────────────────────────────┐
│ GESTIÓN DE DOCENTES                      │
├──────────────────────────────────────────┤
│                                          │
│ Total Docentes: 18                      │
│ Planta Completa: Sí                     │
│                                          │
│ DIRECTORIO:                             │
│ ┌────────────────────────────────────┐ │
│ │ Prof. García (Matemática)          │ │
│ │ Asignación: 10-A, 10-B, 11-C      │ │
│ │ Carga: 8 hrs/semana               │ │
│ │ Evaluación 2026: Pendiente         │ │
│ │ [Ver Detalles] [Horario]           │ │
│ ├────────────────────────────────────┤ │
│ │ Prof. López (Inglés)               │ │
│ │ Asignación: 9-A, 10-A, 10-B       │ │
│ │ Carga: 10 hrs/semana              │ │
│ │ Evaluación 2026: 8.5/10 ✓         │ │
│ │ [Ver Detalles] [Horario]           │ │
│ ├────────────────────────────────────┤ │
│ │ [Contratar Profesor Nuevo]         │ │
│ └────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 💎 5. Portales Disruptivos (Nuevos para Unicornio)

### 5.1 Dashboard Financiero (CFO/Tesorera)

```
┌──────────────────────────────────────────────────┐
│ DASHBOARD FINANCIERO AVANZADO                    │
├──────────────────────────────────────────────────┤
│                                                  │
│ FINANZAS EN TIEMPO REAL:                        │
│ ┌───────────────┬─────────────┬─────────────┐  │
│ │ Ingresos Hoy  │ Flujo Neto  │ Deuda Total │  │
│ │   $45,200     │  +$12,800   │  $38,500    │  │
│ └───────────────┴─────────────┴─────────────┘  │
│                                                  │
│ CANALES DE PAGO:                                │
│ ├─ Pasarela Propia: $180K/mes (1% comisión)   │
│ ├─ Stripe: $45K/mes (2.9% + $0.30)            │
│ ├─ Mercado Pago: $12K/mes (comisión variable) │
│ └─ BNPL Fintech: $28K/mes (3% margen)         │
│                                                  │
│ DEUDORES POR SCORE RIESGO:                      │
│ ├─ Riesgo Bajo: 5 familias ($5K deuda)        │
│ ├─ Riesgo Medio: 12 familias ($18K deuda)     │
│ └─ Riesgo Alto: 3 familias ($8K deuda)        │
│                                                  │
│ RECOMENDACIONES IA:                            │
│ • Ofrecer BNPL a Familia López (score 65)      │
│ • Ejecutar cobranza automática: García familia │
│ • Implementar plan de pagos: Martínez          │
│                                                  │
│ [Dashboard de Transacciones] [Proyecciones]    │
└──────────────────────────────────────────────────┘
```

### 5.2 Explorer del Pasaporte Digital

```
┌─────────────────────────────────────────────┐
│ PASAPORTE DIGITAL - Juan García (ID: EL...)│
├─────────────────────────────────────────────┤
│                                             │
│ IDENTIDAD VERIFICADA (Blockchain)          │
│ ✓ DNI: 12345678-9 (validado)              │
│ ✓ Pasaporte Digital ID: EL-JG-2015-001    │
│ 📅 Creado: 15 Ago 2020                     │
│                                             │
│ PESTAÑA: ACADÉMICA  |  PSICO  |  MÉDICA  │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ PERFIL ACADÉMICO (Transferible)     │   │
│ ├─────────────────────────────────────┤   │
│ │ Colegio Actual: Colegio ABC (2024-) │   │
│ │ Colegios Anteriores: 3              │   │
│ │                                     │   │
│ │ HISTORIAL COMPLETO:                 │   │
│ │ Grado 5 (2018) → Promedio: 8.3      │   │
│ │ Grado 6 (2019) → Promedio: 8.1      │   │
│ │ ...                                 │   │
│ │ Grado 9 (2023) → Promedio: 8.7      │   │
│ │ Grado 10 (2024) → Promedio: 8.9 ↑ │   │
│ │                                     │   │
│ │ COMPETENCIAS IA:                    │   │
│ │ • Matemáticas: 89% (Avanzado)       │   │
│ │ • Lectura: 92% (Experto)            │   │
│ │ • Escritura: 76% (Competente)       │   │
│ │ • Ciencias: 85% (Avanzado)          │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [Transferir a Nuevo Colegio]                │
│ [Descargar Certificado] [Compartir]        │
└─────────────────────────────────────────────┘
```

### 5.3 Marketplace - Tienda de Contenido

```
┌────────────────────────────────────────────────┐
│ MARKETPLACE EDUCATIVO                          │
├────────────────────────────────────────────────┤
│                                                │
│ BUSCA CONTENIDO PARA TU CLASE:                │
│ [Búsqueda: "Álgebra grado 10"]               │
│ Filtros: [Tipo: Curso ▼] [Precio: <$100 ▼] │
│                                                │
│ RESULTADOS (52 productos encontrados):        │
│                                                │
│ 1. 📚 ÁLGEBRA INTERACTIVA (85 reviews)        │
│    Por: McGraw-Hill Educativa                │
│    $50/mes - Incluye: 40 lecciones, quiz,    │
│    gamificación, certificado                 │
│    ⭐⭐⭐⭐⭐ (4.9/5)                           │
│    👥 Used by 200+ colegios                  │
│    [Preview]  [Comprar]                      │
│                                                │
│ 2. 🎮 ÁLGEBRA GAME (32 reviews)              │
│    Por: EduStart (startup)                   │
│    $25/mes - Juegos adaptivos, RPG,          │
│    competencias entre estudiantes             │
│    ⭐⭐⭐⭐☆ (4.3/5)                           │
│    👥 Used by 45 colegios                    │
│    [Preview]  [Comprar]                      │
│                                                │
│ 3. 📖 ÁLGEBRA CLÁSICA (8 reviews)            │
│    Por: Prof. Juan López (independiente)     │
│    $10/mes - Resúmenes, ejercicios, soluciones
│    ⭐⭐⭐☆☆ (3.2/5)                           │
│    👥 Used by 8 colegios                     │
│    [Preview]  [Comprar]                      │
│                                                │
│ [Carrito: 2 productos ($75/mes)]             │
│ [Proceder a Pago]                            │
└────────────────────────────────────────────────┘
```

### 5.4 Console de Creador (Para EdTechs/Editoriales)

```
┌────────────────────────────────────────────────┐
│ MI TIENDA DE CONTENIDO - McGraw-Hill          │
├────────────────────────────────────────────────┤
│                                                │
│ INGRESOS ESTE MES: $18,450                    │
│ Comisión Plataforma: -$6,150 (25%)           │
│ Mi Ingreso: $12,300 (75%)                    │
│                                                │
│ MIS PRODUCTOS (23 activos):                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Álgebra Interactiva                     │ │
│ │ Descargas: 1,200 este mes               │ │
│ │ Precio: $50/mes                         │ │
│ │ Revenue: $60,000                        │ │
│ │ Rating: 4.9/5 (85 reviews)             │ │
│ │ Status: ✓ Publicado                     │ │
│ │ [Editar] [Ver Analytics] [Descubrir]   │ │
│ ├─────────────────────────────────────────┤ │
│ │ Cálculo I                               │ │
│ │ Descargas: 340 este mes                 │ │
│ │ Precio: $75/mes                         │ │
│ │ Revenue: $25,500                        │ │
│ │ Rating: 4.7/5 (32 reviews)             │ │
│ │ Status: ✓ Publicado                     │ │
│ │ [Editar] [Ver Analytics] [Descubrir]   │ │
│ │ ⚠️ BAJADA DE VENTAS: -15% vs mes pasado │ │
│ │ Sugerencia IA: Actualizar contenido    │ │
│ └─────────────────────────────────────────┘ │
│                                                │
│ [Subir Nuevo Producto] [Ver Ganancias]      │
└────────────────────────────────────────────────┘
```

### 5.5 Central de Agentes IA (Para Coordinadores)

```
┌────────────────────────────────────────────────┐
│ CENTRAL DE AGENTES IA                          │
├────────────────────────────────────────────────┤
│                                                │
│ AGENTES ACTIVOS HOY:                          │
│                                                │
│ 🤖 COORDINADOR ACADÉMICO                      │
│ Estado: ✓ Ejecutando                          │
│ Acciones Hoy: 3                               │
│                                                │
│ ├─ 08:30 - Detectó 8 alumnos en riesgo       │
│ │  (Matemática, promedio <5.5)              │
│ │  Propuesta: Plan de regularización 3 sem   │
│ │  Estado: ⏳ Pendiente tu aprobación       │
│ │  [Ver Propuesta] [Aprobar] [Rechazar]     │
│ │                                             │
│ ├─ 10:15 - Detectó conflicto de horarios     │
│ │  Prof. García en 2 aulas simultáneas       │
│ │  Propuesta: Cambiar 10-B a sala 4          │
│ │  Estado: ✓ APROBADA (Tu acción: 9:45)    │
│ │                                             │
│ └─ 14:20 - Analizando próximos riegos...     │
│                                                │
│ 🤖 GESTOR DE DEUDA IA                        │
│ Estado: ✓ Ejecutando                          │
│ Acciones Hoy: 2                               │
│                                                │
│ ├─ 09:00 - Familia García: Score 75/100      │
│ │  Deuda: $1,200 (2 cuotas)                 │
│ │  Propuesta: BNPL 6 cuotas a 8% anual       │
│ │  Estado: ⏳ Propuesta enviada a padre    │
│ │  Respuesta esperada: 24h                   │
│ │                                             │
│ └─ 11:30 - Familia López: Score 32/100       │
│ │  Deuda: $800 (mora 45 días)               │
│ │  Propuesta: Cobranza automática + llamada  │
│ │  Estado: ✓ EJECUTADA (intent #2 hoy)     │
│                                                │
│ [Ver Logs Completos] [Configurar Agentes]   │
└────────────────────────────────────────────────┘
```

### 5.6 Analytics de Viralidad B2B2C

```
┌────────────────────────────────────────────────┐
│ ANÁLISIS DE VIRALIDAD & CAC                    │
├────────────────────────────────────────────────┤
│                                                │
│ CLIENTES ADQUIRIDOS POR CANAL (Mayo 2026):   │
│ ┌────────────────────────────────────────┐   │
│ │ Sales Directo        15 inst   CAC: $8K │   │
│ │ Compartidos de Logros 8 inst   CAC: $1.2K │ │
│ │ Word-of-Mouth        5 inst   CAC: $600 │  │
│ │ Conferencias          2 inst   CAC: $3K │  │
│ │ ────────────────────────────────       │   │
│ │ TOTAL: 30 inst        CAC promedio: $5K│   │
│ └────────────────────────────────────────┘   │
│                                                │
│ VIRALIDAD POR INSTITUCIÓN:                    │
│ Colegio ABC (50 padres compartiendo):         │
│ • Shares/semana: 45                          │
│ • Alcance estimado: 2,200 personas           │
│ • Clicks a landing page: 34                  │
│ • Leads generados: 8                         │
│ • Tasa conversión: 3.2% (vs 0.8% sitio web)│
│                                                │
│ TOP LOGROS MÁS COMPARTIDOS:                   │
│ 1. "Dominé Trigonometría" - 320 shares      │
│ 2. "Badge Matemático Desbloqueado" - 210    │
│ 3. "Promedio Subió a 8.5" - 180             │
│ 4. "Completé Módulo de Lectura" - 95        │
│                                                │
│ [Ver Dashboard Completo] [Optimizar]         │
└────────────────────────────────────────────────┘
```

---

## 7. Wireframes Disruptivos (10+ Vistas Nuevas)

### 7.1 Dashboard Financiero (CFO)
- WF-22: Resumen financiero en tiempo real
- WF-23: Análisis de canales de pago
- WF-24: Scoring de riesgo por familia
- WF-25: Recomendaciones cobranza IA

### 7.2 Pasaporte Digital
- WF-26: Vista del Pasaporte (estudiante)
- WF-27: Transfer interinstitucional (1-click)
- WF-28: Historial académico portátil

### 7.3 Marketplace
- WF-29: Tienda de contenido (profesor)
- WF-30: Console de creador (analítica)

### 7.4 Agentes IA
- WF-31: Central de control (coordinador)
- WF-32: Log de ejecuciones (auditoría)

### 7.5 Product-Led Growth
- WF-33: Analytics de viralidad
- WF-34: Dashboard de conversiones

---

## 20. Conclusión

Esta especificación UX/UI proporciona una arquitectura de interfaz completa y orientada específicamente a instituciones educativas (academias, colegios, universidades y redes) con 5 capas disruptivas de Unicornio. Los diseños priorizan:

1. **Eficiencia Operacional**: Reducir clics, minimizar pasos para tareas críticas
2. **Claridad Visual**: Iconografía educativa consistente, uso de colores semánticos
3. **Eficiencia**: Dashboards contextuales que muestren información relevante al primer vistazo
4. **Accesibilidad**: Cumplimiento WCAG 2.1 AA, soporte para múltiples dispositivos
5. **Localización**: Adaptar a calendarios académicos, nomenclatura regional, idiomas

### Portales UX/UI (9 portales totales)

**Educación (4)**:
- Coordinador de Matrícula
- Docente
- Padres de Familia
- Director/Rector

**Disruptivos (5) 💎**:
- CFO/Tesorera (Fintech)
- Pasaporte Digital (Identidad)
- Marketplace (Creadores)
- Agentes IA (Central Control)
- Analytics PLG (Viralidad)

### Wireframes Totales: 34 (20 educación + 14 disruptivos)

---

*Fase 6 completada (base): 2026-05-15*  
*Fase 6 **ORIENTADA** a Instituciones Educativas: 2026-05-16*  
*Fase 6 **ACTUALIZADA A UNICORNIO**: 2026-05-16*

**Cambios realizados en FASE 6**:
- ✅ 5 nuevos portales disruptivos agregados
- ✅ Dashboard Financiero (fintech, scoring de riesgo, BNPL)
- ✅ Pasaporte Digital (blockchain, transferencias interinstitucionales)
- ✅ Marketplace (tienda para creadores, analytics, comisiones)
- ✅ Central de Agentes IA (coordinador académico, gestor deuda, monitor)
- ✅ Analytics de Viralidad (CAC reduction, tracking compartidos, referrals)
- ✅ 14 wireframes adicionales para los pilares disruptivos

**Próximo paso**: FINALIZACIÓN - Validación completa del sistema 6-fases integrado como Unicornio

---

## 6. Wireframes Principales (30+ Vistas)

### 6.1 Flujo de Inscripción Completo (4 Wireframes)
- WF-01: Dashboard de Matrícula
- WF-02: Wizard de Inscripción - Paso 1
- WF-03: Wizard de Inscripción - Paso 2
- WF-04: Resumen y Confirmación

### 6.2 Portal de Coordinador (5 Wireframes)
- WF-05: Dashboard Principal
- WF-06: Gestor de Conflictos
- WF-07: Reportes de Deuda
- WF-08: Gestión de Planes de Pago
- WF-09: Historial de Transacciones

### 6.3 Portal Docente (5 Wireframes)
- WF-10: Dashboard Docente
- WF-11: Calificaciones por Clase
- WF-12: Asistencia
- WF-13: Comunicación con Padres
- WF-14: Reporte de Desempeño

### 6.4 Portal Padres (4 Wireframes)
- WF-15: Dashboard Hijo
- WF-16: Comunicaciones Unificadas
- WF-17: Autorización de Actividades
- WF-18: Historial de Pagos

### 6.5 Dashboard Director (3 Wireframes)
- WF-19: KPIs Ejecutivos
- WF-20: Gestión de Docentes
- WF-21: Reportes Institucionales

---

## 7. Sistema de Navegación

### 7.1 Navegación Principal (Por Rol)

**Coordinador de Matrícula:**
```
INICIO → [Dashboard] → [Nueva Inscripción] → [Conflictos] → [Reportes]
```

**Docente:**
```
INICIO → [Mis Clases] → [Calificaciones] → [Asistencia] → [Comunicaciones]
```

**Padre:**
```
INICIO → [Mi Hijo] → [Desempeño] → [Pagos] → [Comunicaciones]
```

**Director:**
```
INICIO → [KPIs] → [Docentes] → [Estudiantes] → [Reportes Financieros]
```

### 7.2 Breadcrumb Navigation
```
Inicio > Matrícula > Nueva Inscripción > Paso 2/4 > Información de Contacto
```

---

## 8. Componentes de Interfaz Reutilizables

### 8.1 Tarjetas de Estudiante
```
┌───────────────────────────────┐
│ 🎓 Juan García Pérez          │
│ Grado: 10-A                   │
│ Promedio: 8.3                 │
│ Asistencia: 96%               │
│ Deuda: $0                      │
│ [Ver Detalles]                │
└───────────────────────────────┘
```

### 8.2 Tarjetas de Clase
```
┌───────────────────────────────┐
│ 📚 Matemática 10-A            │
│ Prof: García                  │
│ Horario: L-M-J 08:00-09:30   │
│ Estudiantes: 32/35            │
│ [Acceder a Clase]             │
└───────────────────────────────┘
```

### 8.3 Alertas Contextuales
```
⚠️  ADVERTENCIA: Conflicto de horario detectado
✓  ÉXITO: Inscripción completada exitosamente
⏳  PENDIENTE: Autorización de padre requerida
🔴 CRÍTICO: Deuda mayor a 90 días
```

### 8.4 Badges de Estado
```
✓ Pagado          | ⏳ Pendiente      | ⚠️ Vencido
✓ Autorizado      | ✗ Rechazado      | ⏳ Revisando
Activo            | Suspendido        | Cancelado
```

---

## 9. Responsive Design y Accesibilidad

### 9.1 Breakpoints
- **Desktop**: 1920px, 1440px, 1280px
- **Tablet**: 768px, 720px
- **Mobile**: 480px, 375px

### 9.2 Adaptaciones Móviles

**Dashboard Matrícula (Mobile):**
```
┌──────────────────┐
│  INSCRITOS: 245  │
│  CUPOS LIBRES: 55│
│  DEUDA: $42,5K   │
├──────────────────┤
│ [+ Nueva Inscr.] │
│ [Ver Conflictos] │
│ [Reportes]       │
├──────────────────┤
│ ÚLTIMAS INSCR:   │
│ • Juan Pérez     │
│ • María García   │
│ [Ver todas]      │
└──────────────────┘
```

### 9.3 Accesibilidad WCAG 2.1 AA
- Contraste mínimo: 4.5:1 (texto normal)
- Etiquetas ARIA en formularios
- Navegación por teclado completa
- Soporte para lectores de pantalla
- Textos alternativos en todas las imágenes

---

## 10. Paleta de Colores Educativa

### 10.1 Colores Primarios
- **Azul Institucional**: #003D7A (Confianza, Autoridad)
- **Blanco**: #FFFFFF (Limpieza, Claridad)
- **Gris Neutro**: #F5F5F5 (Fondo)

### 10.2 Colores Semánticos
- **Éxito/Pagado**: #4CAF50 (Verde)
- **Advertencia/Pendiente**: #FFC107 (Amarillo)
- **Error/Vencido**: #F44336 (Rojo)
- **Información**: #2196F3 (Azul claro)

### 10.3 Tipografía
- **Títulos**: Montserrat Bold, 24px-32px
- **Cuerpo**: Roboto Regular, 14px-16px
- **Datos Numéricos**: Inconsolata Mono, 14px

---

## 11. Flujos de Casos de Uso Visuales

### 11.1 Flujo CU-005: Inscripción de Estudiante
```
INICIO
  ↓
[Formulario Básico]
  ↓
[Seleccionar Grado/Sección]
  ↓
¿Detectar Conflicto?
  ├→ SÍ: [Resolver Conflicto] → [Sugerir Alternativa]
  └→ NO: [Continuar]
  ↓
[Seleccionar Plan de Pago]
  ↓
[Aplicar Becas/Descuentos]
  ↓
[Resumen y Confirmación]
  ↓
[Generar Recibo]
  ↓
FIN ✓
```

### 11.2 Flujo CU-006: Gestión de Deuda
```
INICIO
  ↓
[Ver Deuda Pendiente]
  ↓
¿Estudiante con Deuda?
  ├→ SÍ: [Generar Plan de Pago]
  │      ↓
  │      [Registrar Cuota Pagada]
  │      ↓
  │      ¿Deuda Completada?
  │      ├→ SÍ: [Actualizar Estado] → FIN ✓
  │      └→ NO: [Registrar Siguiente Cuota]
  └→ NO: [Actualizar Estado] → FIN ✓
```

### 11.3 Flujo CU-009: Portal Padres
```
INICIO
  ↓
[Login Padre]
  ↓
[Dashboard con Hijo(a)]
  ↓
[Seleccionar Sección]
  ├→ [Ver Desempeño Académico]
  ├→ [Ver Asistencia]
  ├→ [Ver Estado de Pago]
  ├→ [Ver Comunicaciones]
  └→ [Autorizar Actividades]
  ↓
FIN
```

---

## 12. Especificaciones de Interacción

### 12.1 Validaciones en Tiempo Real

**Campo de Cédula/RUT:**
```
Usuario escribe: "123456789"
Sistema valida:
✓ Formato correcto
✓ No existe estudiante con este ID
✓ Sugerir: "¿Buscar por nombre?" si no encontrado
```

**Selector de Sección:**
```
Usuario selecciona: 10-A
Sistema verifica:
✓ Cupos disponibles: SÍ (32/35)
✓ Profesor asignado: García
✓ Horarios compatibles: SÍ
✓ Sin conflictos detectados
```

### 12.2 Transiciones y Animaciones
- Fade-in de paneles: 300ms
- Cambio de sección: 200ms slide
- Mensajes de éxito: Toast notification 3s
- Carga de datos: Skeleton loader

### 12.3 Microinteracciones
```
Acción: Clic en [Guardar]
Feedback: 
  1. Botón deshabilitado + spinner (300ms)
  2. Validación servidor (2-3s)
  3. Toast verde: "✓ Cambios guardados" (3s)
  4. Botón re-habilitado
```

---

## 13. Flujos de Error y Manejo de Excepciones

### 13.1 Errores de Validación
```
┌─────────────────────────────────────┐
│ ❌ Error de Validación              │
├─────────────────────────────────────┤
│                                     │
│ Campo "Email": Formato inválido    │
│                                     │
│ Ejemplo correcto: juan@escuela.com │
│                                     │
│ [Editar] [Cancelar]                │
└─────────────────────────────────────┘
```

### 13.2 Errores de Disponibilidad
```
┌─────────────────────────────────────┐
│ ⚠️  Conflicto de Horario            │
├─────────────────────────────────────┤
│                                     │
│ No hay cupos en 10-A                │
│ (Máximo: 35 estudiantes)            │
│                                     │
│ Alternativas Disponibles:           │
│ • 10-B (30/35 cupos)               │
│ • 10-C (20/35 cupos) ← Recomendado│
│                                     │
│ [Seleccionar Alternativa] [Volver]  │
└─────────────────────────────────────┘
```

### 13.3 Errores de Permiso
```
┌─────────────────────────────────────┐
│ 🔒 Acceso Denegado                 │
├─────────────────────────────────────┤
│                                     │
│ No tienes permiso para editar       │
│ estudiantes de otro ciclo.          │
│                                     │
│ Contacta al Director para solicitar │
│ acceso adicional.                   │
│                                     │
│ [Volver] [Enviar Solicitud]         │
└─────────────────────────────────────┘
```

---

## 14. Guía de Estilos Visual

### 14.1 Proporciones y Espaciado
- **Padding Estándar**: 16px (interior de componentes)
- **Margin Estándar**: 24px (entre componentes)
- **Border Radius**: 4px (componentes), 8px (tarjetas)
- **Elevación (Shadow)**: 0 2px 4px rgba(0,0,0,0.1) (base)

### 14.2 Iconografía
```
📚 Clases/Módulos
👨‍🏫 Docentes
👨‍🎓 Estudiantes
👨‍👩‍👧 Familia/Padres
💰 Pagos/Finanzas
📊 Reportes
⚙️ Configuración
🔐 Seguridad/Permisos
```

### 14.3 Estados de Componentes
- **Default**: Fondo gris claro, borde 1px gris
- **Hover**: Fondo ligeramente más oscuro, cursor pointer
- **Focus**: Borde azul 2px, outline visible
- **Disabled**: Fondo gris más claro, opacidad 0.5, cursor not-allowed
- **Loading**: Spinner azul, cursor wait

---

## 15. Especificaciones por Tipo de Institución

### 15.1 Academia (150K+ instituciones en LatAm)
**Simplificaciones:**
- Estructura: 1-3 grados solamente
- Docentes: 5-15 profesores
- Ciclo: Flexible (puede no ser semestral)
- Dashboard Simplificado: Solo Matrícula + Desempeño

### 15.2 Colegio (35K+ instituciones)
**Características Completas:**
- Estructura: Primaria + Secundaria (12+ grados)
- Docentes: 30-100 profesores
- Ciclo: Semestral estándar
- Todos los portales completos

### 15.3 Universidad (2K+ instituciones)
**Extensiones:**
- Estructura: Múltiples carreras/departamentos
- Docentes: 200+ profesores
- Ciclo: Semestral, con períodos especiales
- Integración con investigación y postgrados

### 15.4 Red Educativa (100+ redes)
**Características Avanzadas:**
- Múltiples instituciones bajo una administración
- Dashboard Consolidado: Métricas por institución
- Gestión centralizada de docentes
- Reportes comparativos entre sedes

---

## 16. Configuración de Reportes (Exportables)

### 16.1 Reportes Disponibles por Rol

**Coordinador de Matrícula:**
- Listado de inscritos por sección
- Reporte de deuda y morosidad
- Conflictos de horario detectados
- Ingresos vs proyectado

**Docente:**
- Calificaciones por estudiante
- Asistencia mes/semestre
- Desempeño académico
- Bajo rendimiento (alertas)

**Padre:**
- Boletín de calificaciones
- Certificado de asistencia
- Estado de pago
- Comunicaciones recibidas

**Director:**
- KPI Institucionales
- Análisis de desempeño
- Reporte financiero completo
- Evaluación docente

### 16.2 Formatos de Exportación
- PDF (para impresión)
- Excel (para análisis)
- CSV (para integración)
- JSON (para APIs)

---

## 17. Plan de Implementación UX/UI

### Fase 1: MVP (Q2 2026)
- ✓ Dashboard Coordinador de Matrícula
- ✓ Wizard de Inscripción (4 pasos)
- ✓ Portal Padres (versión básica)
- ✓ Dashboard Docente simplificado

### Fase 2: Extensión (Q3 2026)
- Portal Docente completo (Calificaciones + Asistencia)
- Dashboard Director (KPIs básicos)
- Sistema de Notificaciones
- Aplicación Móvil (iOS/Android)

### Fase 3: Optimización (Q4 2026 - Q1 2027)
- Gestor de Conflictos avanzado
- Integraciones externas (ERP, Google Classroom)
- Análisis predictivo de bajo rendimiento
- Portal Padre mejorado con chat en tiempo real

---

## 18. Pruebas de Usabilidad Planificadas

### 18.1 Pruebas de Usuario (Q2 2026)
- 5 Coordinadores de Matrícula (tarea: inscribir estudiante)
- 5 Docentes (tarea: calificar y registrar asistencia)
- 5 Padres (tarea: revisar desempeño y autorizar actividad)
- Tiempo esperado: 8-12 minutos por tarea

### 18.2 Métricas de Éxito
- Task Success Rate: >90%
- Time on Task: <15 minutos (inscripción completa)
- Error Rate: <5%
- User Satisfaction (SUS): >75/100

---

---

## 20. Wireframes y Especificaciones UI Unicornio (SCR-043 a SCR-050)

### 20.1 SCR-043: Canvas 3D de Laboratorio Virtual WebGL
- **Ruta**: `/app/student/labs/simulations/[sim_id]`
- **Componentes**: Visualizador WebGL 3D interactivo, panel de parámetros de reactivos/física, consola de telemetría en tiempo real y botón "Generar Reporte de Laboratorio".

### 20.2 SCR-044: Proyector de Asistencia QR Dinámico & Cam Scanner
- **Ruta**: `/app/teacher/classes/[class_id]/attendance-qr` & `/app/student/attendance/scan`
- **Componentes**: Modal de proyección con QR rotativo HMAC cada 15s (Docente) + Lector de cámara con validación de geofencing en tiempo real (Estudiante).

### 20.3 SCR-045: Hub de Clanes y Gamificación P2P
- **Ruta**: `/app/student/clans/hub`
- **Componentes**: Banner de clan, medidor de racha semanal de equipo, ranking inter-clanes y panel de miembros con barra de experiencia (XP).

### 20.4 SCR-046: Gestor Mapa Interactivo de Espacios e Infraestructura
- **Ruta**: `/app/operations/facilities/map`
- **Componentes**: Planta 2D/3D interactiva de la institución, filtro por disponibilidad de laboratorios/aulas, selector de franja horaria y botón "Reservar 1-Click".

### 20.5 SCR-047: Checkout Rápido de Pensiones por QR Local
- **Ruta**: `/app/parent/billing/checkout`
- **Componentes**: Selector de pensiones pendientes, generador de QR Yape/Plin/PIX/SPEI, temporizador de webhook de confirmación y emisor de comprobante PDF.

### 20.6 SCR-048: Matriz de Convalidación Curricular NLP
- **Ruta**: `/app/academic/convalidations/match`
- **Componentes**: Visor dual de sílabos (Origen vs Destino), medidor de porcentaje de coincidencia por competencias y botón de aprobación digital con firma.

### 20.7 SCR-049: Panel Adaptativo de Accesibilidad e Inclusión
- **Ruta**: `/app/accessibility/settings`
- **Componentes**: Switches para modo dislexia, lector de voz (text-to-speech), subtitulado asistido en Lenguaje de Señas (LSA) y selector de lenguas originarias.

### 20.8 SCR-050: Portal Público de Transparencia e Impacto
- **Ruta**: `https://democra.pro/transparencia/[tenant_slug]`
- **Componentes**: Dashboard interactivo abierto con gráficos de inserción laboral, ejecución presupuestal y verificador de validez del sello criptográfico.

---

## 21. Wireframes y Especificaciones UI Enterprise (SCR-051 a SCR-070)

- **SCR-051**: Engine CAT/IRT (Evaluación Adaptativa en Vivo con Estimación $\theta$).
- **SCR-052**: Monitor de Proctoring IA (Dashboard de Supervisión con Flags de Incidencias).
- **SCR-053**: Canvas de Peer-Review Ciego (Panel de Calibración de Evaluaciones entre Pares).
- **SCR-054**: Banco de Ítemes Inteligente (Gestor de Reactivos con Generador LLM).
- **SCR-055**: Diagnosticador Psico-Aptitudinal (Radar de Habilidades Blandas).
- **SCR-056**: Portal de Recursos Humanos y Nómina Docente (Pre-nómina y Marcaciones).
- **SCR-057**: Optimizador de Horarios por Algoritmos Genéticos (Matriz de Horarios 0-Cruces).
- **SCR-058**: Sala Virtual de Gobernanza y Junta Directiva (Actas Firmadas E2EE).
- **SCR-059**: Control de Inventario y Mantenimiento Predictivo (Lector QR/RFID de Activos).
- **SCR-060**: Gestor Estratégico de Becas y Scoring Socioeconómico.
- **SCR-061**: Centro de Protocolos de Emergencia (Botón de Pánico y Mapa de Evacuación).
- **SCR-062**: Bitácora Inmutable de Auditoría Criptográfica (Log Viewer SHA-256).
- **SCR-063**: Radar Preventivo de Salud Mental (Triage Confidencial Psicopedagógico).
- **SCR-064**: Red Social Académica Segura (Feed con Moderador Anti-Bullying NLP).
- **SCR-065**: Gestor de Planes de Inclusión IEP / PIE (Adaptación Curricular NEE).
- **SCR-066**: Observatorio de Clima e Sentimiento Institucional (Mapa de Calor eNPS).
- **SCR-067**: Hub Lifelong Alumni (Directorio Verificado y Carnet Digital).
- **SCR-068**: Dashboard de Impacto ESG y Sostenibilidad Ambientable (Métricas GRI).
- **SCR-069**: Portal de Aprendizaje-Servicio ApS (Proyectos de Voluntariado ONG).
- **SCR-070**: Ecosistema de Vida Estudiantil (Gestor de Clubes y Eventos Co-curriculares).

---

## 22. Conclusión de Fase 6 v5.0

Esta especificación UX/UI proporciona la arquitectura completa para los **70 Requerimientos Funcionales de EDUCACION OS / Democra School**.

*Fase 6 v5.0 completada: 2026-08-01*


