import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\pages\SensitiveAccess.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix PageHeader description
header_search = r'''description="Monitorea eventos reales de clinico\.accesos_sensibles_log y clinico\.accesos_sensibles_voluntario_log, y gestiona restricciones de acceso sobre public\.role_access_constraints\."'''
header_replace = r'''description="Monitorea eventos reales de accesos a información clínica, y gestiona las restricciones de acceso al sistema."'''
content = re.sub(header_search, header_replace, content)

# Fix constraint Modal subtitle
modal_subtitle_search = r'''              <p className="text-\[12px\]" style=\{\{ color: "var\(--t-text-dim\)" \}\}>
                public\.role_access_constraints
              </p>'''
modal_subtitle_replace = r'''              <p className="text-[12px]" style={{ color: "var(--t-text-dim)" }}>
                Configuración de seguridad
              </p>'''
content = re.sub(modal_subtitle_search, modal_subtitle_replace, content)

# Fix GovernanceErrorBlock message
error_block_search = r'''message="La tabla public\.role_access_constraints existe y soporta escritura, pero esta vista exige `settings\.roles\.read` / `settings\.roles\.manage` o tenant admin\."'''
error_block_replace = r'''message="Esta vista exige permisos de `settings.roles.read` o de administración para gestionar restricciones."'''
content = re.sub(error_block_search, error_block_replace, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
