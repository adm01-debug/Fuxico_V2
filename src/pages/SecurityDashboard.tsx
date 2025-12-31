import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key, 
  Users, 
  Activity, 
  AlertTriangle, 
  Lock,
  Globe,
  Clock,
  ArrowLeft
} from 'lucide-react';
import BlockedIPsPanel from '@/components/security/BlockedIPsPanel';
import IPWhitelistPanel from '@/components/security/IPWhitelistPanel';
import RateLimitDashboard from '@/components/security/RateLimitDashboard';
import SecurityEventsPanel from '@/components/security/SecurityEventsPanel';
import ActiveSessionsPanel from '@/components/security/ActiveSessionsPanel';
import LoginAttemptsPanel from '@/components/security/LoginAttemptsPanel';

export default function SecurityDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Central de Segurança</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie a segurança do sistema
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Ativo</p>
                  <p className="text-xs text-muted-foreground">MFA Status</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Sessões Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">IPs Bloqueados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Eventos Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
            <TabsTrigger value="blocked-ips">IPs Bloqueados</TabsTrigger>
            <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Security Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/2fa')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Autenticação 2FA</CardTitle>
                      <CardDescription>Configure MFA para sua conta</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/roles')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Roles e Permissões</CardTitle>
                      <CardDescription>Gerencie controle de acesso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate('/reset-password')}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Alterar Senha</CardTitle>
                      <CardDescription>Atualize sua senha de acesso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Recent Events */}
            <SecurityEventsPanel limit={10} />

            {/* Login Attempts */}
            <LoginAttemptsPanel limit={5} />
          </TabsContent>

          <TabsContent value="rate-limits">
            <RateLimitDashboard />
          </TabsContent>

          <TabsContent value="blocked-ips">
            <BlockedIPsPanel />
          </TabsContent>

          <TabsContent value="whitelist">
            <IPWhitelistPanel />
          </TabsContent>

          <TabsContent value="sessions">
            <ActiveSessionsPanel />
          </TabsContent>

          <TabsContent value="events">
            <SecurityEventsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
