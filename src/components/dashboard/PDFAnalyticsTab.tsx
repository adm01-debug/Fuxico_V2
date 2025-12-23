import { useState, useEffect } from 'react';
import { usePDFAnalytics } from '@/hooks/use-pdf-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Clock, BarChart } from 'lucide-react';

export function PDFAnalyticsTab() {
  const { sessions, getDocumentAnalytics, isLoading } = usePDFAnalytics();
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (selectedDoc) getDocumentAnalytics(selectedDoc).then(setAnalytics);
  }, [selectedDoc]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><FileText />Analytics de PDF</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total Sessões</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tempo Médio</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions.length ? (sessions.reduce((a, s) => a + (s.total_time_seconds || 0), 0) / sessions.length / 60).toFixed(1) : 0} min</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Taxa Conclusão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sessions.length ? (sessions.filter(s => s.completed).length / sessions.length * 100).toFixed(0) : 0}%</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Sessões Recentes</CardTitle></CardHeader>
        <CardContent>
          {sessions.slice(0, 10).map(s => (
            <div key={s.id} className="flex justify-between items-center p-3 border rounded mb-2 cursor-pointer hover:bg-muted" onClick={() => setSelectedDoc(s.document_id)}>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>{s.viewer_email || 'Anônimo'}</span></div>
              <div className="flex items-center gap-4">
                <span className="text-sm flex items-center gap-1"><Eye className="w-3 h-3" />{s.pages_viewed}/{s.total_pages}</span>
                <span className="text-sm flex items-center gap-1"><Clock className="w-3 h-3" />{Math.round((s.total_time_seconds || 0) / 60)}min</span>
                <Badge variant={s.completed ? 'default' : 'secondary'}>{s.completed ? 'Completo' : `${s.completion_percentage}%`}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      {analytics && (
        <Card>
          <CardHeader><CardTitle>Análise por Página</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.pageStats?.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2"><span className="w-16">Pág {p.page}</span>
                  <div className="flex-1 bg-muted rounded-full h-4"><div className="bg-primary h-4 rounded-full" style={{ width: `${Math.min(100, p.avgTime / 60 * 10)}%` }} /></div>
                  <span className="text-sm w-20">{p.avgTime.toFixed(0)}s avg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
