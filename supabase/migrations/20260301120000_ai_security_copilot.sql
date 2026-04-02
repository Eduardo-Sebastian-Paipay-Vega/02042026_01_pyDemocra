-- AI Security + Onboarding Copilot - delta minimo
-- Fecha: 2026-03-01

create extension if not exists "pgcrypto";

alter table if exists public.profiles
  add column if not exists pin_failed_attempts int not null default 0,
  add column if not exists pin_last_failed_at timestamptz,
  add column if not exists pin_blocked_until timestamptz,
  add column if not exists risk_blocked_until timestamptz;

create table if not exists public.mfa_challenges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email_otp', 'app_otp', 'sms_otp')),
  code_hash text not null,
  expires_at timestamptz not null,
  verified_at timestamptz,
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH')),
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_mfa_challenges_tenant_user
  on public.mfa_challenges (tenant_id, user_id, created_at desc);

create index if not exists idx_mfa_challenges_active
  on public.mfa_challenges (tenant_id, user_id, expires_at)
  where verified_at is null;

alter table public.mfa_challenges enable row level security;

drop policy if exists p_mfa_challenges_select on public.mfa_challenges;
create policy p_mfa_challenges_select
on public.mfa_challenges
for select
using (
  tenant_id = public.fn_current_tenant_id()
  and user_id = auth.uid()
);

drop policy if exists p_mfa_challenges_no_insert on public.mfa_challenges;
create policy p_mfa_challenges_no_insert
on public.mfa_challenges
for insert
with check (false);

drop policy if exists p_mfa_challenges_no_update on public.mfa_challenges;
create policy p_mfa_challenges_no_update
on public.mfa_challenges
for update
using (false)
with check (false);

drop policy if exists p_mfa_challenges_no_delete on public.mfa_challenges;
create policy p_mfa_challenges_no_delete
on public.mfa_challenges
for delete
using (false);