-- Ensure auth user insert trigger is explicitly bound to public.handle_new_user.
-- This prevents schema-resolution drift from referencing a function in another schema.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
