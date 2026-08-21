import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kY2EPgrTXFkYyYizY9YRRg_IY9Tr2D5';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log('Testing access to educa.cursos...');
  const { data, error } = await supabase.schema('educa').from('cursos').select('*').limit(1);
  console.log('Result:', error || data);
}

run();
