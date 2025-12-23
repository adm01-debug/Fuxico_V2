import { BaseCRMAdapter, CRMConfig, CRMContact, CRMDeal, CRMActivity, EmailEvent } from '../types';

export class ZohoAdapter implements BaseCRMAdapter {
  private config: CRMConfig;
  private accessToken: string | null = null;
  private apiDomain: string = 'https://www.zohoapis.com';

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
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
        if (data.api_domain) this.apiDomain = data.api_domain;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.accessToken) return false;
    const response = await fetch(`${this.apiDomain}/crm/v3/org`, {
      headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}` }
    });
    return response.ok;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) throw new Error('Not connected');
    const response = await fetch(`${this.apiDomain}/crm/v3${endpoint}`, {
      ...options,
      headers: { Authorization: `Zoho-oauthtoken ${this.accessToken}`, 'Content-Type': 'application/json', ...options.headers }
    });
    return response.json();
  }

  async getContact(id: string): Promise<CRMContact | null> {
    const data = await this.request(`/Contacts/${id}`);
    if (!data.data?.[0]) return null;
    const c = data.data[0];
    return { id: c.id, email: c.Email, firstName: c.First_Name, lastName: c.Last_Name, company: c.Account_Name?.name, phone: c.Phone, metadata: c };
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const data = await this.request('/Contacts', {
      method: 'POST',
      body: JSON.stringify({ data: [{ Email: contact.email, First_Name: contact.firstName, Last_Name: contact.lastName }] })
    });
    return { id: data.data[0].details.id, email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    await this.request(`/Contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ data: [{ Email: contact.email, First_Name: contact.firstName, Last_Name: contact.lastName }] })
    });
    return { id, email: contact.email || '', firstName: contact.firstName, lastName: contact.lastName };
  }

  async searchContacts(query: string): Promise<CRMContact[]> {
    const data = await this.request(`/Contacts/search?email=${encodeURIComponent(query)}`);
    return (data.data || []).map((c: any) => ({ id: c.id, email: c.Email, firstName: c.First_Name, lastName: c.Last_Name }));
  }

  async getDeal(id: string): Promise<CRMDeal | null> {
    const data = await this.request(`/Deals/${id}`);
    if (!data.data?.[0]) return null;
    const d = data.data[0];
    return { id: d.id, title: d.Deal_Name, value: d.Amount, stage: d.Stage, contactId: d.Contact_Name?.id, metadata: d };
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const data = await this.request('/Deals', {
      method: 'POST',
      body: JSON.stringify({ data: [{ Deal_Name: deal.title, Amount: deal.value, Stage: deal.stage || 'Qualification' }] })
    });
    return { id: data.data[0].details.id, title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async updateDeal(id: string, deal: Partial<CRMDeal>): Promise<CRMDeal> {
    await this.request(`/Deals/${id}`, { method: 'PUT', body: JSON.stringify({ data: [{ Deal_Name: deal.title, Amount: deal.value, Stage: deal.stage }] }) });
    return { id, title: deal.title || '', value: deal.value, stage: deal.stage };
  }

  async createActivity(activity: Partial<CRMActivity>): Promise<CRMActivity> {
    const data = await this.request('/Tasks', {
      method: 'POST',
      body: JSON.stringify({ data: [{ Subject: activity.subject, Description: activity.description, What_Id: activity.contactId, Status: 'Completed' }] })
    });
    return { id: data.data[0].details.id, type: activity.type || 'task', subject: activity.subject || '', contactId: activity.contactId, createdAt: new Date().toISOString() };
  }

  async syncEmailEvent(event: EmailEvent): Promise<void> {
    await this.createActivity({ type: 'email', subject: `Email ${event.type}: ${event.subject || 'No subject'}`, description: `Event at ${event.timestamp}`, contactId: event.contactId });
  }
}
