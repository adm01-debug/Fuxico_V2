import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Upload, UserX, Mail, AlertTriangle, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useUnsubscribedEmails } from '@/hooks/use-unsubscribed-emails';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function UnsubscribeTab() {
  const { unsubscribedEmails, isLoading, addUnsubscribe, removeUnsubscribe, bulkAddUnsubscribe } = useUnsubscribedEmails();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState({ email: '', reason: '' });
  const [bulkEmails, setBulkEmails] = useState('');

  const handleAddEmail = async () => {
    if (!newEmail.email || !newEmail.email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    await addUnsubscribe.mutateAsync({ email: newEmail.email, reason: newEmail.reason });
    setNewEmail({ email: '', reason: '' });
    setIsAddOpen(false);
  };

  const handleBulkAdd = async () => {
    const emails = bulkEmails
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.includes('@'));

    if (emails.length === 0) {
      toast.error('Nenhum email válido encontrado');
      return;
    }

    await bulkAddUnsubscribe.mutateAsync(emails);
    setBulkEmails('');
    setIsBulkOpen(false);
  };

  const filteredEmails = unsubscribedEmails.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sourceLabels: Record<string, { label: string; color: string }> = {
    manual: { label: 'Manual', color: 'bg-blue-500/10 text-blue-600' },
    link: { label: 'Link', color: 'bg-green-500/10 text-green-600' },
    bounce: { label: 'Bounce', color: 'bg-orange-500/10 text-orange-600' },
    complaint: { label: 'Reclamação', color: 'bg-red-500/10 text-red-600' },
  };

  if (isLoading) {
    return (
      <div role="region" aria-label="UnsubscribeTab" className="space-y-6">
        <Card role="article">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div role="region" aria-label="UnsubscribeTab" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card role="article">
          <CardContent className="p-4 text-center">
            <UserX className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold">{unsubscribedEmails.length}</p>
            <p className="text-xs text-muted-foreground">Total descadastrados</p>
          </CardContent>
        </Card>
        <Card role="article">
          <CardContent className="p-4 text-center">
            <Mail className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">
              {unsubscribedEmails.filter(u => u.source === 'manual').length}
            </p>
            <p className="text-xs text-muted-foreground">Manuais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">
              {unsubscribedEmails.filter(u => u.source === 'bounce').length}
            </p>
            <p className="text-xs text-muted-foreground">Por bounce</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">
              {unsubscribedEmails.filter(u => u.source === 'link').length}
            </p>
            <p className="text-xs text-muted-foreground">Via link</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5" />
                Lista de Exclusão (Unsubscribe)
              </CardTitle>
              <CardDescription>
                Emails que não devem receber comunicações
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Emails em Massa</DialogTitle>
                    <DialogDescription>
                      Cole uma lista de emails (um por linha ou separados por vírgula)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Textarea
                      placeholder="email1@exemplo.com&#10;email2@exemplo.com&#10;email3@exemplo.com"
                      className="min-h-[200px]"
                      value={bulkEmails}
                      onChange={e => setBulkEmails(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {bulkEmails.split(/[\n,;]/).filter(e => e.trim().includes('@')).length} emails válidos detectados
                    </p>
                    <Button
                      onClick={handleBulkAdd}
                      className="w-full"
                      disabled={bulkAddUnsubscribe.isPending}
                    >
                      {bulkAddUnsubscribe.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Importar Emails
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Email à Lista de Exclusão</DialogTitle>
                    <DialogDescription>
                      Este email não receberá mais comunicações
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={newEmail.email}
                        onChange={e => setNewEmail(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo (opcional)</Label>
                      <Input
                        placeholder="Ex: Solicitou remoção por telefone"
                        value={newEmail.reason}
                        onChange={e => setNewEmail(prev => ({ ...prev, reason: e.target.value }))}
                      />
                    </div>
                    <Button
                      onClick={handleAddEmail}
                      className="w-full"
                      disabled={addUnsubscribe.isPending}
                    >
                      {addUnsubscribe.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Adicionar à Lista
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredEmails.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm ? (
                <p>Nenhum email encontrado para "{searchTerm}"</p>
              ) : (
                <>
                  <p>Nenhum email na lista de exclusão.</p>
                  <p className="text-sm">Adicione emails que não devem receber comunicações.</p>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredEmails.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.email}</span>
                        <Badge className={sourceLabels[item.source]?.color || ''}>
                          {sourceLabels[item.source]?.label || item.source}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>
                          {format(new Date(item.unsubscribed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {item.reason && <span>• {item.reason}</span>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeUnsubscribe.mutate(item.id)}
                      disabled={removeUnsubscribe.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Como usar a lista de exclusão</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • <strong>Manual:</strong> Adicione emails manualmente quando um contato solicitar remoção.
          </p>
          <p>
            • <strong>Via Link:</strong> Emails adicionados automaticamente quando o destinatário clica no link de descadastramento.
          </p>
          <p>
            • <strong>Bounce:</strong> Emails inválidos detectados automaticamente.
          </p>
          <p>
            • <strong>Reclamação:</strong> Emails que marcaram sua mensagem como spam.
          </p>
          <p className="pt-2 text-xs">
            💡 Dica: Ao criar um novo rastreamento, verifique se o destinatário não está nesta lista.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default UnsubscribeTab;
