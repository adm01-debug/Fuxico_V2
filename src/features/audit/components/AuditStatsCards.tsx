import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, AlertTriangle, Users } from 'lucide-react';

interface AuditStats {
  totalSent?: number;
  totalReceived?: number;
  externalEmails?: number;
  unresolvedAlerts?: number;
  userCount?: number;
}

export function AuditStatsCards({ stats }: { stats?: AuditStats | null }) {
  const cards = [
    { title: 'Emails Enviados', value: stats?.totalSent || 0, icon: ArrowUpRight, subtitle: 'Hoje' },
    { title: 'Emails Recebidos', value: stats?.totalReceived || 0, icon: ArrowDownLeft, subtitle: 'Hoje' },
    { title: 'Emails Externos', value: stats?.externalEmails || 0, icon: ExternalLink, subtitle: 'Hoje' },
    { title: 'Alertas Pendentes', value: stats?.unresolvedAlerts || 0, icon: AlertTriangle, subtitle: 'Não resolvidos', valueClass: 'text-orange-600', iconClass: 'text-orange-500' },
    { title: 'Usuários Ativos', value: stats?.userCount || 0, icon: Users, subtitle: 'Hoje' },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} role="article">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.iconClass || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueClass || ''}`}>{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
