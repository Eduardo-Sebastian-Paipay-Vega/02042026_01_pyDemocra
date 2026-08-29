BEGIN;

-- Se habilita el acceso mediante RLS para clinico.fichas_medicas
-- El esquema original no incluía esta política a pesar de asignar los GRANTS a authenticated.

CREATE POLICY p_clinico_fichas_medicas_tenant_all
  ON clinico.fichas_medicas
  FOR ALL
  TO authenticated
  USING (tenant_id = fn_current_tenant_id())
  WITH CHECK (tenant_id = fn_current_tenant_id());

-- Nos aseguramos que RLS esté activo
ALTER TABLE clinico.fichas_medicas ENABLE ROW LEVEL SECURITY;

COMMIT;
