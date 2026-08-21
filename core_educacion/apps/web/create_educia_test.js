import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const tenantId = '00000000-0000-0000-0000-000000000001';
const userId = '33333333-2222-3333-4444-555555555555';

async function setup() {
  console.log('Creando Rol en core.roles...');
  await adminSupabase.schema('core').from('roles').upsert({ rol_id: 'director', nombre: 'Director' });

  console.log('Reintentando crear Perfil en core.usuarios...');
  const { error: profileError } = await adminSupabase
    .schema('core')
    .from('usuarios')
    .upsert({
      usuario_id: userId,
      nombres: 'Admin',
      apellidos: 'Educia',
      email: 'admin@educia.pro',
      rol_id: 'director',
      tenant_id: tenantId
    });

  if (profileError) console.log('Error perfil core.usuarios:', profileError.message);
  else console.log('Perfil core.usuarios creado.');
}

setup();
