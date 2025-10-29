-- Update delete policy to allow project creators and managers to delete projects
DROP POLICY IF EXISTS "Only admins can delete projects" ON projects;

CREATE POLICY "Project creators, managers and admins can delete projects"
ON projects
FOR DELETE
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);