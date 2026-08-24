
-- Supabase native session access for the current user
CREATE OR REPLACE FUNCTION public.get_my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal auth.aal_level,
  not_after timestamptz,
  user_agent text,
  ip text
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, s.created_at, s.updated_at, s.factor_id, s.aal, s.not_after, s.user_agent, s.ip
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_my_session(p_session_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.sessions 
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- API Tokens Table
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL,
  prefix text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE(user_id, name)
);

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tokens"
  ON public.api_tokens
  FOR ALL
  USING (auth.uid() = user_id);
