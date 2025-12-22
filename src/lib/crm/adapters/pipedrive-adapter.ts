// =============================================================================
// FUXICO - Pipedrive CRM Adapter
// =============================================================================

import { BaseCRMAdapter, CRMContact, CRMDeal, CRMActivity, CRMConfig } from './base-adapter';

export interface PipedriveConfig extends CRMConfig {
  apiToken: string;
  companyDomain: string;
}

export class PipedriveAdapter extends BaseCRMAdapter {
  private baseUrl: string;
  private apiToken: string;

  constructor(config: PipedriveConfig) {
    super(config);
    this.apiToken = config.apiToken;
    this.baseUrl = `https://${config.companyDomain}.pipedrive.com/api/v1`;
  }

  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('api_token', this.apiToken);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pipedrive API error: ${error}`);
    }

    const data = await response.json();
    return data.data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.apiRequest('/users/me');
      return true;
    } catch {
      return false;
    }
  }

  async findContact(email: string): Promise<CRMContact | null> {
    try {
      const results = await this.apiRequest(`/persons/search?term=${encodeURIComponent(email)}&fields=email`);
      
      if (results && results.items && results.items.length > 0) {
        const person = results.items[0].item;
        return {
          id: String(person.id),
          email: person.primary_email || email,
          name: person.name,
          phone: person.phone?.[0]?.value,
          company: person.org_name,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async createContact(contact: Partial<CRMContact>): Promise<CRMContact> {
    const result = await this.apiRequest('/persons', {
      method: 'POST',
      body: JSON.stringify({
        name: contact.name || contact.email?.split('@')[0] || 'Unknown',
        email: [{ value: contact.email, primary: true }],
        phone: contact.phone ? [{ value: contact.phone, primary: true }] : undefined,
      }),
    });

    return {
      id: String(result.id),
      email: contact.email!,
      name: result.name,
      phone: contact.phone,
    };
  }

  async updateContact(id: string, contact: Partial<CRMContact>): Promise<CRMContact> {
    const result = await this.apiRequest(`/persons/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: contact.name,
        phone: contact.phone ? [{ value: contact.phone, primary: true }] : undefined,
      }),
    });

    return {
      id: String(result.id),
      email: contact.email!,
      name: result.name,
      phone: contact.phone,
    };
  }

  async createDeal(deal: Partial<CRMDeal>): Promise<CRMDeal> {
    const result = await this.apiRequest('/deals', {
      method: 'POST',
      body: JSON.stringify({
        title: deal.title,
        value: deal.value,
        person_id: deal.contactId ? parseInt(deal.contactId) : undefined,
        stage_id: 1, // First stage
      }),
    });

    return {
      id: String(result.id),
      title: result.title,
      value: result.value,
      stage: result.stage_id?.toString(),
      contactId: deal.contactId,
    };
  }

  async registerActivity(activity: CRMActivity): Promise<string> {
    const result = await this.apiRequest('/activities', {
      method: 'POST',
      body: JSON.stringify({
        subject: activity.subject,
        note: activity.description,
        person_id: activity.contactId ? parseInt(activity.contactId) : undefined,
        type: activity.type === 'email' ? 'email' : 'task',
        done: true,
        due_date: new Date().toISOString().split('T')[0],
      }),
    });

    return String(result.id);
  }

  async syncEmailEvent(trackingId: string, eventType: string, metadata: Record<string, any>): Promise<void> {
    const contact = await this.findContact(metadata.recipientEmail);
    if (contact) {
      await this.registerActivity({
        contactId: contact.id,
        type: 'email',
        subject: `Email ${eventType}: ${metadata.subject || 'No subject'}`,
        description: `Email was ${eventType} at ${new Date().toISOString()}. Tracking ID: ${trackingId}`,
      });
    }
  }
}
