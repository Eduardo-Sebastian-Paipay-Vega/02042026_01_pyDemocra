// @ts-nocheck
import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import {
  getPeoplePhotoUploadBucket,
  uploadFileToStorage,
} from "../shared/storage";

export type MyProfileRow = Pick<
  AppDatabase["public"]["Tables"]["profiles"]["Row"],
  "id" | "tenant_id" | "full_name"
> & {
  avatar_url?: string | null;
  genero?: string | null;
  tipo_documento?: string | null;
  numero_documento?: string | null;
};

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
// public.profiles directamente, sin necesitar una funciÃ³n RPC dedicada.
export async function updateMyFullName(fullName: string): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "No hay sesión activa.");
  }

  const trimmed = fullName.trim();
  if (!trimmed) {
    throw new Error("El nombre no puede estar vacÃ­o.");
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
// persiste la URL pÃºblica vÃ­a fn_update_my_avatar, la funciÃ³n que el propio
// esquema de producciÃ³n expone para este fin.
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
    throw new Error("No se pudo obtener la URL pÃºblica de la foto de perfil.");
  }

  const { error } = await supabase.rpc("fn_update_my_avatar", {
    p_url: upload.publicUrl,
  });

  if (error) {
    throw new Error(error.message);
  }

  return upload.publicUrl;
}

export async function updateMyProfileDetails(input: {
  full_name?: string;
  tipo_documento?: string;
  numero_documento?: string;
  genero?: string;
}): Promise<void> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error(userError?.message ?? "No hay sesión activa.");
  }

  const payload: Record<string, any> = {};
  if (input.full_name !== undefined) payload.full_name = input.full_name.trim();
  if (input.tipo_documento !== undefined) payload.tipo_documento = input.tipo_documento.trim();
  if (input.numero_documento !== undefined) payload.numero_documento = input.numero_documento.trim();
  if (input.genero !== undefined) payload.genero = input.genero.trim();

  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", userData.user.id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateMyPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateMyUserMetadata(metadata: Record<string, any>): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: metadata });
  if (error) {
    throw new Error(error.message);
  }
}

export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: "others" });
  if (error) {
    throw new Error(error.message);
  }
}

