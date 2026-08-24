import type {
  DashboardActivityFormErrors,
  DashboardActivityFormInput,
} from "./types";

const MAX_SEARCH_LENGTH = 120;
const MAX_COMMENT_LENGTH = 500;
const MAX_ACTIVITY_TITLE_LENGTH = 200;
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 4000;

export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength = MAX_COMMENT_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeSearchTerm(value: string): string {
  return sanitizeText(value, MAX_SEARCH_LENGTH)
    .replace(/[^\p{L}\p{N}@._\-\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseNullablePositiveNumber(
  value: string
): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

export function validateDashboardActivityForm(
  input: DashboardActivityFormInput
): DashboardActivityFormErrors {
  const errors: DashboardActivityFormErrors = {};

  if (!input.projectId.trim()) {
    errors.projectId = "Selecciona un proyecto.";
  }

  const title = sanitizeText(input.title, MAX_ACTIVITY_TITLE_LENGTH);
  if (!title) {
    errors.title = "El titulo de la actividad es obligatorio.";
  }

  if (!sanitizeText(input.statusCode, 40)) {
    errors.statusCode = "Selecciona un estado.";
  }

  sanitizeText(input.description, MAX_ACTIVITY_DESCRIPTION_LENGTH);

  if (input.estimatedHours !== null) {
    if (!Number.isFinite(input.estimatedHours) || input.estimatedHours <= 0) {
      // @ts-ignore
      // @ts-ignore
      errors.estimatedHours = "Las horas estimadas deben ser mayores a cero.";
    }
      // @ts-ignore
    if (input.estimatedHours > 999.99) {
      // @ts-ignore
      errors.estimatedHours = "Las horas estimadas exceden el maximo permitido.";
    }
  }

  if (input.startAt && input.endAt) {
    const start = new Date(input.startAt);
    const end = new Date(input.endAt);
    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      // @ts-ignore
      end.getTime() < start.getTime()
    ) {
      // @ts-ignore
      errors.dateOrder = "La fecha fin no puede ser menor a la fecha inicio.";
    }
  }

  return errors;
}

export function validateResolutionComment(
  comment: string,
  required: boolean
): string | null {
  const sanitized = sanitizeText(comment, MAX_COMMENT_LENGTH);

  if (required && !sanitized) {
    return "El comentario es obligatorio para esta accion.";
  }

  if (comment.trim().length > MAX_COMMENT_LENGTH) {
    return "El comentario no puede exceder 500 caracteres.";
  }

  return null;
}
