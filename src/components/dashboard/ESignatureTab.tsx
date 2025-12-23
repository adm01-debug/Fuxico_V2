import { useState, useEffect } from 'react';
import { useESignature } from '@/hooks/use-esignature';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PenTool, Send, FileCheck, Clock, X } from 'lucide-react';

export function ESignatureTab() {
  const { requests, isLoading, loadRequests, createSignatureRequest, cancelRequest, getAuditTrail } = useESignature();
  const [docId, setDocId] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');

  useEffect(() => { loadRequests(); }, []);

  const handleCreate = async () => {
    if (!docId || !signerEmail) return;
    await createSignatureRequest(docId, [{ email: signerEmail, name: signerName }]);
    setDocId(''); setSignerEmail(''); setSignerName('');
  };

  const statusColor = (s: string) => s === 'completed' ? 'default' : s === 'pending' ? 'secondary' : 'destructive';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><PenTool />Assinatura Digital</h2>
      <Card>
        <CardHeader><CardTitle>Nova Solicitação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="ID do Documento" value={docId} onChange={e => setDocId(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Email do assinante" value={signerEmail} onChange={e => setSignerEmail(e.target.value)} />
            <Input placeholder="Nome do assinante" value={signerName} onChange={e => setSignerName(e.target.value)} />
          </div>
          <Button onClick={handleCreate}><Send className="w-4 h-4 mr-2" />Enviar para Assinatura</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Solicitações</CardTitle></CardHeader>
        <CardContent>
          {requests.map(r => (
            <div key={r.id} className="p-4 border rounded mb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2"><FileCheck className="w-4 h-4" /><span className="font-medium">{r.document_id}</span></div>
                <Badge variant={statusColor(r.status)}>{r.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Expira: {new Date(r.expires_at).toLocaleDateString()}</span>
              </div>
              <div className="mt-2 flex gap-2">
                {r.signers?.map((s: any, i: number) => (
                  <Badge key={i} variant={s.status === 'signed' ? 'default' : 'outline'}>{s.signer_email} - {s.status}</Badge>
                ))}
              </div>
              {r.status === 'pending' && <Button size="sm" variant="destructive" className="mt-2" onClick={() => cancelRequest(r.id)}><X className="w-3 h-3 mr-1" />Cancelar</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
