import { TrackedEmail } from "@/lib/tracking-api";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Eye, MousePointerClick, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailTableProps {
  emails: TrackedEmail[];
  selectedId: string | null;
  onSelect: (trackingId: string) => void;
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
    <div className="divide-y divide-border">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => onSelect(email.tracking_id)}
          className={cn(
            "w-full flex items-center gap-4 p-4 text-left transition-all duration-200 hover:bg-muted/50",
            selectedId === email.tracking_id && "bg-primary/5 border-l-2 border-l-primary"
          )}
        >
          <div className="flex-shrink-0">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              (email.opens ?? 0) > 0 ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
            )}>
              <Mail className="h-5 w-5" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{email.recipient_email}</p>
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
            <div className="flex items-center gap-1 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                (email.opens ?? 0) > 0 ? "text-success" : "text-muted-foreground"
              )}>
                {email.opens ?? 0}
              </span>
            </div>
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
  );
}
