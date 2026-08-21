const SUPABASE_URL = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZnZuam9xdmR0bnJkdmxud2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjM5NSwiZXhwIjoyMDg1NjUyMzk1fQ._AWvbaz7U3I2n2rAzpxDdMpC5lSLw3_HX9s_lpkcQMY';

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json'
};

async function check() {
  console.log('--- Checking Tenants ---');
  let t = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=*`, { headers });
  console.log(await t.json());

  console.log('\n--- Checking Profiles ---');
  let p = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, { headers });
  console.log(await p.json());

  console.log('\n--- Checking User Roles ---');
  let ur = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=*`, { headers });
  console.log(await ur.json());
}
check();
