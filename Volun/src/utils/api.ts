import { projectId } from './supabase/info';

type MaybeString = string | undefined | null;

function normalizeUrl(value: MaybeString): string {
  return String(value || '').trim().replace(/\/+$/, '');
}

function normalizeSupabaseUrl(value: MaybeString): string {
  const raw = normalizeUrl(value);
  if (!raw) return '';
  try {
    // If someone sets VITE_SUPABASE_URL with a path, keep only the origin.
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

// Single source of truth for calling the Edge Function router.
// Prefer VITE_SUPABASE_URL (e.g. https://<project>.supabase.co). Fallback to projectId when env isn't set.
const SUPABASE_URL =
  normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL) ||
  (projectId ? `https://${projectId}.supabase.co` : '');

export const API_BASE_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/make-server-7052c263`
  : '';
