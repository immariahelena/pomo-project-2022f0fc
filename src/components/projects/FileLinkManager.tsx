import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link, Trash2, ExternalLink } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { z } from "zod";

interface FileLinkManagerProps {
  projectId: string;
}

interface FileLink {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

const linkSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  url: z.string().trim().url("URL inválida").max(2048, "URL muito longa"),
});

export const FileLinkManager = ({ projectId }: FileLinkManagerProps) => {
  const { toast } = useToast();
  const [links, setLinks] = useState<FileLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [projectId]);

  const fetchLinks = async () => {
    try {
      // Query the files table for links (we'll store links with a special prefix in storage_path)
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .eq("project_id", projectId)
        .like("storage_path", "link:%")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLinks = data?.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.storage_path.replace("link:", ""),
        created_at: file.created_at,
      })) || [];

      setLinks(formattedLinks);
    } catch (error: any) {
      console.error("Erro ao carregar links:", error);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const validation = linkSchema.safeParse({ name: linkName, url: linkUrl });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Erro de validação",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Store link as a file entry with special storage_path prefix
      const { error } = await supabase.from("files").insert({
        project_id: projectId,
        name: validation.data.name,
        storage_path: `link:${validation.data.url}`,
        mime_type: "text/uri-list",
        size: validation.data.url.length,
        uploaded_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Link adicionado com sucesso!",
        description: "O link foi salvo no projeto.",
      });

      setLinkName("");
      setLinkUrl("");
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (linkId: string) => {
    setLinkToDelete(linkId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!linkToDelete) return;

    try {
      const { error } = await supabase
        .from("files")
        .delete()
        .eq("id", linkToDelete);

      if (error) throw error;

      toast({
        title: "Link removido com sucesso!",
      });

      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Erro ao remover link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAddLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkName">Nome do Link</Label>
              <Input
                id="linkName"
                placeholder="Ex: Drive do Cliente, Pasta de Referências..."
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Link className="h-4 w-4 mr-2" />
              {loading ? "Adicionando..." : "Adicionar Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Links Salvos ({links.length})</h3>
        {links.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Link className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum link adicionado ainda
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Adicione links para Google Drive, Dropbox, ou qualquer outra URL
              </p>
            </CardContent>
          </Card>
        ) : (
          links.map((link) => (
            <Card key={link.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{link.name}</h4>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {link.url}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este link? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
