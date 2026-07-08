import {
  fetchOngVolunteerStates,
  fetchOngVolunteersPreview,
  ongClient,
} from "./lib/db/ong/client";

const supabaseUrl = import.meta.env.VITE_ONG_DB_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_ONG_DB_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Faltan las variables de entorno de Supabase. Verifica tu archivo .env"
  );
}

export const supabase = ongClient;

export { fetchOngVolunteersPreview, fetchOngVolunteerStates };
