import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\services\gobernanza\sensitiveAccess.service.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix table names in warning messages
content = content.replace('"No se pudo consultar clinico.accesos_sensibles_log."', '"No se pudo consultar el registro de accesos sensibles."')
content = content.replace('"No se pudo consultar clinico.accesos_sensibles_voluntario_log."', '"No se pudo consultar el registro de accesos de voluntarios."')
content = content.replace('"No se pudo consultar public.role_access_constraints."', '"No se pudieron consultar las restricciones de acceso."')

# The note at the top also leaks table names but it is returned in unsupportedFlows, which is rendered in the UI. 
# Let's remove them from unsupportedFlows as well.
note_search = r'''const SENSITIVE_FLOW_NOTES = \[
  "La vista consolida `clinico\.accesos_sensibles_log` y `clinico\.accesos_sensibles_voluntario_log`; Gobernanza expone solo la bitacora, no el contenido de las fichas\.",
  "Las filas historicas de `clinico\.accesos_sensibles_log` no documentan `ip` ni `user_agent`; cuando el contrato origen no los trae, la UI muestra `-`\.",
\];'''
note_replace = r'''const SENSITIVE_FLOW_NOTES = [
  "La vista consolida los accesos sensibles a fichas de beneficiarios y voluntarios; Gobernanza expone solo la bitácora, no el contenido de las fichas.",
  "Las filas históricas de accesos antiguos pueden no documentar IP ni User Agent; cuando no están disponibles, se muestra '-'.",
];'''
content = re.sub(note_search, note_replace, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
