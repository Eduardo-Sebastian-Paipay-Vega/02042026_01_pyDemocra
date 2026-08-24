
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_api_token(p_name text, p_tenant_id uuid)
RETURNS text
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_raw_token text;
  v_token_hash text;
  v_prefix text;
BEGIN
  -- Generate 32 bytes of secure random hex + democra prefix
  v_raw_token := 'dmc_' || encode(gen_random_bytes(24), 'hex');
  v_prefix := substring(v_raw_token from 1 for 8);
  v_token_hash := crypt(v_raw_token, gen_salt('bf'));

  INSERT INTO public.api_tokens (user_id, tenant_id, name, token_hash, prefix)
  VALUES (auth.uid(), p_tenant_id, p_name, v_token_hash, v_prefix);

  RETURN v_raw_token;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.delete_api_token(p_token_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.api_tokens 
  WHERE id = p_token_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;
