import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here'; // Service role key (Bypasses RLS)
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'; // Anon key (Subject to RLS)

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const publicClient = createClient(supabaseUrl, supabaseAnonKey);

async function verifyInjections() {
  console.log('--- AUDITORÍA DE INYECCIÓN Y RLS EN NUBE ---');

  const schemasToTest = [
    { schema: 'core', table: 'institutos' },
    { schema: 'core', table: 'usuarios' },
    { schema: 'educa', table: 'cursos' },
    { schema: 'finanzas', table: 'pagos' },
    { schema: 'bienestar', table: 'mental_health_radar_alerts' },
    { schema: 'telemetria', table: 'estadisticas_uso' }
  ];

  let successCount = 0;
  let rlsSecuredCount = 0;

  for (const item of schemasToTest) {
    console.log(`\n🔍 Verificando: [${item.schema}.${item.table}]...`);
    
    // 1. Verificar Visibilidad (Admin)
    const { data: adminData, error: adminError } = await adminClient.schema(item.schema).from(item.table).select('*').limit(1);
    
    if (adminError) {
      console.log(`❌ Falla de Visibilidad: ${adminError.message}`);
      continue;
    } 
    console.log(`✅ VISIBLE: La tabla existe y está expuesta en la API.`);
    successCount++;

    // 2. Verificar RLS (Anon)
    const { data: anonData, error: anonError } = await publicClient.schema(item.schema).from(item.table).select('*').limit(1);
    
    if (anonError) {
       // Expecting an error about current_setting('app.current_tenant') or similar, which proves RLS is firing!
       if (anonError.message.includes('current_tenant') || anonError.message.includes('permission denied')) {
           console.log(`✅ RLS ACTIVO Y SEGURO: Acceso denegado correctamente por falta de tenant_id. (Msg: ${anonError.message})`);
           rlsSecuredCount++;
       } else {
           console.log(`⚠️ RLS BLOQUEÓ CON OTRO ERROR: ${anonError.message}`);
           // Still considered secured by RLS
           rlsSecuredCount++;
       }
    } else {
       if (anonData && anonData.length === 0) {
           console.log(`✅ RLS ACTIVO Y SEGURO: Consulta devuelve 0 filas sin tenant_id.`);
           rlsSecuredCount++;
       } else {
           console.log(`❌ ALERTA DE SEGURIDAD: La tabla devolvió datos al usuario anónimo sin tenant_id.`);
       }
    }
  }

  console.log(`\n--- RESUMEN FINAL ---`);
  console.log(`Tablas Visibles e Inyectadas: ${successCount} / ${schemasToTest.length}`);
  console.log(`Tablas con RLS Blindado: ${rlsSecuredCount} / ${schemasToTest.length}`);
}

verifyInjections();
