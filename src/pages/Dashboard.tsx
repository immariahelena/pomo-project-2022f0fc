import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Home,
  Video,
  Trophy,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Mock data - será substituído por dados reais do banco
  const stats = {
    total: 15,
    finalizados: 8,
    emProcessamento: 12,
    atrasados: 5,
  };

  const recentProjects = [
    {
      id: 1,
      name: "Comercial Coca-Cola",
      status: "Em Produção",
      statusColor: "warning",
    },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 space-y-8">
        <button className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors">
          <Home className="h-6 w-6 text-muted-foreground" />
        </button>
        <button className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors">
          <Video className="h-6 w-6 text-muted-foreground" />
        </button>
        <button className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors">
          <Trophy className="h-6 w-6 text-muted-foreground" />
        </button>
        <button className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </button>
        <div className="flex-1" />
        <button className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors">
          <Settings className="h-6 w-6 text-muted-foreground" />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
              {user?.user_metadata?.full_name?.[0] || user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">
                Olá, {user?.user_metadata?.full_name || "Usuário"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

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
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge
                        variant="secondary"
                        className="bg-warning text-warning-foreground"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
