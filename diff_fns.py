import json

def get_fns_old(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('functions', [])

def get_fns_new(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return json.loads(data[0]['supabase_schema_documentation']).get('functions', [])

try:
    old_fns = get_fns_old('BD.json')
    new_fns = get_fns_new('BD_emergencia.json')

    old_fn_names = {f"{f['schema']}.{f['function_name']}" for f in old_fns if 'schema' in f and 'function_name' in f}
    new_fn_names = {f"{f['schema']}.{f['function_name']}" for f in new_fns if 'schema' in f and 'function_name' in f}

    missing_in_new = old_fn_names - new_fn_names
    missing_in_old = new_fn_names - old_fn_names

    if not missing_in_new and not missing_in_old:
        print("Both DBs have the exact same functions.")
    else:
        if missing_in_new:
            print('Functions in BD but not in BD_emergencia:', missing_in_new)
        if missing_in_old:
            print('Functions in BD_emergencia but not in BD:', missing_in_old)
except Exception as e:
    print('Error:', e)
