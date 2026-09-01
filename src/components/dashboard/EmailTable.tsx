import { useState, useMemo, useRef } from "react";
import type { TrackedEmail } from "@/features/tracking/lib/tracking-api";
import { useTrackedEmails } from "@/features/tracking/hooks/use-tracking";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Mail, Eye, MousePointerClick, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmailFiltersComponent } from "./EmailFilters";
import { useEmailFilters, filterEmails, type EmailFilters } from "@/hooks/use-email-filters";
import { EmailStatusBadge } from "@/components/ui/email-status-badge";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion } from "framer-motion";

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
    <motion.button
      whileHover={{ scale: 1.002, x: 2 }}
      whileTap={{ scale: 0.998 }}
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 text-left transition-all duration-200 hover:bg-muted/50 hover-lift touch-target min-h-[4.5rem]",
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
        <Tooltip delayDuration={300}>
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
    </motion.button>
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
  const { data: fetchedEmails, isLoading } = useTrackedEmails();
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Identidade estável do array evita invalidar o memo de filtragem a cada render.
  const emails = useMemo(
    () => externalEmails ?? (fetchedEmails as TrackedEmail[] | undefined) ?? [],
    [externalEmails, fetchedEmails],
  );
  const selectedId = externalSelectedId ?? internalSelectedId;
  const onSelect = externalOnSelect ?? setInternalSelectedId;

  const { filters, setFilters, hasActiveFilters } = useEmailFilters();
  
  const filteredEmails = useMemo(() => {
    return filterEmails(emails, filters);
  }, [emails, filters]);

  const rowVirtualizer = useVirtualizer({
    count: filteredEmails.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 92, // Average height of an EmailRow
    overscan: 5,
  });

  // Para listas pequenas (até 30 itens), renderização simples sem virtualização
  // evita bugs de layout onde o virtualizer empilha itens quando o container
  // pai não tem altura explícita.
  const useSimpleLayout = filteredEmails.length <= 30;

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

        {filteredEmails.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : useSimpleLayout ? (
          // Renderização simples sem virtualização (listas com até 30 itens)
          <div
            ref={parentRef}
            className="flex-1 min-h-[400px] overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
            role="region"
            aria-label="Lista de emails rastreados"
          >
            <div className="divide-y divide-border">
              {filteredEmails.map((email) => (
                <EmailRow
                  key={email.tracking_id || email.id}
                  email={email}
                  isSelected={selectedId === email.tracking_id}
                  onSelect={() => onSelect(email.tracking_id)}
                />
              ))}
            </div>
          </div>
        ) : (
          // Virtualização para listas grandes
          <div
            ref={parentRef}
            className="flex-1 min-h-[500px] overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
            role="region"
            aria-label="Lista de emails rastreados"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const email = filteredEmails[virtualRow.index];
                return (
                  <motion.div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: (virtualRow.index % 10) * 0.03 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <EmailRow
                      email={email}
                      isSelected={selectedId === email.tracking_id}
                      onSelect={() => onSelect(email.tracking_id)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export type { EmailFilters };
export default EmailTable;
