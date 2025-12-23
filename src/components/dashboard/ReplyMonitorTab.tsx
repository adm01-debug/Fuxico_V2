import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
export function ReplyMonitorTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><MessageCircle />ReplyMonitorTab</h2>
      <Card><CardContent className="pt-6"><p>Componente em desenvolvimento.</p></CardContent></Card>
    </div>
  );
}
