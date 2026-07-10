# Glosario de Negocio
> **Transversal | Contexto IA** | Fecha: 2026-07-09

Este glosario unifica la terminología utilizada tanto por el equipo humano como por las IAs integradas en Democra, asegurando consistencia (Lenguaje Ubicuo).

| Término | Definición | Contexto / Módulo |
|---------|------------|-------------------|
| **Tenant** | Organización o ONG registrada en el sistema. Representa el límite físico y lógico de los datos. | General / Seguridad |
| **Voluntario** | Colaborador activo de la ONG. Posee un perfil, registra horas y puede tener acceso al sistema. | People |
| **Beneficiario** | Persona natural (adulto mayor, niño) que recibe ayuda de la ONG. No accede al sistema. | People |
| **Candidato** | Persona en proceso de admisión (NUEVA, EN_ENTREVISTA) que aún no es Voluntario. | Admission |
| **Kardex** | Registro histórico, inmutable y ordenado de entradas y salidas de artículos en el inventario. | Resources |
| **Stock Derivado** | Cantidad actual de un artículo, calculada dinámicamente sumando todos los movimientos de Kardex. | Resources |
| **Egreso** | Salida de dinero de una cuenta financiera. Requiere aprobación jerárquica. | Resources |
| **Sede** | Unidad geográfica u oficina perteneciente a un Tenant. | Configuración |
| **Motor de Riesgo** | Componente de seguridad que evalúa el contexto de un login para decidir si requiere MFA. | Seguridad |
| **Step-Up MFA** | Proceso de solicitar autenticación secundaria (OTP) solo cuando el riesgo lo amerita. | Seguridad |
| **ACE (Engine)** | Access & Context Engine. Sistema de RBAC hiper-granular basado en contexto dinámico. | Seguridad |
| **Bootstrap** | Proceso inicial y seguro de creación de un Tenant, Roles Base y Sede Inicial. | Onboarding |
