-- Fix profile audit trigger when updates happen without an authenticated JWT subject
-- (e.g., auth service creating/updating users). In those cases auth.uid() is NULL.

CREATE OR REPLACE FUNCTION public.log_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_by UUID := auth.uid();
BEGIN
  -- Auth service and some system paths may run without a request JWT.
  -- Use the target profile id as actor fallback so audit row remains valid.
  IF v_changed_by IS NULL THEN
    v_changed_by := COALESCE(NEW.id, OLD.id);
  END IF;

  -- If we still cannot resolve an actor, skip audit insertion safely.
  IF v_changed_by IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.audit_logs (action, profile_id, changed_by, changes)
  VALUES (
    'profile_updated',
    NEW.id,
    v_changed_by,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  RETURN NEW;
END;
$$;
