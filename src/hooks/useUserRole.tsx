import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "manager" | "collaborator" | "client";

export const useUserRole = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("useUserRole: Nenhum usuário autenticado");
        setLoading(false);
        return;
      }

      console.log("useUserRole: Buscando roles para usuário:", user.id);
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      console.log("useUserRole: Roles encontradas:", data);
      setRoles(data?.map(r => r.role as UserRole) || []);
    } catch (error) {
      console.error("useUserRole: Erro ao buscar roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: UserRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isManager = hasRole("manager");
  const canManageProjects = isAdmin || isManager;

  console.log("useUserRole: isAdmin =", isAdmin, "roles =", roles);

  return {
    roles,
    loading,
    hasRole,
    isAdmin,
    isManager,
    canManageProjects,
  };
};
