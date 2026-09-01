import os
import re

mig_dir = 'supabase/migrations'
target_functions = [
    'public.fn_current_tenant_id',
    'public.fn_trigger_audit_universal',
    'public.fn_bootstrap_tenant',
    'public.fn_bootstrap_tenant_v2',
    'public.fn_complete_access_onboarding',
    'public.fn_sync_urs_to_membership',
    'public.fn_validate_access_code',
    'public.fn_has_context_access',
    'public.fn_get_user_redirect_target',
    'public.get_my_sessions',
    'public.delete_my_session',
    'public.create_api_token',
    'public.delete_api_token',
    'public.fn_has_permission',
    'public.fn_is_tenant_admin'
]

output_sql = "-- CONSOLIDATED RECOVERY SCRIPT FOR 15 CRITICAL FUNCTIONS\n\n"
extracted = set()

files = sorted([f for f in os.listdir(mig_dir) if f.endswith('.sql')])

for func_name in target_functions:
    schema, name = func_name.split('.')
    # We will search for CREATE [OR REPLACE] FUNCTION schema.name or just name
    
    # A regex to match the exact CREATE FUNCTION block
    # It starts with CREATE ... FUNCTION name
    # and ends with $$ LANGUAGE sql; or $$; or LANGUAGE sql; 
    # Because there are many formats, let's just find the start:
    pattern = re.compile(rf'(?i)CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:{schema}\.)?{name}\b.*?(?:as\s+\$\$.*?\$\$;|\$\$\s+LANGUAGE.*?;)', re.DOTALL)
    
    for f in files:
        with open(os.path.join(mig_dir, f), 'r', encoding='utf-8') as file:
            content = file.read()
            matches = pattern.finditer(content)
            for match in matches:
                full_match = match.group(0)
                output_sql += f"-- Source: {f}\n"
                output_sql += full_match.strip() + "\n\n"
                extracted.add(func_name)

missing = set(target_functions) - extracted
if missing:
    print("WARNING: Could not extract:", missing)

with open('restore_15_functions.sql', 'w', encoding='utf-8') as out_f:
    out_f.write(output_sql)
print(f"Successfully wrote {len(extracted)} functions to restore_15_functions.sql")
