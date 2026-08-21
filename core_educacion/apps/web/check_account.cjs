const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);

async function checkAccountInfo() {
  console.log('--- Checking Tenants ---');
  const { data: tenants, error: tErr } = await supabase.from('tenants').select('*');
  console.log(tenants);
  if (tErr) console.error(tErr);

  console.log('\n--- Checking Profiles ---');
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  console.log(profiles);
  if (pErr) console.error(pErr);

  console.log('\n--- Checking Roles ---');
  const { data: roles, error: rErr } = await supabase.from('roles').select('*');
  console.log(roles);
  if (rErr) console.error(rErr);

  console.log('\n--- Checking User Roles ---');
  const { data: userRoles, error: urErr } = await supabase.from('user_roles').select('*');
  console.log(userRoles);
  if (urErr) console.error(urErr);
}

checkAccountInfo();
