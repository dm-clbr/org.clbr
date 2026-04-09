-- Diagnostic migration: print all auth.users triggers (including internal)
-- and all function definitions that reference "profiles".

DO $$
DECLARE
  trg RECORD;
  fn RECORD;
BEGIN
  RAISE NOTICE 'DIAG ALL auth.users triggers:';
  FOR trg IN
    SELECT
      t.tgname,
      t.tgisinternal,
      pg_get_triggerdef(t.oid, true) AS trigger_def
    FROM pg_trigger t
    WHERE t.tgrelid = 'auth.users'::regclass
    ORDER BY t.tgisinternal DESC, t.tgname
  LOOP
    RAISE NOTICE 'DIAG trigger name=% internal=% def=%', trg.tgname, trg.tgisinternal, trg.trigger_def;
  END LOOP;

  RAISE NOTICE 'DIAG functions referencing "profiles":';
  FOR fn IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      p.oid AS function_oid,
      pg_get_functiondef(p.oid) AS function_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.prokind = 'f'
      AND pg_get_functiondef(p.oid) ILIKE '%profiles%'
    ORDER BY n.nspname, p.proname
  LOOP
    RAISE NOTICE 'DIAG function %.% oid=% => %', fn.schema_name, fn.function_name, fn.function_oid, fn.function_def;
  END LOOP;
END;
$$;
