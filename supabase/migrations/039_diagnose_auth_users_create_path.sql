-- Diagnostic migration: emits notices about auth.users triggers and related functions.
-- Safe no-op for data/schema shape (notice-only).

DO $$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE NOTICE 'DIAG public.profiles: MISSING';
  ELSE
    RAISE NOTICE 'DIAG public.profiles: PRESENT';
  END IF;

  RAISE NOTICE 'DIAG auth.users triggers (non-internal):';
  FOR r IN
    SELECT
      t.tgname,
      pg_get_triggerdef(t.oid, true) AS trigger_def
    FROM pg_trigger t
    WHERE t.tgrelid = 'auth.users'::regclass
      AND NOT t.tgisinternal
    ORDER BY t.tgname
  LOOP
    RAISE NOTICE 'DIAG trigger % => %', r.tgname, r.trigger_def;
  END LOOP;

  RAISE NOTICE 'DIAG handle/sync function defs:';
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS function_def
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname IN ('handle_new_user', 'sync_profile_login_status_from_auth_user')
    ORDER BY n.nspname, p.proname
  LOOP
    RAISE NOTICE 'DIAG function %.% => %', r.schema_name, r.function_name, r.function_def;
  END LOOP;
END;
$$;
