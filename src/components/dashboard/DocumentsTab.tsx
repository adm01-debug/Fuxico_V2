import { useState } from "react";
import { useTrackedDocuments, useDocumentEvents } from "@/hooks/use-tracked-documents";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText, 
  Eye, 
  Download, 
  Copy, 
  Check, 
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function DocumentsTab() {
  const { data: documents, isLoading } = useTrackedDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const getTrackingUrl = (documentId: string) => {
    return `${SUPABASE_URL}/functions/v1/track-document?id=${documentId}`;
  };

  const copyLink = async (documentId: string) => {
    const url = getTrackingUrl(documentId);
    await navigator.clipboard.writeText(url);
    setCopiedId(documentId);
    toast({ title: "Link copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
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
          <h2 className="text-xl font-semibold">Documentos Rastreados</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe visualizações dos seus PDFs
          </p>
        </div>
        <DocumentUploadDialog />
      </div>

      {!documents?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum documento rastreado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Envie um PDF para começar a rastrear visualizações
            </p>
            <DocumentUploadDialog />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead className="text-center">Visualizações</TableHead>
                <TableHead className="text-center">Downloads</TableHead>
                <TableHead>Última Visualização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{doc.file_name}</p>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.recipient_name || doc.recipient_email ? (
                      <div>
                        {doc.recipient_name && <p className="font-medium">{doc.recipient_name}</p>}
                        {doc.recipient_email && (
                          <p className="text-sm text-muted-foreground">{doc.recipient_email}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={doc.views > 0 ? "default" : "secondary"}>
                      <Eye className="h-3 w-3 mr-1" />
                      {doc.views}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      {doc.downloads}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.last_viewed ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(doc.last_viewed), {
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
                        onClick={() => copyLink(doc.document_id)}
                      >
                        {copiedId === doc.document_id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDocId(doc.document_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Document Events Dialog */}
      <DocumentEventsDialog
        documentId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
      />
    </div>
  );
}

function DocumentEventsDialog({
  documentId,
  onClose,
}: {
  documentId: string | null;
  onClose: () => void;
}) {
  const { data: events, isLoading } = useDocumentEvents(documentId);

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
    <Dialog open={!!documentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Histórico de Visualizações</DialogTitle>
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
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma visualização registrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {event.event_type === "download" ? (
                            <Download className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {event.event_type === "download" ? "Download" : "Visualização"}
                          </p>
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
                            {event.browser && (
                              <span>{event.browser}</span>
                            )}
                            {event.os && (
                              <span>{event.os}</span>
                            )}
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
