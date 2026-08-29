import re

with open('ong/src/app/tenant/navigation.tsx', 'r', encoding='utf-8') as f:
    data = f.read()

data = re.sub(
    r'(const NAV_GROUPS: TenantNavGroup\[\] = \[\n(?:.*?\n)*?)(?=\];)',
    r'\1  { id: "academico", label: "Académico", icon: BookOpen },\n',
    data
)

courses_block = re.search(r'\{\s*id:\s*"courses",\s*(?:.*?\n)*?.*\},', data).group(0)
new_courses_block = courses_block.replace('path: `${ONG_SHELL_BASE_PATH}/resources/courses`,', 'path: `${ONG_SHELL_BASE_PATH}/academico/cursos`,')
new_courses_block = new_courses_block.replace('groupId: "recursos",', 'groupId: "academico",')
new_courses_block = new_courses_block.replace('breadcrumb: "Recursos",', 'breadcrumb: "Académico",')
new_courses_block = new_courses_block.replace('icon: CheckSquare,', 'icon: BookOpen,')

data = data.replace(courses_block, new_courses_block)

if 'BookOpen' not in data[:500]:
    data = data.replace('import {\n  Bell,', 'import {\n  Bell,\n  BookOpen,')

with open('ong/src/app/tenant/navigation.tsx', 'w', encoding='utf-8') as f:
    f.write(data)

with open('ong/src/app/routes.tsx', 'r', encoding='utf-8') as f:
    r_data = f.read()

r_data = r_data.replace('path: "resources/courses",', 'path: "academico/cursos",')

with open('ong/src/app/routes.tsx', 'w', encoding='utf-8') as f:
    f.write(r_data)
