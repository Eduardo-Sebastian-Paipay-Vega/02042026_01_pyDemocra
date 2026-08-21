const SUPABASE_URL = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZnZuam9xdmR0bnJkdmxud2NvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA3NjM5NSwiZXhwIjoyMDg1NjUyMzk1fQ._AWvbaz7U3I2n2rAzpxDdMpC5lSLw3_HX9s_lpkcQMY';
const crypto = require('crypto');

const headers = {
  'apikey': SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function fixAccount() {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '33333333-2222-3333-4444-555555555555';

  // 1. Check if roles exist for this tenant
  let rResp = await fetch(`${SUPABASE_URL}/rest/v1/roles?tenant_id=eq.${tenantId}`, { headers });
  let roles = await rResp.json();
  
  if (roles.length === 0) {
    console.log('No roles found for tenant, creating default roles...');
    const defaultRoles = [
      { id: crypto.randomUUID(), tenant_id: tenantId, name: 'prime', hierarchy_level: 0, is_system_role: true },
      { id: crypto.randomUUID(), tenant_id: tenantId, name: 'director', hierarchy_level: 10, is_system_role: true },
      { id: crypto.randomUUID(), tenant_id: tenantId, name: 'docente', hierarchy_level: 30, is_system_role: true },
      { id: crypto.randomUUID(), tenant_id: tenantId, name: 'estudiante', hierarchy_level: 100, is_system_role: true }
    ];
    
    let insRoles = await fetch(`${SUPABASE_URL}/rest/v1/roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify(defaultRoles)
    });
    roles = await insRoles.json();
    console.log('Created roles:', roles);
  }

  // 2. Assign 'prime' or 'director' to the user
  const primeRole = roles.find(r => r.name === 'prime' || r.name === 'Administrador General') || roles[0];
  
  // Check if user already has a role
  let urResp = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}`, { headers });
  let userRoles = await urResp.json();

  if (userRoles.length === 0) {
    console.log('User has no role, assigning role:', primeRole.name);
    let assignResp = await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: crypto.randomUUID(),
        tenant_id: tenantId,
        user_id: userId,
        role_id: primeRole.id,
        assigned_at: new Date().toISOString()
      })
    });
    let result = await assignResp.json();
    console.log('Assigned role result:', result);
  } else {
    console.log('User already has role(s):', userRoles);
  }

  console.log('Account fix complete!');
}

fixAccount().catch(console.error);
