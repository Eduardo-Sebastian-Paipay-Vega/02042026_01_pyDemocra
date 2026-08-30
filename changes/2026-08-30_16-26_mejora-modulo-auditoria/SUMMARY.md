## Qué se hizo
1. Se corrigió un Data Leak crítico donde la UI del Historial de Auditoría exponía variables internas y errores crudos de la base de datos SQL.
2. Se arregló el query SQL roto del servicio udit.service.ts para que apunte correctamente a las columnas reales de public.audit_logs (
esource_name, ctor_id, event_type, payload_before, etc.) validado por BD.json.
3. Se integró la traducción de UUID de los actores para renderizar Nombres y Correos en lugar de códigos ilegibles.
4. Se rediseñó la experiencia de usuario (UX) implementando un Toolbar compacto y encapsulando 6 filtros masivos dentro de un componente UI Popover (Filtros Avanzados), solucionando la saturación de pantalla.
5. Se corrigió la colisión de estados (Error vs Empty State) utilizando renderizado condicional estricto.

## Por qué se hizo
Para solucionar vulnerabilidades de seguridad (Information Disclosure), corregir la pantalla rota por columnas fantasma (schema_name) y mejorar una UX deficiente (filtros apilados y colisión visual de estados).

## Qué beneficio aporta
1. Seguridad reforzada.
2. Interfaz limpia, responsiva y fácil de utilizar.
3. El administrador puede leer logs reales y saber exactamente QUÉ pasó y QUIÉN lo hizo gracias a la traducción de UUID.
4. Los filtros avanzados ya no destruyen el layout.

## Funcionalidades afectadas
- Módulo de Gobernanza / Audit Log
- Servicios de consulta de public.audit_logs
