import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, AlertTriangle, Monitor, Clock, Globe, Globe2 } from 'lucide-react';
import { SecurityOverviewCards } from './SecurityOverviewCards';
import { ActiveSessionsList } from './ActiveSessionsList';
import { MFASettingsPanel } from './MFASettingsPanel';
import { SecurityAlertsList } from './SecurityAlertsList';
import { SecurityEventsList } from './SecurityEventsList';
import IPWhitelistPanel from './IPWhitelistPanel';
import BlockedIPsPanel from './BlockedIPsPanel';
import GeoWhitelistPanel from './GeoWhitelistPanel';
import PasswordResetRequestsPanel from './PasswordResetRequestsPanel';
import LockedAccountsPanel from './LockedAccountsPanel';

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Central de Segurança</h2>
          <p className="text-muted-foreground text-sm">
            Gerencie todas as configurações de segurança
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 w-fit shrink-0">
          <Shield className="h-3 w-3" />
          <span className="text-xs sm:text-sm">Proteção Ativa</span>
        </Badge>
      </div>

      <SecurityOverviewCards />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Tabs - Responsive with horizontal scroll on mobile */}
        <div className="w-full overflow-x-auto pb-1 -mb-1 scrollbar-thin">
          <TabsList className="inline-flex w-max min-w-full sm:grid sm:w-full sm:grid-cols-6 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Sessões</span>
            </TabsTrigger>
            <TabsTrigger value="mfa" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <Key className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">MFA</span>
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">IPs</span>
            </TabsTrigger>
            <TabsTrigger value="geo" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <Globe2 className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Geo</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 min-h-[44px] whitespace-nowrap">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Alertas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Sessões Recentes
                </CardTitle>
                <CardDescription>
                  Últimas 3 sessões ativas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActiveSessionsList limit={3} compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Recentes
                </CardTitle>
                <CardDescription>
                  Últimos alertas de segurança
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityAlertsList limit={3} compact />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Eventos de Segurança
              </CardTitle>
              <CardDescription>
                Histórico recente de atividades de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityEventsList limit={5} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Sessões Ativas
              </CardTitle>
              <CardDescription>
                Gerencie todas as sessões conectadas à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActiveSessionsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mfa">
          <MFASettingsPanel />
        </TabsContent>

        <TabsContent value="ip" className="space-y-4">
          <IPWhitelistPanel />
          <BlockedIPsPanel />
        </TabsContent>

        <TabsContent value="geo">
          <GeoWhitelistPanel />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <LockedAccountsPanel />
          <PasswordResetRequestsPanel />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Segurança
              </CardTitle>
              <CardDescription>
                Todos os alertas e notificações de segurança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityAlertsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
