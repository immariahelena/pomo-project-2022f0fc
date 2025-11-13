import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";

const ticketSchema = z.object({
  subject: z.string().trim().min(5, "Assunto deve ter pelo menos 5 caracteres").max(200, "Assunto muito longo"),
  message: z.string().trim().min(20, "Mensagem deve ter pelo menos 20 caracteres").max(2000, "Mensagem muito longa"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
}

const Support = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    priority: "medium",
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setCurrentUser(user);
      await fetchTickets(user.id);
    };
    checkUser();
  }, [navigate]);

  const fetchTickets = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar tickets:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus tickets",
        variant: "destructive",
      });
    } else {
      setTickets(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = ticketSchema.safeParse(formData);
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: currentUser.id,
        subject: formData.subject,
        message: formData.message,
        priority: formData.priority,
      });

    if (error) {
      console.error("Erro ao criar ticket:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ticket criado!",
        description: "Sua solicitação foi enviada. Entraremos em contato em breve.",
      });
      setFormData({ subject: "", message: "", priority: "medium" });
      await fetchTickets(currentUser.id);
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Central de Suporte</h1>
              <p className="text-muted-foreground">
                Precisa de ajuda? Abra um ticket e nossa equipe responderá em breve.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Abrir Novo Ticket</CardTitle>
                <CardDescription>
                  Descreva seu problema ou solicitação detalhadamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Assunto *</Label>
                    <Input
                      id="subject"
                      placeholder="Ex: Problema ao fazer login"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Descrição *</Label>
                    <Textarea
                      id="message"
                      placeholder="Descreva seu problema ou solicitação em detalhes..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg">
                    Enviar Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4">Meus Tickets</h2>
              {loading ? (
                <p className="text-muted-foreground">Carregando tickets...</p>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Você ainda não tem tickets de suporte
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
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
                          <span>
                            Atualizado: {new Date(ticket.updated_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {ticket.admin_notes && (
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Resposta do Administrador:</p>
                            <p className="text-sm">{ticket.admin_notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Support;
