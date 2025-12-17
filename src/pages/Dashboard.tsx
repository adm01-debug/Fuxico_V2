import { useState } from "react";
import { useTrackedEmails } from "@/hooks/use-tracking";
import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { EmailTable } from "@/components/dashboard/EmailTable";
import { EmailDetail } from "@/components/dashboard/EmailDetail";
import { CreateTrackingDialog } from "@/components/dashboard/CreateTrackingDialog";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DocumentsTab } from "@/components/dashboard/DocumentsTab";
import { LinksTab } from "@/components/dashboard/LinksTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Eye, MousePointerClick, TrendingUp, RefreshCw, LogOut, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoImg from "@/assets/logo.jpg";

const Dashboard = () => {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const { data, isLoading, refetch, isFetching } = useTrackedEmails();
  const { user, signOut } = useAuth();
  
  // Real-time notifications for email opens
  useRealtimeNotifications();

  const emails = data?.emails || [];
  const totalEmails = emails.length;
  const totalOpens = emails.reduce((sum, e) => sum + (e.opens ?? 0), 0);
  const totalClicks = emails.reduce((sum, e) => sum + (e.clicks ?? 0), 0);
  const openRate = totalEmails > 0 ? Math.round((emails.filter(e => (e.opens ?? 0) > 0).length / totalEmails) * 100) : 0;

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="FUXICO" className="h-10 w-10 rounded-lg object-cover" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">FUXICO</h1>
                <p className="text-sm text-muted-foreground">Saiba quando seus emails são lidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
              <CreateTrackingDialog />
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'Usuário'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="emails" className="space-y-6">
          <TabsList>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Link2 className="h-4 w-4" />
              Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emails" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                <>
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                  ))}
                </>
              ) : (
                <>
                  <StatsCard
                    title="Emails Rastreados"
                    value={totalEmails}
                    subtitle="Total de emails"
                    icon={Mail}
                    variant="primary"
                  />
                  <StatsCard
                    title="Aberturas"
                    value={totalOpens}
                    subtitle={`${openRate}% taxa de abertura`}
                    icon={Eye}
                    variant="success"
                  />
                  <StatsCard
                    title="Cliques"
                    value={totalClicks}
                    subtitle="Total de cliques"
                    icon={MousePointerClick}
                  />
                  <StatsCard
                    title="Taxa de Abertura"
                    value={`${openRate}%`}
                    subtitle="Emails abertos"
                    icon={TrendingUp}
                    variant="warning"
                  />
                </>
              )}
            </div>

            {/* Trend Chart */}
            <TrendChart />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Email List */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-xl border shadow-sm">
                  <div className="p-4 border-b">
                    <h2 className="font-semibold text-foreground">Emails Rastreados</h2>
                    <p className="text-sm text-muted-foreground">Clique em um email para ver detalhes</p>
                  </div>
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : (
                    <EmailTable
                      emails={emails}
                      selectedId={selectedEmailId}
                      onSelect={setSelectedEmailId}
                    />
                  )}
                </div>
              </div>

              {/* Email Detail */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-xl border shadow-sm sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden">
                  {selectedEmailId ? (
                    <EmailDetail
                      trackingId={selectedEmailId}
                      onClose={() => setSelectedEmailId(null)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6">
                      <Mail className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-center">Selecione um email para ver os detalhes de rastreamento</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab />
          </TabsContent>

          <TabsContent value="links">
            <LinksTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
