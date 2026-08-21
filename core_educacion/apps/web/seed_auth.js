import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here';

if (!SUPABASE_URL || SUPABASE_URL === 'URL_AQUI') {
  console.error("Por favor, reemplaza SUPABASE_URL y SUPABASE_SERVICE_KEY en seed_auth.js antes de ejecutar");
  process.exit(1);
}

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const eduardoId = '725bbea5-af39-4232-b2b2-c28120e6a6b7'; // ID exacto inyectado en core.usuarios
const email = 'eduardo@democra.edu';
const password = 'PasswordSegura2026!'; // Contraseña temporal

async function seedAuth() {
  console.log(`Intentando crear usuario en auth.users para ${email}...`);
  
  const { data, error } = await adminSupabase.auth.admin.createUser({
    id: eduardoId,
    email: email,
    password: password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ El usuario ya existe en Supabase Auth.');
    } else {
      console.error('❌ Error creando el usuario:', error);
    }
  } else {
    console.log('🎉 Usuario creado con éxito en Supabase Auth!');
    console.log(`ID: ${data.user.id}`);
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
  }
}

seedAuth();
