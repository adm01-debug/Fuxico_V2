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

interface CreateTrackingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateTrackingDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  trigger
}: CreateTrackingDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  
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

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Novo Rastreamento
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent role="dialog" aria-labelledby="dialog-title" className="sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto">
        {!result ? (
          <form role="form" aria-label="Formulário de novo rastreamento" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle id="dialog-title" className="text-lg sm:text-xl">Criar Novo Rastreamento</DialogTitle>
              <DialogDescription className="text-sm">
                Gere um pixel de rastreamento para monitorar aberturas de email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email do Destinatário *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="destinatario@email.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">Assunto do Email</Label>
                <Input
                  id="subject"
                  placeholder="Assunto do email"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="links" className="text-sm font-medium">Links para Rastrear</Label>
                <p className="text-xs text-muted-foreground">Um link por linha</p>
                <Textarea
                  id="links"
                  placeholder="https://exemplo.com/pagina1&#10;https://exemplo.com/pagina2"
                  value={links}
                  onChange={(e) => setLinks(e.target.value)}
                  rows={3}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="w-full sm:w-auto h-11">
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto h-11">
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Rastreamento
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle id="dialog-title" className="text-lg sm:text-xl">Rastreamento Criado!</DialogTitle>
              <DialogDescription className="text-sm">
                Use o código HTML abaixo no corpo do seu email.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tracking ID</Label>
                <div className="flex gap-2">
                  <Input value={result.trackingId} readOnly className="font-mono text-xs sm:text-sm h-11" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.trackingId, "id")}
                    className="h-11 w-11 shrink-0"
                  >
                    {copied === "id" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Pixel HTML</Label>
                <p className="text-xs text-muted-foreground">Cole no corpo do email</p>
                <div className="flex gap-2">
                  <Textarea 
                    value={result.pixelHtml} 
                    readOnly 
                    className="font-mono text-xs min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(result.pixelHtml, "html")}
                    className="h-11 w-11 shrink-0 self-start"
                  >
                    {copied === "html" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {result.wrappedLinks.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Links Rastreados</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {result.wrappedLinks.map((link) => (
                      <div key={link.linkId} className="flex gap-2 items-center">
                        <Input 
                          value={link.wrapped} 
                          readOnly 
                          className="font-mono text-xs flex-1 h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopy(link.wrapped, link.linkId)}
                          className="h-10 w-10 shrink-0"
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
              <Button onClick={handleClose} className="w-full sm:w-auto h-11">Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
