import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
}

const Header = ({ onSearch, onFilter }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);
      }
    };
    fetchUserData();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
          {profile?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div>
          <p className="text-sm font-medium">
            Olá, {profile?.full_name || "Usuário"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 w-64"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        {onFilter && (
          <Button variant="ghost" size="icon" onClick={onFilter}>
            <Filter className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
