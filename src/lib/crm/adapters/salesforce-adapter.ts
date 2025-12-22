// =============================================================================
// FUXICO - Salesforce CRM Adapter
// =============================================================================

import { BaseCRMAdapter, CRMContact, CRMDeal, CRMActivity, CRMConfig } from './base-adapter';

export interface SalesforceConfig extends CRMConfig {
  instanceUrl: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class SalesforceAdapter extends BaseCRMAdapter {
  private instanceUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: SalesforceConfig) {
    super(config);
    this.instanceUrl = config.instanceUrl;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const config = this.config as SalesforceConfig;
    const response = await fetch(`${this.instanceUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Salesforce token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    return this.accessToken!;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAccessToken();
    const response = await fetch(`${this.instanceUrl}/services/data/v58.0${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce API error: ${error}`);
    }

    return response.json();
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.apiRequest('/sobjects');
      return true;
    } catch {
      return false;
    }
  }

  async findContact(email: string): Promise<CRMContact | null> {
    try {
      const query = encodeURIComponent(`SELECT Id, FirstName, LastName, Email, Phone, Company FROM Contact WHERE Email = '${email}'`);
      const result = await this.apiRequest(`/query?q=${query}`);
      
      if (result.records && result.records.length > 0) {
        const contact = result.records[0];
        return {
          id: contact.Id,
          email: contact.Email,
          name: `${contact.FirstName || ''} ${contact.LastName || ''}`.trim(),
          phone: contact.Phone,
          company: contact.Company,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const nameParts = (contact.name || '').split(' ');
    const result = await this.apiRequest('/sobjects/Contact', {
      method: 'POST',
      body: JSON.stringify({
        FirstName: nameParts[0] || '',
        LastName: nameParts.slice(1).join(' ') || contact.email?.split('@')[0] || 'Unknown',
        Email: contact.email,
        Phone: contact.phone,
      }),
    });

    return {
      id: result.id,
      email: contact.email!,
      name: contact.name || '',
      phone: contact.phone,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const nameParts = (contact.name || '').split(' ');
    await this.apiRequest(`/sobjects/Contact/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        FirstName: nameParts[0],
        LastName: nameParts.slice(1).join(' '),
        Phone: contact.phone,
      }),
    });

    return { id, ...contact } as CRMContact;
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const result = await this.apiRequest('/sobjects/Opportunity', {
      method: 'POST',
      body: JSON.stringify({
        Name: deal.title,
        Amount: deal.value,
        StageName: deal.stage || 'Prospecting',
        CloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        ContactId: deal.contactId,
      }),
    });

    return {
      id: result.id,
      title: deal.title!,
      value: deal.value,
      stage: deal.stage,
      contactId: deal.contactId,
    };
  }

  async registerActivity(activity: CRMActivity): Promise<string> {
    const result = await this.apiRequest('/sobjects/Task', {
      method: 'POST',
      body: JSON.stringify({
        Subject: activity.subject,
        Description: activity.description,
        WhoId: activity.contactId,
        Type: activity.type === 'email' ? 'Email' : 'Other',
        Status: 'Completed',
        ActivityDate: new Date().toISOString().split('T')[0],
      }),
    });

    return result.id;
  }

  async syncEmailEvent(trackingId: string, eventType: string, metadata: Record<string, any>): Promise<void> {
    const contact = await this.findContact(metadata.recipientEmail);
    if (contact) {
      await this.registerActivity({
        contactId: contact.id,
        type: 'email',
        subject: `Email ${eventType}: ${metadata.subject || 'No subject'}`,
        description: `Email was ${eventType} at ${new Date().toISOString()}`,
      });
    }
  }
}
