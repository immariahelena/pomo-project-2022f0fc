-- Update RLS policies to allow collaborators to create projects
DROP POLICY IF EXISTS "Managers and admins can create projects" ON public.projects;

CREATE POLICY "Authenticated users can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the update policy to allow project creators to update their own projects
DROP POLICY IF EXISTS "Managers and admins can update projects" ON public.projects;

CREATE POLICY "Project creators and managers can update projects" 
ON public.projects 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);