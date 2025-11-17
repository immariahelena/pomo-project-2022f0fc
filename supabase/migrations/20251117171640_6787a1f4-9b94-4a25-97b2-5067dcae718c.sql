-- Drop the insecure policy that allows everyone to view all projects
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;

-- Create secure policy: users can only view their own projects
CREATE POLICY "Users can view own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Create policy: admins and managers can view all projects
CREATE POLICY "Admins and managers can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Update the UPDATE policy to be more restrictive
DROP POLICY IF EXISTS "Project creators and managers can update projects" ON public.projects;

CREATE POLICY "Users can update own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins and managers can update all projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Update the DELETE policy to be more restrictive
DROP POLICY IF EXISTS "Project creators, managers and admins can delete projects" ON public.projects;

CREATE POLICY "Users can delete own projects"
ON public.projects
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Admins and managers can delete all projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Ensure created_by column is not nullable and has proper default
ALTER TABLE public.projects 
ALTER COLUMN created_by SET NOT NULL,
ALTER COLUMN created_by SET DEFAULT auth.uid();