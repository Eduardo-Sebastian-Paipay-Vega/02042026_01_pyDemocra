const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'cambios', '13082026_Audit_Report.json');
const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log('\n--- RLS POLICIES FOR CORE TABLES ---');
const coreTables = ['tenants', 'cat_industry_types', 'profiles', 'roles', 'user_roles_sedes', 'sedes'];
if (content.rls_policies) {
    const corePolicies = content.rls_policies.filter(p => p.schema === 'public' && coreTables.includes(p.table));
    corePolicies.forEach(p => {
        console.log(`\nTable: ${p.table} | Policy: ${p.policy_name} (${p.command})`);
        console.log(`Roles: ${p.roles}`);
        console.log(`Using: ${p.using_expression}`);
        if (p.with_check_expression) console.log(`With Check: ${p.with_check_expression}`);
    });
}
