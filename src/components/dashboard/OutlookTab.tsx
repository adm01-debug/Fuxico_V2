import { useEffect } from 'react';
import { useOutlook } from '@/hooks/use-outlook';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Mail, Link2, Unlink } from 'lucide-react';

export function OutlookTab() {
  const { connection, loadConnection, connectOutlook, disconnectOutlook, updateSettings, getInstallInstructions } = useOutlook();
  const instructions = getInstallInstructions();
  useEffect(() => { loadConnection(); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Mail />Outlook Add-in</h2>
      <Card>
        <CardHeader><CardTitle>Conexão</CardTitle></CardHeader>
        <CardContent>
          {connection?.is_connected ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div><span className="font-medium">{connection.email}</span><Badge className="ml-2" variant="default">Conectado</Badge></div>
                <Button variant="destructive" onClick={disconnectOutlook}><Unlink className="w-4 h-4 mr-2" />Desconectar</Button>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center"><span>Rastreamento automático</span><Switch checked={connection.settings.auto_track} onCheckedChange={v => updateSettings({ auto_track: v })} /></div>
                <div className="flex justify-between items-center"><span>Pixel invisível</span><Switch checked={connection.settings.invisible_tracker} onCheckedChange={v => updateSettings({ invisible_tracker: v })} /></div>
                <div className="flex justify-between items-center"><span>Notificações</span><Switch checked={connection.settings.notifications} onCheckedChange={v => updateSettings({ notifications: v })} /></div>
              </div>
            </div>
          ) : (
            <Button onClick={connectOutlook}><Link2 className="w-4 h-4 mr-2" />Conectar Outlook</Button>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Instalação do Add-in</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            {instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
