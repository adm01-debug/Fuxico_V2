import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  tags: string[];
  notes: string;
  last_contacted?: string;
  emails_sent: number;
  emails_opened: number;
  created_at: string;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string;
  contact_count: number;
  created_at: string;
}

export function useNativeCRM() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadContacts = useCallback(async (listId?: string) => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    let query = supabase.from('crm_contacts').select('*').eq('user_id', user.user.id);
    if (listId) query = query.contains('list_ids', [listId]);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setContacts(data as Contact[]);
  }, []);

  const loadLists = useCallback(async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;
    const { data } = await supabase.from('crm_lists').select('*').eq('user_id', user.user.id);
    if (data) setLists(data as ContactList[]);
  }, []);

  const createContact = useCallback(async (contact: Partial<Contact>): Promise<Contact> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('crm_contacts').insert({ ...contact, user_id: user.user.id, tags: contact.tags || [], emails_sent: 0, emails_opened: 0 }).select().single();
    if (error) throw error;
    toast({ title: 'Contact created' });
    await loadContacts();
    return data as Contact;
  }, [loadContacts, toast]);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>): Promise<void> => {
    await supabase.from('crm_contacts').update(updates).eq('id', id);
    await loadContacts();
  }, [loadContacts]);

  const deleteContact = useCallback(async (id: string): Promise<void> => {
    await supabase.from('crm_contacts').delete().eq('id', id);
    toast({ title: 'Contact deleted' });
    await loadContacts();
  }, [loadContacts, toast]);

  const createList = useCallback(async (name: string, description?: string): Promise<ContactList> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('crm_lists').insert({ name, description, user_id: user.user.id, contact_count: 0 }).select().single();
    if (error) throw error;
    toast({ title: 'List created' });
    await loadLists();
    return data as ContactList;
  }, [loadLists, toast]);

  const addToList = useCallback(async (contactIds: string[], listId: string): Promise<void> => {
    for (const contactId of contactIds) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        const listIds = [...new Set([...(contact as any).list_ids || [], listId])];
        await supabase.from('crm_contacts').update({ list_ids: listIds }).eq('id', contactId);
      }
    }
    await loadContacts();
    toast({ title: `${contactIds.length} contacts added to list` });
  }, [contacts, loadContacts, toast]);

  const importContacts = useCallback(async (csvData: string): Promise<number> => {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIdx = headers.findIndex(h => h.includes('email'));
    const nameIdx = headers.findIndex(h => h.includes('name'));
    if (emailIdx === -1) throw new Error('No email column found');

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values[emailIdx]) {
        await createContact({ email: values[emailIdx], name: nameIdx !== -1 ? values[nameIdx] : undefined });
        imported++;
      }
    }
    return imported;
  }, [createContact]);

  const searchContacts = useCallback(async (query: string): Promise<Contact[]> => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    const { data } = await supabase.from('crm_contacts').select('*').eq('user_id', user.user.id).or(`email.ilike.%${query}%,name.ilike.%${query}%,company.ilike.%${query}%`);
    return data as Contact[] || [];
  }, []);

  return { contacts, lists, isLoading, loadContacts, loadLists, createContact, updateContact, deleteContact, createList, addToList, importContacts, searchContacts };
}
