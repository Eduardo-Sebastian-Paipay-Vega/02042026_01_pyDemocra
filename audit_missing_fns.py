import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Schemas de negocio (no del sistema)
BUSINESS_SCHEMAS = {'public', 'gym', 'ong', 'rrhh', 'telemetria', 'academico', 'educ'}

# --- Parse BD.json ---
bd = json.load(open('BD.json', encoding='utf-8'))
bd_map = {}
for f in bd.get('functions', []):
    key = f"{f['schema']}.{f['function_name']}"
    if f['schema'] in BUSINESS_SCHEMAS:
        bd_map[key] = f

# --- Parse BD_emergencia.json ---
d = json.load(open('BD_emergencia.json', encoding='utf-8'))
inner = json.loads(d[0]['supabase_schema_documentation'])

emer_map = {}
for schema_group in inner.get('functions', []):
    schema = schema_group.get('schema', 'public')
    if schema in BUSINESS_SCHEMAS:
        for fn in schema_group.get('functions', []):
            key = f"{schema}.{fn['function_name']}"
            emer_map[key] = fn

# --- Compute diffs ---
missing_keys = sorted(set(bd_map.keys()) - set(emer_map.keys()))
present_keys = sorted(set(bd_map.keys()) & set(emer_map.keys()))
new_keys = sorted(set(emer_map.keys()) - set(bd_map.keys()))

print("=" * 80)
print("AUDITORIA COMPLETA DE FUNCIONES DE NEGOCIO")
print("=" * 80)
print(f"BD.json (backup original): {len(bd_map)} funciones de negocio")
print(f"BD_emergencia.json (estado actual DB): {len(emer_map)} funciones de negocio")
print()

print(f"[OK] PRESENTES en ambos: {len(present_keys)}")
for k in present_keys:
    fn = emer_map[k]
    print(f"   {k}  ->  returns {fn.get('return_type','?')}")

print()
print(f"[FALTA] FALTANTES (necesitan restauracion): {len(missing_keys)}")
for k in missing_keys:
    fn = bd_map[k]
    defn = fn.get('definition', '') or ''
    has_full = 'CREATE' in defn.upper() and 'FUNCTION' in defn.upper() if defn else False
    print(f"   {k}  ->  returns {fn.get('return_type','?')}  |  full_sql={'SI' if has_full else 'SOLO BODY'}")

print()
print(f"[NUEVA] Solo en BD actual, no en BD.json: {len(new_keys)}")
for k in new_keys:
    fn = emer_map[k]
    print(f"   {k}  ->  returns {fn.get('return_type','?')}")

# --- Detail ---
print()
print("=" * 80)
print("DETALLE DE FUNCIONES FALTANTES")
print("=" * 80)

restorable = []
body_only = []

for k in missing_keys:
    fn = bd_map[k]
    defn = fn.get('definition', '') or ''
    has_full = 'CREATE' in defn.upper() and 'FUNCTION' in defn.upper() if defn else False
    
    print()
    print(f"--- {k} ---")
    print(f"  return_type: {fn.get('return_type','?')}")
    print(f"  has_full_CREATE: {has_full}")
    
    if has_full:
        restorable.append(k)
        print(f"  preview: {defn.strip()[:200]}...")
    else:
        body_only.append(k)
        print(f"  body: {defn.strip()[:200]}")

print()
print("=" * 80)
print(f"RESUMEN: {len(restorable)} restaurables directamente, {len(body_only)} necesitan reconstruccion de firma")
print("=" * 80)

# Save audit
audit = {
    'present': present_keys,
    'missing': [],
    'new_in_db': new_keys
}

for k in missing_keys:
    fn = bd_map[k]
    defn = fn.get('definition', '') or ''
    has_full = 'CREATE' in defn.upper() and 'FUNCTION' in defn.upper() if defn else False
    audit['missing'].append({
        'qualified_name': k,
        'return_type': fn.get('return_type', '?'),
        'has_full_create': has_full,
        'definition': defn
    })

with open('missing_functions_audit.json', 'w', encoding='utf-8') as out:
    json.dump(audit, out, indent=2, ensure_ascii=False)

print("Audit saved to missing_functions_audit.json")
