import json

def get_tables_old(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('tables_and_columns', [])

def get_tables_new(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return json.loads(data[0]['supabase_schema_documentation'])['tables']

try:
    old_tables = get_tables_old('BD.json')
    new_tables = get_tables_new('BD_emergencia.json')

    old_table_names = {f"{t['schema']}.{t['table_name']}" for t in old_tables}
    new_table_names = {f"{t['schema']}.{t['table_name']}" for t in new_tables}

    missing_in_new = old_table_names - new_table_names
    missing_in_old = new_table_names - old_table_names

    if not missing_in_new and not missing_in_old:
        print("Both DBs have the exact same tables.")
    else:
        if missing_in_new:
            print('Tables in BD but not in BD_emergencia:', missing_in_new)
        if missing_in_old:
            print('Tables in BD_emergencia but not in BD:', missing_in_old)
    
    # Also diff columns for tables that exist in both
    for t_new in new_tables:
        t_name = f"{t_new['schema']}.{t_new['table_name']}"
        if t_name in old_table_names:
            t_old = next(t for t in old_tables if f"{t['schema']}.{t['table_name']}" == t_name)
            old_cols = {c['column_name'] for c in t_old.get('columns', [])}
            new_cols = {c['column_name'] for c in t_new.get('columns', [])}
            if old_cols != new_cols:
                print(f'Schema changed for {t_name}:')
                if new_cols - old_cols:
                    print('  Columns added:', new_cols - old_cols)
                if old_cols - new_cols:
                    print('  Columns removed:', old_cols - new_cols)

    # Check for dropped/missing functions or changes in functions? The user mentioned they just added `fn_has_permission`.
    
except Exception as e:
    print('Error:', e)
