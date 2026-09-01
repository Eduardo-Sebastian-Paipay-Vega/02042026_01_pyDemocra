import json
from collections import defaultdict

def extract_schema_data(file_path, is_old=False):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    if is_old:
        tables = data.get('tables_and_columns', [])
        functions = data.get('functions', [])
        rls = data.get('rls_policies', [])
        triggers = data.get('triggers', [])
    else:
        doc = json.loads(data[0]['supabase_schema_documentation'])
        tables = doc.get('tables', [])
        functions = doc.get('functions', [])
        rls = doc.get('rls_policies', [])
        triggers = doc.get('triggers', [])
        
    return tables, functions, rls, triggers

try:
    old_tables, old_funcs, old_rls, old_triggers = extract_schema_data('BD.json', is_old=True)
    new_tables, new_funcs, new_rls, new_triggers = extract_schema_data('BD_emergencia.json', is_old=False)
    
    report = []
    
    # 1. Functions
    old_fn_map = {f"{f['schema']}.{f['function_name']}": f for f in old_funcs if 'schema' in f and 'function_name' in f}
    new_fn_map = {f"{f['schema']}.{f['function_name']}": f for f in new_funcs if 'schema' in f and 'function_name' in f}
    
    missing_fns = set(old_fn_map.keys()) - set(new_fn_map.keys())
    if missing_fns:
        report.append(f"### Funciones Faltantes ({len(missing_fns)})")
        for fn in sorted(missing_fns):
            report.append(f"- `{fn}`")
    
    # 2. RLS Policies
    old_rls_map = {f"{r['schema']}.{r['table_name']} -> {r['policy_name']}": r for r in old_rls if 'schema' in r and 'table_name' in r and 'policy_name' in r}
    # Some DB_emergencia policies might be inside the 'tables' array instead of 'rls_policies'
    new_rls_map = {}
    for r in new_rls:
        if 'schema' in r and 'table_name' in r and 'policy_name' in r:
            new_rls_map[f"{r['schema']}.{r['table_name']} -> {r['policy_name']}"] = r
    # Fallback to tables array if new_rls is empty
    if not new_rls_map:
        for t in new_tables:
            for r in t.get('rls_policies', []):
                new_rls_map[f"{t['schema']}.{t['table_name']} -> {r['policy_name']}"] = r
                
    missing_rls = set(old_rls_map.keys()) - set(new_rls_map.keys())
    if missing_rls:
        report.append(f"\n### RLS Policies Faltantes ({len(missing_rls)})")
        for r in sorted(missing_rls):
            report.append(f"- `{r}`")
            
    # 3. Triggers
    old_trg_map = {f"{t['schema']}.{t['table_name']} -> {t['trigger_name']}": t for t in old_triggers if 'schema' in t and 'table_name' in t and 'trigger_name' in t}
    new_trg_map = {}
    for t in new_triggers:
        if 'schema' in t and 'table_name' in t and 'trigger_name' in t:
            new_trg_map[f"{t['schema']}.{t['table_name']} -> {t['trigger_name']}"] = t
    if not new_trg_map:
        for t in new_tables:
            for trg in t.get('triggers', []):
                new_trg_map[f"{t['schema']}.{t['table_name']} -> {trg['trigger_name']}"] = trg
                
    missing_trg = set(old_trg_map.keys()) - set(new_trg_map.keys())
    if missing_trg:
        report.append(f"\n### Triggers Faltantes ({len(missing_trg)})")
        for t in sorted(missing_trg):
            report.append(f"- `{t}`")
            
    # 4. Tables and Columns
    old_tbl_map = {f"{t['schema']}.{t['table_name']}": t for t in old_tables if 'schema' in t and 'table_name' in t}
    new_tbl_map = {f"{t['schema']}.{t['table_name']}": t for t in new_tables if 'schema' in t and 'table_name' in t}
    
    missing_tbls = set(old_tbl_map.keys()) - set(new_tbl_map.keys())
    if missing_tbls:
        report.append(f"\n### Tablas Faltantes ({len(missing_tbls)})")
        for t in sorted(missing_tbls):
            report.append(f"- `{t}`")
            
    col_changes = []
    for t_name, t_old in old_tbl_map.items():
        if t_name in new_tbl_map:
            t_new = new_tbl_map[t_name]
            old_cols = {c['column_name'] for c in t_old.get('columns', [])}
            new_cols = {c['column_name'] for c in t_new.get('columns', [])}
            
            missing_cols = old_cols - new_cols
            added_cols = new_cols - old_cols
            if missing_cols or added_cols:
                col_changes.append(f"**{t_name}**:")
                if missing_cols: col_changes.append(f"  - Columnas eliminadas/faltantes: {', '.join(missing_cols)}")
                if added_cols: col_changes.append(f"  - Columnas nuevas: {', '.join(added_cols)}")
                
    if col_changes:
        report.append("\n### Columnas Alteradas")
        report.extend(col_changes)

    with open('full_diff_report.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(report))
        
    print("Report written to full_diff_report.md")

except Exception as e:
    print('Error:', e)
