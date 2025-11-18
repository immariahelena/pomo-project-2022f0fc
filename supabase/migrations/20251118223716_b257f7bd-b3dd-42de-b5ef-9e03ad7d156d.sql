-- Create a function to notify admins when a new ticket is created
CREATE OR REPLACE FUNCTION public.notify_admins_new_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert a notification for each admin user
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    ur.user_id,
    'Novo Ticket de Suporte',
    'Um novo ticket foi criado: ' || NEW.subject,
    'support',
    '/admin-support'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically notify admins on new ticket
DROP TRIGGER IF EXISTS on_ticket_created ON public.support_tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_ticket();

-- Enable realtime for support_tickets table
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;