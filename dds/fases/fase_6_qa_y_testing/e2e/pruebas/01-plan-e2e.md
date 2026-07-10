# Plan de Pruebas End-to-End (E2E)
> **Fase 6 | QA y Testing** | Fecha de análisis: 2026-07-09

---

## 1. Propósito de las Pruebas E2E

En Democra, el Frontend React interactúa directamente con la Base de Datos (Supabase) para el 90% de las operaciones del negocio (módulos de Personas, Proyectos, Inventarios). Esto implica que la lógica y correcta secuenciación de peticiones recae en gran medida en los hooks del frontend, haciendo de las pruebas E2E una pieza crítica para asegurar que la UI representa correctamente las reglas del negocio y el control de acceso (RLS).

Este plan define la estrategia y los flujos que deberán ser automatizados (ej. usando **Playwright**).

## 2. Flujos E2E Críticos (Golden Flows)

Los "Golden Flows" son las secuencias de acciones que aportan el mayor valor al usuario y que, de fallar, paralizan el uso del sistema. Estos flujos deben probarse en integración completa (Navegador -> Express -> Supabase).

### Flujo Crítico 1: Bootstrap Multi-Tenant (Onboarding)
- **Actor:** Visitante / Nuevo Administrador.
- **Acción:** Acceder a la Landing Page -> Completar Formulario RUC -> Recibir validación SUNAT -> Configurar clave SuperAdmin -> Ingresar a la App de la ONG.
- **Validación E2E:** 
  1. El RUC inválido debe mostrar error UI.
  2. Tras éxito, el usuario debe ver el Dashboard vacío.
  3. En background: Asegurar que el tenant_id ha sido inyectado en su JWT.

### Flujo Crítico 2: Ciclo de Vida de Admisión y Voluntario
- **Actor:** Candidato (Autoregistro) -> Coordinador ONG.
- **Acción:**
  1. **Candidato:** Ingresar vía Access Link con código (Ej. DEMO2026) -> Llenar Formulario Dinámico.
  2. **Coordinador:** Loguearse -> Ir a Módulo Admisión -> Ver solicitud -> Entrevistar -> Aprobar -> Finalizar Onboarding -> Crear Voluntario.
- **Validación E2E:** La transición completa del estado `NUEVA` hasta la inserción en la vista de Voluntarios.

### Flujo Crítico 3: Registro de Asistencia y Control de Horas
- **Actor:** Voluntario (Terminal/App) -> Gestor de Proyectos.
- **Acción:**
  1. **Gestor:** Crear Proyecto -> Crear Actividad -> Asignar Voluntario 'A'.
  2. **Voluntario:** Loguearse -> Ir a Mi Perfil -> Ver actividad asignada -> Registrar 4 horas + Evidencia Fotográfica.
  3. **Gestor:** Ir a Bandeja de Horas -> Aprobar horas pendientes.
- **Validación E2E:** El KPI "Horas de Impacto" en el perfil del voluntario debe pasar de 0 a 4 únicamente después de la aprobación del Gestor.

## 3. Pruebas de Autorización Contextual (E2E)

Dado que Democra cuenta con un motor de acceso complejo (ACE), se deben ejecutar pruebas simulando diferentes roles en la misma sesión/pantalla:

- **Prueba ACE-1 (Campo Restringido):** 
  - Login como Rol con permiso completo: Visualizar Perfil de Voluntario (Debe mostrar email, teléfono y datos médicos si hay justificación).
  - Login como Rol restringido (`is_field_restricted=true`): Visualizar mismo perfil (Debe ocultar DNI/Teléfono mostrando "Dato Oculto").
- **Prueba ACE-2 (Datos Sensibles):**
  - Acceder a pestaña "Ficha Médica". 
  - Validar que un Modal exija escribir el motivo obligatorio (`reason`). 
  - Escribir motivo -> Guardar -> Comprobar que la vista médica se desbloquea en la sesión actual.

## 4. Consideraciones Técnicas para Automatización

- **Seed Data:** Antes de correr los tests E2E, se deberá ejecutar un script SQL que inyecte un tenant "sandbox" con roles base.
- **Bypass 2FA en Testing:** El entorno E2E deberá configurar temporalmente una variable de entorno en el backend (`E2E_MODE=true`) o proveer una semilla fija al evaluador de riesgo para prevenir bloqueos automáticos, o bien configurar el servicio de emails simulado (Mailhog/Mailtrap) para interceptar y extraer el OTP dinámicamente durante los flujos de login.
