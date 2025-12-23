// CustomDomainTab.tsx
import { useEffect } from 'react';
import { useCustomDomain } from '@/hooks/hooks-high-priority';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Check, X, Copy } from 'lucide-react';
import { useState } from 'react';

export function CustomDomainTab() {
  const { domain, loadDomain, addDomain, verifyDomain, getDNSInstructions } = useCustomDomain();
  const [newDomain, setNewDomain] = useState('');
  const dns = getDNSInstructions();
  useEffect(() => { loadDomain(); }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Globe />Domínio Personalizado</h2>
      {!domain ? (
        <Card><CardHeader><CardTitle>Adicionar Domínio</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input placeholder="track.seudominio.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} />
            <Button onClick={() => addDomain(newDomain)}>Adicionar</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card><CardHeader><CardTitle>Seu Domínio</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="font-mono">{domain.domain}</span>
                <Badge variant={domain.verified ? 'default' : 'secondary'}>{domain.verified ? <><Check className="w-3 h-3 mr-1" />Verificado</> : 'Pendente'}</Badge>
              </div>
              {!domain.verified && <Button className="mt-4" onClick={verifyDomain}>Verificar DNS</Button>}
            </CardContent>
          </Card>
          {!domain.verified && dns.length > 0 && (
            <Card><CardHeader><CardTitle>Configuração DNS</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left p-2">Tipo</th><th className="text-left p-2">Nome</th><th className="text-left p-2">Valor</th></tr></thead>
                  <tbody>{dns.map((d, i) => <tr key={i} className="border-b"><td className="p-2">{d.type}</td><td className="p-2 font-mono">{d.name}</td><td className="p-2 font-mono">{d.value}</td></tr>)}</tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// PDFSecureTab.tsx
export function PDFSecureTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Compartilhamento Seguro de PDF</h2>
      <Card><CardContent className="pt-6"><p>Configure opções de segurança para seus PDFs compartilhados.</p></CardContent></Card>
    </div>
  );
}

// DeliveryCertificatesTab.tsx
export function DeliveryCertificatesTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Certificados de Entrega</h2>
      <Card><CardContent className="pt-6"><p>Gere certificados de entrega para seus emails rastreados.</p></CardContent></Card>
    </div>
  );
}

// NoReplyAlertsTab.tsx  
export function NoReplyAlertsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Alertas de Não-Resposta</h2>
      <Card><CardContent className="pt-6"><p>Configure alertas para emails sem resposta após 24h, 48h ou 72h.</p></CardContent></Card>
    </div>
  );
}

// HotConversationsTab.tsx
export function HotConversationsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Conversas Quentes</h2>
      <Card><CardContent className="pt-6"><p>Veja emails com alto engajamento e revivals.</p></CardContent></Card>
    </div>
  );
}
