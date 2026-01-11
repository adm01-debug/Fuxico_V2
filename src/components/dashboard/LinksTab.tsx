import { memo, useState } from 'react';
import { useTrackedLinks, useLinkClickEvents } from "@/hooks/use-tracked-links";
import { LinkCreateDialog } from "./LinkCreateDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Link2, 
  MousePointerClick, 
  Copy, 
  Check, 
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

function LinksTabBase() {
  const { data: links, isLoading } = useTrackedLinks();
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const getTrackingUrl = (linkId: string) => {
    return `${SUPABASE_URL}/functions/v1/track-standalone-link/${linkId}`;
  };

  const copyLink = async (linkId: string) => {
    const url = getTrackingUrl(linkId);
    await navigator.clipboard.writeText(url);
    setCopiedId(linkId);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4" role="region" aria-label="Links Rastreados">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Links Rastreados</h2>
          <p className="text-sm text-muted-foreground">
            Crie links curtos e rastreie cliques
          </p>
        </div>
        <div data-tour="links-create-btn">
          <LinkCreateDialog />
        </div>
      </div>

      {!links?.length ? (
        <Card role="article">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum link rastreado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie um link para começar a rastrear cliques
            </p>
            <LinkCreateDialog />
          </CardContent>
        </Card>
      ) : (
        <Card role="article" data-tour="links-table">
          <Table aria-label="Lista de links rastreados">
            <TableHeader>
              <TableRow>
                <TableHead>Link</TableHead>
                <TableHead>URL Original</TableHead>
                <TableHead className="text-center">Cliques</TableHead>
                <TableHead>Último Clique</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => (
                <TableRow key={link.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{link.title || link.link_id}</p>
                      {link.description && (
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {link.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={link.original_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate max-w-[250px]"
                    >
                      {link.original_url}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={link.click_count > 0 ? "default" : "secondary"}>
                      <MousePointerClick className="h-3 w-3 mr-1" />
                      {link.click_count}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {link.last_clicked ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(link.last_clicked), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(link.link_id)}
                        data-tour="links-copy-btn"
                      >
                        {copiedId === link.link_id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLinkId(link.link_id)}
                        data-tour="links-events-btn"
                      >
                        <MousePointerClick className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <LinkEventsDialog
        linkId={selectedLinkId}
        onClose={() => setSelectedLinkId(null)}
      />
    </div>
  );
}

function LinkEventsDialog({
  linkId,
  onClose,
}: {
  linkId: string | null;
  onClose: () => void;
}) {
  const { data: events, isLoading } = useLinkClickEvents(linkId);

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={!!linkId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Cliques</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !events?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <MousePointerClick className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum clique registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          <MousePointerClick className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Clique</p>
                          <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                            {event.country && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {event.city ? `${event.city}, ` : ""}{event.country}
                              </span>
                            )}
                            {event.device_type && (
                              <span className="flex items-center gap-1">
                                {getDeviceIcon(event.device_type)}
                                {event.device_type}
                              </span>
                            )}
                            {event.browser && <span>{event.browser}</span>}
                            {event.os && <span>{event.os}</span>}
                          </div>
                          {event.ip_address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: {event.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export const LinksTab = memo(LinksTabBase);
export default LinksTab;
