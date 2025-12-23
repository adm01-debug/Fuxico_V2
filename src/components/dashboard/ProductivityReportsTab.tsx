// ProductivityReportsTab.tsx
import { useState } from 'react';
import { useProductivityReports } from '@/hooks/use-productivity-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, TrendingUp, Clock, Mail } from 'lucide-react';

export function ProductivityReportsTab() {
  const { report, isLoading, generateReport } = useProductivityReports();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart />Relatórios de Produtividade</h2>
        <div className="flex gap-2">
          <Select value={period} onValueChange={v => setPeriod(v as any)}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="daily">Diário</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensal</SelectItem></SelectContent>
          </Select>
          <Button onClick={() => generateReport(period)} disabled={isLoading}>Gerar</Button>
        </div>
      </div>
      {report && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><Mail className="w-8 h-8 text-primary mb-2" /><div className="text-2xl font-bold">{report.emails_sent}</div><div className="text-sm">Enviados</div></CardContent></Card>
            <Card><CardContent className="pt-4"><TrendingUp className="w-8 h-8 text-green-500 mb-2" /><div className="text-2xl font-bold">{report.open_rate.toFixed(1)}%</div><div className="text-sm">Taxa Abertura</div></CardContent></Card>
            <Card><CardContent className="pt-4"><TrendingUp className="w-8 h-8 text-blue-500 mb-2" /><div className="text-2xl font-bold">{report.click_rate.toFixed(1)}%</div><div className="text-sm">Taxa Clique</div></CardContent></Card>
            <Card><CardContent className="pt-4"><Clock className="w-8 h-8 text-orange-500 mb-2" /><div className="text-2xl font-bold">{report.best_send_time.hour}h</div><div className="text-sm">Melhor Hora</div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle>Top Destinatários</CardTitle></CardHeader><CardContent>
            {report.top_recipients.map((r, i) => <div key={i} className="flex justify-between p-2 border-b"><span>{r.email}</span><span className="font-medium">{r.opens} aberturas</span></div>)}
          </CardContent></Card>
        </>
      )}
    </div>
  );
}
