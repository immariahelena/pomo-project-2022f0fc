import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ProjectCard from "@/components/projects/ProjectCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    finalizados: 0,
    emProcessamento: 0,
    atrasados: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchDashboardData();
  }, [navigate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  };

  const fetchDashboardData = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      setProjects(projectsData || []);

      // Calculate stats
      const { data: allProjects } = await supabase
        .from("projects")
        .select("status");

      if (allProjects) {
        setStats({
          total: allProjects.length,
          finalizados: allProjects.filter((p) => p.status === "completed").length,
          emProcessamento: allProjects.filter((p) => 
            p.status === "in_production" || p.status === "in_review"
          ).length,
          atrasados: allProjects.filter((p) => p.status === "delayed").length,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header />

        {/* Dashboard Content */}
        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Projetos */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projetos</CardTitle>
                <BarChart3 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            {/* Finalizados */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.finalizados}</div>
              </CardContent>
            </Card>

            {/* Em Processamento */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Em Processamento</CardTitle>
                <Clock className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.emProcessamento}</div>
              </CardContent>
            </Card>

            {/* Atrasados */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
                <AlertCircle className="h-5 w-5 text-error" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.atrasados}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum projeto cadastrado ainda
                </p>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      clientName={project.client_name}
                      status={project.status}
                      dueDate={project.due_date}
                      description={project.description}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
