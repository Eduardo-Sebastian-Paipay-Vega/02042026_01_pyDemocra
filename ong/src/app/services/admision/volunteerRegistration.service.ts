import { supabase } from "../../../supabaseClient";
import type {
  AdmissionPublicRegistrationCatalogs,
  AdmissionPublicRegistrationCodePreview,
  AdmissionPublicVolunteerRegistrationInput,
  AdmissionPublicVolunteerRegistrationResult,
} from "../../modules/admission/types";

type CatalogRow = {
  codigo: string;
  nombre: string;
};

type PreviewFunctionResponse = {
  tenantId: string;
  codeId: string;
  code: string;
  status: string;
  expiresAt: string;
  expiresAtLabel: string;
  usesLabel: string;
  requestId: string | null;
  volunteerId: string | null;
  linkedVolunteerName: string | null;
  targetEmail: string | null;
  targetDocumentNumber: string | null;
  targetFullName: string;
  email: string | null;
  documentNumber: string | null;
  documentType: string | null;
  firstName: string;
  lastName: string;
  genderCode: string | null;
  countryCode: string | null;
  birthDate: string | null;
  phone: string | null;
  notes: string | null;
  emailLocked: boolean;
  documentLocked: boolean;
  canConsume: boolean;
  warning: string | null;
};

type ConsumeFunctionResponse = {
  tenantId: string;
  codeId: string;
  code: string;
  email: string;
  userId: string;
  volunteerId: string;
  requestId: string | null;
  existingUser: boolean;
  profileSynced: boolean;
  volunteerLinked: boolean;
  requestLinked: boolean;
  documentsRegistered: number;
  codeStatus: string;
  usesLabel: string;
};

const DEFAULT_TEXT_MAX_LENGTH = 500;

const REGISTRATION_DOCUMENTS_BUCKET = (
  import.meta.env.VITE_ONG_REGISTRATION_DOCUMENTS_BUCKET ??
  import.meta.env.VITE_ONG_EVIDENCE_BUCKET ??
  ""
).trim();

function publicSchema() {
  return supabase.schema("public");
}

function sanitizeText(
  value: string | null | undefined,
  maxLength = DEFAULT_TEXT_MAX_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

function sanitizeEmail(value: string | null | undefined): string {
  return sanitizeText(value, 255).toLowerCase();
}

function sanitizeFileName(value: string | null | undefined): string {
  const cleaned = sanitizeText(value, 120)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "archivo";
}

function isRouteValueValid(value: string | null | undefined): boolean {
  const cleaned = sanitizeText(value, 2000);
  if (!cleaned) {
    return false;
  }

  return /^(https?:\/\/\S+|[a-zA-Z0-9._-]+\/.+)$/.test(cleaned);
}

async function readFunctionErrorPayload(
  context: Response
): Promise<{ message: string | null; status: number }> {
  const status = context.status;

  try {
    const payload = (await context.clone().json()) as {
      error?: string;
      message?: string;
      code?: string;
    };

    return {
      status,
      message:
        sanitizeText(payload?.error ?? payload?.message ?? payload?.code ?? null, 500) || null,
    };
  } catch {
    try {
      const payloadText = sanitizeText(await context.clone().text(), 500);
      return {
        status,
        message: payloadText || null,
      };
    } catch {
      return {
        status,
        message: null,
      };
    }
  }
}

async function resolveFunctionErrorMessage(functionName: string, error: unknown): Promise<string> {
  const baseMessage =
    error instanceof Error && error.message.trim()
      ? error.message
      : "No se pudo ejecutar el backend de registro.";

  const context =
    typeof error === "object" && error !== null && "context" in error
      ? (error as { context?: Response }).context
      : undefined;

  if (!context) {
    if (baseMessage.toLowerCase().includes("fetch")) {
      return `La Edge Function \`${functionName}\` no respondio. Verifica despliegue y conectividad.`;
    }
    return baseMessage;
  }

  const { status, message } = await readFunctionErrorPayload(context);

  if (status === 404) {
    return `La Edge Function \`${functionName}\` no esta desplegada en Supabase.`;
  }
  if (status === 409 && message) {
    return message;
  }
  if (status === 400 && message) {
    return message;
  }
  if (status === 403 && message) {
    return message;
  }

  return message ?? baseMessage;
}

async function invokeRegistrationFunction<TResult>(
  body: FormData | Record<string, unknown>
): Promise<TResult> {
  const { data, error } = await supabase.functions.invoke(
    "consume-volunteer-registration-code",
    {
      body,
    }
  );

  if (error) {
    throw new Error(
      await resolveFunctionErrorMessage("consume-volunteer-registration-code", error)
    );
  }

  return data as TResult;
}

function mapPreviewResponse(row: PreviewFunctionResponse): AdmissionPublicRegistrationCodePreview {
  return {
    tenantId: row.tenantId,
    codeId: row.codeId,
    code: row.code,
    status: row.status,
    expiresAt: row.expiresAt,
    expiresAtLabel: row.expiresAtLabel,
    usesLabel: row.usesLabel,
    requestId: row.requestId,
    volunteerId: row.volunteerId,
    linkedVolunteerName: row.linkedVolunteerName,
    targetEmail: row.targetEmail,
    targetDocumentNumber: row.targetDocumentNumber,
    targetFullName: row.targetFullName,
    email: row.email,
    documentNumber: row.documentNumber,
    documentType: row.documentType,
    firstName: row.firstName,
    lastName: row.lastName,
    genderCode: row.genderCode,
    countryCode: row.countryCode,
    birthDate: row.birthDate,
    phone: row.phone,
    notes: row.notes,
    emailLocked: row.emailLocked,
    documentLocked: row.documentLocked,
    canConsume: row.canConsume,
    warning: row.warning,
  };
}

function mapConsumeResponse(
  row: ConsumeFunctionResponse
): AdmissionPublicVolunteerRegistrationResult {
  return {
    tenantId: row.tenantId,
    codeId: row.codeId,
    code: row.code,
    email: row.email,
    userId: row.userId,
    volunteerId: row.volunteerId,
    requestId: row.requestId,
    existingUser: row.existingUser,
    profileSynced: row.profileSynced,
    volunteerLinked: row.volunteerLinked,
    requestLinked: row.requestLinked,
    documentsRegistered: row.documentsRegistered,
    codeStatus: row.codeStatus,
    usesLabel: row.usesLabel,
  };
}

export async function getVolunteerRegistrationCatalogs(): Promise<AdmissionPublicRegistrationCatalogs> {
  const [documentTypesResult, gendersResult, countriesResult] = await Promise.all([
    publicSchema().from("cat_tipos_documento").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
    publicSchema().from("cat_generos").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
    publicSchema().from("cat_paises").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
  ]);

  if (documentTypesResult.error) {
    throw new Error(documentTypesResult.error.message);
  }
  if (gendersResult.error) {
    throw new Error(gendersResult.error.message);
  }
  if (countriesResult.error) {
    throw new Error(countriesResult.error.message);
  }

  return {
    documentTypes: ((documentTypesResult.data ?? []) as CatalogRow[]).map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
    genders: ((gendersResult.data ?? []) as CatalogRow[]).map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
    countries: ((countriesResult.data ?? []) as CatalogRow[]).map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
  };
}

export async function previewVolunteerRegistrationCode(input: {
  code: string;
  tenantId?: string | null;
}): Promise<AdmissionPublicRegistrationCodePreview> {
  const code = sanitizeText(input.code, 64);
  const tenantId = sanitizeOptionalId(input.tenantId ?? null);

  if (!code) {
    throw new Error("Debes ingresar un codigo de registro.");
  }

  const response = await invokeRegistrationFunction<PreviewFunctionResponse>({
    mode: "preview",
    code,
    tenantId,
  });

  return mapPreviewResponse(response);
}

export async function consumeVolunteerRegistrationCode(
  input: AdmissionPublicVolunteerRegistrationInput
): Promise<AdmissionPublicVolunteerRegistrationResult> {
  const code = sanitizeText(input.code, 64);
  const email = sanitizeEmail(input.email);
  const password = sanitizeText(input.password, 128);
  const firstName = sanitizeText(input.firstName, 150);
  const lastName = sanitizeText(input.lastName, 150);
  const documentNumber = sanitizeText(input.documentNumber, 50);

  if (!code) {
    throw new Error("Debes ingresar un codigo valido.");
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("Debes ingresar un correo valido.");
  }
  if (password.length < 8) {
    throw new Error("La contrasena debe tener al menos 8 caracteres.");
  }
  if (!firstName || !lastName) {
    throw new Error("Nombres y apellidos son obligatorios.");
  }
  if (!documentNumber) {
    throw new Error("El numero de documento es obligatorio.");
  }

  const documents = input.documents
    .map((document) => ({
      type: sanitizeText(document.type, 50),
      manualUrl: sanitizeText(document.manualUrl ?? null, 2000) || null,
      file: document.file ?? null,
    }))
    .filter((document) => document.type || document.manualUrl || document.file);

  const seenDocuments = new Set<string>();
  for (const document of documents) {
    if (!document.type) {
      throw new Error("Cada documento del postulante debe indicar un tipo.");
    }
    if (!document.file && !document.manualUrl) {
      throw new Error("Cada documento debe adjuntar un archivo o registrar una URL manual.");
    }
    if (document.manualUrl && !isRouteValueValid(document.manualUrl)) {
      throw new Error("Se detecto una URL de documento invalida.");
    }
    const duplicateKey = `${document.type}::${document.manualUrl ?? document.file?.name ?? ""}`;
    if (seenDocuments.has(duplicateKey)) {
      throw new Error("No repitas documentos con el mismo tipo y archivo.");
    }
    seenDocuments.add(duplicateKey);
  }

  const formData = new FormData();
  const payloadDocuments = documents.map((document, index) => {
    const fileField = document.file ? `document-${index}` : null;
    if (document.file && fileField) {
      const safeFileName = sanitizeFileName(document.file.name);
      const fileToSend =
        safeFileName === document.file.name
          ? document.file
          : new File([document.file], safeFileName, { type: document.file.type });
      formData.append(fileField, fileToSend);
    }

    return {
      type: document.type,
      manualUrl: document.manualUrl,
      fileField,
    };
  });

  formData.append("mode", "consume");
  formData.append(
    "payload",
    JSON.stringify({
      code,
      tenantId: sanitizeOptionalId(input.tenantId ?? null),
      email,
      password,
      firstName,
      lastName,
      documentNumber,
      documentType: sanitizeText(input.documentType ?? null, 20) || null,
      genderCode: sanitizeText(input.genderCode ?? null, 20) || null,
      countryCode: sanitizeText(input.countryCode ?? null, 20) || null,
      birthDate: sanitizeText(input.birthDate ?? null, 30) || null,
      phone: sanitizeText(input.phone ?? null, 50) || null,
      notes: sanitizeText(input.notes ?? null, 500) || null,
      documents: payloadDocuments,
    })
  );

  const response = await invokeRegistrationFunction<ConsumeFunctionResponse>(formData);
  return mapConsumeResponse(response);
}

export function getVolunteerRegistrationDocumentsBucket(): string {
  return REGISTRATION_DOCUMENTS_BUCKET;
}
