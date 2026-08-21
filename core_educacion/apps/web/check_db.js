import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Checking core.usuarios...');
  const { data: users, error: uErr } = await adminSupabase.schema('core').from('usuarios').select('*');
  console.log(uErr ? uErr : users);

  console.log('Checking core.tenants...');
  const { data: tenants, error: tErr } = await adminSupabase.schema('core').from('tenants').select('*');
  console.log(tErr ? tErr : tenants);
}

run();
