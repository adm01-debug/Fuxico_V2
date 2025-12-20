import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTracking, CreateTrackingRequest, CreateTrackingResponse } from "@/lib/tracking-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useCreateReminder } from "@/hooks/use-follow-up-reminders";

export function CreateTrackingDialog() {
  const [open, setOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [links, setLinks] = useState("");
  const [result, setResult] = useState<CreateTrackingResponse | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { preferences } = useUserPreferences();
  const createReminder = useCreateReminder();

  const mutation = useMutation({
    mutationFn: createTracking,
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['tracked-emails'] });
      
      // Auto-create reminder if enabled in preferences
      if (preferences?.auto_reminder_enabled && preferences?.auto_reminder_days) {
        createReminder.mutate({
          trackingId: data.trackingId,
          reminderDays: preferences.auto_reminder_days,
        });
      }
      
      toast({
        title: "Rastreamento criado!",
        description: preferences?.auto_reminder_enabled 
          ? `Pixel gerado e lembrete de ${preferences.auto_reminder_days} dias criado.`
          : "O pixel de rastreamento foi gerado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o rastreamento.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data: CreateTrackingRequest = {
      recipientEmail,
      subject: subject || undefined,
      links: links ? links.split('\n').filter(l => l.trim()) : undefined,
    };
    
    mutation.mutate(data);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setRecipientEmail("");
    setSubject("");
    setLinks("");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Rastreamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {!result ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Criar Novo Rastreamento</DialogTitle>
              <DialogDescription>
                Gere um pixel de rastreamento para monitorar aberturas de email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email do Destinatário *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="destinatario@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  placeholder="Assunto do email"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="links">Links para Rastrear (um por linha)</Label>
                <Textarea
                  id="links"
                  placeholder="https://exemplo.com/pagina1&#10;https://exemplo.com/pagina2"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Rastreamento
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Rastreamento Criado!</DialogTitle>
              <DialogDescription>
                Use o código HTML abaixo no corpo do seu email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tracking ID</Label>
                <div className="flex gap-2">
                  <Input value={result.trackingId} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.trackingId, "id")}
                  >
                    {copied === "id" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Pixel HTML (cole no email)</Label>
                <div className="flex gap-2">
                  <Textarea 
                    value={result.pixelHtml} 
                    readOnly 
                    className="font-mono text-xs"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.pixelHtml, "html")}
                  >
                    {copied === "html" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {result.wrappedLinks.length > 0 && (
                <div className="space-y-2">
                  <Label>Links Rastreados</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.wrappedLinks.map((link) => (
                      <div key={link.linkId} className="flex gap-2 items-center">
                        <Input 
                          value={link.wrapped} 
                          readOnly 
                          className="font-mono text-xs flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(link.wrapped, link.linkId)}
                        >
                          {copied === link.linkId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
