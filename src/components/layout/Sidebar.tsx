import { useNavigate, useLocation } from "react-router-dom";
import { Home, Video, Trophy, Bell, Settings, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  const menuItems = [
    { icon: Home, path: "/dashboard", label: "Dashboard" },
    { icon: Video, path: "/projects", label: "Projetos" },
    { icon: Trophy, path: "/achievements", label: "Conquistas" },
    { icon: Bell, path: "/notifications", label: "Notificações" },
  ];

  return (
    <aside className="w-20 bg-card border-r border-border flex flex-col items-center py-6 space-y-8">
      {menuItems.map((item) => (
        <Button
          key={item.path}
          variant="ghost"
          size="icon"
          onClick={() => navigate(item.path)}
          className={`p-3 rounded-lg transition-colors ${
            location.pathname === item.path
              ? "bg-primary text-primary-foreground"
              : "hover:bg-sidebar-accent"
          }`}
        >
          <item.icon className="h-6 w-6" />
        </Button>
      ))}
      
      <div className="flex-1" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/settings")}
        className="p-3 hover:bg-sidebar-accent rounded-lg transition-colors"
      >
        <Settings className="h-6 w-6 text-muted-foreground" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        className="p-3 hover:bg-destructive/10 rounded-lg transition-colors"
      >
        <LogOut className="h-6 w-6 text-muted-foreground" />
      </Button>
    </aside>
  );
};

export default Sidebar;
