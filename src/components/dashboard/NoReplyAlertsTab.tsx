import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
export function NoReplyAlertsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Bell />NoReplyAlertsTab</h2>
      <Card><CardContent className="pt-6"><p>Componente em desenvolvimento.</p></CardContent></Card>
    </div>
  );
}
