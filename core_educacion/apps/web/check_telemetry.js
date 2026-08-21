import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here'; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTelemetry() {
  const { data, error } = await supabase.schema('telemetria').from('estadisticas_uso').select('*');
  if (error) console.error(error);
  else console.log('📊 TELEMETRÍA AUTOMÁTICA CAPTURADA:\n', JSON.stringify(data, null, 2));
}

verifyTelemetry();
