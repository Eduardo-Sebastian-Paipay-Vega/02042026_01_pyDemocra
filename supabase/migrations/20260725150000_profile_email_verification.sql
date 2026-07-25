alter table if exists public.profiles
  add column if not exists email_verified boolean not null default false,
  add column if not exists verify_token_hash text,
  add column if not exists verify_token_expires_at timestamptz;

-- Cuentas ya existentes no deben quedar bloqueadas retroactivamente por esta
-- nueva verificación: solo las cuentas creadas después de este cambio
-- arrancan en email_verified = false.
update public.profiles set email_verified = true where email_verified = false;
