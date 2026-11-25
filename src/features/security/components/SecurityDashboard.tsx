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
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Central de Segurança</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie todas as configurações de segurança
          </p>
        </div>
        <Badge variant="outline" className="flex w-fit shrink-0 items-center gap-1">
          <Shield className="h-3 w-3" />
          <span className="text-xs sm:text-sm">Proteção Ativa</span>
        </Badge>
      </div>

      <SecurityOverviewCards />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Tabs - Responsive with horizontal scroll on mobile */}
        <div className="scrollbar-thin -mb-1 w-full overflow-x-auto pb-1">
          <TabsList className="inline-flex h-auto w-max min-w-full p-1 sm:grid sm:w-full sm:grid-cols-6">
            <TabsTrigger
              value="overview"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger
              value="sessions"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Sessões</span>
            </TabsTrigger>
            <TabsTrigger
              value="mfa"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <Key className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">MFA</span>
            </TabsTrigger>
            <TabsTrigger
              value="ip"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <Globe className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">IPs</span>
            </TabsTrigger>
            <TabsTrigger
              value="geo"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <Globe2 className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Geo</span>
            </TabsTrigger>
            <TabsTrigger
              value="alerts"
              className="flex min-h-[44px] items-center gap-1.5 whitespace-nowrap px-3 py-2 sm:gap-2"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-xs sm:text-sm">Alertas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Monitor className="h-5 w-5" />
                  Sessões Recentes
                </CardTitle>
                <CardDescription>Últimas 3 sessões ativas</CardDescription>
              </CardHeader>
              <CardContent>
                <ActiveSessionsList limit={3} compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Recentes
                </CardTitle>
                <CardDescription>Últimos alertas de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityAlertsList limit={3} compact />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Eventos de Segurança
              </CardTitle>
              <CardDescription>Histórico recente de atividades de segurança</CardDescription>
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
              <CardDescription>Gerencie todas as sessões conectadas à sua conta</CardDescription>
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
              <CardDescription>Todos os alertas e notificações de segurança</CardDescription>
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
