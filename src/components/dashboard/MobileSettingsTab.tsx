// MobileSettingsTab.tsx
import { useEffect } from 'react';
import { useMobileApp } from '@/hooks/use-mobile-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Trash2, Bell } from 'lucide-react';

export function MobileSettingsTab() {
  const { devices, notifications, loadDevices, removeDevice, markAsRead, getAppStoreLinks } = useMobileApp();
  const links = getAppStoreLinks();
  useEffect(() => { loadDevices(); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Smartphone />Mobile App</h2>
      <div className="grid grid-cols-2 gap-4">
        <a href={links.ios} target="_blank" className="block p-4 border rounded text-center hover:bg-muted">
          <img src="/app-store.svg" alt="App Store" className="h-10 mx-auto" />
          <span className="text-sm">Download iOS</span>
        </a>
        <a href={links.android} target="_blank" className="block p-4 border rounded text-center hover:bg-muted">
          <img src="/play-store.svg" alt="Play Store" className="h-10 mx-auto" />
          <span className="text-sm">Download Android</span>
        </a>
      </div>
      <Card>
        <CardHeader><CardTitle>Dispositivos Conectados</CardTitle></CardHeader>
        <CardContent>
          {devices.map(d => (
            <div key={d.id} className="flex justify-between items-center p-3 border rounded mb-2">
              <div className="flex items-center gap-2"><Smartphone className="w-4 h-4" /><span>{d.device_name}</span><Badge>{d.device_type}</Badge></div>
              <Button size="sm" variant="destructive" onClick={() => removeDevice(d.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Notificações Recentes</CardTitle></CardHeader>
        <CardContent>
          {notifications.slice(0, 5).map(n => (
            <div key={n.id} className={`p-3 border rounded mb-2 ${!n.read ? 'bg-muted' : ''}`} onClick={() => markAsRead(n.id)}>
              <div className="flex items-center gap-2"><Bell className="w-4 h-4" /><span className="font-medium">{n.title}</span></div>
              <p className="text-sm text-muted-foreground">{n.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
