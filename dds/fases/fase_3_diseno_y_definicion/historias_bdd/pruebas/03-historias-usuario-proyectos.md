# Historias BDD y Criterios de Aceptación: Proyectos y Recursos
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

---

## Épica: Gestión Operativa de Proyectos

Como Gestor de Proyectos de la ONG, quiero organizar el trabajo en proyectos, tareas y actividades, para tener visibilidad clara sobre dónde se está invirtiendo el esfuerzo voluntario.

### Feature: Estructuración de Proyectos

**Scenario:** Creación de proyecto con validación de código único
```gherkin
Given que el tenant 'tenant-001' ya tiene registrado un proyecto activo con el código interno 'PROJ-001'
When el gestor intenta crear un nuevo proyecto y le asigna manualmente el código 'PROJ-001'
And envía el formulario de creación
Then la validación de base de datos intercepta la operación
And el sistema devuelve un error de validación "El código de proyecto ya existe"
And no se crea el registro en la base de datos
```

### Feature: Trazabilidad de Horas Efectivas

**Scenario:** Registro de asistencia y horas con flujo de aprobación
```gherkin
Given que la actividad de campo 'act-001' existe y está activa
And el voluntario 'vol-001' está formalmente asignado a dicha actividad
When el coordinador de la actividad registra 4 horas de trabajo para el voluntario en la fecha '2026-07-10'
Then se crea un nuevo `HourRecord` en la base de datos
And el estado inicial de dicho registro es 'PENDING_APPROVAL' (Pendiente de Aprobación)
And el contador global de horas verificadas del voluntario NO se incrementa aún
When el gestor del proyecto revisa la evidencia y hace clic en 'Aprobar Horas'
Then el estado del `HourRecord` cambia a 'APPROVED'
And el KPI de horas totales del voluntario se actualiza reflejando las nuevas 4 horas
```

---

## Épica: Gestión de Inventario y Kardex

Como Responsable de Logística, quiero controlar la entrada y salida de materiales, para evitar pérdidas y saber exactamente con qué recursos contamos.

### Feature: Control Inmutable de Stock (Kardex)

**Scenario:** Movimiento de inventario que genera stock calculado
```gherkin
Given que existe el artículo 'Caja de Medicamentos Paracetamol' en el catálogo
And el stock actual calculado en el almacén 'Sede Central' es 0
When el responsable registra una transacción de tipo 'ENTRADA' (IN)
And define la cantidad como 50 unidades y selecciona el almacén 'Sede Central'
Then el sistema inserta un registro inmutable en `InventoryMovement` con cantidad +50
And la consulta dinámica de Kardex suma el movimiento
And el `derivedStock` (stock derivado) del artículo ahora refleja 50 unidades exactas
```

---

## Épica: Gobernanza Financiera

Como Administrador Financiero, quiero que las salidas de dinero (egresos) estén controladas por un flujo de aprobación, para prevenir gastos no autorizados.

### Feature: Flujo de Aprobación de Egresos

**Scenario:** Registro de egreso requiere autorización jerárquica
```gherkin
Given que el coordinador registra una nueva transacción financiera
And especifica el tipo como 'EGRESO' por un monto de 'S/. 500.00'
When el coordinador guarda la transacción
Then el sistema fuerza el estado de aprobación inicial (`approvalKind`) a 'PENDING'
And el saldo real de la cuenta financiera no se descuenta
And la solicitud aparece en la bandeja de 'Egresos por Aprobar'
When el Administrador Financiero revisa los comprobantes adjuntos
And aprueba la transacción agregando el comentario "Aprobado para compra de víveres"
Then el sistema cambia `approvalKind` a 'APPROVED'
And deduce definitivamente los S/. 500.00 del saldo de la cuenta
```
