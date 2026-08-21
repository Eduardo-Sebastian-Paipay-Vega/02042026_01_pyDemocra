const fs = require('fs');
const path = require('path');

const files = [
    'd:/2026/EDUCIA/packages/database/supabase/migrations/20260810163000_core_oltp_schema.sql',
    'd:/2026/EDUCIA/packages/database/supabase/migrations/20260810170000_tier45_schema.sql',
    'd:/2026/EDUCIA/packages/database/supabase/migrations/20260810173000_telemetria_triggers.sql'
];

let allSql = '';
files.forEach(f => {
    allSql += fs.readFileSync(f, 'utf8') + '\n\n';
});

console.log("=== INICIANDO AUDITORÍA SUPABASE ===");

// 1. Extraer todas las tablas
const tableRegex = /CREATE TABLE ([\w\.]+)\s*\(([\s\S]*?)\);/g;
let tables = {};
let match;

while ((match = tableRegex.exec(allSql)) !== null) {
    const tableName = match[1];
    const columnsText = match[2];
    
    // check tenant_id
    const hasTenantId = columnsText.includes('tenant_id');
    
    // find all references
    const refsRegex = /REFERENCES ([\w\.]+)\(([\w]+)\)/g;
    let refs = [];
    let refMatch;
    while ((refMatch = refsRegex.exec(columnsText)) !== null) {
        refs.push({ table: refMatch[1], col: refMatch[2] });
    }
    
    tables[tableName] = {
        hasTenantId,
        refs,
        columns: columnsText // rough representation
    };
}

console.log(`\n✅ Total Tablas Encontradas: ${Object.keys(tables).length}`);

// 2. Validar Tenant ID
const tablesWithoutTenantId = Object.keys(tables).filter(t => !tables[t].hasTenantId);
if (tablesWithoutTenantId.length > 0) {
    console.log("❌ Tablas sin tenant_id: ", tablesWithoutTenantId);
} else {
    console.log("✅ 100% Cobertura de tenant_id en todas las tablas.");
}

// 3. Validar RLS
let rlsErrors = [];
Object.keys(tables).forEach(t => {
    const rlsRegex = new RegExp(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`, 'i');
    if (!rlsRegex.test(allSql)) {
        rlsErrors.push(t);
    }
});
if (rlsErrors.length > 0) {
    console.log("❌ Tablas sin RLS Habilitado: ", rlsErrors);
} else {
    console.log("✅ 100% Cobertura de ENABLE ROW LEVEL SECURITY.");
}

// 4. Validar Referencias Cruzadas (Foreign Keys)
let brokenRefs = [];
Object.keys(tables).forEach(t => {
    tables[t].refs.forEach(r => {
        if (!tables[r.table]) {
            brokenRefs.push(`${t} apunta a tabla inexistente -> ${r.table}`);
        } else {
            // roughly check if column exists
            if (!tables[r.table].columns.includes(r.col)) {
                brokenRefs.push(`${t} apunta a columna inexistente -> ${r.table}(${r.col})`);
            }
        }
    });
});

if (brokenRefs.length > 0) {
    console.log("❌ Referencias rotas encontradas:\n", brokenRefs.join('\n'));
} else {
    console.log("✅ 100% Integridad Referencial Cruzada perfecta.");
}

// 5. Validar Triggers vs Tablas
const triggerRegex = /ON ([\w\.]+)\s+FOR EACH ROW/g;
let triggerMatch;
let triggerErrors = [];
while ((triggerMatch = triggerRegex.exec(allSql)) !== null) {
    const targetTable = triggerMatch[1];
    if (!tables[targetTable]) {
        triggerErrors.push(targetTable);
    }
}
if (triggerErrors.length > 0) {
    console.log("❌ Triggers apuntando a tablas inexistentes: ", triggerErrors);
} else {
    console.log("✅ 100% Triggers apuntando a tablas reales.");
}

console.log("\n=== AUDITORÍA FINALIZADA ===");
