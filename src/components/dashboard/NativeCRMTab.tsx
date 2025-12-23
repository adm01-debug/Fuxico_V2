import { useState, useEffect } from 'react';
import { useNativeCRM } from '@/hooks/use-native-crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, Upload, Trash2 } from 'lucide-react';

export function NativeCRMTab() {
  const { contacts, lists, loadContacts, loadLists, createContact, deleteContact, createList, importContacts, searchContacts } = useNativeCRM();
  const [search, setSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [filtered, setFiltered] = useState(contacts);

  useEffect(() => { loadContacts(); loadLists(); }, []);
  useEffect(() => { setFiltered(contacts); }, [contacts]);

  const handleSearch = async () => {
    if (search) { const results = await searchContacts(search); setFiltered(results); }
    else setFiltered(contacts);
  };

  const handleAdd = async () => {
    if (!newEmail) return;
    await createContact({ email: newEmail, name: newName });
    setNewEmail(''); setNewName('');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2"><Users />CRM Nativo</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{contacts.length}</div><div className="text-sm text-muted-foreground">Contatos</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{lists.length}</div><div className="text-sm text-muted-foreground">Listas</div></CardContent></Card>
        <Card><CardContent className="pt-4"><div className="text-2xl font-bold">{contacts.reduce((a, c) => a + c.emails_opened, 0)}</div><div className="text-sm text-muted-foreground">Aberturas</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Adicionar Contato</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <Input placeholder="Nome" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Contatos</CardTitle>
          <div className="flex gap-2"><Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" /><Button size="sm" onClick={handleSearch}><Search className="w-4 h-4" /></Button></div>
        </CardHeader>
        <CardContent>
          {filtered.slice(0, 20).map(c => (
            <div key={c.id} className="flex justify-between items-center p-2 border-b">
              <div><span className="font-medium">{c.email}</span>{c.name && <span className="text-muted-foreground ml-2">{c.name}</span>}</div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{c.emails_sent} enviados</Badge>
                <Badge>{c.emails_opened} abertos</Badge>
                <Button size="sm" variant="ghost" onClick={() => deleteContact(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
