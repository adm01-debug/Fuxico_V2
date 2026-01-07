// =============================================================================
// Widget Customizer - Painel para personalizar widgets do dashboard
// =============================================================================

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Settings2,
  Zap,
  TrendingUp,
  Rocket,
  Gauge,
  AlertTriangle,
  Activity,
  Users,
  CheckCircle,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { useDashboardWidgets, DashboardWidget } from '@/hooks/use-dashboard-widgets';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  TrendingUp,
  Rocket,
  Gauge,
  AlertTriangle,
  Activity,
  Users,
  CheckCircle,
};

interface WidgetItemProps {
  widget: DashboardWidget;
  onToggle: (id: string) => void;
  isDragging?: boolean;
}

function WidgetItem({ widget, onToggle }: WidgetItemProps) {
  const Icon = ICON_MAP[widget.icon] || Activity;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-all',
        widget.enabled
          ? 'bg-primary/5 border-primary/20'
          : 'bg-muted/30 border-transparent hover:border-muted'
      )}
    >
      <div className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      <div
        className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center',
          widget.enabled ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5',
            widget.enabled ? 'text-primary' : 'text-muted-foreground'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{widget.title}</p>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              widget.size === 'large' && 'border-blue-500/50 text-blue-600',
              widget.size === 'medium' && 'border-green-500/50 text-green-600',
              widget.size === 'small' && 'border-orange-500/50 text-orange-600'
            )}
          >
            {widget.size === 'large' ? 'Grande' : widget.size === 'medium' ? 'Médio' : 'Pequeno'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{widget.description}</p>
      </div>
      <Switch
        checked={widget.enabled}
        onCheckedChange={() => onToggle(widget.id)}
        aria-label={`Ativar ${widget.title}`}
      />
    </div>
  );
}

interface WidgetCustomizerProps {
  trigger?: React.ReactNode;
  isEditing?: boolean;
  onEditingChange?: (editing: boolean) => void;
}

export function WidgetCustomizer({ 
  trigger, 
  isEditing = false, 
  onEditingChange 
}: WidgetCustomizerProps) {
  const [open, setOpen] = useState(false);
  const { widgets, toggleWidget, resetWidgets } = useDashboardWidgets();

  const enabledCount = widgets.filter(w => w.enabled).length;

  return (
    <div className="flex items-center gap-2">
      {onEditingChange && (
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => onEditingChange(!isEditing)}
          className="gap-2"
        >
          <GripVertical className="h-4 w-4" />
          {isEditing ? 'Concluir' : 'Reorganizar'}
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Personalizar
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Personalizar Dashboard
            </DialogTitle>
            <DialogDescription>
              Escolha quais widgets exibir e organize a ordem de exibição.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-muted-foreground">
              {enabledCount} de {widgets.length} widgets ativos
            </p>
            <Button variant="ghost" size="sm" onClick={resetWidgets} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Restaurar Padrão
            </Button>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {widgets
                .sort((a, b) => {
                  if (a.enabled && !b.enabled) return -1;
                  if (!a.enabled && b.enabled) return 1;
                  return a.order - b.order;
                })
                .map((widget) => (
                  <WidgetItem
                    key={widget.id}
                    widget={widget}
                    onToggle={toggleWidget}
                  />
                ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setOpen(false)}>Concluído</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
