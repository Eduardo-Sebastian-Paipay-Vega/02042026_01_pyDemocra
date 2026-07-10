# Requisitos Funcionales Iniciales

*Fuente de verdad: `README.md`, `AUDIT_REPORT_S1.md`*

Basado en el análisis de la base de datos y la arquitectura inicial, se han inferido los siguientes requisitos funcionales de alto nivel del sistema Democra.

## 1. Identidad y Control de Acceso (IAM)

*   **Autenticación Base y MFA:** El sistema debe autenticar a los usuarios mediante credenciales estándar (Supabase Auth) y proveer una capa secundaria de autenticación (Multi-Factor Authentication) mediante el envío de OTPs (One-Time Passwords) por correo electrónico.
*   **Gestión de Invitaciones (ACE):** El sistema debe permitir invitar a voluntarios y colaboradores mediante la generación de enlaces de acceso únicos ("Access Links"), gestionando sus membresías contextuales.
*   **Aprovisionamiento de Administradores:** Debe existir un flujo seguro soportado por Edge Functions para configurar a los primeros administradores de cada tenant.
*   **Gestión de Permisos:** El acceso a los recursos debe validarse de manera granular con base en roles y permisos definidos por catálogo (`cat_permissions`, `role_permissions`).

## 2. Gestión Organizacional (Tenants)

*   **Soporte Multi-tenant:** El sistema debe operar para múltiples ONGs o clientes ("tenants") de forma concurrente, asegurando que los usuarios de un tenant solo interactúen con el contexto de su propia organización.
*   **Motor de Auditoría Universal:** Toda acción de creación, actualización o eliminación (CRUD) en entidades sensibles debe ser registrada en bitácoras (`auditoria.audit_log`) incluyendo evento, responsable (`actor_id`), datos previos, datos nuevos y nivel de criticidad.

## 3. Módulos Operativos Fundamentales

De acuerdo a la estructura de la base de datos, el sistema soporta lógicamente los siguientes dominios:

*   **Recursos Humanos (`rrhh`):** Gestión de registros de voluntarios y control de su asignación a sedes y organizaciones.
*   **Operación ONG (`ong`):** Gestión general de la estructura de la organización, incluyendo la generación de plantillas de credenciales (`id_card_templates`).
*   **Finanzas (`finanzas`):** Gestión de transacciones, aprobaciones financieras y manejo de saldos de cuentas de las ONGs.
*   **Gestión Clínica (`clinico`):** Registro y acceso a datos médicos e información sensible de beneficiarios (altamente protegido).
*   **Comunicaciones (`comunicaciones`):** Soporte de colas de sincronización e información de los dispositivos de los usuarios.

*(Nota: Módulos como Votaciones y Deliberación se infieren de la visión general de la plataforma, pero requieren ser mapeados a sus respectivos dominios en fases de documentación posteriores).*
