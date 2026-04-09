-- Preserve manager/department assignment from invite metadata during auth signup.
-- This keeps manager-created invites within manager scope immediately.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id UUID := NULL;
  v_department_id UUID := NULL;
BEGIN
  IF NULLIF(NEW.raw_user_meta_data->>'manager_id', '') IS NOT NULL THEN
    BEGIN
      v_manager_id := (NEW.raw_user_meta_data->>'manager_id')::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_manager_id := NULL;
    END;
  END IF;

  IF NULLIF(NEW.raw_user_meta_data->>'department_id', '') IS NOT NULL THEN
    BEGIN
      v_department_id := (NEW.raw_user_meta_data->>'department_id')::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_department_id := NULL;
    END;
  END IF;

  IF v_manager_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v_manager_id) THEN
    v_manager_id := NULL;
  END IF;

  IF v_department_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.departments d WHERE d.id = v_department_id) THEN
    v_department_id := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, job_title, start_date, manager_id, department_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', 'Employee'),
    COALESCE((NEW.raw_user_meta_data->>'start_date')::date, CURRENT_DATE),
    v_manager_id,
    v_department_id
  );

  RETURN NEW;
END;
$$;
