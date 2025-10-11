import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCardProps {
  id: string;
  name: string;
  clientName?: string;
  status: string;
  dueDate?: string;
  description?: string;
}

const statusColors = {
  planning: { bg: "bg-secondary", text: "text-secondary-foreground", label: "Planejamento" },
  in_production: { bg: "bg-warning", text: "text-warning-foreground", label: "Em Produção" },
  in_review: { bg: "bg-primary", text: "text-primary-foreground", label: "Em Revisão" },
  completed: { bg: "bg-success", text: "text-success-foreground", label: "Finalizado" },
  delayed: { bg: "bg-error", text: "text-error-foreground", label: "Atrasado" },
};

const ProjectCard = ({ id, name, clientName, status, dueDate, description }: ProjectCardProps) => {
  const navigate = useNavigate();
  const statusInfo = statusColors[status as keyof typeof statusColors] || statusColors.planning;

  return (
    <Card
      className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary"
      onClick={() => navigate(`/projects/${id}`)}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-lg">{name}</h3>
          <Badge className={`${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {clientName && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{clientName}</span>
            </div>
          )}
          {dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(dueDate), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ProjectCard;
