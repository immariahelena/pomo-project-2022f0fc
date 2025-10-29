import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProjectCardProps {
  id: string;
  name: string;
  clientName?: string;
  status: string;
  dueDate?: string;
  description?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const statusColors = {
  planning: { bg: "bg-secondary", text: "text-secondary-foreground", label: "Planejamento" },
  in_production: { bg: "bg-warning", text: "text-warning-foreground", label: "Em Produção" },
  in_review: { bg: "bg-primary", text: "text-primary-foreground", label: "Em Revisão" },
  completed: { bg: "bg-success", text: "text-success-foreground", label: "Finalizado" },
  delayed: { bg: "bg-error", text: "text-error-foreground", label: "Atrasado" },
};

const ProjectCard = ({ id, name, clientName, status, dueDate, description, onEdit, onDelete }: ProjectCardProps) => {
  const navigate = useNavigate();
  const statusInfo = statusColors[status as keyof typeof statusColors] || statusColors.planning;

  const handleCardClick = () => {
    navigate(`/projects/${id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  return (
    <Card
      className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-primary"
      onClick={handleCardClick}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg flex-1">{name}</h3>
          <div className="flex items-center gap-2">
            <Badge className={`${statusInfo.bg} ${statusInfo.text}`}>
              {statusInfo.label}
            </Badge>
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
