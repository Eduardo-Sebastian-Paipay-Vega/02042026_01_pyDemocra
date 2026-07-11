import { supabase } from "../../../supabaseClient";

const DEFAULT_PRIVATE_UPLOAD_BUCKET =
  (import.meta.env.VITE_ONG_EVIDENCE_BUCKET ?? "evidence").trim();
const DEFAULT_DOCUMENTS_BUCKET = (
  import.meta.env.VITE_ONG_REGISTRATION_DOCUMENTS_BUCKET ??
  import.meta.env.VITE_ONG_EVIDENCE_BUCKET ??
  "evidence"
).trim();

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export interface StorageUploadRequest {
  bucket: string;
  file: File;
  pathSegments: string[];
  publicBucket?: boolean;
  tenantScoped?: boolean;
  upsert?: boolean;
  allowedMimeTypes?: readonly string[];
  maxSizeBytes?: number;
}

export interface StorageUploadResult {
  bucket: string;
  path: string;
  route: string;
  publicUrl: string | null;
  fileName: string;
}

export function getStoragePublicUrl(bucket: string, path: string | null | undefined) {
  const normalizedBucket = bucket.trim();
  const normalizedPath = String(path ?? "").trim();

  if (!normalizedBucket || !normalizedPath) {
    return null;
  }

  return (
    supabase.storage.from(normalizedBucket).getPublicUrl(normalizedPath).data.publicUrl || null
  );
}

function sanitizePathSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);

  return normalized || fallback;
}

function sanitizeFileName(value: string): string {
  const lastDotIndex = value.lastIndexOf(".");
  const rawBaseName = lastDotIndex > 0 ? value.slice(0, lastDotIndex) : value;
  const rawExtension = lastDotIndex > 0 ? value.slice(lastDotIndex + 1) : "";
  const baseName = sanitizePathSegment(rawBaseName, "archivo");
  const extension = sanitizePathSegment(rawExtension, "");
  return extension ? `${baseName}.${extension}` : baseName;
}

async function resolveCurrentTenantFolder(): Promise<string> {
  const { data, error } = await supabase.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(`No se pudo resolver el tenant actual para Storage: ${error.message}`);
  }

  const tenantId = typeof data === "string" ? data.trim() : "";
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual para Storage.");
  }

  return tenantId;
}

function assertAllowedFile(
  file: File,
  allowedMimeTypes: readonly string[] | undefined,
  maxSizeBytes: number | undefined
): void {
  if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido: "${file.type || "desconocido"}". Tipos permitidos: ${allowedMimeTypes.join(", ")}.`
    );
  }
  if (maxSizeBytes && file.size > maxSizeBytes) {
    throw new Error(
      `El archivo supera el tamaño máximo permitido (${Math.round(maxSizeBytes / (1024 * 1024))} MB).`
    );
  }
}

export async function uploadFileToStorage(
  request: StorageUploadRequest
): Promise<StorageUploadResult> {
  const bucket = request.bucket.trim();
  if (!bucket) {
    throw new Error("No hay bucket configurado para subir archivos.");
  }

  assertAllowedFile(request.file, request.allowedMimeTypes, request.maxSizeBytes);

  const fileName = sanitizeFileName(request.file.name || "archivo");
  const timestampPrefix = new Date().toISOString().replace(/[:.]/g, "-");
  const pathSegments = request.pathSegments
    .map((segment, index) => sanitizePathSegment(segment, `segment-${index + 1}`))
    .filter(Boolean);

  if (!pathSegments.length) {
    throw new Error("La ruta de Storage requiere al menos un segmento.");
  }

  const tenantPrefix = request.tenantScoped ? [await resolveCurrentTenantFolder()] : [];
  const path = [...tenantPrefix, ...pathSegments, `${timestampPrefix}-${fileName}`].join("/");

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, request.file, {
    upsert: request.upsert ?? false,
    contentType: request.file.type || undefined,
  });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const publicUrl = request.publicBucket
    ? supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl || null
    : null;

  return {
    bucket,
    path,
    route: publicUrl ?? `${bucket}/${path}`,
    publicUrl,
    fileName,
  };
}

export function getPeoplePhotoUploadBucket() {
  return {
    bucket: "avatars",
    publicBucket: true,
    tenantScoped: true,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: MAX_IMAGE_BYTES,
  } as const;
}

export function getVolunteerDocumentsUploadBucket() {
  return {
    bucket: DEFAULT_DOCUMENTS_BUCKET,
    publicBucket: false,
    tenantScoped: true,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxSizeBytes: MAX_DOCUMENT_BYTES,
  } as const;
}

export function getAdmissionDocumentsUploadBucket() {
  return {
    bucket: DEFAULT_DOCUMENTS_BUCKET,
    publicBucket: false,
    tenantScoped: true,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxSizeBytes: MAX_DOCUMENT_BYTES,
  } as const;
}

export function getAdmissionOnboardingEvidenceBucket() {
  return {
    bucket: DEFAULT_PRIVATE_UPLOAD_BUCKET,
    publicBucket: false,
    tenantScoped: true,
    allowedMimeTypes: DOCUMENT_MIME_TYPES,
    maxSizeBytes: MAX_DOCUMENT_BYTES,
  } as const;
}

export function getAssetsUploadBucket() {
  return {
    bucket: "avatars",
    publicBucket: true,
    tenantScoped: true,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    maxSizeBytes: MAX_IMAGE_BYTES,
  } as const;
}
