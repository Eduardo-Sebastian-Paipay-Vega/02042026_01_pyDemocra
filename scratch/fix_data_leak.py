import re

file_path = r'D:\mela\02042026_01_pyDemocra\src\modules\ong\app\services\gobernanza\shared.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix hasPermission
has_permission_search = r'''      warnings\.push\(
        `No se pudo validar el permiso \$\{permission\} con public\.fn_has_permission\(\)\.`
      \);'''
has_permission_replace = r'''      warnings.push(
        `Error al validar el permiso: ${permission}.`
      );'''
content = re.sub(has_permission_search, has_permission_replace, content)

# Fix isTenantAdmin
is_tenant_admin_search = r'''warnings\.push\("No se pudo validar tenant admin con public\.fn_is_tenant_admin\(\) \(permiso core iam\.admin\)\."\);'''
is_tenant_admin_replace = r'''warnings.push("Error al validar el estado de administrador.");'''
content = re.sub(is_tenant_admin_search, is_tenant_admin_replace, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
