// FUXICO - Component: VersionHistoryPanel
import { History, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useVersionHistory } from '@/hooks/use-version-history';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VersionHistoryPanelProps {
  entityType: string;
  entityId: string;
}

export function VersionHistoryPanel({ entityType, entityId }: VersionHistoryPanelProps) {
  const { versions, isLoading, restoreVersion, isRestoring } = useVersionHistory(entityType, entityId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Historico
          {versions.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {versions.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historico de Versoes
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma versao anterior
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <div key={version.id} className="relative">
                  {index < versions.length - 1 && (
                    <div className="absolute left-3 top-8 bottom-0 w-px bg-border" />
                  )}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {version.version_number}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Versao {version.version_number}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => restoreVersion(version.id)}
                          disabled={isRestoring || index === 0}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Restaurar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.changed_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                      {version.change_summary && (
                        <p className="text-xs">{version.change_summary}</p>
                      )}
                    </div>
                  </div>
                  {index < versions.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default VersionHistoryPanel;
