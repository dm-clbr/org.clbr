-- Diagnostic migration: inspect configured auth hooks and function definitions.
-- Safe notice-only migration.

DO $$
DECLARE
  hook_row RECORD;
  fn_row RECORD;
BEGIN
  IF to_regclass('auth.hooks') IS NULL THEN
    RAISE NOTICE 'DIAG auth.hooks table: MISSING';
    RETURN;
  END IF;

  RAISE NOTICE 'DIAG auth.hooks rows:';
  FOR hook_row IN
    SELECT
      h.id,
      h.hook_table_id,
      h.hook_name,
      h.created_at,
      h.updated_at,
      p.pronamespace::regnamespace::text AS function_schema,
      p.proname AS function_name,
      p.oid AS function_oid
    FROM auth.hooks h
    LEFT JOIN pg_proc p ON p.oid = h.hook_fn
    ORDER BY h.hook_name
  LOOP
    RAISE NOTICE
      'DIAG hook id=% name=% table_id=% fn=%.% oid=% created_at=% updated_at=%',
      hook_row.id,
      hook_row.hook_name,
      hook_row.hook_table_id,
      COALESCE(hook_row.function_schema, '<null>'),
      COALESCE(hook_row.function_name, '<null>'),
      COALESCE(hook_row.function_oid::text, '<null>'),
      hook_row.created_at,
      hook_row.updated_at;
  END LOOP;

  RAISE NOTICE 'DIAG hook function defs:';
  FOR fn_row IN
    SELECT DISTINCT
      p.oid,
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS function_def
    FROM auth.hooks h
    JOIN pg_proc p ON p.oid = h.hook_fn
    JOIN pg_namespace n ON n.oid = p.pronamespace
    ORDER BY n.nspname, p.proname
  LOOP
    RAISE NOTICE 'DIAG hook function %.% => %', fn_row.schema_name, fn_row.function_name, fn_row.function_def;
  END LOOP;
END;
$$;
