import type { User } from "npm:@supabase/supabase-js@2.97.0";
import {
  ensureAnyPermission,
  type RequestContext,
  requireRequestContext,
  sanitizeEmail,
  sanitizeOptionalId,
  sanitizeRedirectUrl,
  sanitizeText,
} from "../_shared/supabase.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from "../_shared/http.ts";

type ProvisionMode = "invite" | "create";

interface ProvisionUserRequest {
  email: string;
  fullName?: string | null;
  tipoDocumento?: string | null;
  numeroDocumento?: string | null;
  genero?: string | null;
  volunteerId?: string | null;
  mode?: ProvisionMode;
  temporaryPassword?: string | null;
  redirectTo?: string | null;
}

interface VolunteerRow {
  id: string;
  tenant_id: string;
  iam_user_id: string | null;
  numero_documento: string;
  tipo_documento: string | null;
  genero: string | null;
  nombre: string;
  apellido: string;
  email: string | null;
}

interface ProfileRow {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  genero: string | null;
}

async function findUserByEmail(
  context: RequestContext,
  email: string
): Promise<User | null> {
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await context.adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new HttpError(500, "No se pudo listar auth.users.", error);
    }

    const match =
      data.users.find((candidate) => candidate.email?.toLowerCase() === email) ??
      null;
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function loadVolunteer(
  context: RequestContext,
  volunteerId: string | null
): Promise<VolunteerRow | null> {
  if (!volunteerId) {
    return null;
  }

  const { data, error } = await context.adminClient
    .schema("ong")
    .from("voluntarios")
    .select(
      "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, nombre, apellido, email"
    )
    .eq("tenant_id", context.tenantId)
    .eq("id", volunteerId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "No se pudo cargar el voluntario a vincular.", error);
  }

  if (!data) {
    throw new HttpError(404, "El voluntario seleccionado no existe en el tenant actual.");
  }

  return data as VolunteerRow;
}

async function loadProfile(
  context: RequestContext,
  userId: string
): Promise<ProfileRow | null> {
  const { data, error } = await context.adminClient
    .schema("public")
    .from("profiles")
    .select("id, tenant_id, full_name, tipo_documento, numero_documento, genero")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "No se pudo cargar public.profiles.", error);
  }

  return (data as ProfileRow | null) ?? null;
}

function resolveFullName(
  requestFullName: string,
  volunteer: VolunteerRow | null,
  profile: ProfileRow | null
): string | null {
  const volunteerName = volunteer
    ? `${volunteer.nombre} ${volunteer.apellido}`.trim()
    : "";

  return (
    requestFullName ||
    volunteerName ||
    sanitizeText(profile?.full_name ?? null, 180) ||
    null
  );
}

async function createOrInviteUser(
  context: RequestContext,
  email: string,
  mode: ProvisionMode,
  temporaryPassword: string | null,
  redirectTo: string | null,
  fullName: string | null,
  tipoDocumento: string | null,
  numeroDocumento: string | null,
  genero: string | null
): Promise<{ user: User; created: boolean; invited: boolean; existingUser: boolean }> {
  const existingUser = await findUserByEmail(context, email);
  if (existingUser) {
    return {
      user: existingUser,
      created: false,
      invited: false,
      existingUser: true,
    };
  }

  const userMetadata = {
    full_name: fullName,
    tipo_documento: tipoDocumento,
    numero_documento: numeroDocumento,
    genero,
  };

  if (mode === "create") {
    if (!temporaryPassword || temporaryPassword.length < 8) {
      throw new HttpError(
        400,
        "La contrasena temporal debe tener al menos 8 caracteres cuando el modo es create."
      );
    }

    const { data, error } = await context.adminClient.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error || !data.user) {
      throw new HttpError(500, "No se pudo crear auth.users.", error);
    }

    return {
      user: data.user,
      created: true,
      invited: false,
      existingUser: false,
    };
  }

  const { data, error } = await context.adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: userMetadata,
      redirectTo: redirectTo ?? undefined,
    }
  );

  if (error || !data.user) {
    throw new HttpError(500, "No se pudo invitar auth.users.", error);
  }

  return {
    user: data.user,
    created: false,
    invited: true,
    existingUser: false,
  };
}

async function syncProfile(
  context: RequestContext,
  userId: string,
  fullName: string | null,
  tipoDocumento: string | null,
  numeroDocumento: string | null,
  genero: string | null
): Promise<boolean> {
  const existingProfile = await loadProfile(context, userId);

  if (existingProfile?.tenant_id && existingProfile.tenant_id !== context.tenantId) {
    throw new HttpError(
      409,
      "El auth.user ya esta vinculado a otro tenant en public.profiles."
    );
  }

  const { error } = await context.adminClient
    .schema("public")
    .from("profiles")
    .upsert(
      {
        id: userId,
        tenant_id: context.tenantId,
        full_name: fullName ?? existingProfile?.full_name ?? null,
        tipo_documento: tipoDocumento ?? existingProfile?.tipo_documento ?? null,
        numero_documento: numeroDocumento ?? existingProfile?.numero_documento ?? null,
        genero: genero ?? existingProfile?.genero ?? null,
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new HttpError(500, "No se pudo sincronizar public.profiles.", error);
  }

  return true;
}

async function linkVolunteer(
  context: RequestContext,
  volunteer: VolunteerRow | null,
  userId: string
): Promise<boolean> {
  if (!volunteer) {
    return false;
  }

  if (volunteer.iam_user_id && volunteer.iam_user_id !== userId) {
    throw new HttpError(
      409,
      "El voluntario ya esta vinculado a otro auth.user."
    );
  }

  const { error } = await context.adminClient
    .schema("ong")
    .from("voluntarios")
    .update({
      iam_user_id: userId,
      updated_at: new Date().toISOString(),
      updated_by: context.user.id,
    })
    .eq("tenant_id", context.tenantId)
    .eq("id", volunteer.id);

  if (error) {
    throw new HttpError(500, "No se pudo vincular ong.voluntarios.iam_user_id.", error);
  }

  return true;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Metodo no permitido.");
    }

    const context = await requireRequestContext(request);
    await ensureAnyPermission(context.authedClient, ["settings.users.manage"]);

    const body = await parseJsonBody<ProvisionUserRequest>(request);
    const email = sanitizeEmail(body.email);
    const mode: ProvisionMode = body.mode === "create" ? "create" : "invite";
    const volunteerId = sanitizeOptionalId(body.volunteerId ?? null);
    const redirectTo = sanitizeRedirectUrl(body.redirectTo ?? null);
    const temporaryPassword = sanitizeText(body.temporaryPassword ?? null, 128) || null;

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new HttpError(400, "Debes enviar un correo valido.");
    }

    const volunteer = await loadVolunteer(context, volunteerId);
    const requestedFullName = sanitizeText(body.fullName ?? null, 180);
    const requestedTipoDocumento =
      sanitizeText(body.tipoDocumento ?? null, 10) || null;
    const requestedNumeroDocumento =
      sanitizeText(body.numeroDocumento ?? null, 50) || null;
    const requestedGenero = sanitizeText(body.genero ?? null, 10) || null;

    const provisionalProfile = volunteer
      ? {
          fullName: requestedFullName || `${volunteer.nombre} ${volunteer.apellido}`.trim(),
          tipoDocumento: requestedTipoDocumento ?? volunteer.tipo_documento,
          numeroDocumento: requestedNumeroDocumento ?? volunteer.numero_documento,
          genero: requestedGenero ?? volunteer.genero,
        }
      : {
          fullName: requestedFullName,
          tipoDocumento: requestedTipoDocumento,
          numeroDocumento: requestedNumeroDocumento,
          genero: requestedGenero,
        };

    const createdOrInvited = await createOrInviteUser(
      context,
      email,
      mode,
      temporaryPassword,
      redirectTo,
      provisionalProfile.fullName || null,
      provisionalProfile.tipoDocumento ?? null,
      provisionalProfile.numeroDocumento ?? null,
      provisionalProfile.genero ?? null
    );

    const profile = await loadProfile(context, createdOrInvited.user.id);
    const profileFullName = resolveFullName(
      provisionalProfile.fullName,
      volunteer,
      profile
    );

    await syncProfile(
      context,
      createdOrInvited.user.id,
      profileFullName,
      provisionalProfile.tipoDocumento ?? null,
      provisionalProfile.numeroDocumento ?? null,
      provisionalProfile.genero ?? null
    );

    const volunteerLinked = await linkVolunteer(
      context,
      volunteer,
      createdOrInvited.user.id
    );

    return jsonResponse({
      userId: createdOrInvited.user.id,
      email,
      mode,
      created: createdOrInvited.created,
      invited: createdOrInvited.invited,
      existingUser: createdOrInvited.existingUser,
      profileSynced: true,
      volunteerLinked,
      tenantId: context.tenantId,
    });
  } catch (error) {
    return errorResponse(error, "No se pudo provisionar el usuario.");
  }
});
