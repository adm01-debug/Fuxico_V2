import { log } from '@/lib/logger';
import { useState } from "react";
import { useAuth } from '@/hooks/use-auth';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, Plus, Loader2 } from "lucide-react";

export function LinkCreateDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !user) return;

    // Validate URL
    let validUrl = url.trim();
    if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
      validUrl = `https://${validUrl}`;
    }

    try {
      new URL(validUrl);
    } catch {
      toast({
        title: "Erro",
        description: "URL inválida",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const linkId = crypto.randomUUID().slice(0, 8);

      const { error } = await supabase
        .from("standalone_tracked_links")
        .insert({
          user_id: user.id,
          link_id: linkId,
          original_url: validUrl,
          title: title.trim() || null,
          description: description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Link criado com sucesso",
      });

      setUrl("");
      setTitle("");
      setDescription("");
      setOpen(false);

      queryClient.invalidateQueries({ queryKey: ["tracked-links"] });

    } catch (error) {
      log.error("Error creating link:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Criar Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Link Rastreável</DialogTitle>
          <DialogDescription>
            Crie um link para rastrear cliques
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div role="region" aria-label="Criação de Links" className="space-y-2">
            <Label htmlFor="url">URL de Destino *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/pagina"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título (opcional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meu link promocional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Campanha de marketing Q1"
            />
          </div>

          <Button type="submit" disabled={!url || isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Link2 className="mr-2 h-4 w-4" />
                Criar Link
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
