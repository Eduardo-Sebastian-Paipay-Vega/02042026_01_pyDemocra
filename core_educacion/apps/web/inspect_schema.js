import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data, error } = await adminSupabase
    .from('tenants')
    .select('*')
    .limit(1);
    
  if (error) {
     console.error(error);
  } else {
     console.log('Sample tenant:', data[0]);
  }
}

run();
