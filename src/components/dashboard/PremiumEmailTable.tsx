/**
 * Premium Email Table Component
 * 
 * @description Tabela de emails com design premium, animações e UX aprimorada
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrackedEmail } from '@/lib/tracking-api';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  MoreHorizontal,
  Copy,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailStatusBadge } from '@/components/ui/email-status-badge';
import { PremiumSearchInput } from '@/components/ui/premium-search-input';
import { NoEmailsEmptyState, NoSearchResultsEmptyState } from '@/components/ui/premium-empty-state';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

// ============================================================================
// Types
// ============================================================================

interface PremiumEmailTableProps {
  emails: TrackedEmail[];
  selectedId: string | null;
  onSelect: (trackingId: string) => void;
  onDelete?: (trackingId: string) => void;
  onCopy?: (trackingId: string) => void;
  showFilters?: boolean;
  isLoading?: boolean;
}

type EmailStatus = 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced';

// ============================================================================
// Helpers
// ============================================================================

function getEmailStatus(email: TrackedEmail): EmailStatus {
  if (email.delivery_status === 'bounced') return 'bounced';
  if ((email.clicks ?? 0) > 0) return 'clicked';
  if ((email.opens ?? 0) > 0) return 'opened';
  if (email.delivery_status === 'delivered') return 'delivered';
  return 'sent';
}

const statusConfig: Record<EmailStatus, {
  icon: typeof Mail;
  color: string;
  bgColor: string;
  label: string;
}> = {
  sent: {
    icon: Send,
    color: 'text-email-sent',
    bgColor: 'bg-email-sent/10',
    label: 'Enviado',
  },
  delivered: {
    icon: CheckCircle2,
    color: 'text-email-delivered',
    bgColor: 'bg-email-delivered/10',
    label: 'Entregue',
  },
  opened: {
    icon: Eye,
    color: 'text-email-opened',
    bgColor: 'bg-email-opened/10',
    label: 'Aberto',
  },
  clicked: {
    icon: MousePointerClick,
    color: 'text-email-clicked',
    bgColor: 'bg-email-clicked/10',
    label: 'Clicado',
  },
  bounced: {
    icon: AlertTriangle,
    color: 'text-email-bounced',
    bgColor: 'bg-email-bounced/10',
    label: 'Bounce',
  },
};

// ============================================================================
// Animations
// ============================================================================

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
  },
  exit: { 
    opacity: 0, 
    x: 20,
    transition: { duration: 0.2 }
  },
};

// ============================================================================
// Email Row Component
// ============================================================================

interface EmailRowProps {
  email: TrackedEmail;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
}

function EmailRow({ email, isSelected, onSelect, onDelete, onCopy }: EmailRowProps) {
  const status = getEmailStatus(email);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={cn(
        "group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-b transition-all duration-200",
        "hover:bg-muted/30 cursor-pointer touch-target",
        isSelected && "bg-primary/5 border-l-2 border-l-primary",
        status === 'bounced' && "bg-email-bounced/5"
      )}
      onClick={onSelect}
    >
      {/* Status indicator dot */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full opacity-0 transition-opacity",
          config.bgColor.replace('/10', ''),
          isSelected && "opacity-100"
        )}
      />

      {/* Icon - Hidden on very small screens */}
      <div className="hidden xs:flex flex-shrink-0">
        <motion.div 
          whileHover={{ scale: 1.1 }}
          className={cn(
            "relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-200",
            config.bgColor,
            "group-hover:shadow-md"
          )}
        >
          <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", config.color)} />
          
          {/* Engagement indicator */}
          {(email.opens ?? 0) > 3 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center"
            >
              <Sparkles className="h-2.5 w-2.5 text-primary-foreground" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-medium truncate text-foreground text-sm sm:text-base max-w-[200px] sm:max-w-none">
            {email.recipient_email}
          </p>
          <EmailStatusBadge 
            status={status}
            bounceType={email.bounce_type}
            bounceReason={email.bounce_reason}
            showIcon
          />
        </div>
        
        <p className="text-xs sm:text-sm text-muted-foreground truncate mb-1">
          {email.subject || "Sem assunto"}
        </p>
        
        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="truncate max-w-[100px] sm:max-w-none">
              {formatDistanceToNow(new Date(email.created_at), { 
                addSuffix: true,
                locale: ptBR 
              })}
            </span>
          </span>
          
          {/* Full date - hidden on mobile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                {format(new Date(email.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </TooltipTrigger>
            <TooltipContent>Data e hora de envio</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats - Responsive */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Opens - Always visible but compact on mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-lg bg-muted/50"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className={cn(
                "font-semibold tabular-nums text-xs sm:text-sm",
                (email.opens ?? 0) > 0 ? "text-email-opened" : "text-muted-foreground"
              )}>
                {email.opens ?? 0}
              </span>
              {/* Self opens - Hidden on mobile */}
              {(email.selfOpens ?? 0) > 0 && (
                <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                  (+{email.selfOpens})
                </span>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{email.opens ?? 0} aberturas</p>
            {(email.selfOpens ?? 0) > 0 && (
              <p className="text-muted-foreground text-xs">
                {email.selfOpens} self-opens (filtrados)
              </p>
            )}
          </TooltipContent>
        </Tooltip>

        {/* Clicks - Hidden on mobile */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/50"
            >
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-semibold tabular-nums text-sm",
                (email.clicks ?? 0) > 0 ? "text-email-clicked" : "text-muted-foreground"
              )}>
                {email.clicks ?? 0}
              </span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{email.clicks ?? 0} cliques em links</p>
          </TooltipContent>
        </Tooltip>

        {/* Actions Menu - Improved touch target */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 sm:h-8 sm:w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-target"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onCopy?.();
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar pixel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Arrow - Hidden on small mobile */}
        <ChevronRight className={cn(
          "h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-transform duration-200 hidden xs:block",
          "group-hover:translate-x-1",
          isSelected && "text-primary"
        )} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PremiumEmailTable({ 
  emails, 
  selectedId, 
  onSelect,
  onDelete,
  onCopy,
  showFilters = true,
  isLoading = false,
}: PremiumEmailTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Filter emails
  const filteredEmails = useMemo(() => {
    if (!debouncedSearch) return emails;
    
    const term = debouncedSearch.toLowerCase();
    return emails.filter(email => 
      email.recipient_email.toLowerCase().includes(term) ||
      (email.subject?.toLowerCase().includes(term)) ||
      (email.sender_email?.toLowerCase().includes(term))
    );
  }, [emails, debouncedSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const hasActiveSearch = debouncedSearch.length > 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Search Header */}
        {showFilters && (
          <div className="p-4 border-b bg-gradient-to-r from-muted/30 to-transparent">
            <div className="flex items-center justify-between gap-4">
              <PremiumSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar por email, assunto..."
                isLoading={isLoading}
                variant="elevated"
                className="flex-1 max-w-md"
              />
              
              {/* Results count */}
              <AnimatePresence mode="wait">
                {hasActiveSearch && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Badge variant="secondary" className="font-normal">
                      {filteredEmails.length} de {emails.length}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Email List */}
        {filteredEmails.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            {hasActiveSearch ? (
              <NoSearchResultsEmptyState 
                searchTerm={searchTerm}
                onClear={handleClearSearch}
              />
            ) : (
              <NoEmailsEmptyState />
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="visible"
              className="divide-y divide-border/50"
            >
              <AnimatePresence mode="popLayout">
                {filteredEmails.map((email) => (
                  <EmailRow
                    key={email.id}
                    email={email}
                    isSelected={selectedId === email.tracking_id}
                    onSelect={() => onSelect(email.tracking_id)}
                    onDelete={onDelete ? () => onDelete(email.tracking_id) : undefined}
                    onCopy={onCopy ? () => onCopy(email.tracking_id) : undefined}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </ScrollArea>
        )}
      </div>
    </TooltipProvider>
  );
}

export default PremiumEmailTable;
