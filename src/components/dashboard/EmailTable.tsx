import { useState, useMemo } from "react";
import type { TrackedEmail } from "@/lib/tracking-api";
import { useTrackedEmails } from "@/hooks/use-tracking";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Eye, MousePointerClick, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailFiltersComponent, useEmailFilters, filterEmails, type EmailFilters } from "./EmailFilters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailStatusBadge } from "@/components/ui/email-status-badge";

interface EmailTableProps {
  emails?: TrackedEmail[];
  selectedId?: string | null;
  onSelect?: (trackingId: string) => void;
  showFilters?: boolean;
}

// Helper to determine email status from tracking data
function getEmailStatus(email: TrackedEmail): 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' {
  if (email.delivery_status === 'bounced') return 'bounced';
  if ((email.clicks ?? 0) > 0) return 'clicked';
  if ((email.opens ?? 0) > 0) return 'opened';
  if (email.delivery_status === 'delivered') return 'delivered';
  return 'sent';
}

function EmailRow({ 
  email, 
  isSelected, 
  onSelect 
}: { 
  email: TrackedEmail; 
  isSelected: boolean; 
  onSelect: () => void;
}) {
  const status = getEmailStatus(email);
  
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left transition-all duration-200 hover:bg-muted/50 hover-lift touch-target",
        isSelected && "bg-primary/5 border-l-2 border-l-primary",
        status === 'bounced' && "bg-email-bounced/5"
      )}
    >
      {/* Avatar - Hidden on very small screens */}
      <div className="hidden xs:flex flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
          status === 'bounced' && "bg-email-bounced/10 text-email-bounced",
          status === 'clicked' && "bg-email-clicked/10 text-email-clicked",
          status === 'opened' && "bg-email-opened/10 text-email-opened",
          status === 'delivered' && "bg-email-delivered/10 text-email-delivered",
          status === 'sent' && "bg-email-sent/10 text-email-sent"
        )}>
          <Mail className="h-5 w-5" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate text-sm sm:text-base">{email.recipient_email}</p>
          <EmailStatusBadge 
            status={status}
            bounceType={email.bounce_type}
            bounceReason={email.bounce_reason}
            showIcon
          />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          {email.subject || "Sem assunto"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
          {formatDistanceToNow(new Date(email.created_at), { 
            addSuffix: true,
            locale: ptBR 
          })}
        </p>
      </div>
      
      {/* Stats - Responsive layout */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Opens - Always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-sm">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium tabular-nums",
                (email.opens ?? 0) > 0 ? "text-email-opened" : "text-muted-foreground"
              )}>
                {email.opens ?? 0}
              </span>
              {/* Self opens - Hidden on mobile */}
              {(email.selfOpens ?? 0) > 0 && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
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
        
        {/* Clicks - Visible on sm+ */}
        <div className="hidden sm:flex items-center gap-1 text-sm">
          <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          <span className={cn(
            "font-medium tabular-nums",
            (email.clicks ?? 0) > 0 ? "text-email-clicked" : "text-muted-foreground"
          )}>
            {email.clicks ?? 0}
          </span>
        </div>
        
        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Mail className="h-12 w-12 mb-4 opacity-50" />
      {hasFilters ? (
        <>
          <p className="text-lg font-medium">Nenhum resultado encontrado</p>
          <p className="text-sm">Tente ajustar os filtros de busca</p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium">Nenhum email rastreado</p>
          <p className="text-sm">Crie um novo rastreamento para começar</p>
        </>
      )}
    </div>
  );
}

export function EmailTable({ emails: externalEmails, selectedId: externalSelectedId, onSelect: externalOnSelect, showFilters = true }: EmailTableProps) {
  // Self-contained mode: fetch data internally when no emails prop provided
  const { data: fetchedEmails, isLoading } = useTrackedEmails();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const emails = externalEmails ?? (fetchedEmails as TrackedEmail[] | undefined) ?? [];
  const selectedId = externalSelectedId ?? internalSelectedId;
  const onSelect = externalOnSelect ?? setInternalSelectedId;

  const { filters, setFilters, hasActiveFilters } = useEmailFilters();
  
  // Apply filters
  const filteredEmails = useMemo(() => {
    return filterEmails(emails, filters);
  }, [emails, filters]);

  if (isLoading && !externalEmails) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b bg-muted/30">
            <EmailFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={emails.length}
              filteredCount={filteredEmails.length}
            />
          </div>
        )}

        {/* Email list */}
        {filteredEmails.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          <ScrollArea role="region" aria-label="Lista de emails rastreados" className="xl:max-h-none flex-1">
            <div className="divide-y divide-border">
              {filteredEmails.map((email) => (
                <EmailRow
                  key={email.id}
                  email={email}
                  isSelected={selectedId === email.tracking_id}
                  onSelect={() => onSelect(email.tracking_id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}

// Export for backward compatibility
export { useEmailFilters, filterEmails };
export type { EmailFilters };

// Default export for lazy loading
export default EmailTable;
