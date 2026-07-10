import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import {
  getPeoplePhotoUploadBucket,
  uploadFileToStorage,
} from "../shared/storage";

export type MyProfileRow = Pick<
  AppDatabase["public"]["Tables"]["profiles"]["Row"],
  "id" | "tenant_id" | "full_name" | "avatar_url" | "genero" | "tipo_documento" | "numero_documento"
>;

export async function getMyProfile(): Promise<MyProfileRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "No hay sesión activa.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, full_name, avatar_url, genero, tipo_documento, numero_documento")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as MyProfileRow;
}

// Permitido por la policy RLS "profiles_self_update" / "p_profiles_update"
// (auth.uid() = id): un usuario puede actualizar su propia fila de
// public.profiles directamente, sin necesitar una función RPC dedicada.
export async function updateMyFullName(fullName: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "No hay sesión activa.");
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    throw new Error("El nombre no puede estar vacío.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }
}

// Sube el archivo al bucket "avatars" (mismo bucket ya usado para fotos de
// voluntarios/beneficiarios, ver services/personas/form-adapters.ts) y
// persiste la URL pública vía fn_update_my_avatar, la función que el propio
// esquema de producción expone para este fin.
export async function updateMyAvatar(file: File): Promise<string> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "No hay sesión activa.");
  }

  const upload = await uploadFileToStorage({
    ...getPeoplePhotoUploadBucket(),
    file,
    pathSegments: ["profiles", userData.user.id],
    upsert: true,
  });

  if (!upload.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la foto de perfil.");
  }

  const { error } = await supabase.rpc("fn_update_my_avatar", {
    p_url: upload.publicUrl,
  });

  if (error) {
    throw new Error(error.message);
  }

  return upload.publicUrl;
}
