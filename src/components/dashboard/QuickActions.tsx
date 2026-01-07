// =============================================================================
// FUXICO - Quick Actions Component
// Ações rápidas para o Dashboard Home
// =============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Plus,
  FileText,
  Link as LinkIcon,
  Download,
  Settings,
  BarChart3,
  Bell,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onNavigate: (tabId: string) => void;
  onCreateTracking?: () => void;
}

export function QuickActions({ onNavigate, onCreateTracking }: QuickActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const actions: QuickAction[] = [
    {
      id: 'create-tracking',
      label: 'Novo Rastreamento',
      description: 'Criar pixel de rastreamento',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
      onClick: () => onCreateTracking?.(),
    },
    {
      id: 'view-emails',
      label: 'Ver Emails',
      description: 'Lista de emails rastreados',
      icon: <Mail className="h-5 w-5" />,
      color: 'bg-email-sent/10 text-email-sent hover:bg-email-sent/20',
      onClick: () => onNavigate('tracking'),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      description: 'Métricas avançadas',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-email-opened/10 text-email-opened hover:bg-email-opened/20',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'documents',
      label: 'Documentos',
      description: 'PDFs e arquivos rastreados',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
      onClick: () => onNavigate('documents'),
    },
    {
      id: 'links',
      label: 'Links',
      description: 'Links rastreáveis',
      icon: <LinkIcon className="h-5 w-5" />,
      color: 'bg-email-clicked/10 text-email-clicked hover:bg-email-clicked/20',
      onClick: () => onNavigate('links'),
    },
    {
      id: 'reports',
      label: 'Relatórios',
      description: 'Exportar e agendar',
      icon: <Download className="h-5 w-5" />,
      color: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
      onClick: () => onNavigate('reports'),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={action.onClick}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200",
                "border border-transparent hover:border-border",
                "hover-lift focus-ring",
                action.color
              )}
            >
              <div className="relative">
                {action.icon}
                {hoveredAction === action.id && (
                  <ArrowRight className="absolute -right-4 top-1/2 -translate-y-1/2 h-3 w-3 animate-fade-in" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or mobile
export function QuickActionsCompact({ onNavigate, onCreateTracking }: QuickActionsProps) {
  const mainActions = [
    {
      id: 'create',
      icon: <Plus className="h-4 w-4" />,
      label: 'Novo',
      onClick: () => onCreateTracking?.(),
    },
    {
      id: 'emails',
      icon: <Mail className="h-4 w-4" />,
      label: 'Emails',
      onClick: () => onNavigate('tracking'),
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Analytics',
      onClick: () => onNavigate('analytics'),
    },
    {
      id: 'settings',
      icon: <Settings className="h-4 w-4" />,
      label: 'Config',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
      {mainActions.map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          onClick={action.onClick}
          className="flex-1 h-8 px-2 hover-lift"
        >
          {action.icon}
          <span className="ml-1 text-xs hidden sm:inline">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;
