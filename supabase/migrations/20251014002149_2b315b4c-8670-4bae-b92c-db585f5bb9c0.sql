-- Fix the log_activity trigger function to handle projects table correctly
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

  INSERT INTO public.activity_logs (
    user_id,
    project_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    auth.uid(),
    -- For projects table, use the project's own ID, otherwise use project_id from the row
    CASE 
      WHEN TG_TABLE_NAME = 'projects' THEN COALESCE(NEW.id, OLD.id)
      ELSE COALESCE(NEW.project_id, OLD.project_id)
    END,
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

-- Remove existing trigger on projects if it exists
DROP TRIGGER IF EXISTS log_project_changes ON public.projects;

-- Create trigger for projects table
CREATE TRIGGER log_project_changes
AFTER INSERT OR UPDATE OR DELETE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.log_activity();