import json

with open('BD.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

doc = json.loads(data[0]['supabase_schema_documentation'])

for table in doc.get('tables', []):
    if table.get('table_name') == 'historial_notificaciones':
        print(f"Table: {table.get('schema')}.{table.get('table_name')}")
        for c in table.get('columns', []):
            print(f"  - {c.get('column_name')}: {c.get('data_type')}")
