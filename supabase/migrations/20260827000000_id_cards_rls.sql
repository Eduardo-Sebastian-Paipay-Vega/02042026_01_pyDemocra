-- Add RLS policies for ID Card modules that were created in Parte 4 but lacked policies

DO $$
BEGIN
    -- id_card_templates
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'ong' AND tablename = 'id_card_templates') THEN
        DROP POLICY IF EXISTS p_id_card_templates_select ON ong.id_card_templates;
        CREATE POLICY p_id_card_templates_select ON ong.id_card_templates FOR SELECT TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_templates_insert ON ong.id_card_templates;
        CREATE POLICY p_id_card_templates_insert ON ong.id_card_templates FOR INSERT TO authenticated WITH CHECK (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_templates_update ON ong.id_card_templates;
        CREATE POLICY p_id_card_templates_update ON ong.id_card_templates FOR UPDATE TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_templates_delete ON ong.id_card_templates;
        CREATE POLICY p_id_card_templates_delete ON ong.id_card_templates FOR DELETE TO authenticated USING (tenant_id = public.fn_current_tenant_id());
    END IF;

    -- id_card_template_fields
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'ong' AND tablename = 'id_card_template_fields') THEN
        DROP POLICY IF EXISTS p_id_card_template_fields_select ON ong.id_card_template_fields;
        CREATE POLICY p_id_card_template_fields_select ON ong.id_card_template_fields FOR SELECT TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_template_fields_insert ON ong.id_card_template_fields;
        CREATE POLICY p_id_card_template_fields_insert ON ong.id_card_template_fields FOR INSERT TO authenticated WITH CHECK (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_template_fields_update ON ong.id_card_template_fields;
        CREATE POLICY p_id_card_template_fields_update ON ong.id_card_template_fields FOR UPDATE TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_card_template_fields_delete ON ong.id_card_template_fields;
        CREATE POLICY p_id_card_template_fields_delete ON ong.id_card_template_fields FOR DELETE TO authenticated USING (tenant_id = public.fn_current_tenant_id());
    END IF;

    -- id_cards
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'ong' AND tablename = 'id_cards') THEN
        DROP POLICY IF EXISTS p_id_cards_select ON ong.id_cards;
        CREATE POLICY p_id_cards_select ON ong.id_cards FOR SELECT TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_cards_insert ON ong.id_cards;
        CREATE POLICY p_id_cards_insert ON ong.id_cards FOR INSERT TO authenticated WITH CHECK (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_cards_update ON ong.id_cards;
        CREATE POLICY p_id_cards_update ON ong.id_cards FOR UPDATE TO authenticated USING (tenant_id = public.fn_current_tenant_id());

        DROP POLICY IF EXISTS p_id_cards_delete ON ong.id_cards;
        CREATE POLICY p_id_cards_delete ON ong.id_cards FOR DELETE TO authenticated USING (tenant_id = public.fn_current_tenant_id());
    END IF;
END $$;
