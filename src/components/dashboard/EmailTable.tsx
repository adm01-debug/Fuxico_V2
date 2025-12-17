import { TrackedEmail } from "@/lib/tracking-api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Eye, MousePointerClick, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface EmailTableProps {
  emails: TrackedEmail[];
  selectedId: string | null;
  onSelect: (trackingId: string) => void;
}

function DeliveryStatusBadge({ status, bounceType, bounceReason }: { 
  status?: string; 
  bounceType?: string; 
  bounceReason?: string;
}) {
  if (status === 'bounced') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            Bounce
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Email não entregue</p>
          {bounceType && <p className="text-xs">Tipo: {bounceType}</p>}
          {bounceReason && <p className="text-xs max-w-48">{bounceReason}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }
  
  if (status === 'delivered') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-xs text-success border-success/50">
            <CheckCircle className="h-3 w-3" />
            Entregue
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Email entregue com sucesso</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return null;
}

export function EmailTable({ emails, selectedId, onSelect }: EmailTableProps) {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Mail className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum email rastreado</p>
        <p className="text-sm">Crie um novo rastreamento para começar</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <button
            key={email.id}
            onClick={() => onSelect(email.tracking_id)}
            className={cn(
              "w-full flex items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-muted/50",
              selectedId === email.tracking_id && "bg-primary/5 border-l-2 border-l-primary",
              email.delivery_status === 'bounced' && "bg-destructive/5"
            )}
          >
            <div className="flex-shrink-0">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                email.delivery_status === 'bounced' 
                  ? "bg-destructive/10 text-destructive"
                  : (email.opens ?? 0) > 0 
                    ? "bg-success/10 text-success" 
                    : "bg-muted text-muted-foreground"
              )}>
                {email.delivery_status === 'bounced' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">{email.recipient_email}</p>
                <DeliveryStatusBadge 
                  status={email.delivery_status} 
                  bounceType={email.bounce_type}
                  bounceReason={email.bounce_reason}
                />
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {email.subject || "Sem assunto"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(email.created_at), { 
                  addSuffix: true,
                  locale: ptBR 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      "font-medium",
                      (email.opens ?? 0) > 0 ? "text-success" : "text-muted-foreground"
                    )}>
                      {email.opens ?? 0}
                    </span>
                    {(email.selfOpens ?? 0) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        (+{email.selfOpens})
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{email.opens ?? 0} aberturas reais</p>
                  {(email.selfOpens ?? 0) > 0 && (
                    <p className="text-muted-foreground">{email.selfOpens} self-opens (filtrados)</p>
                  )}
                </TooltipContent>
              </Tooltip>
              
              <div className="flex items-center gap-1 text-sm">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "font-medium",
                  (email.clicks ?? 0) > 0 ? "text-primary" : "text-muted-foreground"
                )}>
                  {email.clicks ?? 0}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </TooltipProvider>
  );
}
