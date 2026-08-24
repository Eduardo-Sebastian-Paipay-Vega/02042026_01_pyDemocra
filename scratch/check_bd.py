import json

with open('BD.json', 'r', encoding='utf-8') as f:
    bd = json.load(f)

schema = bd[0].get('supabase_schema_documentation', {})
public = schema.get('schemas', {}).get('public', {})
tables = public.get('tables', {})

for t_name, t_data in tables.items():
    if 'tenant' in t_name.lower() or 'profile' in t_name.lower() or 'setting' in t_name.lower():
        print(f'Table: {t_name}')
        cols = t_data.get('columns', {})
        for c_name, c_data in cols.items():
            print(f"  - {c_name}: {c_data.get('type')} - {c_data.get('description', '')}")
