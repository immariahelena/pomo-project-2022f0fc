import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, User, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileUpload } from "@/components/projects/FileUpload";
import { FileLinkManager } from "@/components/projects/FileLinkManager";
import { ActivityLog } from "@/components/projects/ActivityLog";

const statusColors = {
  planning: { bg: "bg-secondary", text: "text-secondary-foreground", label: "Planejamento" },
  in_production: { bg: "bg-warning", text: "text-warning-foreground", label: "Em Produção" },
  in_review: { bg: "bg-primary", text: "text-primary-foreground", label: "Em Revisão" },
  completed: { bg: "bg-success", text: "text-success-foreground", label: "Finalizado" },
  delayed: { bg: "bg-error", text: "text-error-foreground", label: "Atrasado" },
};

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchProjectDetails();
    fetchStages();
    fetchTasks();
    fetchMessages();

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`project-${id}-messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `project_id=eq.${id}`,
        },
        (payload) => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setCurrentUser(session.user);
  };

  const fetchProjectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar projeto",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from("project_stages")
        .select("*")
        .eq("project_id", id)
        .order("order_index");

      if (error) throw error;
      setStages(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar etapas:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, profiles:assigned_to(full_name)")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        throw error;
      }
      
      console.log("Mensagens carregadas:", data);
      setMessages(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar mensagens:", error);
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { data: newMessageData, error } = await supabase
        .from("messages")
        .insert({
          project_id: id,
          user_id: currentUser.id,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Adiciona a mensagem imediatamente à lista local
      if (newMessageData) {
        setMessages((prev) => [newMessageData, ...prev]);
      }

      // Create notification
      await supabase.from("notifications").insert({
        user_id: currentUser.id,
        title: "Nova atualização no projeto",
        message: `Nova comunicação adicionada ao projeto: ${project.name}`,
        type: "info",
        link: `/projects/${id}`,
      });

      toast({
        title: "Atualização adicionada",
        description: "Comunicação registrada no projeto",
      });
    } catch (error: any) {
      setNewMessage(messageContent);
      toast({
        title: "Erro ao adicionar atualização",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Projeto não encontrado</p>
          <Button onClick={() => navigate("/projects")}>Voltar</Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusColors[project.status as keyof typeof statusColors];

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header />

        <div className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <Badge className={`${statusInfo.bg} ${statusInfo.text}`}>
                  {statusInfo.label}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-2">{project.description}</p>
              )}
            </div>
          </div>

          {/* Project Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {project.client_name || "Não informado"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Início
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {project.start_date
                    ? format(new Date(project.start_date), "dd/MM/yyyy", { locale: ptBR })
                    : "Não definida"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {project.due_date
                    ? format(new Date(project.due_date), "dd/MM/yyyy", { locale: ptBR })
                    : "Não definida"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas ({tasks.length})</TabsTrigger>
              <TabsTrigger value="stages">Etapas ({stages.length})</TabsTrigger>
              <TabsTrigger value="files">Arquivos</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              <TabsTrigger value="activity">Atividades</TabsTrigger>
              <TabsTrigger value="communication">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comunicação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground">
                      {project.description || "Sem descrição"}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Estatísticas</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{tasks.length}</p>
                        <p className="text-sm text-muted-foreground">Tarefas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stages.length}</p>
                        <p className="text-sm text-muted-foreground">Etapas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{messages.length}</p>
                        <p className="text-sm text-muted-foreground">Mensagens</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {tasks.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma tarefa criada ainda</p>
                  </CardContent>
                </Card>
              ) : (
                tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{task.title}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {task.description}
                            </p>
                          )}
                          {task.profiles && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Atribuído a: {task.profiles.full_name}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">{task.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="stages" className="space-y-4">
              {stages.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground">Nenhuma etapa criada ainda</p>
                  </CardContent>
                </Card>
              ) : (
                stages.map((stage) => (
                  <Card key={stage.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{stage.name}</h3>
                          {stage.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {stage.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="secondary">{stage.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="files">
              <FileUpload projectId={id!} />
            </TabsContent>

            <TabsContent value="links">
              <FileLinkManager projectId={id!} />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLog projectId={id!} />
            </TabsContent>

            <TabsContent value="communication">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>Atualizações e Comunicações</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma atualização ainda. Adicione a primeira comunicação!
                      </p>
                    ) : (
                      messages.map((message) => (
                        <Card key={message.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm flex-1">{message.content}</p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {format(new Date(message.created_at), "dd/MM/yy HH:mm", {
                                  locale: ptBR,
                                })}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Adicione uma atualização sobre o projeto..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={2}
                    />
                    <Button onClick={handleSendMessage} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProjectDetails;
