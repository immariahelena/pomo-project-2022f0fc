import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, Star, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Achievements = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    tasksCompleted: 0,
    filesUploaded: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchAchievements();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch projects stats
      const { data: projects } = await supabase
        .from("projects")
        .select("status");

      // Fetch tasks stats
      const { data: tasks } = await supabase
        .from("tasks")
        .select("status")
        .eq("assigned_to", user.id);

      // Fetch files stats
      const { data: files } = await supabase
        .from("files")
        .select("id")
        .eq("uploaded_by", user.id);

      setStats({
        totalProjects: projects?.length || 0,
        completedProjects: projects?.filter((p) => p.status === "completed").length || 0,
        tasksCompleted: tasks?.filter((t) => t.status === "done").length || 0,
        filesUploaded: files?.length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar conquistas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    {
      id: 1,
      title: "Primeiro Projeto",
      description: "Complete seu primeiro projeto",
      icon: Trophy,
      unlocked: stats.completedProjects > 0,
      progress: Math.min(stats.completedProjects, 1),
      target: 1,
    },
    {
      id: 2,
      title: "Veterano",
      description: "Complete 10 projetos",
      icon: Award,
      unlocked: stats.completedProjects >= 10,
      progress: Math.min(stats.completedProjects, 10),
      target: 10,
    },
    {
      id: 3,
      title: "Produtivo",
      description: "Complete 50 tarefas",
      icon: Target,
      unlocked: stats.tasksCompleted >= 50,
      progress: Math.min(stats.tasksCompleted, 50),
      target: 50,
    },
    {
      id: 4,
      title: "Organizador",
      description: "Faça upload de 100 arquivos",
      icon: Star,
      unlocked: stats.filesUploaded >= 100,
      progress: Math.min(stats.filesUploaded, 100),
      target: 100,
    },
  ];

  const filteredAchievements = achievements.filter(
    (achievement) =>
      achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Header onSearch={setSearchQuery} />

        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Conquistas</h1>
            <p className="text-muted-foreground">
              Acompanhe seu progresso e desbloqueie conquistas
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                <Trophy className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Projetos Completos</CardTitle>
                <Award className="h-5 w-5 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completedProjects}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tarefas Completas</CardTitle>
                <Target className="h-5 w-5 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.tasksCompleted}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Arquivos Enviados</CardTitle>
                <Star className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.filesUploaded}</div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAchievements.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-muted-foreground">
                  Nenhuma conquista encontrada com esse termo
                </p>
              </div>
            ) : (
              filteredAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={achievement.unlocked ? "border-primary/50" : "opacity-60"}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        achievement.unlocked
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <achievement.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        {achievement.title}
                        {achievement.unlocked && (
                          <span className="text-primary">✓</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">
                            {achievement.progress} / {achievement.target}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${(achievement.progress / achievement.target) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Achievements;
