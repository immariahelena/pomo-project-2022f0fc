import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Loader2 } from "lucide-react";

interface ActivityLogProps {
  projectId: string;
}

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

const getActionLabel = (action: string, entityType: string) => {
  const actionMap: Record<string, string> = {
    INSERT: "criou",
    UPDATE: "atualizou",
    DELETE: "excluiu",
  };

  const entityMap: Record<string, string> = {
    projects: "o projeto",
    tasks: "uma tarefa",
    project_stages: "uma etapa",
  };

  return `${actionMap[action] || action} ${entityMap[entityType] || entityType}`;
};

export const ActivityLog = ({ projectId }: ActivityLogProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          id,
          action,
          entity_type,
          created_at,
          user_id
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch profile data separately for each activity
      const activitiesWithProfiles = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", activity.user_id)
              .single();
            
            return { ...activity, profiles: profile };
          }
          return { ...activity, profiles: null };
        })
      );

      setActivities(activitiesWithProfiles);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Histórico de Atividades
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        ) : activities.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma atividade registrada ainda
          </p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-0">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">
                      {activity.profiles?.full_name || "Usuário"}
                    </span>{" "}
                    {getActionLabel(activity.action, activity.entity_type)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
