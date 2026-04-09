-- Ensure extension-provided UUID helpers are reachable in public schema.
-- Some Supabase projects install extension functions under `extensions`,
-- while older migrations call uuid_generate_v4()/gen_random_uuid() directly.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF to_regprocedure('public.uuid_generate_v4()') IS NULL
     AND to_regprocedure('extensions.uuid_generate_v4()') IS NOT NULL THEN
    EXECUTE
      'CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid ' ||
      'LANGUAGE sql VOLATILE AS ''SELECT extensions.uuid_generate_v4();''';
  END IF;

  IF to_regprocedure('public.gen_random_uuid()') IS NULL
     AND to_regprocedure('extensions.gen_random_uuid()') IS NOT NULL THEN
    EXECUTE
      'CREATE FUNCTION public.gen_random_uuid() RETURNS uuid ' ||
      'LANGUAGE sql VOLATILE AS ''SELECT extensions.gen_random_uuid();''';
  END IF;
END;
$$;
