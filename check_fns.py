import json
with open('BD_emergencia.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    functions = json.loads(data[0]['supabase_schema_documentation']).get('functions', [])
    fn_names = [f['function_name'] for f in functions if 'function_name' in f]
    for target in ['fn_has_permission', 'fn_is_tenant_admin', 'fn_current_tenant_id']:
        print(f"{target} present: {target in fn_names}")
