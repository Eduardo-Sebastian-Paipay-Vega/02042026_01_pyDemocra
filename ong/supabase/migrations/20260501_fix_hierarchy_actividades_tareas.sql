-- Migration: Correct project hierarchy
-- Before: tareas.id_proyecto (task → project), actividades.id_tarea (activity → task)
--         Chain: Proyecto → Tarea → Actividad
-- After:  actividades.id_proyecto (activity → project), tareas.id_actividad (task → activity)
--         Chain: Proyecto → Actividad → Tarea

BEGIN;

-- Step 1: Add new FK columns (nullable to allow safe data migration)
ALTER TABLE ong.actividades
  ADD COLUMN IF NOT EXISTS id_proyecto UUID REFERENCES ong.proyectos(id) ON DELETE CASCADE;

ALTER TABLE ong.tareas
  ADD COLUMN IF NOT EXISTS id_actividad UUID REFERENCES ong.actividades(id) ON DELETE SET NULL;

-- Step 2: Backfill actividades.id_proyecto from the old chain (actividad → tarea → proyecto)
UPDATE ong.actividades a
SET    id_proyecto = t.id_proyecto
FROM   ong.tareas t
WHERE  a.id_tarea    = t.id
  AND  a.id_proyecto IS NULL;

-- Step 3: tareas.id_actividad cannot be automatically backfilled.
--         Previously tasks were PARENTS of activities, not children.
--         Existing tasks will have id_actividad = NULL until reassigned via the application UI.
--         A future migration can enforce NOT NULL after all tasks are reassigned.

-- Step 4: Drop old FK columns
ALTER TABLE ong.actividades DROP COLUMN IF EXISTS id_tarea;
ALTER TABLE ong.tareas      DROP COLUMN IF EXISTS id_proyecto;

-- Step 5: Performance indexes
CREATE INDEX IF NOT EXISTS idx_actividades_id_proyecto ON ong.actividades(id_proyecto);
CREATE INDEX IF NOT EXISTS idx_tareas_id_actividad     ON ong.tareas(id_actividad);

COMMIT;
