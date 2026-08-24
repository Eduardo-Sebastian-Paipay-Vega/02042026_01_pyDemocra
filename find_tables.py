import json
with open('BD.json', 'r', encoding='utf-8') as f:
    content = f.read()
    if content.startswith('|'): content = content[1:].strip()
    if content.endswith('|'): content = content[:-1].strip()
    db = json.loads(content)
for t in db.get('tables', []):
    name = t.get('table_name', '').lower()
    if 'usuario' in name or 'perfil' in name or 'sesion' in name or 'session' in name:
        print(f'{t.get("schema")}.{t.get("table_name")}')
