import { BaseCRMAdapter, CRMConfig, CRMContact, CRMDeal, CRMActivity, EmailEvent } from '../types';

export class PipedriveAdapter implements BaseCRMAdapter {
  private config: CRMConfig;
  private apiToken: string;
  private baseUrl = 'https://api.pipedrive.com/v1';

  constructor(config: CRMConfig) {
    this.config = config;
    this.apiToken = config.apiKey || '';
  }

  async connect(): Promise<boolean> {
    return this.testConnection();
  }

  async disconnect(): Promise<void> {}

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/users/me?api_token=${this.apiToken}`);
      return response.ok;
    } catch {
      return false;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${this.baseUrl}${endpoint}${separator}api_token=${this.apiToken}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    const data = await response.json();
    return data.data;
  }

  async getContact(id: string): Promise<CRMContact | null> {
    const data = await this.request(`/persons/${id}`);
    if (!data) return null;
    const email = data.email?.[0]?.value || '';
    return { id: String(data.id), email, firstName: data.first_name, lastName: data.last_name, company: data.org_name, phone: data.phone?.[0]?.value, metadata: data };
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const data = await this.request('/persons', {
      method: 'POST',
      body: JSON.stringify({ name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(), email: contact.email, phone: contact.phone })
    });
    return { id: String(data.id), email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const data = await this.request(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(), email: contact.email })
    });
    return { id, email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const data = await this.request(`/persons/search?term=${encodeURIComponent(query)}&limit=50`);
    return (data?.items || []).map((item: any) => ({
      id: String(item.item.id),
      email: item.item.emails?.[0] || '',
      firstName: item.item.name?.split(' ')[0],
      lastName: item.item.name?.split(' ').slice(1).join(' ')
    }));
  }

  async getDeal(id: string): Promise<CRMDeal | null> {
    const data = await this.request(`/deals/${id}`);
    if (!data) return null;
    return { id: String(data.id), title: data.title, value: data.value, stage: data.stage_id?.toString(), contactId: data.person_id?.toString(), metadata: data };
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const data = await this.request('/deals', {
      method: 'POST',
      body: JSON.stringify({ title: deal.title, value: deal.value, person_id: deal.contactId ? parseInt(deal.contactId) : undefined })
    });
    return { id: String(data.id), title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.request(`/deals/${id}`, { method: 'PUT', body: JSON.stringify({ title: deal.title, value: deal.value }) });
    return { id, title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async createActivity(activity: Partial<CRMActivity>): Promise<CRMActivity> {
    const data = await this.request('/activities', {
      method: 'POST',
      body: JSON.stringify({ subject: activity.subject, note: activity.description, type: 'email', person_id: activity.contactId ? parseInt(activity.contactId) : undefined, done: 1 })
    });
    return { id: String(data.id), type: activity.type || 'email', subject: activity.subject || '', contactId: activity.contactId, createdAt: new Date().toISOString() };
  }

  async syncEmailEvent(event: EmailEvent): Promise<void> {
    await this.createActivity({ type: 'email', subject: `Email ${event.type}: ${event.subject || 'No subject'}`, description: `Email event at ${event.timestamp}`, contactId: event.contactId });
  }
}
