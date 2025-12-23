import { BaseCRMAdapter, CRMConfig, CRMContact, CRMDeal, CRMActivity, EmailEvent } from '../types';

export class SalesforceAdapter implements BaseCRMAdapter {
  private config: CRMConfig;
  private accessToken: string | null = null;
  private instanceUrl: string | null = null;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.config.clientId || '',
          client_secret: this.config.clientSecret || '',
          refresh_token: this.config.refreshToken || ''
        })
      });
      const data = await response.json();
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.instanceUrl = data.instance_url;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
    this.instanceUrl = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.accessToken || !this.instanceUrl) return false;
    const response = await fetch(`${this.instanceUrl}/services/data/v58.0/`, {
      headers: { Authorization: `Bearer ${this.accessToken}` }
    });
    return response.ok;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken || !this.instanceUrl) throw new Error('Not connected');
    const response = await fetch(`${this.instanceUrl}/services/data/v58.0${endpoint}`, {
      ...options,
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', ...options.headers }
    });
    return response.json();
  }

  async getContact(id: string): Promise<CRMContact | null> {
    const data = await this.request(`/sobjects/Contact/${id}`);
    if (!data.Id) return null;
    return { id: data.Id, email: data.Email, firstName: data.FirstName, lastName: data.LastName, company: data.Account?.Name, metadata: data };
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const data = await this.request('/sobjects/Contact', {
      method: 'POST',
      body: JSON.stringify({ Email: contact.email, FirstName: contact.firstName, LastName: contact.lastName })
    });
    return { id: data.id, email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    await this.request(`/sobjects/Contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ Email: contact.email, FirstName: contact.firstName, LastName: contact.lastName })
    });
    return { id, email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const data = await this.request(`/query?q=${encodeURIComponent(`SELECT Id, Email, FirstName, LastName FROM Contact WHERE Email LIKE '%${query}%' OR Name LIKE '%${query}%' LIMIT 50`)}`);
    return (data.records || []).map((r: any) => ({ id: r.Id, email: r.Email, firstName: r.FirstName, lastName: r.LastName }));
  }

  async getDeal(id: string): Promise<CRMDeal | null> {
    const data = await this.request(`/sobjects/Opportunity/${id}`);
    if (!data.Id) return null;
    return { id: data.Id, title: data.Name, value: data.Amount, stage: data.StageName, contactId: data.ContactId, metadata: data };
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const data = await this.request('/sobjects/Opportunity', {
      method: 'POST',
      body: JSON.stringify({ Name: deal.title, Amount: deal.value, StageName: deal.stage || 'Prospecting', CloseDate: new Date().toISOString().split('T')[0] })
    });
    return { id: data.id, title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.request(`/sobjects/Opportunity/${id}`, { method: 'PATCH', body: JSON.stringify({ Name: deal.title, Amount: deal.value, StageName: deal.stage }) });
    return { id, title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async createActivity(activity: Partial<CRMActivity>): Promise<CRMActivity> {
    const data = await this.request('/sobjects/Task', {
      method: 'POST',
      body: JSON.stringify({ Subject: activity.subject, Description: activity.description, WhoId: activity.contactId, Status: 'Completed', Priority: 'Normal' })
    });
    return { id: data.id, type: activity.type || 'task', subject: activity.subject || '', contactId: activity.contactId, createdAt: new Date().toISOString() };
  }

  async syncEmailEvent(event: EmailEvent): Promise<void> {
    await this.createActivity({ type: 'email', subject: `Email ${event.type}: ${event.subject || 'No subject'}`, description: `Email ${event.type} event at ${event.timestamp}`, contactId: event.contactId });
  }
}
