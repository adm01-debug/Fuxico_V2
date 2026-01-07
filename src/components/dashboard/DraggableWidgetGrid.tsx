// =============================================================================
// Grid de Widgets com Drag-and-Drop usando Framer Motion
// =============================================================================

import { Reorder, useDragControls, motion } from 'framer-motion';
import { GripVertical, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DashboardWidget, useDashboardWidgets } from '@/hooks/use-dashboard-widgets';

interface DraggableWidgetProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  isEditing: boolean;
  onSizeChange?: (size: DashboardWidget['size']) => void;
}

function DraggableWidget({ widget, children, isEditing, onSizeChange }: DraggableWidgetProps) {
  const dragControls = useDragControls();

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-1 md:col-span-1 lg:col-span-1',
    large: 'col-span-1 md:col-span-2',
  };

  const handleSizeToggle = () => {
    if (!onSizeChange) return;
    const sizes: DashboardWidget['size'][] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(widget.size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onSizeChange(sizes[nextIndex]);
  };

  return (
    <Reorder.Item
      value={widget}
      id={widget.id}
      dragListener={false}
      dragControls={dragControls}
      className={cn(sizeClasses[widget.size], 'relative')}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        zIndex: 50,
      }}
      layout
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
    >
      <motion.div
        className={cn(
          'h-full transition-all duration-200',
          isEditing && 'ring-2 ring-primary/20 ring-offset-2 rounded-lg'
        )}
        whileHover={isEditing ? { scale: 1.01 } : {}}
      >
        {isEditing && (
          <motion.div
            className="absolute -top-2 -right-2 z-10 flex gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full shadow-lg"
              onClick={handleSizeToggle}
            >
              {widget.size === 'large' ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </motion.div>
        )}
        
        {isEditing && (
          <motion.div
            className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => dragControls.start(e)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="p-1.5 bg-muted rounded-md shadow-sm hover:bg-muted/80 transition-colors">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </motion.div>
        )}
        
        {children}
      </motion.div>
    </Reorder.Item>
  );
}

interface DraggableWidgetGridProps {
  widgets: DashboardWidget[];
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
  isEditing: boolean;
  onReorder: (widgets: DashboardWidget[]) => void;
  onSizeChange: (widgetId: string, size: DashboardWidget['size']) => void;
}

export function DraggableWidgetGrid({
  widgets,
  renderWidget,
  isEditing,
  onReorder,
  onSizeChange,
}: DraggableWidgetGridProps) {
  return (
    <Reorder.Group
      axis="y"
      values={widgets}
      onReorder={onReorder}
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:gap-6"
      as="div"
    >
      {widgets.map((widget) => (
        <DraggableWidget
          key={widget.id}
          widget={widget}
          isEditing={isEditing}
          onSizeChange={(size) => onSizeChange(widget.id, size)}
        >
          {renderWidget(widget)}
        </DraggableWidget>
      ))}
    </Reorder.Group>
  );
}

// Componente wrapper para cards com animação de entrada
interface AnimatedWidgetCardProps {
  title: string;
  icon?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedWidgetCard({
  title,
  icon,
  description,
  children,
  className,
}: AnimatedWidgetCardProps) {
  return (
    <Card className={cn('h-full overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
