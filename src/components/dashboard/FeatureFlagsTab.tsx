import { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2, Flag, Settings2 } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/use-feature-flags';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useWhitelabel } from '@/hooks/use-whitelabel';
import { Separator } from '@/components/ui/separator';

function FeatureFlagsTabBase() {
  const { flags, isLoading, toggleFlag, createFlag, deleteFlag } = useFeatureFlags();
  const { config: wlConfig, saveConfig: saveWlConfig } = useWhitelabel();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' });
  const [wlForm, setWlForm] = useState({
    custom_domain: wlConfig?.custom_domain || '',
    hide_branding: wlConfig?.hide_branding || false,
    custom_pixel_path: wlConfig?.custom_pixel_path || '/px',
    custom_link_path: wlConfig?.custom_link_path || '/l',
  });

  const handleCreateFlag = async () => {
    if (!newFlag.key || !newFlag.name) return;
    await createFlag.mutateAsync(newFlag);
    setNewFlag({ key: '', name: '', description: '' });
    setIsCreateOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full mb-2" />)}</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Gerencie funcionalidades do sistema de forma dinâmica</CardDescription>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Flag</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Feature Flag</DialogTitle>
                  <DialogDescription>Adicione uma nova flag para controlar funcionalidades</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Chave (slug)</Label>
                    <Input placeholder="ex: new_dashboard" value={newFlag.key}
                      onChange={e => setNewFlag(p => ({ ...p, key: e.target.value.replace(/\s/g, '_').toLowerCase() }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input placeholder="ex: Novo Dashboard" value={newFlag.name}
                      onChange={e => setNewFlag(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input placeholder="Descrição opcional" value={newFlag.description}
                      onChange={e => setNewFlag(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreateFlag} className="w-full" disabled={createFlag.isPending}>
                    {createFlag.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Criar Flag
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <EmptyState type="settings" title="Nenhuma feature flag" description="Crie flags para controlar funcionalidades." />
          ) : (
            <div className="space-y-3">
              {flags.map(flag => (
                <div key={flag.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{flag.name}</span>
                      <Badge variant="outline" className="text-xs font-mono">{flag.key}</Badge>
                      {flag.percentage < 100 && (
                        <Badge variant="secondary" className="text-xs">{flag.percentage}%</Badge>
                      )}
                    </div>
                    {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteFlag.mutate(flag.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <Switch checked={flag.enabled} onCheckedChange={(enabled) => toggleFlag.mutate({ id: flag.id, enabled })} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* White-label Config */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            White-label Tracking
          </CardTitle>
          <CardDescription>Personalize pixels e links de tracking removendo o branding FUXICO</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Domínio Customizado</Label>
              <Input placeholder="track.seudominio.com" value={wlForm.custom_domain}
                onChange={e => setWlForm(p => ({ ...p, custom_domain: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Path do Pixel</Label>
              <Input value={wlForm.custom_pixel_path}
                onChange={e => setWlForm(p => ({ ...p, custom_pixel_path: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Path do Link</Label>
              <Input value={wlForm.custom_link_path}
                onChange={e => setWlForm(p => ({ ...p, custom_link_path: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={wlForm.hide_branding}
                onCheckedChange={v => setWlForm(p => ({ ...p, hide_branding: v }))} />
              <Label>Ocultar branding FUXICO</Label>
            </div>
          </div>
          <Button onClick={() => saveWlConfig.mutate(wlForm)} disabled={saveWlConfig.isPending}>
            {saveWlConfig.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export const FeatureFlagsTab = memo(FeatureFlagsTabBase);
export default FeatureFlagsTab;
