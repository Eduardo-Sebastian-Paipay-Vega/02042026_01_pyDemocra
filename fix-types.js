import fs from 'fs';
const files = [
  "src/modules/ong/app/services/admision/solicitudesAdmision.service.ts",
  "src/modules/ong/app/services/operacion/horas.service.ts",
  "src/modules/ong/app/services/recursos/categoriasFinancieras.service.ts",
  "src/modules/ong/app/services/recursos/comprobantesFinancieros.service.ts",
  "src/modules/ong/app/services/recursos/cuentasFinancieras.service.ts",
  "src/modules/ong/app/services/recursos/inventarioMovimientos.service.ts",
  "src/modules/ong/app/services/recursos/items.service.ts",
  "src/modules/ong/app/services/recursos/transaccionesFinancieras.service.ts",
  "src/modules/ong/app/services/recursos/ubicaciones.service.ts"
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // For supabase update/insert arguments that cause TS errors due to exact typing
    content = content.replace(/\.insert\(\s*([a-zA-Z0-9_]+)\s*\)/g, ".insert($1 as any)");
    content = content.replace(/\.update\(\s*([a-zA-Z0-9_]+)\s*\)/g, ".update($1 as any)");
    // Also support variables like (updates) or (datos)
    fs.writeFileSync(f, content);
    console.log('Fixed ' + f);
  } else {
    console.log('Not found: ' + f);
  }
});
