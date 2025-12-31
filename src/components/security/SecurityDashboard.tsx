import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Smartphone, Key, AlertTriangle, Monitor, Clock, MapPin, CheckCircle2, XCircle, RefreshCw, Globe, Globe2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SecurityOverviewCards } from './SecurityOverviewCards';
import { ActiveSessionsList } from './ActiveSessionsList';
import { MFASettingsPanel } from './MFASettingsPanel';
import { SecurityAlertsList } from './SecurityAlertsList';
import { SecurityEventsList } from './SecurityEventsList';
import IPWhitelistPanel from './IPWhitelistPanel';
import BlockedIPsPanel from './BlockedIPsPanel';
import GeoWhitelistPanel from './GeoWhitelistPanel';

export function SecurityDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Central de Segurança</h2>
          <p className="text-muted-foreground">
            Gerencie todas as configurações de segurança da sua conta
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Proteção Ativa
        </Badge>
      </div>

      <SecurityOverviewCards />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span className="hidden sm:inline">Sessões</span>
          </TabsTrigger>
          <TabsTrigger value="mfa" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">MFA</span>
          </TabsTrigger>
          <TabsTrigger value="ip" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">IPs</span>
          </TabsTrigger>
          <TabsTrigger value="geo" className="flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            <span className="hidden sm:inline">Geo</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
        </TabsList>

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

        <TabsContent value="alerts">
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
