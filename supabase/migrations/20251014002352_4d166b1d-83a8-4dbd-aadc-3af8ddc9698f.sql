-- Remove the trigger from projects table to fix the immediate error
DROP TRIGGER IF EXISTS log_project_changes ON public.projects;

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Skip logging for projects table for now
  IF TG_TABLE_NAME = 'projects' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  INSERT INTO public.activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    COALESCE(NEW.project_id, OLD.project_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;