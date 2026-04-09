-- Reset auth.users triggers to known-good definitions.
-- This removes stale/custom trigger bindings that may reference `profiles`
-- without schema qualification and break admin user creation.

DO $$
DECLARE
  trigger_name TEXT;
BEGIN
  FOR trigger_name IN
    SELECT tgname
    FROM pg_trigger
    WHERE tgrelid = 'auth.users'::regclass
      AND NOT tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trigger_name);
  END LOOP;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER sync_profile_login_status_on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_login_status_from_auth_user();

CREATE TRIGGER sync_profile_login_status_on_auth_user_update
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.sync_profile_login_status_from_auth_user();
