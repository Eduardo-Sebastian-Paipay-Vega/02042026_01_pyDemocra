import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const files = globSync('ong/src/app/services/**/shared.ts');

for (const file of files) {
  let content = readFileSync(file, 'utf8');
  let original = content;

  const schemas = [
    'public',
    'ong',
    'rrhh',
    'clinico',
    'comunicaciones',
    'auditoria',
    'academico',
    'finanzas',
  ];

  for (const schema of schemas) {
    // Replace: return supabase.schema("SCHEMA"); -> return supabase.schema("SCHEMA" as any) as any;
    // Replace: return governanceDb.schema("SCHEMA");
    // Replace: return settingsDb.schema("SCHEMA");
    // Replace: return notificationsDb.schema("SCHEMA");
    // Replace: return peopleDb.schema("SCHEMA");
    
    const dbVars = ['supabase', 'governanceDb', 'settingsDb', 'notificationsDb', 'peopleDb'];
    
    for (const dbVar of dbVars) {
      const regex = new RegExp(`return ${dbVar}\\.schema\\("${schema}"\\);`, 'g');
      content = content.replace(regex, `return ${dbVar}.schema("${schema}" as any) as any;`);
    }
  }

  if (content !== original) {
    writeFileSync(file, content, 'utf8');
    console.log(`Patched schemas in ${file}`);
  }
}
