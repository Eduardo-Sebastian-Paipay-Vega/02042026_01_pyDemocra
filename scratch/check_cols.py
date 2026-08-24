import json

bd = json.load(open('BD.json', 'r', encoding='utf-8'))
schema = json.loads(bd[0]['supabase_schema_documentation'])

for t in schema.get('tables', []):
    name = t.get('name') or t.get('table_name')
    if name in ['profiles', 'tenants']:
        print(f'\n--- Table: {name} ---')
        cols = t.get('columns', [])
        for c in cols:
            print(f"  - {c.get('column_name')}: {c.get('data_type')}")
