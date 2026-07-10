# ADR-002: Arquitectura Híbrida (Acceso Directo + Express API)
> **Fase 5 | Arquitectura y Desarrollo** | Estado: Aceptado | Fecha: 2026-07-09

## Contexto
Durante el diseño de la interacción Frontend-Base de Datos para Democra, existían dos enfoques principales utilizando Supabase:

1. **Backend Clásico Estricto:** El Frontend nunca habla con la base de datos. Todas las peticiones van a una API de Express (REST/GraphQL), la cual valida y luego consulta la base de datos.
2. **Backend as a Service (BaaS) Puro:** El Frontend hace todas las operaciones (CRUD) directamente contra Supabase usando `@supabase/supabase-js`, delegando toda la seguridad a RLS.
3. **Enfoque Híbrido:** Operaciones CRUD estándar directo a BD (BaaS), y operaciones de alto riesgo/complejas delegadas a un Backend propio.

## Decisión
Se adoptó un **Enfoque Híbrido** donde el módulo ONG (Personas, Proyectos, Recursos) consulta directamente Supabase, pero se mantiene una API Node.js/Express (`server/`) para los flujos críticos de IAM y Autenticación.

### Criterios de Enrutamiento
Se utiliza la API de Express *únicamente* para:
- **Autenticación Compleja:** El Motor de Riesgo que decide si pedir Step-Up MFA (OTP).
- **Onboarding Transaccional:** El proceso de registro de una nueva ONG que requiere validar en la API externa de SUNAT, crear el Tenant, el Perfil Admin, el Rol y la Sede inicial todo en una sola transacción ACID.
- **IAM Privilegiado:** Asignación de roles y permisos que requieren chequeos jerárquicos (`hierarchy_level`) complejos antes de modificar el `app_metadata` del usuario de Auth.

Todo el resto de la operación diaria (Ej. un voluntario reportando sus horas o un gestor viendo el inventario) se ejecuta usando `@supabase/supabase-js` directamente desde React.

## Consecuencias Positivas
- **Velocidad de Desarrollo (Time to Market):** Evita la necesidad de escribir controladores, rutas y serializadores en Node.js para las docenas de tablas de negocio estándar.
- **Reducción de Latencia:** El frontend se comunica directamente con la base de datos sin un salto intermedio de red (Frontend -> Vercel Edge -> Supabase DB).
- **Menor Costo de Cómputo:** Se reducen dramáticamente las invocaciones de funciones Serverless en Vercel, ya que el 90% del tráfico va a Supabase directamente.

## Consecuencias Negativas (Trade-offs)
- **Lógica de Negocio Fragmentada:** Parte de la validación está en la API (Express) y otra gran parte (ej. que no puedas crear un código de proyecto duplicado) está en triggers de la Base de Datos.
- **Difícil Testing:** Es complicado hacer pruebas de integración sobre lógica de negocio que reside en políticas RLS y Triggers, a diferencia del testing unitario/integración clásico sobre controladores Express. (Mitigación: Requerimiento inminente de pruebas E2E, documentado en GAPS).
