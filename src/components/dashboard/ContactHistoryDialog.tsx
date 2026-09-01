import { memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContactHistory, ContactHistoryItem } from "@/hooks/use-contact-history";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Eye, MousePointer, AlertTriangle, Loader2, ExternalLink } from "lucide-react";

interface ContactHistoryDialogProps {
  email: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getEventIcon(type: ContactHistoryItem['type']) {
  switch (type) {
    case 'email_sent':
      return <Mail className="h-4 w-4" />;
    case 'email_open':
      return <Eye className="h-4 w-4" />;
    case 'link_click':
      return <MousePointer className="h-4 w-4" />;
    case 'bounce':
      return <AlertTriangle className="h-4 w-4" />;
  }
}

function getEventColor(type: ContactHistoryItem['type']) {
  switch (type) {
    case 'email_sent':
      return 'bg-blue-500';
    case 'email_open':
      return 'bg-green-500';
    case 'link_click':
      return 'bg-purple-500';
    case 'bounce':
      return 'bg-destructive';
  }
}

function getEventLabel(type: ContactHistoryItem['type']) {
  switch (type) {
    case 'email_sent':
      return 'Email Enviado';
    case 'email_open':
      return 'Abertura';
    case 'link_click':
      return 'Clique';
    case 'bounce':
      return 'Bounce';
  }
}

function getEventBadgeVariant(type: ContactHistoryItem['type']): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case 'email_sent':
      return 'secondary';
    case 'email_open':
      return 'default';
    case 'link_click':
      return 'outline';
    case 'bounce':
      return 'destructive';
  }
}

function ContactHistoryDialogBase({ email, open, onOpenChange }: ContactHistoryDialogProps) {
  const { data, isLoading } = useContactHistory(email);

  const stats = {
    totalEmails: data?.emails.length || 0,
    totalOpens: data?.timeline.filter(t => t.type === 'email_open').length || 0,
    totalClicks: data?.timeline.filter(t => t.type === 'link_click').length || 0,
    bounces: data?.timeline.filter(t => t.type === 'bounce').length || 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Histórico de {email}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div role="region" aria-label="Histórico de Contatos" className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.totalEmails}</div>
                <div className="text-xs text-muted-foreground">Emails</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalOpens}</div>
                <div className="text-xs text-muted-foreground">Aberturas</div>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalClicks}</div>
                <div className="text-xs text-muted-foreground">Cliques</div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-destructive">{stats.bounces}</div>
                <div className="text-xs text-muted-foreground">Bounces</div>
              </div>
            </div>

            {/* Timeline */}
            <ScrollArea className="h-[400px] pr-4">
              {data?.timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma interação encontrada
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {data?.timeline.map((item) => (
                      <div key={item.id} className="relative flex items-start gap-4 pl-10">
                        {/* Timeline dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full ${getEventColor(item.type)} flex items-center justify-center text-white`}>
                          {getEventIcon(item.type)}
                        </div>

                        <div className="flex-1 bg-card border rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge variant={getEventBadgeVariant(item.type)}>
                              {getEventLabel(item.type)}
                              {item.is_self_open && ' (própria)'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.timestamp), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>

                          {item.subject && (
                            <p className="text-sm font-medium truncate">{item.subject}</p>
                          )}

                          {item.link_url && (
                            <a 
                              href={item.link_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {item.link_url.length > 50 ? item.link_url.slice(0, 50) + '...' : item.link_url}
                            </a>
                          )}

                          {item.ip_address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: {item.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}


export const ContactHistoryDialog = memo(ContactHistoryDialogBase);
