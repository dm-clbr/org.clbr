-- Fix auth signup trigger lookup for profiles table.
-- Supabase Auth executes the trigger in a role/search_path context where
-- unqualified `profiles` may not resolve to `public.profiles`.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, job_title, start_date)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', 'Employee'),
    COALESCE((NEW.raw_user_meta_data->>'start_date')::date, CURRENT_DATE)
  );

  RETURN NEW;
END;
$$;
