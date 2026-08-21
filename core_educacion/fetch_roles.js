const SUPABASE_URL = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZnZuam9xdmR0bnJkdmxud2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjM5NSwiZXhwIjoyMDg1NjUyMzk1fQ._AWvbaz7U3I2n2rAzpxDdMpC5lSLw3_HX9s_lpkcQMY';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

async function check() {
  console.log('--- Checking Roles ---');
  let r = await fetch(`${SUPABASE_URL}/rest/v1/roles?select=*`, { headers });
  console.log(await r.json());

  console.log('\n--- Checking user_roles_sedes ---');
  let urs = await fetch(`${SUPABASE_URL}/rest/v1/user_roles_sedes?select=*`, { headers });
  if (urs.status === 404) console.log('user_roles_sedes not found');
  else console.log(await urs.json());
}
check();
