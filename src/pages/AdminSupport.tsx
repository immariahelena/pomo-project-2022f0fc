import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { MessageSquare, Clock, CheckCircle2, AlertCircle, User } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

interface TicketWithProfile extends Ticket {
  profiles?: {
    full_name: string;
  };
}

const AdminSupport = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [tickets, setTickets] = useState<TicketWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate("/dashboard");
      return;
    }
    if (isAdmin) {
      fetchTickets();
    }
  }, [isAdmin, roleLoading, navigate]);

  const fetchTickets = async () => {
    setLoading(true);
    
    // Fetch tickets
    const { data: ticketsData, error: ticketsError } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (ticketsError) {
      console.error("Erro ao carregar tickets:", ticketsError);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tickets",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profiles for user_ids
    const userIds = [...new Set(ticketsData.map(t => t.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", userIds);

    // Combine data
    const ticketsWithProfiles = ticketsData.map(ticket => ({
      ...ticket,
      profiles: profilesData?.find(p => p.id === ticket.user_id)
    }));

    setTickets(ticketsWithProfiles as TicketWithProfile[]);
    setLoading(false);
  };

  const handleOpenTicket = (ticket: TicketWithProfile) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || "");
    setNewStatus(ticket.status);
    setDialogOpen(true);
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;

    const updateData: any = {
      admin_notes: adminNotes,
      status: newStatus,
    };

    if (newStatus === "resolved" || newStatus === "closed") {
      updateData.resolved_at = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updateData.resolved_by = user.id;
      }
    }

    const { error } = await supabase
      .from("support_tickets")
      .update(updateData)
      .eq("id", selectedTicket.id);

    if (error) {
      console.error("Erro ao atualizar ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ticket",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ticket atualizado!",
        description: "As alterações foram salvas com sucesso",
      });
      setDialogOpen(false);
      await fetchTickets();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      open: { variant: "default", icon: MessageSquare, label: "Aberto" },
      in_progress: { variant: "secondary", icon: Clock, label: "Em Andamento" },
      resolved: { variant: "outline", icon: CheckCircle2, label: "Resolvido" },
      closed: { variant: "outline", icon: AlertCircle, label: "Fechado" },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
    const labels: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      urgent: "Urgente",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  if (roleLoading || loading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Gerenciar Tickets de Suporte</h1>
              <p className="text-muted-foreground">
                Atenda às solicitações dos usuários
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === "open").length}</p>
                    <p className="text-sm text-muted-foreground">Abertos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === "in_progress").length}</p>
                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tickets.filter(t => t.status === "resolved").length}</p>
                    <p className="text-sm text-muted-foreground">Resolvidos</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{tickets.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOpenTicket(ticket)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {ticket.profiles?.full_name || "Usuário"}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <CardDescription className="mt-2">
                          {ticket.message}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Criado em: {new Date(ticket.created_at).toLocaleDateString("pt-BR")}
                      </span>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleOpenTicket(ticket);
                      }}>
                        Responder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              Usuário: {selectedTicket?.profiles?.full_name || "Desconhecido"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Mensagem do usuário:</Label>
              <p className="mt-2 p-3 bg-muted rounded-lg text-sm">
                {selectedTicket?.message}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Resposta / Notas</Label>
              <Textarea
                id="admin-notes"
                placeholder="Digite sua resposta ou notas sobre este ticket..."
                rows={6}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTicket}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
