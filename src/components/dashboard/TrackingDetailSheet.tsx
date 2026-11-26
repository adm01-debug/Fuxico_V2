// =============================================================================
// FUXICO - Detalhe do rastreamento: aberturas, cliques, dispositivo e cliente
// =============================================================================

import { memo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FollowUpReminderControl } from './FollowUpReminderControl';
import {
  AlertCircle,
  ExternalLink,
  Eye,
  Inbox,
  Loader2,
  MapPin,
  MousePointerClick,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { EmailStatusBadge, type EmailStatus } from '@/components/ui/email-status-badge';
import { useEmailDetail, type TrackingTimelineEntry } from '@/features/tracking/hooks/use-tracking';

const KNOWN_STATUS: readonly EmailStatus[] = [
  'sent',
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'pending',
  'replied',
];

function isKnownStatus(value: string | null | undefined): value is EmailStatus {
  return !!value && (KNOWN_STATUS as readonly string[]).includes(value);
}

interface TrackingDetailSheetProps {
  trackingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatMoment(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} (${formatDistanceToNow(date, {
    addSuffix: true,
    locale: ptBR,
  })})`;
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function TimelineRow({ entry }: { entry: TrackingTimelineEntry }) {
  const isClick = entry.type === 'click';
  const Icon = isClick ? MousePointerClick : Eye;
  const place = [entry.city, entry.country].filter(Boolean).join(' - ');

  return (
    <li className="flex gap-3 py-3">
      <span
        className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{isClick ? 'Clique' : 'Abertura'}</span>
          {entry.isSelfOpen ? (
            <Badge variant="secondary" className="text-[10px]">
              abertura própria
            </Badge>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatMoment(entry.at)} - {entry.client} / {entry.device}
        </p>
        {place ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {place}
          </p>
        ) : null}
        {entry.linkUrl ? (
          <a
            href={entry.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary underline underline-offset-2"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{entry.linkUrl}</span>
          </a>
        ) : null}
      </div>
    </li>
  );
}

function TrackingDetailSheetBase({ trackingId, open, onOpenChange }: TrackingDetailSheetProps) {
  const { data, isLoading, isError, refetch, isFetching } = useEmailDetail(open ? trackingId : '');

  const timeline = data?.timeline ?? [];
  const links = data?.links ?? [];
  // A edge conta cliques por tracked_links.click_count; a timeline é a fonte de verdade,
  // então usamos o maior valor para não subnotificar cliques.
  const clicks = Math.max(
    data?.summary.clicks ?? 0,
    timeline.filter((t) => t.type === 'click').length
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-xl"
        aria-label="Detalhe do rastreamento"
      >
        <SheetHeader>
          <SheetTitle className="pr-6 text-left">
            {data?.email.subject || 'Detalhe do rastreamento'}
          </SheetTitle>
          <SheetDescription className="text-left">
            {data?.email.recipientEmail ?? 'Carregando destinatário...'}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="text-sm">Carregando interações...</span>
          </div>
        ) : null}

        {isError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar o detalhe deste e-mail.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tentar novamente
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && data ? (
          <ScrollArea className="flex-1 pr-1">
            <div className="space-y-4 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                {isKnownStatus(data.email.deliveryStatus) ? (
                  <EmailStatusBadge status={data.email.deliveryStatus} />
                ) : null}
                <span className="text-xs text-muted-foreground">
                  Enviado em {formatMoment(data.email.createdAt)}
                </span>
              </div>

              <FollowUpReminderControl trackingId={trackingId} />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Aberturas" value={String(data.summary.opens)} />
                <StatCard label="Cliques" value={String(clicks)} />
                <StatCard label="Auto-aberturas" value={String(data.summary.selfOpens)} />
                <StatCard
                  label="Aberturas únicas"
                  value={String(
                    new Set(
                      timeline
                        .filter((t) => t.type === 'open' && !t.isSelfOpen)
                        .map((t) => `${t.client}-${t.device}`)
                    ).size
                  )}
                  hint="por cliente/dispositivo"
                />
              </div>

              <div className="grid grid-cols-1 gap-1 rounded-lg border border-border/60 p-3 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Primeira abertura: {formatMoment(data.summary.firstOpenAt)}</p>
                <p>Última abertura: {formatMoment(data.summary.lastOpenAt)}</p>
              </div>

              {links.length > 0 ? (
                <section aria-label="Links mais clicados">
                  <h3 className="mb-2 text-sm font-semibold">Links mais clicados</h3>
                  <ul className="space-y-1">
                    {links.map((link) => (
                      <li
                        key={link.linkId}
                        className="flex items-center justify-between gap-2 rounded border border-border/60 px-2 py-1.5"
                      >
                        <span className="truncate text-xs" title={link.url}>
                          {link.url}
                        </span>
                        <Badge variant="secondary" className="tabular-nums">
                          {link.clicks}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <Separator />

              <section aria-label="Linha do tempo de interações">
                <h3 className="mb-1 text-sm font-semibold">Linha do tempo</h3>
                {timeline.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Inbox className="h-5 w-5" aria-hidden="true" />
                    <p className="text-sm">Nenhuma abertura ou clique registrado ainda.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {timeline.map((entry) => (
                      <TimelineRow
                        key={`${entry.type}-${entry.at}-${entry.client}-${entry.device}`}
                        entry={entry}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export const TrackingDetailSheet = memo(TrackingDetailSheetBase);
export default TrackingDetailSheet;
