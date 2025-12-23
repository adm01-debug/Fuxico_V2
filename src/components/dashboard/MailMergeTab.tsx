import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMailMerge } from '@/hooks/use-mail-merge';
import { FileSpreadsheet, Send, Plus, Users, CheckCircle, XCircle, Clock, Play, Pause } from 'lucide-react';

export function MailMergeTab() {
  const { isLoading, campaigns, templates, createCampaign, sendCampaign, saveTemplate, loadCampaigns, loadTemplates } = useMailMerge();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', templateId: '', sheetUrl: '', emailColumn: 'email' });
  const [newTemplate, setNewTemplate] = useState({ name: '', subject: '', body: '', fields: [] as any[] });

  useEffect(() => { loadCampaigns(); loadTemplates(); }, [loadCampaigns, loadTemplates]);

  const handleCreateCampaign = async () => {
    await createCampaign(newCampaign.name, newCampaign.templateId, newCampaign.sheetUrl, newCampaign.emailColumn);
    setShowNewCampaign(false);
    setNewCampaign({ name: '', templateId: '', sheetUrl: '', emailColumn: 'email' });
  };

  const handleSaveTemplate = async () => {
    await saveTemplate({ name: newTemplate.name, subject: newTemplate.subject, body: newTemplate.body, fields: newTemplate.fields });
    setShowNewTemplate(false);
    setNewTemplate({ name: '', subject: '', body: '', fields: [] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileSpreadsheet className="h-6 w-6" /> Mail Merge</h2>
          <p className="text-muted-foreground">Send personalized emails using Google Sheets data</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showNewTemplate} onOpenChange={setShowNewTemplate}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> New Template</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Create Email Template</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Template Name</Label><Input value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="Welcome Email" /></div>
                <div><Label>Subject Line</Label><Input value={newTemplate.subject} onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })} placeholder="Hello {{name}}, welcome to..." /></div>
                <div><Label>Email Body</Label><Textarea rows={8} value={newTemplate.body} onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })} placeholder="Dear {{name}},&#10;&#10;Thank you for..." /></div>
                <p className="text-sm text-muted-foreground">Use {"{{field_name}}"} to insert merge fields from your spreadsheet</p>
                <Button onClick={handleSaveTemplate} disabled={isLoading}>Save Template</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Campaign</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Mail Merge Campaign</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Campaign Name</Label><Input value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Q1 Outreach" /></div>
                <div><Label>Template</Label>
                  <select className="w-full p-2 border rounded" value={newCampaign.templateId} onChange={(e) => setNewCampaign({ ...newCampaign, templateId: e.target.value })}>
                    <option value="">Select template...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div><Label>Google Sheet URL</Label><Input value={newCampaign.sheetUrl} onChange={(e) => setNewCampaign({ ...newCampaign, sheetUrl: e.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." /></div>
                <div><Label>Email Column Name</Label><Input value={newCampaign.emailColumn} onChange={(e) => setNewCampaign({ ...newCampaign, emailColumn: e.target.value })} placeholder="email" /></div>
                <Button onClick={handleCreateCampaign} disabled={isLoading}>Create Campaign</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="templates">Templates</TabsTrigger></TabsList>
        <TabsContent value="campaigns">
          <Card>
            <CardHeader><CardTitle>Your Campaigns</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Name</TableHead><TableHead>Recipients</TableHead><TableHead>Status</TableHead><TableHead>Sent</TableHead><TableHead>Failed</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell><Badge variant="secondary"><Users className="h-3 w-3 mr-1" />{campaign.recipients.length}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={campaign.status === 'completed' ? 'default' : campaign.status === 'sending' ? 'secondary' : 'outline'}>
                          {campaign.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {campaign.status === 'sending' && <Clock className="h-3 w-3 mr-1" />}
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600">{campaign.sent_count}</TableCell>
                      <TableCell className="text-red-600">{campaign.failed_count}</TableCell>
                      <TableCell>
                        {campaign.status === 'draft' && <Button size="sm" onClick={() => sendCampaign(campaign.id)}><Play className="h-4 w-4 mr-1" /> Send</Button>}
                        {campaign.status === 'sending' && <Button size="sm" variant="outline"><Pause className="h-4 w-4 mr-1" /> Pause</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaigns.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No campaigns yet. Create your first one!</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader><CardTitle className="text-lg">{template.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">Subject: {template.subject}</p>
                  <p className="text-sm line-clamp-3">{template.body}</p>
                </CardContent>
              </Card>
            ))}
            {templates.length === 0 && <Card className="col-span-full"><CardContent className="text-center py-8 text-muted-foreground">No templates yet. Create your first one!</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
